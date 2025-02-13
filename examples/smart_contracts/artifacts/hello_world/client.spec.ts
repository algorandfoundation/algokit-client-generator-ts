import { HelloWorldClient, HelloWorldFactory } from './client'
import { expect, test, describe, beforeEach, beforeAll } from 'vitest'
import { AlgorandFixture } from '@algorandfoundation/algokit-utils/types/testing'
import { setUpLocalnet } from '../../../../src/tests/util'

describe('hello world typed client', () => {
  let localnet: AlgorandFixture

  beforeAll(async () => {
    localnet = await setUpLocalnet()
  })
  beforeEach(async () => {
    await localnet.beforeEach()
  }, 10_000)

  test('Calls hello', async () => {
    const { algorand, testAccount } = localnet.context

    const factory = algorand.client.getTypedAppFactory(HelloWorldFactory, {
      defaultSender: testAccount.addr,
    })
    const { appClient: client } = await factory.deploy()

    const response = await client.send.hello({ args: { name: 'World' } })
    expect(response.return).toBe('Hello, World')

    const response2 = await client.send.hello({ args: ['World!'] })
    expect(response2.return).toBe('Hello, World!')

    const response3 = await client.send.helloWorldCheck({ args: { name: 'World' } })
    expect(response3.return).toBe(undefined)
  })

  test('Composer works with manually added transaction', async () => {
    const { algorand, testAccount } = localnet.context

    const factory = algorand.client.getTypedAppFactory(HelloWorldFactory, {
      defaultSender: testAccount.addr,
    })
    const { appClient: client } = await factory.deploy()

    const transactions = await client.createTransaction.helloWorldCheck({ args: { name: 'World' } })

    // Test out getting the app client from algorandclient
    const client2 = await algorand.client.getTypedAppClientByCreatorAndName(HelloWorldClient, {
      creatorAddress: testAccount.addr,
    })

    const transactions2 = await client2.createTransaction.hello({ args: { name: 'Bananas' }, sender: testAccount.addr })

    // Add a transactions in the middle of the method calls and check that it doesn't mess up the return values
    const result = await client
      .newGroup()
      .hello({ args: ['World'] })
      .addTransaction(transactions.transactions[0], transactions.signers.get(0))
      .addTransaction(transactions2.transactions[0])
      .addTransaction(
        await client.appClient.createTransaction.fundAppAccount({
          amount: (100_000).microAlgo(),
        }),
      )
      .hello({ args: { name: 'World!' } })
      .send()

    expect(result.returns[0]).toBe('Hello, World')
    expect(result.returns[1]).toBe('Hello, World!')
    expect(result.txIds.length).toBe(5)
  })

  test('Simulates hello', async () => {
    const { algorand, testAccount } = localnet.context

    const factory = algorand.client.getTypedAppFactory(HelloWorldFactory, {
      defaultSender: testAccount.addr,
    })
    const { appClient: client } = await factory.deploy()

    const response = await client
      .newGroup()
      .hello({ args: { name: 'mate' } })
      .simulate()

    expect(response.returns[0]).toBe('Hello, mate')
    expect(response.simulateResponse.txnGroups[0].appBudgetConsumed).toBeLessThan(50)
  })

  test('Can be cloned', async () => {
    const { algorand, testAccount } = localnet.context

    const factory = algorand.client.getTypedAppFactory(HelloWorldFactory, {
      defaultSender: testAccount.addr,
    })
    const { appClient: client } = await factory.deploy()
    const clonedClient = client.clone({ appName: 'overridden' })

    expect(client.appName).toBe('HelloWorld')
    expect(clonedClient.appName).toBe('overridden')
  })
})
