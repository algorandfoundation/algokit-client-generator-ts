/* eslint-disable */
/**
 * This file was automatically generated by @algorandfoundation/algokit-client-generator.
 * DO NOT MODIFY IT BY HAND.
 * requires: @algorandfoundation/algokit-utils: ^7
 */
import { type AlgorandClient } from '@algorandfoundation/algokit-utils/types/algorand-client'
import { ABIReturn, AppReturn, SendAppTransactionResult } from '@algorandfoundation/algokit-utils/types/app'
import { Arc56Contract, getArc56ReturnValue, getABIStructFromABITuple } from '@algorandfoundation/algokit-utils/types/app-arc56'
import {
  AppClient as _AppClient,
  AppClientMethodCallParams,
  AppClientParams,
  AppClientBareCallParams,
  CallOnComplete,
  AppClientCompilationParams,
  ResolveAppClientByCreatorAndName,
  ResolveAppClientByNetwork,
  CloneAppClientParams,
} from '@algorandfoundation/algokit-utils/types/app-client'
import { AppFactory as _AppFactory, AppFactoryAppClientParams, AppFactoryResolveAppClientByCreatorAndNameParams, AppFactoryDeployParams, AppFactoryParams, CreateSchema } from '@algorandfoundation/algokit-utils/types/app-factory'
import { TransactionComposer, AppCallMethodCall, AppMethodCallTransactionArgument, SimulateOptions, RawSimulateOptions, SkipSignaturesSimulateOptions } from '@algorandfoundation/algokit-utils/types/composer'
import { SendParams, SendSingleTransactionResult, SendAtomicTransactionComposerResults } from '@algorandfoundation/algokit-utils/types/transaction'
import { Address, encodeAddress, modelsv2, OnApplicationComplete, Transaction, TransactionSigner } from 'algosdk'
import SimulateResponse = modelsv2.SimulateResponse

export const APP_SPEC: Arc56Contract = {"arcs":[],"name":"Minimal","structs":{},"methods":[],"state":{"schema":{"global":{"ints":0,"bytes":0},"local":{"ints":0,"bytes":0}},"keys":{"global":{},"local":{},"box":{}},"maps":{"global":{},"local":{},"box":{}}},"source":{"approval":"I3ByYWdtYSB2ZXJzaW9uIDEwCiNwcmFnbWEgdHlwZXRyYWNrIGZhbHNlCgovLyBhbGdvcHkuYXJjNC5BUkM0Q29udHJhY3QuYXBwcm92YWxfcHJvZ3JhbSgpIC0+IHVpbnQ2NDoKbWFpbjoKICAgIGludGNibG9jayAxIFRNUExfVVBEQVRBQkxFIFRNUExfREVMRVRBQkxFCiAgICAvLyBleGFtcGxlcy9zbWFydF9jb250cmFjdHMvbWluaW1hbC9jb250cmFjdC5weTo0CiAgICAvLyBjbGFzcyBNaW5pbWFsKEV4YW1wbGVBUkM0Q29udHJhY3QpOgogICAgdHhuIE51bUFwcEFyZ3MKICAgIGJueiBtYWluX2FmdGVyX2lmX2Vsc2VAOQogICAgdHhuIE9uQ29tcGxldGlvbgogICAgc3dpdGNoIG1haW5fX19hbGdvcHlfZGVmYXVsdF9jcmVhdGVANCBtYWluX2FmdGVyX2lmX2Vsc2VAOSBtYWluX2FmdGVyX2lmX2Vsc2VAOSBtYWluX2FmdGVyX2lmX2Vsc2VAOSBtYWluX3VwZGF0ZUA1IG1haW5fZGVsZXRlQDYKCm1haW5fYWZ0ZXJfaWZfZWxzZUA5OgogICAgLy8gZXhhbXBsZXMvc21hcnRfY29udHJhY3RzL21pbmltYWwvY29udHJhY3QucHk6NAogICAgLy8gY2xhc3MgTWluaW1hbChFeGFtcGxlQVJDNENvbnRyYWN0KToKICAgIHB1c2hpbnQgMCAvLyAwCiAgICByZXR1cm4KCm1haW5fZGVsZXRlQDY6CiAgICAvLyBleGFtcGxlcy9zbWFydF9jb250cmFjdHMvYmFzZS9jb250cmFjdC5weTozMAogICAgLy8gQGFyYzQuYmFyZW1ldGhvZChhbGxvd19hY3Rpb25zPVsiRGVsZXRlQXBwbGljYXRpb24iXSkKICAgIHR4biBBcHBsaWNhdGlvbklECiAgICBhc3NlcnQgLy8gY2FuIG9ubHkgY2FsbCB3aGVuIG5vdCBjcmVhdGluZwogICAgLy8gZXhhbXBsZXMvc21hcnRfY29udHJhY3RzL2Jhc2UvY29udHJhY3QucHk6MzAtMzEKICAgIC8vIEBhcmM0LmJhcmVtZXRob2QoYWxsb3dfYWN0aW9ucz1bIkRlbGV0ZUFwcGxpY2F0aW9uIl0pCiAgICAvLyBkZWYgZGVsZXRlKHNlbGYpIC0+IE5vbmU6CiAgICBjYWxsc3ViIGRlbGV0ZQogICAgaW50Y18wIC8vIDEKICAgIHJldHVybgoKbWFpbl91cGRhdGVANToKICAgIC8vIGV4YW1wbGVzL3NtYXJ0X2NvbnRyYWN0cy9iYXNlL2NvbnRyYWN0LnB5OjIzCiAgICAvLyBAYXJjNC5iYXJlbWV0aG9kKGFsbG93X2FjdGlvbnM9WyJVcGRhdGVBcHBsaWNhdGlvbiJdKQogICAgdHhuIEFwcGxpY2F0aW9uSUQKICAgIGFzc2VydCAvLyBjYW4gb25seSBjYWxsIHdoZW4gbm90IGNyZWF0aW5nCiAgICAvLyBleGFtcGxlcy9zbWFydF9jb250cmFjdHMvYmFzZS9jb250cmFjdC5weToyMy0yNAogICAgLy8gQGFyYzQuYmFyZW1ldGhvZChhbGxvd19hY3Rpb25zPVsiVXBkYXRlQXBwbGljYXRpb24iXSkKICAgIC8vIGRlZiB1cGRhdGUoc2VsZikgLT4gTm9uZToKICAgIGNhbGxzdWIgdXBkYXRlCiAgICBpbnRjXzAgLy8gMQogICAgcmV0dXJuCgptYWluX19fYWxnb3B5X2RlZmF1bHRfY3JlYXRlQDQ6CiAgICB0eG4gQXBwbGljYXRpb25JRAogICAgIQogICAgYXNzZXJ0IC8vIGNhbiBvbmx5IGNhbGwgd2hlbiBjcmVhdGluZwogICAgaW50Y18wIC8vIDEKICAgIHJldHVybgoKCi8vIGV4YW1wbGVzLnNtYXJ0X2NvbnRyYWN0cy5iYXNlLmNvbnRyYWN0LkltbXV0YWJpbGl0eUNvbnRyb2xBUkM0Q29udHJhY3QudXBkYXRlKCkgLT4gdm9pZDoKdXBkYXRlOgogICAgLy8gZXhhbXBsZXMvc21hcnRfY29udHJhY3RzL2Jhc2UvY29udHJhY3QucHk6MjMtMjQKICAgIC8vIEBhcmM0LmJhcmVtZXRob2QoYWxsb3dfYWN0aW9ucz1bIlVwZGF0ZUFwcGxpY2F0aW9uIl0pCiAgICAvLyBkZWYgdXBkYXRlKHNlbGYpIC0+IE5vbmU6CiAgICBwcm90byAwIDAKICAgIC8vIGV4YW1wbGVzL3NtYXJ0X2NvbnRyYWN0cy9iYXNlL2NvbnRyYWN0LnB5OjI1CiAgICAvLyBhc3NlcnQgVGVtcGxhdGVWYXJbYm9vbF0oVVBEQVRBQkxFX1RFTVBMQVRFX05BTUUpLCAiQ2hlY2sgYXBwIGlzIHVwZGF0YWJsZSIKICAgIGludGNfMSAvLyBUTVBMX1VQREFUQUJMRQogICAgYXNzZXJ0IC8vIENoZWNrIGFwcCBpcyB1cGRhdGFibGUKICAgIC8vIGV4YW1wbGVzL3NtYXJ0X2NvbnRyYWN0cy9iYXNlL2NvbnRyYWN0LnB5OjI2CiAgICAvLyBzZWxmLmF1dGhvcml6ZV9jcmVhdG9yKCkKICAgIGNhbGxzdWIgYXV0aG9yaXplX2NyZWF0b3IKICAgIHJldHN1YgoKCi8vIGV4YW1wbGVzLnNtYXJ0X2NvbnRyYWN0cy5iYXNlLmNvbnRyYWN0LkJhc2VBUkM0Q29udHJhY3QuYXV0aG9yaXplX2NyZWF0b3IoKSAtPiB2b2lkOgphdXRob3JpemVfY3JlYXRvcjoKICAgIC8vIGV4YW1wbGVzL3NtYXJ0X2NvbnRyYWN0cy9iYXNlL2NvbnRyYWN0LnB5OjgtOQogICAgLy8gQHN1YnJvdXRpbmUKICAgIC8vIGRlZiBhdXRob3JpemVfY3JlYXRvcihzZWxmKSAtPiBOb25lOgogICAgcHJvdG8gMCAwCiAgICAvLyBleGFtcGxlcy9zbWFydF9jb250cmFjdHMvYmFzZS9jb250cmFjdC5weToxMAogICAgLy8gYXNzZXJ0IFR4bi5zZW5kZXIgPT0gR2xvYmFsLmNyZWF0b3JfYWRkcmVzcywgInVuYXV0aG9yaXplZCIKICAgIHR4biBTZW5kZXIKICAgIGdsb2JhbCBDcmVhdG9yQWRkcmVzcwogICAgPT0KICAgIGFzc2VydCAvLyB1bmF1dGhvcml6ZWQKICAgIHJldHN1YgoKCi8vIGV4YW1wbGVzLnNtYXJ0X2NvbnRyYWN0cy5iYXNlLmNvbnRyYWN0LlBlcm1hbmVuY2VDb250cm9sQVJDNENvbnRyYWN0LmRlbGV0ZSgpIC0+IHZvaWQ6CmRlbGV0ZToKICAgIC8vIGV4YW1wbGVzL3NtYXJ0X2NvbnRyYWN0cy9iYXNlL2NvbnRyYWN0LnB5OjMwLTMxCiAgICAvLyBAYXJjNC5iYXJlbWV0aG9kKGFsbG93X2FjdGlvbnM9WyJEZWxldGVBcHBsaWNhdGlvbiJdKQogICAgLy8gZGVmIGRlbGV0ZShzZWxmKSAtPiBOb25lOgogICAgcHJvdG8gMCAwCiAgICAvLyBleGFtcGxlcy9zbWFydF9jb250cmFjdHMvYmFzZS9jb250cmFjdC5weTozMgogICAgLy8gYXNzZXJ0IFRlbXBsYXRlVmFyW2Jvb2xdKERFTEVUQUJMRV9URU1QTEFURV9OQU1FKSwgIkNoZWNrIGFwcCBpcyBkZWxldGFibGUiCiAgICBpbnRjXzIgLy8gVE1QTF9ERUxFVEFCTEUKICAgIGFzc2VydCAvLyBDaGVjayBhcHAgaXMgZGVsZXRhYmxlCiAgICAvLyBleGFtcGxlcy9zbWFydF9jb250cmFjdHMvYmFzZS9jb250cmFjdC5weTozMwogICAgLy8gc2VsZi5hdXRob3JpemVfY3JlYXRvcigpCiAgICBjYWxsc3ViIGF1dGhvcml6ZV9jcmVhdG9yCiAgICByZXRzdWIK","clear":"I3ByYWdtYSB2ZXJzaW9uIDEwCiNwcmFnbWEgdHlwZXRyYWNrIGZhbHNlCgovLyBhbGdvcHkuYXJjNC5BUkM0Q29udHJhY3QuY2xlYXJfc3RhdGVfcHJvZ3JhbSgpIC0+IHVpbnQ2NDoKbWFpbjoKICAgIHB1c2hpbnQgMSAvLyAxCiAgICByZXR1cm4K"},"bareActions":{"create":["NoOp"],"call":["DeleteApplication","UpdateApplication"]}} as unknown as Arc56Contract

/**
 * A state record containing binary data
 */
export interface BinaryState {
  /**
   * Gets the state value as a Uint8Array
   */
  asByteArray(): Uint8Array | undefined
  /**
   * Gets the state value as a string
   */
  asString(): string | undefined
}

class BinaryStateValue implements BinaryState {
  constructor(private value: Uint8Array | undefined) {}

  asByteArray(): Uint8Array | undefined {
    return this.value
  }

  asString(): string | undefined {
    return this.value !== undefined ? Buffer.from(this.value).toString('utf-8') : undefined
  }
}

/**
 * Expands types for IntelliSense so they are more human readable
 * See https://stackoverflow.com/a/69288824
 */
export type Expand<T> = T extends (...args: infer A) => infer R
  ? (...args: Expand<A>) => Expand<R>
  : T extends infer O
    ? { [K in keyof O]: O[K] }
    : never


/**
 * The argument types for the Minimal contract
 */
export type MinimalArgs = {
  /**
   * The object representation of the arguments for each method
   */
  obj: {
  }
  /**
   * The tuple representation of the arguments for each method
   */
  tuple: {
  }
}

/**
 * The return type for each method
 */
export type MinimalReturns = {
}

/**
 * Defines the types of available calls and state of the Minimal smart contract.
 */
export type MinimalTypes = {
  /**
   * Maps method signatures / names to their argument and return types.
   */
  methods: {}
}

/**
 * Defines the possible abi call signatures.
 */
export type MinimalSignatures = keyof MinimalTypes['methods']
/**
 * Defines the possible abi call signatures for methods that return a non-void value.
 */
export type MinimalNonVoidMethodSignatures = keyof MinimalTypes['methods'] extends infer T ? T extends keyof MinimalTypes['methods'] ? MethodReturn<T> extends void ? never : T  : never : never
/**
 * Defines an object containing all relevant parameters for a single call to the contract.
 */
export type CallParams<TArgs> = Expand<
  Omit<AppClientMethodCallParams, 'method' | 'args' | 'onComplete'> &
    {
      /** The args for the ABI method call, either as an ordered array or an object */
      args: Expand<TArgs>
    }
>
/**
 * Maps a method signature from the Minimal smart contract to the method's arguments in either tuple or struct form
 */
export type MethodArgs<TSignature extends MinimalSignatures> = MinimalTypes['methods'][TSignature]['argsObj' | 'argsTuple']
/**
 * Maps a method signature from the Minimal smart contract to the method's return type
 */
export type MethodReturn<TSignature extends MinimalSignatures> = MinimalTypes['methods'][TSignature]['returns']


/**
 * Defines supported create method params for this smart contract
 */
export type MinimalCreateCallParams =
  | Expand<AppClientBareCallParams & {method?: never} & {onComplete?: OnApplicationComplete.NoOpOC} & CreateSchema>
/**
 * Defines supported update method params for this smart contract
 */
export type MinimalUpdateCallParams =
  | Expand<AppClientBareCallParams> & {method?: never}
/**
 * Defines supported delete method params for this smart contract
 */
export type MinimalDeleteCallParams =
  | Expand<AppClientBareCallParams> & {method?: never}
/**
 * Defines arguments required for the deploy method.
 */
export type MinimalDeployParams = Expand<Omit<AppFactoryDeployParams, 'createParams' | 'updateParams' | 'deleteParams'> & {
  /**
   * Create transaction parameters to use if a create needs to be issued as part of deployment; use `method` to define ABI call (if available) or leave out for a bare call (if available)
   */
  createParams?: MinimalCreateCallParams
  /**
   * Update transaction parameters to use if a create needs to be issued as part of deployment; use `method` to define ABI call (if available) or leave out for a bare call (if available)
   */
  updateParams?: MinimalUpdateCallParams
  /**
   * Delete transaction parameters to use if a create needs to be issued as part of deployment; use `method` to define ABI call (if available) or leave out for a bare call (if available)
   */
  deleteParams?: MinimalDeleteCallParams
}>


/**
 * Exposes methods for constructing `AppClient` params objects for ABI calls to the Minimal smart contract
 */
export abstract class MinimalParamsFactory {
}

/**
 * A factory to create and deploy one or more instance of the Minimal smart contract and to create one or more app clients to interact with those (or other) app instances
 */
export class MinimalFactory {
  /**
   * The underlying `AppFactory` for when you want to have more flexibility
   */
  public readonly appFactory: _AppFactory

  /**
   * Creates a new instance of `MinimalFactory`
   *
   * @param params The parameters to initialise the app factory with
   */
  constructor(params: Omit<AppFactoryParams, 'appSpec'>) {
    this.appFactory = new _AppFactory({
      ...params,
      appSpec: APP_SPEC,
    })
  }
  
  /** The name of the app (from the ARC-32 / ARC-56 app spec or override). */
  public get appName() {
    return this.appFactory.appName
  }
  
  /** The ARC-56 app spec being used */
  get appSpec() {
    return APP_SPEC
  }
  
  /** A reference to the underlying `AlgorandClient` this app factory is using. */
  public get algorand(): AlgorandClient {
    return this.appFactory.algorand
  }
  
  /**
   * Returns a new `AppClient` client for an app instance of the given ID.
   *
   * Automatically populates appName, defaultSender and source maps from the factory
   * if not specified in the params.
   * @param params The parameters to create the app client
   * @returns The `AppClient`
   */
  public getAppClientById(params: AppFactoryAppClientParams) {
    return new MinimalClient(this.appFactory.getAppClientById(params))
  }
  
  /**
   * Returns a new `AppClient` client, resolving the app by creator address and name
   * using AlgoKit app deployment semantics (i.e. looking for the app creation transaction note).
   *
   * Automatically populates appName, defaultSender and source maps from the factory
   * if not specified in the params.
   * @param params The parameters to create the app client
   * @returns The `AppClient`
   */
  public async getAppClientByCreatorAndName(
    params: AppFactoryResolveAppClientByCreatorAndNameParams,
  ) {
    return new MinimalClient(await this.appFactory.getAppClientByCreatorAndName(params))
  }

  /**
   * Idempotently deploys the Minimal smart contract.
   *
   * @param params The arguments for the contract calls and any additional parameters for the call
   * @returns The deployment result
   */
  public async deploy(params: MinimalDeployParams = {}) {
    const result = await this.appFactory.deploy({
      ...params,
    })
    return { result: result.result, appClient: new MinimalClient(result.appClient) }
  }

  /**
   * Get parameters to create transactions (create and deploy related calls) for the current app. A good mental model for this is that these parameters represent a deferred transaction creation.
   */
  readonly params = {
    /**
     * Gets available create methods
     */
    create: {
      /**
       * Creates a new instance of the Minimal smart contract using a bare call.
       *
       * @param params The params for the bare (raw) call
       * @returns The params for a create call
       */
      bare: (params?: Expand<AppClientBareCallParams & AppClientCompilationParams & CreateSchema & {onComplete?: OnApplicationComplete.NoOpOC}>) => {
        return this.appFactory.params.bare.create(params)
      },
    },

    /**
     * Gets available deployUpdate methods
     */
    deployUpdate: {
      /**
       * Updates an existing instance of the Minimal smart contract using a bare call.
       *
       * @param params The params for the bare (raw) call
       * @returns The params for a deployUpdate call
       */
      bare: (params?: Expand<AppClientBareCallParams & AppClientCompilationParams>) => {
        return this.appFactory.params.bare.deployUpdate(params)
      },
    },

    /**
     * Gets available deployDelete methods
     */
    deployDelete: {
      /**
       * Deletes an existing instance of the Minimal smart contract using a bare call.
       *
       * @param params The params for the bare (raw) call
       * @returns The params for a deployDelete call
       */
      bare: (params?: Expand<AppClientBareCallParams>) => {
        return this.appFactory.params.bare.deployDelete(params)
      },
    },

  }

  /**
   * Create transactions for the current app
   */
  readonly createTransaction = {
    /**
     * Gets available create methods
     */
    create: {
      /**
       * Creates a new instance of the Minimal smart contract using a bare call.
       *
       * @param params The params for the bare (raw) call
       * @returns The transaction for a create call
       */
      bare: (params?: Expand<AppClientBareCallParams & AppClientCompilationParams & CreateSchema & {onComplete?: OnApplicationComplete.NoOpOC}>) => {
        return this.appFactory.createTransaction.bare.create(params)
      },
    },

  }

  /**
   * Send calls to the current app
   */
  readonly send = {
    /**
     * Gets available create methods
     */
    create: {
      /**
       * Creates a new instance of the Minimal smart contract using a bare call.
       *
       * @param params The params for the bare (raw) call
       * @returns The create result
       */
      bare: async (params?: Expand<AppClientBareCallParams & AppClientCompilationParams & CreateSchema & SendParams & {onComplete?: OnApplicationComplete.NoOpOC}>) => {
        const result = await this.appFactory.send.bare.create(params)
        return { result: result.result, appClient: new MinimalClient(result.appClient) }
      },
    },

  }

}
/**
 * A client to make calls to the Minimal smart contract
 */
export class MinimalClient {
  /**
   * The underlying `AppClient` for when you want to have more flexibility
   */
  public readonly appClient: _AppClient

  /**
   * Creates a new instance of `MinimalClient`
   *
   * @param appClient An `AppClient` instance which has been created with the Minimal app spec
   */
  constructor(appClient: _AppClient)
  /**
   * Creates a new instance of `MinimalClient`
   *
   * @param params The parameters to initialise the app client with
   */
  constructor(params: Omit<AppClientParams, 'appSpec'>)
  constructor(appClientOrParams: _AppClient | Omit<AppClientParams, 'appSpec'>) {
    this.appClient = appClientOrParams instanceof _AppClient ? appClientOrParams : new _AppClient({
      ...appClientOrParams,
      appSpec: APP_SPEC,
    })
  }
  
  /**
   * Checks for decode errors on the given return value and maps the return value to the return type for the given method
   * @returns The typed return value or undefined if there was no value
   */
  decodeReturnValue<TSignature extends MinimalNonVoidMethodSignatures>(method: TSignature, returnValue: ABIReturn | undefined) {
    return returnValue !== undefined ? getArc56ReturnValue<MethodReturn<TSignature>>(returnValue, this.appClient.getABIMethod(method), APP_SPEC.structs) : undefined
  }
  
  /**
   * Returns a new `MinimalClient` client, resolving the app by creator address and name
   * using AlgoKit app deployment semantics (i.e. looking for the app creation transaction note).
   * @param params The parameters to create the app client
   */
  public static async fromCreatorAndName(params: Omit<ResolveAppClientByCreatorAndName, 'appSpec'>): Promise<MinimalClient> {
    return new MinimalClient(await _AppClient.fromCreatorAndName({...params, appSpec: APP_SPEC}))
  }
  
  /**
   * Returns an `MinimalClient` instance for the current network based on
   * pre-determined network-specific app IDs specified in the ARC-56 app spec.
   *
   * If no IDs are in the app spec or the network isn't recognised, an error is thrown.
   * @param params The parameters to create the app client
   */
  static async fromNetwork(
    params: Omit<ResolveAppClientByNetwork, 'appSpec'>
  ): Promise<MinimalClient> {
    return new MinimalClient(await _AppClient.fromNetwork({...params, appSpec: APP_SPEC}))
  }
  
  /** The ID of the app instance this client is linked to. */
  public get appId() {
    return this.appClient.appId
  }
  
  /** The app address of the app instance this client is linked to. */
  public get appAddress() {
    return this.appClient.appAddress
  }
  
  /** The name of the app. */
  public get appName() {
    return this.appClient.appName
  }
  
  /** The ARC-56 app spec being used */
  public get appSpec() {
    return this.appClient.appSpec
  }
  
  /** A reference to the underlying `AlgorandClient` this app client is using. */
  public get algorand(): AlgorandClient {
    return this.appClient.algorand
  }

  /**
   * Get parameters to create transactions for the current app. A good mental model for this is that these parameters represent a deferred transaction creation.
   */
  readonly params = {
    /**
     * Gets available update methods
     */
    update: {
      /**
       * Updates an existing instance of the Minimal smart contract using a bare call.
       *
       * @param params The params for the bare (raw) call
       * @returns The update result
       */
      bare: (params?: Expand<AppClientBareCallParams & AppClientCompilationParams>) => {
        return this.appClient.params.bare.update(params)
      },
    },

    /**
     * Gets available delete methods
     */
    delete: {
      /**
       * Deletes an existing instance of the Minimal smart contract using a bare call.
       *
       * @param params The params for the bare (raw) call
       * @returns The delete result
       */
      bare: (params?: Expand<AppClientBareCallParams>) => {
        return this.appClient.params.bare.delete(params)
      },
    },

    /**
     * Makes a clear_state call to an existing instance of the Minimal smart contract.
     *
     * @param params The params for the bare (raw) call
     * @returns The clearState result
     */
    clearState: (params?: Expand<AppClientBareCallParams>) => {
      return this.appClient.params.bare.clearState(params)
    },

  }

  /**
   * Create transactions for the current app
   */
  readonly createTransaction = {
    /**
     * Gets available update methods
     */
    update: {
      /**
       * Updates an existing instance of the Minimal smart contract using a bare call.
       *
       * @param params The params for the bare (raw) call
       * @returns The update result
       */
      bare: (params?: Expand<AppClientBareCallParams & AppClientCompilationParams>) => {
        return this.appClient.createTransaction.bare.update(params)
      },
    },

    /**
     * Gets available delete methods
     */
    delete: {
      /**
       * Deletes an existing instance of the Minimal smart contract using a bare call.
       *
       * @param params The params for the bare (raw) call
       * @returns The delete result
       */
      bare: (params?: Expand<AppClientBareCallParams>) => {
        return this.appClient.createTransaction.bare.delete(params)
      },
    },

    /**
     * Makes a clear_state call to an existing instance of the Minimal smart contract.
     *
     * @param params The params for the bare (raw) call
     * @returns The clearState result
     */
    clearState: (params?: Expand<AppClientBareCallParams>) => {
      return this.appClient.createTransaction.bare.clearState(params)
    },

  }

  /**
   * Send calls to the current app
   */
  readonly send = {
    /**
     * Gets available update methods
     */
    update: {
      /**
       * Updates an existing instance of the Minimal smart contract using a bare call.
       *
       * @param params The params for the bare (raw) call
       * @returns The update result
       */
      bare: (params?: Expand<AppClientBareCallParams & AppClientCompilationParams & SendParams>) => {
        return this.appClient.send.bare.update(params)
      },
    },

    /**
     * Gets available delete methods
     */
    delete: {
      /**
       * Deletes an existing instance of the Minimal smart contract using a bare call.
       *
       * @param params The params for the bare (raw) call
       * @returns The delete result
       */
      bare: (params?: Expand<AppClientBareCallParams & SendParams>) => {
        return this.appClient.send.bare.delete(params)
      },
    },

    /**
     * Makes a clear_state call to an existing instance of the Minimal smart contract.
     *
     * @param params The params for the bare (raw) call
     * @returns The clearState result
     */
    clearState: (params?: Expand<AppClientBareCallParams & SendParams>) => {
      return this.appClient.send.bare.clearState(params)
    },

  }

  /**
   * Clone this app client with different params
   *
   * @param params The params to use for the the cloned app client. Omit a param to keep the original value. Set a param to override the original value. Setting to undefined will clear the original value.
   * @returns A new app client with the altered params
   */
  public clone(params: CloneAppClientParams) {
    return new MinimalClient(this.appClient.clone(params))
  }

  /**
   * Methods to access state for the current Minimal app
   */
  state = {
  }

  public newGroup(): MinimalComposer {
    const client = this
    const composer = this.algorand.newGroup()
    let promiseChain:Promise<unknown> = Promise.resolve()
    const resultMappers: Array<undefined | ((x: ABIReturn | undefined) => any)> = []
    return {
      get update() {
        return {
          bare: (params?: AppClientBareCallParams & AppClientCompilationParams ) => {
            promiseChain = promiseChain.then(async () => composer.addAppUpdate(await client.params.update.bare(params)))
            return this
          },
        }
      },
      get delete() {
        return {
          bare: (params?: AppClientBareCallParams ) => {
            promiseChain = promiseChain.then(() => composer.addAppDelete(client.params.delete.bare(params)))
            return this
          },
        }
      },
      /**
       * Add a clear state call to the Minimal contract
       */
      clearState(params: AppClientBareCallParams) {
        promiseChain = promiseChain.then(() => composer.addAppCall(client.params.clearState(params)))
        return this
      },
      addTransaction(txn: Transaction, signer?: TransactionSigner) {
        promiseChain = promiseChain.then(() => composer.addTransaction(txn, signer))
        return this
      },
      async composer() {
        await promiseChain
        return composer
      },
      async simulate(options?: SimulateOptions) {
        await promiseChain
        const result = await (!options ? composer.simulate() : composer.simulate(options))
        return {
          ...result,
          returns: result.returns?.map((val, i) => resultMappers[i] !== undefined ? resultMappers[i]!(val) : val.returnValue)
        }
      },
      async send(params?: SendParams) {
        await promiseChain
        const result = await composer.send(params)
        return {
          ...result,
          returns: result.returns?.map((val, i) => resultMappers[i] !== undefined ? resultMappers[i]!(val) : val.returnValue)
        }
      }
    } as unknown as MinimalComposer
  }
}
export type MinimalComposer<TReturns extends [...any[]] = []> = {
  /**
   * Gets available delete methods
   */
  readonly delete: {
    /**
     * Deletes an existing instance of the Minimal smart contract using a bare call.
     *
     * @param args The arguments for the bare call
     * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
     */
    bare(params?: AppClientBareCallParams ): MinimalComposer<[...TReturns, undefined]>
  }

  /**
   * Gets available update methods
   */
  readonly update: {
    /**
     * Updates an existing instance of the Minimal smart contract using a bare call.
     *
     * @param args The arguments for the bare call
     * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
     */
    bare(params?: AppClientBareCallParams ): MinimalComposer<[...TReturns, undefined]>
  }

  /**
   * Makes a clear_state call to an existing instance of the Minimal smart contract.
   *
   * @param args The arguments for the bare call
   * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
   */
  clearState(params?: AppClientBareCallParams): MinimalComposer<[...TReturns, undefined]>

  /**
   * Adds a transaction to the composer
   *
   * @param txn A transaction to add to the transaction group
   * @param signer The optional signer to use when signing this transaction.
   */
  addTransaction(txn: Transaction, signer?: TransactionSigner): MinimalComposer<TReturns>
  /**
   * Returns the underlying AtomicTransactionComposer instance
   */
  composer(): Promise<TransactionComposer>
  /**
   * Simulates the transaction group and returns the result
   */
  simulate(): Promise<MinimalComposerResults<TReturns> & { simulateResponse: SimulateResponse }>
  simulate(options: SkipSignaturesSimulateOptions): Promise<MinimalComposerResults<TReturns> & { simulateResponse: SimulateResponse }>
  simulate(options: RawSimulateOptions): Promise<MinimalComposerResults<TReturns> & { simulateResponse: SimulateResponse }>
  /**
   * Sends the transaction group to the network and returns the results
   */
  send(params?: SendParams): Promise<MinimalComposerResults<TReturns>>
}
export type MinimalComposerResults<TReturns extends [...any[]]> = Expand<SendAtomicTransactionComposerResults & {
  returns: TReturns
}>

