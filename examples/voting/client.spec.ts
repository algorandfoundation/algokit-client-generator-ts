import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'

import * as ed from '@noble/ed25519'
import algosdk, { AtomicTransactionComposer } from 'algosdk'
import invariant from 'tiny-invariant'
import { expectType } from 'tsd'
import { VotingPreconditions, VotingRoundAppClient } from './client'
import { microAlgos } from '@algorandfoundation/algokit-utils'

import { expect, test, describe, beforeEach, beforeAll } from 'vitest'
import { AlgorandFixture } from '@algorandfoundation/algokit-utils/types/testing'
const rndInt = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min

describe('voting typed client', () => {
  let client: VotingRoundAppClient
  let localnet: AlgorandFixture
  beforeAll(() => {
    localnet = algorandFixture({
      testAccountFunding: microAlgos(100_000_000_000),
    })
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
        vote_id: `V${new Date().getTime().toString(32).toUpperCase()}`,
        metadata_ipfs_cid: 'cid',
        start_time: BigInt(currentTime), // todo: allow number and convert
        end_time: BigInt(currentTime + 1000),
        quorum: BigInt(quorum),
        snapshot_public_key: publicKey,
        nft_image_url: 'ipfs://cid',
        option_counts: questionCounts,
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
        fund_min_bal_req: client.appClient.fundAppAccount({
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

    invariant(state.snapshot_public_key !== undefined)
    expect(state.snapshot_public_key.asByteArray()).toEqual(publicKey)

    expect(state.metadata_ipfs_cid!.asString()).toBe('cid')
    expect(state.start_time!.asNumber()).toBe(currentTime)
    expect(state.end_time!.asNumber()).toBe(currentTime + 1000)
    expect(state.close_time!.asNumber()).toBe(0)
    expect(state.quorum!.asNumber()).toBe(quorum)
    expect(state.is_bootstrapped!.asNumber()).toBe(0)
    expect(state.voter_count!.asNumber()).toBe(0)
    expect(state.nft_image_url!.asString()).toBe('ipfs://cid')
    expect(state.nft_asset_id!.asNumber()).toBe(0)
    expect(state.total_options!.asNumber()).toBe(totalQuestionOptions)
    const optionCountsType = new algosdk.ABIArrayDynamicType(new algosdk.ABIUintType(8))
    expect(optionCountsType.decode(state.option_counts!.asByteArray()).map(Number)).toEqual(questionCounts)
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

      expect(preconditionsResultBefore.return?.is_allowed_to_vote).toBe(1n)
      expect(preconditionsResultBefore.return?.has_already_voted).toBe(0n)

      await client.bootstrap(
        {
          fund_min_bal_req: client.appClient.fundAppAccount({
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
          answer_ids: randomAnswerIds,
          fund_min_bal_req: client.appClient.fundAppAccount({
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

      expect(preconditionsResultAfter.return?.has_already_voted).toBe(1n)
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
          fund_min_bal_req: client.appClient.fundAppAccount({
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
          answer_ids: randomAnswerIds,
          fund_min_bal_req: client.appClient.fundAppAccount({
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
            fund_min_bal_req: client.appClient.fundAppAccount({
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
            answer_ids: randomAnswerIds,
            fund_min_bal_req: client.appClient.fundAppAccount({
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

      expect(result.returns[0].has_already_voted).toBe(0n)
      expect(result.returns[3].has_already_voted).toBe(1n)
    })
  })
})
