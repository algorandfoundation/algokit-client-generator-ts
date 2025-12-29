import { GeneratorContext } from './generator-context'
import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, indent, inline, jsDoc, NewLine } from '../output/writer'
import { argTypeIsTransaction, ABITransactionType } from '@algorandfoundation/algokit-utils/abi'
import { Sanitizer } from '../util/sanitization'
import { Expand } from '@algorandfoundation/algokit-utils/types/expand'
import { containsNonVoidMethod } from './helpers/contains-non-void-method'
import { AbiMethodClientContext, StorageKeyContext, StorageMapContext } from './app-client-context'

function getMethodMetadata(method: AbiMethodClientContext) {
  const methodSig = method.signature
  const uniqueName = method.uniqueName.original

  let hasAppCallArgToTheRight = false
  const argsMeta = new Array<Expand<Omit<(typeof method.args)[0], 'name'> & { name: string; isOptional: boolean; tsType: string }>>()

  for (let i = (method.args ?? []).length - 1; i >= 0; i--) {
    const arg = method.args[i]

    argsMeta.push({
      ...arg,
      name: arg.name?.original ?? `arg${i + 1}`,
      isOptional: !!arg.defaultValue || (hasAppCallArgToTheRight && argTypeIsTransaction(arg.type)),
      tsType: arg.tsInType,
    })

    if (
      !hasAppCallArgToTheRight &&
      argTypeIsTransaction(arg.type) &&
      [ABITransactionType.AppCall, ABITransactionType.Txn].includes(arg.type)
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
  for (const method of app.abiMethods) {
    const { methodSig, argsMeta } = getMethodMetadata(method)
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
  for (const method of app.abiMethods) {
    const { methodSig, argsMeta } = getMethodMetadata(method)
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
  for (const method of app.abiMethods) {
    const { methodSig } = getMethodMetadata(method)
    yield* inline(`'${ctx.sanitizer.makeSafeStringTypeLiteral(methodSig)}': ${method.returns.tsOutType}`)
  }
  yield DecIndentAndCloseBlock
  yield NewLine

  yield* jsDoc(`Defines the types of available calls and state of the ${name} smart contract.`)
  yield `export type ${name}Types = {`
  yield IncIndent
  yield* jsDoc('Maps method signatures / names to their argument and return types.')
  if (app.abiMethods.length == 0) {
    yield 'methods: {}'
  } else {
    yield 'methods:'
  }
  yield IncIndent
  for (const method of app.abiMethods) {
    const { methodSig } = getMethodMetadata(method)
    yield `& Record<'${ctx.sanitizer.makeSafeStringTypeLiteral(methodSig)}'${method.baseNameIsUnique ? ` | '${method.name.makeSafeStringTypeLiteral}'` : ''}, {`
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

  yield* inline(`
  /**
   * Defines the possible abi call signatures.
   */
  export type ${name}Signatures = keyof ${name}Types['methods']`)

  if (containsNonVoidMethod(app.methods)) {
    yield* inline(`
  /**
   * Defines the possible abi call signatures for methods that return a non-void value.
   */
  export type ${name}NonVoidMethodSignatures = keyof ${name}Types['methods'] extends infer T ? T extends keyof ${name}Types['methods'] ? MethodReturn<T> extends void ? never : T  : never : never`)
  }

  yield `
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

function* structTypes(ctx: GeneratorContext): DocumentParts {
  const { app, sanitizer } = ctx
  if (Object.keys(app.structs).length === 0) return

  yield '// Type definitions for ARC-56 structs'
  yield NewLine

  for (const [structName, structCtx] of Object.entries(app.structs)) {
    // Emit the struct type
    yield `export type ${sanitizer.makeSafeTypeIdentifier(structName)} = ${structCtx.tsObjDef}`
    yield NewLine

    // Emit method that converts ABI tuple to the struct object
    yield* jsDoc(`Converts the ABI tuple representation of a ${structName} to the struct representation`)
    yield* inline(`export function ${sanitizer.makeSafeTypeIdentifier(structName)}FromTuple(`, `abiTuple: ${structCtx.tsTupDef}`, `) {`)
    yield* indent(`const abiStructType = ABIStructType.fromStruct('${structName}', APP_SPEC.structs)`)
    yield* indent(`return getStructValueFromTupleValue(abiStructType, abiTuple) as ${sanitizer.makeSafeTypeIdentifier(structName)}`)
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

  for (const [name, def] of Object.entries(ctx.app.templateVariables ?? {})) {
    yield `${name}: ${def.type.tsInType},`
  }

  yield DecIndentAndCloseBlock
  yield NewLine
}

function* keysAndMaps(
  sanitizer: Sanitizer,
  keys: {
    [name: string]: StorageKeyContext
  },
  maps: {
    [name: string]: StorageMapContext
  },
): DocumentParts {
  if (keys && Object.keys(keys).length) {
    yield 'keys: {'
    yield IncIndent
    for (const [name, prop] of Object.entries(keys)) {
      if (prop.desc) {
        yield* jsDoc(prop.desc)
      }
      const keySafe = sanitizer.makeSafePropertyIdentifier(name)
      prop.valueType
      yield `${keySafe}: ${prop.valueType.isAvmBytes ? 'BinaryState' : prop.valueType.tsOutType}`
    }
    yield DecIndentAndCloseBlock
  } else {
    yield 'keys: {}'
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

      yield `${keySafe}: Map<${prop.keyType.tsInType}, ${prop.valueType.tsOutType}>`
    }
    yield DecIndentAndCloseBlock
  } else {
    yield 'maps: {}'
  }
}

function* appState(
  { app, sanitizer }: GeneratorContext,
  stateFlags: { hasLocal: boolean; hasGlobal: boolean; hasBox: boolean },
): DocumentParts {
  const { hasBox, hasGlobal, hasLocal } = stateFlags

  if (hasLocal || hasGlobal || hasBox) {
    yield* jsDoc('Defines the shape of the state of the application.')
    yield 'state: {'
    yield IncIndent
    if (hasGlobal) {
      yield 'global: {'
      yield IncIndent
      yield* keysAndMaps(sanitizer, app.state.keys.global, app.state.maps.global)
      yield DecIndentAndCloseBlock
    }
    if (hasLocal) {
      yield 'local: {'
      yield IncIndent
      yield* keysAndMaps(sanitizer, app.state.keys.local, app.state.maps.local)
      yield DecIndentAndCloseBlock
    }
    if (hasBox) {
      yield 'box: {'
      yield IncIndent
      yield* keysAndMaps(sanitizer, app.state.keys.box, app.state.maps.box)
      yield DecIndentAndCloseBlock
    }
    yield DecIndentAndCloseBlock
  }
}
