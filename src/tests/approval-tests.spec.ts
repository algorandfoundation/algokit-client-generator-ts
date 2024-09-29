import fs from 'fs'
import path from 'path'
import { generate } from '../client/generate.js'
import { writeDocumentPartsToString } from '../output/writer.js'
import { loadApplicationJson } from '../schema/load.js'
import { expect, test, describe } from 'vitest'

const writeActual = process.env.TEST_ENV !== 'ci'

const testContracts = ['helloworld', 'lifecycle', 'state', 'voting', 'duplicate_structs', 'minimal', 'reti', 'arc56_test'] as const

describe('When generating a ts client for a the contract', () => {
  test.each(testContracts)('%s approval', async (contractName) => {
    const dir = path.join(__dirname, `../../examples/${contractName}/`)
    const spec = await loadApplicationJson(path.join(dir, `application.json`))

    const result = writeDocumentPartsToString(generate(spec))
    if (writeActual) fs.writeFileSync(path.join(dir, `client.generated.ts`), result)

    const approvedClient = fs.readFileSync(path.join(dir, `client.ts`), 'utf-8')
    expect(result).toBe(approvedClient)
  })
})
