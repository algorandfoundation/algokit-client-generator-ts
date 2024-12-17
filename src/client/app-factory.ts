import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, indent, jsDoc, NewLine } from '../output/writer'
import { BARE_CALL, MethodList } from './helpers/get-call-config-summary'
import { GeneratorContext } from './generator-context'
import { getCreateOnCompleteOptions } from './deploy-types'
import { ABIMethod } from 'algosdk'
import { Method } from '@algorandfoundation/algokit-utils/types/app-arc56'

export function* appFactory(ctx: GeneratorContext): DocumentParts {
  const { app, name } = ctx

  yield* jsDoc(
    `A factory to create and deploy one or more instance of the ${app.name} smart contract and to create one or more app clients to interact with those (or other) app instances`,
  )
  yield `export class ${name}Factory {`
  yield IncIndent
  yield* jsDoc(`The underlying \`AppFactory\` for when you want to have more flexibility`)
  yield 'public readonly appFactory: _AppFactory'
  yield NewLine

  yield* jsDoc({
    description: `Creates a new instance of \`${name}Factory\``,
    params: {
      params: 'The parameters to initialise the app factory with',
    },
  })

  yield `
    constructor(params: Omit<AppFactoryParams, 'appSpec'>) {
      this.appFactory = new _AppFactory({
        ...params,
        appSpec: APP_SPEC,
      })
    }

    /** The name of the app (from the ARC-32 / ARC-56 app spec or override). */
    public get appName() {
      return this.appFactory.appName
    }

    /** The ARC-56 app spec being used */
    get appSpec() {
      return APP_SPEC
    }

    /** A reference to the underlying \`AlgorandClient\` this app factory is using. */
    public get algorand(): AlgorandClientInterface {
      return this.appFactory.algorand
    }

    /**
     * Returns a new \`AppClient\` client for an app instance of the given ID.
     *
     * Automatically populates appName, defaultSender and source maps from the factory
     * if not specified in the params.
     * @param params The parameters to create the app client
     * @returns The \`AppClient\`
     */
    public getAppClientById(params: AppFactoryAppClientParams) {
      return new ${name}Client(this.appFactory.getAppClientById(params))
    }

    /**
     * Returns a new \`AppClient\` client, resolving the app by creator address and name
     * using AlgoKit app deployment semantics (i.e. looking for the app creation transaction note).
     *
     * Automatically populates appName, defaultSender and source maps from the factory
     * if not specified in the params.
     * @param params The parameters to create the app client
     * @returns The \`AppClient\`
     */
    public async getAppClientByCreatorAndName(
      params: AppFactoryResolveAppClientByCreatorAndNameParams,
    ) {
      return new ${name}Client(await this.appFactory.getAppClientByCreatorAndName(params))
    }
  `

  yield* deployMethod(ctx)
  yield* params(ctx)
  yield* createTransaction(ctx)
  yield* send(ctx)
  yield DecIndentAndCloseBlock
}

function* params(ctx: GeneratorContext): DocumentParts {
  yield* jsDoc(
    `Get parameters to create transactions (create and deploy related calls) for the current app. A good mental model for this is that these parameters represent a deferred transaction creation.`,
  )
  yield `readonly params = {`
  yield IncIndent
  yield* paramMethods(ctx)
  yield DecIndentAndCloseBlock
  yield NewLine
}

function* createTransaction(ctx: GeneratorContext): DocumentParts {
  yield* jsDoc(`Create transactions for the current app`)
  yield `readonly createTransaction = {`
  yield IncIndent
  yield* createTransactionMethods(ctx)
  yield DecIndentAndCloseBlock
  yield NewLine
}

function* send(ctx: GeneratorContext): DocumentParts {
  yield* jsDoc(`Send calls to the current app`)
  yield `readonly send = {`
  yield IncIndent
  yield* createMethods(ctx)
  yield DecIndentAndCloseBlock
  yield NewLine
}

function* createMethods(generator: GeneratorContext): DocumentParts {
  const { app } = generator
  if (generator.callConfig.createMethods.length) {
    yield* jsDoc(`Gets available create methods`)
    yield `create: {`
    yield IncIndent
    for (const methodSig of generator.callConfig.createMethods) {
      if (methodSig === BARE_CALL) {
        yield* bareMethodCallParams({
          generator,
          name: 'bare',
          description: `Creates a new instance of the ${app.name} smart contract using a bare call`,
          verb: 'create',
          type: 'send',
          includeCompilation: true,
        })
      } else {
        const method = generator.app.methods.find((m) => new ABIMethod(m).getSignature() === methodSig)!
        yield* abiMethodCallParams({
          generator,
          method,
          description: `Creates a new instance of the ${app.name} smart contract using an ABI method call`,
          verb: 'create',
          type: 'send',
          includeCompilation: true,
        })
      }
    }
    yield DecIndent
    yield '},'
    yield NewLine
  }
}

function* paramMethods(ctx: GeneratorContext): DocumentParts {
  const { app, callConfig } = ctx

  yield* operationMethods(
    ctx,
    `Creates a new instance of the ${app.name} smart contract`,
    callConfig.createMethods,
    'create',
    'params',
    true,
  )

  yield* operationMethods(
    ctx,
    `Updates an existing instance of the ${app.name} smart contract`,
    callConfig.updateMethods,
    'deployUpdate',
    'params',
    true,
  )
  yield* operationMethods(
    ctx,
    `Deletes an existing instance of the ${app.name} smart contract`,
    callConfig.deleteMethods,
    'deployDelete',
    'params',
  )
}

function* createTransactionMethods(ctx: GeneratorContext): DocumentParts {
  const { app, callConfig } = ctx

  yield* operationMethods(
    ctx,
    `Creates a new instance of the ${app.name} smart contract`,
    callConfig.createMethods,
    'create',
    'createTransaction',
    true,
  )
}

function* bareMethodCallParams({
  generator: { app, name: clientName },
  name,
  description,
  verb,
  type,
  includeCompilation,
}: {
  generator: GeneratorContext
  name: string
  description: string
  verb: 'create' | 'deployUpdate' | 'deployDelete'
  type: 'params' | 'createTransaction' | 'send'
  includeCompilation?: boolean
}): DocumentParts {
  const onComplete = verb === 'create' ? getCreateOnCompleteOptions(BARE_CALL, app) : undefined
  yield* jsDoc({
    description: `${description}.`,
    params: {
      params: `The params for the bare (raw) call`,
    },
    returns:
      type === 'params' || type === 'createTransaction'
        ? `The ${type === 'createTransaction' ? 'transaction' : type} for a ${verb} call`
        : `The ${verb} result`,
  })
  yield `${name}: ${type === 'send' ? 'async ' : ''}(params?: Expand<AppClientBareCallParams${
    includeCompilation ? ' &' + ' AppClientCompilationParams' : ''
  }${
    verb === 'create' ? ' & CreateSchema' : ''
  }${type === 'send' ? ' & SendParams' : ''}${onComplete?.type ? ` & ${onComplete.type}` : ''}>) => {`
  if (type === 'params' || type === 'createTransaction') {
    yield* indent(`return this.appFactory.${type}.bare.${verb}(params)`)
  } else {
    yield* indent(
      `const result = await this.appFactory.send.bare.create(params)`,
      `return { result: result.result, appClient: new ${clientName}Client(result.appClient) }`,
    )
  }
  yield '},'
}

function* abiMethodCallParams({
  generator: { app, methodSignatureToUniqueName, name, sanitizer },
  method,
  description,
  verb,
  type,
  includeCompilation,
}: {
  generator: GeneratorContext
  method: Method
  description: string
  verb: 'create' | 'deployUpdate' | 'deployDelete'
  type: 'params' | 'createTransaction' | 'send'
  includeCompilation?: boolean
}) {
  const methodSig = new ABIMethod(method).getSignature()
  const uniqueName = methodSignatureToUniqueName[methodSig]
  const onComplete = verb === 'create' ? getCreateOnCompleteOptions(methodSig, app) : undefined
  yield* jsDoc({
    description: `${description} using the ${methodSig} ABI method.`,
    abiDescription: method?.desc,
    params: {
      params: `The params for the smart contract call`,
    },
    returns: `The ${verb} ${type === 'params' ? 'params' : type === 'createTransaction' ? 'transaction' : 'result'}${method?.returns?.desc ? `: ${method.returns.desc}` : ''}`,
  })
  const methodName = sanitizer.makeSafeMethodIdentifier(uniqueName)
  const methodNameAccessor = sanitizer.getSafeMemberAccessor(methodName)
  const methodSigSafe = sanitizer.makeSafeStringTypeLiteral(methodSig)
  yield `${methodName}: ${type === 'send' ? 'async ' : ''}(params: CallParams<${name}Args['obj']['${methodSigSafe}'] | ${name}Args['tuple']['${methodSigSafe}']>${
    includeCompilation ? ' &' + ' AppClientCompilationParams' : ''
  }${
    verb === 'create' ? ' & CreateSchema' : ''
  }${type === 'send' ? ' & SendParams' : ''}${onComplete?.type ? ` & ${onComplete.type}` : ''}${onComplete?.isOptional !== false && (method.args.length === 0 || !method.args.some((a) => !a.defaultValue)) ? ` = {args: [${method.args.map((_) => 'undefined').join(', ')}]}` : ''}) => {`
  if (type === 'params' || type === 'createTransaction') {
    yield* indent(
      `return this.appFactory.${type}.${verb}(${name}ParamsFactory.${verb == 'deployDelete' ? 'delete' : verb === 'deployUpdate' ? 'update' : verb}${methodNameAccessor}(params))`,
    )
  } else {
    yield* indent(
      `const result = await this.appFactory.send.create(${name}ParamsFactory.${verb}${methodNameAccessor}(params))`,
      `return { result: { ...result.result, return: result.result.return as unknown as (undefined | ${name}Returns['${methodSigSafe}']) }, appClient: new ${name}Client(result.appClient) }`,
    )
  }
  yield '},'
}

function* operationMethods(
  generator: GeneratorContext,
  description: string,
  methods: MethodList,
  verb: 'create' | 'deployUpdate' | 'deployDelete',
  type: 'params' | 'createTransaction',
  includeCompilation?: boolean,
): DocumentParts {
  if (methods.length) {
    yield* jsDoc(`Gets available ${verb} methods`)
    yield `${verb}: {`
    yield IncIndent
    for (const methodSig of methods) {
      if (methodSig === BARE_CALL) {
        yield* bareMethodCallParams({
          generator,
          name: 'bare',
          description: `${description} using a bare call`,
          verb,
          type,
          includeCompilation,
        })
      } else {
        const method = generator.app.methods.find((m) => new ABIMethod(m).getSignature() === methodSig)!
        yield* abiMethodCallParams({
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

function* deployMethod(ctx: GeneratorContext): DocumentParts {
  const { app, callConfig, name } = ctx
  yield* jsDoc({
    description: `Idempotently deploys the ${app.name} smart contract.`,
    params: {
      params: 'The arguments for the contract calls and any additional parameters for the call',
    },
    returns: 'The deployment result',
  })
  yield `public async deploy(params: ${name}DeployParams = {}) {`
  yield IncIndent

  yield `const result = await this.appFactory.deploy({`
  yield IncIndent
  yield `...params,`
  if (callConfig.createMethods.filter((m) => m !== BARE_CALL).length) {
    yield `createParams: params.createParams?.method ? ${name}ParamsFactory.create._resolveByMethod(params.createParams) : params.createParams ? params.createParams as (${name}CreateCallParams & { args: Uint8Array[] }) : undefined,`
  }
  if (callConfig.updateMethods.filter((m) => m !== BARE_CALL).length) {
    yield `updateParams: params.updateParams?.method ? ${name}ParamsFactory.update._resolveByMethod(params.updateParams) : params.updateParams ? params.updateParams as (${name}UpdateCallParams & { args: Uint8Array[] }) : undefined,`
  }
  if (callConfig.deleteMethods.filter((m) => m !== BARE_CALL).length) {
    yield `deleteParams: params.deleteParams?.method ? ${name}ParamsFactory.delete._resolveByMethod(params.deleteParams) : params.deleteParams ? params.deleteParams as (${name}DeleteCallParams & { args: Uint8Array[] }) : undefined,`
  }
  yield DecIndent
  yield `})`
  yield `return { result: result.result, appClient: new ${name}Client(result.appClient) }`
  yield DecIndentAndCloseBlock
  yield NewLine
}
