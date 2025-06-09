import { Context, current } from 'ajo/context'

const Void = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

const Special = new Set(['key', 'skip', 'memo', 'ref'])

const Omit = new Set(['nodeName', 'children', ...Special])

const Args = Symbol.for('ajo.args')

const escape = s => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

const placeholder = (id, fallback = null) => ({ nodeName: 'div', 'data-ssr': id, children: fallback })

const noop = () => { }

export const render = h => [...html(h)].join('')

export const html = function* (h, alloc = () => '', push = noop) {

	yield* stringify(run(h, alloc, push))
}

const run = (h, alloc, push) => {

	if (h == null || typeof h === 'boolean') return null

	if (typeof h === 'string' || typeof h === 'number') return String(h)

	if (Array.isArray(h)) {

		const children = []

		for (const child of h.flat(Infinity)) {

			const out = run(child, alloc, push)

			if (out != null) children.push(out)
		}

		return children.length === 1 ? children[0] : children
	}

	if (typeof h === 'object' && 'nodeName' in h) {

		const { nodeName, ...rest } = h

		if (typeof nodeName === 'function') return runFn(nodeName, rest, alloc, push)

		const node = { nodeName }

		for (const [key, value] of Object.entries(h)) if (!Omit.has(key) && !key.startsWith('set:')) node[key] = value

		if ('children' in h) node.children = run(h.children, alloc, push)

		return node
	}

	return String(h)
}

const runFn = (fn, h, alloc, push) => {

	const type = fn.constructor.name

	if (type === 'GeneratorFunction') return runGeneratorFn(fn, h, alloc, push)

	if (type === 'AsyncGeneratorFunction') return runAsyncGeneratorFn(fn, h, alloc, push)

	h = fn(h)

	if (h instanceof Promise) {

		if (push === noop) return run(h, alloc, push)

		const id = alloc()

		h.then(h => push({ id, h: run(h, (parent = id) => alloc(parent), push), done: true }))

		return placeholder(id, fn.fallback)
	}

	if (fn.client) {

		const id = alloc()

		push({ id, h: run(h, (parent = id) => alloc(parent), push), done: true })

		return placeholder(id, fn.fallback)
	}

	return run(h, alloc, push)
}

const runGeneratorFn = (fn, h, alloc, push) => {

	const attrs = { ...fn.attrs }, args = { ...fn.args }

	for (const [key, value] of Object.entries(h)) {

		if (key.startsWith('attr:')) attrs[key.slice(5)] = value

		else if (Special.has(key) || key.startsWith('set:')) attrs[key] = value

		else args[key] = value
	}

	const instance = {

		[Context]: Object.assign(Object.create(null), current()?.[Context]),

		*[Symbol.iterator]() { while (true) yield args },

		[Args]: args,

		render: noop, next: noop, return: noop,

		throw: (err) => { throw err }
	}

	const iterator = fn.call(instance, args)

	const parent = current()

	current(instance)

	try {

		return { ...attrs, nodeName: fn.is ?? 'div', children: run((iterator.next()).value, alloc, push) }

	} finally {

		iterator.return?.()

		current(parent)
	}
}

const runAsyncGeneratorFn = (fn, h, alloc, push) => {

	const id = alloc()

	if (push === noop) return placeholder(id, null)

	Promise.resolve().then(async () => {

		alloc = (parent = id) => alloc(parent)

		const iterator = fn(h)

		try {

			h = await iterator.next()

			while (!h.done) {

				push({ id, h: run(h.value, alloc, push), done: false })

				h = await iterator.next()
			}

			push({ id, h: run(h.value, alloc, push), done: true })

		} catch (error) {

			push({ id, h: run(null, alloc, push), done: true })

		} finally {

			iterator.return?.()
		}
	})

	return placeholder(id, null)
}

const stringify = function* (h) {

	if (typeof h === 'string') yield escape(h)

	else if (Array.isArray(h)) for (h of h) yield* stringify(h)

	else if (typeof h === 'object' && 'nodeName' in h) {

		const { nodeName, children } = h

		let attrs = ''

		for (const [key, value] of Object.entries(h)) {

			if (Omit.has(key) || key.startsWith('set:') || value == null || value === false) continue

			if (value === true) attrs += ` ${key}`

			else attrs += ` ${key}="${escape(String(value))}"`
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
