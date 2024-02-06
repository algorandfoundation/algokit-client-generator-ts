import * as algokit from '@algorandfoundation/algokit-utils'
import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, indent, inline, jsDoc, NewLine } from '../output/writer'

import { BARE_CALL, MethodList } from './helpers/get-call-config-summary'
import { GeneratorContext } from './generator-context'
import { getCreateOnCompleteOptions } from './deploy-types'
import { composeMethod } from './call-composer'

export function* callClient(ctx: GeneratorContext): DocumentParts {
  const { app, name } = ctx

  yield* jsDoc(`A client to make calls to the ${app.contract.name} smart contract`)
  yield `export class ${ctx.sanitizer.makeSafeTypeIdentifier(app.contract.name)}Client {`
  yield IncIndent
  yield* jsDoc(`The underlying \`ApplicationClient\` for when you want to have more flexibility`)
  yield 'public readonly appClient: ApplicationClient'
  yield NewLine
  yield `private readonly sender: SendTransactionFrom | undefined`
  yield NewLine

  yield* jsDoc({
    description: `Creates a new instance of \`${ctx.sanitizer.makeSafeTypeIdentifier(app.contract.name)}Client\``,
    params: {
      appDetails: 'appDetails The details to identify the app to deploy',
      algod: 'An algod client instance',
    },
  })

  yield `constructor(appDetails: AppDetails, private algod: Algodv2) {`
  yield IncIndent
  yield `this.sender = appDetails.sender`
  yield 'this.appClient = algokit.getAppClient({'
  yield* indent('...appDetails,', 'app: APP_SPEC')
  yield '}, algod)'
  yield DecIndent
  yield '}'
  yield NewLine

  yield* jsDoc({
    description: 'Checks for decode errors on the AppCallTransactionResult and maps the return value to the specified generic type',
    params: {
      result: 'The AppCallTransactionResult to be mapped',
      returnValueFormatter: 'An optional delegate to format the return value if required',
    },
    returns: 'The smart contract response with an updated return value',
  })
  yield* inline(
    `protected mapReturnValue<TReturn, TResult extends AppCallTransactionResult = AppCallTransactionResult>`,
    `(result: AppCallTransactionResult, returnValueFormatter?: (value: any) => TReturn): `,
    `AppCallTransactionResultOfType<TReturn> & TResult {`,
  )
  yield IncIndent
  yield `if(result.return?.decodeError) {`
  yield* indent(`throw result.return.decodeError`)
  yield `}`
  yield `const returnValue = result.return?.returnValue !== undefined && returnValueFormatter !== undefined`
  yield IncIndent
  yield `? returnValueFormatter(result.return.returnValue)`
  yield `: result.return?.returnValue as TReturn | undefined`
  yield `return { ...result, return: returnValue } as AppCallTransactionResultOfType<TReturn> & TResult`
  yield DecIndent
  yield DecIndentAndCloseBlock
  yield NewLine

  yield* jsDoc({
    description: 'Calls the ABI method with the matching signature using an onCompletion code of NO_OP',
    params: {
      typedCallParams: 'An object containing the method signature, args, and any other relevant parameters',
      returnValueFormatter: 'An optional delegate which when provided will be used to map non-undefined return values to the target type',
    },
    returns: 'The result of the smart contract call',
  })
  yield `public async call<TSignature extends keyof ${name}['methods']>(typedCallParams: TypedCallParams<TSignature>, returnValueFormatter?: (value: any) => MethodReturn<TSignature>) {`
  yield IncIndent
  yield `return this.mapReturnValue<MethodReturn<TSignature>>(await this.appClient.call(typedCallParams), returnValueFormatter)`
  yield DecIndentAndCloseBlock
  yield NewLine

  yield* opMethods(ctx)
  yield* clearState(ctx)
  yield* noopMethods(ctx)
  yield* getStateMethods(ctx)
  yield* composeMethod(ctx)
  yield DecIndentAndCloseBlock
}

function* opMethods(ctx: GeneratorContext): DocumentParts {
  const { app, callConfig, name } = ctx

  yield* jsDoc({
    description: `Idempotently deploys the ${app.contract.name} smart contract.`,
    params: {
      params: 'The arguments for the contract calls and any additional parameters for the call',
    },
    returns: 'The deployment result',
  })
  yield `public deploy(params: ${name}DeployArgs & AppClientDeployCoreParams = {}): ReturnType<ApplicationClient['deploy']> {`
  yield IncIndent

  if (callConfig.createMethods.length) yield `const createArgs = params.createCall?.(${name}CallFactory.create)`
  if (callConfig.updateMethods.length) yield `const updateArgs = params.updateCall?.(${name}CallFactory.update)`
  if (callConfig.deleteMethods.length) yield `const deleteArgs = params.deleteCall?.(${name}CallFactory.delete)`

  yield `return this.appClient.deploy({`
  yield IncIndent
  yield `...params,`
  if (callConfig.updateMethods.length) yield 'updateArgs,'
  if (callConfig.deleteMethods.length) yield 'deleteArgs,'
  if (callConfig.createMethods.length) {
    yield 'createArgs,'
    yield `createOnCompleteAction: createArgs?.onCompleteAction,`
  }
  yield DecIndent
  yield `})`
  yield DecIndentAndCloseBlock
  yield NewLine
  yield* operationMethod(ctx, `Creates a new instance of the ${app.contract.name} smart contract`, callConfig.createMethods, 'create', true)
  yield* operationMethod(
    ctx,
    `Updates an existing instance of the ${app.contract.name} smart contract`,
    callConfig.updateMethods,
    'update',
    true,
  )
  yield* operationMethod(ctx, `Deletes an existing instance of the ${app.contract.name} smart contract`, callConfig.deleteMethods, 'delete')
  yield* operationMethod(
    ctx,
    `Opts the user into an existing instance of the ${app.contract.name} smart contract`,
    callConfig.optInMethods,
    'optIn',
  )
  yield* operationMethod(
    ctx,
    `Makes a close out call to an existing instance of the ${app.contract.name} smart contract`,
    callConfig.closeOutMethods,
    'closeOut',
  )
}

function* operationMethod(
  { app, methodSignatureToUniqueName, name, sanitizer }: GeneratorContext,
  description: string,
  methods: MethodList,
  verb: 'create' | 'update' | 'optIn' | 'closeOut' | 'delete',
  includeCompilation?: boolean,
): DocumentParts {
  let responseTypeGenericParam
  switch (verb) {
    case 'create':
      responseTypeGenericParam = ', AppCreateCallTransactionResult'
      break
    case 'update':
      responseTypeGenericParam = ', AppUpdateCallTransactionResult'
      break
    default:
      responseTypeGenericParam = ''
      break
  }
  if (methods.length) {
    yield* jsDoc(`Gets available ${verb} methods`)
    yield `public get ${verb}() {`
    yield IncIndent
    yield `const $this = this`
    yield `return {`
    yield IncIndent
    for (const methodSig of methods) {
      const onComplete = verb === 'create' ? getCreateOnCompleteOptions(methodSig, app) : undefined
      if (methodSig === BARE_CALL) {
        yield* jsDoc({
          description: `${description} using a bare call.`,
          params: {
            args: `The arguments for the bare call`,
          },
          returns: `The ${verb} result`,
        })
        yield `async bare(args: BareCallArgs & AppClientCallCoreParams ${
          includeCompilation ? '& AppClientCompilationParams ' : ''
        }& CoreAppCallArgs${onComplete?.type ? ` & ${onComplete.type}` : ''}${onComplete?.isOptional !== false ? ' = {}' : ''}) {`
        yield* indent(`return $this.mapReturnValue<undefined${responseTypeGenericParam}>(await $this.appClient.${verb}(args))`)
        yield '},'
      } else {
        const uniqueName = methodSignatureToUniqueName[methodSig]
        const method = app.contract.methods.find((m) => algokit.getABIMethodSignature(m) === methodSig)
        yield* jsDoc({
          description: `${description} using the ${methodSig} ABI method.`,
          params: {
            args: `The arguments for the smart contract call`,
            params: `Any additional parameters for the call`,
          },
          returns: `The ${verb} result${method?.returns?.desc ? `: ${method.returns.desc}` : ''}`,
        })
        const methodName = sanitizer.makeSafeMethodIdentifier(uniqueName)
        const methodNameAccessor = sanitizer.getSafeMemberAccessor(methodName)
        const methodSigSafe = sanitizer.makeSafeStringTypeLiteral(methodSig)
        yield `async ${methodName}(args: MethodArgs<'${methodSigSafe}'>, params: AppClientCallCoreParams${
          includeCompilation ? ' & AppClientCompilationParams' : ''
        }${onComplete?.type ? ` & ${onComplete.type}` : ''}${onComplete?.isOptional !== false ? ' = {}' : ''}) {`
        yield* indent(
          `return $this.mapReturnValue<MethodReturn<'${methodSigSafe}'>${responseTypeGenericParam}>(await $this.appClient.${verb}(${name}CallFactory.${verb}${methodNameAccessor}(args, params)))`,
        )
        yield '},'
      }
    }
    yield DecIndentAndCloseBlock
    yield DecIndentAndCloseBlock
    yield NewLine
  }
}

function* clearState({ app }: GeneratorContext): DocumentParts {
  yield* jsDoc({
    description: `Makes a clear_state call to an existing instance of the ${app.contract.name} smart contract.`,
    params: {
      args: `The arguments for the bare call`,
    },
    returns: `The clear_state result`,
  })
  yield `public clearState(args: BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs = {}) {`
  yield IncIndent
  yield `return this.appClient.clearState(args)`
  yield DecIndentAndCloseBlock
  yield NewLine
}

function* noopMethods({ app, name, callConfig, methodSignatureToUniqueName, sanitizer }: GeneratorContext): DocumentParts {
  for (const method of app.contract.methods) {
    const methodSignature = algokit.getABIMethodSignature(method)
    const methodName = sanitizer.makeSafeMethodIdentifier(methodSignatureToUniqueName[methodSignature])
    const methodNameAccessor = sanitizer.getSafeMemberAccessor(methodName)
    // Skip methods which don't support a no_op call config
    if (!callConfig.callMethods.includes(methodSignature)) continue
    yield* jsDoc({
      description: `Calls the ${algokit.getABIMethodSignature(method)} ABI method.`,
      abiDescription: method.desc,
      params: {
        args: `The arguments for the contract call`,
        params: `Any additional parameters for the call`,
      },
      returns: `The result of the call${method?.returns?.desc ? `: ${method.returns.desc}` : ''}`,
    })
    const methodSignatureSafe = sanitizer.makeSafeStringTypeLiteral(methodSignature)
    yield `public ${methodName}(args: MethodArgs<'${methodSignatureSafe}'>, params: AppClientCallCoreParams & CoreAppCallArgs = {}) {`
    yield IncIndent
    const outputTypeName = app.hints?.[methodSignature]?.structs?.output?.name
    yield `return this.call(${name}CallFactory${methodNameAccessor}(args, params)${
      outputTypeName === undefined ? '' : `, ${sanitizer.makeSafeTypeIdentifier(outputTypeName)}`
    })`
    yield DecIndent
    yield '}'
    yield NewLine
  }
}

function* getStateMethods({ app, name, sanitizer }: GeneratorContext): DocumentParts {
  const globalStateValues = app.schema.global?.declared && Object.values(app.schema.global?.declared)
  const localStateValues = app.schema.local?.declared && Object.values(app.schema.local?.declared)
  if (globalStateValues?.length || localStateValues?.length) {
    yield* jsDoc({
      description: 'Extracts a binary state value out of an AppState dictionary',
      params: {
        state: 'The state dictionary containing the state value',
        key: 'The key of the state value',
      },
      returns: 'A BinaryState instance containing the state value, or undefined if the key was not found',
    })
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

    yield* jsDoc({
      description: 'Extracts a integer state value out of an AppState dictionary',
      params: {
        state: 'The state dictionary containing the state value',
        key: 'The key of the state value',
      },
      returns: 'An IntegerState instance containing the state value, or undefined if the key was not found',
    })
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
    yield* jsDoc(`Returns the smart contract's global state wrapped in a strongly typed accessor with options to format the stored value`)
    yield `public async getGlobalState(): Promise<${name}['state']['global']> {`
    yield IncIndent
    yield `const state = await this.appClient.getGlobalState()`
    yield `return {`
    yield IncIndent
    for (const stateValue of globalStateValues) {
      const stateKey = sanitizer.makeSafePropertyIdentifier(stateValue.key)
      const stateKeyLiteral = sanitizer.makeSafeStringTypeLiteral(stateValue.key)
      yield `get ${stateKey}() {`
      if (stateValue.type === 'uint64') {
        yield* indent(`return ${name}Client.getIntegerState(state, '${stateKeyLiteral}')`)
      } else {
        yield* indent(`return ${name}Client.getBinaryState(state, '${stateKeyLiteral}')`)
      }
      yield '},'
    }
    yield DecIndentAndCloseBlock
    yield DecIndentAndCloseBlock
    yield NewLine
  }

  if (localStateValues?.length) {
    yield* jsDoc({
      description: `Returns the smart contract's local state wrapped in a strongly typed accessor with options to format the stored value`,
      params: {
        account: `The address of the account for which to read local state from`,
      },
    })
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
