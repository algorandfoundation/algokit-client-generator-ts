/**
 * Given a method signature (eg. my_method(string,uint)void) will extract the
 * method name (ie. my_method)
 * @param methodSignature An ABI method signature
 */
export function extractMethodNameFromSignature(methodSignature: string): string {
  return methodSignature.split('(')[0]
}
