const { entries, hasOwn } = Object, isIterable = v => typeof v !== 'string' && typeof v?.[Symbol.iterator] === 'function'

export const render = h => [...html(h)].join('')

export const html = function* (h) {

	for (h of normalize(h)) {

		if (typeof h === 'string') yield escape(h)

		else {

			const { nodeName, key, skip, memo, ref, children, ...rest } = h

			let attrs = ''
			
			for (const [key, value] of entries(rest)) {

				if (key.startsWith('set:') || value == null || value === false) continue

				attrs += value === true ? `${attrs} ${key}` : `${attrs} ${key}="${escape(String(value))}"`
			}

			if (Void.has(nodeName)) {

				yield `<${nodeName}${attrs}>`

			} else if (!skip) {

				if (typeof children === 'string') yield `<${nodeName}${attrs}>${children}</${nodeName}>`

				else yield `<${nodeName}${attrs}>`, yield* html(children), yield `</${nodeName}>`

			} else {

				yield `<${nodeName}${attrs}></${nodeName}>`
			}
		}
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

					const props = {}, args = {}

					for (const [key, value] of entries(h)) {

						if (key === 'children') args.children = value

						else if (key.startsWith('arg:')) args[key.slice(4)] = value

						else props[key] = value
					}

					props.nodeName = nodeName.is ?? 'div', props.children = run(nodeName, args), yield props

				} else delete h.nodeName, yield* normalize(nodeName(h), buffer, false)

			} else if (type === 'string') yield h

		} else isIterable(h) ? yield* normalize(h, buffer, false) : buffer.value += h
	}

	if (root && buffer.value) yield buffer.value
}

const Void = new Set('area,base,br,col,command,embed,hr,img,input,keygen,link,meta,param,source,track,wbr'.split(','))

const escape = s => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

const run = (gen, $args) => {

	let self, children

	try {

		const iterator = gen.call(self = {

			$args,

			*[Symbol.iterator]() { while (true) yield $args },

			refresh() { },

			next() { children = render(iterator.next().value) },

			throw(value) { children = render(iterator.throw(value).value) },

			return() { iterator.return() }

		}, $args)

		self.next()

	} catch (value) {

		self.throw(value)

	} finally {

		self.return()
	}

	return children
}
