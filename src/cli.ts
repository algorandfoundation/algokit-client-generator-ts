import { Command, Option } from 'commander'
import { loadApplicationJson } from './schema/load'
import * as path from 'path'
import { generate } from './client/generate'
import { writeDocumentPartsToStream } from './output/writer'
import { colorConsole } from './util/color-console'
import { IdentifierNaming } from './util/sanitization'

export function cli(workingDirectory: string, args: string[]) {
  const program = new Command()
  program
    .command('generate')
    .description('Generates a TypeScript client for the given application.json file')
    .requiredOption('-a --application <path>', 'Specifies the application.json file')
    .requiredOption('-o --output <path>', 'Specifies the output file path')
    .addOption(
      new Option(
        '-in --identifier-names <name>',
        'Specifies a strategy for sanitizing identifier names read from the application.json' + ' spec.',
      )
        .choices([IdentifierNaming.JavaScript, IdentifierNaming.Preserve, IdentifierNaming.Legacy])
        .default('js'),
    )
    .action(
      async ({
        application,
        output,
        identifierNames,
      }: {
        application: string
        output: string
        identifierNames: IdentifierNaming
      }): Promise<void> => {
        const fs = await import('fs')
        const resolvedAppJsonPath = path.resolve(workingDirectory, application)
        const resolvedOutPath = path.resolve(workingDirectory, output)
        const resolvedOutDir = path.dirname(resolvedOutPath)
        colorConsole.info`Reading application.json file from path ${resolvedAppJsonPath}`
        const spec = await loadApplicationJson(resolvedAppJsonPath)
        colorConsole.info`Generating TS client for ${spec.contract.name}`
        const parts = generate(spec, { identifierNames: identifierNames })
        if (!fs.existsSync(resolvedOutDir)) {
          colorConsole.warn`Output directory ${resolvedOutDir} does not exist and will be created.`
          fs.mkdirSync(resolvedOutDir, { recursive: true })
        }
        colorConsole.info`Writing TS client to ${resolvedOutPath}`
        const file = fs.createWriteStream(resolvedOutPath, {
          flags: 'w',
        })
        writeDocumentPartsToStream(parts, file)
        colorConsole.success`Operation completed successfully`
      },
    )
    .configureOutput({
      writeErr(str: string) {
        colorConsole.error`${str}`
      },
    })
  try {
    program.parse(args)
  } catch (err) {
    if (err instanceof Error) {
      colorConsole.error`Unhandled error: \n\n${err.stack}`
    } else {
      colorConsole.error`Unhandled error: \n\n${err}`
    }
    process.exit(-1)
  }
}
