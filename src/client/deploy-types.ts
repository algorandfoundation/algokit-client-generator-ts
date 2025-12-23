import { DecIndent, DocumentParts, IncIndent, jsDoc, NewLine } from '../output/writer'
import { GeneratorContext } from './generator-context'
import { isAbiMethod } from './app-client-context'

export function* deployTypes({ app, sanitizer }: GeneratorContext): DocumentParts {
  const name = app.name.makeSafeTypeIdentifier

  if (app.createMethods.length) {
    yield* jsDoc('Defines supported create method params for this smart contract')
    yield `export type ${name}CreateCallParams =`
    yield IncIndent

    for (const method of app.createMethods) {
      const onComplete = method.createActions.inputType
      if (!isAbiMethod(method)) {
        yield `| Expand<AppClientBareCallParams & {method?: never} & ${onComplete.typeLiteral} & CreateSchema>`
      } else {
        const methodSigSafe = sanitizer.makeSafeStringTypeLiteral(method.signature)
        const uniqueName = method.uniqueName.original
        if (uniqueName !== method.signature) {
          const methodName = sanitizer.makeSafeStringTypeLiteral(uniqueName)
          yield `| Expand<CallParams<${name}Args['obj']['${methodSigSafe}'] | ${name}Args['tuple']['${methodSigSafe}']> & {method: '${methodName}'} & ${onComplete.typeLiteral} & CreateSchema>`
        }
        yield `| Expand<CallParams<${name}Args['obj']['${methodSigSafe}'] | ${name}Args['tuple']['${methodSigSafe}']> & {method: '${methodSigSafe}'} & ${onComplete.typeLiteral} & CreateSchema>`
      }
    }
    yield DecIndent
  }
  if (app.updateMethods.length) {
    yield* jsDoc('Defines supported update method params for this smart contract')
    yield `export type ${name}UpdateCallParams =`
    yield IncIndent

    for (const method of app.updateMethods) {
      if (!isAbiMethod(method)) {
        yield `| Expand<AppClientBareCallParams> & {method?: never}`
      } else {
        const uniqueName = method.uniqueName.original
        const methodSigSafe = sanitizer.makeSafeStringTypeLiteral(method.signature)
        if (uniqueName !== method.signature) {
          const methodName = sanitizer.makeSafeStringTypeLiteral(uniqueName)
          yield `| Expand<CallParams<${name}Args['obj']['${methodSigSafe}'] | ${name}Args['tuple']['${methodSigSafe}']> & {method: '${methodName}'}>`
        }
        yield `| Expand<CallParams<${name}Args['obj']['${methodSigSafe}'] | ${name}Args['tuple']['${methodSigSafe}']> & {method: '${methodSigSafe}'}>`
      }
    }
    yield DecIndent
  }

  if (app.deleteMethods.length) {
    yield* jsDoc('Defines supported delete method params for this smart contract')
    yield `export type ${name}DeleteCallParams =`
    yield IncIndent
    for (const method of app.deleteMethods) {
      if (!isAbiMethod(method)) {
        yield `| Expand<AppClientBareCallParams> & {method?: never}`
      } else {
        const uniqueName = method.uniqueName.original
        const methodSigSafe = sanitizer.makeSafeStringTypeLiteral(method.signature)
        if (uniqueName !== method.signature) {
          const methodName = sanitizer.makeSafeStringTypeLiteral(uniqueName)
          yield `| Expand<CallParams<${name}Args['obj']['${methodSigSafe}'] | ${name}Args['tuple']['${methodSigSafe}']> & {method: '${methodName}'}>`
        }
        yield `| Expand<CallParams<${name}Args['obj']['${methodSigSafe}'] | ${name}Args['tuple']['${methodSigSafe}']> & {method: '${methodSigSafe}'}>`
      }
    }
    yield DecIndent
  }

  yield* jsDoc('Defines arguments required for the deploy method.')
  yield `export type ${name}DeployParams = Expand<Omit<AppFactoryDeployParams, 'createParams' | 'updateParams' | 'deleteParams'> & {`
  yield IncIndent
  if (app.createMethods.length) {
    yield* jsDoc(
      'Create transaction parameters to use if a create needs to be issued as part of deployment; use `method` to define ABI call (if available) or leave out for a bare call (if available)',
    )
    yield `createParams?: ${name}CreateCallParams`
  }
  if (app.updateMethods.length) {
    yield* jsDoc(
      'Update transaction parameters to use if a create needs to be issued as part of deployment; use `method` to define ABI call (if available) or leave out for a bare call (if available)',
    )
    yield `updateParams?: ${name}UpdateCallParams`
  }
  if (app.deleteMethods.length) {
    yield* jsDoc(
      'Delete transaction parameters to use if a create needs to be issued as part of deployment; use `method` to define ABI call (if available) or leave out for a bare call (if available)',
    )
    yield `deleteParams?: ${name}DeleteCallParams`
  }
  yield DecIndent
  yield `}>`
  yield NewLine
}
