const Key = Symbol(), Memo = Symbol(), Attrs = Symbol()

const { isArray, prototype: { slice } } = Array, { assign } = Object

export const Fragment = ({ children }) => children

export const h = function (nodeName, attrs) {

	const node = { ...attrs, nodeName }, { length } = arguments

	if (!('children' in node || length < 3)) node.children = length === 3 ? arguments[2] : slice.call(arguments, 2)

	return node
}

export const render = (h, host, ns) => {

	let child = host.firstChild

	for (h of normalize(h)) {

		let node = child

		if (typeof h === 'string') {

			while (node && node.nodeType != 3) node = node.nextSibling

			node ? node.data != h && (node.data = h) : node = document.createTextNode(h)

		} else {

			const { xmlns = ns, nodeName, is, key, skip, memo, ref, children, ...attrs } = h

			while (node && !(node.localName === nodeName && (node[Key] ??= key) == key)) node = node.nextSibling

			node ??= create(xmlns, nodeName, is, key)

			if (memo == null || some(node[Memo], node[Memo] = memo)) {

				update(attrs, node)

				if (!skip) render(children, node, xmlns)

				if (typeof ref === 'function') ref(node)
			}
		}

		node === child ? child = child.nextSibling : before(host, node, child)
	}

	while (child) {

		const next = child.nextSibling

		host.removeChild(child)

		child = next
	}
}

const some = (a, b) => isArray(a) && isArray(b) ? a.some((v, i) => v !== b[i]) : a !== b

const create = (ns, name, is, key) => {

	const node = ns ? document.createElementNS(ns, name, { is }) : document.createElement(name, { is })

	node[Key] = key

	return node
}

const update = (attrs, host) => {

	const prev = host[Attrs] ??= slice.call(host.attributes).reduce((o, { name, value }) => (o[name] = value, o), {})

	for (const name in { ...prev, ...(host[Attrs] = attrs) }) {

		const value = attrs[name]

		if (value === prev[name]) continue

		if (name.startsWith('set:')) host[name.slice(4)] = value

		else if (value == null || value === false) host.removeAttribute(name)

		else host.setAttribute(name, value === true ? '' : value)
	}
}

const before = (host, node, child) => {

	if (node.contains(document.activeElement)) {

		const ref = node.nextSibling

		while (child && child != node) {

			const next = child.nextSibling

			host.insertBefore(child, ref)

			child = next
		}

	} else host.insertBefore(node, child)
}

const normalize = function* (h, buffer = { value: '' }, root = true) {

	for (h of isArray(h) ? h : [h]) {

		if (h == null || typeof h === 'boolean') continue

		const { nodeName, ...attrs } = h, type = typeof nodeName

		if (type === 'string') buffer.value && (yield buffer.value, buffer.value = ''), yield h

		else if (type === 'function') yield* normalize(nodeName(attrs), buffer, false)

		else isArray(h) ? yield* normalize(h, buffer, false) : buffer.value += h
	}

	if (root && buffer.value) yield buffer.value
}

let id = 0, queued = null, queue, types

export const component = (fn, { as } = {}) => {

	if (fn?.constructor?.name !== 'GeneratorFunction') throw new TypeError('fn is not a generator function')

	const is = `host-${id++}`

	class Host extends resolve(as) {

		generator
		args
		ref

		disconnectedCallback() {
			this.return()
		}

		refresh() {
			enqueue(this)
		}

		next({ method = 'next', argument } = {}) {

			try {

				const { done, value } = (this.generator ??= fn.call(this, this.args))[method](argument)

				if (done) return method !== 'return' && this.return(value)

				render(value, this)

				if (typeof this.ref === 'function') this.ref(this)

			} catch (value) {

				this.throw(value)
			}
		}

		throw(value) {

			for (let host = this.parentNode; host; host = host.parentNode) {

				if (typeof host.generator?.throw === 'function') {

					return host.next({ method: 'throw', argument: value })
				}
			}

			throw value
		}

		return(value) {

			try {

				this.next({ method: 'return', argument: value })

			} finally {

				this.generator = null
			}
		}

		*[Symbol.iterator]() {
			while (this.isConnected) yield this.args
		}
	}

	customElements.define(is, Host, { extends: as })

	return ({ attrs = {}, args = {}, ref, ...rest }) => {

		for (const name in rest) name.startsWith('arg:') ? args[name.slice(4)] = rest[name] : (name === 'children' ? args : attrs)[name] = rest[name]
	
		return h(as || is, assign(attrs, { is: as && is, skip: true, ref: host => assign(host, { args, ref }).refresh() }))
	}
}

const enqueue = host => {

	(queue ??= new Set).add(host)

	queued ??= requestAnimationFrame(() => {

		for (const host of queue) if (host.isConnected) host.next()

		queue.clear()

		queued = null
	})
}

const resolve = type => {

	let constructor = (types ??= new Map).get(type)

	if (!constructor) {

		constructor = document.createElement(type).constructor

		if (constructor === HTMLUnknownElement) constructor = HTMLElement

		types.set(type, constructor)
	}

	return constructor
}
