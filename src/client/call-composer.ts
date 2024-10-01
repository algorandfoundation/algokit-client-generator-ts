import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, jsDoc } from '../output/writer'
import { GeneratorContext } from './generator-context'
import { BARE_CALL, MethodList } from './helpers/get-call-config-summary'
import { getCallOnCompleteOptions } from './deploy-types'
import { ABIMethod, ABIMethodParams } from 'algosdk'

export function* composeMethod(ctx: GeneratorContext): DocumentParts {
  const { name, callConfig } = ctx
  yield `public newGroup(): ${name}Composer {`
  yield IncIndent

  yield `const client = this`
  yield `const composer = client.appClient.newGroup()`
  yield `let promiseChain:Promise<unknown> = Promise.resolve()`
  yield `const resultMappers: Array<undefined | ((x: ABIReturn | undefined) => any)> = []`
  yield `return {`
  yield IncIndent

  yield* callComposerNoops(ctx)
  yield* callComposerOperationMethods(ctx, callConfig.updateMethods, 'update', true)
  yield* callComposerOperationMethods(ctx, callConfig.deleteMethods, 'delete')
  yield* callComposerOperationMethods(ctx, callConfig.optInMethods, 'optIn')
  yield* callComposerOperationMethods(ctx, callConfig.closeOutMethods, 'closeOut')
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
  yield `const result = await composer.simulate(options)`
  yield `return {`
  yield IncIndent
  yield `...result,`
  yield `returns: result.returns?.map((val, i) => resultMappers[i] !== undefined ? resultMappers[i]!(val) : val.returnValue)`
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
  yield `returns: result.returns?.map((val, i) => resultMappers[i] !== undefined ? resultMappers[i]!(val) : val.returnValue)`
  yield DecIndentAndCloseBlock
  yield DecIndentAndCloseBlock
  yield DecIndent
  yield `} as unknown as ${name}Composer`

  yield DecIndentAndCloseBlock
}

function* callComposerNoops({ app, callConfig, methodSignatureToUniqueName, sanitizer }: GeneratorContext): DocumentParts {
  if (callConfig.callMethods.includes(BARE_CALL)) {
    yield* jsDoc(`Add a bare method call to the ${app.name} contract`)
    yield `bare(params: AppClientBareCallParams & ${getCallOnCompleteOptions(BARE_CALL, app).type}) {`
    yield IncIndent
    yield `promiseChain = promiseChain.then(() => composer.addAppCall(client.params.bare(params)))`
    yield `return this`
    yield DecIndent
    yield '},'
  }

  for (const methodSignature of callConfig.callMethods.filter((m) => m !== BARE_CALL).map((m) => m as string)) {
    const methodName = sanitizer.makeSafeMethodIdentifier(methodSignatureToUniqueName[methodSignature])
    const methodSignatureSafe = sanitizer.makeSafeStringTypeLiteral(methodSignature)
    const methodNameAccessor = sanitizer.getSafeMemberAccessor(methodName)
    // Skip methods which don't support a no_op call config
    if (!callConfig.callMethods.includes(methodSignature)) continue
    yield* jsDoc(`Add a ${methodSignature} method call against the ${app.name} contract`)
    yield `${methodName}(params: CallParams<'${methodSignatureSafe}'> & ${getCallOnCompleteOptions(methodSignature, app).type}) {`
    yield IncIndent
    yield `promiseChain = promiseChain.then(async () => composer.addAppCallMethodCall(await client.params${methodNameAccessor}(params)))`
    const outputTypeName = app.methods.find((m: ABIMethodParams) => new ABIMethod(m).getSignature() === methodSignature)?.returns.type
    yield `resultMappers.push(${outputTypeName && outputTypeName !== 'void' ? `(v) => client.decodeReturnValue('${methodSignatureSafe}', v)` : 'undefined'})`
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
  { app, methodSignatureToUniqueName, sanitizer }: GeneratorContext,
  methods: MethodList,
  verb: 'update' | 'optIn' | 'closeOut' | 'delete',
  includeCompilation?: boolean,
): DocumentParts {
  const callType = verb === 'update' ? 'Update' : verb === 'delete' ? 'Delete' : 'Call'
  if (methods.length) {
    yield `get ${verb}() {`
    yield IncIndent
    yield `return {`
    yield IncIndent
    for (const methodSig of methods) {
      if (methodSig === BARE_CALL) {
        yield `bare: (params?: AppClientBareCallParams ${includeCompilation ? '& AppClientCompilationParams ' : ''}) => {`
        yield IncIndent
        yield `promiseChain = promiseChain.then(${verb === 'update' ? 'async ' : ''}() => composer.addApp${callType}(${verb === 'update' ? 'await ' : ''}client.params.${verb}.bare(params)))`
        yield `return this`
        yield DecIndent
        yield '},'
      } else {
        const uniqueName = methodSignatureToUniqueName[methodSig]
        const methodName = sanitizer.makeSafeMethodIdentifier(uniqueName)
        const methodNameAccessor = sanitizer.getSafeMemberAccessor(methodName)
        const methodSigSafe = sanitizer.makeSafeStringTypeLiteral(methodSig)
        yield `${methodName}: (params: CallParams<'${methodSigSafe}'>${includeCompilation ? ' & AppClientCompilationParams' : ''}) => {`
        yield IncIndent
        yield `promiseChain = promiseChain.then(async () => composer.addApp${callType}MethodCall(await client.params.${verb}${methodNameAccessor}(params)))`
        const outputTypeName = app.methods.find((m: ABIMethodParams) => new ABIMethod(m).getSignature() === methodSig)?.returns.type
        yield `resultMappers.push(${outputTypeName && outputTypeName !== 'void' ? `(v) => client.decodeReturnValue('${methodSigSafe}', v)` : 'undefined'})`
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
