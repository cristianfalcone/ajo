export const
	Fragment = ({ children }) => children,

	For = ({ is, each, by, children, ref, ...props }) => h(is ?? 'div', {
		...props, skip: true, ref: host => iterate(host, each, by, children, ref)
	}),

	h = (nodeName, props, ...children) => {
		const { length } = children
		children = length == 0 ? null : length == 1 ? children[0] : children
		return { children, ...props, nodeName }
	},

	render = (h, host, ns) => {

		let child = host.firstChild

		for (h of normalize(h)) {

			let node = child

			if (h instanceof Node) node = h

			else if (typeof h == 'string') {

				while (node && node.nodeType != 3) node = node.nextSibling
				node ? node.data != h && (node.data = h) : node = document.createTextNode(h)

			} else {

				const { xmlns = ns, nodeName, key, block, skip, children, ref, ...props } = h

				while (node && !(node.localName == nodeName && (node.$key ??= key) == key)) node = node.nextSibling
				node ??= create(xmlns, nodeName, key)

				if (block == null || some(node.$deps, node.$deps = block)) {
					update(props, node)
					skip || render(children, node, xmlns)
					isFunction(ref) && ref(node)
				}
			}

			node == child ? child = child.nextSibling : before(host, node, child)
		}

		while (child) {
			const next = child.nextSibling
			host.removeChild(child)
			child = next
		}
	},

	component = setup => ({ is, props, ref, ...params }) => h(is ?? setup.is ?? 'div', {
		...setup.props, ...props, skip: true, ref: host => run(host, setup, params, ref)
	}),

	refresh = host => {
		try {
			render((host.$render ??= host.$setup(host))(host.$params), host)
		} catch (error) {
			propagate(host, error)
		}
	},

	provide = (host, key, value) => (host.$provisions ??= new Map).set(key, value),

	consume = (host, key, fallback) => {
		for (let map; host; host = host.parentNode) if ((map = host.$provisions) && map.has(key)) return map.get(key)
		return fallback
	},

	intercept = (host, fn) => isFunction(fn) && (host.$interceptor = fn),

	propagate = (host, error) => {
		for (let fn; host; host = host.parentNode) if (isFunction(fn = host.$interceptor)) return render(fn(error), host)
		throw error
	},

	cleanup = (host, fn) => isFunction(fn) && (host.$cleanups ??= new Set).add(fn),

	clx = o => keys(o).filter(k => o[k]).join(' ') || null,

	stx = o => entries(o).map(t => t.join(':')).join(';') || null,

	keb = o => keys(o).reduce((r, k) => ((r[k.replace(search, replace).toLowerCase()] = o[k]), r), {})

const
	{ isArray, from } = Array, { keys, entries } = Object,

	isFunction = v => typeof v == 'function', noop = () => { }, on = (host, type, v) => {

		let fn, map

		if (fn = (map = host.$on ??= {})[type]) {
			host.removeEventListener(type, fn, fn.options), map[type] = null
		}

		if (typeof (fn = (v = isArray(v) ? v : [v])[0]) == 'function') {
			host.addEventListener(type, fn = map[type] = fn.bind(null, v[1]), fn.options = v[2])
		}
	},

	map = list => list.reduce(set, new Map), set = (m, v, i) => (m.set(v, i), m),

	some = (a, b) => (isArray(a) && isArray(b)) ? a.some((v, i) => v !== b[i]) : a !== b,

	reduce = v => from(v).reduce(assign, {}), assign = (v, { name, value }) => ((v[name] = value), v),

	create = (ns, name, key) => {
		const node = ns ? document.createElementNS(ns, name) : document.createElement(name)
		return node.$key = key, node
	},

	proxy = { firstChild: null, insertBefore: node => proxy.firstChild ??= node }, handler = {
		get(target, key) {
			const value = key == 'nextSibling' ? null : target[key]
			return isFunction(value) ? value.bind(target) : value
		},
	},

	search = /([a-z0-9])([A-Z])/g, replace = '$1-$2',

	normalize = function* (h, buffer = { t: '' }, root = true) {

		let t

		for (h of isArray(h) ? h : [h]) {
			if (h == null || typeof h == 'boolean') continue
			else if (typeof h.nodeName == 'string') (t = buffer.t && (buffer.t = '', yield t)), yield h
			else if (isFunction(h.nodeName)) yield* normalize(h.nodeName(h), buffer, false)
			else isArray(h) ? yield* normalize(h, buffer, false) : buffer.t += h
		}

		root && (t = buffer.t) && (yield t)
	},

	update = (props, host) => {

		const prev = host.$props ??= host.hasAttributes() ? reduce(host.attributes) : {}

		for (const name in { ...prev, ...(host.$props = props) }) {

			let value = props[name]

			if (name.startsWith('on:')) {
				some(value, prev[name]) && on(host, name.slice(3), value)
			} else if (value !== prev[name])
				if (name.startsWith('set:')) host[name.slice(4)] = value
				else if (value == null || value === false) host.removeAttribute(name)
				else host.setAttribute(name, value === true ? '' : value)
		}
	},

	before = (host, node, child) => {
		if (node.contains?.(document.activeElement)) {

			const ref = node.nextSibling

			while (child && child != node) {
				const next = child.nextSibling
				host.insertBefore(child, ref)
				child = next
			}

		} else host.insertBefore(node, child)
	},

	iterate = (host, each, by, fn, ref) => {

		each = isArray(each) ? each : []
		by = isFunction(by) ? by : v => v
		fn = isFunction(fn) ? fn : noop

		const
			map = host.$for ??= new Map,
			del = node => map.delete(node.$by),
			clr = each !== host.$each,
			len = (host.$each = each).length,
			a = from(host.childNodes),
			b = new Array(len)

		clr && map.clear()

		for (let child, index = 0; index < len; index++) {

			const item = each[index], key = by(item, index)

			child = (clr ? a[index] : map.get(key))

			proxy.firstChild = child ? new Proxy(child, handler) : null
			render(fn(item), proxy)

			child ??= proxy.firstChild
			proxy.firstChild = null

			map.set(child.$by = key, b[index] = child)
		}

		arrange(host, a, b, del)
		isFunction(ref) && ref(host)
	},

	arrange = (host, a, b, dispose = noop) => {

		const aLen = a.length, bLen = b.length

		let aIndex = 0, bIndex = 0, aValue, bValue, aMap, bMap, i

		while (aIndex !== aLen || bIndex !== bLen) {

			aValue = a[aIndex]
			bValue = b[bIndex]

			if (aValue === null) aIndex++
			else if (bLen <= bIndex) aIndex++, dispose(host.removeChild(aValue))
			else if (aLen <= aIndex) bIndex++, host.appendChild(bValue)
			else if (aValue === bValue) aIndex++, bIndex++
			else {

				aMap ??= map(a)
				bMap ??= map(b)

				if (bMap.get(aValue) == null) aIndex++, dispose(host.removeChild(aValue))
				else {

					host.insertBefore(bValue, aValue), bIndex++

					if ((i = aMap.get(bValue)) != null) {
						if (i > aIndex + 1) aIndex++
						a[i] = null
					}
				}
			}
		}
	},

	run = (host, setup, params, ref) => {

		host.$setup ??= (host.addEventListener('DOMNodeRemovedFromDocument', dispose), isFunction(setup) ? setup : noop)
		host.$params = { ...setup.params, ...params }

		refresh(host)
		isFunction(ref) && ref(host)
	},

	dispose = ({ target }) => {
		(globalThis.queueMicrotask ?? (v => v()))(() => {
			if (document.contains(target)) return

			if ('$cleanups' in target) {
				try {
					for (const fn of target.$cleanups) fn(target)
				} finally {
					target.$cleanups.clear()
				}
			}
		})
	}
