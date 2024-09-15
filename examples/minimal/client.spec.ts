import { MinimalAppFactory } from './client'
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
    const { algorand, testAccount } = localnet.context

    const factory = algorand.client.getTypedAppFactory(MinimalAppFactory, {
      defaultSender: testAccount.addr,
    })

    const { app: client } = await factory.deploy()
    await client.send.delete.bare()
  })
})
