import { Context, current } from './context.js'

const Void = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

const Args = Symbol.for('ajo.args')

const escape = s => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

const noop = () => { }

export const defaults = { tag: 'div' }

export const render = h => {

	let out = ''

	html(h, chunk => out += chunk)

	return out
}

export const html = (h, emit) => {

	if (h == null) return

	const type = typeof h

	if (type == 'boolean') return

	if (type == 'string') emit(escape(h))

	else if (type == 'number' || type == 'bigint') emit(escape(String(h)))

	else if (Symbol.iterator in h) for (h of h) html(h, emit)

	else if ('nodeName' in h) typeof h.nodeName == 'function' ? run(h, emit) : element(h, emit)

	else emit(escape(String(h)))
}

const element = (h, emit) => {

	const { nodeName, children } = h

	let a = ''

	for (const key in h) {

		if (key == 'nodeName' || key == 'children' || key == 'key' || key == 'skip' || key == 'memo' || key == 'ref' || key.startsWith('set:') || h[key] == null || h[key] === false) continue

		if (h[key] === true) a += ` ${key}`

		else a += ` ${key}="${escape(String(h[key]))}"`
	}

	if (Void.has(nodeName)) emit(`<${nodeName}${a}>`)

	else {

		emit(`<${nodeName}${a}>`)

		if (children != null) html(children, emit)

		emit(`</${nodeName}>`)
	}
}

const run = ({ nodeName, fallback = nodeName.fallback, ...h }, emit) => {

	if (nodeName.constructor.name == 'GeneratorFunction') runGenerator(nodeName, h, emit)

	else html(nodeName(h), emit)
}

const runGenerator = (fn, h, emit) => {

	const attrs = { ...fn.attrs }, args = { ...fn.args }

	for (const key in h) {

		if (key.startsWith('attr:')) attrs[key.slice(5)] = h[key]

		else if (key == 'key' || key == 'skip' || key == 'memo' || key == 'ref' || key.startsWith('set:')) attrs[key] = h[key]

		else args[key] = h[key]
	}

	const controller = new AbortController()

	const instance = {

		*[Symbol.iterator]() { while (true) yield this[Args] },

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

	const vnode = children => ({ ...attrs, nodeName: fn.is ?? defaults.tag, children })

	let out = ''

	try {

		element(vnode(iterator.next().value), chunk => out += chunk)

	} catch (error) {

		out = ''

		element(vnode(iterator.throw(error).value), chunk => out += chunk)

	} finally {

		iterator.return()

		controller.abort()

		current(parent)
	}

	emit(out)
}
