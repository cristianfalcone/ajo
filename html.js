import { entries, normalize } from './util.js'

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
