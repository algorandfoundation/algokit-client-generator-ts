import * as algokit from '@algorandfoundation/algokit-utils'
import {
  AppCallTransactionResultOfType,
  CoreAppCallArgs,
  RawAppCallArgs,
  TealTemplateParams,
} from '@algorandfoundation/algokit-utils/types/app'
import {
  AppClientCallCoreParams,
  AppClientCompilationParams,
  AppClientDeployCoreParams,
  AppDetails,
  ApplicationClient,
} from '@algorandfoundation/algokit-utils/types/app-client'
import { AppSpec } from '@algorandfoundation/algokit-utils/types/app-spec'
import { Algodv2 } from 'algosdk'
import appspec from './application.json'

export type CallRequest<TReturn, TArgs = undefined> = {
  method: string
  methodArgs: TArgs
} & CoreAppCallArgs &
  AppClientCallCoreParams

// Bare call arguments
export type BareCallArgs = Omit<RawAppCallArgs, keyof CoreAppCallArgs>

// hello(string)string arguments
export type HelloArgsObj = {
  name: string
}
export type HelloArgsTuple = [name: string]
export type HelloArgs = HelloArgsObj | HelloArgsTuple

// hello_world_check(string)void arguments
export type HelloWorldCheckArgsObj = {
  name: string
}
export type HelloWorldCheckArgsTuple = [name: string]
export type HelloWorldCheckArgs = HelloWorldCheckArgsObj | HelloWorldCheckArgsTuple

export type HelloWorldCreateArgs = BareCallArgs
export type HelloWorldUpdateArgs = BareCallArgs
export type HelloWorldDeleteArgs = BareCallArgs

export type HelloWorldAppDeployArgs = {
  /** Any deploy-time parameters to replace in the TEAL code */
  deployTimeParams?: TealTemplateParams
  /** Any args to pass to any create transaction that is issued as part of deployment */
  createArgs?: HelloWorldCreateArgs & CoreAppCallArgs
  /** Any args to pass to any update transaction that is issued as part of deployment */
  updateArgs?: HelloWorldUpdateArgs & CoreAppCallArgs
  /** Any args to pass to any delete transaction that is issued as part of deployment */
  deleteArgs?: HelloWorldDeleteArgs & CoreAppCallArgs
}

export abstract class HelloWorldAppCallFactory {
  static hello(
    args: HelloArgs,
    params: AppClientCallCoreParams & CoreAppCallArgs = {},
  ): CallRequest<string, HelloArgsTuple> {
    return {
      method: 'hello(string)string',
      methodArgs: Array.isArray(args) ? args : [args.name],
      ...params,
    }
  }

  static helloWorldCheck(
    args: HelloWorldCheckArgs,
    params: AppClientCallCoreParams & CoreAppCallArgs = {},
  ): CallRequest<void, HelloWorldCheckArgsTuple> {
    return {
      method: 'hello_world_check(string)void',
      methodArgs: Array.isArray(args) ? args : [args.name],
      ...params,
    }
  }
}

/** A client to make calls to the HelloWorldApp smart contract */
export class HelloWorldAppClient {
  /** The underlying `ApplicationClient` for when you want to have more flexibility */
  public readonly appClient: ApplicationClient

  /**
   * Creates a new instance of `HelloWorldAppClient`
   * @param appDetails The details to identify the app to deploy
   * @param algod An algod client instance
   */
  constructor(appDetails: AppDetails, algod: Algodv2) {
    this.appClient = algokit.getAppClient(
      {
        ...appDetails,
        app: appspec as unknown as AppSpec,
      },
      algod,
    )
  }

  public async call<TReturn>(params: CallRequest<TReturn, any>): Promise<AppCallTransactionResultOfType<TReturn>> {
    const result = await this.appClient.call(params)
    if (result.return?.decodeError) {
      throw result.return.decodeError
    }
    const returnValue = result.return?.returnValue as TReturn
    return { ...result, return: returnValue }
  }

  /**
   * Idempotently deploys the HelloWorldApp smart contract.
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The deployment result
   */
  public async deploy(args: HelloWorldAppDeployArgs = {}, params: AppClientDeployCoreParams = {}) {
    const result = await this.appClient.deploy({
      ...args,
      ...params,
    })
    return result
  }

  /**
   * Creates a new instance of the HelloWorldApp smart contract.
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The creation result
   */
  public async create(
    args: HelloWorldCreateArgs = {},
    params: AppClientCallCoreParams & AppClientCompilationParams & CoreAppCallArgs = {},
  ) {
    const { return: r, ...result } = await this.appClient.create({
      ...args,
      ...params,
    })
    return result
  }

  /**
   * Updates an existing instance of the HelloWorldApp smart contract.
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The update result
   */
  public async update(
    args: HelloWorldUpdateArgs = {},
    params: AppClientCallCoreParams & AppClientCompilationParams & CoreAppCallArgs = {},
  ) {
    const { return: r, ...result } = await this.appClient.update({
      ...args,
      ...params,
    })
    return result
  }

  /**
   * Deletes an existing instance of the HelloWorldApp smart contract.
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The deletion result
   */
  public async delete(args: HelloWorldDeleteArgs = {}, params: AppClientCallCoreParams & CoreAppCallArgs = {}) {
    const { return: _, ...result } = await this.appClient.delete({
      ...args,
      ...params,
    })
    return result
  }

  /**
   * Returns Hello, {name}
   *
   * Calls the hello(name) ABI method.
   *
   * Uses OnComplete = NoOp.
   * @param args The arguments for the ABI method
   * @param params Any additional parameters for the call
   * @returns The result of the call
   */
  public async hello(
    args: HelloArgs,
    params: AppClientCallCoreParams & CoreAppCallArgs = {},
  ): Promise<AppCallTransactionResultOfType<string>> {
    return this.call(HelloWorldAppCallFactory.hello(args, params))
  }

  /**
   * Asserts {name} is "World"
   *
   * Calls the hello_world_check(name) ABI method.
   *
   * Uses OnComplete = NoOp.
   * @param args The arguments for the ABI method
   * @param params Any additional parameters for the call
   * @returns The result of the call
   */
  public async helloWorldCheck(
    args: HelloArgs,
    params: AppClientCallCoreParams & CoreAppCallArgs = {},
  ): Promise<AppCallTransactionResultOfType<void>> {
    return this.call(HelloWorldAppCallFactory.helloWorldCheck(args, params))
  }
}
