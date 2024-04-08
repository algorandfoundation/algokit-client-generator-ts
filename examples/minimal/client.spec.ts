import { MinimalAppClient } from './client'
import { test, describe, beforeEach, beforeAll } from 'vitest'
import { AlgorandFixture } from '@algorandfoundation/algokit-utils/types/testing'
import { setUpLocalnet } from '../../src/tests/util'

describe('minimal typed client', () => {
  let localnet: AlgorandFixture

  beforeAll(async () => {
    localnet = await setUpLocalnet()
  })
  beforeEach(async () => {
    await localnet.beforeEach()
  }, 10_000)

  test('Can be deployed and deleted', async () => {
    const { algod, indexer, testAccount } = localnet.context
    const client = new MinimalAppClient(
      {
        resolveBy: 'creatorAndName',
        sender: testAccount,
        creatorAddress: testAccount.addr,
        findExistingUsing: indexer,
      },
      algod,
    )
    await client.deploy()

    await client.delete.bare()
  })
})
