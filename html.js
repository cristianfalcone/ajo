import { assign, entries, h, normalize } from './jsx.js'

const Void = new Set('area,base,br,col,command,embed,hr,img,input,keygen,link,meta,param,source,track,wbr'.split(','))

const escape = s => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

export const html = function* (h) {

	for (h of normalize(h)) {

		if (typeof h === 'string') yield h

		else {

			const { nodeName, key, skip, memo, ref, children, ...rest } = h

			const attrs = entries(rest).reduce((attrs, [key, value]) => {

				if (key.startsWith('set:') || value == null || value === false) return attrs

				if (value === true) return `${attrs} ${key}`

				return `${attrs} ${key}="${escape(String(value))}"`

			}, '')

			if (Void.has(nodeName)) {

				yield `<${nodeName}${attrs}>`

			} else if (!skip) {

				yield `<${nodeName}${attrs}>`

				yield* html(children)

				yield `</${nodeName}>`

			} else {

				yield `<${nodeName}${attrs}></${nodeName}>`
			}
		}
	}
}

export const render = h => [...html(h)].join('')

let id = 0

export const component = (fn, { as } = {}) => {

	if (fn?.constructor?.name !== 'GeneratorFunction') throw new TypeError('fn is not a generator function')

	const is = `host-${id++}`

	return ({ attrs = {}, args = {}, ...rest }) => {

		for (const name in rest) {

			if (name.startsWith('arg:')) args[name.slice(4)] = rest[name]

			else (name === 'children' ? args : attrs)[name] = rest[name]
		}

		let iterator, children

		try {

			iterator = fn.call({

				args,

				refresh() { },

				next() { iterator.next() },

				throw(value) { throw value },

				*[Symbol.iterator]() {
					while (true) yield args
				}

			}, args)

			children = render(iterator.next().value)

		} catch (value) {

			children = render(iterator.throw(value).value)

		} finally {

			iterator?.return()
		}

		return h(as || is, assign(attrs, { is: as && is }), children)
	}
}
