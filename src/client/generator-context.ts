import { CallConfigSummary, getCallConfigSummary } from './helpers/get-call-config-summary'
import { getSanitizer, Sanitizer } from '../util/sanitization'
import { Arc56Contract } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { ABIMethod } from 'algosdk'

const GenerateMode = {
  FULL: 'full',
  MINIMAL: 'minimal',
} as const
export type GenerateMode = (typeof GenerateMode)[keyof typeof GenerateMode]
export const generateModes = Object.values(GenerateMode)

export type GeneratorContext = {
  app: Arc56Contract
  name: string
  callConfig: CallConfigSummary
  methodSignatureToUniqueName: Record<string, string>
  sanitizer: Sanitizer
  mode: GenerateMode
}

export type GeneratorOptions = {
  preserveNames: boolean
  mode: GenerateMode
}

export const createGeneratorContext = (app: Arc56Contract, options: GeneratorOptions): GeneratorContext => {
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
    mode: options.mode,
  }
}
