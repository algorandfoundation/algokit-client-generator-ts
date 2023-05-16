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
    yield `export type ${name}CreateArgs =`
    yield IncIndent
    for (const method of callConfig.createMethods) {
      const onComplete = getCreateOnCompleteOptions(method, app)
      if (method === BARE_CALL) {
        yield `| (BareCallArgs & CoreAppCallArgs & ${onComplete.type})`
      } else {
        yield `| ['${method}', MethodArgs<'${method}'>, (CoreAppCallArgs & ${onComplete.type})${onComplete.isOptional ? '?' : ''}]`
      }
    }
    yield DecIndent
  }
  if (callConfig.updateMethods.length > 0) {
    yield `export type ${name}UpdateArgs =`
    yield IncIndent
    for (const method of callConfig.updateMethods) {
      if (method === BARE_CALL) {
        yield `| BareCallArgs & CoreAppCallArgs`
      } else {
        yield `| ['${method}', MethodArgs<'${method}'>, CoreAppCallArgs]`
      }
    }
    yield DecIndent
  }

  if (callConfig.deleteMethods.length > 0) {
    yield `export type ${name}DeleteArgs =`
    yield IncIndent
    for (const method of callConfig.deleteMethods) {
      if (method === BARE_CALL) {
        yield `| BareCallArgs & CoreAppCallArgs`
      } else {
        yield `| ['${method}', MethodArgs<'${method}'>, CoreAppCallArgs]`
      }
    }
    yield DecIndent
  }

  yield `export type ${name}DeployArgs = {`
  yield IncIndent
  yield `deployTimeParams?: TealTemplateParams`
  if (callConfig.createMethods.length) yield `createArgs?: ${name}CreateArgs`
  if (callConfig.updateMethods.length) yield `updateArgs?: ${name}UpdateArgs`
  if (callConfig.deleteMethods.length) yield `deleteArgs?: ${name}DeleteArgs`
  yield DecIndentAndCloseBlock
  yield NewLine
}
