import { ContractMethod } from '../schema/application'
import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, NewLine } from '../output/writer'
import { isSafeVariableIdentifier, makeSafeMethodIdentifier, makeSafePropertyIdentifier } from '../util/sanitization'
import * as algokit from '@algorandfoundation/algokit-utils'
import { GeneratorContext } from './generator-context'
import { BARE_CALL, MethodList } from './helpers/get-call-config-summary'
import { getCreateOnCompleteOptions } from './deploy-types'

export function* callFactory(ctx: GeneratorContext): DocumentParts {
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
  { app, methodSignatureToUniqueName }: GeneratorContext,
  description: string,
  methods: MethodList,
  verb: 'create' | 'update' | 'optIn' | 'closeOut' | 'delete',
  includeCompilation?: boolean,
): DocumentParts {
  if (methods.length) {
    yield `/**`
    yield ` * Gets available ${verb} call factories`
    yield ` */`
    yield `static get ${verb}() {`
    yield IncIndent
    yield `return {`
    yield IncIndent
    for (const methodSig of methods) {
      const onComplete = verb === 'create' ? getCreateOnCompleteOptions(methodSig, app) : undefined
      if (methodSig === BARE_CALL) {
        yield* factoryMethod({
          isNested: true,
          name: 'bare',
          paramTypes: `BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs${
            includeCompilation ? ' & AppClientCompilationParams' : ''
          }${onComplete?.type ? ` & ${onComplete.type}` : ''}${onComplete?.isOptional !== false ? ' = {}' : ''}`,
        })
      } else {
        const method = app.contract.methods.find((m) => algokit.getABIMethodSignature(m) === methodSig)!
        const uniqueName = methodSignatureToUniqueName[methodSig]
        yield* factoryMethod({
          isNested: true,
          name: makeSafeMethodIdentifier(uniqueName),
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

function* callFactoryMethod({ methodSignatureToUniqueName, callConfig }: GeneratorContext, method: ContractMethod) {
  const methodSignature = algokit.getABIMethodSignature(method)
  if (!callConfig.callMethods.includes(methodSignature)) return

  yield* factoryMethod({
    isNested: false,
    name: makeSafeMethodIdentifier(methodSignatureToUniqueName[methodSignature]),
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
}:
  | {
      isNested: boolean
      name?: string
      signature?: undefined
      args?: undefined
      paramTypes: string
    }
  | {
      isNested: boolean
      name?: string
      signature: string
      args: Array<{ name: string }>
      paramTypes: string
    }) {
  yield `${isNested ? '' : 'static '}${name}(${signature === undefined ? '' : `args: MethodArgs<'${signature}'>, `}params: ${paramTypes}) {`
  yield IncIndent
  yield `return {`
  yield IncIndent
  if (signature) {
    yield `method: '${signature}' as const,`
    yield `methodArgs: Array.isArray(args) ? args : [${args
      .map((a) => (isSafeVariableIdentifier(a.name) ? `args.${a.name}` : `args['${makeSafePropertyIdentifier(a.name)}']`))
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
