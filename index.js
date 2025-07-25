import { Context, current } from 'ajo/context'

const Keyed = Symbol.for('ajo.keyed')
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

export const render = (h, el) => {

	let child = el.firstChild

	for (h of walk(h)) {

		const node = reconcile(h, el, child)

		if (child == null) {

			el.appendChild(node)

		} else if (node == child) {

			child = node.nextSibling

		} else if (node == child.nextSibling) {

			el.appendChild(child)

			child = node.nextSibling

		} else {

			before(el, node, child)
		}
	}

	while (child) {

		const node = child.nextSibling

		if (child.nodeType == 1) unref(el, child)

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

	if (typeof h == 'string') return text(h, node)

	return element(h, el, node)
}

const text = (h, node) => {

	while (node && node.nodeType != 3) node = node.nextSibling

	node ? node.data != h && (node.data = h) : node = document.createTextNode(h)

	return node
}

const element = ({ nodeName, children, key, skip, memo, ref, ...h }, el, node) => {

	if (key != null) node = (el[Keyed] ??= new Map).get(key) ?? (node?.[Key] == null ? node : null)

	while (node && node.localName != nodeName) node = node.nextSibling

	node ??= document.createElementNS(h.xmlns ?? el.namespaceURI, nodeName)

	if (key != node[Key]) el[Keyed].set(node[Key] = key, node)

	if (memo == null || some(node[Memo], node[Memo] = memo)) {

		attrs(node[Cache] ?? extract(node), node[Cache] = h, node)

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

const unref = (el, node) => {

	for (const child of node.children) unref(node, child)

	el[Keyed]?.delete(node[Key])

	node[Keyed]?.clear()

	node[Ref]?.(null)

	node[Generator] &&= null
}

const next = (fn, { skip, ref, ...args }, el) => {

	if (!el) return

	el[Generator] ??= (attach(el), fn)

	el[Ref] = dispose.bind(null, ref, el)

	Object.assign(el[Args] ??= {}, args)

	if (!skip) el.next()
}

const attach = el => {

	Object.assign(el, methods)

	el[Context] = Object.create(current()?.[Context] ?? null)
}

const dispose = (ref, el, node) => {

	if (typeof ref == 'function') ref(node)

	if (!node) el.return()
}

const methods = {

	render() {

		if (current()?.contains(this)) return

		this.next()
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
