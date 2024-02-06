import { ContractMethod } from '../schema/application'
import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, jsDoc, NewLine } from '../output/writer'
import * as algokit from '@algorandfoundation/algokit-utils'
import { GeneratorContext } from './generator-context'
import { BARE_CALL, MethodList } from './helpers/get-call-config-summary'
import { getCreateOnCompleteOptions } from './deploy-types'
import { Sanitizer } from '../util/sanitization'

export function* callFactory(ctx: GeneratorContext): DocumentParts {
  yield* jsDoc('Exposes methods for constructing all available smart contract calls')
  yield `export abstract class ${ctx.name}CallFactory {`
  yield IncIndent

  yield* opMethods(ctx)

  for (const method of ctx.app.contract.methods) {
    yield* callFactoryMethod(ctx, method)
  }

  yield DecIndent

  yield '}'
}

function* opMethods(ctx: GeneratorContext): DocumentParts {
  const { app, callConfig } = ctx

  yield* operationMethod(
    ctx,
    `Constructs a create call for the ${app.contract.name} smart contract`,
    callConfig.createMethods,
    'create',
    true,
  )
  yield* operationMethod(
    ctx,
    `Constructs an update call for the ${app.contract.name} smart contract`,
    callConfig.updateMethods,
    'update',
    true,
  )
  yield* operationMethod(ctx, `Constructs a delete call for the ${app.contract.name} smart contract`, callConfig.deleteMethods, 'delete')
  yield* operationMethod(ctx, `Constructs an opt in call for the ${app.contract.name} smart contract`, callConfig.optInMethods, 'optIn')
  yield* operationMethod(
    ctx,
    `Constructs a close out call for the ${app.contract.name} smart contract`,
    callConfig.closeOutMethods,
    'closeOut',
  )
}

function* operationMethod(
  { app, methodSignatureToUniqueName, sanitizer }: GeneratorContext,
  description: string,
  methods: MethodList,
  verb: 'create' | 'update' | 'optIn' | 'closeOut' | 'delete',
  includeCompilation?: boolean,
): DocumentParts {
  if (methods.length) {
    yield* jsDoc(`Gets available ${verb} call factories`)
    yield `static get ${verb}() {`
    yield IncIndent
    yield `return {`
    yield IncIndent
    for (const methodSig of methods) {
      const onComplete = verb === 'create' ? getCreateOnCompleteOptions(methodSig, app) : undefined
      if (methodSig === BARE_CALL) {
        yield* jsDoc({
          description: `${description} using a bare call`,
          params: {
            params: `Any parameters for the call`,
          },
          returns: `A TypedCallParams object for the call`,
        })
        yield* factoryMethod({
          isNested: true,
          name: 'bare',
          sanitizer,
          paramTypes: `BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs${
            includeCompilation ? ' & AppClientCompilationParams' : ''
          }${onComplete?.type ? ` & ${onComplete.type}` : ''}${onComplete?.isOptional !== false ? ' = {}' : ''}`,
        })
      } else {
        const method = app.contract.methods.find((m) => algokit.getABIMethodSignature(m) === methodSig)!
        const uniqueName = methodSignatureToUniqueName[methodSig]
        yield* jsDoc({
          description: `${description} using the ${methodSig} ABI method`,
          params: {
            args: `Any args for the contract call`,
            params: `Any additional parameters for the call`,
          },
          returns: `A TypedCallParams object for the call`,
        })
        yield* factoryMethod({
          isNested: true,
          sanitizer,
          name: sanitizer.makeSafeMethodIdentifier(uniqueName),
          signature: methodSig,
          args: method.args,
          paramTypes: `AppClientCallCoreParams & CoreAppCallArgs${includeCompilation ? ' & AppClientCompilationParams' : ''}${
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

function* callFactoryMethod({ methodSignatureToUniqueName, callConfig, sanitizer }: GeneratorContext, method: ContractMethod) {
  const methodSignature = algokit.getABIMethodSignature(method)
  if (!callConfig.callMethods.includes(methodSignature)) return

  yield* jsDoc({
    description: `Constructs a no op call for the ${methodSignature} ABI method`,
    abiDescription: method.desc,
    params: {
      args: `Any args for the contract call`,
      params: `Any additional parameters for the call`,
    },
    returns: `A TypedCallParams object for the call`,
  })
  yield* factoryMethod({
    isNested: false,
    sanitizer,
    name: sanitizer.makeSafeMethodIdentifier(methodSignatureToUniqueName[methodSignature]),
    signature: methodSignature,
    args: method.args,
    paramTypes: 'AppClientCallCoreParams & CoreAppCallArgs',
  })
}

function* factoryMethod({
  isNested,
  name,
  signature,
  args,
  paramTypes,
  sanitizer,
}:
  | {
      isNested: boolean
      name?: string
      signature?: undefined
      args?: undefined
      paramTypes: string
      sanitizer: Sanitizer
    }
  | {
      isNested: boolean
      name?: string
      signature: string
      args: Array<{ name: string }>
      paramTypes: string
      sanitizer: Sanitizer
    }) {
  const signatureSafe = signature && sanitizer.makeSafeStringTypeLiteral(signature)
  yield `${isNested ? '' : 'static '}${name}(${signature === undefined ? '' : `args: MethodArgs<'${signatureSafe}'>, `}params: ${paramTypes}) {`
  yield IncIndent
  yield `return {`
  yield IncIndent
  if (signature) {
    yield `method: '${signatureSafe}' as const,`
    yield `methodArgs: Array.isArray(args) ? args : [${args
      .map((a) =>
        sanitizer.isSafeVariableIdentifier(a.name) ? `args.${a.name}` : `args['${sanitizer.makeSafePropertyIdentifier(a.name)}']`,
      )
      .join(', ')}],`
  } else {
    yield `method: undefined,`
    yield `methodArgs: undefined,`
  }

  yield '...params,'
  yield DecIndent
  yield '}'
  yield DecIndent
  yield `}${isNested ? ',' : ''}`
}
