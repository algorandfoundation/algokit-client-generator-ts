import { DecIndentAndCloseBlock, DocumentParts, IncIndent, jsDoc, NewLine } from '../output/writer'
import { GeneratorContext } from './generator-context'
import * as algokit from '@algorandfoundation/algokit-utils'
import { makeSafeMethodIdentifier } from '../util/sanitization'
import { BARE_CALL, MethodList } from './helpers/get-call-config-summary'
import { getCreateOnCompleteOptions } from './deploy-types'

export function* callComposerType(ctx: GeneratorContext): DocumentParts {
  const { name, callConfig, app } = ctx
  yield `export type ${name}Composer<TReturns extends [...any[]] = []> = {`
  yield IncIndent

  yield* callComposerTypeNoops(ctx)
  yield* callComposerOperationMethodType(
    ctx,
    `Updates an existing instance of the ${app.contract.name} smart contract`,
    callConfig.updateMethods,
    'update',
    true,
  )
  yield* callComposerOperationMethodType(
    ctx,
    `Deletes an existing instance of the ${app.contract.name} smart contract`,
    callConfig.deleteMethods,
    'delete',
  )
  yield* callComposerOperationMethodType(
    ctx,
    `Opts the user into an existing instance of the ${app.contract.name} smart contract`,
    callConfig.optInMethods,
    'optIn',
  )
  yield* callComposerOperationMethodType(
    ctx,
    `Makes a close out call to an existing instance of the ${app.contract.name} smart contract`,
    callConfig.closeOutMethods,
    'closeOut',
  )

  yield* callComposerTypeClearState(ctx)

  yield* jsDoc({
    description: 'Adds a transaction to the composer',
    params: {
      txn: 'A transaction with signer object',
    },
  })
  yield `addTransaction(txn: TransactionWithSigner): ${name}Composer<TReturns>`

  yield* jsDoc({
    description: 'Returns the underlying AtomicTransactionComposer instance',
  })
  yield `atc(): Promise<AtomicTransactionComposer>`

  yield* jsDoc({
    description: 'Executes the transaction group and returns an array of results',
  })
  yield `execute(): Promise<${name}ComposerResults<TReturns>>`

  yield DecIndentAndCloseBlock

  yield `export type ${name}ComposerResults<TReturns extends [...any[]]> = {`
  yield IncIndent
  yield `returns: TReturns`
  yield `groupId: string`
  yield `txIds: string[]`
  yield `transactions: Transaction[]`
  yield DecIndentAndCloseBlock
}

function* callComposerTypeClearState({ app, name }: GeneratorContext): DocumentParts {
  yield* jsDoc({
    description: `Makes a clear_state call to an existing instance of the ${app.contract.name} smart contract.`,
    params: {
      args: `The arguments for the bare call`,
    },
    returns: `The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions`,
  })
  yield `clearState(args?: BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs): ${name}Composer<[...TReturns, undefined]>`
  yield NewLine
}

function* callComposerTypeNoops({ app, name, callConfig, methodSignatureToUniqueName }: GeneratorContext): DocumentParts {
  for (const method of app.contract.methods) {
    const methodSignature = algokit.getABIMethodSignature(method)
    const methodName = makeSafeMethodIdentifier(methodSignatureToUniqueName[methodSignature])
    // Skip methods which don't support a no_op call config
    if (!callConfig.callMethods.includes(methodSignature)) continue
    yield* jsDoc({
      description: `Calls the ${algokit.getABIMethodSignature(method)} ABI method.`,
      abiDescription: method.desc,
      params: {
        args: `The arguments for the contract call`,
        params: `Any additional parameters for the call`,
      },
      returns: `The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions`,
    })
    yield `${methodName}(args: MethodArgs<'${methodSignature}'>, params?: AppClientCallCoreParams & CoreAppCallArgs): ${name}Composer<[...TReturns, MethodReturn<'${methodSignature}'>]>`
    yield NewLine
  }
}

function* callComposerOperationMethodType(
  { app, methodSignatureToUniqueName, name }: GeneratorContext,
  description: string,
  methods: MethodList,
  verb: 'create' | 'update' | 'optIn' | 'closeOut' | 'delete',
  includeCompilation?: boolean,
): DocumentParts {
  if (methods.length) {
    yield* jsDoc(`Gets available ${verb} methods`)
    yield `readonly ${verb}: {`
    yield IncIndent
    for (const methodSig of methods) {
      const onComplete = verb === 'create' ? getCreateOnCompleteOptions(methodSig, app) : undefined
      if (methodSig === BARE_CALL) {
        yield* jsDoc({
          description: `${description} using a bare call.`,
          params: {
            args: `The arguments for the bare call`,
          },
          returns: `The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions`,
        })
        yield `bare(args${onComplete?.isOptional !== false ? '?' : ''}: BareCallArgs & AppClientCallCoreParams ${
          includeCompilation ? '& AppClientCompilationParams ' : ''
        }& CoreAppCallArgs${onComplete?.type ? ` & ${onComplete.type}` : ''}): ${name}Composer<[...TReturns, undefined]>`
      } else {
        const uniqueName = methodSignatureToUniqueName[methodSig]
        yield* jsDoc({
          description: `${description} using the ${methodSig} ABI method.`,
          params: {
            args: `The arguments for the smart contract call`,
            params: `Any additional parameters for the call`,
          },
          returns: `The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions`,
        })
        yield `${makeSafeMethodIdentifier(uniqueName)}(args: MethodArgs<'${methodSig}'>, params${
          onComplete?.isOptional !== false ? '?' : ''
        }: AppClientCallCoreParams${includeCompilation ? ' & AppClientCompilationParams' : ''}${
          onComplete?.type ? ` & ${onComplete.type}` : ''
        }): ${name}Composer<[...TReturns, MethodReturn<'${methodSig}'>]>`
      }
    }
    yield DecIndentAndCloseBlock
    yield NewLine
  }
}
