// NOTE: The PR that adds ARC56 to TEALScript has not yet been released. This contract is here simply to demonstrate how it was defined.

import { Contract } from '@algorandfoundation/tealscript'

type Inputs = {
  add: { a: uint64; b: uint64 }
  subtract: { a: uint64; b: uint64 }
}
type Outputs = { sum: uint64; difference: uint64 }

export class ARC56Test extends Contract {
  globalKey = GlobalStateKey<uint64>()

  globalMap = GlobalStateMap<string, { foo: uint16; bar: uint16 }>({
    maxKeys: 37,
    prefix: 'p',
  })

  localKey = LocalStateKey<uint64>()

  localMap = LocalStateMap<bytes, string>({ maxKeys: 13, prefix: 'p' })

  boxKey = BoxKey<string>()

  boxMap = BoxMap<Inputs, Outputs>({ prefix: 'p' })

  someNumber = TemplateVar<uint64>()

  foo(inputs: Inputs): Outputs {
    if (inputs.subtract.a < inputs.subtract.b) throw Error('subtract.a must be greater than subtract.b')

    this.globalKey.value = this.someNumber
    this.globalMap('foo').value = { foo: 13, bar: 37 }

    return {
      sum: inputs.add.a + inputs.add.b,
      difference: inputs.subtract.a - inputs.subtract.b,
    }
  }

  optInToApplication(): void {
    this.localKey(this.txn.sender).value = this.someNumber
    this.localMap(this.txn.sender, 'foo').value = 'bar'
    this.boxKey.value = 'baz'
    this.boxMap({ add: { a: 1, b: 2 }, subtract: { a: 4, b: 3 } }).value = {
      sum: 3,
      difference: 1,
    }
  }
}
