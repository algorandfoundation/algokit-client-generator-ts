import fs from 'fs'
import path from 'path'
import { generate } from '../client/generate.js'
import { writeDocumentPartsToString } from '../output/writer.js'
import { loadApplicationJson } from '../schema/load.js'
import { expect, test, describe, beforeAll, beforeEach } from 'vitest'
import { pascalCase } from 'change-case'
import { AlgorandFixture } from '@algorandfoundation/algokit-utils/types/testing'
import { setUpLocalnet } from './util.js'

// Import all full and minimal clients
import * as duplicateStructsFull from '../../examples/smart_contracts/artifacts/duplicate_structs/client.js'
import * as duplicateStructsMinimal from '../../examples/smart_contracts/artifacts/duplicate_structs/client.minimal.js'
import * as helloWorldFull from '../../examples/smart_contracts/artifacts/hello_world/client.js'
import * as helloWorldMinimal from '../../examples/smart_contracts/artifacts/hello_world/client.minimal.js'
import * as lifeCycleFull from '../../examples/smart_contracts/artifacts/life_cycle/client.js'
import * as lifeCycleMinimal from '../../examples/smart_contracts/artifacts/life_cycle/client.minimal.js'
import * as minimalFull from '../../examples/smart_contracts/artifacts/minimal/client.js'
import * as minimalMinimal from '../../examples/smart_contracts/artifacts/minimal/client.minimal.js'
import * as stateFull from '../../examples/smart_contracts/artifacts/state/client.js'
import * as stateMinimal from '../../examples/smart_contracts/artifacts/state/client.minimal.js'
import * as votingRoundFull from '../../examples/smart_contracts/artifacts/voting_round/client.js'
import * as votingRoundMinimal from '../../examples/smart_contracts/artifacts/voting_round/client.minimal.js'
import * as retiFull from '../../examples/smart_contracts/artifacts/reti/client.js'
import * as retiMinimal from '../../examples/smart_contracts/artifacts/reti/client.minimal.js'
import * as arc56TestFull from '../../examples/smart_contracts/artifacts/arc56_test/client.js'
import * as arc56TestMinimal from '../../examples/smart_contracts/artifacts/arc56_test/client.minimal.js'
import * as nestedFull from '../../examples/smart_contracts/artifacts/nested/client.js'
import * as nestedMinimal from '../../examples/smart_contracts/artifacts/nested/client.minimal.js'
import * as nfdFull from '../../examples/smart_contracts/artifacts/nfd/client.js'
import * as nfdMinimal from '../../examples/smart_contracts/artifacts/nfd/client.minimal.js'
import * as structsFull from '../../examples/smart_contracts/artifacts/structs/client.js'
import * as structsMinimal from '../../examples/smart_contracts/artifacts/structs/client.minimal.js'
import * as zeroCouponBondFull from '../../examples/smart_contracts/artifacts/zero_coupon_bond/client.js'
import * as zeroCouponBondMinimal from '../../examples/smart_contracts/artifacts/zero_coupon_bond/client.minimal.js'
import { Arc56Contract } from '@algorandfoundation/algokit-utils/types/app-arc56'

const writeActual = process.env.TEST_ENV !== 'ci'

const arc32TestContracts = ['duplicate_structs', 'hello_world', 'life_cycle', 'minimal', 'state', 'voting_round'] as const
const arc56TestContracts = ['reti', 'arc56_test', 'nested', 'nfd', 'structs', 'zero_coupon_bond'] as const

type TestConfig = {
  contractName: string
  extension: 'arc32' | 'arc56'
  options?: Parameters<typeof generate>[1]
}

const testConfigs: TestConfig[] = [
  // Default configuration
  ...arc32TestContracts.map((app) => ({ contractName: app, extension: 'arc32' }) satisfies TestConfig),
  ...arc56TestContracts.map((app) => ({ contractName: app, extension: 'arc56' }) satisfies TestConfig),

  // Preserve names configuration
  ...arc32TestContracts.map(
    (app) =>
      ({
        contractName: app,
        extension: 'arc32',
        options: { preserveNames: true },
      }) satisfies TestConfig,
  ),
  ...arc56TestContracts.map(
    (app) =>
      ({
        contractName: app,
        extension: 'arc56',
        options: { preserveNames: true },
      }) satisfies TestConfig,
  ),

  // Minimal configuration
  ...arc32TestContracts.map(
    (app) =>
      ({
        contractName: app,
        extension: 'arc32',
        options: { mode: 'minimal' },
      }) satisfies TestConfig,
  ),
  ...arc56TestContracts.map(
    (app) =>
      ({
        contractName: app,
        extension: 'arc56',
        options: { mode: 'minimal' },
      }) satisfies TestConfig,
  ),
]

describe('When generating a ts client for a the contract', () => {
  test.each(testConfigs)('$contractName $extension$outputSuffix approval', async ({ contractName, extension, options }) => {
    const dir = path.join(__dirname, `../../examples/smart_contracts/artifacts/${contractName}/`)
    const spec = await loadApplicationJson(path.join(dir, `${pascalCase(contractName)}.${extension}.json`))

    const result = writeDocumentPartsToString(generate(spec, options))
    const outputSuffix = options?.preserveNames ? '.pn' : options?.mode === 'minimal' ? '.minimal' : ''
    if (writeActual) fs.writeFileSync(path.join(dir, `client.generated${outputSuffix}.ts`), result)

    const approvedClient = fs.readFileSync(path.join(dir, `client${outputSuffix}.ts`), 'utf-8')
    expect(result).toBe(approvedClient)
  })
})

// Contracts that have both full and minimal versions for type comparison
const allTestContracts = [...arc32TestContracts, ...arc56TestContracts] as const

// Mapping of contract names to their imported modules
const contractModules: Record<string, { full: Record<string, unknown>; minimal: Record<string, unknown> }> = {
  duplicate_structs: { full: duplicateStructsFull, minimal: duplicateStructsMinimal },
  hello_world: { full: helloWorldFull, minimal: helloWorldMinimal },
  life_cycle: { full: lifeCycleFull, minimal: lifeCycleMinimal },
  minimal: { full: minimalFull, minimal: minimalMinimal },
  state: { full: stateFull, minimal: stateMinimal },
  voting_round: { full: votingRoundFull, minimal: votingRoundMinimal },
  reti: { full: retiFull, minimal: retiMinimal },
  arc56_test: { full: arc56TestFull, minimal: arc56TestMinimal },
  nested: { full: nestedFull, minimal: nestedMinimal },
  nfd: { full: nfdFull, minimal: nfdMinimal },
  structs: { full: structsFull, minimal: structsMinimal },
  zero_coupon_bond: { full: zeroCouponBondFull, minimal: zeroCouponBondMinimal },
}

describe('Client type differences', () => {
  let localnet: AlgorandFixture

  beforeAll(async () => {
    localnet = await setUpLocalnet()
  })

  beforeEach(async () => {
    await localnet.newScope()
  }, 10_000)

  test.each(allTestContracts)('%s: full vs minimal differences', async (contractName) => {
    // Get the full and minimal modules for this contract
    const { full, minimal } = contractModules[contractName]

    // Find the client class names by looking for classes ending with "Client"
    const fullClientName = Object.keys(full).find((key) => key.endsWith('Client') && typeof full[key] === 'function')
    const minimalClientName = Object.keys(minimal).find((key) => key.endsWith('Client') && typeof minimal[key] === 'function')

    expect(fullClientName).toBeDefined()
    expect(minimalClientName).toBeDefined()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const FullClient = full[fullClientName!] as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const MinimalClient = minimal[minimalClientName!] as any

    // Both clients exist as classes
    expect(typeof FullClient).toBe('function')
    expect(typeof MinimalClient).toBe('function')

    const {
      sourceInfo: _1,
      source: _2,
      byteCode: _3,
      templateVariables: _4,
      scratchVariables: _5,
      ...fullAppSpec
    } = full.APP_SPEC as Arc56Contract
    const {
      sourceInfo: __1,
      source: __2,
      byteCode: __3,
      templateVariables: __4,
      scratchVariables: __5,
      ...minimalAppSpec
    } = minimal.APP_SPEC as Arc56Contract

    expect(fullAppSpec).toEqual(minimalAppSpec)
    expect(Object.getOwnPropertyNames(FullClient)).toEqual(Object.getOwnPropertyNames(MinimalClient))
    expect(FullClient.name).toBe(MinimalClient.name)

    const fullClient = localnet.context.algorand.client.getTypedAppClientById(FullClient, {
      appId: 0n,
    })
    const fullComposer = fullClient.newGroup()

    const minimalClient = localnet.context.algorand.client.getTypedAppClientById(MinimalClient, {
      appId: 0n,
    })
    const minimalComposer = minimalClient.newGroup()

    // Approval test the difference in client keys
    const fullClientKeys = getKeysDeeply(fullClient)
    const minimalClientKeys = getKeysDeeply(minimalClient)
    const onlyInFullClient = fullClientKeys.filter((key) => !minimalClientKeys.includes(key))
    expect(onlyInFullClient).toMatchSnapshot(`${contractName}-client-diff`)

    // Approval test the difference in composer keys
    const fullComposerKeys = getKeysDeeply(fullComposer)
    const minimalComposerKeys = getKeysDeeply(minimalComposer)
    const onlyInFullCompose = fullComposerKeys.filter((key) => !minimalComposerKeys.includes(key))
    expect(onlyInFullCompose).toMatchSnapshot(`${contractName}-composer-diff`)

    // Ensure full has and App Factory and minimal doesn't
    const fullFactoryName = Object.keys(full).find((key) => key.endsWith('Factory') && !key.endsWith('ParamsFactory'))
    const minimalFactoryName = Object.keys(minimal).find((key) => key.endsWith('Factory') && !key.endsWith('ParamsFactory'))
    expect(fullFactoryName).toBeDefined()
    expect(minimalFactoryName).toBeUndefined()
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
