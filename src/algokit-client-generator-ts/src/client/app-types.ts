import { GeneratorContext } from './generator-context'
import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, inline, NewLine } from '../output/writer'
import * as algokit from '@algorandfoundation/algokit-utils'
import { getEquivalentType } from './helpers/get-equivalent-type'
import { makeSafePropertyIdentifier, makeSafeTypeIdentifier, makeSafeVariableIdentifier } from '../util/sanitization'

export function* appTypes(ctx: GeneratorContext): DocumentParts {
  const { app, methodSignatureToUniqueName, name } = ctx
  yield `export type ${name} = {`
  yield IncIndent
  yield 'methods: '
  yield IncIndent
  for (const method of app.contract.methods) {
    const methodSig = algokit.getABIMethodSignature(method)
    const uniqueName = methodSignatureToUniqueName[methodSig]
    yield `& Record<'${methodSig}'${methodSig !== uniqueName ? ` | '${uniqueName}'` : ''}, {`
    yield IncIndent
    yield `argsObj: {`
    yield IncIndent
    for (const arg of method.args) {
      yield `${makeSafePropertyIdentifier(arg.name)}: ${getEquivalentType(arg.type, 'input')}`
    }
    yield DecIndentAndCloseBlock
    yield* inline(
      `argsTuple: [`,
      method.args.map((t) => `${makeSafeVariableIdentifier(t.name)}: ${getEquivalentType(t.type, 'input')}`).join(', '),
      ']',
    )
    const outputStruct = ctx.app.hints?.[methodSig]?.structs?.output
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
  yield* structs(ctx)
  yield `export type IntegerState = { asBigInt(): bigint, asNumber(): number }`
  yield `export type BinaryState = { asByteArray(): Uint8Array, asString(): string }`
  yield `export type MethodArgs<TSignature extends keyof ${name}['methods']> = ${name}['methods'][TSignature]['argsObj' | 'argsTuple']`
  yield `export type MethodReturn<TSignature extends keyof ${name}['methods']> = ${name}['methods'][TSignature]['returns']`
  yield `type MapperArgs<TSignature extends keyof ${name}['methods']> = TSignature extends any ? [signature: TSignature, args: MethodArgs<TSignature>, params: AppClientCallCoreParams & CoreAppCallArgs ] : never`
  yield NewLine
}

function* structs({ app }: GeneratorContext): DocumentParts {
  if (app.hints === undefined) return
  for (const methodHint of Object.values(app.hints)) {
    if (methodHint.structs === undefined) continue
    for (const struct of Object.values(methodHint.structs)) {
      yield `export type ${makeSafeTypeIdentifier(struct.name)} = {`
      yield IncIndent
      for (const [key, type] of struct.elements) {
        yield `${makeSafePropertyIdentifier(key)}: ${getEquivalentType(type, 'output')}`
      }
      yield DecIndentAndCloseBlock
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
    yield 'state: {'
    yield IncIndent
    if (hasGlobal) {
      yield 'global: {'
      yield IncIndent
      for (const prop of Object.values(app.schema.global!.declared!)) {
        if (prop.descr) {
          yield '/**'
          yield ` * ${prop.descr}`
          yield ' */'
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
          yield '/**'
          yield ` * ${prop.descr}`
          yield ' */'
        }

        yield `'${prop.key}'?: ${prop.type === 'uint64' ? 'IntegerState' : 'BinaryState'}`
      }
      yield DecIndentAndCloseBlock
    }

    yield DecIndentAndCloseBlock
  }
}
