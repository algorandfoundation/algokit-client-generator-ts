import { VoidFactory } from './client'
import { test, describe, beforeEach } from 'vitest'
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'

describe('void typed client', () => {
  const localnet = algorandFixture()

  beforeEach(async () => {
    await localnet.newScope()
  }, 10_000)

  test('Can be deployed and call do_nothing method', async () => {
    const { algorand, testAccount } = localnet.context

    const factory = algorand.client.getTypedAppFactory(VoidFactory, {
      defaultSender: testAccount.addr,
    })

    const { appClient } = await factory.deploy()
    await appClient.send.doNothing()
    await appClient.send.delete.bare()
  })
})
