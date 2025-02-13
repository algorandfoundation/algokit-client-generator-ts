import { NestedFactory } from './client'
import { expect, test, describe, beforeEach, beforeAll } from 'vitest'
import { AlgorandFixture } from '@algorandfoundation/algokit-utils/types/testing'
import { setUpLocalnet } from '../../../../src/tests/util'
import { algo } from '@algorandfoundation/algokit-utils'
import base32 from 'hi-base32'

describe('nested contract typed client', () => {
  let localnet: AlgorandFixture

  beforeAll(async () => {
    localnet = await setUpLocalnet()
  })
  beforeEach(async () => {
    await localnet.beforeEach()
  }, 10_000)

  test('can call nestedMethodCall with obj args without payment transaction', async () => {
    const { algorand, testAccount } = localnet.context

    const factory = algorand.client.getTypedAppFactory(NestedFactory, {
      defaultSender: testAccount.addr,
    })
    const { appClient: client } = await factory.deploy()
    const payTxn = algorand.createTransaction.payment({ sender: testAccount.addr, receiver: testAccount.addr, amount: algo(0) })
    const nestedAppCall = await client.params.getPayTxnAmount({ args: { payTxn } })

    const response = await client.send.nestedMethodCall({ args: { _: 'test', methodCall: nestedAppCall } })

    expect(base32.encode(response.return!).slice(0, 52)).toBe(response.txIds[1])
  })

  test('can call nestedMethodCall with tuple args without payment transaction', async () => {
    const { algorand, testAccount } = localnet.context

    const factory = algorand.client.getTypedAppFactory(NestedFactory, {
      defaultSender: testAccount.addr,
    })
    const { appClient: client } = await factory.deploy()
    const payTxn = algorand.createTransaction.payment({ sender: testAccount.addr, receiver: testAccount.addr, amount: algo(0) })
    const nestedAppCall = await client.params.getPayTxnAmount({ args: [payTxn] })

    const response = await client.send.nestedMethodCall({ args: ['test', undefined, nestedAppCall] })

    expect(base32.encode(response.return!).slice(0, 52)).toBe(response.txIds[1])
  })

  test('can call nestedMethodCall with obj args with payment transaction', async () => {
    const { algorand, testAccount } = localnet.context

    const factory = algorand.client.getTypedAppFactory(NestedFactory, {
      defaultSender: testAccount.addr,
    })
    const { appClient: client } = await factory.deploy()
    const payTxn = algorand.createTransaction.payment({ sender: testAccount.addr, receiver: testAccount.addr, amount: algo(0) })
    const nestedAppCall = await client.params.add({ args: { a: 1, b: 2 } })

    const response = await client.send.nestedMethodCall({ args: { _: 'test', _payTxn: payTxn, methodCall: nestedAppCall } })

    expect(base32.encode(response.return!).slice(0, 52)).toBe(response.txIds[1])
  })

  test('can call nestedMethodCall with tuple args with payment transaction', async () => {
    const { algorand, testAccount } = localnet.context

    const factory = algorand.client.getTypedAppFactory(NestedFactory, {
      defaultSender: testAccount.addr,
    })
    const { appClient: client } = await factory.deploy()
    const payTxn = algorand.createTransaction.payment({ sender: testAccount.addr, receiver: testAccount.addr, amount: algo(0) })
    const nestedAppCall = await client.params.add({ args: [1, 2] })

    const response = await client.send.nestedMethodCall({ args: ['test', payTxn, nestedAppCall] })

    expect(base32.encode(response.return!).slice(0, 52)).toBe(response.txIds[1])
  })
})
