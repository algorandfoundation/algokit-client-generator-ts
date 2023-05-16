import { AlgoAppSpec } from '../schema/application'
import { CallConfigSummary, getCallConfigSummary } from './helpers/get-call-config-summary'
import { makeSafeTypeIdentifier } from '../util/sanitization'
import * as algokit from '@algorandfoundation/algokit-utils'

export type GeneratorContext = {
  app: AlgoAppSpec
  name: string
  callConfig: CallConfigSummary
  methodSignatureToUniqueName: Record<string, string>
}

export const createGeneratorContext = (app: AlgoAppSpec) => ({
  app,
  name: makeSafeTypeIdentifier(app.contract.name),
  callConfig: getCallConfigSummary(app),
  methodSignatureToUniqueName: app.contract.methods.reduce((acc, cur) => {
    const signature = algokit.getABIMethodSignature(cur)
    acc[signature] = app.contract.methods.some((m) => m.name === cur.name && m !== cur) ? signature : cur.name
    return acc
  }, {} as Record<string, string>),
})
