import { DecIndentAndCloseBlock, DocumentParts, IncIndent, jsDoc } from '../output/writer'

export function* utilityTypes(): DocumentParts {
  yield* jsDoc(`Defines an onCompletionAction of 'no_op'`)
  yield `export type OnCompleteNoOp =  { onCompleteAction?: 'no_op' | OnApplicationComplete.NoOpOC }`
  yield* jsDoc(`Defines an onCompletionAction of 'opt_in'`)
  yield `export type OnCompleteOptIn =  { onCompleteAction: 'opt_in' | OnApplicationComplete.OptInOC }`
  yield* jsDoc(`Defines an onCompletionAction of 'close_out'`)
  yield `export type OnCompleteCloseOut =  { onCompleteAction: 'close_out' | OnApplicationComplete.CloseOutOC }`
  yield* jsDoc(`Defines an onCompletionAction of 'delete_application'`)
  yield `export type OnCompleteDelApp =  { onCompleteAction: 'delete_application' | OnApplicationComplete.DeleteApplicationOC }`
  yield* jsDoc(`Defines an onCompletionAction of 'update_application'`)
  yield `export type OnCompleteUpdApp =  { onCompleteAction: 'update_application' | OnApplicationComplete.UpdateApplicationOC }`

  yield* jsDoc('A state record containing a single unsigned integer')
  yield `export type IntegerState = {`
  yield IncIndent
  yield* jsDoc('Gets the state value as a BigInt ')
  yield `asBigInt(): bigint`
  yield* jsDoc('Gets the state value as a number.')
  yield `asNumber(): number`
  yield DecIndentAndCloseBlock
  yield* jsDoc('A state record containing binary data')
  yield `export type BinaryState = {`
  yield IncIndent
  yield* jsDoc('Gets the state value as a Uint8Array')
  yield `asByteArray(): Uint8Array`
  yield* jsDoc('Gets the state value as a string')
  yield `asString(): string`
  yield DecIndentAndCloseBlock
}

export const OnCompleteCodeMap = {
  no_op: 'OnCompleteNoOp',
  opt_in: 'OnCompleteOptIn',
  close_out: 'OnCompleteCloseOut',
  delete_application: 'OnCompleteDelApp',
  update_application: 'OnCompleteUpdApp',
}
