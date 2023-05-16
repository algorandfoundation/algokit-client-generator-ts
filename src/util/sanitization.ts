import { camelCase, pascalCase } from 'change-case'

const replaceInvalidWithUnderscore = (value: string) => value.replace(/[^a-z0-9_$]+/gi, '_')

export const makeSafeTypeIdentifier = (value: string) => pascalCase(replaceInvalidWithUnderscore(value))
export const makeSafeMethodIdentifier = (value: string) => camelCase(replaceInvalidWithUnderscore(value))

export const isSafeVariableIdentifier = (value: string) => /^[a-z$_][a-z0-9_$]*$/i.test(value)

export const makeSafeVariableIdentifier = (value: string) =>
  isSafeVariableIdentifier(value) ? value : camelCase(replaceInvalidWithUnderscore(value)) || 'arg'

const escapeQuotes = (value: string) => value.replace(/['"]/g, (val) => `\\${val}`)

export const makeSafePropertyIdentifier = (value: string) => (isSafeVariableIdentifier(value) ? value : `'${escapeQuotes(value)}'`)
