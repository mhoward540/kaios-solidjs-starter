import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import babel from 'rollup-plugin-babel';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';

const production = !process.env.ROLLUP_WATCH;

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
        stdio: ['ignore', 'inherit', 'inherit'],
        shell: true,
      });

      process.on('SIGTERM', toExit);
      process.on('exit', toExit);
    },
  };
}

export default {
  input: 'src/index.tsx',
  output: {
    sourcemap: !production,
    format: 'iife',
    name: 'app',
    file: 'public/build/bundle.js',
  },
  context: 'window',
  plugins: [
    postcss({
      sourceMap: true,
      extract: 'bundle.css',
      minimize: true,
    }),
    babel({
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.html'],
      runtimeHelpers: true,
      exclude: ['node_modules/@babel/**'],
      presets: [
        'solid',
        [
          '@babel/preset-env',
          {
            targets: { firefox: '48' },
            exclude: ['@babel/plugin-transform-regenerator'],
          },
        ],
      ],
      plugins: [
        '@babel/plugin-syntax-dynamic-import',
        ["babel-plugin-transform-async-to-promises", { externalHelpers: true }],
        [
          '@babel/plugin-transform-runtime',
          {
            useESModules: true,
            regenerator: false,
          },
        ],
      ],
    }),

    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': !production ? "'development'" : "'production'",
    }),

    json(),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true
    }),
    commonjs(),
    typescript({
      sourceMap: !production,
      inlineSources: !production,
    }),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload('public'),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
