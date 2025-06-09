import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { resolve } from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    tsconfigPaths()
  ],
  test: {
    environment: 'happy-dom',
  },
  resolve: {
    alias: [
      { find: 'ajo/context', replacement: resolve(__dirname, 'context.js') },
      { find: 'ajo/stream', replacement: resolve(__dirname, 'stream.js') },
      { find: 'ajo/html', replacement: resolve(__dirname, 'html.js') },
      { find: 'ajo', replacement: resolve(__dirname, 'index.js') },
    ],
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: `import { h, Fragment } from 'ajo'`,
  },
  build: {
    lib: {
      entry: [
        resolve(__dirname, 'context.js'),
        resolve(__dirname, 'stream.js'),
        resolve(__dirname, 'html.js'),
        resolve(__dirname, 'index.js'),
      ],
    },
  },
})
