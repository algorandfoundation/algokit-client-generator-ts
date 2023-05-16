import { AlgoAppSpec } from '../../schema/application'

export function getCreateMethods(app: AlgoAppSpec) {
  return app.hints && Object.entries(app.hints).filter(([_, { call_config }]) => call_config?.no_op === 'CREATE')
}
