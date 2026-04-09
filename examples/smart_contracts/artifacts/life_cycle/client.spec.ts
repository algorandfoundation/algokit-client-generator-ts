import { expect, test, describe, beforeEach } from 'vitest'
import invariant from 'tiny-invariant'
import { expectType } from 'tsd'
import { LifeCycleFactory } from './client'
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import { OnApplicationComplete } from '@algorandfoundation/algokit-utils/transact'

describe('lifecycle typed client', () => {
  const localnet = algorandFixture()
  let factory: LifeCycleFactory

  beforeEach(async () => {
    await localnet.newScope()

    const { algorand, testAccount } = localnet.context
    factory = algorand.client.getTypedAppFactory(LifeCycleFactory, {
      defaultSender: testAccount.addr,
    })
  }, 10_000)

  test('create_bare', async () => {
    const { result, appClient: client } = await factory.send.create.bare({ updatable: true })

    expect(result.transaction.appCall?.onComplete).toBe(OnApplicationComplete.NoOp)

    const response = await client.send.helloStringString({ args: ['Bare'] })
    expectType<string | undefined>(response.return)
    expect(response.return).toBe('Hello, Bare\n')
  })

  test('create_bare_optin', async () => {
    const { result, appClient: client } = await factory.send.create.bare({ updatable: true, onComplete: OnApplicationComplete.OptIn })
    expect(result.transaction.appCall?.onComplete).toBe(OnApplicationComplete.OptIn)

    const response = await client.send.helloStringString({ args: ['Bare'] })
    expectType<string | undefined>(response.return)
    expect(response.return).toBe('Hello, Bare\n')
  })

  test('deploy_bare', async () => {
    const { result: createResult, appClient: client } = await factory.deploy()
    invariant(createResult.operationPerformed === 'create')
    expect(createResult.return).toBe(undefined)
    expect(createResult.transaction.appCall?.onComplete).toBe(OnApplicationComplete.NoOp)

    const response = await client.send.helloStringString({ args: ['Bare'] })
    expectType<string | undefined>(response.return)
    expect(response.return).toBe('Hello, Bare\n')
  })

  test('deploy_bare_opt_in', async () => {
    const { result: createResult, appClient: client } = await factory.deploy({
      createParams: { onComplete: OnApplicationComplete.OptIn },
    })
    invariant(createResult.operationPerformed === 'create')
    expect(createResult.return).toBe(undefined)
    expect(createResult.transaction.appCall?.onComplete).toBe(OnApplicationComplete.OptIn)

    const response = await client.send.helloStringString({ args: ['Bare'] })
    expectType<string | undefined>(response.return)
    expect(response.return).toBe('Hello, Bare\n')
  })

  test('create_1arg', async () => {
    const { result: createResult, appClient: client } = await factory.send.create.createStringString({
      args: { greeting: 'greeting' },
      updatable: true,
    })
    expectType<string | undefined>(createResult.return)
    expect(createResult.return).toBe('greeting_1')

    const response = await client.send.helloStringString({ args: ['1 Arg'] })
    expectType<string | undefined>(response.return)
    expect(response.return).toBe('greeting, 1 Arg\n')
  })

  test('deploy_create_1arg', async () => {
    const { result: createResult, appClient: client } = await factory.deploy({
      createParams: { method: 'create(string)string', args: { greeting: 'greeting' } },
    })
    invariant(createResult.operationPerformed === 'create')
    // The return in deploy isn't strongly typed since it's too complex to do
    expect(createResult.return).toBe('greeting_1')

    const response = await client.send.helloStringString({ args: ['1 Arg'] })
    expectType<string | undefined>(response.return)
    expect(response.return).toBe('greeting, 1 Arg\n')
  })

  test('create_2arg', async () => {
    const { result: createResult, appClient: client } = await factory.send.create.createStringUint32Void({
      args: { greeting: 'Greetings', times: 2 },
      updatable: true,
    })
    expectType<void | undefined>(createResult.return)

    const response = await client.send.helloStringString({ args: ['2 Arg'] })
    expectType<string | undefined>(response.return)
    expect(response.return).toBe('Greetings, 2 Arg\nGreetings, 2 Arg\n')
  })

  test('operation_methods_exist_in_composer', async () => {
    const { appClient: client } = await factory.send.create.createStringUint32Void({
      args: { greeting: 'Greetings', times: 2 },
      updatable: true,
    })
    const group = client.newGroup()
    expect(group.closeOut).toBeDefined()
    expect(group.delete).toBeDefined()
    expect(group.update).toBeDefined()
  })
})
