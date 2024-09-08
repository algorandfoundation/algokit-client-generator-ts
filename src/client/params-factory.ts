import { ContractMethod } from '../schema/application'
import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, jsDoc, NewLine } from '../output/writer'
import * as algokit from '@algorandfoundation/algokit-utils'
import { GeneratorContext } from './generator-context'
import { BARE_CALL, MethodList } from './helpers/get-call-config-summary'
import { getCreateOnCompleteOptions } from './deploy-types'
import { Sanitizer } from '../util/sanitization'
import { Method } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { ABIMethod } from 'algosdk'

export function* paramsFactory(ctx: GeneratorContext): DocumentParts {
  yield* jsDoc('Exposes methods for constructing `AppClient` params objects for all known smart contract calls to ' + ctx.name)
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

  yield* operationMethod(ctx, `Constructs create params for the ${app.name} smart contract`, callConfig.createMethods, 'create', true)
  yield* operationMethod(ctx, `Constructs update params for the ${app.name} smart contract`, callConfig.updateMethods, 'update', true)
  yield* operationMethod(ctx, `Constructs delete params for the ${app.name} smart contract`, callConfig.deleteMethods, 'delete')
  yield* operationMethod(ctx, `Constructs opt-in params for the ${app.name} smart contract`, callConfig.optInMethods, 'optIn')
  yield* operationMethod(ctx, `Constructs close out params for the ${app.name} smart contract`, callConfig.closeOutMethods, 'closeOut')
}

function* operationMethod(
  { app, methodSignatureToUniqueName, sanitizer }: GeneratorContext,
  description: string,
  methods: MethodList,
  verb: 'create' | 'update' | 'optIn' | 'closeOut' | 'delete',
  includeCompilation?: boolean,
): DocumentParts {
  if (methods.length) {
    yield* jsDoc(`Gets available ${verb} param factories`)
    yield `static get ${verb}() {`
    yield IncIndent
    yield `return {`
    yield IncIndent
    for (const methodSig of methods) {
      const onComplete = verb === 'create' ? getCreateOnCompleteOptions(methodSig, app) : undefined
      if (methodSig === BARE_CALL) {
        // todo: delete the bare call here???
        yield* jsDoc({
          description: `${description} using a bare call`,
          params: {
            params: `Any parameters for the call`,
          },
          returns: 'An `AppClientBareCallParams` object for the call',
        })
        yield* factoryMethod({
          isNested: true,
          name: 'bare',
          sanitizer,
          additionalParamTypes: `${
            includeCompilation ? ' & AppClientCompilationParams' : ''
          }${onComplete?.type ? ` & ${onComplete.type}` : ''}`,
        })
      } else {
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
          }${onComplete?.isOptional !== false ? ' = {}' : ''}`,
        })
      }
    }
    yield DecIndentAndCloseBlock
    yield DecIndentAndCloseBlock
    yield NewLine
  }
}

function* callFactoryMethod({ methodSignatureToUniqueName, callConfig, sanitizer }: GeneratorContext, method: Method) {
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
  })
}

function* factoryMethod({
  isNested,
  name,
  signature,
  args,
  additionalParamTypes,
  sanitizer,
}:
  | {
      isNested: boolean
      name?: string
      signature?: undefined
      args?: undefined
      additionalParamTypes?: string
      sanitizer: Sanitizer
    }
  | {
      isNested: boolean
      name?: string
      signature: string
      args: Array<{ name?: string }>
      additionalParamTypes?: string
      sanitizer: Sanitizer
    }) {
  const signatureSafe = signature && sanitizer.makeSafeStringTypeLiteral(signature)
  yield `${isNested ? '' : 'static '}${name}(params: ${signature === undefined ? 'AppClientBareCallParams' : `CallParams<'${signatureSafe}'>`}${additionalParamTypes}): ${signature !== undefined ? 'AppClientMethodCallParams' : 'AppClientBareCallParams'}${additionalParamTypes} {`
  yield IncIndent
  yield `return {`
  yield IncIndent
  yield '...params,'
  if (signature) {
    yield `method: '${signatureSafe}' as const,`
    yield `args: Array.isArray(params.args) ? params.args : [${args
      .map((a, i) => `params.args${sanitizer.getSafeMemberAccessor(sanitizer.makeSafePropertyIdentifier(a.name ?? `arg${i + 1}`))}`)
      .join(', ')}],`
  }
  yield DecIndent
  yield '}'
  yield DecIndent
  yield `}${isNested ? ',' : ''}`
}
