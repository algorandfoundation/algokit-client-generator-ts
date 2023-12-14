import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent } from '../output/writer'
import { GeneratorContext } from './generator-context'
import * as algokit from '@algorandfoundation/algokit-utils'
import { makeSafeMethodIdentifier } from '../util/sanitization'
import { BARE_CALL, MethodList } from './helpers/get-call-config-summary'
import { getCreateOnCompleteOptions } from './deploy-types'

export function* composeMethod(ctx: GeneratorContext): DocumentParts {
  const { name, callConfig } = ctx
  yield `public compose(): ${name}Composer {`
  yield IncIndent

  yield `const client = this`
  yield `const atc = new AtomicTransactionComposer()`
  yield `let promiseChain:Promise<unknown> = Promise.resolve()`
  yield `const resultMappers: Array<undefined | ((x: any) => any)> = []`
  yield `return {`
  yield IncIndent

  yield* callComposerNoops(ctx)
  yield* callComposerOperationMethods(ctx, callConfig.updateMethods, 'update', true)
  yield* callComposerOperationMethods(ctx, callConfig.deleteMethods, 'delete')
  yield* callComposerOperationMethods(ctx, callConfig.optInMethods, 'optIn')
  yield* callComposerOperationMethods(ctx, callConfig.closeOutMethods, 'closeOut')
  yield* callComposerClearState()

  yield `addTransaction(txn: TransactionWithSigner | TransactionToSign | Transaction | Promise<SendTransactionResult>, defaultSender?: SendTransactionFrom) {`
  yield IncIndent
  yield 'promiseChain = promiseChain.then(async () => atc.addTransaction(await algokit.getTransactionWithSigner(txn, defaultSender ??' +
    ' client.sender)))'
  yield 'return this'
  yield DecIndent
  yield '},'

  yield `async atc() {`
  yield IncIndent
  yield 'await promiseChain'
  yield 'return atc'
  yield DecIndent
  yield '},'

  yield `async simulate() {`
  yield IncIndent
  yield `await promiseChain`
  yield `const result = await atc.simulate(client.algod)`
  yield `return result`
  yield DecIndent
  yield '},'

  yield `async execute() {`
  yield IncIndent
  yield `await promiseChain`
  yield `const result = await algokit.sendAtomicTransactionComposer({ atc, sendParams: {} }, client.algod)`
  yield `return {`
  yield IncIndent
  yield `...result,`
  yield `returns: result.returns?.map((val, i) => resultMappers[i] !== undefined ? resultMappers[i]!(val.returnValue) : val.returnValue)`
  yield DecIndentAndCloseBlock
  yield DecIndentAndCloseBlock
  yield DecIndent
  yield `} as unknown as ${name}Composer`

  yield DecIndentAndCloseBlock
}

function* callComposerNoops({ app, callConfig, methodSignatureToUniqueName }: GeneratorContext): DocumentParts {
  for (const method of app.contract.methods) {
    const methodSignature = algokit.getABIMethodSignature(method)
    const methodName = makeSafeMethodIdentifier(methodSignatureToUniqueName[methodSignature])
    // Skip methods which don't support a no_op call config
    if (!callConfig.callMethods.includes(methodSignature)) continue

    yield `${methodName}(args: MethodArgs<'${methodSignature}'>, params?: AppClientCallCoreParams & CoreAppCallArgs) {`
    yield IncIndent
    yield `promiseChain = promiseChain.then(() => client.${methodName}(args, {...params, sendParams: {...params?.sendParams, skipSending: true, atc}}))`
    const outputTypeName = app.hints?.[methodSignature]?.structs?.output?.name
    yield `resultMappers.push(${outputTypeName ?? 'undefined'})`
    yield `return this`
    yield DecIndent
    yield '},'
  }
}

function* callComposerClearState(): DocumentParts {
  yield `clearState(args?: BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs) {`
  yield IncIndent
  yield `promiseChain = promiseChain.then(() => client.clearState({...args, sendParams: {...args?.sendParams, skipSending: true, atc}}))`
  yield `resultMappers.push(undefined)`
  yield `return this`
  yield DecIndent
  yield '},'
}

function* callComposerOperationMethods(
  { app, methodSignatureToUniqueName }: GeneratorContext,
  methods: MethodList,
  verb: 'create' | 'update' | 'optIn' | 'closeOut' | 'delete',
  includeCompilation?: boolean,
): DocumentParts {
  if (methods.length) {
    yield `get ${verb}() {`
    yield IncIndent
    yield `const $this = this`
    yield `return {`
    yield IncIndent
    for (const methodSig of methods) {
      const onComplete = verb === 'create' ? getCreateOnCompleteOptions(methodSig, app) : undefined
      if (methodSig === BARE_CALL) {
        yield `bare(args${onComplete?.isOptional !== false ? '?' : ''}: BareCallArgs & AppClientCallCoreParams ${
          includeCompilation ? '& AppClientCompilationParams ' : ''
        }& CoreAppCallArgs${onComplete?.type ? ` & ${onComplete.type}` : ''}) {`
        yield IncIndent
        yield `promiseChain = promiseChain.then(() => client.${verb}.bare({...args, sendParams: {...args?.sendParams, skipSending: true, atc}}))`
        yield `resultMappers.push(undefined)`
        yield `return $this`
        yield DecIndent
        yield '},'
      } else {
        const uniqueName = methodSignatureToUniqueName[methodSig]
        const methodName = makeSafeMethodIdentifier(uniqueName)
        yield `${methodName}(args: MethodArgs<'${methodSig}'>, params${
          onComplete?.isOptional !== false ? '?' : ''
        }: AppClientCallCoreParams${includeCompilation ? ' & AppClientCompilationParams' : ''}${
          onComplete?.type ? ` & ${onComplete.type}` : ''
        }) {`
        yield IncIndent
        yield `promiseChain = promiseChain.then(() => client.${verb}.${methodName}(args, {...params, sendParams: {...params?.sendParams, skipSending: true, atc}}))`
        const outputTypeName = app.hints?.[methodSig]?.structs?.output?.name
        yield `resultMappers.push(${outputTypeName ?? 'undefined'})`
        yield `return $this`
        yield DecIndent
        yield '},'
      }
    }
    yield DecIndentAndCloseBlock
    yield DecIndent
    yield '},'
  }
}
