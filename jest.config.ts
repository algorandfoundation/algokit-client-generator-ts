/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */
import type { Config } from 'jest'

const config: Config = {
  verbose: true,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
}
export default config
