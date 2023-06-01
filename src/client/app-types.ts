import { GeneratorContext } from './generator-context'
import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, inline, jsDoc, NewLine } from '../output/writer'
import * as algokit from '@algorandfoundation/algokit-utils'
import { getEquivalentType } from './helpers/get-equivalent-type'
import { makeSafePropertyIdentifier, makeSafeTypeIdentifier, makeSafeVariableIdentifier } from '../util/sanitization'

export function* appTypes(ctx: GeneratorContext): DocumentParts {
  const { app, methodSignatureToUniqueName, name } = ctx
  yield* jsDoc(`Defines the types of available calls and state of the ${name} smart contract.`)
  yield `export type ${name} = {`
  yield IncIndent
  yield* jsDoc('Maps method signatures / names to their argument and return types.')
  yield 'methods:'
  yield IncIndent
  for (const method of app.contract.methods) {
    const methodSig = algokit.getABIMethodSignature(method)
    const uniqueName = methodSignatureToUniqueName[methodSig]
    yield `& Record<'${methodSig}'${methodSig !== uniqueName ? ` | '${uniqueName}'` : ''}, {`
    yield IncIndent
    yield `argsObj: {`
    yield IncIndent

    const argsMeta = method.args.map((arg) => ({
      ...arg,
      hasDefault: app.hints?.[methodSig]?.default_arguments?.[arg.name],
      tsType: getEquivalentType(arg.type, 'input'),
    }))

    for (const arg of argsMeta) {
      if (arg.desc) yield* jsDoc(arg.desc)
      yield `${makeSafePropertyIdentifier(arg.name)}${arg.hasDefault ? '?' : ''}: ${arg.tsType}`
    }
    yield DecIndentAndCloseBlock
    yield* inline(
      `argsTuple: [`,
      argsMeta
        .map(
          (arg) =>
            `${makeSafeVariableIdentifier(arg.name)}: ${getEquivalentType(arg.type, 'input')}${arg.hasDefault ? ' | undefined' : ''}`,
        )
        .join(', '),
      ']',
    )
    const outputStruct = ctx.app.hints?.[methodSig]?.structs?.output
    if (method.returns.desc) yield* jsDoc(method.returns.desc)
    if (outputStruct) {
      yield `returns: ${makeSafeTypeIdentifier(outputStruct.name)}`
    } else {
      yield `returns: ${getEquivalentType(method.returns.type ?? 'void', 'output')}`
    }

    yield DecIndent
    yield '}>'
  }
  yield DecIndent
  yield* appState(ctx)
  yield DecIndentAndCloseBlock

  yield* jsDoc('Defines the possible abi call signatures')
  yield `export type ${name}Sig = keyof ${name}['methods']`
  yield* jsDoc(
    'Defines an object containing all relevant parameters for a single call to the contract. Where TSignature is undefined, a' +
      ' bare call is made',
  )
  yield `export type TypedCallParams<TSignature extends ${name}Sig | undefined> = {`
  yield IncIndent
  yield 'method: TSignature'
  yield 'methodArgs: TSignature extends undefined ? undefined : Array<ABIAppCallArg | undefined>'
  yield DecIndent
  yield '} & AppClientCallCoreParams & CoreAppCallArgs'
  yield* jsDoc('Defines the arguments required for a bare call')
  yield `export type BareCallArgs = Omit<RawAppCallArgs, keyof CoreAppCallArgs>`

  yield* structs(ctx)
  yield* jsDoc(`Maps a method signature from the ${name} smart contract to the method's arguments in either tuple of struct form`)
  yield `export type MethodArgs<TSignature extends ${name}Sig> = ${name}['methods'][TSignature]['argsObj' | 'argsTuple']`
  yield* jsDoc(`Maps a method signature from the ${name} smart contract to the method's return type`)
  yield `export type MethodReturn<TSignature extends ${name}Sig> = ${name}['methods'][TSignature]['returns']`
  yield NewLine
}

function* structs({ app }: GeneratorContext): DocumentParts {
  if (app.hints === undefined) return
  for (const methodHint of Object.values(app.hints)) {
    if (methodHint.structs === undefined) continue
    for (const struct of Object.values(methodHint.structs)) {
      yield* jsDoc(`Represents a ${struct.name} result as a struct`)
      yield `export type ${makeSafeTypeIdentifier(struct.name)} = {`
      yield IncIndent
      for (const [key, type] of struct.elements) {
        yield `${makeSafePropertyIdentifier(key)}: ${getEquivalentType(type, 'output')}`
      }
      yield DecIndentAndCloseBlock
      yield* jsDoc(`Converts the tuple representation of a ${struct.name} to the struct representation`)
      yield* inline(
        `export function ${makeSafeTypeIdentifier(struct.name)}(`,
        `[${struct.elements.map(([key]) => makeSafeVariableIdentifier(key)).join(', ')}]: `,
        `[${struct.elements.map(([_, type]) => getEquivalentType(type, 'output')).join(', ')}] ) {`,
      )
      yield IncIndent
      yield `return {`
      yield IncIndent
      for (const [key] of struct.elements) {
        const prop = makeSafePropertyIdentifier(key)
        const param = makeSafeVariableIdentifier(key)
        yield `${prop}${prop !== param ? `: ${param}` : ''},`
      }
      yield DecIndentAndCloseBlock
      yield DecIndentAndCloseBlock
    }
  }
}

function* appState({ app }: GeneratorContext): DocumentParts {
  const hasLocal = app.schema.local?.declared && Object.keys(app.schema.local.declared).length
  const hasGlobal = app.schema.global?.declared && Object.keys(app.schema.global.declared).length
  if (hasLocal || hasGlobal) {
    yield* jsDoc('Defines the shape of the global and local state of the application.')
    yield 'state: {'
    yield IncIndent
    if (hasGlobal) {
      yield 'global: {'
      yield IncIndent
      for (const prop of Object.values(app.schema.global!.declared!)) {
        if (prop.descr) {
          yield* jsDoc(prop.descr)
        }

        yield `'${prop.key}'?: ${prop.type === 'uint64' ? 'IntegerState' : 'BinaryState'}`
      }
      yield DecIndentAndCloseBlock
    }
    if (hasLocal) {
      yield 'local: {'
      yield IncIndent
      for (const prop of Object.values(app.schema.local!.declared!)) {
        if (prop.descr) {
          yield* jsDoc(prop.descr)
        }

        yield `'${prop.key}'?: ${prop.type === 'uint64' ? 'IntegerState' : 'BinaryState'}`
      }
      yield DecIndentAndCloseBlock
    }

    yield DecIndentAndCloseBlock
  }
}
