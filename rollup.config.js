import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import pkg from './package.json';

const external = [...Object.keys(pkg.dependencies || {})];

const plugins = [
  json(),
  resolve(),
  commonjs(),
  typescript({
    tsconfig: 'tsconfig.build.json',
    useTsconfigDeclarationDir: false,
  }),
];

export default [
  {
    input: './src/index.ts',
    output: [
      {
        file: `dist/${pkg.main}`,
        format: 'cjs',
        sourcemap: false,
      },
    ],
    plugins,
    external,
  },
];
