import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, indent, jsDoc, NewLine } from '../output/writer'
import { BARE_CALL, MethodList } from './helpers/get-call-config-summary'
import { GeneratorContext } from './generator-context'
import { getCallOnCompleteOptions, getCreateOnCompleteOptions } from './deploy-types'
import { composeMethod } from './call-composer'
import { ABIMethod } from 'algosdk'
import { Method } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { getEquivalentType } from './helpers/get-equivalent-type'

export function* appClient(ctx: GeneratorContext): DocumentParts {
  const { app, name } = ctx

  yield* jsDoc(`A client to make calls to the ${app.name} smart contract`)
  yield `export class ${name}Client {`
  yield IncIndent
  yield* jsDoc(`The underlying \`AppClient\` for when you want to have more flexibility`)
  yield 'public readonly appClient: _AppClient'
  yield NewLine

  yield `
    /**
     * Creates a new instance of \`${name}Client\`
     *
     * @param appClient An \`AppClient\` instance which has been created with the ${name} app spec
     */
    constructor(appClient: _AppClient)
    /**
     * Creates a new instance of \`${name}Client\`
     *
     * @param params The parameters to initialise the app client with
     */
    constructor(params: Omit<AppClientParams, 'appSpec'>)
    constructor(appClientOrParams: _AppClient | Omit<AppClientParams, 'appSpec'>) {
      this.appClient = appClientOrParams instanceof _AppClient ? appClientOrParams : new _AppClient({
        ...appClientOrParams,
        appSpec: APP_SPEC,
      })
    }

    /**
     * Checks for decode errors on the given return value and maps the return value to the return type for the given method
     * @returns The typed return value or undefined if there was no value
     */
    decodeReturnValue<TSignature extends ${name}NonVoidMethodSignatures>(method: TSignature, returnValue: ABIReturn | undefined) {
      return returnValue !== undefined ? getArc56ReturnValue<MethodReturn<TSignature>>(returnValue, this.appClient.getABIMethod(method), APP_SPEC.structs) : undefined
    }

    /**
     * Returns a new \`${name}Client\` client, resolving the app by creator address and name
     * using AlgoKit app deployment semantics (i.e. looking for the app creation transaction note).
     * @param params The parameters to create the app client
     */
    public static async fromCreatorAndName(params: Omit<ResolveAppClientByCreatorAndName, 'appSpec'>): Promise<${name}Client> {
      return new ${name}Client(await _AppClient.fromCreatorAndName({...params, appSpec: APP_SPEC}))
    }

    /**
     * Returns an \`${name}Client\` instance for the current network based on
     * pre-determined network-specific app IDs specified in the ARC-56 app spec.
     *
     * If no IDs are in the app spec or the network isn't recognised, an error is thrown.
     * @param params The parameters to create the app client
     */
    static async fromNetwork(
      params: Omit<ResolveAppClientByNetwork, 'appSpec'>
    ): Promise<${name}Client> {
      return new ${name}Client(await _AppClient.fromNetwork({...params, appSpec: APP_SPEC}))
    }

    /** The ID of the app instance this client is linked to. */
    public get appId() {
      return this.appClient.appId
    }

    /** The app address of the app instance this client is linked to. */
    public get appAddress() {
      return this.appClient.appAddress
    }

    /** The name of the app. */
    public get appName() {
      return this.appClient.appName
    }

    /** The ARC-56 app spec being used */
    public get appSpec() {
      return this.appClient.appSpec
    }

    /** A reference to the underlying \`AlgorandClient\` this app client is using. */
    public get algorand(): AlgorandClientInterface {
      return this.appClient.algorand
    }

  `

  yield* params(ctx)
  yield* createTransaction(ctx)
  yield* send(ctx)
  yield* cloneMethod(ctx)
  yield* readonlyMethods(ctx)
  yield* getStateMethods(ctx)
  yield* composeMethod(ctx)
  yield DecIndentAndCloseBlock
}

function* params(ctx: GeneratorContext): DocumentParts {
  yield* jsDoc(
    `Get parameters to create transactions for the current app. A good mental model for this is that these parameters represent a deferred transaction creation.`,
  )
  yield `readonly params = {`
  yield IncIndent
  yield* opMethods(ctx, 'params')
  yield* clearState(ctx, 'params')
  yield* call(ctx, 'params')
  yield* noopMethods(ctx, 'params')
  yield DecIndentAndCloseBlock
  yield NewLine
}

function* createTransaction(ctx: GeneratorContext): DocumentParts {
  yield* jsDoc(`Create transactions for the current app`)
  yield `readonly createTransaction = {`
  yield IncIndent
  yield* opMethods(ctx, 'createTransaction')
  yield* clearState(ctx, 'createTransaction')
  yield* call(ctx, 'createTransaction')
  yield* noopMethods(ctx, 'createTransaction')
  yield DecIndentAndCloseBlock
  yield NewLine
}

function* send(ctx: GeneratorContext): DocumentParts {
  yield* jsDoc(`Send calls to the current app`)
  yield `readonly send = {`
  yield IncIndent
  yield* opMethods(ctx, 'send')
  yield* clearState(ctx, 'send')
  yield* call(ctx, 'send')
  yield* noopMethods(ctx, 'send')
  yield DecIndentAndCloseBlock
  yield NewLine
}

function* opMethods(ctx: GeneratorContext, type: 'params' | 'createTransaction' | 'send'): DocumentParts {
  const { app, callConfig } = ctx

  yield* operationMethods(
    ctx,
    `Updates an existing instance of the ${app.name} smart contract`,
    callConfig.updateMethods,
    'update',
    type,
    true,
  )
  yield* operationMethods(ctx, `Deletes an existing instance of the ${app.name} smart contract`, callConfig.deleteMethods, 'delete', type)
  yield* operationMethods(
    ctx,
    `Opts the user into an existing instance of the ${app.name} smart contract`,
    callConfig.optInMethods,
    'optIn',
    type,
  )
  yield* operationMethods(
    ctx,
    `Makes a close out call to an existing instance of the ${app.name} smart contract`,
    callConfig.closeOutMethods,
    'closeOut',
    type,
  )
}

function* bareMethodCall({
  generator: { app },
  name,
  description,
  verb,
  type,
  includeCompilation,
}: {
  generator: GeneratorContext
  name: string
  description: string
  verb: 'create' | 'update' | 'optIn' | 'closeOut' | 'delete' | 'clearState' | 'call'
  type: 'params' | 'createTransaction' | 'send'
  includeCompilation?: boolean
}): DocumentParts {
  const onComplete =
    verb === 'create' ? getCreateOnCompleteOptions(BARE_CALL, app) : verb === 'call' ? getCallOnCompleteOptions(BARE_CALL, app) : undefined
  yield* jsDoc({
    description: `${description}.`,
    params: {
      params: `The params for the bare (raw) call`,
    },
    returns: `The ${verb} result`,
  })
  yield `${name}: (params?: Expand<AppClientBareCallParams${includeCompilation ? ' & AppClientCompilationParams' : ''}${
    verb === 'create' ? ' & CreateSchema' : ''
  }${type === 'send' ? ' & SendParams' : ''}${onComplete?.type ? ` & ${onComplete.type}` : ''}>) => {`
  yield* indent(`return this.appClient.${type}.bare.${verb}(params)`)
  yield '},'
}

function* abiMethodCall({
  generator: { app, methodSignatureToUniqueName, name, sanitizer },
  method,
  description,
  verb,
  type,
  includeCompilation,
  readonly,
}: {
  generator: GeneratorContext
  method: Method
  description: string
  verb: 'create' | 'update' | 'optIn' | 'closeOut' | 'delete' | 'call'
  type: 'params' | 'createTransaction' | 'send'
  includeCompilation?: boolean
  readonly?: boolean
}) {
  const methodSig = new ABIMethod(method).getSignature()
  const uniqueName = methodSignatureToUniqueName[methodSig]
  const onComplete =
    verb === 'create'
      ? getCreateOnCompleteOptions(methodSig, app)
      : verb === 'call' && !readonly
        ? getCallOnCompleteOptions(methodSig, app)
        : undefined
  yield* jsDoc({
    description:
      verb === 'call' && method.readonly
        ? [
            `${description} using the \`${methodSig}\` ABI method.`,
            '',
            'This method is a readonly method; calling it with onComplete of NoOp will result in a simulated transaction rather than a real transaction.',
          ]
        : `${description} using the \`${methodSig}\` ABI method.`,
    abiDescription: method?.desc,
    params: {
      params: `The params for the smart contract call`,
    },
    returns: `The ${verb} ${type === 'params' ? 'params' : type === 'createTransaction' ? 'transaction' : 'result'}${method?.returns?.desc ? `: ${method.returns.desc}` : ''}`,
  })
  const methodName = sanitizer.makeSafeMethodIdentifier(uniqueName)
  const methodNameAccessor = sanitizer.getSafeMemberAccessor(methodName)
  const methodSigSafe = sanitizer.makeSafeStringTypeLiteral(methodSig)
  yield `${!readonly ? `${methodName}: ` : ''}${type === 'send' ? 'async ' : ''}${readonly ? `${methodName}` : ''}(params: CallParams<${name}Args['obj']['${methodSigSafe}'] | ${name}Args['tuple']['${methodSigSafe}']>${
    includeCompilation ? ' &' + ' AppClientCompilationParams' : ''
  }${
    verb === 'create' ? ' & CreateSchema' : ''
  }${type === 'send' && !readonly ? ' & SendParams' : ''}${onComplete?.type && !readonly ? ` & ${onComplete.type}` : ''}${onComplete?.isOptional !== false && (method.args.length === 0 || !method.args.some((a) => !a.defaultValue)) ? ` = {args: [${method.args.map((_) => 'undefined').join(', ')}]}` : ''})${!readonly ? ' =>' : ''} {`
  if (type === 'send') {
    yield* indent(
      `const result = await this.appClient.${type}.${verb}(${name}ParamsFactory${verb !== 'call' ? `.${verb}` : ''}${methodNameAccessor}(params))`,
      readonly
        ? `return result.return as unknown as ${name}Returns['${methodSigSafe}']`
        : `return {...result, return: result.return as unknown as (undefined | ${name}Returns['${methodSigSafe}'])}`,
    )
  } else {
    yield* indent(
      `return this.appClient.${type}.${verb}(${name}ParamsFactory${verb !== 'call' ? `.${verb}` : ''}${methodNameAccessor}(params))`,
    )
  }
  yield `}${!readonly ? ',' : ''}`
  yield NewLine
}

function* operationMethods(
  generator: GeneratorContext,
  description: string,
  methods: MethodList,
  verb: 'create' | 'update' | 'optIn' | 'closeOut' | 'delete',
  type: 'params' | 'createTransaction' | 'send',
  includeCompilation?: boolean,
): DocumentParts {
  if (methods.length) {
    yield* jsDoc(`Gets available ${verb} methods`)
    yield `${verb}: {`
    yield IncIndent
    for (const methodSig of methods) {
      if (methodSig === BARE_CALL) {
        yield* bareMethodCall({
          generator,
          name: 'bare',
          description: `${description} using a bare call`,
          verb,
          type,
          includeCompilation,
        })
      } else {
        const method = generator.app.methods.find((m) => new ABIMethod(m).getSignature() === methodSig)!
        yield* abiMethodCall({
          generator,
          method,
          description,
          verb,
          type,
          includeCompilation,
        })
      }
    }
    yield DecIndent
    yield '},'
    yield NewLine
  }
}

function* clearState(generator: GeneratorContext, type: 'params' | 'createTransaction' | 'send'): DocumentParts {
  yield* bareMethodCall({
    generator,
    name: 'clearState',
    description: `Makes a clear_state call to an existing instance of the ${generator.app.name} smart contract`,
    verb: 'clearState',
    type,
  })
  yield NewLine
}

function* call(generator: GeneratorContext, type: 'params' | 'createTransaction' | 'send'): DocumentParts {
  if (generator.callConfig.callMethods.includes(BARE_CALL)) {
    yield* bareMethodCall({
      generator,
      name: 'bare',
      description: `Makes a call to the ${generator.app.name} smart contract using a bare call`,
      verb: 'call',
      type,
    })
    yield NewLine
  }
}

function* readonlyMethods(generator: GeneratorContext): DocumentParts {
  const { app, callConfig } = generator
  for (const method of app.methods) {
    const methodSignature = new ABIMethod(method).getSignature()
    // Skip non readonly methods
    if (!callConfig.callMethods.includes(methodSignature) || !method.readonly) continue

    yield* abiMethodCall({
      generator,
      description: `Makes a readonly (simulated) call to the ${generator.app.name} smart contract`,
      method,
      verb: 'call',
      type: 'send',
      includeCompilation: false,
      readonly: true,
    })
  }
}

function* noopMethods(generator: GeneratorContext, type: 'params' | 'createTransaction' | 'send'): DocumentParts {
  const { app, callConfig } = generator
  for (const method of app.methods) {
    const methodSignature = new ABIMethod(method).getSignature()
    // Skip methods which don't support a no_op call config
    if (!callConfig.callMethods.includes(methodSignature)) continue

    yield* abiMethodCall({
      generator,
      description: `Makes a call to the ${generator.app.name} smart contract`,
      method,
      verb: 'call',
      type,
      includeCompilation: false,
    })
  }
}

function* getStateMethods({ app, sanitizer }: GeneratorContext): DocumentParts {
  if (Object.keys(app.state).length === 0) return

  yield* jsDoc(`Methods to access state for the current ${app.name} app`)
  yield 'state = {'
  yield IncIndent

  const storageTypes = ['global', 'local', 'box'] as const

  for (const storageType of storageTypes) {
    const hasKeys = Object.keys(app.state.keys[storageType]).length > 0
    const hasMaps = Object.keys(app.state.maps[storageType]).length > 0
    if (!hasKeys && !hasMaps) continue

    yield* jsDoc(`Methods to access ${storageType} state for the current ${app.name} app`)
    yield `${storageType}${storageType === 'local' ? ': (address: string | Address) => {' : ': {'}`
    yield IncIndent
    if (storageType === 'local') {
      yield "const encodedAddress = typeof address === 'string' ? address : encodeAddress(address.publicKey)"
      yield 'return {'
      yield IncIndent
    }

    yield* jsDoc(`Get all current keyed values from ${storageType} state`)
    yield `getAll: async (): Promise<Partial<Expand<${storageType[0].toUpperCase()}${storageType.substring(1)}KeysState>>> => {`
    yield* indent(
      `const result = await this.appClient.state.${storageType}${storageType === 'local' ? '(encodedAddress)' : ''}.getAll()`,
      `return {`,
      ...Object.keys(app.state.keys[storageType]).map((n) => {
        return `  ${sanitizer.makeSafePropertyIdentifier(n)}: ${app.state.keys[storageType][n].valueType === 'AVMBytes' ? `new BinaryStateValue(result${sanitizer.getSafeMemberAccessor(n)})` : `result${sanitizer.getSafeMemberAccessor(n)}`},`
      }),
      `}`,
    )
    yield `},`

    for (const n of Object.keys(app.state.keys[storageType])) {
      const name = sanitizer.makeSafePropertyIdentifier(n)
      const k = app.state.keys[storageType][n]
      yield* jsDoc(`Get the current value of the ${n} key in ${storageType} state`)
      yield `${name}: async (): Promise<${k.valueType === 'AVMBytes' ? 'BinaryState' : `${getEquivalentType(k.valueType, 'output', { app, sanitizer })} | undefined`}> => { return ${k.valueType === 'AVMBytes' ? 'new BinaryStateValue(' : ''}(await this.appClient.state.${storageType}${storageType === 'local' ? '(encodedAddress)' : ''}.getValue("${sanitizer.makeSafeStringTypeLiteral(n)}"))${k.valueType === 'AVMBytes' ? ' as Uint8Array | undefined)' : ` as ${getEquivalentType(k.valueType, 'output', { app, sanitizer })} | undefined`} },`
    }

    for (const n of Object.keys(app.state.maps[storageType])) {
      const name = sanitizer.makeSafePropertyIdentifier(app.state.keys[storageType][n] ? `${n}Map` : n)
      const m = app.state.maps[storageType][n]
      yield* jsDoc(`Get values from the ${n} map in ${storageType} state`)
      yield `${name}: {`
      yield IncIndent

      yield* jsDoc(`Get all current values of the ${n} map in ${storageType} state`)
      yield `getMap: async (): Promise<Map<${getEquivalentType(m.keyType, 'output', { app, sanitizer })}, ${getEquivalentType(m.valueType, 'output', { app, sanitizer })}>> => { return (await this.appClient.state.${storageType}${storageType === 'local' ? '(encodedAddress)' : ''}.getMap("${sanitizer.makeSafeStringTypeLiteral(n)}")) as Map<${getEquivalentType(m.keyType, 'output', { app, sanitizer })}, ${getEquivalentType(m.valueType, 'output', { app, sanitizer })}> },`

      yield* jsDoc(`Get a current value of the ${n} map by key from ${storageType} state`)
      yield `value: async (key: ${getEquivalentType(m.keyType, 'input', { app, sanitizer })}): Promise<${getEquivalentType(m.valueType, 'output', { app, sanitizer })} | undefined> => { return await this.appClient.state.${storageType}${storageType === 'local' ? '(encodedAddress)' : ''}.getMapValue("${sanitizer.makeSafeStringTypeLiteral(n)}", key) as ${getEquivalentType(m.valueType, 'output', { app, sanitizer })} | undefined },`

      yield DecIndent
      yield `},`
    }

    yield DecIndent
    if (storageType === 'local') {
      yield '}'
      yield DecIndent
    }
    yield '},'
  }

  yield DecIndentAndCloseBlock
  yield NewLine
}

function* cloneMethod({ name }: GeneratorContext): DocumentParts {
  yield* jsDoc({
    description: 'Clone this app client with different params',
    params: {
      params:
        'The params to use for the the cloned app client. Omit a param to keep the original value. Set a param to override the original value. Setting to undefined will clear the original value.',
    },
    returns: 'A new app client with the altered params',
  })
  yield `public clone(params: CloneAppClientParams) {`
  yield IncIndent
  yield `return new ${name}Client(this.appClient.clone(params))`
  yield DecIndentAndCloseBlock
  yield NewLine
}
