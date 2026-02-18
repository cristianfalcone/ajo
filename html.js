import { Context, current } from 'ajo/context'

const Void = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

const Args = Symbol.for('ajo.args')

const escape = s => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

const noop = () => { }

export const render = h => [...html(h)].join('')

export const html = function* (h) {

	for (h of walk(h)) {

		if (typeof h == 'string') yield escape(h)

		else yield* element(h)
	}
}

const element = function* ({ nodeName, children, ...h }) {

	let attrs = ''

	for (const key in h) {

		if (key.startsWith('set:') || h[key] == null || h[key] === false) continue

		if (h[key] === true) attrs += ` ${key}`

		else attrs += ` ${key}="${escape(String(h[key]))}"`
	}

	if (Void.has(nodeName)) yield `<${nodeName}${attrs}>`

	else {

		yield `<${nodeName}${attrs}>`

		if (children != null) yield* html(children)

		yield `</${nodeName}>`
	}
}

const walk = function* (h) {

	if (h == null) return

	const type = typeof h

	if (type == 'boolean') return

	if (type == 'string') yield h

	else if (type == 'number' || type == 'bigint') yield String(h)

	else if (Symbol.iterator in h) for (h of h) yield* walk(h)

	else if ('nodeName' in h) typeof h.nodeName == 'function' ? yield* run(h) : yield vdom(h)

	else yield String(h)
}

const run = function* ({ nodeName, fallback = nodeName.fallback, ...h }) {

	if (nodeName.constructor.name == 'GeneratorFunction') yield runGenerator(nodeName, h)

	else yield* walk(nodeName(h))
}

const runGenerator = (fn, h) => {

	const attrs = { ...fn.attrs }, args = { ...fn.args }

	for (const key in h) {

		if (key.startsWith('attr:')) attrs[key.slice(5)] = h[key]

		else if (key == 'key' || key == 'skip' || key == 'memo' || key == 'ref' || key.startsWith('set:')) attrs[key] = h[key]

		else args[key] = h[key]
	}

	const controller = new AbortController()

	const instance = {

		[Context]: Object.create(current()?.[Context] ?? null),

		[Args]: args,

		signal: controller.signal,

		next: noop,

		return: noop,

		throw: value => { throw value }
	}

	const iterator = fn.call(instance, args)

	const parent = current()

	current(instance)

	const result = children => ({ ...attrs, nodeName: fn.is ?? 'div', ...vdom({ children }) })

	try {

		return result(iterator.next().value)

	} catch (error) {

		return result(iterator.throw(error).value)

	} finally {

		iterator.return()

		controller.abort()

		current(parent)
	}
}

const vdom = ({ key, skip, memo, ref, ...h }) => {

	if ('children' in h) {

		const children = [...walk(h.children)]

		if (children.length) h.children = children.length == 1 ? children[0] : children

		else delete h.children
	}

	return h
}
