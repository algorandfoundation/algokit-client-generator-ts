import * as fs from 'fs'
import * as path from 'path'
import { colorConsole } from '../src/util/color-console'

function updateApprovals() {
  const dirs = [
    'helloworld',
    'lifecycle',
    'minimal',
    'state',
    'voting',
    'duplicate_structs',
    'minimal',
    'reti1',
    'reti2',
    'arc56_test',
  ].map((app) => path.join(process.cwd(), 'examples', app))

  for (const exampleDir of dirs) {
    const generatedPath = exampleDir.includes('reti1')
      ? path.join(exampleDir.substring(0, exampleDir.length - 1), 'validator.client.generated.ts')
      : exampleDir.includes('reti2')
        ? path.join(exampleDir.substring(0, exampleDir.length - 1), 'staking.client.generated.ts')
        : path.join(exampleDir, 'client.generated.ts')
    const approvedPath = exampleDir.includes('reti1')
      ? path.join(exampleDir.substring(0, exampleDir.length - 1), 'validator.client.ts')
      : exampleDir.includes('reti2')
        ? path.join(exampleDir.substring(0, exampleDir.length - 1), 'staking.client.ts')
        : path.join(exampleDir, 'client.ts')

    if (!fs.existsSync(generatedPath)) {
      colorConsole.error`Need to run ${'npm run dev'} task first to generate latest clients. Could not find file ${generatedPath}`
      process.exit(-1)
    }
    colorConsole.info`Overwriting ${approvedPath} with contents of ${generatedPath}`
    fs.rmSync(approvedPath, { force: true })
    const generated = fs.readFileSync(generatedPath, 'utf-8')
    fs.writeFileSync(approvedPath, generated, 'utf-8')
  }
  colorConsole.success`Operation completed successfully`
}

updateApprovals()
