export const boom = (reason: string): never => {
  throw new Error(reason)
}
