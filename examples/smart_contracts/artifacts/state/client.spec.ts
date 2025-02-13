import { StateFactory } from './client'
import { expect, test, describe, beforeAll, beforeEach } from 'vitest'
import { microAlgos } from '@algorandfoundation/algokit-utils'
import { AlgorandFixture } from '@algorandfoundation/algokit-utils/types/testing'
import { setUpLocalnet } from '../../../../src/tests/util'

describe('state typed client', () => {
  let localnet: AlgorandFixture
  let factory: StateFactory

  beforeAll(async () => {
    localnet = await setUpLocalnet()
  })
  beforeEach(async () => {
    await localnet.beforeEach()
    const { algorand, testAccount } = localnet.context
    factory = algorand.client.getTypedAppFactory(StateFactory, {
      defaultSender: testAccount.addr,
    })
  }, 10_000)

  test('Handles uint conversion correctly', async () => {
    const { appClient: client } = await factory.deploy({ deployTimeParams: { VALUE: 1 } })

    const uint32 = await client.callAbiUint32Readonly({ args: { input: 123n } })
    expect(uint32).toBe(123)

    const uint64 = await client.callAbiUint64Readonly({ args: { input: 123 } })
    expect(uint64).toBe(123n)

    const uint32Result = await client.send.callAbiUint32({ args: { input: 123n } })
    expect(uint32Result.return).toBe(123)

    const uint64Result = await client.send.callAbiUint64({ args: { input: 123 } })
    expect(uint64Result.return).toBe(123n)
  })

  test('Exposes state correctly', async () => {
    const { testAccount } = localnet.context

    const { appClient: client } = await factory.deploy({ deployTimeParams: { VALUE: 1 } })

    await client.send.setGlobal({ args: { int1: 1, int2: 2, bytes1: 'asdf', bytes2: new Uint8Array([1, 2, 3, 4]) } })

    const globalState = await client.state.global.getAll()

    expect(globalState.int1).toBe(1n)
    expect(globalState.int2).toBe(2n)
    expect(globalState.bytes1?.asString()).toBe('asdf')
    expect(globalState.bytes2?.asByteArray()).toEqual(new Uint8Array([1, 2, 3, 4]))

    await client.send.optIn.optIn()
    await client.send.setLocal({ args: { int1: 1, int2: 2, bytes1: 'asdf', bytes2: new Uint8Array([1, 2, 3, 4]) } })

    const localState = await client.state.local(testAccount.addr).getAll()

    expect(localState.localInt1).toBe(1n)
    expect(localState.localInt2).toBe(2n)
    expect(localState.localBytes1?.asString()).toBe('asdf')
    expect(localState.localBytes2?.asByteArray()).toEqual(new Uint8Array([1, 2, 3, 4]))
  })

  test('Readonly methods do not consume algos', async () => {
    const { appClient: client } = await factory.deploy({ deployTimeParams: { VALUE: 1 } })

    const minBalance = 100_000
    const txCost = 1_000

    const lowFundsAccount = await localnet.context.generateAccount({ initialFunds: microAlgos(minBalance + txCost) })

    const result = await client.send.callAbi({ args: { value: 'oh hi' }, sender: lowFundsAccount.addr })

    expect(result.return).toBe('Hello, oh hi')

    // If we can invoke this method twice it confirms that we are still above the min balance + single tx amount and the previous call
    // did not consume algos
    const result2 = await client.send.callAbi({ args: { value: 'oh hi 2' }, sender: lowFundsAccount.addr })
    expect(result2.return).toBe('Hello, oh hi 2')
  })

  test('Arguments with defaults defined are not required, and use their default value strategies when set to undefined', async () => {
    const { testAccount } = localnet.context
    const { appClient: client } = await factory.deploy({ deployTimeParams: { VALUE: 1 } })

    await client.send.setGlobal({ args: { int1: 50, int2: 2, bytes1: 'asdf', bytes2: new Uint8Array([1, 2, 3, 4]) } })
    await client.send.optIn.optIn()
    await client.send.setLocal({ args: { bytes1: 'default value', int2: 0, int1: 0, bytes2: new Uint8Array([1, 2, 3, 4]) } })

    const constantDefined = await client.send.defaultValue({ args: { argWithDefault: 'defined value' } })
    expect(constantDefined.return).toBe('defined value')

    const constantDefault = await client.send.defaultValue()
    expect(constantDefault.return).toBe('default value')

    const abiDefined = await client.send.defaultValueFromAbi({ args: { argWithDefault: 'defined value' } })
    expect(abiDefined.return).toBe('ABI, defined value')

    const abiDefault = await client.send.defaultValueFromAbi()
    expect(abiDefault.return).toBe('ABI, default value')

    const intDefined = await client.send.defaultValueInt({ args: { argWithDefault: 42 } })
    expect(intDefined.return).toBe(42n)

    const intDefault = await client.send.defaultValueInt()
    expect(intDefault.return).toBe(123n)

    const globalDefined = await client.send.defaultValueFromGlobalState({ args: { argWithDefault: 123 } })
    expect(globalDefined.return).toBe(123n)

    const globalState = await client.state.global.getAll()
    const globalDefault = await client.send.defaultValueFromGlobalState()
    expect(globalDefault.return).toBe(globalState.int1)

    const localDefined = await client.send.defaultValueFromLocalState({ args: { argWithDefault: 'defined value' } })
    expect(localDefined.return).toBe('Local state, defined value')

    const localState = await client.state.local(testAccount.addr).getAll()
    const localDefault = await client.send.defaultValueFromLocalState()
    expect(localDefault.return).toBe(`Local state, ${localState.localBytes1?.asString()}`)
  })

  test('Methods can be composed', async () => {
    const { testAccount } = localnet.context
    const { appClient: client } = await factory.deploy({ deployTimeParams: { VALUE: 1 } })

    await client
      .newGroup()
      .optIn.optIn()
      .setLocal({ args: { bytes1: 'default value', int2: 0, int1: 0, bytes2: new Uint8Array([1, 2, 3, 4]) } })
      .send()

    const localState = await client.state.local(testAccount.addr).getAll()

    expect(localState.localBytes1?.asString()).toBe('default value')
  })

  test('ABI methods which take references can be called', async () => {
    const { testAccount } = localnet.context
    const { appClient: client } = await factory.deploy({ deployTimeParams: { VALUE: 1 } })

    // Call with number
    await client.send.callWithReferences({
      args: {
        asset: 1234n,
        account: testAccount.addr.toString(),
        application: client.appClient.appId,
      },
    })
  })
})
