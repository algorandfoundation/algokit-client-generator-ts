/* eslint-disable */
/**
 * This file was automatically generated by @algorandfoundation/algokit-client-generator.
 * DO NOT MODIFY IT BY HAND.
 */
import * as algokit from '@algorandfoundation/algokit-utils'
import {
  AppCallTransactionResult,
  AppCallTransactionResultOfType,
  CoreAppCallArgs,
  RawAppCallArgs,
  AppState,
  TealTemplateParams,
  ABIAppCallArg,
} from '@algorandfoundation/algokit-utils/types/app'
import {
  AppClientCallCoreParams,
  AppClientCompilationParams,
  AppClientDeployCoreParams,
  AppDetails,
  ApplicationClient,
} from '@algorandfoundation/algokit-utils/types/app-client'
import { AppSpec } from '@algorandfoundation/algokit-utils/types/app-spec'
import { SendTransactionResult, TransactionToSign, SendTransactionFrom } from '@algorandfoundation/algokit-utils/types/transaction'
import { Algodv2, OnApplicationComplete, Transaction } from 'algosdk'
export const APP_SPEC: AppSpec = {
  "hints": {
    "hello(string)string": {
      "call_config": {
        "no_op": "CALL"
      }
    },
    "hello_world_check(string)void": {
      "call_config": {
        "no_op": "CALL"
      }
    }
  },
  "source": {
    "approval": "I3ByYWdtYSB2ZXJzaW9uIDgKaW50Y2Jsb2NrIDAgMQp0eG4gTnVtQXBwQXJncwppbnRjXzAgLy8gMAo9PQpibnogbWFpbl9sNgp0eG5hIEFwcGxpY2F0aW9uQXJncyAwCnB1c2hieXRlcyAweDAyYmVjZTExIC8vICJoZWxsbyhzdHJpbmcpc3RyaW5nIgo9PQpibnogbWFpbl9sNQp0eG5hIEFwcGxpY2F0aW9uQXJncyAwCnB1c2hieXRlcyAweGJmOWMxZWRmIC8vICJoZWxsb193b3JsZF9jaGVjayhzdHJpbmcpdm9pZCIKPT0KYm56IG1haW5fbDQKZXJyCm1haW5fbDQ6CnR4biBPbkNvbXBsZXRpb24KaW50Y18wIC8vIE5vT3AKPT0KdHhuIEFwcGxpY2F0aW9uSUQKaW50Y18wIC8vIDAKIT0KJiYKYXNzZXJ0CnR4bmEgQXBwbGljYXRpb25BcmdzIDEKY2FsbHN1YiBoZWxsb3dvcmxkY2hlY2tfMwppbnRjXzEgLy8gMQpyZXR1cm4KbWFpbl9sNToKdHhuIE9uQ29tcGxldGlvbgppbnRjXzAgLy8gTm9PcAo9PQp0eG4gQXBwbGljYXRpb25JRAppbnRjXzAgLy8gMAohPQomJgphc3NlcnQKdHhuYSBBcHBsaWNhdGlvbkFyZ3MgMQpjYWxsc3ViIGhlbGxvXzIKc3RvcmUgMApwdXNoYnl0ZXMgMHgxNTFmN2M3NSAvLyAweDE1MWY3Yzc1CmxvYWQgMApjb25jYXQKbG9nCmludGNfMSAvLyAxCnJldHVybgptYWluX2w2Ogp0eG4gT25Db21wbGV0aW9uCmludGNfMCAvLyBOb09wCj09CmJueiBtYWluX2wxMgp0eG4gT25Db21wbGV0aW9uCnB1c2hpbnQgNCAvLyBVcGRhdGVBcHBsaWNhdGlvbgo9PQpibnogbWFpbl9sMTEKdHhuIE9uQ29tcGxldGlvbgpwdXNoaW50IDUgLy8gRGVsZXRlQXBwbGljYXRpb24KPT0KYm56IG1haW5fbDEwCmVycgptYWluX2wxMDoKdHhuIEFwcGxpY2F0aW9uSUQKaW50Y18wIC8vIDAKIT0KYXNzZXJ0CmNhbGxzdWIgZGVsZXRlXzEKaW50Y18xIC8vIDEKcmV0dXJuCm1haW5fbDExOgp0eG4gQXBwbGljYXRpb25JRAppbnRjXzAgLy8gMAohPQphc3NlcnQKY2FsbHN1YiB1cGRhdGVfMAppbnRjXzEgLy8gMQpyZXR1cm4KbWFpbl9sMTI6CnR4biBBcHBsaWNhdGlvbklECmludGNfMCAvLyAwCj09CmFzc2VydAppbnRjXzEgLy8gMQpyZXR1cm4KCi8vIHVwZGF0ZQp1cGRhdGVfMDoKcHJvdG8gMCAwCnR4biBTZW5kZXIKZ2xvYmFsIENyZWF0b3JBZGRyZXNzCj09Ci8vIHVuYXV0aG9yaXplZAphc3NlcnQKcHVzaGludCBUTVBMX1VQREFUQUJMRSAvLyBUTVBMX1VQREFUQUJMRQovLyBDaGVjayBhcHAgaXMgdXBkYXRhYmxlCmFzc2VydApyZXRzdWIKCi8vIGRlbGV0ZQpkZWxldGVfMToKcHJvdG8gMCAwCnR4biBTZW5kZXIKZ2xvYmFsIENyZWF0b3JBZGRyZXNzCj09Ci8vIHVuYXV0aG9yaXplZAphc3NlcnQKcHVzaGludCBUTVBMX0RFTEVUQUJMRSAvLyBUTVBMX0RFTEVUQUJMRQovLyBDaGVjayBhcHAgaXMgZGVsZXRhYmxlCmFzc2VydApyZXRzdWIKCi8vIGhlbGxvCmhlbGxvXzI6CnByb3RvIDEgMQpwdXNoYnl0ZXMgMHggLy8gIiIKcHVzaGJ5dGVzIDB4NDg2NTZjNmM2ZjJjMjAgLy8gIkhlbGxvLCAiCmZyYW1lX2RpZyAtMQpleHRyYWN0IDIgMApjb25jYXQKZnJhbWVfYnVyeSAwCmZyYW1lX2RpZyAwCmxlbgppdG9iCmV4dHJhY3QgNiAwCmZyYW1lX2RpZyAwCmNvbmNhdApmcmFtZV9idXJ5IDAKcmV0c3ViCgovLyBoZWxsb193b3JsZF9jaGVjawpoZWxsb3dvcmxkY2hlY2tfMzoKcHJvdG8gMSAwCmZyYW1lX2RpZyAtMQpleHRyYWN0IDIgMApwdXNoYnl0ZXMgMHg1NzZmNzI2YzY0IC8vICJXb3JsZCIKPT0KYXNzZXJ0CnJldHN1Yg==",
    "clear": "I3ByYWdtYSB2ZXJzaW9uIDgKcHVzaGludCAwIC8vIDAKcmV0dXJu"
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
    "name": "HelloWorldApp",
    "methods": [
      {
        "name": "hello",
        "args": [
          {
            "type": "string",
            "name": "name"
          }
        ],
        "returns": {
          "type": "string"
        },
        "desc": "Returns Hello, {name}"
      },
      {
        "name": "hello_world_check",
        "args": [
          {
            "type": "string",
            "name": "name"
          }
        ],
        "returns": {
          "type": "void"
        },
        "desc": "Asserts {name} is \"World\""
      }
    ],
    "networks": {}
  },
  "bare_call_config": {
    "delete_application": "CALL",
    "no_op": "CREATE",
    "update_application": "CALL"
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
   * Gets the state value as a BigInt 
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

/**
 * Defines the types of available calls and state of the HelloWorldApp smart contract.
 */
export type HelloWorldApp = {
  /**
   * Maps method signatures / names to their argument and return types.
   */
  methods:
    & Record<'hello(string)string' | 'hello', {
      argsObj: {
        name: string
      }
      argsTuple: [name: string]
      returns: string
    }>
    & Record<'hello_world_check(string)void' | 'hello_world_check', {
      argsObj: {
        name: string
      }
      argsTuple: [name: string]
      returns: void
    }>
}
/**
 * Defines an object containing all relevant parameters for a single call to the contract. Where TSignature is undefined, a bare call is made
 */
export type TypedCallParams<TSignature extends keyof HelloWorldApp['methods'] | undefined> = {
  method: TSignature
  methodArgs: TSignature extends undefined ? undefined : ABIAppCallArg[]
} & AppClientCallCoreParams & CoreAppCallArgs
/**
 * Defines the arguments required for a bare call
 */
export type BareCallArgs = Omit<RawAppCallArgs, keyof CoreAppCallArgs>
/**
 * Maps a method signature from the HelloWorldApp smart contract to the method's arguments in either tuple of struct form
 */
export type MethodArgs<TSignature extends keyof HelloWorldApp['methods']> = HelloWorldApp['methods'][TSignature]['argsObj' | 'argsTuple']
/**
 * Maps a method signature from the HelloWorldApp smart contract to the method's return type
 */
export type MethodReturn<TSignature extends keyof HelloWorldApp['methods']> = HelloWorldApp['methods'][TSignature]['returns']

/**
 * A factory for available 'create' calls
 */
export type HelloWorldAppCreateCalls = (typeof HelloWorldAppCallFactory)['create']
/**
 * Defines supported create methods for this smart contract
 */
export type HelloWorldAppCreateCallParams =
  | (TypedCallParams<undefined> & (OnCompleteNoOp))
/**
 * A factory for available 'update' calls
 */
export type HelloWorldAppUpdateCalls = (typeof HelloWorldAppCallFactory)['update']
/**
 * Defines supported update methods for this smart contract
 */
export type HelloWorldAppUpdateCallParams =
  | TypedCallParams<undefined>
/**
 * A factory for available 'delete' calls
 */
export type HelloWorldAppDeleteCalls = (typeof HelloWorldAppCallFactory)['delete']
/**
 * Defines supported delete methods for this smart contract
 */
export type HelloWorldAppDeleteCallParams =
  | TypedCallParams<undefined>
/**
 * Defines arguments required for the deploy method.
 */
export type HelloWorldAppDeployArgs = {
  deployTimeParams?: TealTemplateParams
  /**
   * A delegate which takes a create call factory and returns the create call params for this smart contract
   */
  createCall?: (callFactory: HelloWorldAppCreateCalls) => HelloWorldAppCreateCallParams
  /**
   * A delegate which takes a update call factory and returns the update call params for this smart contract
   */
  updateCall?: (callFactory: HelloWorldAppUpdateCalls) => HelloWorldAppUpdateCallParams
  /**
   * A delegate which takes a delete call factory and returns the delete call params for this smart contract
   */
  deleteCall?: (callFactory: HelloWorldAppDeleteCalls) => HelloWorldAppDeleteCallParams
}

/**
 * Exposes methods for constructing all available smart contract calls
 */
export abstract class HelloWorldAppCallFactory {
  /**
   * Gets available create call factories
   */
  static get create() {
    return {
      /**
       * Constructs a create call for the HelloWorldApp smart contract using a bare call
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
   * Gets available update call factories
   */
  static get update() {
    return {
      /**
       * Constructs an update call for the HelloWorldApp smart contract using a bare call
       *
       * @param params Any parameters for the call
       * @returns A TypedCallParams object for the call
       */
      bare(params: BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs & AppClientCompilationParams = {}) {
        return {
          method: undefined,
          methodArgs: undefined,
          ...params,
        }
      },
    }
  }

  /**
   * Gets available delete call factories
   */
  static get delete() {
    return {
      /**
       * Constructs a delete call for the HelloWorldApp smart contract using a bare call
       *
       * @param params Any parameters for the call
       * @returns A TypedCallParams object for the call
       */
      bare(params: BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs = {}) {
        return {
          method: undefined,
          methodArgs: undefined,
          ...params,
        }
      },
    }
  }

  /**
   * Constructs a no op call for the hello(string)string ABI method
   *
   * Returns Hello, {name}
   *
   * @param args Any args for the contract call
   * @param params Any additional parameters for the call
   * @returns A TypedCallParams object for the call
   */
  static hello(args: MethodArgs<'hello(string)string'>, params: AppClientCallCoreParams & CoreAppCallArgs) {
    return {
      method: 'hello(string)string' as const,
      methodArgs: Array.isArray(args) ? args : [args.name],
      ...params,
    }
  }
  /**
   * Constructs a no op call for the hello_world_check(string)void ABI method
   *
   * Asserts {name} is "World"
   *
   * @param args Any args for the contract call
   * @param params Any additional parameters for the call
   * @returns A TypedCallParams object for the call
   */
  static helloWorldCheck(args: MethodArgs<'hello_world_check(string)void'>, params: AppClientCallCoreParams & CoreAppCallArgs) {
    return {
      method: 'hello_world_check(string)void' as const,
      methodArgs: Array.isArray(args) ? args : [args.name],
      ...params,
    }
  }
}

/**
 * A client to make calls to the HelloWorldApp smart contract
 */
export class HelloWorldAppClient {
  /**
   * The underlying `ApplicationClient` for when you want to have more flexibility
   */
  public readonly appClient: ApplicationClient

  /**
   * Creates a new instance of `HelloWorldAppClient`
   *
   * @param appDetails appDetails The details to identify the app to deploy
   * @param algod An algod client instance
   */
  constructor(appDetails: AppDetails, algod: Algodv2) {
    this.appClient = algokit.getAppClient({
      ...appDetails,
      app: APP_SPEC
    }, algod)
  }

  /**
   * Checks for decode errors on the AppCallTransactionResult and maps the return value to the specified generic type
   *
   * @param resultPromise The AppCallTransactionResult to be mapped
   * @param returnValueFormatter An optional delegate to format the return value if required
   * @returns The smart contract response with an updated return value
   */
  protected async mapReturnValue<TReturn>(resultPromise: Promise<AppCallTransactionResult> | AppCallTransactionResult, returnValueFormatter?: (value: any) => TReturn): Promise<AppCallTransactionResultOfType<TReturn>> {
    const result = await resultPromise
    if(result.return?.decodeError) {
      throw result.return.decodeError
    }
    const returnValue = result.return?.returnValue !== undefined && returnValueFormatter !== undefined
      ? returnValueFormatter(result.return.returnValue)
      : result.return?.returnValue as TReturn | undefined
      return { ...result, return: returnValue }
  }

  /**
   * Calls the ABI method with the matching signature using an onCompletion code of NO_OP
   *
   * @param typedCallParams An object containing the method signature, args, and any other relevant parameters
   * @param returnValueFormatter An optional delegate which when provided will be used to map non-undefined return values to the target type
   * @returns The result of the smart contract call
   */
  public call<TSignature extends keyof HelloWorldApp['methods']>(typedCallParams: TypedCallParams<TSignature>, returnValueFormatter?: (value: any) => MethodReturn<TSignature>) {
    return this.mapReturnValue<MethodReturn<TSignature>>(this.appClient.call(typedCallParams), returnValueFormatter)
  }

  /**
   * Idempotently deploys the HelloWorldApp smart contract.
   *
   * @param params The arguments for the contract calls and any additional parameters for the call
   * @returns The deployment result
   */
  public deploy(params: HelloWorldAppDeployArgs & AppClientDeployCoreParams = {}) {
    const createArgs = params.createCall?.(HelloWorldAppCallFactory.create)
    const updateArgs = params.updateCall?.(HelloWorldAppCallFactory.update)
    const deleteArgs = params.deleteCall?.(HelloWorldAppCallFactory.delete)
    return this.appClient.deploy({
      ...params,
      updateArgs,
      deleteArgs,
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
       * Creates a new instance of the HelloWorldApp smart contract using a bare call.
       *
       * @param args The arguments for the bare call
       * @returns The create result
       */
      bare(args: BareCallArgs & AppClientCallCoreParams & AppClientCompilationParams & CoreAppCallArgs & (OnCompleteNoOp) = {}): Promise<AppCallTransactionResultOfType<undefined>> {
        return $this.appClient.create(args) as unknown as Promise<AppCallTransactionResultOfType<undefined>>
      },
    }
  }

  /**
   * Gets available update methods
   */
  public get update() {
    const $this = this
    return {
      /**
       * Updates an existing instance of the HelloWorldApp smart contract using a bare call.
       *
       * @param args The arguments for the bare call
       * @returns The update result
       */
      bare(args: BareCallArgs & AppClientCallCoreParams & AppClientCompilationParams & CoreAppCallArgs = {}): Promise<AppCallTransactionResultOfType<undefined>> {
        return $this.appClient.update(args) as unknown as Promise<AppCallTransactionResultOfType<undefined>>
      },
    }
  }

  /**
   * Gets available delete methods
   */
  public get delete() {
    const $this = this
    return {
      /**
       * Deletes an existing instance of the HelloWorldApp smart contract using a bare call.
       *
       * @param args The arguments for the bare call
       * @returns The delete result
       */
      bare(args: BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs = {}): Promise<AppCallTransactionResultOfType<undefined>> {
        return $this.appClient.delete(args) as unknown as Promise<AppCallTransactionResultOfType<undefined>>
      },
    }
  }

  /**
   * Makes a clear_state call to an existing instance of the HelloWorldApp smart contract.
   *
   * @param args The arguments for the bare call
   * @returns The clear_state result
   */
  public clearState(args: BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.appClient.clearState(args)
  }

  /**
   * Calls the hello(string)string ABI method.
   *
   * Returns Hello, {name}
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The result of the call
   */
  public hello(args: MethodArgs<'hello(string)string'>, params: AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.call(HelloWorldAppCallFactory.hello(args, params))
  }

  /**
   * Calls the hello_world_check(string)void ABI method.
   *
   * Asserts {name} is "World"
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The result of the call
   */
  public helloWorldCheck(args: MethodArgs<'hello_world_check(string)void'>, params: AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.call(HelloWorldAppCallFactory.helloWorldCheck(args, params))
  }

}
