import * as prettier from 'prettier'

export async function formatFile({ fileSource, filePath }: { fileSource: string; filePath: string }) {
  const config = (await prettier.resolveConfig(filePath)) ?? {}
  return await prettier.format(fileSource, {
    ...config,
    parser: 'babel-ts',
  })
}
