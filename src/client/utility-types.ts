import { DecIndentAndCloseBlock, DocumentParts, IncIndent, indent, jsDoc, NewLine } from '../output/writer'

export function* utilityTypes(): DocumentParts {
  yield `
  /**
   * A state record containing binary data
   */
  export interface BinaryState {
    /**
     * Gets the state value as a Uint8Array
     */
    asByteArray(): Uint8Array | undefined
    /**
     * Gets the state value as a string
     */
    asString(): string | undefined
  }

  class BinaryStateValue implements BinaryState {
    constructor(private value: Uint8Array | undefined) {}

    asByteArray(): Uint8Array | undefined {
      return this.value
    }

    asString(): string | undefined {
      return this.value !== undefined ? Buffer.from(this.value).toString('utf-8') : undefined
    }
  }

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
