import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import { beforeEach, describe, expect, test } from '@jest/globals'
import * as ed from '@noble/ed25519'
import algosdk from 'algosdk'
import invariant from 'tiny-invariant'
import { expectType } from 'tsd'
import { VotingRoundAppClient } from './client-ts.generated'
import {microAlgos} from "@algorandfoundation/algokit-utils";
import * as algokit from '@algorandfoundation/algokit-utils'

describe('voting typed client', () => {
  const localnet = algorandFixture({
    testAccountFunding: microAlgos(100_000_000_000)
  })
  beforeEach(localnet.beforeEach, 10_000)

  let client: VotingRoundAppClient

  beforeEach(() => {
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
  })

  test('struct_mapping', async() => {
    const { algod, testAccount,  } = localnet.context
    const status = await algod.status().do()
    const lastRound = Number(status['last-round'])
    const round = await algod.block(lastRound).do()
    const currentTime = Number(round.block.ts)

    const quorum = Math.ceil(Math.random() * 1000)

    const questionCount = Math.ceil(Math.random() * 10)
    const questionCounts = new Array(questionCount).fill(0).map((_) => Math.ceil(Math.random() * 10))
    const totalQuestionOptions = questionCounts.reduce((a, b) => a + b, 0)

    const privateKey = Buffer.from(ed.utils.randomPrivateKey())
    const publicKey = await ed.getPublicKey(privateKey)

    console.log((await algod.accountInformation(testAccount.addr).do()).amount)

    const createResult = await client.create( 'create',
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
    const bootstrap = await client.bootstrap({
      fund_min_bal_req: client.appClient.fundAppAccount({
        amount: microAlgos(200_000 + 1_000 + 2_500 + 400 * (1 + 8  * totalQuestionOptions)),
        sendParams: {skipSending: true}
      }),

    }, {
      boxes: ['V'],
      sendParams: {fee: microAlgos(1_000 + 1_000 * 4)}
    })

    const decoded = algosdk.decodeAddress(testAccount.addr)
    const signature = await ed.sign(decoded.publicKey, privateKey)
    const preconditionsResult = await client.getPreconditions({
      signature,
    }, {
      sendParams: {fee: microAlgos(1_000 + 3 * 1_000)},
      boxes: [testAccount]
    })
    expect(preconditionsResult.return).toBeDefined()

  })

  test('global_state', async () => {
    const { algod } = localnet.context
    const status = await algod.status().do()
    const lastRound = Number(status['last-round'])
    const round = await algod.block(lastRound).do()
    const currentTime = Number(round.block.ts)

    const quorum = Math.ceil(Math.random() * 1000)

    const questionCount = Math.ceil(Math.random() * 10)
    const questionCounts = new Array(questionCount).fill(0).map((_) => Math.ceil(Math.random() * 10))
    const totalQuestionOptions = questionCounts.reduce((a, b) => a + b, 0)

    const privateKey = Buffer.from(ed.utils.randomPrivateKey())
    const publicKey = await ed.getPublicKey(privateKey)

    const createResult = await client.create('create',
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
})
