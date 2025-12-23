import { AppClientMethodContext, isAbiMethod } from '../app-client-context'

export const containsNonVoidMethod = (methods: AppClientMethodContext[]) => {
  return methods.some((method) => {
    return isAbiMethod(method) && method.returns.tsOutType !== 'void'
  })
}
