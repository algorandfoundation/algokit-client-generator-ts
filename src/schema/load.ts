import { Schema, Validator } from 'jsonschema'
import { boom } from '../util/boom'
import arc32Schema from './application.schema.json' with { type: 'json' }
import arc56Schema from './arc56.schema.json' with { type: 'json' }
import contractSchema from './contract.schema.json' with { type: 'json' }
import { Arc56Contract } from '@algorandfoundation/algokit-utils/abi'
import { AppSpec, arc32ToArc56 } from '@algorandfoundation/algokit-utils/types/app-spec'

export async function loadApplicationJson(appJsonPath: string): Promise<Arc56Contract> {
  const fs = await import('fs')
  if (!fs.existsSync(appJsonPath)) boom(`Could not find application.json file at ${appJsonPath}`)

  let jsonText = fs.readFileSync(appJsonPath, 'utf-8')
  let file = JSON.parse(jsonText)
  // Temporary to get backwards compatibility with TEALScript draft ARC-56
  if (!('contract' in file) /* ARC-56 */) {
    jsonText = jsonText.replace(/ype":\s*"bytes"/g, 'ype":"AVMBytes"').replace(/import\(.+?\)\./g, '')
    file = JSON.parse(jsonText)
  }

  return validateApplicationJson(file, appJsonPath)
}

export function validateApplicationJson(json: unknown, appJsonPath: string): Arc56Contract {
  if (typeof json !== 'object') boom(`Could not parse ${appJsonPath} as JSON object`)

  /* eslint-disable @typescript-eslint/no-explicit-any */
  if ('contract' in (json as any)) {
    // ARC-32
    const arc32Validator = new Validator()
    arc32Validator.addSchema(contractSchema, '/contract.schema.json')
    const arc32Result = arc32Validator.validate(json, arc32Schema as unknown as Schema)
    if (!arc32Result.valid) boom(`Could not parse ${appJsonPath} as ARC-32.\n${arc32Result}`)
    return arc32ToArc56(json as AppSpec)
  }
  // ARC-56
  const arc56Validator = new Validator()
  const arc56Result = arc56Validator.validate(json, arc56Schema as unknown as Schema)
  if (!arc56Result.valid) boom(`Could not parse ${appJsonPath} as ARC-56.\n${arc56Result}`)
  return json as Arc56Contract
}
