import { createServer } from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformFileAsync } from '@babel/core'
import { build } from 'esbuild'
import { chromium } from 'playwright-core'
import { compile } from 'svelte/compiler'

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(dir, '..')
const out = path.join(dir, '.dist')
const arg = args(process.argv.slice(2))
const port = +arg.port || 7357
const mode = arg.ajo ? 'ajo' : arg.quick ? 'quick' : 'full'
const presets = {
	ajo: ['ajo', 'create,update,swap,clear', 1, 0],
	quick: ['ajo,vanilla,solid,inferno,svelte,mikado', 'create,update,select,swap,remove,clear', 1, 0],
	full: ['ajo,vanilla,solid,inferno,svelte,mikado,preact,react', 'create,replace,runlots,add,update,select,swap,remove,clear', 7, 2],
}
const [fw, op, n, w] = presets[mode]
const ids = list(arg.frameworks ?? fw)
const ops = list(arg.ops ?? op)
const samples = num(arg.samples, n)
const warmups = num(arg.warmups, w)
const timeout = num(arg.timeout, mode == 'ajo' ? 5000 : 20000)

const subjects = {
	ajo: ['ajo.jsx', { jsx: 'ajo' }],
	vanilla: ['vanilla.js'],
	solid: ['solid.jsx', { solid: true }],
	inferno: ['inferno.jsx', { factory: 'createElement' }],
	svelte: ['svelte.js', { svelte: true }],
	mikado: ['mikado.js'],
	preact: ['preact.jsx', { jsx: 'preact' }],
	react: ['react.jsx', { jsx: 'react' }],
	lit: ['lit.js'],
}
const actions = {
	create: ['clear', '#run', 1000],
	replace: ['run', '#run', 1000],
	runlots: ['clear', '#runlots', 10000],
	add: ['runlots', '#add', 11000],
	update: ['runlots', '#update', 10000],
	select: ['run', 'tbody tr:nth-child(500) td:nth-child(2) a', 1000, 1],
	swap: ['run', '#swaprows', 1000],
	remove: ['run', 'tbody tr:nth-child(500) td:nth-child(3) a', 999],
	clear: ['runlots', '#clear', 0],
}
const svelte = {
	name: 'svelte',
	setup: build => build.onLoad({ filter: /\.svelte$/ }, async ({ path: file }) => ({
		contents: compile(await fs.readFile(file, 'utf8'), { filename: file, generate: 'client', dev: false }).js.code,
		loader: 'js',
		resolveDir: path.dirname(file),
	})),
}
const ajo = {
	name: 'ajo',
	setup: build => build.onResolve({ filter: /^ajo\/jsx-runtime$/ }, () => ({ path: path.join(root, 'jsx.js') })),
}
const ready = ids.map(id => [id, subjects[id]]).map(([id, value]) => {
	if (!value) throw Error(`Unknown framework ${id}`)
	const [entry, options = {}] = value

	return { id, entry, ...options }
})

await fs.mkdir(out, { recursive: true })
await Promise.all(ready.map(bundle))

const server = await serve()
const browser = await chromium.launch(launch())

try {
	const results = []

	for (const subject of ready) results.push(await bench(browser, subject))

	report(results)
	if (arg.save || mode == 'full') await save(results)
} finally {
	await browser.close()
	await new Promise(resolve => server.close(resolve))
}

async function bundle(subject) {
	const entry = path.join(dir, 'subjects', subject.entry)
	let input = { entryPoints: [entry] }

	if (subject.solid) {
		const { code } = await transformFileAsync(entry, { presets: [['babel-preset-solid', { generate: 'dom' }]] })
		input = { stdin: { contents: code, resolveDir: path.dirname(entry), sourcefile: entry, loader: 'js' } }
	}

	await build({
		...input,
		outfile: path.join(out, `${subject.id}.js`),
		bundle: true,
		format: 'esm',
		minify: true,
		treeShaking: true,
		plugins: [ajo, subject.svelte && svelte].filter(Boolean),
		jsx: subject.jsx ? 'automatic' : subject.factory ? 'transform' : undefined,
		jsxFactory: subject.factory,
		jsxImportSource: subject.jsx,
		tsconfigRaw: { compilerOptions: subject.jsx ? { jsx: 'react-jsx', jsxImportSource: subject.jsx } : subject.factory ? { jsx: 'react' } : {} },
		logLevel: 'silent',
	})
}

async function bench(browser, subject) {
	const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
	const errors = []
	const values = {}

	page.on('pageerror', error => errors.push(error.message))
	page.on('console', message => message.type() == 'error' && errors.push(message.text()))
	await page.goto(`http://127.0.0.1:${port}/${subject.id}`, { waitUntil: 'domcontentloaded' })
	await page.waitForSelector('#run')

	for (const id of ops) {
		const action = actions[id]
		const row = []

		if (!action) throw Error(`Unknown op ${id}`)

		for (let i = 0; i < warmups + samples; i++) {
			await setup(page, action[0])
			const value = await click(page, action[1], action[2], action[3])
			if (i >= warmups) row.push(value)
		}

		values[id] = row
	}

	await page.close()

	return { id: subject.id, errors, values }
}

async function setup(page, name) {
	if (name == 'clear') await click(page, '#clear', 0)
	else if (name == 'run') await click(page, '#run', 1000)
	else if (name == 'runlots') await click(page, '#runlots', 10000)
}

function click(page, selector, rows, selected = 0) {
	return page.evaluate(async ([selector, rows, selected, timeout]) => {
		const frame = () => new Promise(requestAnimationFrame)
		const text = selector => document.querySelector(selector)?.textContent
		const count = selector => document.querySelectorAll(selector).length
		const el = document.querySelector(selector)
		const before = {
			rows: count('tbody tr'),
			first: text('tbody tr:first-child td:first-child'),
			label: text('tbody tr:first-child td:nth-child(2)'),
			second: text('tbody tr:nth-child(2) td:first-child'),
		}
		const changed = () => {
			if (selector == '#run' || selector == '#runlots') return before.rows != rows || text('tbody tr:first-child td:first-child') != before.first
			if (selector == '#update') return text('tbody tr:first-child td:nth-child(2)') != before.label
			if (selector == '#swaprows') return text('tbody tr:nth-child(2) td:first-child') != before.second
			return true
		}
		const done = () => count('tbody tr') == rows && (!selected || count('tr.danger') == selected) && changed()

		if (!el) throw Error(`Missing ${selector}`)

		await frame()
		const start = performance.now()
		el.click()

		while (!done()) {
			if (performance.now() - start > timeout) throw Error(`Timeout ${selector}`)
			await frame()
		}

		await frame()
		return performance.now() - start
	}, [selector, rows, selected, timeout])
}

function serve() {
	const server = createServer(async (request, response) => {
		const url = new URL(request.url, `http://${request.headers.host}`)
		const asset = url.pathname == '/style.css' ? path.join(dir, 'style.css') : url.pathname.startsWith('/assets/') && safe(out, url.pathname.slice(8))
		const subject = ready.find(subject => url.pathname == `/${subject.id}`)

		if (asset) return send(response, asset)
		if (subject) return end(response, 200, 'text/html', page(subject))
		end(response, url.pathname == '/favicon.ico' ? 204 : 404, 'text/plain', '')
	})

	return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)))
}

function page(subject) {
	return `<!doctype html><meta charset="utf-8"><link href="/style.css" rel="stylesheet"><div id="main"></div><script type="module" src="/assets/${subject.id}.js"></script>`
}

async function send(response, file) {
	try {
		end(response, 200, file.endsWith('.css') ? 'text/css' : 'text/javascript', await fs.readFile(file))
	} catch {
		end(response, 404, 'text/plain', '')
	}
}

function safe(base, file) {
	file = path.resolve(base, file)

	return path.relative(base, file).startsWith('..') ? null : file
}

function report(results) {
	for (const result of results) result.median = Object.fromEntries(ops.map(id => [id, median(result.values[id])]))
	for (const result of results) result.score = score(result, results)

	console.log(['framework', 'score', ...ops].join('\t'))
	for (const result of results.sort((a, b) => a.score - b.score)) console.log([result.id, result.score.toFixed(2), ...ops.map(id => fmt(result.median[id]))].join('\t'))
	for (const result of results) for (const error of result.errors) console.warn(`${result.id}: ${error}`)
}

async function save(results) {
	const dir = path.join(root, 'bench', 'results')
	const file = path.join(dir, new Date().toISOString().replace(/[:.]/g, '-'))
	const body = md(results)

	await fs.mkdir(dir, { recursive: true })
	await fs.writeFile(`${file}.json`, JSON.stringify({ samples, warmups, ops, results }, null, 2))
	await fs.writeFile(`${file}.md`, body)
	await fs.writeFile(path.join(dir, 'latest.md'), body)
	console.log(`wrote ${path.relative(root, file)}.md`)
}

function md(results) {
	const cols = ['framework', 'score', ...ops]
	const line = row => `| ${row.join(' | ')} |`
	const align = line(cols.map((_, i) => i ? '---:' : '---'))
	const rows = results.map(row => line([row.id, row.score.toFixed(2), ...ops.map(id => fmt(row.median[id]))]))
	const errors = results.flatMap(row => row.errors.map(error => `- ${row.id}: ${String(error).replace(/\|/g, '\\|')}`))

	return [
		'# Ajo Benchmark',
		'',
		`- mode: ${mode}`,
		`- samples: ${samples}`,
		`- warmups: ${warmups}`,
		`- operations: ${ops.join(', ')}`,
		'',
		line(cols),
		align,
		...rows,
		errors.length ? '\n## Errors\n' : '',
		...errors,
		'',
	].join('\n')
}

function score(row, rows) {
	return Math.exp(ops.reduce((sum, id) => {
		const best = Math.max(.01, Math.min(...rows.map(row => row.median[id]).filter(Number.isFinite)))

		return sum + Math.log(Math.max(.01, row.median[id]) / best)
	}, 0) / ops.length)
}

function median(values) {
	if (!values?.length) return NaN
	values = values.toSorted((a, b) => a - b)

	return values.length % 2 ? values[values.length >> 1] : (values[values.length / 2 - 1] + values[values.length / 2]) / 2
}

function fmt(value) {
	return Number.isFinite(value) ? value.toFixed(2) : '-'
}

function launch() {
	if (process.env.PLAYWRIGHT_EXECUTABLE) return { executablePath: process.env.PLAYWRIGHT_EXECUTABLE }
	if (process.env.PLAYWRIGHT_CHANNEL === 'bundled') return {}
	return { channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome' }
}

function end(response, code, type, body) {
	response.writeHead(code, type && { 'content-type': type })
	response.end(body)
}

function list(value) {
	return String(value).split(/[,\s]+/).filter(Boolean)
}

function num(value, fallback) {
	return value == null ? fallback : Number(value)
}

function args(values) {
	const out = {}

	for (let i = 0; i < values.length; i++) if (values[i].startsWith('--')) {
		const [key, value] = values[i].slice(2).split('=')
		out[key] = value ?? (values[i + 1]?.startsWith('--') || values[i + 1] == null ? true : values[++i])
	}

	return out
}
