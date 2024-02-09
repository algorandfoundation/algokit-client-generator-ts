import { camelCase, pascalCase } from 'change-case'

const replaceInvalidWithUnderscore = (value: string) => value.replace(/[^a-z0-9_$]+/gi, '_')

const escapeQuotes = (value: string) => value.replace(/['"]/g, (val) => `\\${val}`)

export interface Sanitizer {
  makeSafeTypeIdentifier(value: string): string
  makeSafeMethodIdentifier(value: string): string
  makeSafeVariableIdentifier(value: string): string
  makeSafePropertyIdentifier(value: string): string
  makeSafeStringTypeLiteral(value: string): string
  getSafeMemberAccessor(value: string): string
  isSafeVariableIdentifier(value: string): boolean
}

const defaultSanitiser: Sanitizer = {
  makeSafePropertyIdentifier(value: string) {
    return camelCase(replaceInvalidWithUnderscore(value))
  },
  makeSafeTypeIdentifier(value: string) {
    return pascalCase(replaceInvalidWithUnderscore(value))
  },
  makeSafeMethodIdentifier(value: string) {
    return camelCase(replaceInvalidWithUnderscore(value))
  },
  isSafeVariableIdentifier(value: string) {
    return /^[a-z$_][a-z0-9_$]*$/i.test(value)
  },
  makeSafeVariableIdentifier(value: string) {
    return camelCase(replaceInvalidWithUnderscore(value))
  },
  makeSafeStringTypeLiteral(value: string): string {
    return escapeQuotes(value)
  },
  getSafeMemberAccessor(value: string): string {
    return this.isSafeVariableIdentifier(value) ? `.${value}` : `[${value}]`
  },
}

const preservingSanitiser: Sanitizer = {
  isSafeVariableIdentifier(value: string): boolean {
    return /^[a-z$_][a-z0-9_$]*$/i.test(value)
  },
  makeSafeMethodIdentifier(value: string): string {
    return this.isSafeVariableIdentifier(value) ? value : `"${escapeQuotes(value)}"`
  },
  makeSafePropertyIdentifier(value: string): string {
    return this.isSafeVariableIdentifier(value) ? value : `"${escapeQuotes(value)}"`
  },
  makeSafeTypeIdentifier(value: string): string {
    return replaceInvalidWithUnderscore(value)
  },
  makeSafeVariableIdentifier(value: string): string {
    return replaceInvalidWithUnderscore(value)
  },
  makeSafeStringTypeLiteral(value: string): string {
    return escapeQuotes(value)
  },
  getSafeMemberAccessor(value: string): string {
    return this.isSafeVariableIdentifier(value) ? `.${value}` : `[${value}]`
  },
}

export const getSanitizer = ({ preserveNames }: { preserveNames: boolean }) => (preserveNames ? preservingSanitiser : defaultSanitiser)
