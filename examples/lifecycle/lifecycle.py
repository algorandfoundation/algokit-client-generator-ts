import dataclasses
from typing import cast

import beaker
import pyteal as pt
from beaker.lib.iter import Iterate
from beaker.lib.strings import Itoa
from pyteal.ast import CallConfig, MethodConfig

from smart_contracts.helpers.deployment_standard import (
    deploy_time_immutability_control,
)


@dataclasses.dataclass
class LifeCycleData:
    greeting = beaker.GlobalStateValue(stack_type=pt.TealType.bytes)
    times = beaker.GlobalStateValue(stack_type=pt.TealType.uint64)


app = beaker.Application("LifeCycleApp", state=LifeCycleData()).apply(deploy_time_immutability_control)


@app.external
def hello(name: pt.abi.String, *, output: pt.abi.String) -> pt.Expr:
    return pt.Seq(
        (buff := pt.ScratchVar()).store(pt.Bytes("")),
        Iterate(
            buff.store(
                pt.Concat(buff.load(), app.state.greeting.get(), pt.Bytes(", "), name.get(), pt.Bytes("\n"))
            ),  # result += greeting, name\n
            cast(pt.Int, app.state.times.get()),
        ),
        output.set(buff.load()),
    )


@app.external(name="hello")
def hello_no_arg(*, output: pt.abi.String) -> pt.Expr:
    return pt.Seq(
        (buff := pt.ScratchVar()).store(pt.Bytes("")),
        Iterate(
            buff.store(
                pt.Concat(buff.load(), app.state.greeting.get(), pt.Bytes(", mystery person\n"))
            ),  # result += greeting, mystery person\n
            cast(pt.Int, app.state.times.get()),
        ),
        output.set(buff.load()),
    )


@app.external(bare=True, method_config=MethodConfig(no_op=CallConfig.CREATE, opt_in=CallConfig.CREATE))
def bare_create() -> pt.Expr:
    """Bare create method"""
    return pt.Seq(app.state.greeting.set(pt.Bytes("Hello")), app.state.times.set(pt.Int(1)), pt.Approve())


@app.create(name="create")
def create_1arg(greeting: pt.abi.String, *, output: pt.abi.String) -> pt.Expr:
    """ABI create method with 1 argument"""
    return pt.Seq(
        app.state.greeting.set(greeting.get()),
        app.state.times.set(pt.Int(1)),
        output.set(pt.Concat(greeting.get(), pt.Bytes("_"), Itoa(app.state.times.get()))),
    )


@app.create(name="create")
def create_2arg(greeting: pt.abi.String, times: pt.abi.Uint32) -> pt.Expr:
    """ABI create method with 2 arguments"""
    return pt.Seq(app.state.greeting.set(greeting.get()), app.state.times.set(times.get()), pt.Approve())


@app.clear_state()
def clear() -> pt.Expr:
    return pt.Approve()
