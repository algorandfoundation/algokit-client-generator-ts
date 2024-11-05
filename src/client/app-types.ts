import { GeneratorContext } from './generator-context'
import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, indent, inline, jsDoc, NewLine } from '../output/writer'
import { getEquivalentType } from './helpers/get-equivalent-type'
import algosdk, { ABIMethod } from 'algosdk'
import { Arc56Contract, Method, StorageKey, StorageMap, StructField } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { Sanitizer } from '../util/sanitization'
import { Expand } from '@algorandfoundation/algokit-utils/types/expand'

function getMethodMetadata(method: Method, ctx: GeneratorContext) {
  const { methodSignatureToUniqueName } = ctx
  const methodSig = new ABIMethod(method).getSignature()
  const uniqueName = methodSignatureToUniqueName[methodSig]

  let hasAppCallArgToTheRight = false
  const argsMeta = new Array<Expand<Omit<(typeof method.args)[0], 'name'> & { name: string; isOptional: boolean; tsType: string }>>()

  for (let i = (method.args ?? []).length - 1; i >= 0; i--) {
    const arg = method.args[i]

    argsMeta.push({
      ...arg,
      name: arg.name ?? `arg${i + 1}`,
      isOptional: !!arg.defaultValue || hasAppCallArgToTheRight,
      tsType: getEquivalentType(arg.struct ?? arg.type, 'input', ctx),
    })

    if (
      !hasAppCallArgToTheRight &&
      algosdk.abiTypeIsTransaction(arg.type) &&
      [algosdk.ABITransactionType.appl, algosdk.ABITransactionType.any].includes(arg.type)
    ) {
      hasAppCallArgToTheRight = true
    }
  }
  argsMeta.reverse()

  return { methodSig, uniqueName, argsMeta }
}

export function* appTypes(ctx: GeneratorContext): DocumentParts {
  yield* structTypes(ctx)
  yield* templateVariableTypes(ctx)

  const { app, name } = ctx

  yield* jsDoc(`The argument types for the ${name} contract`)
  yield `export type ${name}Args = {`
  yield IncIndent
  yield* jsDoc('The object representation of the arguments for each method')
  yield 'obj: {'
  yield IncIndent
  for (const method of app.methods) {
    const { methodSig, argsMeta } = getMethodMetadata(method, ctx)
    if (argsMeta.length) {
      yield `'${ctx.sanitizer.makeSafeStringTypeLiteral(methodSig)}': {`
      yield IncIndent
      for (const arg of argsMeta) {
        if (arg.desc) yield* jsDoc(arg.desc)
        yield `${ctx.sanitizer.makeSafePropertyIdentifier(arg.name)}${arg.isOptional ? '?' : ''}: ${arg.tsType}`
      }
      yield DecIndentAndCloseBlock
    } else {
      yield `'${ctx.sanitizer.makeSafeStringTypeLiteral(methodSig)}': Record<string, never>`
    }
  }
  yield DecIndentAndCloseBlock

  yield* jsDoc('The tuple representation of the arguments for each method')
  yield 'tuple: {'
  yield IncIndent
  for (const method of app.methods) {
    const { methodSig, argsMeta } = getMethodMetadata(method, ctx)
    yield* inline(
      `'${ctx.sanitizer.makeSafeStringTypeLiteral(methodSig)}': [`,
      argsMeta
        .map((arg) => `${ctx.sanitizer.makeSafeVariableIdentifier(arg.name)}: ${arg.tsType}${arg.isOptional ? ' | undefined' : ''}`)
        .join(', '),
      ']',
    )
  }
  yield DecIndentAndCloseBlock

  yield DecIndentAndCloseBlock
  yield NewLine

  yield* jsDoc('The return type for each method')
  yield `export type ${name}Returns = {`
  yield IncIndent
  for (const method of app.methods) {
    const { methodSig } = getMethodMetadata(method, ctx)
    yield* inline(
      `'${ctx.sanitizer.makeSafeStringTypeLiteral(methodSig)}': ${getEquivalentType(method.returns.struct ?? method.returns.type ?? 'void', 'output', ctx)}`,
    )
  }
  yield DecIndentAndCloseBlock
  yield NewLine

  yield* jsDoc(`Defines the types of available calls and state of the ${name} smart contract.`)
  yield `export type ${name}Types = {`
  yield IncIndent
  yield* jsDoc('Maps method signatures / names to their argument and return types.')
  if (app.methods.length == 0) {
    yield 'methods: {}'
  } else {
    yield 'methods:'
  }
  yield IncIndent
  for (const method of app.methods) {
    const { methodSig, uniqueName } = getMethodMetadata(method, ctx)
    yield `& Record<'${ctx.sanitizer.makeSafeStringTypeLiteral(methodSig)}'${methodSig !== uniqueName ? ` | '${ctx.sanitizer.makeSafeStringTypeLiteral(uniqueName)}'` : ''}, {`
    yield IncIndent
    yield `argsObj: ${name}Args['obj']['${ctx.sanitizer.makeSafeStringTypeLiteral(methodSig)}']`
    yield `argsTuple: ${name}Args['tuple']['${ctx.sanitizer.makeSafeStringTypeLiteral(methodSig)}']`

    if (method.returns.desc) yield* jsDoc(method.returns.desc)
    yield `returns: ${name}Returns['${ctx.sanitizer.makeSafeStringTypeLiteral(methodSig)}']`

    yield DecIndent
    yield '}>'
  }
  yield DecIndent

  const hasLocal =
    (app.state.keys.local && Object.keys(app.state.keys.local).length > 0) ||
    (app.state.maps.local && Object.keys(app.state.maps.local).length > 0)
  const hasGlobal =
    (app.state.keys.global && Object.keys(app.state.keys.global).length > 0) ||
    (app.state.maps.global && Object.keys(app.state.maps.global).length > 0)
  const hasBox =
    (app.state.keys.box && Object.keys(app.state.keys.box).length > 0) || (app.state.maps.box && Object.keys(app.state.maps.box).length > 0)
  yield* appState(ctx, { hasBox, hasGlobal, hasLocal })

  yield DecIndentAndCloseBlock
  yield NewLine

  yield `
  /**
   * Defines the possible abi call signatures.
   */
  export type ${name}Signatures = keyof ${name}Types['methods']
  /**
   * Defines the possible abi call signatures for methods that return a non-void value.
   */
  export type ${name}NonVoidMethodSignatures = keyof ${name}Types['methods'] extends infer T ? T extends keyof ${name}Types['methods'] ? MethodReturn<T> extends void ? never : T  : never : never
  /**
   * Defines an object containing all relevant parameters for a single call to the contract.
   */
  export type CallParams<TArgs> = Expand<
    Omit<AppClientMethodCallParams, 'method' | 'args' | 'onComplete'> &
      {
        /** The args for the ABI method call, either as an ordered array or an object */
        args: Expand<TArgs>
      }
  >
  /**
   * Maps a method signature from the ${name} smart contract to the method's arguments in either tuple or struct form
   */
  export type MethodArgs<TSignature extends ${name}Signatures> = ${name}Types['methods'][TSignature]['argsObj' | 'argsTuple']
  /**
   * Maps a method signature from the ${name} smart contract to the method's return type
   */
  export type MethodReturn<TSignature extends ${name}Signatures> = ${name}Types['methods'][TSignature]['returns']
  `

  if (hasGlobal) {
    yield `
      /**
       * Defines the shape of the keyed global state of the application.
       */
      export type GlobalKeysState = ${name}Types['state']['global']['keys']
    `
  }

  if (hasLocal) {
    yield `
      /**
       * Defines the shape of the keyed local state of the application.
       */
      export type LocalKeysState = ${name}Types['state']['local']['keys']
    `
  }

  if (hasBox) {
    yield `
      /**
       * Defines the shape of the keyed box state of the application.
       */
      export type BoxKeysState = ${name}Types['state']['box']['keys']
    `
  }

  yield NewLine
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function getStructAsObject(struct: StructField[], ctx: GeneratorContext): Record<string, any> {
  return Object.fromEntries(
    struct.map((s) => [s.name, typeof s.type === 'string' ? getEquivalentType(s.type, 'output', ctx) : getStructAsObject(s.type, ctx)]),
  )
}

function getStructAsTupleTypes(struct: StructField[], ctx: GeneratorContext): string {
  return `[${struct.map((s) => (Array.isArray(s.type) ? getStructAsTupleTypes(s.type, ctx) : getEquivalentType(s.type, 'output', ctx))).join(', ')}]`
}

function* structTypes(ctx: GeneratorContext): DocumentParts {
  const { app, sanitizer } = ctx
  if (Object.keys(app.structs).length === 0) return

  yield '// Type definitions for ARC-56 structs'
  yield NewLine

  for (const structName of Object.keys(app.structs)) {
    // Emit the struct type

    yield `export type ${sanitizer.makeSafeTypeIdentifier(structName)} = ${JSON.stringify(getStructAsObject(app.structs[structName], ctx), null, 2).replace(/"/g, '')}`
    yield NewLine

    // Emit method that converts ABI tuple to the struct object
    yield* jsDoc(`Converts the ABI tuple representation of a ${structName} to the struct representation`)
    yield* inline(
      `export function ${sanitizer.makeSafeTypeIdentifier(structName)}FromTuple(`,
      `abiTuple: ${getStructAsTupleTypes(app.structs[structName], ctx)}`,
      `) {`,
    )
    yield* indent(
      `return getABIStructFromABITuple(abiTuple, APP_SPEC.structs${sanitizer.getSafeMemberAccessor(structName)}, APP_SPEC.structs) as ${sanitizer.makeSafeTypeIdentifier(structName)}`,
    )
    yield '}'
    yield NewLine
  }
}

function* templateVariableTypes(ctx: GeneratorContext): DocumentParts {
  if (Object.keys(ctx.app.templateVariables ?? {}).length === 0) {
    return
  }

  yield* jsDoc('Deploy-time template variables')
  yield 'export type TemplateVariables = {'
  yield IncIndent

  for (const name of Object.keys(ctx.app.templateVariables ?? {})) {
    yield `${name}: ${getEquivalentType(ctx.app.templateVariables![name].type, 'output', ctx)},`
  }

  yield DecIndentAndCloseBlock
  yield NewLine
}

function* keysAndMaps(
  app: Arc56Contract,
  sanitizer: Sanitizer,
  keys: {
    [name: string]: StorageKey
  },
  maps: {
    [name: string]: StorageMap
  },
): DocumentParts {
  if (keys && Object.keys(keys).length) {
    yield 'keys: {'
    yield IncIndent
    for (const name of Object.keys(keys)) {
      const prop = keys[name]
      if (prop.desc) {
        yield* jsDoc(prop.desc)
      }
      const keySafe = sanitizer.makeSafePropertyIdentifier(name)

      yield `${keySafe}: ${prop.valueType === 'AVMBytes' ? 'BinaryState' : getEquivalentType(prop.valueType, 'output', { app, sanitizer })}`
    }
    yield DecIndentAndCloseBlock
  }

  if (maps && Object.keys(maps).length) {
    yield 'maps: {'
    yield IncIndent
    for (const name of Object.keys(maps)) {
      const prop = maps[name]
      if (prop.desc) {
        yield* jsDoc(prop.desc)
      }
      const keySafe = sanitizer.makeSafePropertyIdentifier(name)

      yield `${keySafe}: Map<${getEquivalentType(prop.keyType, 'input', { app, sanitizer })}, ${getEquivalentType(prop.valueType, 'output', { app, sanitizer })}>`
    }
    yield DecIndentAndCloseBlock
  }
}

function* appState(
  { app, sanitizer }: GeneratorContext,
  stateFlags: { hasLocal: boolean; hasGlobal: boolean; hasBox: boolean },
): DocumentParts {
  const { hasBox, hasGlobal, hasLocal } = stateFlags

  if (hasLocal || hasGlobal) {
    yield* jsDoc('Defines the shape of the state of the application.')
    yield 'state: {'
    yield IncIndent
    if (hasGlobal) {
      yield 'global: {'
      yield IncIndent
      yield* keysAndMaps(app, sanitizer, app.state.keys.global, app.state.maps.global)
      yield DecIndentAndCloseBlock
    }
    if (hasLocal) {
      yield 'local: {'
      yield IncIndent
      yield* keysAndMaps(app, sanitizer, app.state.keys.local, app.state.maps.local)
      yield DecIndentAndCloseBlock
    }
    if (hasBox) {
      yield 'box: {'
      yield IncIndent
      yield* keysAndMaps(app, sanitizer, app.state.keys.box, app.state.maps.box)
      yield DecIndentAndCloseBlock
    }
    yield DecIndentAndCloseBlock
  }
}
