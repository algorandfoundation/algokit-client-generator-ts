import { describe, it, expect } from 'vitest'
import { createAppClientContext } from '../client/app-client-context'
import { getSanitizer } from '../util/sanitization'
import { Arc56Contract } from '@algorandfoundation/algokit-utils/abi'

describe('createAppClientContext', () => {
  const sanitizer = getSanitizer({ preserveNames: false, mode: 'full' })

  it('should correctly map keyType and valueType for storage keys', () => {
    const appSpec: Arc56Contract = {
      name: 'TestApp',
      desc: '',
      methods: [],
      arcs: [56],
      structs: {},
      state: {
        schema: {
          global: { bytes: 0, ints: 0 },
          local: { bytes: 0, ints: 0 },
        },
        keys: {
          global: {},
          local: {},
          box: {
            testKey: {
              key: 'dGVzdEtleQ==',
              keyType: 'string',
              valueType: 'uint64',
            },
          },
        },
        maps: {
          global: {},
          local: {},
          box: {},
        },
      },
      bareActions: {
        create: [],
        call: [],
      },
    }

    const ctx = createAppClientContext(appSpec, sanitizer)

    const boxKey = ctx.state.keys.box.testKey
    expect(boxKey.keyType.tsInType).toBe('string')
    expect(boxKey.valueType.tsInType).toBe('bigint | number')
  })
})
