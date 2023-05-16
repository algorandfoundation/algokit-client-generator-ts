import { ContractMethod } from '../schema/application'
import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, indent } from '../output/writer'
import { isSafeVariableIdentifier, makeSafeMethodIdentifier, makeSafePropertyIdentifier } from '../util/sanitization'
import * as algokit from '@algorandfoundation/algokit-utils'
import { GeneratorContext } from './generator-context'

export function* callFactory(ctx: GeneratorContext): DocumentParts {
  yield `export abstract class ${ctx.name}CallFactory {`
  yield IncIndent
  for (const method of ctx.app.contract.methods) {
    yield* callFactoryMethod(ctx, method)
  }

  yield DecIndent

  yield '}'

  yield `function mapBySignature(...[signature, args, params]: MapperArgs<keyof ${ctx.name}['methods']>) {`
  yield IncIndent
  yield 'switch(signature) {'
  yield IncIndent
  for (const method of ctx.app.contract.methods) {
    const methodSignature = algokit.getABIMethodSignature(method)
    const uniqueName = ctx.methodSignatureToUniqueName[methodSignature]

    yield `case '${methodSignature}':`
    if (uniqueName !== methodSignature) {
      yield `case '${uniqueName}':`
    }
    yield* indent(
      `return ${ctx.name}CallFactory.${makeSafeMethodIdentifier(ctx.methodSignatureToUniqueName[methodSignature])}(args, params)`,
    )
  }
  yield DecIndentAndCloseBlock
  yield DecIndentAndCloseBlock
}

function* callFactoryMethod({ methodSignatureToUniqueName }: GeneratorContext, method: ContractMethod) {
  const methodSignature = algokit.getABIMethodSignature(method)
  yield `static ${makeSafeMethodIdentifier(
    methodSignatureToUniqueName[methodSignature],
  )}(args: MethodArgs<'${methodSignature}'>, params: AppClientCallCoreParams & CoreAppCallArgs = {}) {`
  yield IncIndent
  yield `return {`
  yield IncIndent
  yield `method: '${methodSignature}' as const,`
  yield `methodArgs: Array.isArray(args) ? args : [${method.args
    .map((a) => (isSafeVariableIdentifier(a.name) ? `args.${a.name}` : `args['${makeSafePropertyIdentifier(a.name)}']`))
    .join(', ')}],`
  yield '...params,'
  yield DecIndent
  yield '}'
  yield DecIndent
  yield '}'
}
