import { Command } from 'commander'
import { loadApplicationJson } from './schema/load'
import * as path from 'path'
import { generate } from './client/generate'
import { writeDocumentPartsToStream } from './output/writer'
import { colorConsole } from './util/color-console'

export function cli(workingDirectory: string, args: string[]) {
  const program = new Command()
  program
    .command('generate')
    .description('Generates a TypeScript client for the given application.json file')
    .requiredOption('-a --application <path>', 'Specifies the application.json file')
    .requiredOption('-o --output <path>', 'Specifies the output file path')
    .option('-pn --preserve-names', 'Preserve names from application.json spec instead of sanitizing them')
    .action(
      async ({ application, output, preserveNames }: { application: string; output: string; preserveNames?: boolean }): Promise<void> => {
        const fs = await import('fs')
        const resolvedAppJsonPath = path.resolve(workingDirectory, application)
        const resolvedOutPath = path.resolve(workingDirectory, output)
        const resolvedOutDir = path.dirname(resolvedOutPath)
        colorConsole.info`Reading application.json file from path ${resolvedAppJsonPath}`
        const spec = await loadApplicationJson(resolvedAppJsonPath)
        colorConsole.info`Generating TS client for ${spec.contract.name}`
        const parts = generate(spec, { preserveNames: Boolean(preserveNames) })
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
