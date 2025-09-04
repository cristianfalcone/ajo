import { Context, current } from 'ajo/context'

const Void = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

const Special = new Set(['key', 'skip', 'memo', 'ref'])

const Omit = new Set(['nodeName', 'children'])

const Args = Symbol.for('ajo.args')

const escape = s => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

const noop = () => { }

export const render = h => [...html(h)].join('')

export const html = function* (h, { alloc = noop, push = noop, placeholder = noop } = {}) {

	for (h of walk(h, { alloc, push, placeholder })) {

		if (typeof h == 'string') yield escape(h)

		else yield* element(h, { alloc, push, placeholder })
	}
}

const element = function* (h, hooks) {

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

		if (children != null) yield* html(children, hooks)

		yield `</${nodeName}>`
	}
}

const walk = function* (h, hooks) {

	if (h == null) return

	const type = typeof h

	if (type == 'boolean') return

	if (type == 'string') yield h

	else if (type == 'number' || type == 'bigint') yield String(h)

	else if (Symbol.iterator in h) for (h of h) yield* walk(h, hooks)

	else if ('nodeName' in h) typeof h.nodeName == 'function' ? yield* run(h, hooks) : yield vdom(h, hooks)

	else yield String(h)
}

const run = function* ({ nodeName, fallback = nodeName.fallback, ...h }, hooks) {

	const type = nodeName.constructor.name

	if (nodeName.src) yield runIsland(nodeName.src, h, hooks)

	else if (type == 'GeneratorFunction') yield runGenerator(nodeName, h, hooks)

	else if (type == 'AsyncGeneratorFunction') yield runAsyncGenerator(nodeName, fallback, h, hooks)

	else {

		h = nodeName(h)

		if (typeof h?.then == 'function') yield runAsync(fallback, h, hooks)

		else yield* walk(h, hooks)
	}
}

const runIsland = (src, h, hooks) => {

	const id = hooks.alloc()

	hooks.push({ id, src, h: vdom(h, hooks), done: true })

	return hooks.placeholder(id)
}

const runGenerator = (fn, h, hooks) => {

	const attrs = { ...fn.attrs }, args = { ...fn.args }

	for (const key in h) {

		if (key.startsWith('attr:')) attrs[key.slice(5)] = h[key]

		else if (Special.has(key) || key.startsWith('set:')) attrs[key] = h[key]

		else args[key] = h[key]
	}

	const instance = {

		[Context]: Object.create(current()?.[Context] ?? null),

		[Args]: args,

		next: noop,

		return: noop,

		throw: value => { throw value }
	}

	const iterator = fn.call(instance, args)

	const parent = current()

	current(instance)

	try {

		const children = [...walk(iterator.next().value, hooks)]

		return { ...attrs, nodeName: fn.is ?? 'div', children: children.length == 1 ? children[0] : children }

	} finally {

		iterator.return?.()

		current(parent)
	}
}

const runAsyncGenerator = (fn, fallback, h, hooks) => {

	const id = hooks.alloc()

	Promise.resolve().then(async () => {

		const iterator = fn(h)

		hooks = { ...hooks, alloc: (parent = id) => hooks.alloc(parent) }

		try {

			h = await iterator.next()

			while (!h.done) {

				hooks.push({ id, h: vdom(h.value, hooks), done: false })

				h = await iterator.next()
			}

			hooks.push({ id, h: vdom(h.value, hooks), done: true })

		} catch (value) {

			hooks.push({ id, h: vdom(value, hooks), done: true })

		} finally {

			iterator.return?.()
		}
	})

	return hooks.placeholder(id, fallback)
}

const runAsync = (fallback, h, hooks) => {

	const id = hooks.alloc()

	h.then(h => hooks.push({ id, h: vdom(h, { ...hooks, alloc: (parent = id) => hooks.alloc(parent) }), done: true }))

	return hooks.placeholder(id, fallback)
}

const vdom = ({ key, skip, memo, ref, ...h }, hooks) => {

	if ('children' in h) {

		const children = [...walk(h.children, hooks)]

		if (children.length) h.children = children.length == 1 ? children[0] : children

		else delete h.children
	}

	return h
}
