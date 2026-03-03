import { Context, current } from './context.js'

const { isArray } = Array, { assign, create } = Object

const Key = Symbol.for('ajo.key')
const Keyed = Symbol.for('ajo.keyed')
const Memo = Symbol.for('ajo.memo')
const Cache = Symbol.for('ajo.cache')
const Generator = Symbol.for('ajo.generator')
const Iterator = Symbol.for('ajo.iterator')
const Render = Symbol.for('ajo.render')
const Args = Symbol.for('ajo.args')
const Controller = Symbol.for('ajo.controller')

export const defaults = { tag: 'div' }

export const stateful = (fn, is) => (is && (fn.is = is), fn)

export const render = (h, el, child = el.firstChild, ref = null) => {

	walk(h, h => {

		const node = typeof h == 'string' ? text(h, child) : element(h, el, child)

		if (child == null) {

			before(el, node, ref)

		} else if (node == child) {

			child = node.nextSibling

		} else if (node == child.nextSibling) {

			before(el, child, ref)

			child = node.nextSibling

		} else {

			before(el, node, child)
		}
	})

	while (child != ref) {

		const node = child.nextSibling

		if (child.nodeType == 1) unref(child)

		el.removeChild(child)

		child = node
	}
}

const walk = (h, fn) => {

	if (h == null) return

	const type = typeof h

	if (type == 'boolean') return

	if (type == 'string') fn(h)

	else if (type == 'number' || type == 'bigint') fn(String(h))

	else if (Symbol.iterator in h) for (h of h) walk(h, fn)

	else if ('nodeName' in h) typeof h.nodeName == 'function' ? run(h, fn) : fn(h)

	else fn(String(h))
}

const run = ({ nodeName, ...h }, fn) => {

	if (nodeName.constructor.name == 'GeneratorFunction') fn(runGenerator(nodeName, h))

	else walk(nodeName(h), fn)
}

const runGenerator = (fn, h) => {

	const attrs = { ...fn.attrs }, args = { ...fn.args }

	for (const key in h) {

		if (key.startsWith('attr:')) attrs[key.slice(5)] = h[key]

		else if (key == 'key' || key == 'skip' || key == 'memo' || key == 'ref' || key.startsWith('set:')) attrs[key] = h[key]

		else args[key] = h[key]
	}

	return { ...attrs, nodeName: fn.is ?? defaults.tag, [Generator]: fn, [Args]: args }
}

const text = (h, node) => {

	while (node && node.nodeType != 3) node = node.nextSibling

	node ? node.data != h && (node.data = h) : node = document.createTextNode(h)

	return node
}

const element = (h, el, node) => {

	const { nodeName, children, key, skip, memo, [Generator]: gen, [Args]: args } = h

	if (key != null) node = (el[Keyed] ??= new Map()).get(key) ?? node

	while (node && (

		(node.localName != nodeName) ||

		(node[Key] != null && node[Key] != key) ||

		(node[Generator] && node[Generator] != gen)

	)) node = node[Key] != null ? null : node.nextElementSibling

	node ??= document.createElementNS(h.xmlns ?? el.namespaceURI, nodeName)

	if (key != null) el[Keyed].set(node[Key] = key, node)

	if (memo == null || some(node[Memo], node[Memo] = memo)) {

		attrs(node[Cache], node[Cache] = h, node)

		if (!skip) gen ? next(gen, args, node) : render(children, node)
	}

	return node
}

const attrs = (cache, h, node) => {

	for (const key in { ...cache, ...h }) {

		if (key == 'nodeName' || key == 'children' || key == 'key' || key == 'skip' || key == 'memo' || cache?.[key] === h[key]) continue

		if (key == 'ref' && typeof h[key] == 'function') h[key](node)

		else if (key.startsWith('set:')) node[key.slice(4)] = h[key]

		else if (h[key] == null || h[key] === false) node.removeAttribute(key)

		else node.setAttribute(key, h[key] === true ? '' : h[key])
	}
}

const some = (a, b) => isArray(a) && isArray(b) ? a.some((v, i) => v !== b[i]) : a !== b

const each = (fn, node) => {

	let child = node.firstElementChild

	while (child)

		if (fn(child) && child.firstElementChild) child = child.firstElementChild

		else {

			while (child != node && !child.nextElementSibling) child = child.parentNode ?? node

			child = child != node && child.nextElementSibling
		}
}

const before = (el, node, child) => {

	if (node.isConnected && node.contains(document.activeElement)) {

		const ref = node.nextSibling

		while (child && child != node) {

			const next = child.nextSibling

			el.insertBefore(child, ref)

			child = next
		}

	} else el.insertBefore(node, child)
}

const unref = root => {

	let node = root

	while (node.firstElementChild) node = node.firstElementChild

	while (true) {

		const { nextElementSibling, parentNode } = node

		if (node[Key] != null) parentNode?.[Keyed]?.delete(node[Key])

		if (typeof node.return == 'function') node.return(false)

		if (typeof node[Cache]?.ref == 'function') node[Cache].ref(null)

		if (node === root) break

		node = nextElementSibling ?? parentNode ?? root

		if (nextElementSibling) while (node.firstElementChild) node = node.firstElementChild
	}
}

const next = (fn, args, el) => {

	el[Generator] ??= (assign(el, methods)[Context] = create(current()?.[Context] ?? null), fn)

	el[Args] = args

	el[Render]()
}

const methods = {

	*[Symbol.iterator]() { while (true) yield this[Args] },

	[Render]() {

		const parent = current()

		current(this)

		try {

			if (!this[Iterator]) {

				this.signal = (this[Controller] = new AbortController()).signal

				this[Iterator] = this[Generator].call(this, this[Args])
			}

			const { value, done } = this[Iterator].next()

			render(value, this)

			if (done) this.return()

		} catch (e) {

			this.throw(e)

		} finally {

			current(parent)
		}
	},

	next(fn, result) {

		if (!this.isConnected) return result

		try {

			if (typeof fn == 'function') result = fn.call(this, this[Args])

		} catch (e) {

			return this.throw(e)
		}

		if (!current()?.contains(this)) this[Render]()

		return result
	},

	throw(value) {

		for (let el = this; el; el = el.parentNode) if (el[Iterator]?.throw) try {

			return render(el[Iterator].throw(value).value, el)

		} catch (e) {

			value = new Error(e?.message ?? e, { cause: value })
		}

		throw value
	},

	return(deep = true) {

		if (deep) each(el => typeof el.return == 'function' ? el.return() : true, this)

		try {

			this[Iterator]?.return()

		} catch (e) {

			this.throw(e)

		} finally {

			this[Iterator] = null

			this[Controller]?.abort()
		}
	}
}
