import { camelCase, pascalCase } from 'change-case'

const replaceInvalidWithUnderscore = (value: string) => value.replace(/[^a-z0-9_$]+/gi, '_')

const escapeQuotes = (value: string) => value.replace(/['"]/g, (val) => `\\${val}`)

const replaceEnclosingQuotes = (value: string) => value.replace(/^"|"$/g, '')

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
    const options = value.startsWith('_') ? { prefixCharacters: '_' } : {}
    return camelCase(replaceInvalidWithUnderscore(value), options)
  },
  makeSafeTypeIdentifier(value: string) {
    const options = value.startsWith('_') ? { prefixCharacters: '_' } : {}
    return pascalCase(replaceInvalidWithUnderscore(value), options)
  },
  makeSafeMethodIdentifier(value: string) {
    const options = value.startsWith('_') ? { prefixCharacters: '_' } : {}
    return camelCase(replaceInvalidWithUnderscore(value), options)
  },
  isSafeVariableIdentifier(value: string) {
    return /^[a-z$_][a-z0-9_$]*$/i.test(value)
  },
  makeSafeVariableIdentifier(value: string) {
    const options = value.startsWith('_') ? { prefixCharacters: '_' } : {}
    return camelCase(replaceInvalidWithUnderscore(value), options)
  },
  makeSafeStringTypeLiteral(value: string): string {
    return escapeQuotes(value)
  },
  getSafeMemberAccessor(value: string): string {
    return this.isSafeVariableIdentifier(value) ? `.${value}` : `['${this.makeSafeStringTypeLiteral(value)}']`
  },
}

const preservingSanitiser: Sanitizer = {
  isSafeVariableIdentifier(value: string): boolean {
    return /^[a-z$_][a-z0-9_$]*$/i.test(value)
  },
  makeSafeMethodIdentifier(value: string): string {
    return this.isSafeVariableIdentifier(value) ? value : `"${this.makeSafeStringTypeLiteral(value)}"`
  },
  makeSafePropertyIdentifier(value: string): string {
    return this.isSafeVariableIdentifier(value) ? value : `"${this.makeSafeStringTypeLiteral(value)}"`
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
    return this.isSafeVariableIdentifier(value) ? `.${value}` : `['${replaceEnclosingQuotes(value)}']`
  },
}

export const getSanitizer = ({ preserveNames }: { preserveNames: boolean }) => (preserveNames ? preservingSanitiser : defaultSanitiser)
