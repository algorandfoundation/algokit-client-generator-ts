# Application Client Usage

After using the cli tool to generate an application client you will end up with a typescript file containing several type definitions and an application client class that is named after the target smart contract. For example, if the contract name is HelloWorldApp then you will end up with a `HelloWorldAppClient` class. The contract name will also be used to prefix a number of other types in the generated file which allows you to generate clients for multiple smart contracts in the one project without ambiguous type names.

## Creating an application client instance

The first step to using the client is to _new_ up an instance. The client can locate a smart contract by its unique application id, or by the combination of its creator and name.

**Resolving by creator and name**

```ts
import * as algokit from '@algorandfoundation/algokit-utils'
const algod = algokit.getAlgoClient()
const indexer = algokit.getAlgoIndexerClient()
const client = new HelloWorldAppClient(
  {
    resolveBy: 'creatorAndName',
    creatorAddress: testAccount.addr,
    // Optionally specify a different name for the contract - otherwise contract.name from the application spec file is used
    name: 'AlternativeName',
    // An indexer client is required to perform the lookup
    findExistingUsing: indexer,
    // Optionally specify a default sender for all calls made from the client
    sender: testAccount,
  },
  // An algod client is required to make the underlying calls to the network
  algod,
)
```

**Resolving by id**

```ts
import * as algokit from '@algorandfoundation/algokit-utils'
const algod = algokit.getAlgoClient()
const indexer = algokit.getAlgoIndexerClient()
const client = new HelloWorldAppClient(
  {
    resolveBy: 'id',
    // The unique id of an already deployed smart contract, or 0 if the smart contract has not been deployed
    id: 12,
    // Optionally specify a default sender for all calls made from the client
    sender: testAccount,
    // Optionally specify a different name for the contract - otherwise contract.name from the application.json file is used
    name: 'AlternativeName',
  },
  // An algod client is required to make the underlying calls to the network
  algod,
)
```

## Deploying a smart_contract using the application client instance

The application client will include methods for creating, updating, and deleting the smart contract based on the presence relevant on completion actions and call config values in the application spec file. If a smart contract does not support being updated for instance, then no update methods will be generated in the client.

In addition, a client will also include a `deploy` method which will...

- create the application if it doesn't exist (based on the resolveBy option chosen above)
- update the application if it does exist, but differs from the version the client is built on
- delete and recreate the application if the deployed version is incompatible with being updated to the client version
- do nothing in the application is already deployed and up to date.

You can find more specifics of this behaviour in the [algokit-utils](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/docs/capabilities/app-deploy.md) docs.

### Create calls

Create calls will fail if the applicationId is not 0.

```ts
const client = new HelloWorldAppClient()

// Create the application using a bare call
client.create.bare()

// Pass in some compilation flags
client.create.bare({
  updatable: true,
  deletable: true,
})

// Create the application using a specific on completion action (ie. not a no_op)
client.create.bare({
  onCompleteAction: 'opt_in',
})

// Create the application using an ABI method (ie. not a bare call)
client.create.namedCreate({
  arg1: 123,
  arg2: 'foo',
})

// Pass compilation flags and on completion actions to an ABI create call
client.create.namedCreate(
  {
    arg1: 123,
    arg2: 'foo',
  },
  {
    updatable: true,
    deletable: true,
    onCompleteAction: 'opt_in',
  },
)
```

### Update and Delete calls

Update and delete calls will fail if the applicationId is 0

```ts
const client = new HelloWorldAppClient()

// Update the application using a bare call
client.update.bare()

// Pass in compilation flags
client.update.bare({
  updatable: true,
  deletable: false,
})

// Update the application using an ABI method
client.update.namedUpdate({
  arg1: 123,
  arg2: 'foo',
})

// Pass compilation flags
client.update.namedUpdate(
  {
    arg1: 123,
    arg2: 'foo',
  },
  {
    updatable: true,
    deletable: true,
  },
)

// Delete the application using a bare call
client.delete.bare()

// Delete the application using an ABI method
client.delete.namedDelete({})
```

### Deploy call

The deploy call will make a create, update, or delete and create, or no call depending on what is required to have the deployed application match the client's contract version. As such the deploy method allows you to configure arguments for each potential call. If the smart contract is not updatable or deletable, those methods will be omitted.

```ts
client.deploy({
  createCall: (cf) => cf.bare({ onCompleteAction: 'opt_in' }),
  updateCall: (cf) =>
    cf.namedUpdate({
      arg1: 123,
      arg2: 'foo',
    }),
  deleteCall: (cf) => cf.bare(),
  allowUpdate: true,
  allowDelete: true,
})
```

## Opt in and close out

Methods with an `opt_in` or `close_out` `onCompletionAction` are grouped under properties of the same name. If the smart contract does not handle on of these on completion actions, that method will be omitted.

```ts
// Opt in with bare call
client.optIn.bare()

// Opt in with ABI method
client.optIn.namedOptIn({ arg1: 123 })

// Close out with bare call
client.closeOut.bare()

// Close out with ABI method
client.closeOut.namedCloseOut({ arg1: 'foo' })
```

## Clear state

All clients will have a clear state method which will call the clear state program of the smart contract.

```ts
client.clearState()
```

## No ops

The remaining ABI methods which should all have an `onCompletionAction` of `no_op` will be available on the client via their camel cased name. Eg. an abi method named 'my_abi_method' will appear as `client.myAbiMethod`.

```ts
// Call an ABI method which takes no args
client.someMethod({})

// Call an ABI method, passing args in as a dictionary
client.someOtherMethod({ arg1: 123, arg2: 'foo' })
```

> **Method name clashes**
>
> The ARC-0032 specification allows two methods to have the same name, as long as they have different signatures. On the client these methods will be emitted with a unique name made up of the method's full signature. Eg. createStringUint32Void.
>
> Whilst typescript supports method overloading, in practice it would be impossible to reliably resolve the desired overload at run time once you factor in method with default parameters.

## ABI arguments

Algod expects ABI arguments to be formatted as a tuple however for your convenience, each generated method will also accept arguments in a dictionary format, so you can use whichever feels more comfortable. For ABI methods which take no arguments, either pass in an empty object or an empty tuple. The client will handle the conversion of strings to byte arrays.

```ts
// ABI method which takes no args
client.noArgsMethod({})
client.noArgsMethod([])

// ABI method with args
client.otherMethod({ arg1: 123, arg2: 'foo', arg3: new Uint8Array([1, 2, 3, 4]) })
// Call an ABI method, passing args in as a tuple
client.yetAnotherMethod([1, 2, 'foo'])
```

## Additional parameters

Each ABI method and bare call on the client allows the consumer to provide additional parameters. This will be the second parameter of any ABI call, or the first parameter of any bare call. Some of these align with properties available on the underlying [Application Call Transaction](https://developer.algorand.org/docs/get-details/transactions/#application-call-transaction) object and some will change the behaviour of the client.

```ts
client.someMethod(
  {
    arg1: 123,
  },
  {
    /* Additional parameters go here */
  },
)

client.optIn.bare({
  /* Additional parameters go here */
})
```

| **Property**                                | **Description**                                                                                                                                                                                                                                                                        |
|---------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `boxes`                                     | An array of [BoxReference](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/docs/code/interfaces/types_app.BoxReference.md) or [BoxIdentifier](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/docs/code/modules/types_app.md#boxidentifier) to load. |
| `note`                                      | The [TransactionNote](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/docs/code/modules/types_transaction.md#transactionnote) for the smart contract call                                                                                                             |
| `sender`                                    | The [sender](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/docs/code/modules/types_transaction.md#sendtransactionfrom) of the transaction, defaults to the one passed in when constructing the client.                                                              |
| `lease`                                     | The optional lease for the transaction                                                                                                                                                                                                                                                 |
| `accounts`                                  | The address of any accounts to load in                                                                                                                                                                                                                                                 |
| `apps`                                      | IDs of any apps to load into the foreignApps array                                                                                                                                                                                                                                     |
| `assets`                                    | IDs of any assets to load into the foreignAssets array                                                                                                                                                                                                                                 |
| `sendParams.fee`                            | The flat fee you want to pay, useful for covering extra fees in a transaction group or app call                                                                                                                                                                                        |
| `sendParams.maxFee`                         | The maximum fee that you are happy to pay (default: unbounded) - if this is set it's possible the transaction could get rejected during network congestion                                                                                                                             |
| `sendParams.skipSending`                    | Whether to skip signing and sending the transaction to the chain (default: transaction signed and sent to chain, unless atc specified) and instead just return the raw transaction, e.g. so you can add it to a group of transactions                                                  |
| `sendParams.skipWaiting`                    | Whether to skip waiting for the submitted transaction (only relevant if `skipSending` is `false` or unset)                                                                                                                                                                             |
| `sendParams.maxRoundsToWaitForConfirmation` | The maximum number of rounds to wait for confirmation, only applies if skipWaiting is undefined or false, default: wait up to 5 rounds                                                                                                                                                 |
| `sendParams.supressLog`                     | Whether to suppress log messages from transaction send, default: do not suppress                                                                                                                                                                                                       |
| `sendParams.atc`                            | An optional AtomicTransactionComposer to add the transaction to, if specified then skipSending: undefined has the same effect as skipSending: true                                                                                                                                     |

## Composing transactions

Algorand allows multiple transactions to be composed into a single atomic transaction group to be committed (or rejected) as one. There are limits to the number of transactions in a group, and a requirement for all transactions to be unique in the group. These restrictions are imposed by the algod node and may change over time.

### Manually with the AtomicTransactionComposer

Multiple transactions can be composed using the `AtomicTransactionComposer` (ATC) class from `algosdk`. Passing in an ATC instance to each call you would like to compose instructs the client to skip sending the call and instead transactions are queued on up the composer instance.

```ts
import { AtomicTransactionComposer } from "algosdk";
import * as algokit from '@algorandfoundation/algokit-utils'

const algod = algokit.getAlgoClient()
const atc = new AtomicTransactionComposer()

await client.methodOne({ arg1: 123 }, { sendParams: { atc }, boxes: ['V']})

await client.appClient.fundAppAccount({ amount: microAlgos(5000), sendParams: { atc } })

await client.methodTwo({ arg1: 'foo' }, { sendParams: { atc }})

const result = await atc.execute(algod, 5)

// Method results will contain a result object for each ABI method call in the transaction group
for(const { returnValue  } of result.methodResults) {
  console.log(returnValue)
}
```

### Using the fluent composer

As an alternative to manual use of an ATC, the client exposes a fluent transaction composer which allows you to build up a group before sending it. The main advantage to this approach is that the return values will be strongly typed based on the methods you add to the composer. The fluent composer will be less useful in scenarios where you want to compose calls to multiple applications.

```ts
// Generate a raw transaction
import { microAlgos } from "@algorandfoundation/algokit-utils";

const fundingTransaction = await client.appClient.fundAppAccount({ amount: microAlgos(5000), sendParams: { skipSending: true } })

const result = await client.compose()
  .methodOne({ arg1: 123 }, { boxes: ['V'] })
  // Non-ABI transactions can still be added to the group
  .addTransaction(fundingTransaction)
  .methodTwo({ arg1: 'foo' })
  .execute()

// Strongly typed as the return type of methodOne
const resultOfMethodOne = result.returns[0]
// Strongly typed as the return type of methodTwo
const resultOfMethodTwo = result.returns[1]
```
