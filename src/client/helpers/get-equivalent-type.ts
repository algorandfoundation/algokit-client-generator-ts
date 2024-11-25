import { Arc56Contract } from '@algorandfoundation/algokit-utils/types/app-arc56'
import {
  ABIAddressType,
  ABIArrayDynamicType,
  ABIArrayStaticType,
  ABIBoolType,
  ABIByteType,
  ABIReferenceType,
  ABIStringType,
  ABITupleType,
  ABIType,
  ABIUfixedType,
  ABIUintType,
  abiTypeIsTransaction,
} from 'algosdk'
import { Sanitizer } from '../../util/sanitization'

export function getEquivalentType(
  abiTypeStr: string,
  ioType: 'input' | 'output',
  ctx: { app: Arc56Contract; sanitizer: Sanitizer },
): string {
  const { app, sanitizer } = ctx
  if (abiTypeStr == 'void') {
    return 'void'
  }
  if (abiTypeStr == 'AVMBytes') {
    return ioType === 'input' ? 'Uint8Array | string' : 'Uint8Array'
  }
  if (abiTypeStr == 'AVMString') {
    return 'string'
  }
  if (abiTypeStr == 'AVMUint64') {
    return 'bigint'
  }
  if (abiTypeIsTransaction(abiTypeStr)) {
    return 'AppMethodCallTransactionArgument'
  }
  if (abiTypeStr == ABIReferenceType.account) {
    return 'string | Uint8Array'
  }
  if (abiTypeStr == ABIReferenceType.application || abiTypeStr == ABIReferenceType.asset) {
    return 'bigint'
  }
  if (Object.keys(app.structs).includes(abiTypeStr)) {
    return sanitizer.makeSafeTypeIdentifier(abiTypeStr)
  }

  const abiType = ABIType.from(abiTypeStr)

  return abiTypeToTs(abiType, ioType)

  function abiTypeToTs(abiType: ABIType, ioType: 'input' | 'output'): string {
    if (abiType instanceof ABIUintType) {
      if (abiType.bitSize < 53) return ioType === 'input' ? 'bigint | number' : 'number'
      return ioType === 'input' ? 'bigint | number' : 'bigint'
    }
    if (abiType instanceof ABIArrayDynamicType) {
      if (abiType.childType instanceof ABIByteType) return 'Uint8Array'

      const childTsType = abiTypeToTs(abiType.childType, ioType)
      return `${childTsType}[]`
    }
    if (abiType instanceof ABIArrayStaticType) {
      if (abiType.childType instanceof ABIByteType) return 'Uint8Array'
      return `[${new Array(abiType.staticLength).fill(abiTypeToTs(abiType.childType, ioType)).join(', ')}]`
    }
    if (abiType instanceof ABIAddressType) {
      return 'string'
    }
    if (abiType instanceof ABIBoolType) {
      return 'boolean'
    }
    if (abiType instanceof ABIUfixedType) {
      return 'number'
    }
    if (abiType instanceof ABITupleType) {
      return `[${abiType.childTypes.map((c) => abiTypeToTs(c, ioType)).join(', ')}]`
    }
    if (abiType instanceof ABIByteType) {
      return 'number'
    }
    if (abiType instanceof ABIStringType) {
      return 'string'
    }
    return 'unknown'
  }
}
