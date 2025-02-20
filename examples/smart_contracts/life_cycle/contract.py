from algopy import String, UInt64, arc4, urange

from examples.smart_contracts.base.contract import ImmutabilityControlARC4Contract


class LifeCycle(ImmutabilityControlARC4Contract):
    greeting: String
    times: UInt64

    def __init__(self) -> None:
        self.greeting = String("Hello")
        self.times = UInt64(1)

    @arc4.baremethod(create="require", allow_actions=["NoOp", "OptIn"])
    def create(self) -> None:
        pass

    @arc4.abimethod(name="create", create="require")
    def create_1arg(self, greeting: String) -> String:
        self.greeting = greeting

        return greeting + String("_") + self.itoa(self.times)

    @arc4.abimethod(name="create", create="require")
    def create_2arg(self, greeting: String, times: arc4.UInt32) -> None:
        self.greeting = greeting
        self.times = times.native

    @arc4.abimethod
    def hello(self, name: String) -> String:
        result = String("")
        for i in urange(self.times):  # noqa: B007
            result += self.greeting + String(", ") + name + String("\n")

        return result

    @arc4.abimethod(name="hello")
    def hello_no_arg(self) -> String:
        result = String("")
        for i in urange(self.times):  # noqa: B007
            result += self.greeting + String(", mystery person\n")

        return result
