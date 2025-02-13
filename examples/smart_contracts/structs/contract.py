# NOTE: remove above comment if you need to recompile the contract

from algopy import ARC4Contract, Box, BoxMap, GlobalState, LocalState, Txn, arc4


class Vector(arc4.Struct, kw_only=True):
    x: arc4.String
    y: arc4.String


class NestedStruct(arc4.Struct, kw_only=True):
    content: Vector


class RootStruct(arc4.Struct, kw_only=True):
    nested: NestedStruct


class Structs(ARC4Contract):
    def __init__(self) -> None:
        self.my_struct = GlobalState(Vector(x=arc4.String("1"), y=arc4.String("2")))
        self.my_nested_struct = GlobalState(
            RootStruct(nested=NestedStruct(content=Vector(x=arc4.String("1"), y=arc4.String("2"))))
        )
        self.my_localstate_struct = LocalState(Vector)
        self.my_nested_localstate_struct = LocalState(RootStruct)
        self.my_box_struct = Box(Vector)
        self.my_nested_box_struct = Box(RootStruct)
        self.my_boxmap_struct = BoxMap(arc4.UInt64, Vector)
        self.my_nested_boxmap_struct = BoxMap(arc4.UInt64, RootStruct)

    @arc4.abimethod()
    def hello(self, name: arc4.String) -> arc4.String:
        return "Hello, " + name

    @arc4.abimethod()
    def give_me_root_struct(self) -> RootStruct:
        return RootStruct(nested=NestedStruct(content=Vector(x=arc4.String("1"), y=arc4.String("2"))))

    @arc4.abimethod(allow_actions=["OptIn"])
    def opt_in(self) -> None:
        self.my_box_struct.value = Vector(x=arc4.String("1"), y=arc4.String("2"))
        self.my_nested_box_struct.value = RootStruct(
            nested=NestedStruct(content=Vector(x=arc4.String("1"), y=arc4.String("2")))
        )
        self.my_boxmap_struct[arc4.UInt64(123)] = Vector(x=arc4.String("1"), y=arc4.String("2"))
        self.my_nested_boxmap_struct[arc4.UInt64(123)] = RootStruct(
            nested=NestedStruct(content=Vector(x=arc4.String("1"), y=arc4.String("2")))
        )
        self.my_localstate_struct[Txn.sender] = Vector(x=arc4.String("1"), y=arc4.String("2"))
        self.my_nested_localstate_struct[Txn.sender] = RootStruct(
            nested=NestedStruct(content=Vector(x=arc4.String("1"), y=arc4.String("2")))
        )
