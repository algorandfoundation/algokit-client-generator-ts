import { DocumentParts } from '../output/writer'

export function* imports(): DocumentParts {
  yield `
    import { AlgorandClientInterface } from '@algorandfoundation/algokit-utils/types/algorand-client-interface'
    import { ABIReturn, AppReturn, SendAppTransactionResult } from '@algorandfoundation/algokit-utils/types/app'
    import { Arc56Contract, getArc56ReturnValue, getABIStructFromABITuple } from '@algorandfoundation/algokit-utils/types/app-arc56'
    import {
      AppClient,
      AppClientMethodCallParams,
      AppClientParams,
      AppClientBareCallParams,
      CallOnComplete,
      AppClientCompilationParams,
      ResolveAppClientByCreatorAndName,
      ResolveAppClientByNetwork,
      CloneAppClientParams,
    } from '@algorandfoundation/algokit-utils/types/app-client'
    import { AppFactory, AppFactoryAppClientParams, AppFactoryResolveAppClientByCreatorAndNameParams, AppFactoryDeployParams, AppFactoryParams, CreateSchema } from '@algorandfoundation/algokit-utils/types/app-factory'
    import { TransactionComposer, AppCallMethodCall, AppMethodCallTransactionArgument, SimulateOptions } from '@algorandfoundation/algokit-utils/types/composer'
    import { SendParams, SendSingleTransactionResult, SendAtomicTransactionComposerResults } from '@algorandfoundation/algokit-utils/types/transaction'
    import { modelsv2, OnApplicationComplete, Transaction, TransactionSigner } from 'algosdk'
    import SimulateResponse = modelsv2.SimulateResponse
  `
}
