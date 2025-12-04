import { DecIndentAndCloseBlock, DocumentParts, IncIndent, jsDoc, NewLine } from '../output/writer'
import { GeneratorContext } from './generator-context'

import { AppClientMethodContext } from './app-client-context'

export function* callComposerType(ctx: GeneratorContext): DocumentParts {
  const { name, app } = ctx
  yield `export type ${name}Composer<TReturns extends [...any[]] = []> = {`
  yield IncIndent

  yield* callComposerTypeNoops(ctx)
  if (ctx.mode === 'full') {
    yield* callComposerOperationMethodType(
      ctx,
      `Updates an existing instance of the ${app.name} smart contract`,
      app.updateMethods,
      'update',
    )
    yield* callComposerOperationMethodType(
      ctx,
      `Deletes an existing instance of the ${app.name} smart contract`,
      app.deleteMethods,
      'delete',
    )
  }
  yield* callComposerOperationMethodType(
    ctx,
    `Opts the user into an existing instance of the ${app.name} smart contract`,
    app.optInMethods,
    'optIn',
  )
  yield* callComposerOperationMethodType(
    ctx,
    `Makes a close out call to an existing instance of the ${app.name} smart contract`,
    app.closeOutMethods,
    'closeOut',
  )

  yield* callComposerTypeClearState(ctx)

  yield* jsDoc({
    description: 'Adds a transaction to the composer',
    params: {
      txn: 'A transaction to add to the transaction group',
      signer: 'The optional signer to use when signing this transaction.',
    },
  })
  yield `addTransaction(txn: Transaction, signer?: TransactionSigner): ${name}Composer<TReturns>`

  yield* jsDoc({
    description: 'Returns the underlying AtomicTransactionComposer instance',
  })
  yield `composer(): Promise<TransactionComposer>`

  yield* jsDoc({
    description: 'Simulates the transaction group and returns the result',
  })
  yield `simulate(): Promise<${name}ComposerResults<TReturns> & { simulateResponse: SimulateResponse }>`
  yield `simulate(options: SkipSignaturesSimulateOptions): Promise<${name}ComposerResults<TReturns> & { simulateResponse: SimulateResponse }>`
  yield `simulate(options: RawSimulateOptions): Promise<${name}ComposerResults<TReturns> & { simulateResponse: SimulateResponse }>`

  yield* jsDoc({
    description: 'Sends the transaction group to the network and returns the results',
  })
  yield `send(params?: SendParams): Promise<${name}ComposerResults<TReturns>>`

  yield DecIndentAndCloseBlock

  yield `
  export type ${name}ComposerResults<TReturns extends [...any[]]> = Expand<SendTransactionComposerResults & {
    returns: TReturns
  }>
  `
}

function* callComposerTypeClearState({ app, name }: GeneratorContext): DocumentParts {
  yield* jsDoc({
    description: `Makes a clear_state call to an existing instance of the ${app.name} smart contract.`,
    params: {
      params: `Any additional parameters for the bare call`,
    },
    returns: `The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions`,
  })
  yield `clearState(params?: AppClientBareCallParams): ${name}Composer<[...TReturns, undefined]>`
  yield NewLine
}

function* callComposerTypeNoops({ app, name, sanitizer }: GeneratorContext): DocumentParts {
  for (const method of app.noOpMethods) {
    if (method.isBare) continue
    const methodSig = method.signature
    const methodSigSafe = sanitizer.makeSafeStringTypeLiteral(methodSig)
    const methodName = method.uniqueName.makeSafeMethodIdentifier

    yield* jsDoc({
      description: `Calls the ${methodSig} ABI method.`,
      abiDescription: method.desc,
      params: {
        params: `Any additional parameters for the call`,
      },
      returns: `The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions`,
    })
    const updatedReturnType = `[...TReturns, ${name}Returns['${methodSigSafe}'] | undefined]`
    yield `${methodName}(params?: CallParams<${name}Args['obj']['${methodSigSafe}'] | ${name}Args['tuple']['${methodSigSafe}']>): ${name}Composer<${updatedReturnType}>`
    yield NewLine
  }
}

function* callComposerOperationMethodType(
  { name, sanitizer }: GeneratorContext,
  description: string,
  methods: AppClientMethodContext[],
  verb: 'create' | 'update' | 'optIn' | 'closeOut' | 'delete',
  includeCompilation?: boolean,
): DocumentParts {
  if (methods.length) {
    yield* jsDoc(`Gets available ${verb} methods`)
    yield `readonly ${verb}: {`
    yield IncIndent
    for (const method of methods) {
      const onComplete = verb === 'create' ? method.createActions.inputType : undefined
      if (method.isBare) {
        yield* jsDoc({
          description: `${description} using a bare call.`,
          params: {
            params: `Any additional parameters for the call`,
          },
          returns: `The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions`,
        })
        yield `bare(params${onComplete?.isOptional !== false ? '?' : ''}: AppClientBareCallParams ${
          includeCompilation ? '& AppClientCompilationParams' : ''
        }): ${name}Composer<TReturns>`
      } else {
        const uniqueName = method.uniqueName.original
        yield* jsDoc({
          description: `${description} using the ${method.signature} ABI method.`,
          params: {
            params: `Any additional parameters for the call`,
          },
          returns: `The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions`,
        })
        const methodSigSafe = sanitizer.makeSafeStringTypeLiteral(method.signature)

        const updatedReturnType = `[...TReturns, ${name}Returns['${methodSigSafe}'] | undefined]`
        yield `${sanitizer.makeSafeMethodIdentifier(uniqueName)}(params${
          onComplete?.isOptional !== false ? '?' : ''
        }: CallParams<${name}Args['obj']['${methodSigSafe}'] | ${name}Args['tuple']['${methodSigSafe}']>${includeCompilation ? ' & AppClientCompilationParams' : ''}${
          onComplete?.typeLiteral ? ` & ${onComplete.typeLiteral}` : ''
        }): ${name}Composer<${updatedReturnType}>`
      }
    }
    yield DecIndentAndCloseBlock
    yield NewLine
  }
}
