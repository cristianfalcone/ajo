
import { h } from './jsx.js'
import { assign, Ref, Iterator } from './util.js'
import { render as renderHTML } from './html.js'
import { render as renderDOM } from './dom.js'

let id = 0, types

export const component = (fn, { as } = {}) => {

	if (fn?.constructor?.name !== 'GeneratorFunction') throw new TypeError('fn is not a generator function')

	const is = `host-${id++}`

	if (!globalThis.document) return ({ attrs = {}, args = {}, ...rest }) => {

		collect(attrs, args, rest)

		let self, children

		try {

			const iterator = fn.call(self = {

				args,

				*[Symbol.iterator]() { while (true) yield args },

				next() { children = renderHTML(iterator.next().value) },

				throw(value) { children = renderHTML(iterator.throw(value).value) },

				return() { iterator.return() }

			}, args)

			self.next()

		} catch (value) {

			self.throw(value)

		} finally {

			self.return()
		}

		return h(as || is, assign(attrs, { is: as && is }), children)
	}

	customElements.define(
		is,
		class extends resolve(as) {

			*[Symbol.iterator]() { while (true) yield this.args }
	
			next() {
	
				try {
	
					renderDOM((this[Iterator] ??= fn.call(this, this.args)).next().value, this)
	
					if (typeof this[Ref] === 'function') this[Ref](this)
	
				} catch (value) {
	
					this.throw(value)
				}
			}
	
			throw(value) {
	
				for (let el = this; el; el = el.parentNode) {
	
					if (typeof el[Iterator]?.throw === 'function') {
	
						try {
	
							return renderDOM(el[Iterator].throw(value).value, el)
	
						} catch (value) {
	
							continue
						}
					}
				}
	
				throw value
			}
	
			return() {
	
				try {
	
					this[Iterator]?.return()
	
				} catch (value) {
	
					this.throw(value)
	
				} finally {
	
					this[Iterator] = null
				}
			}
		},
		{ extends: as }
	)

	return ({ attrs = {}, args = {}, ref, ...rest }) => {

		collect(attrs, args, rest)

		return h(as || is, assign(attrs, { is: as && is, skip: true, ref: el => el && assign(el, { [Ref]: e => (e || el.return(), typeof ref === 'function' && ref(e)), args }).next() }))
	}
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

const collect = (attrs, args, rest) => {

	for (const name in rest) {

		if (name.startsWith('arg:')) args[name.slice(4)] = rest[name]

		else if (name === 'children') args[name] = rest[name]

		else attrs[name] = rest[name]
	}
}
