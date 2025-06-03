const Args = Symbol.for('ajo.args'), Context = Symbol.for('ajo.context'), Marker = '\u0001'

const Void = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

const Special = new Set(['key', 'skip', 'memo', 'ref']), Omit = new Set(['nodeName', 'children'].concat(Array.from(Special)))

export const render = h => Array.from(html(h)).join('')

export const html = function* (h) {

	for (h of normalize(h)) {

		if (typeof h === 'string') yield escape(h)

		else {

			let attrs = ''

			for (const [key, value] of Object.entries(h)) {

				if (Omit.has(key) || key.startsWith('set:') || value == null || value === false) continue

				attrs += value === true ? ` ${key}` : ` ${key}="${escape(String(value))}"`
			}

			if (Void.has(h.nodeName)) {

				yield `<${h.nodeName}${attrs}>`

			} else if (!h.skip) {

				yield `<${h.nodeName}${attrs}>`

				typeof h.children === 'string' && h.children.startsWith(Marker) ? yield h.children.slice(1) : yield* html(h.children)

				yield `</${h.nodeName}>`

			} else {

				yield `<${h.nodeName}${attrs}></${h.nodeName}>`
			}
		}
	}
}

const normalize = function* (h, buffer = { h: '' }, root = true) {

	for (h of Array.isArray(h) ? h.flat(Infinity) : [h]) {

		const type = typeof h

		if (h == null || type === 'boolean') continue

		if (type === 'object' && 'nodeName' in h) {

			if (buffer.h) yield buffer.h, buffer.h = ''

			if (typeof h.nodeName === 'function') {

				if (h.nodeName.constructor.name === 'GeneratorFunction') {

					const attrs = Object.assign({}, h.nodeName.attrs), args = Object.assign({}, h.nodeName.args)

					for (const key in h) {

						const value = h[key]

						if (key.startsWith('attr:')) attrs[key.slice(5)] = value

						else if (Special.has(key) || key.startsWith('set:')) attrs[key] = value

						else args[key] = value
					}

					attrs.nodeName = h.nodeName.is ?? 'div'

					attrs.children = run(h.nodeName, args)

					yield attrs

				} else yield* normalize(h.nodeName(h), buffer, false)

			} else yield h

		} else buffer.h += h
	}

	if (root && buffer.h) yield buffer.h
}

const escape = s => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`), noop = () => { }

let current = null

const run = (gen, args) => {

	let self, children

	try {

		const iterator = gen.call(self = {

			*[Symbol.iterator]() {
				while (true) yield args
			},

			[Args]: args,

			[Context]: Object.create(current?.[Context] ?? null),

			render: noop, queueMicrotask: noop, requestAnimationFrame: noop, effect: noop, cleanup: noop,

			next() {

				if (current === self) return

				const parent = current

				current = self

				children = render(iterator.next().value)

				current = parent
			},

			throw(value) {

				children = render(iterator.throw(value).value)
			},

			return() {

				iterator.return()
			}

		}, args)

		self.next()

	} catch (value) {

		self.throw(value)

	} finally {

		self.return()
	}

	return Marker + children
}

export const context = (fallback, key = Symbol()) => function (...args) {

	const ctx = this ?? current

	return ctx ? args.length == 0 ? key in ctx[Context] ? ctx[Context][key] : fallback : ctx[Context][key] = args[0] : fallback
}
