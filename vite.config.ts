/// <reference types="vitest/config" />
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { resolve } from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	plugins: [
		tsconfigPaths()
	],
	test: {
		environment: 'happy-dom',
	},
	resolve: {
		alias: [
			{ find: 'ajo/jsx-dev-runtime', replacement: resolve(__dirname, 'jsx.js') },
			{ find: 'ajo/jsx-runtime', replacement: resolve(__dirname, 'jsx.js') },
			{ find: 'ajo/context', replacement: resolve(__dirname, 'context.js') },
			{ find: 'ajo/html', replacement: resolve(__dirname, 'html.js') },
			{ find: 'ajo', replacement: resolve(__dirname, 'index.js') },
		],
	},
	esbuild: {
		jsx: 'automatic',
		jsxImportSource: 'ajo',
	},
	build: {
		lib: {
			entry: [
				resolve(__dirname, 'jsx.js'),
				resolve(__dirname, 'context.js'),
				resolve(__dirname, 'html.js'),
				resolve(__dirname, 'index.js'),
			],
		},
	},
})
