import { test, describe, beforeAll, beforeEach } from 'vitest'
import { microAlgos } from '@algorandfoundation/algokit-utils'
import { AlgorandFixture } from '@algorandfoundation/algokit-utils/types/testing'
import { setUpLocalnet } from '../../src/tests/util'
import { Arc56TestFactory, Inputs } from './client.generated'

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
      app: appClient,
    } = await factory.send.create.createApplication({
      args: [],
      deployTimeParams: { someNumber: 1337n },
    })

    console.log('App ID:', appId, 'App Address:', appAddress)

    const inputs: Inputs = { add: { a: 1n, b: 2n }, subtract: { a: 10n, b: 5n } }

    // Call the app with default sender
    const outputs = await appClient.send.foo({ args: { inputs } })
    const { sum, difference } = outputs.return!
    console.log('sum:', sum, 'difference:', difference)

    // Call the app with a different sender
    const bob = algorand.account.random().addr

    await algorand.send.payment({
      sender: defaultSender,
      receiver: bob,
      amount: (10_000_000).microAlgo(),
    })

    const bobOutputs = await appClient.send.foo({ sender: bob, args: { inputs } })
    const { sum: bobSum, difference: bobDifference } = bobOutputs.return!
    console.log('bobSum:', bobSum, 'bobDifference:', bobDifference)

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
    } = await factory.send.create.createApplication({ deployTimeParams: { someNumber: 1337n }, args: [] })
    const anotherAppClient = factory.getAppClientById({ appId: anotherAppId, defaultSender: bob })
    console.log('App ID:', anotherAppId, 'App Address:', anotherAppAddress)

    // Composer together multiple appClients
    const result = await algorand
      .newGroup()
      .addAppCallMethodCall(
        // Use the extraFee on the main client to cover the fee for the other client
        appClient.params.foo({ extraFee: microAlgos(1_000), args: { inputs } }),
      )
      .addAppCallMethodCall(anotherAppClient.params.foo({ staticFee: microAlgos(0), args: { inputs } }))
      .execute()

    const { sum: firstSum } = appClient.decodeReturnValue('foo', result.returns![0])!
    const { sum: secondSum } = appClient.decodeReturnValue('foo', result.returns![1])!

    console.log('first sum:', firstSum, 'second sum:', secondSum)

    try {
      // This will throw an error
      await appClient.send.foo({ args: [{ subtract: { a: 1n, b: 100n }, add: { a: 1n, b: 2n } }] })
    } catch (e) {
      // We got a human error message! Error: Runtime error when executing ARC56Test (appId: 6814) in transaction DEFDPU2NOGXPMNKTHJLRI5CWLDRYRHQDBMF5HXPJ3E74GWOVKNSA: subtract.a must be greater than subtract.b
      console.log(`We got a human error message! ${e}`)
    }

    console.log('globalKey', await appClient.state.global.globalKey())

    console.log('globalMap -> foo', await appClient.state.global.globalMap.value('foo'))

    await algorand.send.payment({
      sender: defaultSender,
      receiver: appAddress,
      amount: microAlgos(1_000_000),
    })

    await appClient.send.optIn.optInToApplication()

    console.log('localKey', await appClient.state.local(defaultSender).localKey())

    console.log('localMap', await appClient.state.local(defaultSender).localMap.value('foo'))

    console.log('boxKey', await appClient.state.box.boxKey())
    console.log(
      'boxMap',
      await appClient.state.box.boxMap.value({
        add: { a: 1n, b: 2n },
        subtract: { a: 4n, b: 3n },
      }),
    )
  })
})
