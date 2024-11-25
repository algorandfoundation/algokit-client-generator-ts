import { pascalCase } from 'change-case'
import { Arc56Contract } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { ABIMethod } from 'algosdk'

export const BARE_CALL = Symbol('bare')

export type MethodIdentifier = string | typeof BARE_CALL

export type MethodList = Array<MethodIdentifier>

export type OnComplete = 'NoOp' | 'OptIn' | 'CloseOut' | 'ClearState' | 'UpdateApplication' | 'DeleteApplication'

export type Actions = {
  create: ('NoOp' | 'OptIn' | 'DeleteApplication')[]
  call: OnComplete[]
}

export type CallConfigSummary = {
  createMethods: MethodList
  callMethods: MethodList
  deleteMethods: MethodList
  updateMethods: MethodList
  optInMethods: MethodList
  closeOutMethods: MethodList
}
export const getCallConfigSummary = (app: Arc56Contract) => {
  const result: CallConfigSummary = {
    createMethods: [],
    callMethods: [],
    deleteMethods: [],
    updateMethods: [],
    optInMethods: [],
    closeOutMethods: [],
  }
  if (app.bareActions) {
    addToConfig(result, BARE_CALL, app.bareActions)
  }
  if (app.methods) {
    for (const m of app.methods) {
      if (m.actions) {
        addToConfig(result, new ABIMethod(m).getSignature(), m.actions)
      }
    }
  }
  return result
}

export const getCreateOnComplete = (app: Arc56Contract, method: MethodIdentifier) => {
  const actions = method === BARE_CALL ? app.bareActions : app.methods?.find((m) => m.name === method)?.actions
  if (!actions) {
    return ''
  }
  const hasNoOp = actions.create.includes('NoOp')
  return `{ onCompleteAction${hasNoOp ? '?' : ''}: ${getCreateOnCompleteTypes(actions)} }`
}

const getCreateOnCompleteTypes = (config: Actions) => {
  return config.create.map((oc) => `'${oc}' | OnApplicationComplete.${pascalCase(oc)}OC`).join(' | ')
}

const addToConfig = (result: CallConfigSummary, method: MethodIdentifier, config: Actions) => {
  if (hasCall(config, 'NoOp')) {
    result.callMethods.push(method)
  }
  if (
    hasCreate(config, 'NoOp') ||
    hasCreate(config, 'OptIn') ||
    hasCreate(config, 'CloseOut') ||
    hasCreate(config, 'UpdateApplication') ||
    hasCreate(config, 'DeleteApplication')
  ) {
    result.createMethods.push(method)
  }
  if (hasCall(config, 'DeleteApplication')) {
    result.deleteMethods.push(method)
  }
  if (hasCall(config, 'UpdateApplication')) {
    result.updateMethods.push(method)
  }
  if (hasCall(config, 'OptIn')) {
    result.optInMethods.push(method)
  }
  if (hasCall(config, 'CloseOut')) {
    result.closeOutMethods.push(method)
  }
}

const hasCall = (config: Actions | undefined, action: OnComplete) => {
  return config?.call.includes(action)
}
const hasCreate = (config: Actions | undefined, action: OnComplete) => {
  return (config?.create as OnComplete[]).includes(action)
}
