import { Schema, Validator } from 'jsonschema'
import { boom } from '../util/boom'
import { AlgoAppSpec } from './application'
import appJsonSchema from './application.schema.json' with { type: 'json' }
import contractSchema from './contract.schema.json' with { type: 'json' }

export async function loadApplicationJson(appJsonPath: string): Promise<AlgoAppSpec> {
  const fs = await import('fs')
  if (!fs.existsSync(appJsonPath)) boom(`Could not find application.json file at ${appJsonPath}`)

  const file = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'))
  return validateApplicationJson(file)
}

export function validateApplicationJson(json: unknown): AlgoAppSpec {
  const validator = new Validator()
  validator.addSchema(contractSchema, '/contract.schema.json')

  const result = validator.validate(json, appJsonSchema as unknown as Schema)

  if (!result.valid) boom(result.toString())

  return json as AlgoAppSpec
}
