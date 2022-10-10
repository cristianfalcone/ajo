export const

	Fragment = ({ children }) => children,

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

				const { xmlns = ns, nodeName, key, ref, memo, children, [FN]: fn, ...props } = h

				while (node && !(node.localName == nodeName && is(node.$key ??= key, key))) node = node.nextSibling
				node ??= create(xmlns, nodeName, key)

				if (isObject(ref)) {
					ref.current = node
					node.$ref = ref
				}

				if (memo == null || some(node.$deps, node.$deps = memo)) {
					update(props, node)
					isFunction(fn) ? fn(node) : render(children, node, xmlns)
				}
			}

			node == child ? child = child.nextSibling : before(host, node, child)
		}

		while (child) {
			const next = child.nextSibling
			dispose(child)
			host.removeChild(child)
			child = next
		}
	},

	component = fn => ({ nodeName, as, props, key, ref, memo, ...args }) =>

		h(as ?? fn?.as ?? 'c-host', {

			...fn?.props, ...props, key, ref, memo, [FN]: host => {

				host.$fn = isFunction(fn) ? fn : noop
				host.$args = { ...fn?.args, ...args }

				schedule(host)
			}
		}),

	useReducer = (fn, init) => {

		const host = useHost(), hooks = useHooks(), [i, stack] = hooks

		if (i == stack.length) stack[i] = [

			isFunction(init) ? init() : init,

			value => {

				const prev = stack[i][0], next = isFunction(value) ? value(prev) : value

				if (is(prev, stack[i][0] = isFunction(fn) ? fn(prev, next) : next)) return

				runMutations(host)
			}
		]

		return stack[hooks[0]++]
	},

	useMemo = (fn, deps) => {

		const hooks = useHooks(), [i, stack] = hooks

		if (i == stack.length || deps == null || some(deps, stack[i][1])) stack[i] = [fn(), deps]

		return stack[hooks[0]++][0]
	},

	useCatch = fn => {

		const host = useHost(), [value, setValue] = useReducer(), hooks = useHooks(), [i, stack] = hooks

		stack[hooks[0]++] = fn

		host.$catch ??= value => {
			isFunction(stack[i]) && stack[i](value)
			setValue(value)
		}

		return [value, () => setValue()]
	},

	useHost = () => current,
	useState = init => useReducer(null, init),

	useRef = current => useMemo(() => ({ current }), []),
	useCallback = (fn, deps) => useMemo(() => fn, deps),

	useLayout = (fn, deps) => useFx(fn, deps, '$layout'),
	useEffect = (fn, deps) => useFx(fn, deps, '$effect')

const

	{ isArray, from } = Array, { is } = Object, noop = () => { }, FN = Symbol(),

	isObject = v => v && typeof v == 'object', isFunction = v => typeof v == 'function',

	some = (a, b) => (isArray(a) && isArray(b)) ? a.some((v, i) => !is(v, b[i])) : !is(a, b),

	reduce = v => from(v).reduce(assign, {}), assign = (v, { name, value }) => ((v[name] = value), v),

	microtask = globalThis.queueMicrotask ?? (fn => fn()), task = globalThis.requestAnimationFrame ?? microtask,

	create = (ns, name, key) => {
		const node = ns ? document.createElementNS(ns, name) : document.createElement(name)
		return node.$key = key, node
	},

	normalize = function* (h, buffer = { data: '' }, root = true) {

		let data

		for (h of isArray(h) ? h : [h]) {
			if (h == null || typeof h == 'boolean') continue
			if (typeof h.nodeName == 'string') ((data = buffer.data) && (buffer.data = '', yield data)), yield h
			else if (isFunction(h.nodeName)) yield* normalize(h.nodeName(h), buffer, false)
			else isArray(h) ? yield* normalize(h, buffer, false) : buffer.data += h
		}

		root && (data = buffer.data) && (yield data)
	},

	update = (props, host) => {

		const prev = host.$props ??= host.hasAttributes() ? reduce(host.attributes) : {}

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

			while (child && child != node) {
				const next = child.nextSibling
				host.insertBefore(child, ref)
				child = next
			}

		} else host.insertBefore(node, child)
	},

	useHooks = () => current.$hooks ??= [0, []],

	useFx = (fn, deps, key) => {

		const host = useHost(), hooks = useHooks(), [i, stack] = hooks, init = i == stack.length

		if (init) (host[key] ??= new Set).add(stack[i] = [null, fn, deps])

		else if (deps == null || some(deps, stack[i][2])) {
			stack[i][1] = fn
			stack[i][2] = deps
		}

		hooks[0]++
	},

	schedule = host => {

		if (host.$idle) return

		if (globalThis.navigator?.scheduling?.isInputPending()) {

			idleQueue.add(host)
			host.$idle = true

			idleId ??= requestIdleCallback(() => {
				idleId = null
				const queue = from(idleQueue)
				for (const host of queue) {
					idleQueue.delete(host)
					host.$idle = false
					schedule(host)
				}
			})

			return
		}

		runComponent(host)
	},

	runMutations = host => {

		if (host.$queued) return

		host.$queued = true
		microtask(() => {
			host.$queued = false
			runComponent(host)
		})
	},

	runComponent = host => {

		if (host.$idle) {
			idleQueue.delete(host)
			host.$idle = false
		}

		current = host

		if (current.$hooks) current.$hooks[0] = 0

		try {
			host.$h = host.$fn(host.$args)
		} catch (value) {
			propagate(value, host.parentNode)
		} finally {
			current = null
			layoutQueue.add(host)
			host.$layoutQueued = true
			layoutId ??= task(runLayouts)
		}
	},

	runLayouts = () => {

		layoutId = null

		for (const host of layoutQueue) {

			layoutQueue.delete(host)
			host.$layoutQueued = false

			try {
				render(host.$h, host)
				host.$h = null
			} catch (value) {
				propagate(value, host)
			} finally {
				runFx(host, '$layout')
				effectQueue.add(host)
				host.$effectQueued = true
				effectId ??= task(runEffects)
			}
		}
	},

	runEffects = () => {

		effectId = null

		for (const host of effectQueue) {
			effectQueue.delete(host)
			host.$effectQueued = false
			runFx(host, '$effect')
		}
	},

	runFx = (host, key) => {

		if (host[key]) for (const fx of host[key]) {

			const [cleanup, setup] = fx

			if (isFunction(setup)) {
				try {
					if (isFunction(cleanup)) cleanup()
					fx[0] = setup()
				} catch (value) {
					fx[0] = null
					propagate(value, host.parentNode)
				} finally {
					fx[1] = null
				}
			}
		}
	},

	dispose = host => {

		if (host.nodeType != 1) return

		for (const child of host.children) dispose(child)

		if (host.$ref) host.$ref.current = null

		if (!host.$fn) return

		if (host.$idle) {
			idleQueue.delete(host)
			host.$idle = false
		}

		if (host.$layoutQueued) {
			layoutQueue.delete(host)
			host.$layoutQueued = false
		}

		if (host.$effectQueued) {
			effectQueue.delete(host)
			host.$effectQueued = false
		}

		for (const key of ['$layout', '$effect']) if (host[key]) {

			for (const fx of host[key]) {

				host[key].delete(fx)

				try {
					const [cleanup] = fx
					isFunction(cleanup) && cleanup()
				} catch (value) {
					propagate(value, host.parentNode)
				} finally {
					fx[0] = fx[1] = null
				}
			}
		}
	},

	propagate = (value, host) => {
		for (let fn; host; host = host.parentNode) if (isFunction(fn = host.$catch)) return void fn(value)
		throw value
	}

let
	current = null,
	layoutQueue = new Set,
	effectQueue = new Set,
	idleQueue = new Set,
	layoutId = null,
	effectId = null,
	idleId = null
