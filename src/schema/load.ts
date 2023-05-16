import * as fs from 'fs'
import { Schema, Validator } from 'jsonschema'
import { boom } from '../util/boom'
import { AlgoAppSpec } from './application'
import appJsonSchema from './application.schema.json'
import contractSchema from './contract.schema.json'

export function load(appJsonPath: string) {
  if (!fs.existsSync(appJsonPath)) boom(`Could not find application.json file at ${appJsonPath}`)
  const validator = new Validator()
  validator.addSchema(contractSchema, '/contract.schema.json')

  const file = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'))
  const result = validator.validate(file, appJsonSchema as unknown as Schema)

  if (!result.valid) boom(result.toString())

  return file as AlgoAppSpec
}
