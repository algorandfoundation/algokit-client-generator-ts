import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, jsDoc, NewLine } from '../output/writer'
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
    yield* jsDoc(`A factory for available 'create' calls`)
    yield `export type ${name}CreateCalls = (typeof ${name}CallFactory)['create']`
    yield* jsDoc('Defines supported create methods for this smart contract')
    yield `export type ${name}CreateCallParams =`
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
    yield* jsDoc(`A factory for available 'update' calls`)

    yield `export type ${name}UpdateCalls = (typeof ${name}CallFactory)['update']`
    yield* jsDoc('Defines supported update methods for this smart contract')
    yield `export type ${name}UpdateCallParams =`
    yield IncIndent
    for (const method of callConfig.updateMethods) {
      if (method === BARE_CALL) {
        yield `| TypedCallParams<undefined>`
      } else {
        yield `| TypedCallParams<'${method}'>`
      }
    }
    yield DecIndent
  }

  if (callConfig.deleteMethods.length > 0) {
    yield* jsDoc(`A factory for available 'delete' calls`)

    yield `export type ${name}DeleteCalls = (typeof ${name}CallFactory)['delete']`

    yield* jsDoc('Defines supported delete methods for this smart contract')
    yield `export type ${name}DeleteCallParams =`
    yield IncIndent
    for (const method of callConfig.deleteMethods) {
      if (method === BARE_CALL) {
        yield `| TypedCallParams<undefined>`
      } else {
        yield `| TypedCallParams<'${method}'>`
      }
    }
    yield DecIndent
  }

  yield* jsDoc('Defines arguments required for the deploy method.')
  yield `export type ${name}DeployArgs = {`
  yield IncIndent
  yield `deployTimeParams?: TealTemplateParams`
  if (callConfig.createMethods.length) {
    yield* jsDoc('A delegate which takes a create call factory and returns the create call params for this smart contract')
    yield `createCall?: (callFactory: ${name}CreateCalls) => ${name}CreateCallParams`
  }
  if (callConfig.updateMethods.length) {
    yield* jsDoc('A delegate which takes a update call factory and returns the update call params for this smart contract')
    yield `updateCall?: (callFactory: ${name}UpdateCalls) => ${name}UpdateCallParams`
  }
  if (callConfig.deleteMethods.length) {
    yield* jsDoc('A delegate which takes a delete call factory and returns the delete call params for this smart contract')
    yield `deleteCall?: (callFactory: ${name}DeleteCalls) => ${name}DeleteCallParams`
  }
  yield DecIndentAndCloseBlock
  yield NewLine
}
