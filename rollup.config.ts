import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
import type { RollupOptions } from 'rollup'
import pkg from './package.json' with { type: 'json' }
const config: RollupOptions = {
  input: ['src/index.ts', 'src/cli.ts'],
  output: [
    {
      dir: 'dist',
      format: 'cjs',
      entryFileNames: '[name].js',
      exports: 'named',
      preserveModules: true,
      sourcemap: true,
    },
    {
      dir: 'dist',
      format: 'es',
      exports: 'named',
      entryFileNames: '[name].mjs',
      preserveModules: true,
      sourcemap: true,
    },
  ],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
  },
  external: (id) => {
    const externalPackages = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)]
    return externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`))
  },
  plugins: [
    typescript({
      tsconfig: 'tsconfig.build.json',
    }),
    nodeResolve(),
    json(),
  ],
}

export default config
