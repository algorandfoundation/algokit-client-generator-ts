/* eslint-disable */
// @ts-nocheck
/**
 * This file was automatically generated by @algorandfoundation/algokit-client-generator.
 * DO NOT MODIFY IT BY HAND.
 * requires: @algorandfoundation/algokit-utils: ^2
 */
import * as algokit from '@algorandfoundation/algokit-utils'
import type {
  ABIAppCallArg,
  AppCallTransactionResult,
  AppCallTransactionResultOfType,
  AppCompilationResult,
  AppReference,
  AppState,
  AppStorageSchema,
  CoreAppCallArgs,
  RawAppCallArgs,
  TealTemplateParams,
} from '@algorandfoundation/algokit-utils/types/app'
import type {
  AppClientCallCoreParams,
  AppClientCompilationParams,
  AppClientDeployCoreParams,
  AppDetails,
  ApplicationClient,
} from '@algorandfoundation/algokit-utils/types/app-client'
import type { AppSpec } from '@algorandfoundation/algokit-utils/types/app-spec'
import type { SendTransactionResult, TransactionToSign, SendTransactionFrom, SendTransactionParams } from '@algorandfoundation/algokit-utils/types/transaction'
import type { ABIResult, TransactionWithSigner } from 'algosdk'
import { Algodv2, OnApplicationComplete, Transaction, AtomicTransactionComposer, modelsv2 } from 'algosdk'
export const APP_SPEC: AppSpec = {
  "hints": {
    "method_a_that_uses_struct()(uint64,uint64)": {
      "call_config": {
        "no_op": "CALL"
      },
      "structs": {
        "output": {
          "name": "SomeStruct",
          "elements": [
            [
              "a",
              "uint64"
            ],
            [
              "b",
              "uint64"
            ]
          ]
        }
      }
    },
    "method_b_that_uses_same_struct()(uint64,uint64)": {
      "call_config": {
        "no_op": "CALL"
      },
      "structs": {
        "output": {
          "name": "SomeStruct",
          "elements": [
            [
              "a",
              "uint64"
            ],
            [
              "b",
              "uint64"
            ]
          ]
        }
      }
    }
  },
  "source": {
    "approval": "I3ByYWdtYSB2ZXJzaW9uIDEwCgpzbWFydF9jb250cmFjdHMuZGVsZWdhdG9yX2NvbnRyYWN0LmNvbnRyYWN0LkR1cGxpY2F0ZVN0cnVjdHNDb250cmFjdC5hcHByb3ZhbF9wcm9ncmFtOgogICAgLy8gY29udHJhY3QucHk6MTIKICAgIC8vIGNsYXNzIER1cGxpY2F0ZVN0cnVjdHNDb250cmFjdChBUkM0Q29udHJhY3QpOgogICAgdHhuIE51bUFwcEFyZ3MKICAgIGJ6IG1haW5fYmFyZV9yb3V0aW5nQDYKICAgIG1ldGhvZCAibWV0aG9kX2FfdGhhdF91c2VzX3N0cnVjdCgpKHVpbnQ2NCx1aW50NjQpIgogICAgbWV0aG9kICJtZXRob2RfYl90aGF0X3VzZXNfc2FtZV9zdHJ1Y3QoKSh1aW50NjQsdWludDY0KSIKICAgIHR4bmEgQXBwbGljYXRpb25BcmdzIDAKICAgIG1hdGNoIG1haW5fbWV0aG9kX2FfdGhhdF91c2VzX3N0cnVjdF9yb3V0ZUAyIG1haW5fbWV0aG9kX2JfdGhhdF91c2VzX3NhbWVfc3RydWN0X3JvdXRlQDMKICAgIGVyciAvLyByZWplY3QgdHJhbnNhY3Rpb24KCm1haW5fbWV0aG9kX2FfdGhhdF91c2VzX3N0cnVjdF9yb3V0ZUAyOgogICAgLy8gY29udHJhY3QucHk6MTkKICAgIC8vIEBhcmM0LmFiaW1ldGhvZCgpCiAgICB0eG4gT25Db21wbGV0aW9uCiAgICAhCiAgICBhc3NlcnQgLy8gT25Db21wbGV0aW9uIGlzIE5vT3AKICAgIHR4biBBcHBsaWNhdGlvbklECiAgICBhc3NlcnQgLy8gaXMgbm90IGNyZWF0aW5nCiAgICBjYWxsc3ViIG1ldGhvZF9hX3RoYXRfdXNlc19zdHJ1Y3QKICAgIGJ5dGUgMHgxNTFmN2M3NQogICAgc3dhcAogICAgY29uY2F0CiAgICBsb2cKICAgIGludCAxCiAgICByZXR1cm4KCm1haW5fbWV0aG9kX2JfdGhhdF91c2VzX3NhbWVfc3RydWN0X3JvdXRlQDM6CiAgICAvLyBjb250cmFjdC5weToyNgogICAgLy8gQGFyYzQuYWJpbWV0aG9kKCkKICAgIHR4biBPbkNvbXBsZXRpb24KICAgICEKICAgIGFzc2VydCAvLyBPbkNvbXBsZXRpb24gaXMgTm9PcAogICAgdHhuIEFwcGxpY2F0aW9uSUQKICAgIGFzc2VydCAvLyBpcyBub3QgY3JlYXRpbmcKICAgIGNhbGxzdWIgbWV0aG9kX2JfdGhhdF91c2VzX3NhbWVfc3RydWN0CiAgICBieXRlIDB4MTUxZjdjNzUKICAgIHN3YXAKICAgIGNvbmNhdAogICAgbG9nCiAgICBpbnQgMQogICAgcmV0dXJuCgptYWluX2JhcmVfcm91dGluZ0A2OgogICAgLy8gY29udHJhY3QucHk6MTIKICAgIC8vIGNsYXNzIER1cGxpY2F0ZVN0cnVjdHNDb250cmFjdChBUkM0Q29udHJhY3QpOgogICAgdHhuIE9uQ29tcGxldGlvbgogICAgIQogICAgYXNzZXJ0IC8vIHJlamVjdCB0cmFuc2FjdGlvbgogICAgdHhuIEFwcGxpY2F0aW9uSUQKICAgICEKICAgIGFzc2VydCAvLyBpcyBjcmVhdGluZwogICAgaW50IDEKICAgIHJldHVybgoKCi8vIHNtYXJ0X2NvbnRyYWN0cy5kZWxlZ2F0b3JfY29udHJhY3QuY29udHJhY3QuRHVwbGljYXRlU3RydWN0c0NvbnRyYWN0Lm1ldGhvZF9hX3RoYXRfdXNlc19zdHJ1Y3QoKSAtPiBieXRlczoKbWV0aG9kX2FfdGhhdF91c2VzX3N0cnVjdDoKICAgIC8vIGNvbnRyYWN0LnB5OjE5LTIwCiAgICAvLyBAYXJjNC5hYmltZXRob2QoKQogICAgLy8gZGVmIG1ldGhvZF9hX3RoYXRfdXNlc19zdHJ1Y3Qoc2VsZikgLT4gU29tZVN0cnVjdDoKICAgIHByb3RvIDAgMQogICAgLy8gY29udHJhY3QucHk6MjEtMjQKICAgIC8vIHJldHVybiBTb21lU3RydWN0KAogICAgLy8gICAgIGFyYzQuVUludDY0KDEpLAogICAgLy8gICAgIGFyYzQuVUludDY0KDIpLAogICAgLy8gKQogICAgYnl0ZSAweDAwMDAwMDAwMDAwMDAwMDEwMDAwMDAwMDAwMDAwMDAyCiAgICByZXRzdWIKCgovLyBzbWFydF9jb250cmFjdHMuZGVsZWdhdG9yX2NvbnRyYWN0LmNvbnRyYWN0LkR1cGxpY2F0ZVN0cnVjdHNDb250cmFjdC5tZXRob2RfYl90aGF0X3VzZXNfc2FtZV9zdHJ1Y3QoKSAtPiBieXRlczoKbWV0aG9kX2JfdGhhdF91c2VzX3NhbWVfc3RydWN0OgogICAgLy8gY29udHJhY3QucHk6MjYtMjcKICAgIC8vIEBhcmM0LmFiaW1ldGhvZCgpCiAgICAvLyBkZWYgbWV0aG9kX2JfdGhhdF91c2VzX3NhbWVfc3RydWN0KHNlbGYpIC0+IFNvbWVTdHJ1Y3Q6CiAgICBwcm90byAwIDEKICAgIC8vIGNvbnRyYWN0LnB5OjI4LTMxCiAgICAvLyByZXR1cm4gU29tZVN0cnVjdCgKICAgIC8vICAgICBhcmM0LlVJbnQ2NCgzKSwKICAgIC8vICAgICBhcmM0LlVJbnQ2NCg0KSwKICAgIC8vICkKICAgIGJ5dGUgMHgwMDAwMDAwMDAwMDAwMDAzMDAwMDAwMDAwMDAwMDAwNAogICAgcmV0c3ViCg==",
    "clear": "I3ByYWdtYSB2ZXJzaW9uIDEwCgpzbWFydF9jb250cmFjdHMuZGVsZWdhdG9yX2NvbnRyYWN0LmNvbnRyYWN0LkR1cGxpY2F0ZVN0cnVjdHNDb250cmFjdC5jbGVhcl9zdGF0ZV9wcm9ncmFtOgogICAgLy8gY29udHJhY3QucHk6MTIKICAgIC8vIGNsYXNzIER1cGxpY2F0ZVN0cnVjdHNDb250cmFjdChBUkM0Q29udHJhY3QpOgogICAgaW50IDEKICAgIHJldHVybgo="
  },
  "state": {
    "global": {
      "num_byte_slices": 0,
      "num_uints": 0
    },
    "local": {
      "num_byte_slices": 0,
      "num_uints": 0
    }
  },
  "schema": {
    "global": {
      "declared": {},
      "reserved": {}
    },
    "local": {
      "declared": {},
      "reserved": {}
    }
  },
  "contract": {
    "name": "DuplicateStructsContract",
    "desc": "\n        This contract is to be used as a test artifact to verify behavior around struct generation to ensure that \n        the scenarios similar to whats outlined in this contract can not result in a typed client with duplicate struct \n        definitions.\n    ",
    "methods": [
      {
        "name": "method_a_that_uses_struct",
        "args": [],
        "returns": {
          "type": "(uint64,uint64)"
        }
      },
      {
        "name": "method_b_that_uses_same_struct",
        "args": [],
        "returns": {
          "type": "(uint64,uint64)"
        }
      }
    ],
    "networks": {}
  },
  "bare_call_config": {
    "no_op": "CREATE"
  }
}

/**
 * Defines an onCompletionAction of 'no_op'
 */
export type OnCompleteNoOp =  { onCompleteAction?: 'no_op' | OnApplicationComplete.NoOpOC }
/**
 * Defines an onCompletionAction of 'opt_in'
 */
export type OnCompleteOptIn =  { onCompleteAction: 'opt_in' | OnApplicationComplete.OptInOC }
/**
 * Defines an onCompletionAction of 'close_out'
 */
export type OnCompleteCloseOut =  { onCompleteAction: 'close_out' | OnApplicationComplete.CloseOutOC }
/**
 * Defines an onCompletionAction of 'delete_application'
 */
export type OnCompleteDelApp =  { onCompleteAction: 'delete_application' | OnApplicationComplete.DeleteApplicationOC }
/**
 * Defines an onCompletionAction of 'update_application'
 */
export type OnCompleteUpdApp =  { onCompleteAction: 'update_application' | OnApplicationComplete.UpdateApplicationOC }
/**
 * A state record containing a single unsigned integer
 */
export type IntegerState = {
  /**
   * Gets the state value as a BigInt.
   */
  asBigInt(): bigint
  /**
   * Gets the state value as a number.
   */
  asNumber(): number
}
/**
 * A state record containing binary data
 */
export type BinaryState = {
  /**
   * Gets the state value as a Uint8Array
   */
  asByteArray(): Uint8Array
  /**
   * Gets the state value as a string
   */
  asString(): string
}

export type AppCreateCallTransactionResult = AppCallTransactionResult & Partial<AppCompilationResult> & AppReference
export type AppUpdateCallTransactionResult = AppCallTransactionResult & Partial<AppCompilationResult>

export type AppClientComposeCallCoreParams = Omit<AppClientCallCoreParams, 'sendParams'> & {
  sendParams?: Omit<SendTransactionParams, 'skipSending' | 'atc' | 'skipWaiting' | 'maxRoundsToWaitForConfirmation' | 'populateAppCallResources'>
}
export type AppClientComposeExecuteParams = Pick<SendTransactionParams, 'skipWaiting' | 'maxRoundsToWaitForConfirmation' | 'populateAppCallResources' | 'suppressLog'>

export type IncludeSchema = {
  /**
   * Any overrides for the storage schema to request for the created app; by default the schema indicated by the app spec is used.
   */
  schema?: Partial<AppStorageSchema>
}

/**
 * Defines the types of available calls and state of the DuplicateStructsContract smart contract.
 */
export type DuplicateStructsContract = {
  /**
   * Maps method signatures / names to their argument and return types.
   */
  methods:
    & Record<'method_a_that_uses_struct()(uint64,uint64)' | 'method_a_that_uses_struct', {
      argsObj: {
      }
      argsTuple: []
      returns: SomeStruct
    }>
    & Record<'method_b_that_uses_same_struct()(uint64,uint64)' | 'method_b_that_uses_same_struct', {
      argsObj: {
      }
      argsTuple: []
      returns: SomeStruct
    }>
}
/**
 * Defines the possible abi call signatures
 */
export type DuplicateStructsContractSig = keyof DuplicateStructsContract['methods']
/**
 * Defines an object containing all relevant parameters for a single call to the contract. Where TSignature is undefined, a bare call is made
 */
export type TypedCallParams<TSignature extends DuplicateStructsContractSig | undefined> = {
  method: TSignature
  methodArgs: TSignature extends undefined ? undefined : Array<ABIAppCallArg | undefined>
} & AppClientCallCoreParams & CoreAppCallArgs
/**
 * Defines the arguments required for a bare call
 */
export type BareCallArgs = Omit<RawAppCallArgs, keyof CoreAppCallArgs>
/**
 * Represents a SomeStruct result as a struct
 */
export type SomeStruct = {
  a: bigint
  b: bigint
}
/**
 * Converts the tuple representation of a SomeStruct to the struct representation
 */
export function SomeStruct([a, b]: [bigint, bigint] ) {
  return {
    a,
    b,
  }
}
/**
 * Maps a method signature from the DuplicateStructsContract smart contract to the method's arguments in either tuple of struct form
 */
export type MethodArgs<TSignature extends DuplicateStructsContractSig> = DuplicateStructsContract['methods'][TSignature]['argsObj' | 'argsTuple']
/**
 * Maps a method signature from the DuplicateStructsContract smart contract to the method's return type
 */
export type MethodReturn<TSignature extends DuplicateStructsContractSig> = DuplicateStructsContract['methods'][TSignature]['returns']

/**
 * A factory for available 'create' calls
 */
export type DuplicateStructsContractCreateCalls = (typeof DuplicateStructsContractCallFactory)['create']
/**
 * Defines supported create methods for this smart contract
 */
export type DuplicateStructsContractCreateCallParams =
  | (TypedCallParams<undefined> & (OnCompleteNoOp))
/**
 * Defines arguments required for the deploy method.
 */
export type DuplicateStructsContractDeployArgs = {
  deployTimeParams?: TealTemplateParams
  /**
   * A delegate which takes a create call factory and returns the create call params for this smart contract
   */
  createCall?: (callFactory: DuplicateStructsContractCreateCalls) => DuplicateStructsContractCreateCallParams
}


/**
 * Exposes methods for constructing all available smart contract calls
 */
export abstract class DuplicateStructsContractCallFactory {
  /**
   * Gets available create call factories
   */
  static get create() {
    return {
      /**
       * Constructs a create call for the DuplicateStructsContract smart contract using a bare call
       *
       * @param params Any parameters for the call
       * @returns A TypedCallParams object for the call
       */
      bare(params: BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs & AppClientCompilationParams & (OnCompleteNoOp) = {}) {
        return {
          method: undefined,
          methodArgs: undefined,
          ...params,
        }
      },
    }
  }

  /**
   * Constructs a no op call for the method_a_that_uses_struct()(uint64,uint64) ABI method
   *
   * @param args Any args for the contract call
   * @param params Any additional parameters for the call
   * @returns A TypedCallParams object for the call
   */
  static methodAThatUsesStruct(args: MethodArgs<'method_a_that_uses_struct()(uint64,uint64)'>, params: AppClientCallCoreParams & CoreAppCallArgs) {
    return {
      method: 'method_a_that_uses_struct()(uint64,uint64)' as const,
      methodArgs: Array.isArray(args) ? args : [],
      ...params,
    }
  }
  /**
   * Constructs a no op call for the method_b_that_uses_same_struct()(uint64,uint64) ABI method
   *
   * @param args Any args for the contract call
   * @param params Any additional parameters for the call
   * @returns A TypedCallParams object for the call
   */
  static methodBThatUsesSameStruct(args: MethodArgs<'method_b_that_uses_same_struct()(uint64,uint64)'>, params: AppClientCallCoreParams & CoreAppCallArgs) {
    return {
      method: 'method_b_that_uses_same_struct()(uint64,uint64)' as const,
      methodArgs: Array.isArray(args) ? args : [],
      ...params,
    }
  }
}

/**
 * A client to make calls to the DuplicateStructsContract smart contract
 */
export class DuplicateStructsContractClient {
  /**
   * The underlying `ApplicationClient` for when you want to have more flexibility
   */
  public readonly appClient: ApplicationClient

  private readonly sender: SendTransactionFrom | undefined

  /**
   * Creates a new instance of `DuplicateStructsContractClient`
   *
   * @param appDetails appDetails The details to identify the app to deploy
   * @param algod An algod client instance
   */
  constructor(appDetails: AppDetails, private algod: Algodv2) {
    this.sender = appDetails.sender
    this.appClient = algokit.getAppClient({
      ...appDetails,
      app: APP_SPEC
    }, algod)
  }

  /**
   * Checks for decode errors on the AppCallTransactionResult and maps the return value to the specified generic type
   *
   * @param result The AppCallTransactionResult to be mapped
   * @param returnValueFormatter An optional delegate to format the return value if required
   * @returns The smart contract response with an updated return value
   */
  protected mapReturnValue<TReturn, TResult extends AppCallTransactionResult = AppCallTransactionResult>(result: AppCallTransactionResult, returnValueFormatter?: (value: any) => TReturn): AppCallTransactionResultOfType<TReturn> & TResult {
    if(result.return?.decodeError) {
      throw result.return.decodeError
    }
    const returnValue = result.return?.returnValue !== undefined && returnValueFormatter !== undefined
      ? returnValueFormatter(result.return.returnValue)
      : result.return?.returnValue as TReturn | undefined
      return { ...result, return: returnValue } as AppCallTransactionResultOfType<TReturn> & TResult
  }

  /**
   * Calls the ABI method with the matching signature using an onCompletion code of NO_OP
   *
   * @param typedCallParams An object containing the method signature, args, and any other relevant parameters
   * @param returnValueFormatter An optional delegate which when provided will be used to map non-undefined return values to the target type
   * @returns The result of the smart contract call
   */
  public async call<TSignature extends keyof DuplicateStructsContract['methods']>(typedCallParams: TypedCallParams<TSignature>, returnValueFormatter?: (value: any) => MethodReturn<TSignature>) {
    return this.mapReturnValue<MethodReturn<TSignature>>(await this.appClient.call(typedCallParams), returnValueFormatter)
  }

  /**
   * Idempotently deploys the DuplicateStructsContract smart contract.
   *
   * @param params The arguments for the contract calls and any additional parameters for the call
   * @returns The deployment result
   */
  public deploy(params: DuplicateStructsContractDeployArgs & AppClientDeployCoreParams & IncludeSchema = {}): ReturnType<ApplicationClient['deploy']> {
    const createArgs = params.createCall?.(DuplicateStructsContractCallFactory.create)
    return this.appClient.deploy({
      ...params,
      createArgs,
      createOnCompleteAction: createArgs?.onCompleteAction,
    })
  }

  /**
   * Gets available create methods
   */
  public get create() {
    const $this = this
    return {
      /**
       * Creates a new instance of the DuplicateStructsContract smart contract using a bare call.
       *
       * @param args The arguments for the bare call
       * @returns The create result
       */
      async bare(args: BareCallArgs & AppClientCallCoreParams & AppClientCompilationParams & IncludeSchema & CoreAppCallArgs & (OnCompleteNoOp) = {}) {
        return $this.mapReturnValue<undefined, AppCreateCallTransactionResult>(await $this.appClient.create(args))
      },
    }
  }

  /**
   * Makes a clear_state call to an existing instance of the DuplicateStructsContract smart contract.
   *
   * @param args The arguments for the bare call
   * @returns The clear_state result
   */
  public clearState(args: BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.appClient.clearState(args)
  }

  /**
   * Calls the method_a_that_uses_struct()(uint64,uint64) ABI method.
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The result of the call
   */
  public methodAThatUsesStruct(args: MethodArgs<'method_a_that_uses_struct()(uint64,uint64)'>, params: AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.call(DuplicateStructsContractCallFactory.methodAThatUsesStruct(args, params), SomeStruct)
  }

  /**
   * Calls the method_b_that_uses_same_struct()(uint64,uint64) ABI method.
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The result of the call
   */
  public methodBThatUsesSameStruct(args: MethodArgs<'method_b_that_uses_same_struct()(uint64,uint64)'>, params: AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.call(DuplicateStructsContractCallFactory.methodBThatUsesSameStruct(args, params), SomeStruct)
  }

  public compose(): DuplicateStructsContractComposer {
    const client = this
    const atc = new AtomicTransactionComposer()
    let promiseChain:Promise<unknown> = Promise.resolve()
    const resultMappers: Array<undefined | ((x: any) => any)> = []
    return {
      methodAThatUsesStruct(args: MethodArgs<'method_a_that_uses_struct()(uint64,uint64)'>, params?: AppClientComposeCallCoreParams & CoreAppCallArgs) {
        promiseChain = promiseChain.then(() => client.methodAThatUsesStruct(args, {...params, sendParams: {...params?.sendParams, skipSending: true, atc}}))
        resultMappers.push(SomeStruct)
        return this
      },
      methodBThatUsesSameStruct(args: MethodArgs<'method_b_that_uses_same_struct()(uint64,uint64)'>, params?: AppClientComposeCallCoreParams & CoreAppCallArgs) {
        promiseChain = promiseChain.then(() => client.methodBThatUsesSameStruct(args, {...params, sendParams: {...params?.sendParams, skipSending: true, atc}}))
        resultMappers.push(SomeStruct)
        return this
      },
      clearState(args?: BareCallArgs & AppClientComposeCallCoreParams & CoreAppCallArgs) {
        promiseChain = promiseChain.then(() => client.clearState({...args, sendParams: {...args?.sendParams, skipSending: true, atc}}))
        resultMappers.push(undefined)
        return this
      },
      addTransaction(txn: TransactionWithSigner | TransactionToSign | Transaction | Promise<SendTransactionResult>, defaultSender?: SendTransactionFrom) {
        promiseChain = promiseChain.then(async () => atc.addTransaction(await algokit.getTransactionWithSigner(txn, defaultSender ?? client.sender)))
        return this
      },
      async atc() {
        await promiseChain
        return atc
      },
      async simulate(options?: SimulateOptions) {
        await promiseChain
        const result = await atc.simulate(client.algod, new modelsv2.SimulateRequest({ txnGroups: [], ...options }))
        return {
          ...result,
          returns: result.methodResults?.map((val, i) => resultMappers[i] !== undefined ? resultMappers[i]!(val.returnValue) : val.returnValue)
        }
      },
      async execute(sendParams?: AppClientComposeExecuteParams) {
        await promiseChain
        const result = await algokit.sendAtomicTransactionComposer({ atc, sendParams }, client.algod)
        return {
          ...result,
          returns: result.returns?.map((val, i) => resultMappers[i] !== undefined ? resultMappers[i]!(val.returnValue) : val.returnValue)
        }
      }
    } as unknown as DuplicateStructsContractComposer
  }
}
export type DuplicateStructsContractComposer<TReturns extends [...any[]] = []> = {
  /**
   * Calls the method_a_that_uses_struct()(uint64,uint64) ABI method.
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
   */
  methodAThatUsesStruct(args: MethodArgs<'method_a_that_uses_struct()(uint64,uint64)'>, params?: AppClientComposeCallCoreParams & CoreAppCallArgs): DuplicateStructsContractComposer<[...TReturns, MethodReturn<'method_a_that_uses_struct()(uint64,uint64)'>]>

  /**
   * Calls the method_b_that_uses_same_struct()(uint64,uint64) ABI method.
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
   */
  methodBThatUsesSameStruct(args: MethodArgs<'method_b_that_uses_same_struct()(uint64,uint64)'>, params?: AppClientComposeCallCoreParams & CoreAppCallArgs): DuplicateStructsContractComposer<[...TReturns, MethodReturn<'method_b_that_uses_same_struct()(uint64,uint64)'>]>

  /**
   * Makes a clear_state call to an existing instance of the DuplicateStructsContract smart contract.
   *
   * @param args The arguments for the bare call
   * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
   */
  clearState(args?: BareCallArgs & AppClientComposeCallCoreParams & CoreAppCallArgs): DuplicateStructsContractComposer<[...TReturns, undefined]>

  /**
   * Adds a transaction to the composer
   *
   * @param txn One of: A TransactionWithSigner object (returned as is), a TransactionToSign object (signer is obtained from the signer property), a Transaction object (signer is extracted from the defaultSender parameter), an async SendTransactionResult returned by one of algokit utils helpers (signer is obtained from the defaultSender parameter)
   * @param defaultSender The default sender to be used to obtain a signer where the object provided to the transaction parameter does not include a signer.
   */
  addTransaction(txn: TransactionWithSigner | TransactionToSign | Transaction | Promise<SendTransactionResult>, defaultSender?: SendTransactionFrom): DuplicateStructsContractComposer<TReturns>
  /**
   * Returns the underlying AtomicTransactionComposer instance
   */
  atc(): Promise<AtomicTransactionComposer>
  /**
   * Simulates the transaction group and returns the result
   */
  simulate(options?: SimulateOptions): Promise<DuplicateStructsContractComposerSimulateResult<TReturns>>
  /**
   * Executes the transaction group and returns the results
   */
  execute(sendParams?: AppClientComposeExecuteParams): Promise<DuplicateStructsContractComposerResults<TReturns>>
}
export type SimulateOptions = Omit<ConstructorParameters<typeof modelsv2.SimulateRequest>[0], 'txnGroups'>
export type DuplicateStructsContractComposerSimulateResult<TReturns extends [...any[]]> = {
  returns: TReturns
  methodResults: ABIResult[]
  simulateResponse: modelsv2.SimulateResponse
}
export type DuplicateStructsContractComposerResults<TReturns extends [...any[]]> = {
  returns: TReturns
  groupId: string
  txIds: string[]
  transactions: Transaction[]
}
