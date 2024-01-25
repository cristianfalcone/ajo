import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { resolve } from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      'ajo': './index.js',
    },
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: `import { h, Fragment } from 'ajo'`,
  },
  build: {
    lib: {
      entry: [
        resolve(__dirname, 'index.js'),
        resolve(__dirname, 'html.js'),
      ],
    },
  },
})
