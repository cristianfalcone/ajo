/// <reference types="vitest/config" />
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { resolve } from 'path'
import { minify } from 'terser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const terser = (): Plugin => ({
	name: 'terser',
	async generateBundle({ format }, bundle) {
		for (const chunk of Object.values(bundle)) if (chunk.type == 'chunk') {
			chunk.code = (await minify(chunk.code, {
				module: format == 'es',
				compress: { module: format == 'es', passes: 2, toplevel: true },
				mangle: { toplevel: true },
				format: { comments: false, quote_style: 0 },
			})).code!
		}
	},
})

export default defineConfig({
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
	oxc: {
		jsx: {
			importSource: 'ajo',
		},
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
		rolldownOptions: {
			plugins: [terser()],
		},
	},
})
