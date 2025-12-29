import {
  arc56MethodToABIMethod,
  Arc56Contract,
  ABIType,
  ABIReferenceType,
  ABITransactionType,
  AVMType,
  ABIStructField,
  ABIStructType,
  StorageKey,
  StorageMap,
} from '@algorandfoundation/algokit-utils/abi'
import { Sanitizer } from '../util/sanitization'
import { abiTypeToTs, getEquivalentType } from './helpers/get-equivalent-type'

export type AppClientContext = {
  name: SanitizableString

  methods: AppClientMethodContext[]
  abiMethods: AbiMethodClientContext[]

  state: {
    keys: {
      global: {
        [name: string]: StorageKeyContext
      }
      local: {
        [name: string]: StorageKeyContext
      }
      box: {
        [name: string]: StorageKeyContext
      }
    }
    /** Mapping of human-readable names to StorageMap objects */
    maps: {
      global: {
        [name: string]: StorageMapContext
      }
      local: {
        [name: string]: StorageMapContext
      }
      box: {
        [name: string]: StorageMapContext
      }
    }
  }

  structs: Record<string, StructContext>

  createMethods: AppClientMethodContext[]
  updateMethods: AppClientMethodContext[]
  deleteMethods: AppClientMethodContext[]
  optInMethods: AppClientMethodContext[]
  closeOutMethods: AppClientMethodContext[]
  clearStateMethods: AppClientMethodContext[]
  noOpMethods: AppClientMethodContext[]

  bareMethod: BareMethodClientContext

  templateVariables: Record<string, TemplateVariableContext>
}

export type AppClientMethodContext = AbiMethodClientContext | BareMethodClientContext

export function isAbiMethod(method: AppClientMethodContext): method is AbiMethodClientContext {
  return !method.isBare
}

export type StructContext = {
  type: TypeContext
  tsObjDef: string
  tsTupDef: string
}

export type StorageKeyContext = {
  desc?: string
  keyType: TypeContext
  valueType: TypeContext
  key: string
}
/** Describes a mapping of key-value pairs in storage */
export type StorageMapContext = {
  desc?: string
  keyType: TypeContext
  valueType: TypeContext
  prefix?: string
}

export type TypeContext = {
  type: ABIType | AVMType
  isAvmBytes?: boolean
  tsInType: string
  tsOutType: string
}

export type TemplateVariableContext = {
  type: TypeContext
  value: string | undefined
}

export type AbiMethodClientContext = {
  isBare: false
  desc: string | undefined
  name: SanitizableString
  baseNameIsUnique: boolean
  uniqueName: SanitizableString
  signature: string
  args: MethodArgClientContext[]
  returns: MethodReturnClientContext
  createActions: MethodOcas
  callActions: MethodOcas
  readonly: boolean
}
export type BareMethodClientContext = {
  isBare: true
  //desc: string | undefined
  createActions: MethodOcas
  callActions: MethodOcas
  //readonly: boolean
}

export type MethodOcas = {
  raw: string[]
  any: boolean
  noOp: boolean
  optIn: boolean
  closeOut: boolean
  clearState: boolean
  updateApplication: boolean
  deleteApplication: boolean

  inputType: {
    isOptional: boolean
    typeLiteral: string | undefined
  }
}

export type MethodArgClientContext = {
  name: SanitizableString | undefined
  desc: string | undefined
  type: ABIType | ABIReferenceType | ABITransactionType
  tsInType: string
  defaultValue: unknown
}

export type MethodReturnClientContext = {
  tsOutType: string
  type: ABIType | undefined
  desc: string | undefined
}

export type SanitizableString = {
  original: string
} & {
  [key in keyof Sanitizer]: ReturnType<Sanitizer[key]>
}

export function createAppClientContext(appSpec: Arc56Contract, sanitizer: Sanitizer): AppClientContext {
  const methods: AppClientMethodContext[] = []

  // Add bare method first to maintain consistent ordering (bare before ABI methods)
  const bareMethod: BareMethodClientContext = {
    isBare: true,
    createActions: buildOcas(appSpec.bareActions.create),
    callActions: buildOcas(appSpec.bareActions.call),
  }
  if (bareMethod.createActions.any || bareMethod.callActions.any) {
    methods.push(bareMethod)
  }

  // Then add ABI methods
  for (const m of appSpec.methods) {
    const abiMethod = arc56MethodToABIMethod(m, appSpec)
    const baseNameIsUnique = appSpec.methods.filter((o) => o.name === m.name).length === 1
    methods.push({
      isBare: false,
      name: createSanitizableString(m.name, sanitizer),
      desc: m.desc,
      baseNameIsUnique,
      uniqueName: createSanitizableString(baseNameIsUnique ? m.name : abiMethod.getSignature(), sanitizer),
      args: abiMethod.args.map((a): MethodArgClientContext => {
        return {
          name: a.name ? createSanitizableString(a.name, sanitizer) : undefined,
          desc: a.description,
          type: a.type,
          tsInType: getEquivalentType(a.type, 'input', sanitizer),
          defaultValue: Boolean(a.defaultValue),
        }
      }),
      callActions: buildOcas(m.actions.call),
      createActions: buildOcas(m.actions.create),
      readonly: Boolean(m.readonly),
      signature: abiMethod.getSignature(),
      returns: {
        tsOutType: getEquivalentType(abiMethod.returns.type, 'output', sanitizer),
        type: abiMethod.returns.type === 'void' ? undefined : abiMethod.returns.type,
        desc: abiMethod.returns.description,
      },
    })
  }

  return {
    name: createSanitizableString(appSpec.name, sanitizer),
    methods,
    bareMethod,
    createMethods: methods.filter((m) => m.createActions.any),
    updateMethods: methods.filter((m) => m.callActions.updateApplication),
    deleteMethods: methods.filter((m) => m.callActions.deleteApplication),
    noOpMethods: methods.filter((m) => m.callActions.noOp),
    optInMethods: methods.filter((m) => m.callActions.optIn),
    closeOutMethods: methods.filter((m) => m.callActions.closeOut),
    clearStateMethods: methods.filter((m) => m.callActions.clearState),
    abiMethods: methods.filter(isAbiMethod),

    state: {
      maps: {
        global: buildStorageMap(appSpec.state.maps.global, appSpec, sanitizer),
        local: buildStorageMap(appSpec.state.maps.local, appSpec, sanitizer),
        box: buildStorageMap(appSpec.state.maps.box, appSpec, sanitizer),
      },
      keys: {
        global: buildStorageKey(appSpec.state.keys.global, appSpec, sanitizer),
        local: buildStorageKey(appSpec.state.keys.local, appSpec, sanitizer),
        box: buildStorageKey(appSpec.state.keys.box, appSpec, sanitizer),
      },
    },

    structs: mapRecord(appSpec.structs, (def, name) => buildStructCtx(name, appSpec, sanitizer)),

    templateVariables: mapRecord(appSpec.templateVariables ?? {}, (v) => ({
      value: v.value,
      type: buildTypeContext(v.type, appSpec, sanitizer),
    })),
  }
}

function buildStructCtx(name: string, appSpec: Arc56Contract, sanitizer: Sanitizer): StructContext {
  const typeCtx = buildTypeContext(name, appSpec, sanitizer)

  const abiType = typeCtx.type
  if (!(abiType instanceof ABIStructType)) {
    throw new Error(`Expected abiType to be ABIStructType`)
  }

  return {
    type: typeCtx,
    tsObjDef: buildStructObjDef(abiType.structFields, appSpec, sanitizer, 1),
    tsTupDef: `[${Array.from(buildStructTupleDef(abiType.structFields, appSpec, sanitizer)).join(', ')}]`,
  }
}

function buildStructObjDef(fields: ABIStructField[], appSpec: Arc56Contract, sanitizer: Sanitizer, indent: number): string {
  const indentStr = '  '.repeat(indent)
  const closingIndent = '  '.repeat(indent - 1)
  const lines: string[] = []

  for (const field of fields) {
    const typeDef = Array.isArray(field.type)
      ? buildStructObjDef(field.type, appSpec, sanitizer, indent + 1)
      : abiTypeToTs(field.type, 'output', sanitizer)
    lines.push(`${indentStr}${sanitizer.makeSafePropertyIdentifier(field.name)}: ${typeDef}`)
  }

  return `{\n${lines.join(',\n')}\n${closingIndent}}`
}
function* buildStructTupleDef(fields: ABIStructField[], appSpec: Arc56Contract, sanitizer: Sanitizer) {
  for (const field of fields) {
    let typeDef: string
    if (Array.isArray(field.type)) {
      typeDef = `[${Array.from(buildStructTupleDef(field.type, appSpec, sanitizer)).join(', ')}]`
    } else {
      typeDef = abiTypeToTs(field.type, 'output', sanitizer)
    }
    yield `${typeDef}`
  }
}

function buildStorageMap(
  maps: Record<string, StorageMap>,
  appSpec: Arc56Contract,
  sanitizer: Sanitizer,
): Record<string, StorageMapContext> {
  return mapRecord(maps, (v) => ({
    desc: v.desc,
    valueType: buildTypeContext(v.valueType, appSpec, sanitizer),
    keyType: buildTypeContext(v.keyType, appSpec, sanitizer),
    prefix: v.prefix,
  }))
}
function buildStorageKey(
  keys: Record<string, StorageKey>,
  appSpec: Arc56Contract,
  sanitizer: Sanitizer,
): Record<string, StorageKeyContext> {
  return mapRecord(keys, (v) => ({
    desc: v.desc,
    valueType: buildTypeContext(v.valueType, appSpec, sanitizer),
    keyType: buildTypeContext(v.keyType, appSpec, sanitizer),
    key: v.key,
  }))
}

function mapRecord<TIn, TOut>(input: Record<string, TIn>, mapper: (value: TIn, key: string) => TOut): Record<string, TOut> {
  return Object.fromEntries(Object.entries(input).map(([k, v]) => [k, mapper(v, k)]))
}

function createSanitizableString(name: string, sanitizer: Sanitizer): SanitizableString {
  return new Proxy<SanitizableString>({} as SanitizableString, {
    get(target, property) {
      if (property === 'toString') return () => name
      if (property === 'original') return name
      if (property in sanitizer) {
        return sanitizer[property as keyof Sanitizer](name)
      }
    },
  })
}

function buildOcas(actions: string[]): MethodOcas {
  const isOptional = actions.includes('NoOp') || actions.length === 1
  const typeLiteral = actions.length
    ? `{ onComplete${isOptional ? '?' : ''}: ${actions.map((oc) => `OnApplicationComplete.${oc}`).join(' | ')} }`
    : undefined

  return {
    raw: actions,
    any: Boolean(actions.length),
    noOp: actions.includes('NoOp'),
    optIn: actions.includes('OptIn'),
    closeOut: actions.includes('CloseOut'),
    clearState: actions.includes('ClearState'),
    updateApplication: actions.includes('UpdateApplication'),
    deleteApplication: actions.includes('DeleteApplication'),

    inputType: {
      isOptional,
      typeLiteral,
    },
  }
}

function buildTypeContext(typeName: string, appSpec: Arc56Contract, sanitizer: Sanitizer): TypeContext {
  switch (typeName) {
    case 'AVMBytes':
      return {
        isAvmBytes: true,
        type: typeName,
        tsInType: 'Uint8Array | string',
        tsOutType: 'Uint8Array',
      }
    case 'AVMString':
      return {
        type: typeName,
        tsInType: 'string',
        tsOutType: 'string',
      }
    case 'AVMUint64':
      return {
        type: typeName,
        tsInType: 'bigint',
        tsOutType: 'bigint',
      }
  }
  if (typeName in appSpec.structs) {
    return {
      type: ABIStructType.fromStruct(typeName, appSpec.structs),
      tsInType: sanitizer.makeSafeTypeIdentifier(typeName),
      tsOutType: sanitizer.makeSafeTypeIdentifier(typeName),
    }
  }
  // Otherwise parse as ABI type
  try {
    const abiType = ABIType.from(typeName)
    return {
      type: abiType,
      tsInType: abiTypeToTs(abiType, 'input', sanitizer),
      tsOutType: abiTypeToTs(abiType, 'output', sanitizer),
    }
  } catch (error) {
    throw new Error(`Failed to parse storage type '${typeName}': ${error}`)
  }
}
