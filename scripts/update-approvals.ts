import * as path from 'path'
import { colorConsole } from '../src/util/color-console'
import { generateClientCommand } from '../src/cli'
import { pascalCase } from 'change-case'

async function updateApprovals() {
  const arc32Examples = ['duplicate_structs', 'hello_world', 'life_cycle', 'minimal', 'state', 'voting_round']
  const arc56Examples = ['reti', 'arc56_test', 'nested', 'nfd', 'structs', 'zero_coupon_bond']

  const arc32Dirs = arc32Examples.map((app) => [app, 'arc32'])
  const arc56Dirs = arc56Examples.map((app) => [app, 'arc56'])

  for (const [app, extension] of [...arc32Dirs, ...arc56Dirs]) {
    const dir = path.join(process.cwd(), 'examples/smart_contracts/artifacts', app)
    const applicationJsonPath = path.join(dir, `${pascalCase(app)}.${extension}.json`)
    const approvedPath = path.join(dir, 'client.ts')

    await generateClientCommand({
      workingDirectory: process.cwd(),
      application: applicationJsonPath,
      output: approvedPath,
      preserveNames: false,
    })
    colorConsole.info`----------------------`
  }
  colorConsole.success`Operation completed successfully`
}

updateApprovals().catch((err) => {
  colorConsole.error`${err}`
  process.exit(-1)
})
