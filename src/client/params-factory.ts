import { DecIndent, DecIndentAndCloseBlock, DocumentParts, IncIndent, indent, jsDoc, NewLine } from '../output/writer'
import { GeneratorContext } from './generator-context'
import { Sanitizer } from '../util/sanitization'
import { AppClientMethodContext, MethodArgClientContext } from './app-client-context'

export function* paramsFactory(ctx: GeneratorContext): DocumentParts {
  yield* jsDoc(`Exposes methods for constructing \`AppClient\` params objects for ABI calls to the ${ctx.app.name.original} smart contract`)
  yield `export abstract class ${ctx.app.name.makeSafeTypeIdentifier}ParamsFactory {`
  yield IncIndent

  yield* opMethods(ctx)

  for (const method of ctx.app.methods) {
    if (!method.callActions.noOp) continue
    yield* callFactoryMethod(ctx, method)
  }

  yield DecIndent

  yield '}'
}

function* opMethods(ctx: GeneratorContext): DocumentParts {
  const { app } = ctx

  if (ctx.mode === 'full') {
    yield* operationMethod(ctx, `Constructs create ABI call params for the ${app.name} smart contract`, app.createMethods, 'create', true)
    yield* operationMethod(ctx, `Constructs update ABI call params for the ${app.name} smart contract`, app.updateMethods, 'update', true)
    yield* operationMethod(ctx, `Constructs delete ABI call params for the ${app.name} smart contract`, app.deleteMethods, 'delete')
  }
  yield* operationMethod(ctx, `Constructs opt-in ABI call params for the ${app.name} smart contract`, app.optInMethods, 'optIn')
  yield* operationMethod(ctx, `Constructs close out ABI call params for the ${app.name} smart contract`, app.closeOutMethods, 'closeOut')
}

function* operationMethod(
  ctx: GeneratorContext,
  description: string,
  methods: AppClientMethodContext[],
  verb: 'create' | 'update' | 'optIn' | 'closeOut' | 'delete',
  includeCompilation?: boolean,
): DocumentParts {
  const { app, sanitizer, name } = ctx
  if (methods.some((m) => !m.isBare)) {
    yield* jsDoc(`Gets available ${verb} ABI call param factories`)
    yield `static get ${verb}() {`
    yield IncIndent
    yield `return {`
    yield IncIndent

    if (['create', 'update', 'delete'].includes(verb)) {
      yield `_resolveByMethod<TParams extends ${app.name.makeSafeTypeIdentifier}${verb[0].toUpperCase()}${verb.substring(1)}CallParams & {method: string}>(params: TParams) {`
      yield IncIndent
      yield `switch(params.method) {`
      yield IncIndent

      for (const method of methods) {
        if (method.isBare) continue
        if (method.baseNameIsUnique) {
          yield `case '${method.name.makeSafeStringTypeLiteral}':`
        }
        yield `case '${sanitizer.makeSafeStringTypeLiteral(method.signature)}':`
        yield* indent(
          `return ${app.name.makeSafeTypeIdentifier}ParamsFactory.${verb}${sanitizer.getSafeMemberAccessor(sanitizer.makeSafeMethodIdentifier(method.uniqueName.original))}(params)`,
        )
      }
      yield DecIndentAndCloseBlock

      // Ordinarily we'd pop in the params.method value, but we can't here since it knows at compile time the type of params.method is never
      yield `throw new Error(\`Unknown ' + verb + ' method\`)`
      yield DecIndent
      yield '},'
      yield NewLine
    }

    for (const method of methods) {
      if (method.isBare) continue
      const onComplete = verb === 'create' ? method.createActions.inputType : undefined

      const uniqueName = method.uniqueName.original
      yield* jsDoc({
        description: `${description} using the ${method.signature} ABI method`,
        params: {
          params: `Parameters for the call`,
        },
        returns: 'An `AppClientMethodCallParams` object for the call',
      })
      yield* factoryMethod({
        isNested: true,
        sanitizer,
        name: sanitizer.makeSafeMethodIdentifier(uniqueName),
        signature: method.signature,
        args: method.args,
        additionalParamTypes: `${includeCompilation ? ' & AppClientCompilationParams' : ''}${
          onComplete?.typeLiteral ? ` & ${onComplete.typeLiteral}` : ''
        }`,
        contractName: name,
      })
    }
    yield DecIndentAndCloseBlock
    yield DecIndentAndCloseBlock
    yield NewLine
  }
}

function* callFactoryMethod({ sanitizer, name }: GeneratorContext, method: AppClientMethodContext) {
  if (!method.callActions.any || method.isBare) return

  yield* jsDoc({
    description: `Constructs a no op call for the ${method.signature} ABI method`,
    abiDescription: method.desc,
    params: {
      params: `Parameters for the call`,
    },
    returns: 'An `AppClientMethodCallParams` object for the call',
  })
  yield* factoryMethod({
    isNested: false,
    sanitizer,
    name: method.uniqueName.makeSafeMethodIdentifier,
    signature: method.signature,
    args: method.args,
    additionalParamTypes: ' & CallOnComplete',
    contractName: name,
  })
}

function* factoryMethod(m: {
  isNested: boolean
  name?: string
  signature: string
  args: MethodArgClientContext[]
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
    .map((a, i) => `params.args${sanitizer.getSafeMemberAccessor(a.name?.makeSafePropertyIdentifier ?? `arg${i + 1}`)}`)
    .join(', ')}],`
  yield DecIndent
  yield '}'
  yield DecIndent
  yield `}${isNested ? ',' : ''}`
}
