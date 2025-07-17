import { generateClientCommand } from '../src/cli'
import { colorConsole } from '../src/util/color-console'
import * as path from 'path'

// Generate all the client variants for a given app spec
async function generateClients(applicationPath: string) {
  const workingDirectory = process.cwd()

  // Resolve the application path and determine output directory
  const resolvedAppPath = path.resolve(workingDirectory, applicationPath)
  const appDir = path.dirname(resolvedAppPath)
  const outputDir = appDir

  colorConsole.info`Generating clients for ${applicationPath}`

  // Generate standard client
  await generateClientCommand({
    application: applicationPath,
    output: path.join(outputDir, 'client.generated.ts'),
    preserveNames: false,
    slim: false,
    workingDirectory,
  })

  // Generate preserve names client
  await generateClientCommand({
    application: applicationPath,
    output: path.join(outputDir, 'client.generated.pn.ts'),
    preserveNames: true,
    slim: false,
    workingDirectory,
  })

  // Generate slim client
  await generateClientCommand({
    application: applicationPath,
    output: path.join(outputDir, 'client.generated.slim.ts'),
    preserveNames: false,
    slim: true,
    workingDirectory,
  })

  // Generate preserve names slim client
  await generateClientCommand({
    application: applicationPath,
    output: path.join(outputDir, 'client.generated.pn.slim.ts'),
    preserveNames: true,
    slim: true,
    workingDirectory,
  })

  colorConsole.success`Clients generated successfully in ${outputDir}`
}

const args = process.argv.slice(2)
if (args.length === 0) {
  colorConsole.error`Error: Application file is required. Usage: tsx scripts/generate-clients.ts <path-to-application.json>`
  process.exit(1)
}

const appSpecPath = args[0]
generateClients(appSpecPath).catch((err) => {
  colorConsole.error`${err}`
  process.exit(-1)
})
