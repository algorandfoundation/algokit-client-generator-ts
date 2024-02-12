import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import { microAlgos } from '@algorandfoundation/algokit-utils'
import waitOn from 'wait-on'
export const setUpLocalnet = async () => {
  const localnet = algorandFixture({
    testAccountFunding: microAlgos(100_000_000_000),
  })

  /*
     algokit localnet start is currently not waiting for the indexer to start which is leading to test failures, so we'll wait for it here
     until that's patched.
   */

  await waitOn({
    resources: ['tcp:localhost:8980'],
  })

  return localnet
}
