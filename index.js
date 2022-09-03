import { notify } from 'element-notifier'

export const
	Fragment = ({ children }) => children,

	For = ({ is, each, by, children, ref, ...props }) => h(is ?? 'div', {
		...props, skip: true, ref: host => iterate(host, each, by, children, ref)
	}),

	h = (nodeName, props, ...children) => ({ children: children.length == 0 ? null : children.length == 1 ? children[0] : children, ...props, nodeName }),

	render = (h, host, to, root = host) => {

		let child = host.firstChild, node

		root == host && (root.$mo ??= notify((host, connected) => connected || root.contains(host) || '$cleanups' in host && dispose(host), root))

		for (h of normalize(h)) {

			if (h instanceof Node) node = h

			else if (typeof h == 'string') {

				for (node = child; node != to; node = node.nextSibling) if (node.nodeType == 3) break
				node == to ? node = document.createTextNode(h) : node.data != h && (node.data = h)

			} else {

				const { nodeName, block, skip, children, ref, ...props } = h

				for (node = child; node != to; node = node.nextSibling) if (node.localName == nodeName) break
				node == to && (node = document.createElement(nodeName))

				if (block == null || some(node.$deps, node.$deps = block)) {
					update(props, node)
					skip || render(children, node, null, null)
					isFunction(ref) && ref(node)
				}
			}

			node == child ? child = child.nextSibling : before(host, node, child)
		}

		while (child != to) {
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
			render((host.$render ??= host.$setup(host))(host.$params), host, null, null)
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
		for (let fn; host; host = host.parentNode) if (isFunction(fn = host.$interceptor)) return render(fn(error), host, null, null)
		throw error
	},

	cleanup = (host, fn) => isFunction(fn) && (host.$cleanups ??= new Set).add(fn),

	clx = o => keys(o).filter(k => o[k]).join(' ') || null,

	stx = o => entries(o).map(t => t.join(':')).join(';') || null,

	keb = o => keys(o).reduce((r, k) => ((r[k.replace(search, replace).toLowerCase()] = o[k]), r), {})

const
	{ isArray, from } = Array, { keys, entries } = Object, isFunction = v => typeof v == 'function',

	noop = () => { }, ref = v => (...args) => args.length ? v = args[0] : v,

	map = list => list.reduce(set, new Map), set = (m, v, i) => (m.set(v, i), m),

	some = (a, b) => (isArray(a) && isArray(b)) ? a.some((v, i) => v !== b[i]) : a !== b,

	reduce = v => from(v).reduce(assign, {}), assign = (v, { name, value }) => ((v[name] = value), v),

	proxy = { firstChild: null, insertBefore: node => proxy.firstChild ??= node },

	search = /([a-z0-9])([A-Z])/g, replace = '$1-$2',

	normalize = function* (h, buffer = ref(''), root = true) {

		let text

		for (h of isArray(h) ? h : [h]) {
			if (h == null || typeof h == 'boolean') continue
			if (typeof h.nodeName == 'string') ((text = buffer()) && (buffer(''), yield text)), yield h
			else if (isFunction(h.nodeName)) yield* normalize(h.nodeName(h), buffer, false)
			else isArray(h) ? yield* normalize(h, buffer, false) : buffer(buffer() + h)
		}

		root && (text = buffer()) && (yield text)
	},

	update = (props, host) => {

		const prev = host.$props ?? (host.hasAttributes() ? reduce(host.attributes) : {})

		for (const name in { ...prev, ...(host.$props = props) }) {

			let value = props[name]

			if (value !== prev[name])
				if (name.startsWith('set:')) host[name.slice(4)] = value
				else if (value == null || value === false) host.removeAttribute(name)
				else host.setAttribute(name, value === true ? '' : value)
		}
	},

	before = (host, node, child) => {
		if (node.contains?.(document.activeElement)) {

			const ref = node.nextSibling

			while (child && child !== node) {
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
			del = node => map.delete(node.$key),
			clr = each !== host.$each,
			len = (host.$each = each).length,
			a = from(host.childNodes),
			b = new Array(len)

		clr && map.clear()

		for (let last, index = 0; index < len; index++) {

			const item = each[index], key = by(item, index)

			proxy.firstChild = (clr ? a[index] : map.get(key)) ?? last?.cloneNode(true)
			render(fn(item), proxy, proxy.firstChild?.nextSibling, null)

			last = proxy.firstChild
			proxy.firstChild = null

			map.set(last.$key = key, b[index] = last)
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

		host.$setup ??= isFunction(setup) ? setup : noop
		host.$params = { ...setup.params, ...params }

		refresh(host)
		isFunction(ref) && ref(host)
	},

	dispose = host => {
		const cleanups = from(host.$cleanups)
		host.$cleanups.clear()
		for (const fn of cleanups) fn(host)
	}
