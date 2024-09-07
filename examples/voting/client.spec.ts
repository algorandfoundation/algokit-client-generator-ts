import * as ed from '@noble/ed25519'
import { webcrypto } from 'node:crypto'
// @ts-ignore https://github.com/paulmillr/noble-ed25519?tab=readme-ov-file#usage
if (!globalThis.crypto) globalThis.crypto = webcrypto
import algosdk, { AtomicTransactionComposer } from 'algosdk'
import invariant from 'tiny-invariant'
import { expectType } from 'tsd'
import { VotingPreconditions, VotingRoundAppClient } from './client'
import { microAlgos } from '@algorandfoundation/algokit-utils'

import { expect, test, describe, beforeEach, beforeAll } from 'vitest'
import { AlgorandFixture } from '@algorandfoundation/algokit-utils/types/testing'
import { setUpLocalnet } from '../../src/tests/util'
const rndInt = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min

describe('voting typed client', () => {
  let client: VotingRoundAppClient
  let localnet: AlgorandFixture

  beforeAll(async () => {
    localnet = await setUpLocalnet()
  })

  beforeEach(async () => {
    await localnet.beforeEach()
    const { algod, indexer, testAccount } = localnet.context
    client = new VotingRoundAppClient(
      {
        resolveBy: 'creatorAndName',
        sender: testAccount,
        creatorAddress: testAccount.addr,
        findExistingUsing: indexer,
      },
      algod,
    )
  }, 10_000)

  async function createRandomVotingRoundApp() {
    const { algod, testAccount } = localnet.context
    const status = await algod.status().do()
    const lastRound = Number(status['last-round'])
    const round = await algod.block(lastRound).do()
    const currentTime = Number(round.block.ts)

    const quorum = rndInt(1, 1000)
    const questionCount = rndInt(1, 10)
    const questionCounts = new Array(questionCount).fill(0).map((_) => rndInt(1, 10))
    const totalQuestionOptions = questionCounts.reduce((a, b) => a + b, 0)

    const privateKey = Buffer.from(ed.utils.randomPrivateKey())
    const publicKey = await ed.getPublicKeyAsync(privateKey)

    const createResult = await client.create.create(
      {
        voteId: `V${new Date().getTime().toString(32).toUpperCase()}`,
        metadataIpfsCid: 'cid',
        startTime: BigInt(currentTime), // todo: allow number and convert
        endTime: BigInt(currentTime + 1000),
        quorum: BigInt(quorum),
        snapshotPublicKey: publicKey,
        nftImageUrl: 'ipfs://cid',
        optionCounts: questionCounts,
      },
      { deletable: true, sendParams: { fee: (1_000 + 1_000 * 4).microAlgos() } },
    )
    expectType<void>(createResult.return)

    const randomAnswerIds = questionCounts.map((c) => rndInt(0, c - 1))

    const decoded = algosdk.decodeAddress(testAccount.addr)
    const signature = await ed.signAsync(decoded.publicKey, privateKey)
    return {
      algod,
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
    const { testAccount, totalQuestionOptions, privateKey } = await createRandomVotingRoundApp()

    await client.bootstrap(
      {
        fundMinBalReq: client.appClient.fundAppAccount({
          amount: microAlgos(200_000 + 1_000 + 2_500 + 400 * (1 + 8 * totalQuestionOptions)),
          sendParams: { skipSending: true },
        }),
      },
      {
        boxes: ['V'],
        sendParams: { fee: microAlgos(1_000 + 1_000 * 4) },
      },
    )

    const decoded = algosdk.decodeAddress(testAccount.addr)
    const signature = await ed.signAsync(decoded.publicKey, privateKey)
    const preconditionsResult = await client.getPreconditions(
      {
        signature,
      },
      {
        sendParams: { fee: microAlgos(1_000 + 3 * 1_000) },
        boxes: [testAccount],
      },
    )
    expect(preconditionsResult.return).toBeDefined()
    expectType<VotingPreconditions | undefined>(preconditionsResult.return)
  })

  test('global_state', async () => {
    const { questionCounts, currentTime, quorum, publicKey, totalQuestionOptions } = await createRandomVotingRoundApp()

    const state = await client.getGlobalState()

    invariant(state.snapshotPublicKey !== undefined)
    expect(state.snapshotPublicKey.asByteArray()).toEqual(publicKey)

    expect(state.metadataIpfsCid!.asString()).toBe('cid')
    expect(state.startTime!.asNumber()).toBe(currentTime)
    expect(state.endTime!.asNumber()).toBe(currentTime + 1000)
    expect(state.closeTime!.asNumber()).toBe(0)
    expect(state.quorum!.asNumber()).toBe(quorum)
    expect(state.isBootstrapped!.asNumber()).toBe(0)
    expect(state.voterCount!.asNumber()).toBe(0)
    expect(state.nftImageUrl!.asString()).toBe('ipfs://cid')
    expect(state.nftAssetId!.asNumber()).toBe(0)
    expect(state.totalOptions!.asNumber()).toBe(totalQuestionOptions)
    const optionCountsType = new algosdk.ABIArrayDynamicType(new algosdk.ABIUintType(8))
    expect(optionCountsType.decode(state.optionCounts!.asByteArray()).map(Number)).toEqual(questionCounts)
  })

  describe('given a usage scenario', () => {
    test('it works with separate transactions', async () => {
      const { signature, testAccount, totalQuestionOptions, randomAnswerIds } = await createRandomVotingRoundApp()

      const preconditionsResultBefore = await client.getPreconditions(
        {
          signature,
        },
        {
          sendParams: { fee: microAlgos(1_000 + 3 * 1_000) },
          boxes: [testAccount],
        },
      )

      expect(preconditionsResultBefore.return?.isAllowedToVote).toBe(1n)
      expect(preconditionsResultBefore.return?.hasAlreadyVoted).toBe(0n)

      await client.bootstrap(
        {
          fundMinBalReq: client.appClient.fundAppAccount({
            amount: microAlgos(200_000 + 1_000 + 2_500 + 400 * (1 + 8 * totalQuestionOptions)),
            sendParams: { skipSending: true },
          }),
        },
        {
          boxes: ['V'],
          sendParams: { fee: microAlgos(1_000 + 1_000 * 4) },
        },
      )

      await client.vote(
        {
          answerIds: randomAnswerIds,
          fundMinBalReq: client.appClient.fundAppAccount({
            amount: microAlgos(400 * (32 + 2 + randomAnswerIds.length) + 2_500),
            sendParams: { skipSending: true },
          }),
          signature,
        },
        {
          boxes: ['V', testAccount],
          sendParams: { fee: microAlgos(1_000 + 1_000 * 16) },
        },
      )
      const preconditionsResultAfter = await client.getPreconditions(
        {
          signature,
        },
        {
          sendParams: { fee: microAlgos(1_000 + 3 * 1_000) },
          boxes: [testAccount],
        },
      )

      expect(preconditionsResultAfter.return?.hasAlreadyVoted).toBe(1n)
    })

    test('it works with manual use of the AtomicTransactionComposer', async () => {
      const { algod, signature, testAccount, totalQuestionOptions, randomAnswerIds } = await createRandomVotingRoundApp()

      const atc = new AtomicTransactionComposer()
      await client.getPreconditions(
        {
          signature,
        },
        {
          sendParams: { fee: microAlgos(1_000 + 3 * 1_000), atc, skipSending: true },
          boxes: [testAccount],
        },
      )
      await client.bootstrap(
        {
          fundMinBalReq: client.appClient.fundAppAccount({
            amount: microAlgos(200_000 + 1_000 + 2_500 + 400 * (1 + 8 * totalQuestionOptions)),
            sendParams: { skipSending: true },
          }),
        },
        {
          boxes: ['V'],
          sendParams: { fee: microAlgos(1_000 + 1_000 * 4), atc, skipSending: true },
        },
      )
      await client.vote(
        {
          answerIds: randomAnswerIds,
          fundMinBalReq: client.appClient.fundAppAccount({
            amount: microAlgos(400 * (32 + 2 + randomAnswerIds.length) + 2_500),
            sendParams: { skipSending: true },
          }),
          signature,
        },
        {
          boxes: ['V', testAccount],
          sendParams: { fee: microAlgos(1_000 + 1_000 * 16), atc, skipSending: true },
        },
      )
      await client.getPreconditions(
        {
          signature,
        },
        {
          sendParams: { fee: microAlgos(1_000 + 3 * 1_000), atc, skipSending: true },
          boxes: [testAccount],
          note: 'hmmm',
        },
      )
      atc.buildGroup()

      const result = await atc.execute(algod, 5)

      expect(result.methodResults).toBeDefined()
    })

    test('it works using the fluent composer', async () => {
      const { signature, testAccount, totalQuestionOptions, randomAnswerIds } = await createRandomVotingRoundApp()

      const result = await client
        .compose()
        .getPreconditions(
          {
            signature,
          },
          {
            sendParams: { fee: microAlgos(1_000 + 3 * 1_000) },
            boxes: [testAccount],
          },
        )
        .bootstrap(
          {
            fundMinBalReq: client.appClient.fundAppAccount({
              amount: microAlgos(200_000 + 1_000 + 2_500 + 400 * (1 + 8 * totalQuestionOptions)),
              sendParams: { skipSending: true },
            }),
          },
          {
            boxes: ['V'],
            sendParams: { fee: microAlgos(1_000 + 1_000 * 4) },
          },
        )
        .vote(
          {
            answerIds: randomAnswerIds,
            fundMinBalReq: client.appClient.fundAppAccount({
              amount: microAlgos(400 * (32 + 2 + randomAnswerIds.length) + 2_500),
              sendParams: { skipSending: true },
            }),
            signature,
          },
          {
            boxes: ['V', testAccount],
            sendParams: { fee: microAlgos(1_000 + 1_000 * 16) },
          },
        )
        .getPreconditions(
          {
            signature,
          },
          {
            sendParams: { fee: microAlgos(1_000 + 3 * 1_000) },
            boxes: [testAccount],
            note: 'hmmm',
          },
        )
        .execute()

      expect(result.returns[0].hasAlreadyVoted).toBe(0n)
      expect(result.returns[3].hasAlreadyVoted).toBe(1n)
    })
  })
})
