import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, NewLine } from '../output/writer'
import { makeSafeTypeIdentifier } from '../util/sanitization'
import { BARE_CALL, MethodIdentifier } from './helpers/get-call-config-summary'
import { GeneratorContext } from './generator-context'
import { AlgoAppSpec, CallConfig } from '../schema/application'
import { OnCompleteCodeMap } from './utility-types'

export function getCreateOnCompleteOptions(method: MethodIdentifier, app: AlgoAppSpec) {
  const callConfig = method === BARE_CALL ? app.bare_call_config : app.hints?.[method]?.call_config
  const hasNoOp = callConfig?.no_op === 'ALL' || callConfig?.no_op === 'CREATE'
  const onCompleteType = callConfig
    ? `(${Object.entries(callConfig)
        .filter(([_, value]) => value === 'ALL' || value === 'CREATE')
        .map(([oc]) => OnCompleteCodeMap[oc as keyof CallConfig])
        .join(' | ')})`
    : {}
  return {
    type: onCompleteType,
    isOptional: hasNoOp,
  }
}

export function* deployTypes({ app, callConfig }: GeneratorContext): DocumentParts {
  const name = makeSafeTypeIdentifier(app.contract.name)

  if (callConfig.createMethods.length > 0) {
    yield `export type ${name}CreateCalls = (typeof ${name}CallFactory)['create']`
    yield `export type ${name}CreateCallArgs =`
    yield IncIndent
    for (const method of callConfig.createMethods) {
      const onComplete = getCreateOnCompleteOptions(method, app)
      if (method === BARE_CALL) {
        yield `| (TypedCallParams<undefined> & ${onComplete.type})`
      } else {
        yield `| (TypedCallParams<'${method}'> & ${onComplete.type})`
      }
    }
    yield DecIndent
  }
  if (callConfig.updateMethods.length > 0) {
    yield `export type ${name}UpdateCalls = (typeof ${name}CallFactory)['update']`

    yield `export type ${name}UpdateCallArgs =`
    yield IncIndent
    for (const method of callConfig.updateMethods) {
      if (method === BARE_CALL) {
        yield `| TypedCallParams<undefined>`
      } else {
        yield `| (TypedCallParams<'${method}'> & CoreAppCallArgs)`
      }
    }
    yield DecIndent
  }

  if (callConfig.deleteMethods.length > 0) {
    yield `export type ${name}DeleteCalls = (typeof ${name}CallFactory)['delete']`

    yield `export type ${name}DeleteCallArgs =`
    yield IncIndent
    for (const method of callConfig.deleteMethods) {
      if (method === BARE_CALL) {
        yield `| TypedCallParams<undefined>`
      } else {
        yield `| (TypedCallParams<'${method}'> & CoreAppCallArgs)`
      }
    }
    yield DecIndent
  }

  yield `export type ${name}DeployArgs = {`
  yield IncIndent
  yield `deployTimeParams?: TealTemplateParams`
  if (callConfig.createMethods.length) yield `createCall?: (callFactory: ${name}CreateCalls) => ${name}CreateCallArgs`
  if (callConfig.updateMethods.length) yield `updateCall?: (callFactory: ${name}UpdateCalls) => ${name}UpdateCallArgs`
  if (callConfig.deleteMethods.length) yield `deleteCall?: (callFactory: ${name}DeleteCalls) => ${name}DeleteCallArgs`
  yield DecIndentAndCloseBlock
  yield NewLine
}
