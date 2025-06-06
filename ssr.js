import { Context, current } from './context.js'

const Args = Symbol.for('ajo.args'), Marker = '\u0001'

const Void = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

const Special = new Set(['key', 'skip', 'memo', 'ref']), Omit = new Set(['nodeName', 'children', ...Special])

const escape = s => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`), noop = () => { }

const run = (gen, args, render) => {

	let self, value, async = false

	try {

		const ctx = Object.assign(Object.create(null), current()?.[Context])

		const it = gen.call(self = {

			*[Symbol.iterator]() { while (true) yield args },

			[Args]: args,

			[Context]: ctx,

			render: noop, queueMicrotask: noop, requestAnimationFrame: noop, effect: noop, cleanup: noop,

			next() {

				const parent = current()

				if (parent === self) return

				current(self)

				let r = render(it.next().value)

				if (r && typeof r[Symbol.asyncIterator] === 'function') r = (async () => {

					let s = '', p = current(), it = r[Symbol.asyncIterator]()

					try { while (true) { current(self); let n; try { n = await it.next() } catch (e) { current(p); return self.throw(e) } current(p); if (n.done) break; s += n.value } }

					finally { current(p) } return s
				})()

				async ||= r instanceof Promise

				value = r

				current(parent)
			},

			throw(err) {

				let r = render(it.throw(err).value)

				if (r && typeof r[Symbol.asyncIterator] === 'function') r = (async () => {

					let s = '', p = current(), it = r[Symbol.asyncIterator]()

					try { while (true) { current(self); let n; try { n = await it.next() } catch (e) { current(p); return self.throw(e) } current(p); if (n.done) break; s += n.value } }

					finally { current(p) } return s
				})()

				async ||= r instanceof Promise

				value = r
			},

			return() {
				it.return()
			}

		}, args)

		self.next()

	} catch (value) {

		self.throw(value)

	} finally {

		self.return()
	}

	const wrap = v => render === html ? Marker + v : v

	return async ? Promise.resolve(value).then(wrap) : wrap(value)
}

const hole = (id, fallback = null) => ({

	nodeName: 'div',

	key: `hole:${id}`,

	'data-ssr-id': id,

	style: fallback ? null : 'display:contents;',

	children: fallback,
})

const normalize = async function* (h, alloc, push, render, buffer = { h: '' }, root = true) {

	for (h of Array.isArray(h) ? h.flat(Infinity) : [h]) {

		const type = typeof h

		if (h == null || type === 'boolean') continue

		if (type === 'object' && 'nodeName' in h) {

			if (buffer.h) yield buffer.h, buffer.h = ''

			const fn = h.nodeName

			if (typeof fn === 'function') {

				if (fn.constructor.name === 'GeneratorFunction') {

					const attrs = { ...fn.attrs }, args = { ...fn.args }

					for (const k in h) {

						const v = h[k]

						if (k.startsWith('attr:')) attrs[k.slice(5)] = v

						else if (Special.has(k) || k.startsWith('set:')) attrs[k] = v

						else args[k] = v
					}

					attrs.nodeName = fn.is ?? 'div'
					attrs.children = await run(fn, args, render)

					yield attrs

				} else if (fn.constructor.name === 'AsyncGeneratorFunction') {

					const it = fn(h)

					const first = await it.next()

					if (first.done) {

						yield* normalize(first.value, alloc, push, render, buffer, false)

					} else {

						const id = alloc();

						(async () => {

							let r = first

							while (!(r = await it.next()).done) push(r.value, id, false)

							push(r.value, id, true)
						})()

						yield hole(id, first.value)
					}

				} else {

					h = fn(h)

					if (fn.client || h instanceof Promise) {

						const id = alloc()

						push(h, id, true)

						yield hole(id, fn.fallback)

					} else yield* normalize(h, alloc, push, render, buffer, false)
				}

			} else yield h

		} else buffer.h += h
	}

	if (root && buffer.h) yield buffer.h
}

const toTree = async (h, alloc, push) => {

	const out = []

	for await (const n of normalize(h, alloc, push, toTree)) out.push(n)

	return out.length === 1 ? out[0] : out
}

export const html = async function* (h, alloc = () => '', push = () => { }) {

	for await (h of normalize(h, alloc, push, html)) {

		if (typeof h === 'string') yield escape(h)

		else {

			let attrs = ''

			for (const [k, v] of Object.entries(h)) {

				if (Omit.has(k) || k.startsWith('set:') || v == null || v === false) continue

				attrs += v === true ? ` ${k}` : ` ${k}="${escape(String(v))}"`
			}

			if (Void.has(h.nodeName)) yield `<${h.nodeName}${attrs}>`

			else if (!h.skip) {

				yield `<${h.nodeName}${attrs}>`

				typeof h.children === 'string' && h.children.startsWith(Marker)

					? yield h.children.slice(1)

					: yield* html(h.children, alloc, push)

				yield `</${h.nodeName}>`

			} else yield `<${h.nodeName}${attrs}></${h.nodeName}>`
		}
	}
}

export const render = h => {

	const it = html(h)

	return (async () => { let s = ''; for await (const c of it) s += c; return s })()
}

export const stream = async function* (h) {

	const tasks = new Set, queue = []

	let id = 0

	const alloc = () => String(id++)

	const push = (promise, id, done = true) => {

		const task = Promise.resolve(promise).then(async v => {

			const h = await toTree(v, alloc, push)

			return `<script>(window.$stream||[]).push(${JSON.stringify({ id, h, done })})</script>`
		})

		tasks.add(task)

		task.then(html => queue.push(html)).finally(() => tasks.delete(task))
	}

	for await (h of html(h, alloc, push)) yield h

	while (tasks.size) {

		await Promise.race(tasks)

		while (queue.length) yield queue.shift()
	}

	while (queue.length) yield queue.shift()
}
