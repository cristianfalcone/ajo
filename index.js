export const Fragment = ({ children }) => children

export const h = function (type, props) {

	const { length } = arguments; (props ??= create(null)).nodeName = type

	if (!('children' in props || length < 3)) props.children = length === 3 ? arguments[2] : slice.call(arguments, 2)

	return props
}

export const render = (h, el) => {

	let child = el.firstChild

	for (h of normalize(h)) {

		let node = child

		if (typeof h === 'string') {

			while (node && node.nodeType != 3) node = node.nextSibling

			node ? node.data != h && (node.data = h) : node = document.createTextNode(h)

		} else if (h instanceof Node) {

			node = h

		} else {

			const { nodeName, key, skip, memo, ref, children } = h

			while (node && !(node.localName === nodeName && (node.$key ??= key) == key)) node = node.nextSibling

			node ??= assign(document.createElementNS(h.xmlns ?? nodeName === 'svg' ? svg : el.namespaceURI, nodeName), { $key: key })

			if (memo == null || some(node.$memo, node.$memo = memo)) {

				const { $props } = node, props = {}

				for (const name of keys(assign({}, $props, h))) {

					if (omit.has(name)) continue

					const value = props[name] = h[name]

					if (value === $props?.[name]) continue

					if (name.startsWith('set:')) node[name.slice(4)] = value

					else if (value == null || value === false) node.removeAttribute(name)

					else node.setAttribute(name, value === true ? '' : value)
				}

				node.$props = props

				if (!skip) render(children, node)

				if (typeof ref === 'function') (node.$ref = ref)(node)
			}
		}

		node === child ? child = child.nextSibling : before(el, node, child)
	}

	while (child) {

		const next = child.nextSibling

		if (child.nodeType === 1) unref(child)

		el.removeChild(child)

		child = next
	}
}

const { isArray, prototype: { slice } } = Array, { create, keys, assign, hasOwn, setPrototypeOf, getPrototypeOf } = Object

const svg = 'http://www.w3.org/2000/svg', omit = new Set('nodeName,key,skip,memo,ref,children'.split(','))

const isIterable = v => typeof v !== 'string' && typeof v?.[Symbol.iterator] === 'function'

const some = (a, b) => isArray(a) && isArray(b) ? a.some((v, i) => v !== b[i]) : a !== b

const normalize = function* (h, buffer = { value: '' }, root = true) {

	for (h of isIterable(h) ? h : [h]) {

		if (h == null || typeof h === 'boolean') continue

		if (hasOwn(h, 'nodeName')) {

			const { value } = buffer, { nodeName } = h, type = typeof nodeName

			if (value) yield value, buffer.value = ''

			if (type === 'function') {

				delete h.nodeName

				if (nodeName.constructor.name === 'GeneratorFunction') {

					const args = {}, attrs = assign({}, nodeName.attrs)

					for (const key of keys(h)) {

						const value = h[key]

						if (key.startsWith('attr:')) attrs[key.slice(5)] = value

						if (key === 'key' || key === 'memo') attrs[key] = value

						else args[key] = value
					}

					attrs.nodeName = nodeName.is ?? 'div', attrs.skip = true, attrs.ref = next.bind(null, nodeName, args), yield attrs

				} else yield* normalize(nodeName(h), buffer, false)

			} else if (type === 'string') yield h

		} else isIterable(h) ? yield* normalize(h, buffer, false) : buffer.value += h
	}

	if (root && buffer.value) yield buffer.value
}

const next = (gen, h, el) => {

	if (!el) return

	el.$gen ??= (new Component(el), gen), el.$ref = dispose.bind(null, el), el.$args = h, el.next()
}

const dispose = (component, el) => el ?? component.return()

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

	const { $ref } = el

	if (typeof $ref === 'function') $ref(null)

	for (const key of keys(el)) el[key] = null
}

let queue, queued

const run = () => {

	for (const el of queue) if (el.isConnected) el.next()

	queue.clear(), queued = null
}

class Component {

	constructor(el) { setPrototypeOf(el, setPrototypeOf(getPrototypeOf(this), getPrototypeOf(el))) }

	*[Symbol.iterator]() { while (true) yield this.$args ?? {} }

	refresh() {

		if ((queue ??= new Set).has(this)) queue.delete(this)

		for (const el of queue) {

			if (el.contains(this)) return

			if (this.contains(el)) queue.delete(el)
		}

		queue.add(this), queued ??= requestAnimationFrame(run)
	}

	next() {

		try {

			render((this.$it ??= this.$gen.call(this, this.$args ?? {})).next().value, this)

			if (typeof this.$ref === 'function') this.$ref(this)

		} catch (value) {

			this.throw(value)
		}
	}

	throw(value) {

		for (let el = this; el; el = el.parentNode) if (typeof el.$it?.throw === 'function') try {

			return render(el.$it.throw(value).value, el)

		} catch { }

		throw value
	}

	return() {

		try { this.$it?.return() } catch (value) { this.throw(value) } finally { this.$it = null }
	}
}
