import { DecIndent, DocumentParts, IncIndent, jsDoc, NewLine } from '../output/writer'
import { BARE_CALL, MethodIdentifier } from './helpers/get-call-config-summary'
import { GeneratorContext } from './generator-context'
import { Arc56Contract } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { ABIMethod } from 'algosdk'

export function getCreateOnCompleteOptions(method: MethodIdentifier, app: Arc56Contract) {
  const validCreateOnCompletes =
    method === BARE_CALL ? app.bareActions.create : app.methods.find((m) => new ABIMethod(m).getSignature() === method)?.actions?.create
  const hasNoOp = validCreateOnCompletes?.includes('NoOp')
  const onCompleteType = validCreateOnCompletes
    ? `{onComplete${hasNoOp ? '?' : ''}: ${validCreateOnCompletes.map((oc) => `OnApplicationComplete.${oc}OC`).join(' | ')}}`
    : {}
  return {
    type: onCompleteType,
    isOptional: hasNoOp,
  }
}

export function getCallOnCompleteOptions(method: MethodIdentifier, app: Arc56Contract) {
  const validCallOnCompletes =
    method === BARE_CALL ? app.bareActions.call : app.methods.find((m) => new ABIMethod(m).getSignature() === method)?.actions?.call
  const hasNoOp = validCallOnCompletes?.includes('NoOp')
  const onCompleteType = validCallOnCompletes
    ? `{onComplete${hasNoOp ? '?' : ''}: ${validCallOnCompletes.map((oc) => `OnApplicationComplete.${oc}OC`).join(' | ')}}`
    : {}
  return {
    type: onCompleteType,
    isOptional: hasNoOp,
  }
}

export function* deployTypes({ app, callConfig, sanitizer }: GeneratorContext): DocumentParts {
  const name = sanitizer.makeSafeTypeIdentifier(app.name)

  if (callConfig.createMethods.length > 0) {
    yield* jsDoc('Defines supported create method params for this smart contract')
    yield `export type ${name}CreateCallParams =`
    yield IncIndent
    for (const method of callConfig.createMethods) {
      const onComplete = getCreateOnCompleteOptions(method, app)
      if (method === BARE_CALL) {
        yield `| (AppClientBareCallParams & ${onComplete.type})`
      } else {
        const methodSigSafe = sanitizer.makeSafeStringTypeLiteral(method)
        yield `| (CallParams<'${methodSigSafe}'> & ${onComplete.type})`
      }
    }
    yield DecIndent
  }
  if (callConfig.updateMethods.length > 0) {
    yield* jsDoc('Defines supported update method params for this smart contract')
    yield `export type ${name}UpdateCallParams =`
    yield IncIndent
    for (const method of callConfig.updateMethods) {
      if (method === BARE_CALL) {
        yield `| AppClientBareCallParams`
      } else {
        const methodSigSafe = sanitizer.makeSafeStringTypeLiteral(method)

        yield `| CallParams<'${methodSigSafe}'>`
      }
    }
    yield DecIndent
  }

  if (callConfig.deleteMethods.length > 0) {
    yield* jsDoc('Defines supported delete method params for this smart contract')
    yield `export type ${name}DeleteCallParams =`
    yield IncIndent
    for (const method of callConfig.deleteMethods) {
      if (method === BARE_CALL) {
        yield `| AppClientBareCallParams`
      } else {
        const methodSigSafe = sanitizer.makeSafeStringTypeLiteral(method)

        yield `| CallParams<'${methodSigSafe}'>`
      }
    }
    yield DecIndent
  }

  yield* jsDoc('Defines arguments required for the deploy method.')
  yield `export type ${name}DeployParams = Expand<AppFactoryDeployParams & {`
  yield IncIndent
  if (callConfig.createMethods.length) {
    yield* jsDoc('Create transaction parameters to use if a create needs to be issued as part of deployment')
    yield `createParams?: ${name}CreateCallParams`
  }
  if (callConfig.updateMethods.length) {
    yield* jsDoc('Update transaction parameters to use if a create needs to be issued as part of deployment')
    yield `updateParams?: ${name}UpdateCallParams`
  }
  if (callConfig.deleteMethods.length) {
    yield* jsDoc('Delete transaction parameters to use if a create needs to be issued as part of deployment')
    yield `deleteParams?: ${name}DeleteCallParams`
  }
  yield DecIndent
  yield `}>`
  yield NewLine
}
