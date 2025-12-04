import { getSanitizer, Sanitizer } from '../util/sanitization'
import { Arc56Contract } from '@algorandfoundation/algokit-utils/abi'
import { AppClientContext, createAppClientContext } from './app-client-context'

const GenerateMode = {
  FULL: 'full',
  MINIMAL: 'minimal',
} as const
export type GenerateMode = (typeof GenerateMode)[keyof typeof GenerateMode]
export const generateModes = Object.values(GenerateMode)

export type GeneratorContext = {
  name: string
  app: AppClientContext
  sanitizer: Sanitizer
  mode: GenerateMode
}

export type GeneratorOptions = {
  preserveNames: boolean
  mode: GenerateMode
}

export const createGeneratorContext = (app: Arc56Contract, options: GeneratorOptions): GeneratorContext => {
  const sanitizer = getSanitizer(options)
  const appCtx = createAppClientContext(app, sanitizer)
  return {
    sanitizer,
    name: appCtx.name.makeSafeTypeIdentifier,
    app: appCtx,
    mode: options.mode,
  }
}
