import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import { expect, test, describe, beforeEach, beforeAll } from 'vitest'
import { OnApplicationComplete } from 'algosdk'
import invariant from 'tiny-invariant'
import { expectType } from 'tsd'
import { LifeCycleAppClient } from './client'
import { microAlgos } from '@algorandfoundation/algokit-utils'
import { AlgorandFixture } from '@algorandfoundation/algokit-utils/types/testing'

describe('lifecycle typed client', () => {
  let localnet: AlgorandFixture
  beforeAll(() => {
    localnet = algorandFixture({
      testAccountFunding: microAlgos(100_000_000_000),
    })
  })
  let client: LifeCycleAppClient

  beforeEach(async () => {
    await localnet.beforeEach()

    const { algod, indexer, testAccount } = localnet.context
    client = new LifeCycleAppClient(
      {
        resolveBy: 'creatorAndName',
        sender: testAccount,
        creatorAddress: testAccount.addr,
        findExistingUsing: indexer,
      },
      algod,
    )
  }, 10_000)

  test('create_bare', async () => {
    const createResult = await client.create.bare({ updatable: true })
    expectType<undefined>(createResult.return)
    expect(createResult.transaction.appOnComplete).toBe(OnApplicationComplete.NoOpOC)

    const response = await client.helloStringString(['Bare'])
    expectType<string | undefined>(response.return)
    expect(response.return).toBe('Hello, Bare\n')
  })

  test('create_bare_optin', async () => {
    const createResult = await client.create.bare({ updatable: true, onCompleteAction: 'opt_in' })
    expectType<undefined>(createResult.return)
    expect(createResult.transaction.appOnComplete).toBe(OnApplicationComplete.OptInOC)

    const response = await client.helloStringString(['Bare'])
    expectType<string | undefined>(response.return)
    expect(response.return).toBe('Hello, Bare\n')
  })

  test('deploy_bare', async () => {
    const createResult = await client.deploy()
    invariant(createResult.operationPerformed === 'create')
    // The return in deploy isn't strongly typed since it's too complex to do
    expect(createResult.return?.returnValue).toBe(undefined)
    expect(createResult.transaction.appOnComplete).toBe(OnApplicationComplete.NoOpOC)

    const response = await client.helloStringString(['Bare'])
    expectType<string | undefined>(response.return)
    expect(response.return).toBe('Hello, Bare\n')
  })

  test('deploy_bare_opt_in', async () => {
    const createResult = await client.deploy({
      createCall: (calls) => calls.bare({ onCompleteAction: 'opt_in' }),
    })
    invariant(createResult.operationPerformed === 'create')
    // The return in deploy isn't strongly typed since it's too complex to do
    expect(createResult.return?.returnValue).toBe(undefined)
    expect(createResult.transaction.appOnComplete).toBe(OnApplicationComplete.OptInOC)

    const response = await client.helloStringString(['Bare'])
    expectType<string | undefined>(response.return)
    expect(response.return).toBe('Hello, Bare\n')
  })

  test('create_1arg', async () => {
    const createResult = await client.create.createStringString({ greeting: 'greeting' }, { updatable: true })
    expectType<string | undefined>(createResult.return)
    expect(createResult.return).toBe('greeting_1')

    const response = await client.helloStringString(['1 Arg'])
    expectType<string | undefined>(response.return)
    expect(response.return).toBe('greeting, 1 Arg\n')
  })

  test('deploy_create_1arg', async () => {
    const createResult = await client.deploy({
      createCall: (calls) => calls.createStringString({ greeting: 'greeting' }),
    })
    invariant(createResult.operationPerformed === 'create')
    // The return in deploy isn't strongly typed since it's too complex to do
    expect(createResult.return?.returnValue).toBe('greeting_1')

    const response = await client.helloStringString(['1 Arg'])
    expectType<string | undefined>(response.return)
    expect(response.return).toBe('greeting, 1 Arg\n')
  })

  test('create_2arg', async () => {
    const createResult = await client.create.createStringUint32Void({ greeting: 'Greetings', times: 2 }, { updatable: true })
    expectType<void | undefined>(createResult.return)

    const response = await client.helloStringString(['2 Arg'])
    expectType<string | undefined>(response.return)
    expect(response.return).toBe('Greetings, 2 Arg\nGreetings, 2 Arg\n')
  })
})
