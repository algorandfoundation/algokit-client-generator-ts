import fs from 'fs'
import path from 'path'
import { generate } from '../client/generate.js'
import { GeneratorOptions } from '../client/generator-context.js'
import { writeDocumentPartsToString } from '../output/writer.js'
import { loadApplicationJson } from '../schema/load.js'
import { expect, test, describe, beforeAll, beforeEach } from 'vitest'
import { pascalCase } from 'change-case'
import { AlgorandFixture } from '@algorandfoundation/algokit-utils/types/testing'
import { setUpLocalnet } from './util.js'

// Import all regular and slim clients
import * as duplicateStructsRegular from '../../examples/smart_contracts/artifacts/duplicate_structs/client.js'
import * as duplicateStructsSlim from '../../examples/smart_contracts/artifacts/duplicate_structs/client.slim.js'
import * as helloWorldRegular from '../../examples/smart_contracts/artifacts/hello_world/client.js'
import * as helloWorldSlim from '../../examples/smart_contracts/artifacts/hello_world/client.slim.js'
import * as lifeCycleRegular from '../../examples/smart_contracts/artifacts/life_cycle/client.js'
import * as lifeCycleSlim from '../../examples/smart_contracts/artifacts/life_cycle/client.slim.js'
import * as minimalRegular from '../../examples/smart_contracts/artifacts/minimal/client.js'
import * as minimalSlim from '../../examples/smart_contracts/artifacts/minimal/client.slim.js'
import * as stateRegular from '../../examples/smart_contracts/artifacts/state/client.js'
import * as stateSlim from '../../examples/smart_contracts/artifacts/state/client.slim.js'
import * as votingRoundRegular from '../../examples/smart_contracts/artifacts/voting_round/client.js'
import * as votingRoundSlim from '../../examples/smart_contracts/artifacts/voting_round/client.slim.js'
import * as retiRegular from '../../examples/smart_contracts/artifacts/reti/client.js'
import * as retiSlim from '../../examples/smart_contracts/artifacts/reti/client.slim.js'
import * as arc56TestRegular from '../../examples/smart_contracts/artifacts/arc56_test/client.js'
import * as arc56TestSlim from '../../examples/smart_contracts/artifacts/arc56_test/client.slim.js'
import * as nestedRegular from '../../examples/smart_contracts/artifacts/nested/client.js'
import * as nestedSlim from '../../examples/smart_contracts/artifacts/nested/client.slim.js'
import * as nfdRegular from '../../examples/smart_contracts/artifacts/nfd/client.js'
import * as nfdSlim from '../../examples/smart_contracts/artifacts/nfd/client.slim.js'
import * as structsRegular from '../../examples/smart_contracts/artifacts/structs/client.js'
import * as structsSlim from '../../examples/smart_contracts/artifacts/structs/client.slim.js'
import * as zeroCouponBondRegular from '../../examples/smart_contracts/artifacts/zero_coupon_bond/client.js'
import * as zeroCouponBondSlim from '../../examples/smart_contracts/artifacts/zero_coupon_bond/client.slim.js'
import { Arc56Contract } from '@algorandfoundation/algokit-utils/types/app-arc56'

const writeActual = process.env.TEST_ENV !== 'ci'

const arc32TestContracts = ['duplicate_structs', 'hello_world', 'life_cycle', 'minimal', 'state', 'voting_round'] as const
const arc56TestContracts = ['reti', 'arc56_test', 'nested', 'nfd', 'structs', 'zero_coupon_bond'] as const

type TestConfig = {
  contractName: string
  extension: 'arc32' | 'arc56'
  options?: GeneratorOptions
}

const testConfigs: TestConfig[] = [
  // Default configuration
  ...arc32TestContracts.map((app) => ({ contractName: app, extension: 'arc32' as const })),
  ...arc56TestContracts.map((app) => ({ contractName: app, extension: 'arc56' as const })),

  // Preserve names configuration
  ...arc32TestContracts.map((app) => ({
    contractName: app,
    extension: 'arc32' as const,
    options: { preserveNames: true },
  })),
  ...arc56TestContracts.map((app) => ({
    contractName: app,
    extension: 'arc56' as const,
    options: { preserveNames: true },
  })),

  // Slim configuration
  ...arc32TestContracts.map((app) => ({
    contractName: app,
    extension: 'arc32' as const,
    options: { slim: true },
  })),
  ...arc56TestContracts.map((app) => ({
    contractName: app,
    extension: 'arc56' as const,
    options: { slim: true },
  })),
]

describe('When generating a ts client for a the contract', () => {
  test.each(testConfigs)('$contractName $extension$outputSuffix approval', async ({ contractName, extension, options }) => {
    const dir = path.join(__dirname, `../../examples/smart_contracts/artifacts/${contractName}/`)
    const spec = await loadApplicationJson(path.join(dir, `${pascalCase(contractName)}.${extension}.json`))

    const result = writeDocumentPartsToString(generate(spec, options))
    const outputSuffix = options?.preserveNames ? '.pn' : options?.slim ? '.slim' : ''
    if (writeActual) fs.writeFileSync(path.join(dir, `client.generated${outputSuffix}.ts`), result)

    const approvedClient = fs.readFileSync(path.join(dir, `client${outputSuffix}.ts`), 'utf-8')
    expect(result).toBe(approvedClient)
  })
})

// Contracts that have both regular and slim versions for type comparison
const allTestContracts = [...arc32TestContracts, ...arc56TestContracts] as const

// Mapping of contract names to their imported modules
const contractModules: Record<string, { regular: Record<string, unknown>; slim: Record<string, unknown> }> = {
  duplicate_structs: { regular: duplicateStructsRegular, slim: duplicateStructsSlim },
  hello_world: { regular: helloWorldRegular, slim: helloWorldSlim },
  life_cycle: { regular: lifeCycleRegular, slim: lifeCycleSlim },
  minimal: { regular: minimalRegular, slim: minimalSlim },
  state: { regular: stateRegular, slim: stateSlim },
  voting_round: { regular: votingRoundRegular, slim: votingRoundSlim },
  reti: { regular: retiRegular, slim: retiSlim },
  arc56_test: { regular: arc56TestRegular, slim: arc56TestSlim },
  nested: { regular: nestedRegular, slim: nestedSlim },
  nfd: { regular: nfdRegular, slim: nfdSlim },
  structs: { regular: structsRegular, slim: structsSlim },
  zero_coupon_bond: { regular: zeroCouponBondRegular, slim: zeroCouponBondSlim },
}

describe('Client type differences', () => {
  let localnet: AlgorandFixture

  beforeAll(async () => {
    localnet = await setUpLocalnet()
  })

  beforeEach(async () => {
    await localnet.newScope()
  }, 10_000)

  test.each(allTestContracts)('%s: regular vs slim differences', async (contractName) => {
    // Get the regular and slim modules for this contract
    const { regular, slim } = contractModules[contractName]

    // Find the client class names by looking for classes ending with "Client"
    const regularClientName = Object.keys(regular).find((key) => key.endsWith('Client') && typeof regular[key] === 'function')
    const slimClientName = Object.keys(slim).find((key) => key.endsWith('Client') && typeof slim[key] === 'function')

    expect(regularClientName).toBeDefined()
    expect(slimClientName).toBeDefined()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const RegularClient = regular[regularClientName!] as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SlimClient = slim[slimClientName!] as any

    // Both clients exist as classes
    expect(typeof RegularClient).toBe('function')
    expect(typeof SlimClient).toBe('function')

    const {
      sourceInfo: _1,
      source: _2,
      byteCode: _3,
      templateVariables: _4,
      scratchVariables: _5,
      ...regularAppSpec
    } = regular.APP_SPEC as Arc56Contract
    const {
      sourceInfo: __1,
      source: __2,
      byteCode: __3,
      templateVariables: __4,
      scratchVariables: __5,
      ...slimAppSpec
    } = slim.APP_SPEC as Arc56Contract

    expect(regularAppSpec).toEqual(slimAppSpec)
    expect(Object.getOwnPropertyNames(RegularClient)).toEqual(Object.getOwnPropertyNames(SlimClient))
    expect(RegularClient.name).toBe(SlimClient.name)

    const regularClient = localnet.context.algorand.client.getTypedAppClientById(RegularClient, {
      appId: 0n,
    })

    const slimClient = localnet.context.algorand.client.getTypedAppClientById(SlimClient, {
      appId: 0n,
    })

    // Approval test the difference in keys
    const regularClientKeys = getKeysDeeply(regularClient)
    const slimClientKeys = getKeysDeeply(slimClient)
    const onlyInRegular = regularClientKeys.filter((key) => !slimClientKeys.includes(key))
    expect(onlyInRegular).toMatchSnapshot(`${contractName}-differences`)

    // Ensure regular has and App Factory and slim doesn't
    const regularFactoryName = Object.keys(regular).find((key) => key.endsWith('Factory') && !key.endsWith('ParamsFactory'))
    const slimFactoryName = Object.keys(slim).find((key) => key.endsWith('Factory') && !key.endsWith('ParamsFactory'))
    expect(regularFactoryName).toBeDefined()
    expect(slimFactoryName).toBeUndefined()
  })
})

// Deep key comparison function
function getKeysDeeply(obj: unknown, path = '', maxDepth = 10, currentDepth = 0): string[] {
  if (currentDepth >= maxDepth || obj === null || typeof obj !== 'object') {
    return []
  }

  const keys: string[] = []
  for (const key in obj as Record<string, unknown>) {
    const fullPath = path ? `${path}.${key}` : key
    keys.push(fullPath)

    try {
      const value = (obj as Record<string, unknown>)[key]
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        keys.push(...getKeysDeeply(value, fullPath, maxDepth, currentDepth + 1))
      }
    } catch {
      // Skip properties that can't be accessed
    }
  }
  return keys.sort()
}
