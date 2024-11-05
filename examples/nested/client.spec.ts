import { NestedContractFactory } from './client'
import { expect, test, describe, beforeEach, beforeAll } from 'vitest'
import { AlgorandFixture } from '@algorandfoundation/algokit-utils/types/testing'
import { setUpLocalnet } from '../../src/tests/util'
import { algo } from '@algorandfoundation/algokit-utils'

describe('hello world typed client', () => {
  let localnet: AlgorandFixture

  beforeAll(async () => {
    localnet = await setUpLocalnet()
  })
  beforeEach(async () => {
    await localnet.beforeEach()
  }, 10_000)

  test('Calls nestedMethodCall', async () => {
    const { algorand, testAccount } = localnet.context

    const factory = algorand.client.getTypedAppFactory(NestedContractFactory, {
      defaultSender: testAccount.addr,
    })
    const { appClient: client } = await factory.deploy()

    const payTxn = algorand.createTransaction.payment({ sender: testAccount.addr, receiver: testAccount.addr, amount: algo(0) })
    const nestedAppCall = await client.params.getPayTxnAmount({ args: { payTxn } })

    const response = await client.send.nestedMethodCall({ args: { _: payTxn, methodCall: nestedAppCall } })
    expect(response.return).toBe('Hello, World')
  })
})
