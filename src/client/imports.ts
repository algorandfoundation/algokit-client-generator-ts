import { DocumentParts } from '../output/writer'
import { GeneratorContext } from './generator-context'

export function* imports(ctx: GeneratorContext): DocumentParts {
  yield `
import { type AlgorandClient } from '@algorandfoundation/algokit-utils/types/algorand-client'
import { ABIReturn, Arc56Contract  } from '@algorandfoundation/algokit-utils/abi'
import { OnApplicationComplete, TransactionSigner, Transaction   } from '@algorandfoundation/algokit-utils/transact'
import { SimulateResponse  } from '@algorandfoundation/algokit-utils/algod-client'
import { Address, encodeAddress  } from '@algorandfoundation/algokit-utils'
import { AppClientMethodCallParams, AppClientCompilationParams, AppClientDeployParams, CallOnComplete, AppClient as _AppClient, AppClientParams, ResolveAppClientByCreatorAndName, ResolveAppClientByNetwork, AppClientBareCallParams, CloneAppClientParams  } from '@algorandfoundation/algokit-utils/types/app-client'
import { SendParams,SendTransactionComposerResults  } from '@algorandfoundation/algokit-utils/types/transaction'
import { AppFactoryCreateMethodCallParams, AppFactoryAppClientParams, AppFactoryDeployParams, AppFactoryParams, AppFactory as _AppFactory, AppFactoryResolveAppClientByCreatorAndNameParams, CreateSchema  } from '@algorandfoundation/algokit-utils/types/app-factory'
import { TransactionComposer, SkipSignaturesSimulateOptions, RawSimulateOptions, SimulateOptions, AppMethodCallTransactionArgument } from '@algorandfoundation/algokit-utils/types/composer'
  `
}
