import { Context, current } from 'ajo/context'

const Void = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

const Special = new Set(['key', 'skip', 'memo', 'ref'])

const Omit = new Set(['nodeName', 'children', ...Special])

const Args = Symbol.for('ajo.args')

const escape = s => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

const noop = () => { }

export const render = h => [...html(h)].join('')

export const html = function* (h, { alloc = () => '', placeholder = noop, push = noop } = {}) {

	yield* stringify(walk(h, { alloc, placeholder, push }))
}

const walk = (h, hooks) => {

	const type = typeof h

	if (h == null || type === 'boolean') return

	if (type === 'string' || type === 'number') return String(h)

	if (Array.isArray(h)) {

		const children = []

		for (h of h.flat(Infinity)) {

			const out = walk(h, hooks)

			if (out != null) children.push(out)
		}

		return children.length === 1 ? children[0] : children
	}

	if ('nodeName' in h) {

		if (typeof h.nodeName === 'function') return run(h, hooks)

		const node = { nodeName: h.nodeName }

		for (const key in h) if (!Omit.has(key) && !key.startsWith('set:')) node[key] = h[key]

		if ('children' in h) node.children = walk(h.children, hooks)

		return node
	}

	return String(h)
}

const run = ({ nodeName, fallback = nodeName.fallback, ...h }, hooks) => {

	if (nodeName.src) {

		const id = hooks.alloc()

		hooks.push({ id, src: nodeName.src, h, done: true })

		return hooks.placeholder(id, fallback)
	}

	const type = nodeName.constructor.name

	if (type === 'GeneratorFunction') return runGenerator(nodeName, h, hooks)

	if (type === 'AsyncGeneratorFunction') return runAsyncGenerator(nodeName, fallback, h, hooks)

	h = nodeName(h)

	if (h instanceof Promise) {

		if (hooks.push === noop) return fallback

		const id = hooks.alloc()

		h.then(h => hooks.push({ id, h: walk(h, { ...hooks, alloc: (parent = id) => hooks.alloc(parent) }), done: true }))

		return hooks.placeholder(id, fallback)
	}

	return walk(h, hooks)
}

const runGenerator = (fn, h, hooks) => {

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

		return { ...attrs, nodeName: fn.is ?? 'div', children: walk((iterator.next()).value, hooks) }

	} finally {

		iterator.return?.()

		current(parent)
	}
}

const runAsyncGenerator = (fn, fallback, h, hooks) => {

	if (hooks.push === noop) return fallback

	const id = hooks.alloc()

	Promise.resolve().then(async () => {
	
		const iterator = fn(h)
		
		hooks = { ...hooks, alloc: (parent = id) => hooks.alloc(parent) }

		try {

			h = await iterator.next()

			while (!h.done) {

				hooks.push({ id, h: walk(h.value, hooks), done: false })

				h = await iterator.next()
			}

			hooks.push({ id, h: walk(h.value, hooks), done: true })

		} catch (value) {

			hooks.push({ id, h: walk(value, hooks), done: true })

		} finally {

			iterator.return?.()
		}
	})

	return hooks.placeholder(id, fallback)
}

const stringify = function* (h) {

	if (typeof h === 'string') yield escape(h)

	else if (Array.isArray(h)) for (h of h) yield* stringify(h)

	else if ('nodeName' in h) {

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
	}

	else yield escape(String(h))
}
