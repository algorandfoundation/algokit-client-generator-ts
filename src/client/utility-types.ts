import { DecIndent, DocumentParts, IncIndent } from '../output/writer'

export function* utilityTypes(): DocumentParts {
  yield 'export type CallRequest<TSignature extends string, TArgs = undefined> = {'
  yield IncIndent
  yield 'method: TSignature'
  yield 'methodArgs: TArgs'
  yield DecIndent
  yield '} & AppClientCallCoreParams & CoreAppCallArgs'

  yield `export type BareCallArgs = Omit<RawAppCallArgs, keyof CoreAppCallArgs>`

  yield `export type OnCompleteNoOp =  { onCompleteAction?: 'no_op' | OnApplicationComplete.NoOpOC }`
  yield `export type OnCompleteOptIn =  { onCompleteAction: 'opt_in' | OnApplicationComplete.OptInOC }`
  yield `export type OnCompleteCloseOut =  { onCompleteAction: 'close_out' | OnApplicationComplete.CloseOutOC }`
  yield `export type OnCompleteDelApp =  { onCompleteAction: 'delete_application' | OnApplicationComplete.DeleteApplicationOC }`
  yield `export type OnCompleteUpdApp =  { onCompleteAction: 'update_application' | OnApplicationComplete.UpdateApplicationOC }`
}

export const OnCompleteCodeMap = {
  no_op: 'OnCompleteNoOp',
  opt_in: 'OnCompleteOptIn',
  close_out: 'OnCompleteCloseOut',
  delete_application: 'OnCompleteDelApp',
  update_application: 'OnCompleteUpdApp',
}
