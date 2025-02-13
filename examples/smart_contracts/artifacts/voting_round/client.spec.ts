import * as ed from '@noble/ed25519'
import { webcrypto } from 'node:crypto'
if (!globalThis.crypto) globalThis.crypto = webcrypto
import algosdk from 'algosdk'
import invariant from 'tiny-invariant'
import { expectType } from 'tsd'
import { VotingPreconditions, VotingRoundFactory } from './client'
import { microAlgos } from '@algorandfoundation/algokit-utils'

import { expect, test, describe, beforeEach, beforeAll } from 'vitest'
import { AlgorandFixture } from '@algorandfoundation/algokit-utils/types/testing'
import { setUpLocalnet } from '../../../../src/tests/util'
const rndInt = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min

describe('voting typed client', () => {
  let factory: VotingRoundFactory
  let localnet: AlgorandFixture

  beforeAll(async () => {
    localnet = await setUpLocalnet()
  })

  beforeEach(async () => {
    await localnet.beforeEach()
    const { algorand, testAccount } = localnet.context
    factory = algorand.client.getTypedAppFactory(VotingRoundFactory, { defaultSender: testAccount.addr })
  }, 10_000)

  async function createRandomVotingRoundApp() {
    const { algorand, algod, testAccount } = localnet.context
    const status = await algod.status().do()
    const lastRound = status.lastRound
    const round = await algod.block(Number(lastRound)).do()
    const currentTime = round.block.header.timestamp

    const quorum = rndInt(1, 1000)
    const questionCount = rndInt(1, 10)
    const questionCounts = new Array(questionCount).fill(0).map((_) => rndInt(1, 10))
    const totalQuestionOptions = questionCounts.reduce((a, b) => a + b, 0)

    const privateKey = Uint8Array.from(Buffer.from(ed.utils.randomPrivateKey()))
    const publicKey = await ed.getPublicKeyAsync(privateKey)

    const { result: createResult, appClient: client } = await factory.send.create.create({
      args: {
        voteId: `V${new Date().getTime().toString(32).toUpperCase()}`,
        metadataIpfsCid: 'cid',
        startTime: BigInt(currentTime),
        endTime: BigInt(currentTime + 1000n),
        quorum: BigInt(quorum),
        snapshotPublicKey: publicKey,
        nftImageUrl: 'ipfs://cid',
        optionCounts: questionCounts,
      },
      deletable: true,
      staticFee: (1_000 + 1_000 * 4).microAlgo(),
    })
    expectType<void>(createResult.return)

    const randomAnswerIds = questionCounts.map((c) => rndInt(0, c - 1))

    const signature = await ed.signAsync(testAccount.publicKey, privateKey)
    return {
      algorand,
      algod,
      client,
      totalQuestionOptions,
      testAccount,
      privateKey,
      quorum,
      questionCount,
      questionCounts,
      publicKey,
      currentTime,
      signature,
      randomAnswerIds,
    }
  }

  test('struct_mapping', async () => {
    const { testAccount, totalQuestionOptions, privateKey, client } = await createRandomVotingRoundApp()

    await client.createTransaction.bootstrap({
      args: {
        fundMinBalReq: client.appClient.createTransaction.fundAppAccount({
          amount: microAlgos(200_000 + 1_000 + 2_500 + 400 * (1 + 8 * totalQuestionOptions)),
        }),
      },
      boxReferences: ['V'],
      staticFee: (1_000 + 1_000 * 4).microAlgo(),
    })

    const signature = await ed.signAsync(testAccount.publicKey, privateKey)
    const preconditionsResult = await client.getPreconditions({
      args: {
        signature,
      },
      staticFee: microAlgos(1_000 + 3 * 1_000),
      boxReferences: [testAccount],
    })
    expectType<VotingPreconditions>(preconditionsResult)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (preconditionsResult as any).currentTime
    expect(preconditionsResult).toMatchInlineSnapshot(`
      {
        "hasAlreadyVoted": 0n,
        "isAllowedToVote": 1n,
        "isVotingOpen": 0n,
      }
    `)
  })

  test('global_state', async () => {
    const { questionCounts, currentTime, quorum, publicKey, totalQuestionOptions, client } = await createRandomVotingRoundApp()
    const state = await client.state.global.getAll()

    invariant(state.snapshotPublicKey !== undefined)
    expect(state.snapshotPublicKey.asByteArray()).toEqual(publicKey)

    expect(state.metadataIpfsCid?.asString()).toBe('cid')
    expect(state.startTime).toBe(currentTime)
    expect(state.endTime).toBe(currentTime + 1000n)
    expect(state.closeTime).toBe(0n)
    expect(state.quorum).toBe(BigInt(quorum))
    expect(state.isBootstrapped).toBe(0n)
    expect(state.voterCount).toBe(0n)
    expect(state.nftImageUrl?.asString()).toBe('ipfs://cid')
    expect(state.nftAssetId).toBe(0n)
    expect(state.totalOptions).toBe(BigInt(totalQuestionOptions))
    const optionCountsType = new algosdk.ABIArrayDynamicType(new algosdk.ABIUintType(8))
    expect(optionCountsType.decode(state.optionCounts!.asByteArray()!).map(Number)).toEqual(questionCounts)
  })

  describe('given a usage scenario', () => {
    test('it works with separate transactions', async () => {
      const { signature, testAccount, totalQuestionOptions, randomAnswerIds, client } = await createRandomVotingRoundApp()

      const preconditionsResultBefore = await client.send.getPreconditions({
        args: {
          signature,
        },
        staticFee: microAlgos(1_000 + 3 * 1_000),
        boxReferences: [testAccount],
      })

      expect(preconditionsResultBefore.return?.isAllowedToVote).toBe(1n)
      expect(preconditionsResultBefore.return?.hasAlreadyVoted).toBe(0n)

      await client.send.bootstrap({
        args: {
          fundMinBalReq: client.appClient.createTransaction.fundAppAccount({
            amount: microAlgos(200_000 + 1_000 + 2_500 + 400 * (1 + 8 * totalQuestionOptions)),
          }),
        },
        boxReferences: ['V'],
        staticFee: microAlgos(1_000 + 1_000 * 4),
      })

      await client.send.vote({
        args: {
          answerIds: randomAnswerIds,
          fundMinBalReq: client.appClient.createTransaction.fundAppAccount({
            amount: microAlgos(400 * (32 + 2 + randomAnswerIds.length) + 2_500),
          }),
          signature,
        },
        boxReferences: ['V', testAccount],
        staticFee: microAlgos(1_000 + 1_000 * 16),
      })
      const preconditionsResultAfter = await client.send.getPreconditions({
        args: {
          signature,
        },
        staticFee: microAlgos(1_000 + 3 * 1_000),
        boxReferences: [testAccount],
      })

      expect(preconditionsResultAfter.return?.hasAlreadyVoted).toBe(1n)
    })

    test('it works with manual use of the TransactionComposer', async () => {
      const { algorand, signature, testAccount, totalQuestionOptions, randomAnswerIds, client } = await createRandomVotingRoundApp()

      const result = await algorand
        .newGroup()
        .addAppCallMethodCall(
          await client.params.getPreconditions({
            args: { signature },
            staticFee: microAlgos(1_000 + 3 * 1_000),
            boxReferences: [testAccount],
          }),
        )
        .addAppCallMethodCall(
          await client.params.bootstrap({
            args: {
              fundMinBalReq: client.appClient.createTransaction.fundAppAccount({
                amount: microAlgos(200_000 + 1_000 + 2_500 + 400 * (1 + 8 * totalQuestionOptions)),
              }),
            },
            boxReferences: ['V'],
            staticFee: microAlgos(1_000 + 1_000 * 4),
          }),
        )
        .addAppCallMethodCall(
          await client.params.vote({
            args: {
              answerIds: randomAnswerIds,
              fundMinBalReq: client.appClient.createTransaction.fundAppAccount({
                amount: microAlgos(400 * (32 + 2 + randomAnswerIds.length) + 2_500),
              }),
              signature,
            },
            boxReferences: ['V', testAccount],
            staticFee: microAlgos(1_000 + 1_000 * 16),
          }),
        )
        .addAppCallMethodCall(
          await client.params.getPreconditions({
            args: {
              signature,
            },
            staticFee: microAlgos(1_000 + 3 * 1_000),
            boxReferences: [testAccount],
            note: 'hmmm',
          }),
        )
        .execute()

      expect(result.returns).toBeDefined()
    })

    test('it works using the fluent composer', async () => {
      const { signature, testAccount, totalQuestionOptions, randomAnswerIds, client } = await createRandomVotingRoundApp()

      const result = await client
        .newGroup()
        .getPreconditions({
          args: {
            signature,
          },
          staticFee: microAlgos(1_000 + 3 * 1_000),
          boxReferences: [testAccount],
        })
        .bootstrap({
          args: {
            fundMinBalReq: client.appClient.createTransaction.fundAppAccount({
              amount: microAlgos(200_000 + 1_000 + 2_500 + 400 * (1 + 8 * totalQuestionOptions)),
            }),
          },
          boxReferences: ['V'],
          staticFee: microAlgos(1_000 + 1_000 * 4),
        })
        .vote({
          args: {
            answerIds: randomAnswerIds,
            fundMinBalReq: client.appClient.createTransaction.fundAppAccount({
              amount: microAlgos(400 * (32 + 2 + randomAnswerIds.length) + 2_500),
            }),
            signature,
          },
          boxReferences: ['V', testAccount],
          staticFee: microAlgos(1_000 + 1_000 * 16),
        })
        .getPreconditions({
          args: {
            signature,
          },
          staticFee: microAlgos(1_000 + 3 * 1_000),
          boxReferences: [testAccount],
          note: 'hmmm',
        })
        .send()

      expect(result.returns[0]?.hasAlreadyVoted).toBe(0n)
      expect(result.returns[3]?.hasAlreadyVoted).toBe(1n)
    })
  })
})
