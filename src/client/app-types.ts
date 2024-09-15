import { GeneratorContext } from './generator-context'
import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, inline, jsDoc, NewLine } from '../output/writer'
import { getEquivalentType } from './helpers/get-equivalent-type'
import { ABIMethod, ABITupleType } from 'algosdk'
import { Arc56Contract, StorageKey, StorageMap, StructFields } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { Sanitizer } from '../util/sanitization'

export function* appTypes(ctx: GeneratorContext): DocumentParts {
  yield* abiTypes(ctx)
  yield* structTypes(ctx)
  yield* templateVariableTypes(ctx)

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
      tsType: getEquivalentType(arg.struct ?? arg.type, 'input', ctx),
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
    yield `returns: ${getEquivalentType(method.returns.struct ?? method.returns.type ?? 'void', 'output', ctx)}`

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
  export type CallParams<TSignature extends ${name}Signatures> = Expand<
    Omit<AppClientMethodCallParams, 'method' | 'args' | 'onComplete'> &
      {
        /** The args for the ABI method call, either as an ordered array or an object */
        args: Expand<MethodArgs<TSignature>>
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

function* abiTypes(ctx: GeneratorContext): DocumentParts {
  const { app } = ctx
  const abiTypes: string[] = []

  const pushType = (type: string) => {
    // If we already have this type, skip
    if (abiTypes.includes(type)) return

    // void and string are the same types in TS
    if (['void', 'string'].includes(type)) return

    // Skip structs
    if (app.structs[type]) return

    // If this is an array type, push the base type
    if (type.match(/\[\d*\]$/)) {
      pushType(type.replace(/\[\d*\]$/, ''))
      return
    }

    if (type.startsWith('(')) {
      const tupleType = ABITupleType.from(type) as ABITupleType

      tupleType.childTypes.forEach((t) => {
        pushType(t.toString())
      })

      return
    }

    abiTypes.push(type)
  }

  Object.values(app.templateVariables ?? {}).forEach((t) => {
    pushType(t.type)
  })

  app.methods.forEach((m) => {
    m.args.forEach((a) => {
      pushType(a.type)
    })

    pushType(m.returns.type)
  })
  ;(['global', 'local', 'box'] as ['global', 'local', 'box']).forEach((storageType) => {
    Object.values(app.state.keys[storageType]).forEach((k) => {
      pushType(k.keyType)
      pushType(k.valueType)
    })

    Object.values(app.state.maps[storageType]).forEach((m) => {
      pushType(m.keyType)
      pushType(m.valueType)
    })
  })

  const pushStructFields = (fields: StructFields) => {
    Object.values(fields).forEach((sf) => {
      if (typeof sf === 'string') pushType(sf)
      else pushStructFields(sf)
    })
  }

  Object.values(app.structs).forEach((sf) => {
    pushStructFields(sf)
  })

  yield '// Aliases for non-encoded ABI values'
  yield NewLine
  for (const t of abiTypes) {
    yield `type ${t} = ${getEquivalentType(t, 'output', ctx)};`
  }
  yield NewLine
}

function* structTypes({ app, sanitizer }: GeneratorContext): DocumentParts {
  if (Object.keys(app.structs).length === 0) return

  yield '// Type definitions for ARC-56 structs'
  yield NewLine

  for (const structName of Object.keys(app.structs)) {
    yield `export type ${sanitizer.makeSafeTypeIdentifier(structName)} = ${JSON.stringify(app.structs[structName], null, 2)
      .replace(/"/g, '')
      .replaceAll('(', '[')
      .replaceAll(')', ']')
      .replace(/\[\d+\]/g, '[]')}`
  }

  yield NewLine
}

function* templateVariableTypes({ app }: GeneratorContext): DocumentParts {
  if (Object.keys(app.templateVariables ?? {}).length === 0) {
    return
  }

  yield* jsDoc('Deploy-time template variables')
  yield 'export type TemplateVariables = {'
  yield IncIndent

  for (const name of Object.keys(app.templateVariables ?? {})) {
    yield `${name}: ${app.templateVariables![name].type},`
  }

  yield DecIndentAndCloseBlock
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

      yield `${keySafe}: ${prop.valueType === 'bytes' ? 'BinaryState' : getEquivalentType(prop.valueType, 'output', { app, sanitizer })}`
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
