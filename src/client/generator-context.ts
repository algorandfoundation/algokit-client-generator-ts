import { CallConfigSummary, getCallConfigSummary } from './helpers/get-call-config-summary'
import { getSanitizer, Sanitizer } from '../util/sanitization'
import { Arc56Contract } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { ABIMethod } from 'algosdk'

export type GeneratorContext = {
  app: Arc56Contract
  name: string
  callConfig: CallConfigSummary
  methodSignatureToUniqueName: Record<string, string>
  sanitizer: Sanitizer
}

export type GeneratorOptions = {
  preserveNames: boolean
}

export const createGeneratorContext = (app: Arc56Contract, options: GeneratorOptions) => {
  const sanitizer = getSanitizer(options)
  return {
    sanitizer,
    app,
    name: sanitizer.makeSafeTypeIdentifier(app.name),
    callConfig: getCallConfigSummary(app),
    methodSignatureToUniqueName: app.methods.reduce(
      (acc, cur) => {
        const signature = new ABIMethod(cur).getSignature()
        acc[signature] = app.methods.some((m) => m.name === cur.name && m !== cur) ? signature : cur.name
        return acc
      },
      {} as Record<string, string>,
    ),
  }
}
