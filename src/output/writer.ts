import type fs from 'fs'

export const IncIndent = Symbol('Increase Indent')
export const DecIndent = Symbol('Decrease Indent')
export const DecIndentAndCloseBlock = Symbol('Decrease Indent and write a closing brace')
export const NewLineMode = Symbol('New Line Mode')
export const RestoreLineMode = Symbol('Restore Line Mode')
export const PropertyDelimiter = Symbol('Property Delimiter')
export const InlineMode = Symbol('Inline Mode')
export const NewLine = Symbol('New Line')

export type Part =
  | string
  | typeof IncIndent
  | typeof DecIndent
  | typeof NewLineMode
  | typeof DecIndentAndCloseBlock
  | typeof InlineMode
  | typeof NewLine
  | typeof RestoreLineMode
  | typeof PropertyDelimiter
export type DocumentParts = Generator<Part, void>

export type WriteOptions = {
  indent?: string
  disableEslint?: boolean
  header?: string
}

interface StringWriter {
  write(value: string): void
  get last(): string
}

export function writeDocumentPartsToStream(document: DocumentParts, stream: fs.WriteStream, options: WriteOptions = {}) {
  const writer = {
    _last: '',
    write(val: string) {
      this._last = val
      stream.write(val)
    },
    get last() {
      return this._last
    },
  }
  writeDocumentPartsTo(document, options, writer)
}

export function writeDocumentPartsToString(document: DocumentParts, options: WriteOptions = {}) {
  const writer = {
    result: [] as string[],
    _last: '',
    write(val: string) {
      this._last = val
      this.result.push(val)
    },
    get last() {
      return this._last
    },
    toString() {
      return this.result.join('')
    },
  }
  writeDocumentPartsTo(document, options, writer)
  return writer.toString()
}

export function* inline(...parts: Array<Part | DocumentParts>) {
  yield InlineMode
  for (const part of parts) {
    if (typeof part === 'string' || typeof part === 'symbol') yield part
    else yield* part
  }
  yield RestoreLineMode
}

export function* indent(...parts: Array<Part | DocumentParts>) {
  yield IncIndent
  for (const part of parts) {
    if (typeof part === 'string' || typeof part === 'symbol') yield part
    else yield* part
  }
  yield DecIndent
}

export function* jsDoc(docs: string | { description: string; abiDescription?: string; params?: Record<string, string>; returns?: string }) {
  yield `/**`
  if (typeof docs === 'string') {
    yield ` * ${docs}`
  } else {
    yield ` * ${docs.description}`
    if (docs.abiDescription) {
      yield ' *'
      yield ` * ${docs.abiDescription}`
    }
    if (docs.params || docs.returns) {
      yield ' *'
    }
    for (const [paramName, paramDesc] of Object.entries(docs.params ?? {})) {
      yield ` * @param ${paramName} ${paramDesc}`
    }
    if (docs.returns) yield ` * @returns ${docs.returns}`
  }
  yield ' */'
}

function writeDocumentPartsTo(document: DocumentParts, { indent = '  ', ...options }: WriteOptions, writer: StringWriter): void {
  if (options.header) writer.write(`${options.header}\n`)
  if (options.disableEslint) writer.write('/* eslint-disable */\n')

  const lineModes = [NewLineMode]
  const currentLineMode = () => lineModes.at(-1) ?? NewLineMode

  let curIndent = ''
  for (const part of document) {
    switch (part) {
      case IncIndent:
        curIndent += indent
        break
      case DecIndent:
        curIndent = curIndent.slice(0, -indent.length)
        break
      case DecIndentAndCloseBlock:
        curIndent = curIndent.slice(0, -indent.length)
        writer.write(`${curIndent}}\n`)
        break
      case NewLineMode:
        lineModes.push(NewLineMode)
        if (writer.last.slice(-1)[0] !== '\n') {
          writer.write('\n')
        }
        break
      case InlineMode:
        lineModes.push(InlineMode)
        break
      case RestoreLineMode:
        lineModes.pop()

        if (currentLineMode() === NewLineMode && writer.last.slice(-1)[0] !== '\n') {
          writer.write('\n')
        }
        break
      case PropertyDelimiter:
        if (currentLineMode() === NewLineMode) {
          writer.write('\n')
        } else {
          writer.write(', ')
        }
        break
      case NewLine:
        writer.write('\n')
        break
      default:
        // Multi-line
        if (part.includes('\n') || part.includes('\r')) {
          if (writer.last.slice(-1)[0] !== '\n') writer.write('\n')
          const normalisedLineEndings = part.replaceAll(/\r\n/g, '\n').replaceAll(/\r/g, '\n').replace(/^\n/, '').trimEnd()
          const lines = normalisedLineEndings.split('\n')
          let baseIndent = lines[0].match(/^\s+/)?.[0] ?? ''
          for (const line of lines) {
            writer.write(curIndent + line.replace(new RegExp(`^${baseIndent}`, ''), '').trimEnd())
            writer.write('\n')
          }
        } else {
          if (writer.last.slice(-1)[0] === '\n') writer.write(curIndent)
          writer.write(part)
        }
        if (currentLineMode() === NewLineMode) writer.write('\n')
        break
    }
  }
}
