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
  ABIStructType,
  ABIUfixedType,
  ABIUintType,
  AVMType,
  argTypeIsTransaction,
  ABITransactionType,
} from '@algorandfoundation/algokit-utils/abi'

import { Sanitizer } from '../../util/sanitization'

const bigIntOrNumberType = 'bigint | number'
const bytesOrStringType = 'Uint8Array | string'

export function getEquivalentType(
  algoType: ABIType | ABIReferenceType | ABITransactionType | AVMType | 'void',
  ioType: 'input' | 'output',
  sanitizer: Sanitizer,
): string {
  if (algoType == 'void') {
    return 'void'
  }
  if (algoType == 'AVMBytes') {
    return ioType === 'input' ? bytesOrStringType : 'Uint8Array'
  }
  if (algoType == 'AVMString') {
    return 'string'
  }
  if (algoType == 'AVMUint64') {
    return 'bigint'
  }
  if (argTypeIsTransaction(algoType)) {
    return 'AppMethodCallTransactionArgument'
  }
  if (algoType == ABIReferenceType.Account) {
    return bytesOrStringType
  }
  if (algoType == ABIReferenceType.Application || algoType == ABIReferenceType.Asset) {
    return 'bigint'
  }

  return abiTypeToTs(algoType, ioType, sanitizer)
}

export function abiTypeToTs(abiType: ABIType, ioType: 'input' | 'output', sanitizer: Sanitizer): string {
  if (abiType instanceof ABIStructType) {
    return sanitizer.makeSafeTypeIdentifier(abiType.structName)
  }

  if (abiType instanceof ABIUintType) {
    if (abiType.bitSize < 53) return ioType === 'input' ? bigIntOrNumberType : 'number'
    return ioType === 'input' ? bigIntOrNumberType : 'bigint'
  }
  if (abiType instanceof ABIArrayDynamicType) {
    if (abiType.childType instanceof ABIByteType) return 'Uint8Array'

    const childTsType = abiTypeToTs(abiType.childType, ioType, sanitizer)
    if (childTsType === bigIntOrNumberType) {
      return 'bigint[] | number[]'
    } else if (childTsType === bytesOrStringType) {
      return 'Uint8Array[] | string[]'
    }

    return `${childTsType}[]`
  }
  if (abiType instanceof ABIArrayStaticType) {
    if (abiType.childType instanceof ABIByteType) return 'Uint8Array'
    return `[${new Array(abiType.length).fill(abiTypeToTs(abiType.childType, ioType, sanitizer)).join(', ')}]`
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
    return `[${abiType.childTypes.map((c) => abiTypeToTs(c, ioType, sanitizer)).join(', ')}]`
  }
  if (abiType instanceof ABIByteType) {
    return 'number'
  }
  if (abiType instanceof ABIStringType) {
    return 'string'
  }
  return 'unknown'
}
