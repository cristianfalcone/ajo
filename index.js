const
	Key = Symbol.for('ajo.key'),
	Memo = Symbol.for('ajo.memo'),
	Ref = Symbol.for('ajo.ref'),
	Cache = Symbol.for('ajo.cache')

const Omit = new Set(['nodeName', 'children', 'key', 'skip', 'memo', 'ref'])

export const Fragment = props => props.children

export const h = (type, props, ...children) => {

	(props ??= {}).nodeName = type

	if (!('children' in props) && children.length) props.children = children.length == 1 ? children[0] : children

	return props
}

export const render = (h, el, child = el.firstChild, ref) => {

	for (h of normalize(h)) {

		let node = child

		if (typeof h === 'string') {

			while (node && node.nodeType != 3) node = node.nextSibling

			node ? node.data != h && (node.data = h) : node = document.createTextNode(h)

		} else if (h instanceof Node) {

			node = h

		} else {

			while (node && !(node.localName == h.nodeName && (node[Key] ??= h.key) == h.key)) node = node.nextSibling

			node ??= Object.assign(document.createElementNS(h.xmlns ?? el.namespaceURI, h.nodeName), { [Key]: h.key })

			if (h.memo == null || some(node[Memo], node[Memo] = h.memo)) {

				let value, next = {}, prev = node[Cache] ?? Array.from(node.attributes).reduce((o, a) => (o[a.name] = a.value, o), {})

				for (const name of Object.keys(Object.assign({}, prev, h))) {

					if (Omit.has(name) || prev[name] === (value = next[name] = h[name])) continue

					if (name.startsWith('set:')) node[name.slice(4)] = value

					else if (value == null || value === false) node.removeAttribute(name)

					else node.setAttribute(name, value === true ? '' : value)
				}

				node[Cache] = next

				if (!h.skip) render(h.children, node)

				if (typeof h.ref == 'function') (node[Ref] = h.ref)(node)
			}
		}

		node === child ? child = child.nextSibling : before(el, node, child)
	}

	while (child && child != ref) {

		const next = child.nextSibling

		if (child.nodeType == 1) unref(child)

		el.removeChild(child)

		child = next
	}
}

const some = (a, b) => Array.isArray(a) && Array.isArray(b) ? a.some((v, i) => v !== b[i]) : a !== b

const normalize = function* (h, buffer = { h: '' }, root = true) {

	for (h of Array.isArray(h) ? h.flat(Infinity) : [h]) {

		if (h == null || typeof h == 'boolean') continue

		if (typeof h == 'object' && 'nodeName' in h) {

			if (buffer.h) yield buffer.h, buffer.h = ''

			if (typeof h.nodeName == 'function') {

				if (h.nodeName.constructor.name == 'GeneratorFunction') {

					const attrs = Object.assign({}, h.nodeName.attrs), args = Object.assign({}, h.nodeName.args)

					for (const key in h) {

						const value = h[key]

						if (key.startsWith('attr:')) attrs[key.slice(5)] = value

						else if (key == 'key' || key == 'memo' || key.startsWith('set:')) attrs[key] = value

						else args[key] = value
					}

					attrs.nodeName = h.nodeName.is ?? 'div'

					attrs.skip = true

					attrs.ref = next.bind(null, h.nodeName, args)

					yield attrs

				} else yield* normalize(h.nodeName(h), buffer, false)

			} else yield h

		} else buffer.h += h
	}

	if (root && buffer.h) yield buffer.h
}

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

const
	Generator = Symbol.for('ajo.generator'),
	Iterator = Symbol.for('ajo.iterator'),
	Args = Symbol.for('ajo.args'),
	Context = Symbol.for('ajo.context'),
	Effects = Symbol.for('ajo.effects'),
	Disposers = Symbol.for('ajo.disposers'),
	Cleanups = Symbol.for('ajo.cleanups')

const next = (gen, h, el) => {

	if (!el) return

	el[Generator] ??= (Object.assign(el, methods), el[Context] = Object.create(current?.[Context] ?? null), gen)

	const { skip, ref, ...args } = h

	el[Ref] = dispose.bind(null, ref, el)

	Object.assign(el[Args] ??= {}, args)

	if (!skip) el.next()
}

const dispose = (ref, component, el) => {

	if (typeof ref == 'function') ref(el)

	if (!el) component.return()
}

const refresh = el => el.isConnected && el.render()

const flush = (el, set = Effects) => {

	if (set == Effects) for (const child of el.children) flush(child, set)

	if (el[set]?.size) for (const fn of el[set]) {

		el[set].delete(fn)

		try {

			const disposer = fn()

			if (set == Effects && typeof disposer == 'function') (el[Disposers] ??= new Set).add(disposer)

		} catch (value) {

			el.throw(value)
		}
	}
}

const run = (queue, fn) => {

	for (const el of queue.set) fn(el)

	queue.set.clear()

	queue.queued = false
}

const Microtask = () => queueMicrotask.bind(null, run.bind(null, Microtask, refresh))

const Animation = () => requestAnimationFrame.bind(null, run.bind(null, Animation, refresh))

const Effect = () => {

	const channel = new MessageChannel

	channel.port1.onmessage = run.bind(null, Effect, flush)

	return channel.port2.postMessage.bind(channel.port2, null)
}

const schedule = (queue, el) => {

	if (!queue.queued) {

		(queue.run ??= queue())()

		queue.queued = true
	}

	const set = queue.set ??= new Set

	for (const i of set) {

		if (i.contains(el)) return

		if (el.contains(i)) set.delete(i)
	}

	set.add(el)
}

const add = (el, set, fn) => {

	if (typeof fn != 'function') return

	(el[set] ??= new Set).add(fn)

	return () => el[set].delete(fn)
}

let current = null

const methods = {

	*[Symbol.iterator]() {
		while (true) yield this[Args]
	},

	render() {
		if (!current?.contains(this)) this.next()
	},

	queueMicrotask() {
		schedule(Microtask, this)
	},

	requestAnimationFrame() {
		schedule(Animation, this)
	},

	effect(fn) {
		return add(this, Effects, fn)
	},

	cleanup(fn) {
		return add(this, Cleanups, fn)
	},

	next() {

		const parent = current

		current = this

		try {

			if (this[Disposers]?.size) flush(this, Disposers)

			const iteration = (this[Iterator] ??= this[Generator].call(this, this[Args])).next()

			if (this[Effects]?.size) schedule(Effect, this)

			render(iteration.value, this)

			this[Ref]?.(this)

			if (iteration.done) this.return()

		} catch (value) {

			this.throw(value)

		} finally {

			current = parent
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

			if (this[Disposers]?.size) flush(this, Disposers)

			if (this[Cleanups]?.size) flush(this, Cleanups)

			this[Iterator]?.return()

		} catch (value) {

			this.throw(value)

		} finally {

			this[Iterator] = null
		}
	}
}

export const context = (fallback, key = Symbol()) => function (...args) {

	const ctx = this ?? current

	return ctx ? args.length == 0 ? key in ctx[Context] ? ctx[Context][key] : fallback : ctx[Context][key] = args[0] : fallback
}
