from algopy import arc4

from examples.smart_contracts.base.contract import ExampleARC4Contract


class Void(ExampleARC4Contract):
    @arc4.abimethod
    def do_nothing(self) -> None:
        pass
