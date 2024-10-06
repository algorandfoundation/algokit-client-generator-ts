import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, indent, jsDoc, NewLine } from '../output/writer'
import { GeneratorContext } from './generator-context'
import { BARE_CALL, MethodList } from './helpers/get-call-config-summary'
import { getCreateOnCompleteOptions } from './deploy-types'
import { Sanitizer } from '../util/sanitization'
import { Method } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { ABIMethod } from 'algosdk'

export function* paramsFactory(ctx: GeneratorContext): DocumentParts {
  yield* jsDoc(`Exposes methods for constructing \`AppClient\` params objects for ABI calls to the ${ctx.name} smart contract`)
  yield `export abstract class ${ctx.name}ParamsFactory {`
  yield IncIndent

  yield* opMethods(ctx)

  for (const method of ctx.app.methods) {
    yield* callFactoryMethod(ctx, method)
  }

  yield DecIndent

  yield '}'
}

function* opMethods(ctx: GeneratorContext): DocumentParts {
  const { app, callConfig } = ctx

  yield* operationMethod(
    ctx,
    `Constructs create ABI call params for the ${app.name} smart contract`,
    callConfig.createMethods,
    'create',
    true,
  )
  yield* operationMethod(
    ctx,
    `Constructs update ABI call params for the ${app.name} smart contract`,
    callConfig.updateMethods,
    'update',
    true,
  )
  yield* operationMethod(ctx, `Constructs delete ABI call params for the ${app.name} smart contract`, callConfig.deleteMethods, 'delete')
  yield* operationMethod(ctx, `Constructs opt-in ABI call params for the ${app.name} smart contract`, callConfig.optInMethods, 'optIn')
  yield* operationMethod(
    ctx,
    `Constructs close out ABI call params for the ${app.name} smart contract`,
    callConfig.closeOutMethods,
    'closeOut',
  )
}

function* operationMethod(
  ctx: GeneratorContext,
  description: string,
  methods: MethodList,
  verb: 'create' | 'update' | 'optIn' | 'closeOut' | 'delete',
  includeCompilation?: boolean,
): DocumentParts {
  const { app, methodSignatureToUniqueName, sanitizer, name } = ctx
  if (methods.length > 0 && methods.some((m) => m !== BARE_CALL)) {
    yield* jsDoc(`Gets available ${verb} ABI call param factories`)
    yield `static get ${verb}() {`
    yield IncIndent
    yield `return {`
    yield IncIndent

    if (['create', 'update', 'delete'].includes(verb)) {
      yield `_resolveByMethod<TParams extends ${ctx.name}${verb[0].toUpperCase()}${verb.substring(1)}CallParams & {method: string}>(params: TParams) {`
      yield IncIndent
      yield `switch(params.method) {`
      yield IncIndent

      for (const methodSig of methods) {
        if (methodSig === BARE_CALL) continue

        const uniqueName = methodSignatureToUniqueName[methodSig]
        if (uniqueName !== methodSig) {
          yield `case '${sanitizer.makeSafeStringTypeLiteral(uniqueName)}':`
        }
        yield `case '${sanitizer.makeSafeStringTypeLiteral(methodSig)}':`
        yield* indent(`return ${ctx.name}ParamsFactory.${verb}.${sanitizer.makeSafeMethodIdentifier(uniqueName)}(params)`)
      }
      yield DecIndentAndCloseBlock

      // Ordinarily we'd pop in the params.method value, but we can't here since it knows at compile time the type of params.method is never
      yield `throw new Error(\`Unknown ' + verb + ' method\`)`
      yield DecIndent
      yield '},'
      yield NewLine
    }

    for (const methodSig of methods) {
      const onComplete = verb === 'create' ? getCreateOnCompleteOptions(methodSig, app) : undefined
      if (methodSig !== BARE_CALL) {
        const method = app.methods.find((m) => new ABIMethod(m).getSignature() === methodSig)!
        const uniqueName = methodSignatureToUniqueName[methodSig]
        yield* jsDoc({
          description: `${description} using the ${methodSig} ABI method`,
          params: {
            params: `Parameters for the call`,
          },
          returns: 'An `AppClientMethodCallParams` object for the call',
        })
        yield* factoryMethod({
          isNested: true,
          sanitizer,
          name: sanitizer.makeSafeMethodIdentifier(uniqueName),
          signature: methodSig,
          args: method.args,
          additionalParamTypes: `${includeCompilation ? ' & AppClientCompilationParams' : ''}${
            onComplete?.type ? ` & ${onComplete.type}` : ''
          }`,
          contractName: name,
        })
      }
    }
    yield DecIndentAndCloseBlock
    yield DecIndentAndCloseBlock
    yield NewLine
  }
}

function* callFactoryMethod({ methodSignatureToUniqueName, callConfig, sanitizer, name }: GeneratorContext, method: Method) {
  const methodSignature = new ABIMethod(method).getSignature()
  if (!callConfig.callMethods.includes(methodSignature)) return

  yield* jsDoc({
    description: `Constructs a no op call for the ${methodSignature} ABI method`,
    abiDescription: method.desc,
    params: {
      params: `Parameters for the call`,
    },
    returns: 'An `AppClientMethodCallParams` object for the call',
  })
  yield* factoryMethod({
    isNested: false,
    sanitizer,
    name: sanitizer.makeSafeMethodIdentifier(methodSignatureToUniqueName[methodSignature]),
    signature: methodSignature,
    args: method.args,
    additionalParamTypes: ' & CallOnComplete',
    contractName: name,
  })
}

function* factoryMethod(m: {
  isNested: boolean
  name?: string
  signature: string
  args: Array<{ name?: string }>
  additionalParamTypes?: string
  sanitizer: Sanitizer
  contractName: string
}) {
  const { isNested, name, signature, args, additionalParamTypes, sanitizer, contractName } = m
  const methodSigSafe = sanitizer.makeSafeStringTypeLiteral(signature)
  yield `${isNested ? '' : 'static '}${name}(params: CallParams<${contractName}Args['obj']['${methodSigSafe}'] | ${contractName}Args['tuple']['${methodSigSafe}']>${additionalParamTypes}): AppClientMethodCallParams${additionalParamTypes} {`
  yield IncIndent
  yield `return {`
  yield IncIndent
  yield '...params,'
  yield `method: '${methodSigSafe}' as const,`
  yield `args: Array.isArray(params.args) ? params.args : [${args
    .map((a, i) => `params.args${sanitizer.getSafeMemberAccessor(sanitizer.makeSafePropertyIdentifier(a.name ?? `arg${i + 1}`))}`)
    .join(', ')}],`
  yield DecIndent
  yield '}'
  yield DecIndent
  yield `}${isNested ? ',' : ''}`
}
