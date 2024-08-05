const { isArray, from } = Array, Marker = '\u0001'

const { create, assign, entries,  prototype: { hasOwnProperty }, hasOwn = (o, k) => hasOwnProperty.call(o, k) } = Object

export const render = h => from(html(h)).join('')

export const html = function* (h) {

	for (h of normalize(h)) {

		if (typeof h === 'string') yield escape(h)

		else {

			const { nodeName, skip, children = '' } = h

			let attrs = ''

			for (const [key, value] of entries(h)) {

				if (omit.has(key) || key.startsWith('set:') || value == null || value === false) continue

				attrs += value === true ? ` ${key}` : ` ${key}="${escape(String(value))}"`
			}

			if (Void.has(nodeName)) {

				yield `<${nodeName}${attrs}>`

			} else if (!skip) {

				yield `<${nodeName}${attrs}>`

				typeof children === 'string' && children.startsWith(Marker) ? yield children.slice(1) : yield* html(children)

				yield `</${nodeName}>`

			} else {

				yield `<${nodeName}${attrs}></${nodeName}>`
			}
		}
	}
}

const normalize = function* (h, buffer = { value: '' }, root = true) {

	for (h of isArray(h) ? h : [h]) {

		if (h == null || typeof h === 'boolean') continue

		if (hasOwn(h, 'nodeName')) {

			const { value } = buffer, { nodeName } = h

			if (value) yield value, buffer.value = ''

			if (typeof nodeName === 'function') {

				if (nodeName.constructor.name === 'GeneratorFunction') {

					const args = {}, attrs = assign({}, nodeName.attrs)

					for (const key in h) {

						const value = h[key]

						if (key.startsWith('attr:')) attrs[key.slice(5)] = value

						else args[key] = value
					}

					attrs.nodeName = nodeName.is ?? 'div'

					attrs.children = run(nodeName, args)

					yield attrs

				} else yield* normalize(nodeName(h), buffer, false)

			} else yield h

		} else isArray(h) ? yield* normalize(h, buffer, false) : buffer.value += h
	}

	if (root && buffer.value) yield buffer.value
}

const Void = new Set('area,base,br,col,command,embed,hr,img,input,keygen,link,meta,param,source,track,wbr'.split(','))

const omit = new Set('nodeName,key,skip,memo,ref,children'.split(','))

const escape = s => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

let current = null

const run = (gen, $args) => {

	let self, children

	try {

		const iterator = gen.call(self = {

			$args,

			$context: create(current?.$context ?? null),

			render() {

				if (current === self) return

				self.$next()
			},

			$next() {

				const parent = current

				current = self

				children = render(iterator.next().value)

				current = parent
			},

			$throw(value) {

				children = render(iterator.throw(value).value)
			},

			$return() {

				iterator.return()
			}

		}, $args)

		self.$next()

	} catch (value) {

		self.$throw(value)

	} finally {

		self.$return()
	}

	return Marker + children
}

export const context = (fallback, key = Symbol()) => function (el, value) {

	if (arguments.length === 0) return (current && key in current.$context) ? current.$context[key] : fallback

	return arguments.length === 1 ? key in el.$context ? el.$context[key] : fallback : el.$context[key] = value
}
