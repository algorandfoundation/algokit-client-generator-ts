import * as path from 'path'
import { colorConsole } from '../src/util/color-console'
import { generateClientCommand } from '../src/cli'

async function updateApprovals() {
  const examples = ['helloworld', 'lifecycle', 'minimal', 'state', 'voting', 'duplicate_structs', 'minimal', 'reti', 'arc56_test']

  const dirs = examples.map((app) => path.join(process.cwd(), 'examples', app))

  for (const exampleDir of dirs) {
    const applicationJsonPath = path.join(exampleDir, 'application.json')
    const approvedPath = path.join(exampleDir, 'client.ts')

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
