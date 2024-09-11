import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, indent, inline, jsDoc, NewLine } from '../output/writer'
import { BARE_CALL, MethodList } from './helpers/get-call-config-summary'
import { GeneratorContext } from './generator-context'
import { getCallOnCompleteOptions, getCreateOnCompleteOptions } from './deploy-types'
import { composeMethod } from './call-composer'
import { ABIMethod } from 'algosdk'
import { Method } from '@algorandfoundation/algokit-utils/types/app-arc56'

export function* appClient(ctx: GeneratorContext): DocumentParts {
  const { app, name } = ctx

  yield* jsDoc(`A client to make calls to the ${app.name} smart contract`)
  yield `export class ${name}Client {`
  yield IncIndent
  yield* jsDoc(`The underlying \`AppClient\` for when you want to have more flexibility`)
  yield 'public readonly appClient: AppClient'
  yield NewLine

  yield* jsDoc({
    description: `Creates a new instance of \`${name}Client\``,
    params: {
      params: 'The parameters to initialise the app client with',
    },
  })

  yield `
    constructor(params: Expand<Omit<AppClientParams, 'appSpec'>>) {
      this.appClient = new AppClient({
        ...params,
        appSpec: APP_SPEC,
      })
    }
  `

  yield* params(ctx)
  yield* transactions(ctx)
  yield* send(ctx)

  yield* getStateMethods(ctx)
  yield* composeMethod(ctx)
  yield DecIndentAndCloseBlock
}

function* params(ctx: GeneratorContext): DocumentParts {
  yield* jsDoc(`Get parameters to define transactions to the current app`)
  yield `readonly params = (($this) => {`
  yield IncIndent
  yield `return {`
  yield IncIndent
  yield* opMethods(ctx, 'params')
  yield* clearState(ctx, 'params')
  yield* call(ctx, 'params')
  yield* noopMethods(ctx, 'params')
  yield DecIndentAndCloseBlock
  yield DecIndent
  yield `})(this)`
  yield NewLine
}

function* transactions(ctx: GeneratorContext): DocumentParts {
  yield* jsDoc(`Get parameters to define transactions to the current app`)
  yield `readonly transactions = (($this) => {`
  yield IncIndent
  yield `return {`
  yield IncIndent
  yield* opMethods(ctx, 'transactions')
  yield* clearState(ctx, 'transactions')
  yield* call(ctx, 'transactions')
  yield* noopMethods(ctx, 'transactions')
  yield DecIndentAndCloseBlock
  yield DecIndent
  yield `})(this)`
  yield NewLine
}

function* send(ctx: GeneratorContext): DocumentParts {
  yield* jsDoc(`Send calls to the current app`)
  yield `readonly send = (($this) => {`
  yield IncIndent
  yield `return {`
  yield IncIndent
  yield* opMethods(ctx, 'send')
  yield* clearState(ctx, 'send')
  yield* call(ctx, 'send')
  yield* noopMethods(ctx, 'send')
  yield DecIndentAndCloseBlock
  yield DecIndent
  yield `})(this)`
  yield NewLine
}

function* opMethods(ctx: GeneratorContext, type: 'params' | 'transactions' | 'send'): DocumentParts {
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
  type: 'params' | 'transactions' | 'send'
  includeCompilation?: boolean
}): DocumentParts {
  const onComplete =
    verb === 'create' ? getCreateOnCompleteOptions(BARE_CALL, app) : verb === 'call' ? getCallOnCompleteOptions(BARE_CALL, app) : undefined
  yield* jsDoc({
    description: `${description}.`,
    params: {
      params: `The params for the bare (non-ABI) call`,
    },
    returns: `The ${verb} result`,
  })
  yield `${name}(params?: Expand<AppClientBareCallParams${includeCompilation ? ' & AppClientCompilationParams' : ''}${
    verb === 'create' ? ' & CreateSchema' : ''
  }${type === 'send' ? ' & ExecuteParams' : ''}${onComplete?.type ? ` & ${onComplete.type}` : ''}>) {`
  yield* indent(`return $this.appClient.${type}.bare.${verb}(params)`)
  yield '},'
}

function* abiMethodCall({
  generator: { app, methodSignatureToUniqueName, name, sanitizer },
  method,
  description,
  verb,
  type,
  includeCompilation,
  responseTypeGenericParam,
}: {
  generator: GeneratorContext
  method: Method
  description: string
  verb: 'create' | 'update' | 'optIn' | 'closeOut' | 'delete' | 'call'
  type: 'params' | 'transactions' | 'send'
  includeCompilation?: boolean
  responseTypeGenericParam?: string
}) {
  const methodSig = new ABIMethod(method).getSignature()
  const uniqueName = methodSignatureToUniqueName[methodSig]
  const onComplete =
    verb === 'create' ? getCreateOnCompleteOptions(methodSig, app) : verb === 'call' ? getCallOnCompleteOptions(methodSig, app) : undefined
  yield* jsDoc({
    description: `${description} using the ${methodSig} ABI method.`,
    abiDescription: method?.desc,
    params: {
      params: `The params for the smart contract call`,
    },
    returns: `The ${verb} ${type === 'params' ? 'params' : type === 'transactions' ? 'transaction' : 'result'}${method?.returns?.desc ? `: ${method.returns.desc}` : ''}`,
  })
  const methodName = sanitizer.makeSafeMethodIdentifier(uniqueName)
  const methodNameAccessor = sanitizer.getSafeMemberAccessor(methodName)
  const methodSigSafe = sanitizer.makeSafeStringTypeLiteral(methodSig)
  yield `async ${methodName}(params: Expand<CallParams<'${methodSigSafe}'>${includeCompilation ? ' & AppClientCompilationParams' : ''}${
    verb === 'create' ? ' & CreateSchema' : ''
  }${type === 'send' ? ' & ExecuteParams' : ''}${onComplete?.type ? ` & ${onComplete.type}` : ''}>${method.args.length === 0 ? ' = {args: []}' : ''}) {`
  if (type === 'send') {
    yield* indent(
      `const result = await $this.appClient.${type}.${verb}(${name}ParamsFactory${verb !== 'call' ? `.${verb}` : ''}${methodNameAccessor}(params))`,
      `return {...result, return: result.return as undefined | MethodReturn<'${methodSigSafe}'>}`,
    )
  } else {
    yield* indent(
      `return $this.appClient.${type}.${verb}(${name}ParamsFactory${verb !== 'call' ? `.${verb}` : ''}${methodNameAccessor}(params))`,
    )
  }
  yield '},'
}

function* operationMethods(
  generator: GeneratorContext,
  description: string,
  methods: MethodList,
  verb: 'create' | 'update' | 'optIn' | 'closeOut' | 'delete',
  type: 'params' | 'transactions' | 'send',
  includeCompilation?: boolean,
): DocumentParts {
  let responseTypeGenericParam
  switch (verb) {
    case 'create':
      responseTypeGenericParam = ', SendAppCreateTransactionResult'
      break
    case 'update':
      responseTypeGenericParam = ', SendAppUpdateTransactionResult'
      break
    default:
      responseTypeGenericParam = ''
      break
  }
  if (methods.length) {
    yield* jsDoc(`Gets available ${verb} methods`)
    yield `get ${verb}() {`
    yield IncIndent
    yield `return {`
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
          responseTypeGenericParam,
        })
      }
    }
    yield DecIndentAndCloseBlock
    yield DecIndent
    yield '},'
    yield NewLine
  }
}

function* clearState(generator: GeneratorContext, type: 'params' | 'transactions' | 'send'): DocumentParts {
  yield* bareMethodCall({
    generator,
    name: 'clearState',
    description: `Makes a clear_state call to an existing instance of the ${generator.app.name} smart contract`,
    verb: 'clearState',
    type,
  })
  yield NewLine
}

function* call(generator: GeneratorContext, type: 'params' | 'transactions' | 'send'): DocumentParts {
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

function* noopMethods(generator: GeneratorContext, type: 'params' | 'transactions' | 'send'): DocumentParts {
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

function* getStateMethods({ app, name, sanitizer }: GeneratorContext): DocumentParts {
  yield `// todo: state values`
}
