import { DocumentParts } from '../output/writer'

export function* imports(): DocumentParts {
  yield `
    import { ABIReturn, AppReturn, SendAppTransactionResult } from '@algorandfoundation/algokit-utils/types/app'
    import { Arc56Contract, getArc56ReturnValue } from '@algorandfoundation/algokit-utils/types/app-arc56'
    import {
      AppClient,
      AppClientMethodCallParams,
      AppClientParams,
      AppClientBareCallParams,
      CallOnComplete,
      AppClientCompilationParams,
      ResolveAppClientByCreatorAndName,
    } from '@algorandfoundation/algokit-utils/types/app-client'
    import { AppFactory, AppFactoryDeployParams, AppFactoryParams, CreateSchema } from '@algorandfoundation/algokit-utils/types/app-factory'
    import { AppCallMethodCall, AppMethodCallTransactionArgument } from '@algorandfoundation/algokit-utils/types/composer'
    import { ExecuteParams, SendSingleTransactionResult } from '@algorandfoundation/algokit-utils/types/transaction'
    import { OnApplicationComplete } from 'algosdk'
  `
}
