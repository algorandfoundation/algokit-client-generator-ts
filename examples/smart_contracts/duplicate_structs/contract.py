# pyright: reportMissingModuleSource=false
from algopy import ARC4Contract, arc4


class SomeStruct(arc4.Struct):
    """Struct with two arc4.UInt64 for returning multiple values"""

    a: arc4.UInt64
    b: arc4.UInt64


class DuplicateStructs(ARC4Contract):
    """
    Used for snapshot testing to ensure no duplicate struct definitions in typed clients.
    """

    @arc4.abimethod
    def method_a_that_uses_struct(self) -> SomeStruct:
        return SomeStruct(
            arc4.UInt64(1),
            arc4.UInt64(2),
        )

    @arc4.abimethod
    def method_b_that_uses_same_struct(self) -> SomeStruct:
        return SomeStruct(
            arc4.UInt64(3),
            arc4.UInt64(4),
        )
