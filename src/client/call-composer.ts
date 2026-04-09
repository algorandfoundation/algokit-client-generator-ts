import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, jsDoc } from '../output/writer'
import { GeneratorContext } from './generator-context'
import { AppClientMethodContext, isAbiMethod } from './app-client-context'

export function* composeMethod(ctx: GeneratorContext): DocumentParts {
  const { name, app } = ctx
  // todo: Patrick feedback - allow common params to be passed in here so they propagate to all params calls e.g. firstValid
  yield `public newGroup(composerConfig?: TransactionComposerConfig): ${name}Composer {`
  yield IncIndent

  yield `const client = this`
  yield `const composer = this.algorand.newGroup(composerConfig)`
  yield `let promiseChain:Promise<unknown> = Promise.resolve()`
  yield `return {`
  yield IncIndent

  yield* callComposerNoops(ctx)
  if (ctx.mode === 'full') {
    yield* callComposerOperationMethods(ctx, app.updateMethods, 'update', true)
    yield* callComposerOperationMethods(ctx, app.deleteMethods, 'delete')
  }
  yield* callComposerOperationMethods(ctx, app.optInMethods, 'optIn')
  yield* callComposerOperationMethods(ctx, app.closeOutMethods, 'closeOut')
  yield* callComposerClearState(ctx)

  yield `addTransaction(txn: Transaction, signer?: TransactionSigner) {`
  yield IncIndent
  yield 'promiseChain = promiseChain.then(() => composer.addTransaction(txn, signer))'
  yield 'return this'
  yield DecIndent
  yield '},'

  yield `async composer() {`
  yield IncIndent
  yield `await promiseChain`
  yield 'return composer'
  yield DecIndent
  yield '},'

  yield `async simulate(options?: SimulateOptions) {`
  yield IncIndent
  yield `await promiseChain`
  yield `const result = await (!options ? composer.simulate() : composer.simulate(options))`
  yield `return {`
  yield IncIndent
  yield `...result,`
  yield `returns: result.returns?.map(val => val.returnValue)`
  yield DecIndentAndCloseBlock
  yield DecIndent
  yield '},'

  yield `async send(params?: SendParams) {`
  yield IncIndent
  yield `await promiseChain`
  yield `const result = await composer.send(params)`
  yield `return {`
  yield IncIndent
  yield `...result,`
  yield `returns: result.returns?.map(val => val.returnValue)`
  yield DecIndentAndCloseBlock
  yield DecIndentAndCloseBlock
  yield DecIndent
  yield `} as unknown as ${name}Composer`

  yield DecIndentAndCloseBlock
}

function* callComposerNoops({ app, name, sanitizer }: GeneratorContext): DocumentParts {
  if (app.bareMethod.callActions.noOp) {
    yield* jsDoc(`Add a bare method call to the ${app.name} contract`)
    yield `bare(params: AppClientBareCallParams & ${app.bareMethod.callActions.inputType.typeLiteral}) {`
    yield IncIndent
    yield `promiseChain = promiseChain.then(() => composer.addAppCall(client.params.bare(params)))`
    yield `return this`
    yield DecIndent
    yield '},'
  }

  for (const method of app.abiMethods) {
    const methodName = method.uniqueName.makeSafeMethodIdentifier
    const methodSigSafe = sanitizer.makeSafeStringTypeLiteral(method.signature)
    const methodNameAccessor = sanitizer.getSafeMemberAccessor(methodName)
    // Skip methods which don't support a no_op call config
    if (!method.callActions.noOp) continue
    yield* jsDoc(`Add a ${method.signature} method call against the ${app.name} contract`)
    yield `${methodName}(params: CallParams<${name}Args['obj']['${methodSigSafe}'] | ${name}Args['tuple']['${methodSigSafe}']> & ${method.callActions.inputType.typeLiteral}) {`
    yield IncIndent
    yield `promiseChain = promiseChain.then(async () => composer.addAppCallMethodCall(await client.params${methodNameAccessor}(params)))`
    yield `return this`
    yield DecIndent
    yield '},'
  }
}

function* callComposerClearState({ app }: GeneratorContext): DocumentParts {
  yield* jsDoc(`Add a clear state call to the ${app.name} contract`)
  yield `clearState(params: AppClientBareCallParams) {`
  yield IncIndent
  yield `promiseChain = promiseChain.then(() => composer.addAppCall(client.params.clearState(params)))`
  yield `return this`
  yield DecIndent
  yield '},'
}

function* callComposerOperationMethods(
  { name, sanitizer }: GeneratorContext,
  methods: AppClientMethodContext[],
  verb: 'update' | 'optIn' | 'closeOut' | 'delete',
  includeCompilation?: boolean,
): DocumentParts {
  const callType = verb === 'update' ? 'Update' : verb === 'delete' ? 'Delete' : 'Call'
  if (methods.length) {
    yield `get ${verb}() {`
    yield IncIndent
    yield `return {`
    yield IncIndent
    for (const method of methods) {
      if (!isAbiMethod(method)) {
        yield `bare: (params?: AppClientBareCallParams ${includeCompilation ? '& AppClientCompilationParams ' : ''}) => {`
        yield IncIndent
        yield `promiseChain = promiseChain.then(${verb === 'update' ? 'async ' : ''}() => composer.addApp${callType}(${verb === 'update' ? 'await ' : ''}client.params.${verb}.bare(params)))`
        yield `return this`
        yield DecIndent
        yield '},'
      } else {
        const uniqueName = method.uniqueName.original
        const methodName = sanitizer.makeSafeMethodIdentifier(uniqueName)
        const methodNameAccessor = sanitizer.getSafeMemberAccessor(methodName)
        const methodSigSafe = sanitizer.makeSafeStringTypeLiteral(method.signature)
        yield `${methodName}: (params: CallParams<${name}Args['obj']['${methodSigSafe}'] | ${name}Args['tuple']['${methodSigSafe}']>${includeCompilation ? ' & AppClientCompilationParams' : ''}) => {`
        yield IncIndent
        yield `promiseChain = promiseChain.then(async () => composer.addApp${callType}MethodCall(await client.params.${verb}${methodNameAccessor}(params)))`
        yield `return this`
        yield DecIndent
        yield '},'
      }
    }
    yield DecIndentAndCloseBlock
    yield DecIndent
    yield '},'
  }
}
