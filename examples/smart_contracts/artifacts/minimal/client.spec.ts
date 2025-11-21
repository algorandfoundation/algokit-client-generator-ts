import { MinimalFactory } from './client'
import { test, describe, beforeEach } from 'vitest'
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'

describe('minimal typed client', () => {
  const localnet = algorandFixture()

  beforeEach(async () => {
    await localnet.newScope()
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
