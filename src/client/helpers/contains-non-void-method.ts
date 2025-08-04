import { Method } from '@algorandfoundation/algokit-utils/types/app-arc56'

export const containsNonVoidMethod = (methods: Method[]) => {
  return methods.some((method) => {
    const returnType = method.returns.struct ?? method.returns.type ?? 'void'
    return returnType !== 'void'
  })
}
