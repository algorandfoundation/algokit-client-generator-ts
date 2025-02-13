from algopy import ARC4Contract, Global, String, TemplateVar, Txn, UInt64, arc4, subroutine

DELETABLE_TEMPLATE_NAME = "DELETABLE"
UPDATABLE_TEMPLATE_NAME = "UPDATABLE"


class BaseARC4Contract(ARC4Contract):
    @subroutine
    def authorize_creator(self) -> None:
        assert Txn.sender == Global.creator_address, "unauthorized"

    @subroutine
    def itoa(self, i: UInt64) -> String:
        if i == UInt64(0):
            return String("0")
        else:
            return (self.itoa(i // UInt64(10)) if (i // UInt64(10)) > UInt64(0) else String("")) + String.from_bytes(
                String("0123456789").bytes[i % UInt64(10)]
            )


class ImmutabilityControlARC4Contract(BaseARC4Contract):
    @arc4.baremethod(allow_actions=["UpdateApplication"])
    def update(self) -> None:
        assert TemplateVar[bool](UPDATABLE_TEMPLATE_NAME), "Check app is updatable"
        self.authorize_creator()


class PermanenceControlARC4Contract(BaseARC4Contract):
    @arc4.baremethod(allow_actions=["DeleteApplication"])
    def delete(self) -> None:
        assert TemplateVar[bool](DELETABLE_TEMPLATE_NAME), "Check app is deletable"
        self.authorize_creator()


class ExampleARC4Contract(ImmutabilityControlARC4Contract, PermanenceControlARC4Contract):
    pass
