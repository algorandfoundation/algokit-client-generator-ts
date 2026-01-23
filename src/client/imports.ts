import { DocumentParts } from '../output/writer'

export function* imports(): DocumentParts {
  yield `
import { type AlgorandClient } from '@algorandfoundation/algokit-utils/algorand-client'
import { ABIReturn, ABIStructType, Arc56Contract, getStructValueFromTupleValue } from '@algorandfoundation/algokit-utils/abi'
import { OnApplicationComplete, TransactionSigner, Transaction } from '@algorandfoundation/algokit-utils/transact'
import { SimulateResponse  } from '@algorandfoundation/algokit-utils/algod-client'
import { Address, encodeAddress  } from '@algorandfoundation/algokit-utils'
import { AppClientMethodCallParams, AppClientCompilationParams, AppClientDeployParams, CallOnComplete, AppClient as _AppClient, AppClientParams, ResolveAppClientByCreatorAndName, ResolveAppClientByNetwork, AppClientBareCallParams, CloneAppClientParams  } from '@algorandfoundation/algokit-utils/app-client'
import { SendParams,SendTransactionComposerResults  } from '@algorandfoundation/algokit-utils/transaction'
import { AppFactoryCreateMethodCallParams, AppFactoryAppClientParams, AppFactoryDeployParams, AppFactoryParams, AppFactory as _AppFactory, AppFactoryResolveAppClientByCreatorAndNameParams, CreateSchema  } from '@algorandfoundation/algokit-utils/app-factory'
import { TransactionComposer, TransactionComposerConfig, SkipSignaturesSimulateOptions, RawSimulateOptions, SimulateOptions, AppMethodCallTransactionArgument } from '@algorandfoundation/algokit-utils/composer'
  `
}
