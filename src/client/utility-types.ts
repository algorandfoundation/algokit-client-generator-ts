import { DecIndentAndCloseBlock, DocumentParts, IncIndent, indent, jsDoc, NewLine } from '../output/writer'

export function* utilityTypes(): DocumentParts {
  yield* jsDoc('A state record containing a single unsigned integer')
  yield `export type IntegerState = {`
  yield IncIndent
  yield* jsDoc('Gets the state value as a BigInt.')
  yield `asBigInt(): bigint`
  yield* jsDoc('Gets the state value as a number.')
  yield `asNumber(): number`
  yield DecIndentAndCloseBlock
  yield* jsDoc('A state record containing binary data')
  yield `export type BinaryState = {`
  yield IncIndent
  yield* jsDoc('Gets the state value as a Uint8Array')
  yield `asByteArray(): Uint8Array`
  yield* jsDoc('Gets the state value as a string')
  yield `asString(): string`
  yield DecIndentAndCloseBlock
  yield `
  /**
   * Expands types for IntelliSense so they are more human readable
   * See https://stackoverflow.com/a/69288824
   */
  export type Expand<T> = T extends (...args: infer A) => infer R
    ? (...args: Expand<A>) => Expand<R>
    : T extends infer O
      ? { [K in keyof O]: O[K] }
      : never
  `
}
