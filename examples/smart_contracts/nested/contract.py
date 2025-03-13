from algopy import ARC4Contract, arc4, gtxn


class Nested(ARC4Contract):
    @arc4.abimethod
    def add(self, a: arc4.UInt64, b: arc4.UInt64) -> arc4.UInt64:
        return arc4.UInt64(a.native + b.native)

    @arc4.abimethod
    def get_pay_txn_amount(self, pay_txn: gtxn.PaymentTransaction) -> arc4.UInt64:
        return arc4.UInt64(pay_txn.amount)

    @arc4.abimethod
    def nested_method_call(
        self,
        _: arc4.String,
        _pay_txn: gtxn.PaymentTransaction,
        method_call: gtxn.ApplicationCallTransaction,
    ) -> arc4.DynamicBytes:
        return arc4.DynamicBytes(method_call.txn_id)
