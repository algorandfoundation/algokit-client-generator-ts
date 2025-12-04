import { AppClientMethodContext } from '../app-client-context'

export const containsNonVoidMethod = (methods: AppClientMethodContext[]) => {
  return methods.some((method) => {
    return !method.isBare && method.returns.tsOutType !== 'void'
  })
}
