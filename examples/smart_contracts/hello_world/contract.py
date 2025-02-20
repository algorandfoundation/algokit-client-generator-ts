from algopy import String, arc4

from examples.smart_contracts.base.contract import ExampleARC4Contract


class HelloWorld(ExampleARC4Contract):
    @arc4.abimethod
    def hello(self, name: String) -> String:
        return "Hello, " + name

    @arc4.abimethod
    def hello_world_check(self, name: String) -> None:
        assert name == "World"
