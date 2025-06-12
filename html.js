import { Context, current } from 'ajo/context'

const Void = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

const Special = new Set(['key', 'skip', 'memo', 'ref'])

const Omit = new Set(['nodeName', 'children', ...Special])

const Args = Symbol.for('ajo.args')

const escape = s => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

const placeholder = (id, children) => ({ nodeName: 'div', 'data-ssr': id, children })

const noop = () => { }

export const render = h => [...html(h)].join('')

export const html = function* (h, alloc = () => '', push = noop) {

	yield* stringify(walk(h, alloc, push))
}

const walk = (h, alloc, push) => {

	if (h == null || typeof h === 'boolean') return

	if (typeof h === 'string' || typeof h === 'number') return String(h)

	if (Array.isArray(h)) {

		const children = []

		for (h of h.flat(Infinity)) {

			const out = walk(h, alloc, push)

			if (out != null) children.push(out)
		}

		return children.length === 1 ? children[0] : children
	}

	if (typeof h === 'object' && 'nodeName' in h) {

		if (typeof h.nodeName === 'function') return run(h, alloc, push)

		const node = { nodeName: h.nodeName }

		for (const key in h) if (!Omit.has(key) && !key.startsWith('set:')) node[key] = h[key]

		if ('children' in h) node.children = walk(h.children, alloc, push)

		return node
	}

	return String(h)
}

const run = ({ nodeName, fallback = nodeName.fallback, ...h } , alloc, push) => {

	if (nodeName.src) {

		const id = alloc()

		push({ id, src: nodeName.src, h, done: true })

		return placeholder(id, fallback)
	}

	const type = nodeName.constructor.name

	if (type === 'GeneratorFunction') return runGenerator(nodeName, h, alloc, push)

	if (type === 'AsyncGeneratorFunction') return runAsyncGenerator(nodeName, fallback, h, alloc, push)

	h = nodeName(h)

	if (h instanceof Promise) {

		if (push === noop) return fallback

		const id = alloc()

		h.then(h => push({ id, h: walk(h, (parent = id) => alloc(parent), push), done: true }))

		return placeholder(id, fallback)
	}

	return walk(h, alloc, push)
}

const runGenerator = (fn, h, alloc, push) => {

	const attrs = { ...fn.attrs }, args = { ...fn.args }

	for (const key in h) {

		if (key.startsWith('attr:')) attrs[key.slice(5)] = h[key]

		else if (Special.has(key) || key.startsWith('set:')) attrs[key] = h[key]

		else args[key] = h[key]
	}

	const instance = {

		[Context]: Object.assign(Object.create(null), current()?.[Context]),

		[Args]: args,

		render: noop, next: noop, return: noop,

		throw: value => { throw value }
	}

	const iterator = fn.call(instance, args)

	const parent = current()

	current(instance)

	try {

		return { ...attrs, nodeName: fn.is ?? 'div', children: walk((iterator.next()).value, alloc, push) }

	} finally {

		iterator.return?.()

		current(parent)
	}
}

const runAsyncGenerator = (fn, fallback, h, alloc, push) => {

	if (push === noop) return fallback

	const id = alloc()

	Promise.resolve().then(async () => {

		alloc = (parent = id) => alloc(parent)

		const iterator = fn(h)

		try {

			h = await iterator.next()

			while (!h.done) {

				push({ id, h: walk(h.value, alloc, push), done: false })

				h = await iterator.next()
			}

			push({ id, h: walk(h.value, alloc, push), done: true })

		} catch (value) {

			push({ id, h: walk(value, alloc, push), done: true })

		} finally {

			iterator.return?.()
		}
	})

	return placeholder(id, fallback)
}

const stringify = function* (h) {

	if (typeof h === 'string') yield escape(h)

	else if (Array.isArray(h)) for (h of h) yield* stringify(h)

	else if (typeof h === 'object' && 'nodeName' in h) {

		const { nodeName, children } = h

		let attrs = ''

		for (const key in h) {

			if (Omit.has(key) || key.startsWith('set:') || h[key] == null || h[key] === false) continue

			if (h[key] === true) attrs += ` ${key}`

			else attrs += ` ${key}="${escape(String(h[key]))}"`
		}

		if (Void.has(nodeName)) yield `<${nodeName}${attrs}>`

		else {

			yield `<${nodeName}${attrs}>`

			if (children != null) yield* stringify(children)

			yield `</${nodeName}>`
		}

		return

	} else yield escape(String(h))
}
