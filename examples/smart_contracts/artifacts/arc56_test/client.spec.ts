/* eslint no-console: "off" */
import { test, describe, beforeAll, beforeEach, expect } from 'vitest'
import { microAlgos } from '@algorandfoundation/algokit-utils'
import { AlgorandFixture } from '@algorandfoundation/algokit-utils/types/testing'
import { setUpLocalnet } from '../../../../src/tests/util'
import { Arc56TestFactory, Inputs } from './client'
import invariant from 'tiny-invariant'

describe('state typed client', () => {
  let localnet: AlgorandFixture

  beforeAll(async () => {
    localnet = await setUpLocalnet()
  })

  beforeEach(async () => {
    await localnet.beforeEach()
  }, 10_000)

  test('Demo works', async () => {
    const { algorand } = localnet.context

    const defaultSender = (await algorand.account.localNetDispenser()).addr

    const factory = new Arc56TestFactory({
      algorand,
      defaultSender,
    })

    const {
      result: { appId, appAddress },
      appClient,
    } = await factory.send.create.createApplication({
      args: [],
      deployTimeParams: { someNumber: 1337n },
    })

    console.log('App ID:', appId, 'App Address:', appAddress)

    const inputs: Inputs = { add: { a: 1n, b: 2n }, subtract: { a: 10n, b: 5n } }

    // Call the app with default sender
    const outputs = await appClient.send.foo({ args: { inputs } })
    const { sum, difference } = outputs.return!
    expect(sum).toBe(3n)
    expect(difference).toBe(5n)

    // Call the app with a different sender
    const bob = algorand.account.random().addr

    await algorand.send.payment({
      sender: defaultSender,
      receiver: bob,
      amount: (10_000_000).microAlgo(),
    })

    const bobOutputs = await appClient.send.foo({ sender: bob, args: { inputs } })
    const { sum: bobSum, difference: bobDifference } = bobOutputs.return!
    expect(bobSum).toBe(3n)
    expect(bobDifference).toBe(5n)

    // Overwrite some of the transaction fields
    await appClient.send.foo({
      args: { inputs },
      // The number of rounds between firstValid and lastValid will be 50
      // This is also used to determine how long the client should wait for confirmation
      validityWindow: 50,
      note: 'Hello world',
    })

    const {
      result: { appId: anotherAppId, appAddress: anotherAppAddress },
    } = await factory.send.create.createApplication({ deployTimeParams: { someNumber: 1338n }, args: [] })
    const anotherAppClient = factory.getAppClientById({ appId: anotherAppId, defaultSender: bob })
    console.log('App ID:', anotherAppId, 'App Address:', anotherAppAddress)

    // Composer together multiple appClients
    const result = await algorand
      .newGroup()
      .addAppCallMethodCall(
        // Use the extraFee on the main client to cover the fee for the other client
        await appClient.params.foo({ extraFee: microAlgos(1_000), args: { inputs } }),
      )
      .addAppCallMethodCall(await anotherAppClient.params.foo({ staticFee: microAlgos(0), args: { inputs } }))
      .execute()

    const { sum: firstSum } = appClient.decodeReturnValue('foo', result.returns![0])!
    const { sum: secondSum } = appClient.decodeReturnValue('foo', result.returns![1])!

    expect(firstSum).toBe(3n)
    expect(secondSum).toBe(3n)

    try {
      // This will throw an error
      const expectedErrorResponse = await appClient.send.foo({
        args: [{ subtract: { a: 1n, b: 100n }, add: { a: 1n, b: 2n } }],
        suppressLog: true,
      })
      console.warn(expectedErrorResponse)
      invariant(false, 'Should have thrown an error')
    } catch (e) {
      console.log(`We got a human error message! ${e}`)
      expect(e?.toString()).toMatch(
        /Runtime error when executing ARC56Test \(appId: \d+\) in transaction [A-Z0-9]+: subtract.a must be greater than subtract.b/,
      )
    }

    expect(await appClient.state.global.globalKey()).toBe(1337n)
    expect(await anotherAppClient.state.global.globalKey()).toBe(1338n)
    expect(await appClient.state.global.globalMap.value('foo')).toEqual({ foo: 13n, bar: 37n })

    await appClient.appClient.fundAppAccount({ amount: microAlgos(1_000_000) })

    await appClient.send.optIn.optInToApplication({ args: [], populateAppCallResources: true })

    expect(await appClient.state.local(defaultSender.toString()).localKey()).toBe(1337n)
    expect(await appClient.state.local(defaultSender.toString()).localMap.value('foo')).toBe('bar')
    expect(await appClient.state.box.boxKey()).toBe('baz')
    expect(
      await appClient.state.box.boxMap.value({
        add: { a: 1n, b: 2n },
        subtract: { a: 4n, b: 3n },
      }),
    ).toEqual({
      sum: 3n,
      difference: 1n,
    })
  })
})
