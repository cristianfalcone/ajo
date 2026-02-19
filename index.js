import { Context, current } from 'ajo/context'

const Key = Symbol.for('ajo.key')
const Memo = Symbol.for('ajo.memo')
const Cache = Symbol.for('ajo.cache')
const Generator = Symbol.for('ajo.generator')
const Iterator = Symbol.for('ajo.iterator')
const Render = Symbol.for('ajo.render')
const Args = Symbol.for('ajo.args')
const Controller = Symbol.for('ajo.controller')

export const Fragment = props => props.children

export const h = (type, props, ...children) => {

	(props ??= {}).nodeName = type

	if (!('children' in props) && children.length) props.children = children.length == 1 ? children[0] : children

	return props
}

export const render = (h, el, child = el.firstChild, ref = null) => {

	for (h of walk(h)) {

		const node = reconcile(h, el, child)

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
	}

	while (child != ref) {

		const node = child.nextSibling

		if (child.nodeType == 1) unref(child)

		el.removeChild(child)

		child = node
	}
}

const walk = function* (h) {

	if (h == null) return

	const type = typeof h

	if (type == 'boolean') return

	if (type == 'string') yield h

	else if (type == 'number' || type == 'bigint') yield String(h)

	else if (Symbol.iterator in h) for (h of h) yield* walk(h)

	else if ('nodeName' in h) typeof h.nodeName == 'function' ? yield* run(h) : yield h

	else yield String(h)
}

const run = function* ({ nodeName, ...h }) {

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

	return { ...attrs, nodeName: fn.is ?? 'div', [Generator]: fn, [Args]: args }
}

const reconcile = (h, el, node) => typeof h == 'string' ? text(h, node) : element(h, el, node)

const text = (h, node) => {

	while (node && node.nodeType != 3) node = node.nextSibling

	node ? node.data != h && (node.data = h) : node = document.createTextNode(h)

	return node
}

const element = ({ nodeName, children, key, skip, memo, [Generator]: gen, [Args]: args, ...h }, el, node) => {

	while (node && (

		(node.localName != nodeName) ||

		(node[Key] != null && node[Key] != key) ||

		(node[Generator] && node[Generator] != gen)

	)) node = node.nextSibling

	node ??= document.createElementNS(h.xmlns ?? el.namespaceURI, nodeName)

	if (key != null) node[Key] = key

	if (memo == null || some(node[Memo], node[Memo] = memo)) {

		attrs(node[Cache] ?? extract(node), node[Cache] = h, node)

		if (!skip) gen ? next(gen, args, node) : render(children, node)
	}

	return node
}

const attrs = (cache, h, node) => {

	for (const key in { ...cache, ...h }) {

		if (cache[key] === h[key]) continue

		if (key == 'ref' && typeof h[key] == 'function') h[key](node)

		else if (key.startsWith('set:')) node[key.slice(4)] = h[key]

		else if (h[key] == null || h[key] === false) node.removeAttribute(key)

		else node.setAttribute(key, h[key] === true ? '' : h[key])
	}
}

const some = (a, b) => Array.isArray(a) && Array.isArray(b) ? a.some((v, i) => v !== b[i]) : a !== b

const extract = el => Array.from(el.attributes).reduce((out, attr) => (out[attr.name] = attr.value, out), {})

const before = (el, node, child) => {

	if (node.contains(document.activeElement)) {

		const ref = node.nextSibling

		while (child && child != node) {

			const next = child.nextSibling

			el.insertBefore(child, ref)

			child = next
		}

	} else el.insertBefore(node, child)
}

const unref = node => {

	for (const child of node.children) unref(child)

	if (typeof node.return == 'function') node.return()

	if (typeof node[Cache]?.ref == 'function') node[Cache].ref(null)
}

const next = (fn, args, el) => {

	el[Generator] ??= (attach(el), fn)

	Object.assign(el[Args] ??= {}, args)

	el[Render]()
}

const attach = el => {

	Object.assign(el, methods)

	el[Context] = Object.create(current()?.[Context] ?? null)
}

const methods = {

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

	return() {

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
