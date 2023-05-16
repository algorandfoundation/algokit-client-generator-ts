import { Command } from 'commander'
import { load } from './schema/load'
import * as path from 'path'
import { generate } from './client/generate'
import { writeDocumentPartsToStream } from './output/writer'
import fs from 'fs'
import { colorConsole } from './util/color-console'

export function cli(workingDirectory: string, args: string[]) {
  const program = new Command()
  program
    .command('generate')
    .description('Generates a TypeScript client for the given application.json file')
    .requiredOption('-a --application <path>', 'Specifies the application.json file')
    .requiredOption('-o --output <path>', 'Specifies the output file path')
    .action(({ application, output }: { application: string; output: string }): void => {
      const resolvedAppJsonPath = path.resolve(workingDirectory, application)
      const resolvedOutPath = path.resolve(workingDirectory, output)
      const resolvedOutDir = path.dirname(resolvedOutPath)
      colorConsole.info`Reading application.json file from path ${resolvedAppJsonPath}`
      const spec = load(resolvedAppJsonPath)
      colorConsole.info`Generating TS client for ${spec.contract.name}`
      const parts = generate(spec)
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
    })
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
