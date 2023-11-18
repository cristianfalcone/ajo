import { isArray, slice, assign, h, normalize } from './jsx.js'

const Key = Symbol(), Memo = Symbol(), Attrs = Symbol()

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

let id = 0, queued = null, queue, types

export const component = (fn, { as } = {}) => {

	if (fn?.constructor?.name !== 'GeneratorFunction') throw new TypeError('fn is not a generator function')

	const is = `host-${id++}`

	class Host extends resolve(as) {

		generator
		args
		ref

		refresh() {
			enqueue(this)
		}

		next() {

			try {

				render((this.generator ??= fn.call(this, this.args)).next().value, this)
				
				if (typeof this.ref === 'function') this.ref(this)

			} catch (value) {

				this.throw(value)
			}
		}

		throw(value) {

			for (let host = this; host; host = host.parentNode) {

				if (typeof host.generator?.throw === 'function') {

					try {

						return render(host.generator.throw(value).value, host)

					} catch (value) {

						continue
					}
				}
			}

			throw value
		}

		*[Symbol.iterator]() {
			while (true) yield this.args
		}

		disconnectedCallback() {
			try {

				this.generator?.return()

				if (typeof this.ref === 'function') this.ref(null)

			} finally {

				this.generator = null
			}
		}
	}

	customElements.define(is, Host, { extends: as })

	return ({ attrs = {}, args = {}, ref, ...rest }) => {

		for (const name in rest) {
			
			if (name.startsWith('arg:')) args[name.slice(4)] = rest[name]
			
			else (name === 'children' ? args : attrs)[name] = rest[name]
		}
	
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
