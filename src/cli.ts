import { Command } from 'commander'
import { loadApplicationJson } from './schema/load'
import * as path from 'path'
import { generate } from './client/generate'
import { writeDocumentPartsToStream } from './output/writer'
import { colorConsole } from './util/color-console'

export function cli(workingDirectory: string, args: string[]) {
  // Pre 13 commander allowed `-pn` however the latest version doesn't. Rewrite it to `--pn` for backwards compatibility.
  const processedArgs = args.map((arg) => (arg === '-pn' ? '--pn' : arg))
  const program = new Command()
  program
    .command('generate')
    .description('Generates a TypeScript client for the given application.json file')
    .requiredOption('-a --application <path>', 'Specifies the application.json file')
    .requiredOption('-o --output <path>', 'Specifies the output file path')
    .option('--pn --preserve-names', 'Preserve names from application.json spec instead of sanitizing them')
    .option('--slim', 'Generate a slim client by stripping non-essential source info from the embedded app spec')
    .allowExcessArguments(true) // Maintains backwards compatibility with pre 13 commanded
    .action(
      async ({
        application,
        output,
        preserveNames,
        slim,
      }: {
        application: string
        output: string
        preserveNames?: boolean
        slim?: boolean
      }): Promise<void> => {
        await generateClientCommand({
          application,
          output,
          preserveNames: Boolean(preserveNames),
          slim: Boolean(slim),
          workingDirectory,
        })
        colorConsole.success`Operation completed successfully`
      },
    )
    .configureOutput({
      writeErr(str: string) {
        colorConsole.error`${str}`
      },
    })
  try {
    program.parse(processedArgs)
  } catch (err) {
    if (err instanceof Error) {
      colorConsole.error`Unhandled error: \n\n${err.stack}`
    } else {
      colorConsole.error`Unhandled error: \n\n${err}`
    }
    process.exit(-1)
  }
}

export async function generateClientCommand({
  application,
  output,
  preserveNames,
  slim,
  workingDirectory,
}: {
  application: string
  output: string
  preserveNames: boolean
  slim: boolean
  workingDirectory: string
}) {
  const fs = await import('fs')

  const resolvedAppJsonPath = path.resolve(workingDirectory, application)
  const resolvedOutPath = path.resolve(workingDirectory, output)
  const resolvedOutDir = path.dirname(resolvedOutPath)
  colorConsole.info`Reading application.json file from path ${resolvedAppJsonPath}`
  const spec = await loadApplicationJson(resolvedAppJsonPath)
  colorConsole.info`Generating TS client for ${spec.name}`
  const parts = generate(spec, { preserveNames, slim })
  if (!fs.existsSync(resolvedOutDir)) {
    colorConsole.warn`Output directory ${resolvedOutDir} does not exist and will be created.`
    fs.mkdirSync(resolvedOutDir, { recursive: true })
  }
  colorConsole.info`Writing TS client to ${resolvedOutPath}`
  const file = await createAwaitableWriteStream(resolvedOutPath)
  writeDocumentPartsToStream(parts, file)
  await file.finish()
}

async function createAwaitableWriteStream(path: string) {
  const fs = await import('fs')
  const stream = fs.createWriteStream(path, {
    flags: 'w',
  })
  const finish = new Promise<void>((resolve, reject) => {
    stream.on('error', (err) => {
      reject(err)
    })
    stream.on('finish', () => {
      resolve()
    })
  })
  return {
    write(chunk: string): void {
      stream.write(chunk)
    },
    finish() {
      stream.end()
      return finish
    },
  }
}
