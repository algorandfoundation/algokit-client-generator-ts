import * as algokit from '@algorandfoundation/algokit-utils'
import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, indent, inline, NewLine } from '../output/writer'
import { makeSafeMethodIdentifier, makeSafeTypeIdentifier } from '../util/sanitization'
import { BARE_CALL, MethodList } from './helpers/get-call-config-summary'
import { GeneratorContext } from './generator-context'
import { getCreateOnCompleteOptions } from './deploy-types'

export function* callClient(ctx: GeneratorContext): DocumentParts {
  const { app, name } = ctx

  yield `/** A client to make calls to the ${app.contract.name} smart contract */`
  yield `export class ${makeSafeTypeIdentifier(app.contract.name)}Client {`
  yield IncIndent
  yield '/** The underlying `ApplicationClient` for when you want to have more flexibility */'
  yield 'public readonly appClient: ApplicationClient'
  yield NewLine
  yield '/**'
  yield ` * Creates a new instance of \`${makeSafeTypeIdentifier(app.contract.name)}Client\``
  yield ' * @param appDetails The details to identify the app to deploy'
  yield ' * @param algod An algod client instance'
  yield ' */'
  yield `constructor(appDetails: AppDetails, algod: Algodv2) {`
  yield IncIndent
  yield 'this.appClient = algokit.getAppClient({'
  yield* indent('...appDetails,', 'app: APP_SPEC')
  yield '}, algod)'
  yield DecIndent
  yield '}'
  yield NewLine

  yield* inline(
    `protected async mapReturnValue<TReturn>`,
    `(resultPromise: Promise<AppCallTransactionResult> | AppCallTransactionResult, returnValueFormatter?: (value: any) => TReturn): `,
    `Promise<AppCallTransactionResultOfType<TReturn>> {`,
  )
  yield IncIndent
  yield `const result = await resultPromise`
  yield `if(result.return?.decodeError) {`
  yield* indent(`throw result.return.decodeError`)
  yield `}`
  yield `const returnValue = result.return?.returnValue !== undefined && returnValueFormatter !== undefined`
  yield IncIndent
  yield `? returnValueFormatter(result.return.returnValue)`
  yield `: result.return?.returnValue as TReturn | undefined`
  yield `return { ...result, return: returnValue }`
  yield DecIndent
  yield DecIndentAndCloseBlock
  yield NewLine

  yield `/**`
  yield ` * Calls the ABI method with the matching signature using an onCompletion code of NO_OP`
  yield ` * @param request A request object containing the method signature, args, and any other relevant properties`
  yield ` * @param returnValueFormatter An optional delegate which when provided will be used to map non-undefined return values to the target type`
  yield ` */`
  yield `public call<TSignature extends keyof ${name}['methods']>(request: CallRequest<TSignature, any>, returnValueFormatter?: (value: any) => MethodReturn<TSignature>) {`
  yield IncIndent
  yield `return this.mapReturnValue<MethodReturn<TSignature>>(this.appClient.call(request), returnValueFormatter)`
  yield DecIndentAndCloseBlock
  yield NewLine

  yield* deployMethods(ctx)
  yield* clearState(ctx)
  yield* clientCallMethods(ctx)
  yield* getStateMethods(ctx)

  yield DecIndentAndCloseBlock
}

function* deployMethods(ctx: GeneratorContext): DocumentParts {
  const { app, callConfig, name } = ctx
  yield `/**`
  yield ` * Idempotently deploys the ${app.contract.name} smart contract.`
  yield ` * @param params The arguments for the contract calls and any additional parameters for the call`
  yield ` * @returns The deployment result`
  yield ` */`
  yield `public deploy(params: ${name}DeployArgs & AppClientDeployCoreParams = {}) {`
  yield IncIndent
  yield `return this.appClient.deploy({ `
  yield IncIndent
  yield `...params,`
  if (callConfig.createMethods.length)
    yield `createArgs: Array.isArray(params.createArgs) ? mapBySignature(...params.createArgs as [any, any, any]): params.createArgs,`
  if (callConfig.deleteMethods.length)
    yield `deleteArgs: Array.isArray(params.deleteArgs) ? mapBySignature(...params.deleteArgs as [any, any, any]): params.deleteArgs,`
  if (callConfig.updateMethods.length)
    yield `updateArgs: Array.isArray(params.updateArgs) ? mapBySignature(...params.updateArgs as [any, any, any]): params.updateArgs,`
  yield DecIndent
  yield `})`
  yield DecIndentAndCloseBlock
  yield NewLine
  yield* overloadedMethod(
    ctx,
    `Creates a new instance of the ${app.contract.name} smart contract`,
    callConfig.createMethods,
    'create',
    true,
  )
  yield* overloadedMethod(
    ctx,
    `Updates an existing instance of the ${app.contract.name} smart contract`,
    callConfig.updateMethods,
    'update',
    true,
  )
  yield* overloadedMethod(
    ctx,
    `Deletes an existing instance of the ${app.contract.name} smart contract`,
    callConfig.deleteMethods,
    'delete',
  )
  yield* overloadedMethod(
    ctx,
    `Opts the user into an existing instance of the ${app.contract.name} smart contract`,
    callConfig.optInMethods,
    'optIn',
  )
  yield* overloadedMethod(
    ctx,
    `Makes a close out call to an existing instance of the ${app.contract.name} smart contract`,
    callConfig.closeOutMethods,
    'closeOut',
  )
}

function* overloadedMethod(
  { app, methodSignatureToUniqueName }: GeneratorContext,
  description: string,
  methods: MethodList,
  verb: 'create' | 'update' | 'optIn' | 'closeOut' | 'delete',
  includeCompilation?: boolean,
): DocumentParts {
  if (methods.length) {
    for (const methodSig of methods) {
      const onComplete = verb === 'create' ? getCreateOnCompleteOptions(methodSig, app) : undefined
      if (methodSig === BARE_CALL) {
        yield `/**`
        yield ` * ${description} using a bare call.`
        yield ` * @param args The arguments for the bare call`
        yield ` * @returns The ${verb} result`
        yield ` */`
        yield `public ${verb}(args: BareCallArgs & AppClientCallCoreParams ${
          includeCompilation ? '& AppClientCompilationParams ' : ''
        }& CoreAppCallArgs${onComplete?.type ? ` & ${onComplete.type}` : ''}): Promise<AppCallTransactionResultOfType<undefined>>;`
      } else {
        const uniqueName = methodSignatureToUniqueName[methodSig]
        yield `/**`
        yield ` * ${description} using the ${methodSig} ABI method.`
        yield ` * @param method The ABI method to use`
        yield ` * @param args The arguments for the contract call`
        yield ` * @param params Any additional parameters for the call`
        yield ` * @returns The ${verb} result`
        yield ` */`
        yield `public ${verb}(method: '${methodSig}'${
          methodSig === uniqueName ? '' : ` | '${uniqueName}'`
        }, args: MethodArgs<'${methodSig}'>, params?: AppClientCallCoreParams ${includeCompilation ? '& AppClientCompilationParams ' : ''}${
          onComplete?.type ? ` & ${onComplete.type}` : ''
        }): Promise<AppCallTransactionResultOfType<MethodReturn<'${methodSig}'>>>;`
      }
    }
    yield `public ${verb}(...args: any[]): Promise<AppCallTransactionResultOfType<unknown>> {`
    yield IncIndent
    yield `if(typeof args[0] !== 'string') {`
    yield* indent(`return this.appClient.${verb}({...args[0], })`)
    yield '} else {'
    yield* indent(`return this.appClient.${verb}({ ...mapBySignature(args[0] as any, args[1], args[2]), })`)
    yield '}'
    yield DecIndentAndCloseBlock
    yield NewLine
  }
}

function* clearState({ app }: GeneratorContext): DocumentParts {
  yield `/**`
  yield ` * Makes a clear_state call to an existing instance of the ${app.contract.name} smart contract.`
  yield ` * @param args The arguments for the contract call`
  yield ` * @param params Any additional parameters for the call`
  yield ` * @returns The clear_state result`
  yield ` */`
  yield `public clearState(args: BareCallArgs, params?: AppClientCallCoreParams & CoreAppCallArgs) {`
  yield IncIndent
  yield `return this.appClient.clearState({ ...args, ...params, })`
  yield DecIndentAndCloseBlock
  yield NewLine
}

function* clientCallMethods({ app, name, callConfig, methodSignatureToUniqueName }: GeneratorContext): DocumentParts {
  for (const method of app.contract.methods) {
    const methodSignature = algokit.getABIMethodSignature(method)
    const methodName = makeSafeMethodIdentifier(methodSignatureToUniqueName[methodSignature])
    // Skip methods which don't support a no_op call config
    if (!callConfig.callMethods.includes(methodSignature)) continue
    yield `/**`
    if (method.desc) {
      yield ` * ${method.desc}`
      yield ` *`
    }
    yield ` * Calls the ${algokit.getABIMethodSignature(method)} ABI method.`
    yield ` *`
    yield ` * @param args The arguments for the ABI method`
    yield ` * @param params Any additional parameters for the call`
    yield ` * @returns The result of the call`
    yield ` */`
    yield `public ${methodName}(args: MethodArgs<'${methodSignature}'>, params?: AppClientCallCoreParams & CoreAppCallArgs) {`
    yield IncIndent
    const outputTypeName = app.hints?.[methodSignature]?.structs?.output?.name
    yield `return this.call(${name}CallFactory.${methodName}(args, params)${
      outputTypeName === undefined ? '' : `, ${makeSafeTypeIdentifier(outputTypeName)}`
    })`
    yield DecIndent
    yield '}'
    yield NewLine
  }
}

function* getStateMethods({ app, name }: GeneratorContext): DocumentParts {
  const globalStateValues = app.schema.global?.declared && Object.values(app.schema.global?.declared)
  const localStateValues = app.schema.local?.declared && Object.values(app.schema.local?.declared)
  if (globalStateValues?.length || localStateValues?.length) {
    yield `private static getBinaryState(state: AppState, key: string): BinaryState | undefined {`
    yield IncIndent
    yield `const value = state[key]`
    yield `if (!value) return undefined`
    yield `if (!('valueRaw' in value))`
    yield* indent(`throw new Error(\`Failed to parse state value for \${key}; received an int when expected a byte array\`)`)
    yield `return {`
    yield IncIndent
    yield `asString(): string {`
    yield* indent(`return value.value`)
    yield `},`
    yield `asByteArray(): Uint8Array {`
    yield* indent(`return value.valueRaw`)
    yield `}`
    yield DecIndentAndCloseBlock
    yield DecIndentAndCloseBlock
    yield NewLine

    yield `private static getIntegerState(state: AppState, key: string): IntegerState | undefined {`
    yield IncIndent
    yield `const value = state[key]`
    yield `if (!value) return undefined`
    yield `if ('valueRaw' in value)`
    yield* indent(`throw new Error(\`Failed to parse state value for \${key}; received a byte array when expected a number\`)`)
    yield `return {`
    yield IncIndent
    yield `asBigInt() {`
    yield* indent(`return typeof value.value === 'bigint' ? value.value : BigInt(value.value)`)
    yield `},`
    yield `asNumber(): number {`
    yield* indent(`return typeof value.value === 'bigint' ? Number(value.value) : value.value`)
    yield `},`
    yield DecIndentAndCloseBlock
    yield DecIndentAndCloseBlock
    yield NewLine
  }

  if (globalStateValues?.length) {
    yield `/**`
    yield ` * Returns the application's global state wrapped in a strongly typed accessor with options to format the stored value`
    yield ` */`
    yield `public async getGlobalState(): Promise<${name}['state']['global']> {`
    yield IncIndent
    yield `const state = await this.appClient.getGlobalState()`
    yield `return {`
    yield IncIndent
    for (const stateValue of globalStateValues) {
      yield `get ${stateValue.key}() {`
      if (stateValue.type === 'uint64') {
        yield* indent(`return ${name}Client.getIntegerState(state, '${stateValue.key}')`)
      } else {
        yield* indent(`return ${name}Client.getBinaryState(state, '${stateValue.key}')`)
      }
      yield '},'
    }
    yield DecIndentAndCloseBlock
    yield DecIndentAndCloseBlock
    yield NewLine
  }

  if (localStateValues?.length) {
    yield `/**`
    yield ` * Returns the application's local state for a given account wrapped in a strongly typed accessor with options to format the stored value`
    yield ` * @param account The address of the account for which to read local state from.`
    yield ` */`
    yield `public async getLocalState(account: string | SendTransactionFrom): Promise<${name}['state']['local']> {`
    yield IncIndent
    yield `const state = await this.appClient.getLocalState(account)`
    yield `return {`
    yield IncIndent
    for (const stateValue of localStateValues) {
      yield `get ${stateValue.key}() {`
      if (stateValue.type === 'uint64') {
        yield* indent(`return ${name}Client.getIntegerState(state, '${stateValue.key}')`)
      } else {
        yield* indent(`return ${name}Client.getBinaryState(state, '${stateValue.key}')`)
      }
      yield '},'
    }
    yield DecIndentAndCloseBlock
    yield DecIndentAndCloseBlock
    yield NewLine
  }
}
