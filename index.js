import { Context, current } from 'ajo/context'

const Key = Symbol.for('ajo.key')
const Memo = Symbol.for('ajo.memo')
const Ref = Symbol.for('ajo.ref')
const Cache = Symbol.for('ajo.cache')
const Generator = Symbol.for('ajo.generator')
const Iterator = Symbol.for('ajo.iterator')
const Args = Symbol.for('ajo.args')

const Special = new Set(['key', 'skip', 'memo', 'ref'])
const Omit = new Set(['nodeName', 'children', ...Special])

export const Fragment = props => props.children

export const h = (type, props, ...children) => {

	(props ??= {}).nodeName = type

	if (!('children' in props) && children.length) props.children = children.length == 1 ? children[0] : children

	return props
}

export const render = (h, el, child = el.firstChild, ref) => {

	for (h of run(h)) child = reconcile(h, el, child)

	while (child && child != ref) {

		const next = child.nextSibling

		if (child.nodeType == 1) unref(child)

		el.removeChild(child)

		child = next
	}
}

const some = (a, b) => Array.isArray(a) && Array.isArray(b) ? a.some((v, i) => v !== b[i]) : a !== b

const run = function* (h) {

	if (h == null || typeof h === 'boolean') return

	if (typeof h === 'string' || typeof h === 'number') yield String(h)

	else if (Array.isArray(h)) for (h of h.flat(Infinity)) yield* run(h)

	else if (typeof h === 'object' && 'nodeName' in h) {

		const { nodeName, fallback = nodeName.fallback, ...rest } = h

		if (typeof nodeName === 'function') yield* runFn(Object.assign(nodeName, { fallback }), rest)

		else yield h
	}

	else yield String(h)
}

const runFn = function* (fn, h) {

	if (fn.constructor.name === 'GeneratorFunction') yield runGeneratorFn(fn, h)

	else yield* run(fn(h))
}

const runGeneratorFn = (fn, h) => {

	const attrs = { ...fn.attrs }, args = { ...fn.args }

	for (const [key, value] of Object.entries(h)) {

		if (key.startsWith('attr:')) attrs[key.slice(5)] = value

		else if (Special.has(key) || key.startsWith('set:')) attrs[key] = value

		else args[key] = value
	}

	return { ...attrs, nodeName: fn.is ?? 'div', skip: true, ref: createComponentRef(fn, h.skip, h.ref, args) }
}

const reconcile = (h, el, child) => {

	if (typeof h === 'string') return reconcileText(h, el, child)

	if (h instanceof Node) return insertNode(h, el, child)

	return reconcileElement(h, el, child)
}

const reconcileText = (text, el, child) => {

	while (child && child.nodeType != 3) child = child.nextSibling

	if (child) {

		if (child.data != text) child.data = text

		return child.nextSibling

	} else {

		const node = document.createTextNode(text)

		before(el, node, child)

		return child
	}
}

const insertNode = (node, el, child) => {

	if (node !== child) before(el, node, child)

	return child
}

const reconcileElement = (h, el, child) => {

	let node = child

	while (node && !(node.localName == h.nodeName && (node[Key] ??= h.key) == h.key)) node = node.nextSibling

	node ??= Object.assign(document.createElementNS(h.xmlns ?? el.namespaceURI, h.nodeName), { [Key]: h.key })

	if (h.memo == null || some(node[Memo], node[Memo] = h.memo)) {

		const next = {}, prev = node[Cache] ?? getAttributes(node)

		for (const name of Object.keys({ ...prev, ...h })) {

			if (Omit.has(name)) continue

			const value = next[name] = h[name]

			if (prev[name] === value) continue

			if (name.startsWith('set:')) node[name.slice(4)] = value

			else if (value == null || value === false) node.removeAttribute(name)

			else node.setAttribute(name, value === true ? '' : value)
		}

		node[Cache] = next

		if (!h.skip) render(h.children, node)

		if (typeof h.ref === 'function') (node[Ref] = h.ref)(node)
	}

	if (node === child) {

		return child.nextSibling

	} else {

		before(el, node, child)

		return child
	}
}

const getAttributes = node => Array.from(node.attributes).reduce((o, a) => (o[a.name] = a.value, o), {})

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

const createComponentRef = (fn, skip, ref, args) => el => {

	if (!el) return

	el[Generator] ??= attachComponent(el, fn)

	el[Ref] = disposeComponent.bind(null, ref, el)

	Object.assign(el[Args] ??= {}, args)

	if (!skip) el.next()
}

const attachComponent = (el, fn) => {

	Object.assign(el, componentMethods)

	el[Context] = Object.create(current()?.[Context] ?? null)

	return fn
}

const disposeComponent = (ref, component, el) => {

	if (typeof ref === 'function') ref(el)

	if (!el) component.return()
}

const componentMethods = {

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

		for (let el = this; el; el = el.parentNode) {

			if (typeof el[Iterator]?.throw === 'function') {

				try {

					return render(el[Iterator].throw(value).value, el)

				} catch (error) {

					value = new Error(error instanceof Error ? error.message : error, { cause: value })
				}
			}
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
