import { GeneratorContext } from './generator-context'
import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, inline, jsDoc, NewLine } from '../output/writer'
import { getEquivalentType } from './helpers/get-equivalent-type'
import { ABIMethod } from 'algosdk'
import { Arc56Contract, StorageKey, StorageMap, StructFields } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { Sanitizer } from '../util/sanitization'

export function* appTypes(ctx: GeneratorContext): DocumentParts {
  const { app, methodSignatureToUniqueName, name } = ctx
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
    const methodSig = new ABIMethod(method).getSignature()
    const methodSigSafe = ctx.sanitizer.makeSafeStringTypeLiteral(methodSig)
    const uniqueName = methodSignatureToUniqueName[methodSig]
    const uniqueNameSafe = ctx.sanitizer.makeSafeStringTypeLiteral(uniqueName)
    yield `& Record<'${methodSigSafe}'${methodSig !== uniqueName ? ` | '${uniqueNameSafe}'` : ''}, {`
    yield IncIndent
    yield `argsObj: {`
    yield IncIndent

    const argsMeta = method.args.map((arg, i) => ({
      ...arg,
      name: arg.name ?? `arg${i + 1}`,
      hasDefault: !!arg.defaultValue,
      tsType: getEquivalentType(arg.type, 'input', ctx.app),
    }))

    for (const arg of argsMeta) {
      if (arg.desc) yield* jsDoc(arg.desc)
      yield `${ctx.sanitizer.makeSafePropertyIdentifier(arg.name)}${arg.hasDefault ? '?' : ''}: ${arg.tsType}`
    }
    yield DecIndentAndCloseBlock
    yield* inline(
      `argsTuple: [`,
      argsMeta
        .map((arg) => `${ctx.sanitizer.makeSafeVariableIdentifier(arg.name)}: ${arg.tsType}${arg.hasDefault ? ' | undefined' : ''}`)
        .join(', '),
      ']',
    )
    if (method.returns.desc) yield* jsDoc(method.returns.desc)
    yield `returns: ${getEquivalentType(method.returns.type ?? 'void', 'output', ctx.app)}`

    yield DecIndent
    yield '}>'
  }
  yield DecIndent
  yield* appState(ctx)
  yield DecIndentAndCloseBlock

  yield `
  /**
   * Defines the possible abi call signatures.
   */
  export type ${name}Signatures = keyof ${name}Types['methods']
  /**
   * Defines an object containing all relevant parameters for a single call to the contract.
   */
  export type CallParams<TSignature extends ${name}Signatures> = Expand<
    Omit<AppClientMethodCallParams, 'method' | 'args' | 'onComplete'> &
      { args: Expand<MethodArgs<TSignature>> }
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

  yield NewLine
}

function* structPart(struct: StructFields, app: Arc56Contract, sanitizer: Sanitizer): DocumentParts {
  for (const [key, type] of Object.entries(struct)) {
    if (typeof type === 'string') {
      yield `${sanitizer.makeSafePropertyIdentifier(key)}: ${getEquivalentType(type, 'output', app)}`
    } else {
      yield `${sanitizer.makeSafePropertyIdentifier(key)}: {`
      yield IncIndent
      yield* structPart(type, app, sanitizer)
      yield DecIndentAndCloseBlock
    }
  }
}

function* structs({ app, sanitizer }: GeneratorContext): DocumentParts {
  if (app.structs === undefined) return

  for (const name of Object.keys(app.structs)) {
    const struct = app.structs[name]

    yield* jsDoc(`Represents a ${name} as a struct`)
    yield `export type ${sanitizer.makeSafeTypeIdentifier(name)} = {`
    yield IncIndent
    yield* structPart(struct, app, sanitizer)
    yield DecIndentAndCloseBlock
  }
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

      yield `${keySafe}?: ${prop.valueType === 'bytes' ? 'BinaryState' : getEquivalentType(prop.valueType, 'output', app)}`
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

      yield `${keySafe}?: Map<${getEquivalentType(prop.keyType, 'input', app)},${prop.valueType === 'bytes' ? 'BinaryState' : getEquivalentType(prop.valueType, 'output', app)}>`
    }
    yield DecIndentAndCloseBlock
  }
}

function* appState({ app, sanitizer }: GeneratorContext): DocumentParts {
  const hasLocal =
    (app.state.keys.local && Object.keys(app.state.keys.local).length) || (app.state.maps.local && Object.keys(app.state.maps.local).length)
  const hasGlobal =
    (app.state.keys.global && Object.keys(app.state.keys.global).length) ||
    (app.state.maps.global && Object.keys(app.state.maps.global).length)
  if (hasLocal || hasGlobal) {
    yield* jsDoc('Defines the shape of the global and local state of the application.')
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
    yield DecIndentAndCloseBlock
  }
}
