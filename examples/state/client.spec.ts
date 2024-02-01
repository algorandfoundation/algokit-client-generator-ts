import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import { StateAppClient } from './client'
import { expect, test, describe, beforeAll, beforeEach } from 'vitest'
import { microAlgos } from '@algorandfoundation/algokit-utils'
import { AlgorandFixture } from '@algorandfoundation/algokit-utils/types/testing'

describe('state typed client', () => {
  let localnet: AlgorandFixture
  beforeAll(() => {
    localnet = algorandFixture({
      testAccountFunding: microAlgos(100_000_000_000),
    })
  })
  beforeEach(async () => {
    await localnet.beforeEach()
  }, 10_000)

  test('Exposes state correctly', async () => {
    const { algod, indexer, testAccount } = localnet.context
    const client = new StateAppClient(
      {
        resolveBy: 'creatorAndName',
        sender: testAccount,
        creatorAddress: testAccount.addr,
        findExistingUsing: indexer,
      },
      algod,
    )
    await client.deploy({ deployTimeParams: { VALUE: 1 } })

    await client.setGlobal({ int1: 1, int2: 2, bytes1: 'asdf', bytes2: new Uint8Array([1, 2, 3, 4]) })

    const globalState = await client.getGlobalState()

    expect(globalState.int1?.asNumber()).toBe(1)
    expect(globalState.int2?.asNumber()).toBe(2)
    expect(globalState.bytes1?.asString()).toBe('asdf')
    expect(globalState.bytes2?.asByteArray()).toEqual(new Uint8Array([1, 2, 3, 4]))

    await client.optIn.optIn([])
    await client.setLocal({ int1: 1, int2: 2, bytes1: 'asdf', bytes2: new Uint8Array([1, 2, 3, 4]) })

    const localState = await client.getLocalState(testAccount)

    expect(localState.local_int1?.asNumber()).toBe(1)
    expect(localState.local_int2?.asNumber()).toBe(2)
    expect(localState.local_bytes1?.asString()).toBe('asdf')
    expect(localState.local_bytes2?.asByteArray()).toEqual(new Uint8Array([1, 2, 3, 4]))
  })

  test('Readonly methods do not consume algos', async () => {
    const { algod, indexer, testAccount } = localnet.context
    const client = new StateAppClient(
      {
        resolveBy: 'creatorAndName',
        sender: testAccount,
        creatorAddress: testAccount.addr,
        findExistingUsing: indexer,
      },
      algod,
    )
    await client.deploy({ deployTimeParams: { VALUE: 1 } })

    const minBalance = 100_000
    const txCost = 1_000

    const lowFundsAccount = await localnet.context.generateAccount({ initialFunds: microAlgos(minBalance + txCost) })

    const result = await client.callAbi({ value: 'oh hi' }, { sender: lowFundsAccount })

    expect(result.return).toBe('Hello, oh hi')

    // If we can invoke this method twice it confirms that we are still above the min balance + single tx amount and the previous call
    // did not consume algos
    await client.callAbi({ value: 'oh hi' }, { sender: lowFundsAccount })
  })

  test('Arguments with defaults defined are not required, and use their default value strategies when set to undefined', async () => {
    const { algod, indexer, testAccount } = localnet.context
    const client = new StateAppClient(
      {
        resolveBy: 'creatorAndName',
        sender: testAccount,
        creatorAddress: testAccount.addr,
        findExistingUsing: indexer,
      },
      algod,
    )
    await client.deploy({ deployTimeParams: { VALUE: 1 } })
    await client.setGlobal({ int1: 50, int2: 2, bytes1: 'asdf', bytes2: new Uint8Array([1, 2, 3, 4]) })
    await client.optIn.optIn({})
    await client.setLocal({ bytes1: 'default value', int2: 0, int1: 0, bytes2: new Uint8Array([1, 2, 3, 4]) })

    const constantDefined = await client.defaultValue({ arg_with_default: 'defined value' })
    expect(constantDefined.return).toBe('defined value')

    const constantDefault = await client.defaultValue({})
    expect(constantDefault.return).toBe('default value')

    const abiDefined = await client.defaultValueFromAbi({ arg_with_default: 'defined value' })
    expect(abiDefined.return).toBe('ABI, defined value')

    const abiDefault = await client.defaultValueFromAbi({})
    expect(abiDefault.return).toBe('ABI, default value')

    const intDefined = await client.defaultValueInt({ arg_with_default: 42 })
    expect(intDefined.return).toBe(42n)

    const intDefault = await client.defaultValueInt({})
    expect(intDefault.return).toBe(123n)

    const globalDefined = await client.defaultValueFromGlobalState({ arg_with_default: 123 })
    expect(globalDefined.return).toBe(123n)

    const globalState = await client.getGlobalState()
    const globalDefault = await client.defaultValueFromGlobalState({})
    expect(globalDefault.return).toBe(globalState.int1?.asBigInt())

    const localDefined = await client.defaultValueFromLocalState({ arg_with_default: 'defined value' })
    expect(localDefined.return).toBe('Local state, defined value')

    const localState = await client.getLocalState(testAccount)
    const localDefault = await client.defaultValueFromLocalState({})
    expect(localDefault.return).toBe(`Local state, ${localState.local_bytes1?.asString()}`)
  })

  test('Methods can be composed', async () => {
    const { algod, indexer, testAccount } = localnet.context
    const client = new StateAppClient(
      {
        resolveBy: 'creatorAndName',
        sender: testAccount,
        creatorAddress: testAccount.addr,
        findExistingUsing: indexer,
      },
      algod,
    )
    await client.deploy({ deployTimeParams: { VALUE: 1 } })

    await client
      .compose()
      .optIn.optIn({})
      .setLocal({ bytes1: 'default value', int2: 0, int1: 0, bytes2: new Uint8Array([1, 2, 3, 4]) })
      .execute()

    const localState = await client.getLocalState(testAccount)

    expect(localState.local_bytes1?.asString()).toBe('default value')
  })

  test('ABI methods which take references can be called', async () => {
    const { algod, indexer, testAccount } = localnet.context
    const client = new StateAppClient(
      {
        resolveBy: 'creatorAndName',
        sender: testAccount,
        creatorAddress: testAccount.addr,
        findExistingUsing: indexer,
      },
      algod,
    )
    await client.deploy({ deployTimeParams: { VALUE: 1 } })

    // Call with number
    await client.callWithReferences({
      asset: 1234,
      account: testAccount.addr,
      application: (await client.appClient.getAppReference()).appId,
    })
  })
})
