import fs from 'fs'
import path from 'path'
import { generate } from '../client/generate.js'
import { writeDocumentPartsToString } from '../output/writer.js'
import { loadApplicationJson } from '../schema/load.js'
import { expect, test, describe } from 'vitest'
import { pascalCase } from "change-case";

const writeActual = process.env.TEST_ENV !== 'ci'

const arc32TestContracts = [
  'duplicate_structs', 'hello_world', 'life_cycle', 'minimal', 'state', 'voting_round'
] as const
const arc56TestContracts = [
  'reti', 'arc56_test', 'nested', 'nfd', 'structs', 'zero_coupon_bond'
] as const
const testContracts = [
  ...arc32TestContracts.map((app) => [app, 'arc32']),
  ...arc56TestContracts.map((app) => [app, 'arc56']),
]

describe('When generating a ts client for a the contract', () => {
  test.each(testContracts)('%s approval', async (contractName, extension) => {
    const dir = path.join(__dirname, `../../examples/smart_contracts/artifacts/${contractName}/`)
    const spec = await loadApplicationJson(path.join(dir, `${pascalCase(contractName)}.${extension}.json`))

    const result = writeDocumentPartsToString(generate(spec))
    if (writeActual) fs.writeFileSync(path.join(dir, `client.generated.ts`), result)

    const approvedClient = fs.readFileSync(path.join(dir, `client.ts`), 'utf-8')
    expect(result).toBe(approvedClient)
  })
})
