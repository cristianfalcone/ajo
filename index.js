const { isArray, prototype: { slice } } = Array, { assign, setPrototypeOf, hasOwn } = Object, isIterable = v => typeof v !== 'string' && typeof v?.[Symbol.iterator] === 'function'

export const Fragment = ({ children }) => children

export const h = function (nodeName, attrs) {

	const { length } = arguments; (attrs ??= {}).nodeName = nodeName

	if (!('children' in attrs || length < 3)) attrs.children = length === 3 ? arguments[2] : slice.call(arguments, 2)

	return attrs
}

export const render = (h, parent, ns = parent.namespaceURI) => {

	let child = parent.firstChild

	for (h of normalize(h)) {

		let node = child

		if (typeof h === 'string') {

			while (node && node.nodeType != 3) node = node.nextSibling

			node ? node.data != h && (node.data = h) : node = document.createTextNode(h)

		} else if (h instanceof Node) {

			node = h

		} else {

			const { nodeName, xmlns = nodeName === 'svg' ? 'http://www.w3.org/2000/svg' : ns, key, skip, memo, ref, children } = h

			while (node && !(node.localName === nodeName && (node.$key ??= key) == key)) node = node.nextSibling

			node ??= assign(document.createElementNS(xmlns, nodeName), { $key: key })

			if (memo == null || some(node.$memo, node.$memo = memo)) {

				const { $attrs } = node, attrs = {}, args = {}

				for (const name in assign({}, $attrs, h)) {

					if (name.startsWith('arg:')) {

						args[name.slice(4)] = h[name]

						continue
					}

					if (omit.has(name)) continue

					const value = attrs[name] = h[name]

					if (value === $attrs?.[name]) continue

					if (name.startsWith('set:')) node[name.slice(4)] = value

					else if (value == null || value === false) node.removeAttribute(name)

					else node.setAttribute(name, value === true ? '' : value)
				}

				node.$attrs = attrs

				if (!skip) render(children, node, xmlns)

				if (typeof ref === 'function') (node.$ref = ref)(node, args)
			}
		}

		node === child ? child = child.nextSibling : before(parent, node, child)
	}

	while (child) {

		const next = child.nextSibling

		if (child.nodeType === 1) unref(child)

		parent.removeChild(child)

		child = next
	}
}

const normalize = function* (h, buffer = { value: '' }, root = true) {

	for (h of isIterable(h) ? h : [h]) {

		if (h == null || typeof h === 'boolean') continue

		if (hasOwn(h, 'nodeName')) {

			const { value } = buffer, { nodeName } = h, type = typeof nodeName

			if (value) yield value, buffer.value = ''

			if (type === 'function') {

				if (nodeName.constructor.name === 'GeneratorFunction') {

					const { is = nodeName.is ?? 'div', ref } = h

					h.ref = (el, $args) => el && ((el.$gen ??= (new Component(el, is), nodeName)), assign(el, { $ref: (v, a) => (v ?? el.return(), typeof ref === 'function' && ref(v, a)), $args }).next())

					h.skip = true, h.nodeName = is, delete h.is, 'children' in h && (h['arg:children'] = h.children, delete h.children), yield h

				} else delete h.nodeName, yield* normalize(nodeName(h), buffer, false)

			} else if (type === 'string') yield h

		} else isIterable(h) ? yield* normalize(h, buffer, false) : buffer.value += h
	}

	if (root && buffer.value) yield buffer.value
}

const some = (a, b) => isArray(a) && isArray(b) ? a.some((v, i) => v !== b[i]) : a !== b

const omit = new Set('nodeName,xmlns,key,skip,memo,ref,children'.split(','))

const before = (parent, node, child) => {

	if (node.contains(document.activeElement)) {

		const ref = node.nextSibling

		while (child && child != node) {

			const next = child.nextSibling

			parent.insertBefore(child, ref)

			child = next
		}

	} else parent.insertBefore(node, child)
}

const unref = ({ children, $ref }) => {

	for (const child of children) unref(child)

	if (typeof $ref === 'function') $ref(null)
}

class Component {

	constructor(el, is) {

		setPrototypeOf(el, setPrototypeOf(this.constructor.prototype, resolve(is, el.namespaceURI).prototype))
	}

	*[Symbol.iterator]() { while (true) yield this.$args }

	refresh() { schedule(this) }

	next() {

		try {

			render((this.$it ??= this.$gen.call(this, this.$args)).next().value, this)

			if (typeof this.$ref === 'function') this.$ref(this)

		} catch (value) {

			this.throw(value)
		}
	}

	throw(value) {

		for (let el = this; el; el = el.parentNode) if (typeof el.$it?.throw === 'function') try { return render(el.$it.throw(value).value, el) } catch { }

		throw value
	}

	return() {

		try { this.$it?.return() } catch (value) { this.throw(value) } finally { this.$it = null }
	}
}

let registry, queue, queued

const resolve = (is, ns) => {

	let constructor = (registry ??= new Map).get(is)

	if (!constructor) {

		({ constructor } = document.createElementNS(ns, is))

		registry.set(is, constructor === HTMLUnknownElement ? constructor = HTMLElement : constructor)
	}

	return constructor
}

const schedule = el => {

	if ((queue ??= new Set).has(el)) queue.delete(el)

	for (const n of queue) {

		if (n.contains(el)) return

		if (el.contains(n)) queue.delete(n)
	}

	queue.add(el), queued ??= requestAnimationFrame(run)
}

const run = () => {

	for (const el of queue) if (el.isConnected) el.next()

	queue.clear(), queued = null
}
