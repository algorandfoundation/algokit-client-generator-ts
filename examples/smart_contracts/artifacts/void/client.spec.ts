import { VoidFactory } from './client'
import { test, describe, beforeEach, beforeAll } from 'vitest'
import { AlgorandFixture } from '@algorandfoundation/algokit-utils/types/testing'
import { setUpLocalnet } from '../../../../src/tests/util'

describe('void typed client', () => {
  let localnet: AlgorandFixture

  beforeAll(async () => {
    localnet = await setUpLocalnet()
  })
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
