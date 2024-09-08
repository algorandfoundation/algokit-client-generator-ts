import { Schema, Validator } from 'jsonschema'
import { boom } from '../util/boom'
import arc32Schema from './application.schema.json' with { type: 'json' }
import arc56Schema from './arc56.schema.json' with { type: 'json' }
import contractSchema from './contract.schema.json' with { type: 'json' }
import { Arc56Contract } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { AppSpec, arc32ToArc56 } from '@algorandfoundation/algokit-utils/types/app-spec'

export async function loadApplicationJson(appJsonPath: string): Promise<Arc56Contract> {
  const fs = await import('fs')
  if (!fs.existsSync(appJsonPath)) boom(`Could not find application.json file at ${appJsonPath}`)

  const file = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'))
  return validateApplicationJson(file, appJsonPath)
}

export function validateApplicationJson(json: unknown, appJsonPath: string): Arc56Contract {
  const arc32Validator = new Validator()
  arc32Validator.addSchema(contractSchema, '/contract.schema.json')
  const arc32Result = arc32Validator.validate(json, arc32Schema as unknown as Schema)

  const arc56Validator = new Validator()
  const arc56Result = arc56Validator.validate(json, arc56Schema as unknown as Schema)

  if (!arc32Result.valid && !arc56Result.valid) boom(`Could not parse ${appJsonPath} as ARC-32 or ARC-56. ${arc32Result}. ${arc56Result}`)

  if (!arc56Result.valid) return arc32ToArc56(json as AppSpec)

  return json as Arc56Contract
}
