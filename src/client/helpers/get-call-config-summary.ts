import { pascalCase } from 'change-case'
import { AlgoAppSpec, CallConfig, CallConfigValue } from '../../schema/application'

export const BARE_CALL = Symbol('bare')

export type MethodIdentifier = string | typeof BARE_CALL

export type MethodList = Array<MethodIdentifier>

export type CallConfigSummary = {
  createMethods: MethodList
  callMethods: MethodList
  deleteMethods: MethodList
  updateMethods: MethodList
  optInMethods: MethodList
  closeOutMethods: MethodList
}
export const getCallConfigSummary = (app: AlgoAppSpec) => {
  const result: CallConfigSummary = {
    createMethods: [],
    callMethods: [],
    deleteMethods: [],
    updateMethods: [],
    optInMethods: [],
    closeOutMethods: [],
  }
  if (app.bare_call_config) {
    addToConfig(result, BARE_CALL, app.bare_call_config)
  }
  if (app.hints) {
    for (const [method, hints] of Object.entries(app.hints)) {
      if (hints.call_config) {
        addToConfig(result, method, hints.call_config)
      }
    }
  }
  return result
}

export const getCreateOnComplete = (app: AlgoAppSpec, method: MethodIdentifier) => {
  const callConfig = method === BARE_CALL ? app.bare_call_config : app.hints?.[method]?.call_config
  if (!callConfig) {
    return ''
  }
  const hasNoOp = callConfig.no_op === 'ALL' || callConfig.no_op === 'CREATE'
  return `{ onCompleteAction${hasNoOp ? '?' : ''}: ${getCreateOnCompleteTypes(callConfig)} }`
}

const getCreateOnCompleteTypes = (config: CallConfig) => {
  return Object.keys(config)
    .map((oc) => oc as keyof CallConfig)
    .filter((oc) => config[oc] === 'ALL' || config[oc] === 'CREATE')
    .map((oc) => `'${oc}' | OnApplicationComplete.${pascalCase(oc)}OC`)
    .join(' | ')
}

const addToConfig = (result: CallConfigSummary, method: MethodIdentifier, config: CallConfig) => {
  if (hasCall(config.no_op)) {
    result.callMethods.push(method)
  }
  if (
    hasCreate(config.no_op) ||
    hasCreate(config.opt_in) ||
    hasCreate(config.close_out) ||
    hasCreate(config.update_application) ||
    hasCreate(config.delete_application)
  ) {
    result.createMethods.push(method)
  }
  if (hasCall(config.delete_application)) {
    result.deleteMethods.push(method)
  }
  if (hasCall(config.update_application)) {
    result.updateMethods.push(method)
  }
  if (hasCall(config.opt_in)) {
    result.optInMethods.push(method)
  }
  if (hasCall(config.close_out)) {
    result.closeOutMethods.push(method)
  }
}

const hasCall = (config: CallConfigValue | undefined) => {
  return config === 'CALL' || config === 'ALL'
}
const hasCreate = (config: CallConfigValue | undefined) => {
  return config === 'CREATE' || config === 'ALL'
}
