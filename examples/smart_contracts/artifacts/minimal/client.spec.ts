import { MinimalFactory } from './client'
import { test, describe, beforeEach, beforeAll } from 'vitest'
import { AlgorandFixture } from '@algorandfoundation/algokit-utils/types/testing'
import { setUpLocalnet } from '../../../../src/tests/util'

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

    const factory = algorand.client.getTypedAppFactory(MinimalFactory, {
      defaultSender: testAccount.addr,
    })

    const { appClient } = await factory.deploy()
    await appClient.send.delete.bare()
  })
})
