import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import { beforeEach, describe, expect, test } from '@jest/globals'
import { HelloWorldAppClient } from './client'
import { AtomicTransactionComposer } from 'algosdk'
import { microAlgos } from '@algorandfoundation/algokit-utils'

describe('hello world typed client', () => {
  const localnet = algorandFixture({
    testAccountFunding: microAlgos(1_000_000),
  })
  beforeEach(localnet.beforeEach, 10_000)

  test('Calls hello', async () => {
    const { algod, indexer, testAccount } = localnet.context
    const client = new HelloWorldAppClient(
      {
        resolveBy: 'creatorAndName',
        sender: testAccount,
        creatorAddress: testAccount.addr,
        findExistingUsing: indexer,
      },
      algod,
    )
    await client.deploy()

    const response = await client.hello({ name: 'World' })
    expect(response.return).toBe('Hello, World')

    const response2 = await client.hello(['World!'])
    expect(response2.return).toBe('Hello, World!')

    const response3 = await client.helloWorldCheck({ name: 'World' })
    expect(response3.return).toBe(undefined)
  })

  test('Composer works with manually added transaction', async () => {
    const { algod, indexer, testAccount } = localnet.context
    const client = new HelloWorldAppClient(
      {
        resolveBy: 'creatorAndName',
        sender: testAccount,
        creatorAddress: testAccount.addr,
        findExistingUsing: indexer,
      },
      algod,
    )
    await client.deploy()

    const atc = new AtomicTransactionComposer()
    await client.helloWorldCheck({ name: 'World' }, { sendParams: { atc, skipSending: true } })
    const [transactionWithSigner] = atc.buildGroup()

    const { transaction: rawTransaction } = await client.hello({ name: 'Bananas' }, { sendParams: { skipSending: true } })

    // Add a transactions in the middle of the method calls and check that it doesn't mess up the return values
    const result = await client
      .compose()
      .hello(['World'])
      .addTransaction(transactionWithSigner)
      .addTransaction(rawTransaction)
      .addTransaction(
        client.appClient.fundAppAccount({
          amount: microAlgos(100_000),
          sendParams: { skipSending: true },
        }),
      )
      .hello({ name: 'World!' })
      .execute()

    expect(result.returns[0]).toBe('Hello, World')
    expect(result.returns[1]).toBe('Hello, World!')
    expect(result.txIds.length).toBe(5)
  })
})
