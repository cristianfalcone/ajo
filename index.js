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

		if (child == null) before(el, node)

		else if (node == child) child = child.nextSibling

		else before(el, node, node == child.nextSibling ? child = move(el, child) : child)
	}

	while (child) {

		const node = child.nextSibling

		el.removeChild(child)

		child = node
	}
}

const move = (el, child) => {

	const node = child.nextSibling

	before(el, child)

	return node.nextSibling
}

const walk = function* (h) {

	const type = typeof h

	if (h == null || type == 'boolean') return

	if (type === 'string' || type === 'number') yield String(h)

	else if (Array.isArray(h)) for (h of h) yield* walk(h)

	else if ('nodeName' in h) {

		if (typeof h.nodeName == 'function') yield* run(h)

		else yield h
	}

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

	if (key != null) node = (el[Keyed] ??= new Map).get(key) ?? node

	else while (node && node.localName != nodeName) node = node.nextSibling

	node ??= document.createElementNS(h.xmlns ?? el.namespaceURI, nodeName)

	if (key != null && node[Key] != key) {

		if (node[Key] != null) unref(node)

		el[Keyed].set(node[Key] = key, node)
	}

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

	if (!node.contains(document.activeElement)) return el.insertBefore(node, child)

	const ref = node.nextSibling

	while (child && child != node) {

		const next = child.nextSibling

		el.insertBefore(child, ref)

		child = next
	}
}

const unref = el => {

	for (const child of el.children) unref(child)

	el[Keyed]?.clear()

	el[Ref]?.(null)
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

new MutationObserver(records =>

	records.forEach(record => record.removedNodes.forEach(node => node.isConnected || node.nodeType == 1 && unref(node)))

).observe(document, { childList: true, subtree: true })
