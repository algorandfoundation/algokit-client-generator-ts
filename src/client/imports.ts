import { DocumentParts } from '../output/writer'

export function* imports(): DocumentParts {
  yield `
    import { AppReturn, SendAppTransactionResult } from '@algorandfoundation/algokit-utils/types/app'
    import { Arc56Contract } from '@algorandfoundation/algokit-utils/types/app-arc56'
    import {
      AppClient,
      AppClientMethodCallParams,
      AppClientParams,
      AppClientBareCallParams,
      CallOnComplete,
      AppClientCompilationParams,
    } from '@algorandfoundation/algokit-utils/types/app-client'
    import { AppFactory, AppFactoryDeployParams } from '@algorandfoundation/algokit-utils/types/app-factory'
    import { AppCallMethodCall, AppMethodCallTransactionArgument } from '@algorandfoundation/algokit-utils/types/composer'
    import { ExecuteParams, SendSingleTransactionResult } from '@algorandfoundation/algokit-utils/types/transaction'
    import { OnApplicationComplete } from 'algosdk'
  `
}
