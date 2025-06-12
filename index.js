import { Context, current } from 'ajo/context'

const Key = Symbol.for('ajo.key')
const Memo = Symbol.for('ajo.memo')
const Ref = Symbol.for('ajo.ref')
const Cache = Symbol.for('ajo.cache')
const Generator = Symbol.for('ajo.generator')
const Iterator = Symbol.for('ajo.iterator')
const Args = Symbol.for('ajo.args')

export const Fragment = props => props.children

export const h = (type, props, ...children) => {

	(props ??= {}).nodeName = type

	if (!('children' in props) && children.length) props.children = children.length == 1 ? children[0] : children

	return props
}

export const render = (h, el, child = el.firstChild, ref) => {

	for (h of walk(h)) {

		const node = reconcile(h, el, child)

		node === child ? child = child.nextSibling : before(el, node, child)
	}

	while (child && child != ref) {

		const next = child.nextSibling

		if (child.nodeType == 1) unref(child)

		el.removeChild(child)

		child = next
	}
}

const walk = function* (h, buffer = { h: '' }, root = true) {

	if (h == null || typeof h == 'boolean') return

	if (Array.isArray(h)) for (h of h.flat(Infinity)) yield* walk(h, buffer, false)

	else if (typeof h == 'object' && 'nodeName' in h) {

		if (buffer.h) yield buffer.h, buffer.h = ''

		if (typeof h.nodeName == 'function') yield* run(h, buffer)

		else yield h

	} else buffer.h += h

	if (root && buffer.h) yield buffer.h
}

const run = function* ({ nodeName, ...h }, buffer) {

	if (nodeName.constructor.name == 'GeneratorFunction') yield runGenerator(nodeName, h)

	else yield* walk(nodeName(h), buffer, false)
}

const runGenerator = function (fn, h) {

	const attrs = { ...fn.attrs }, args = { ...fn.args }

	for (const key in h) {

		if (key.startsWith('attr:')) attrs[key.slice(5)] = h[key]

		else if (key == 'key' || key == 'memo' || key.startsWith('set:')) attrs[key] = h[key]

		else args[key] = h[key]
	}

	return { ...attrs, nodeName: fn.is ?? 'div', skip: true, ref: next.bind(null, fn, args) }
}

const reconcile = (h, el, node) => {

	if (typeof h === 'string') return text(h, node)

	return element(h, el, node)
}

const text = (data, node) => {

	while (node && node.nodeType != 3) node = node.nextSibling

	node ? node.data != data && (node.data = data) : node = document.createTextNode(data)

	return node
}

const element = ({ nodeName, children, key, skip, memo, ref, ...h }, el, node) => {

	while (node && !(node.localName == nodeName && (node[Key] ??= key) == key)) node = node.nextSibling

	node ??= Object.assign(document.createElementNS(h.xmlns ?? el.namespaceURI, nodeName), { [Key]: key })

	if (memo == null || some(node[Memo], node[Memo] = memo)) {

		node[Cache] = attrs(node[Cache] ?? extract(node), h, node)

		if (!skip) render(children, node)

		if (typeof ref == 'function') (node[Ref] = ref)(node)
	}

	return node
}

const attrs = (cache, h, node) => {

	for (const key in { ...cache, ...h }) {

		if (cache[key] === h[key]) continue

		if (key.startsWith('set:')) node[key.slice(4)] = h[key]

		else if (h[key] == null || h[key] === false) node.removeAttribute(key)

		else node.setAttribute(key, h[key] === true ? '' : h[key])
	}

	return h
}

const some = (a, b) => Array.isArray(a) && Array.isArray(b) ? a.some((v, i) => v !== b[i]) : a !== b

const extract = el => Array.from(el.attributes).reduce((o, a) => (o[a.name] = a.value, o), {})

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

const unref = el => {

	for (const child of el.children) unref(child)

	el[Ref]?.(null)
}

const next = (fn, { skip, ref, ...args }, el) => {

	if (!el) return

	el[Generator] ??= attach(fn, el)

	el[Ref] = dispose.bind(null, ref, el)

	Object.assign(el[Args] ??= {}, args)

	if (!skip) el.next()
}

const attach = (fn, el) => {

	Object.assign(el, methods)

	el[Context] = Object.create(current()?.[Context] ?? null)

	return fn
}

const dispose = (ref, el, node) => {

	if (typeof ref == 'function') ref(node)

	if (!node) el.return()
}

const methods = {

	render() {

		if (!current()?.contains(this)) this.next()
	},

	next() {

		const parent = current()

		current(this)

		try {

			const { value, done } = (this[Iterator] ??= this[Generator].call(this, this[Args])).next()

			render(value, this)

			this[Ref]?.(this)

			if (done) this.return()

		} catch (value) {

			this.throw(value)

		} finally {

			current(parent)
		}
	},

	throw(value) {

		for (let el = this; el; el = el.parentNode) if (typeof el[Iterator]?.throw == 'function') try {

			return render(el[Iterator].throw(value).value, el)

		} catch (error) {

			value = new Error(error instanceof Error ? error.message : error, { cause: value })
		}

		throw value
	},

	return() {

		try {

			this[Iterator]?.return()

		} catch (value) {

			this.throw(value)

		} finally {

			this[Iterator] = null
		}
	}
}
