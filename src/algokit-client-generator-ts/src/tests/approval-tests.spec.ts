import fs from 'fs'
import path from 'path'
import { writeDocumentPartsToString } from '../output/writer'
import { generate } from '../client/generate'
import { load } from '../schema/load'

const writeActual = process.env.TEST_ENV !== 'ci'

describe('When generating a ts client for a the contract', () => {
  test.each([{ contractName: 'HelloWorldApp' }, { contractName: 'LifeCycleApp' }, { contractName: 'VotingRoundApp' }])(
    '$contractName, the' + ' generated client' + ' matches the' + ' approved one',
    ({ contractName }) => {
      const dir = path.join(__dirname, `../../../smart_contracts/artifacts/${contractName}/`)
      const spec = load(path.join(dir, `application.json`))

      const result = writeDocumentPartsToString(generate(spec))
      if (writeActual) fs.writeFileSync(path.join(dir, `client-ts.generated.ts`), result)

      const approvedClient = fs.readFileSync(path.join(dir, `client-ts.ts`), 'utf-8')

      expect(result).toBe(approvedClient)
    },
  )
})
