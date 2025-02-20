from typing import TypeAlias

from algopy import (
    Box,
    BoxMap,
    Bytes,
    Global,
    GlobalState,
    String,
    Txn,
    UInt64,
    arc4,
    ensure_budget,
    gtxn,
    itxn,
    log,
    op,
    subroutine,
    urange,
)

from examples.smart_contracts.base.contract import PermanenceControlARC4Contract

VoteIndexArray: TypeAlias = arc4.DynamicArray[arc4.UInt8]


class VotingPreconditions(arc4.Struct):
    is_voting_open: arc4.UInt64
    is_allowed_to_vote: arc4.UInt64
    has_already_voted: arc4.UInt64
    current_time: arc4.UInt64


class VotingRound(PermanenceControlARC4Contract):
    vote_id: GlobalState[arc4.String]
    snapshot_public_key: GlobalState[Bytes]
    metadata_ipfs_cid: GlobalState[String]
    start_time: GlobalState[UInt64]
    end_time: GlobalState[UInt64]
    close_time: GlobalState[UInt64]
    quorum: GlobalState[UInt64]
    voter_count: GlobalState[UInt64]
    is_bootstrapped: GlobalState[UInt64]
    nft_image_url: GlobalState[String]
    nft_asset_id: GlobalState[UInt64]
    total_options: GlobalState[UInt64]
    option_counts: GlobalState[VoteIndexArray]

    tallies: Box[Bytes]
    votes: BoxMap[arc4.Address, VoteIndexArray]

    @subroutine
    def store_option_counts(self, data: VoteIndexArray) -> None:
        assert data, "option_counts should be non-empty"
        assert data.length <= 112, "Can't have more than 112 questions"
        self.option_counts.value = data.copy()

        total_options = self.calculate_total_options_count()
        assert total_options <= 128, "Can't have more than 128 vote options"
        self.total_options.value = total_options

    @subroutine
    def calculate_total_options_count(self) -> UInt64:
        total_count = UInt64(0)
        for count in self.option_counts.value:
            total_count += count.native

        return total_count

    @subroutine
    def allowed_to_vote(self, signature: Bytes) -> bool:
        ensure_budget(UInt64(2000))
        return op.ed25519verify_bare(Txn.sender.bytes, signature, self.snapshot_public_key.value)

    @subroutine
    def voting_open(self) -> bool:
        return (
            self.is_bootstrapped.value == UInt64(1)
            and self.close_time.value == 0
            and self.start_time.value <= Global.latest_timestamp < self.end_time.value
        )

    @subroutine
    def already_voted(self) -> bool:
        return self.votes.maybe(arc4.Address(Txn.sender))[1]

    @arc4.abimethod(readonly=True)
    def get_preconditions(self, signature: arc4.DynamicBytes) -> VotingPreconditions:
        return VotingPreconditions(
            arc4.UInt64(self.voting_open()),
            arc4.UInt64(self.allowed_to_vote(signature.native)),
            arc4.UInt64(self.already_voted()),
            arc4.UInt64(Global.latest_timestamp),
        )

    def __init__(self) -> None:
        # Some of these were static in the original Beaker contract.
        # We need to ensure, for the ones that are flagged as such, that they are only written to
        #  exactly once in the entire lifetime of the contract.
        self.vote_id = GlobalState(arc4.String, description="The identifier of this voting_round round")  # static
        self.snapshot_public_key = GlobalState(
            Bytes,
            description="The public key of the Ed25519 compatible private key "
            "that was used to encrypt entries in the vote gating snapshot",
        )  # static
        self.metadata_ipfs_cid = GlobalState(
            String, description="The IPFS content ID of the voting_round metadata file"
        )  # static
        self.start_time = GlobalState(
            UInt64, description="The unix timestamp of the starting time of voting_round"
        )  # static
        self.end_time = GlobalState(
            UInt64, description="The unix timestamp of the ending time of voting_round"
        )  # static
        self.close_time = GlobalState(UInt64, description="The unix timestamp of the time the vote was closed")
        self.quorum = GlobalState(UInt64, description="The minimum number of voters to reach quorum")  # static
        self.voter_count = GlobalState(UInt64, description="The minimum number of voters who have voted")
        self.is_bootstrapped = GlobalState(
            UInt64, description="Whether or not the contract has been bootstrapped with answers"
        )
        self.nft_image_url = GlobalState(
            String, description="The IPFS URL of the default image to use as the media of the result NFT"
        )  # static
        self.nft_asset_id = GlobalState(UInt64, description="The asset ID of a result NFT if one has been created")
        self.total_options = GlobalState(UInt64, description="The total number of options")
        self.option_counts = GlobalState(
            VoteIndexArray, description="The number of options for each question"
        )  # static

        self.tallies = Box(Bytes, key=b"V")
        self.votes = BoxMap(arc4.Address, VoteIndexArray, key_prefix=b"")

    @arc4.abimethod(create="require")
    def create(  # noqa: PLR0913
        self,
        vote_id: arc4.String,
        snapshot_public_key: arc4.DynamicBytes,
        metadata_ipfs_cid: arc4.String,
        start_time: arc4.UInt64,
        end_time: arc4.UInt64,
        option_counts: VoteIndexArray,
        quorum: arc4.UInt64,
        nft_image_url: arc4.String,
    ) -> None:
        # store_option_counts when there is a max # of options needs ~2600 budget
        ensure_budget(UInt64(2800))

        assert start_time.native <= end_time.native, "End time should be after start time"
        assert end_time.native >= Global.latest_timestamp, "End time should be in the future"

        self.vote_id.value = vote_id
        self.snapshot_public_key.value = snapshot_public_key.native
        self.metadata_ipfs_cid.value = metadata_ipfs_cid.native
        self.start_time.value = start_time.native
        self.end_time.value = end_time.native
        self.quorum.value = quorum.native
        self.is_bootstrapped.value = UInt64(0)
        self.voter_count.value = UInt64(0)
        self.close_time.value = UInt64(0)
        self.nft_image_url.value = nft_image_url.native
        self.nft_asset_id.value = UInt64(0)
        self.store_option_counts(option_counts)

    @arc4.abimethod
    def bootstrap(self, fund_min_bal_req: gtxn.PaymentTransaction) -> None:
        self.authorize_creator()
        assert not self.is_bootstrapped.value, "Already bootstrapped"

        self.is_bootstrapped.value = UInt64(1)
        min_bal_req = (
            # minimum balance req for: ALGOs + Vote result NFT asset
            Global.min_balance
            + Global.asset_opt_in_min_balance
            +
            # Create NFT fee
            UInt64(1_000)
            +
            # TallyBox Flat + Key
            UInt64(2_500)
            + UInt64(400)
            +
            # TallyBox Value
            self.total_options.value * UInt64(8) * UInt64(400)
        )

        assert fund_min_bal_req.receiver == Global.current_application_address, "Payment must be to app address"
        log(min_bal_req)
        assert fund_min_bal_req.amount == min_bal_req, "Payment must be for the exact min balance requirement"

        self.tallies.value = op.bzero(self.total_options.value * UInt64(8))

    @arc4.abimethod
    def close(self) -> None:
        self.authorize_creator()
        ensure_budget(UInt64(20_000))

        assert self.close_time.value == 0, "Already closed"
        self.close_time.value = Global.latest_timestamp
        note = (
            String(
                '{"standard":"arc69","description":"This is a voting_round result NFT for voting_round round with ID '
            )
            + self.vote_id.value.native
            + String('.","properties":{"metadata":"ipfs://')
            + self.metadata_ipfs_cid.value
            + String('","id":"')
            + self.vote_id.value.native
            + String('","quorum":')
            + self.itoa(self.quorum.value)
            + String(',"voterCount":')
            + self.itoa(self.voter_count.value)
            + String(',"tallies":[')
        )
        for count in self.option_counts.value:
            for j in urange(count.native):
                note += String("[") if j == 0 else String("")
                note += self.itoa(op.btoi(self.tallies.value[j : j + 8]))
                note += (
                    (String("]") + (String("") if j == count.native - UInt64(1) else String(",")))
                    if j == count.native - UInt64(1)
                    else String(",")
                )
        result = itxn.AssetConfig(
            total=UInt64(1),
            decimals=UInt64(0),
            default_frozen=False,
            asset_name=String("[VOTE RESULT] ") + self.vote_id.value.native,
            unit_name=String("VOTERSLT"),
            url=self.nft_image_url.value,
            note=note + String("]}}"),
        ).submit()

        self.nft_asset_id.value = result.created_asset.id

    @arc4.abimethod
    def vote(
        self, fund_min_bal_req: gtxn.PaymentTransaction, signature: arc4.DynamicBytes, answer_ids: VoteIndexArray
    ) -> None:
        ensure_budget(UInt64(7700))

        assert self.allowed_to_vote(signature.native), "Not allowed to vote"
        assert self.voting_open(), "Voting not open"
        assert not self.already_voted(), "Already voted"

        assert answer_ids.length == self.option_counts.value.length, "Number of answers incorrect"

        min_bal_req = UInt64(2_500) + (UInt64(32 + 2) + answer_ids.length) * UInt64(400)
        assert fund_min_bal_req.receiver == Global.current_application_address, "Payment must be to app address"
        log(min_bal_req)
        assert fund_min_bal_req.amount == min_bal_req, "Payment must be the exact min balance requirement"

        cumulative_offset = UInt64(0)
        for i in urange(self.option_counts.value.length):
            assert answer_ids[i] < self.option_counts.value[i], "Answer option index invalid"

            question_offset = cumulative_offset + answer_ids[i].native
            op.Box.replace(
                self.tallies.key,
                question_offset,
                op.itob(op.btoi(op.Box.extract(self.tallies.key, question_offset, UInt64(8))) + UInt64(1)),
            )

            cumulative_offset += self.option_counts.value[i].native

        self.votes[arc4.Address(Txn.sender)] = answer_ids.copy()
        self.voter_count.value += UInt64(1)
