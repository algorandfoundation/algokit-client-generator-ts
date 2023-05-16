import fs from 'fs'
import path from 'path'
import { generate } from '../client/generate'
import { writeDocumentPartsToString } from '../output/writer'
import { load } from '../schema/load'

const writeActual = process.env.TEST_ENV !== 'ci'

const testContracts = ['helloworld', 'lifecycle', 'state', 'voting'] as const

describe('When generating a ts client for a the contract', () => {
  test.each(testContracts)('%s approval', (contractName) => {
    const dir = path.join(__dirname, `../../examples/${contractName}/`)
    const spec = load(path.join(dir, `application.json`))

    const result = writeDocumentPartsToString(generate(spec))
    if (writeActual) fs.writeFileSync(path.join(dir, `client.generated.ts`), result)

    const approvedClient = fs.readFileSync(path.join(dir, `client.ts`), 'utf-8')

    expect(result).toBe(approvedClient)
  })
})