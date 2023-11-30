import { isArray, slice, normalize, Key, Memo, Ref, Attrs } from './util.js'

export const render = (h, parent, ns) => {

	let child = parent.firstChild

	for (h of normalize(h)) {

		let node = child

		if (typeof h === 'string') {

			while (node && node.nodeType != 3) node = node.nextSibling

			node ? node.data != h && (node.data = h) : node = document.createTextNode(h)

		} else {

			const { xmlns = ns, nodeName, is, key, skip, memo, ref, children, ...attrs } = h

			while (node && !(node.localName === nodeName && (node[Key] ??= key) == key)) node = node.nextSibling

			node ??= create(xmlns, nodeName, is, key)

			if (memo == null || some(node[Memo], node[Memo] = memo)) {

				update(attrs, node)

				if (!skip) render(children, node, xmlns)

				if (typeof ref === 'function') (node[Ref] = ref)(node)
			}
		}

		node === child ? child = child.nextSibling : before(parent, node, child)
	}

	while (child) {

		const next = child.nextSibling

		parent.removeChild(child)

		if (child.nodeType === 1) unref(child)

		child = next
	}
}

const some = (a, b) => isArray(a) && isArray(b) ? a.some((v, i) => v !== b[i]) : a !== b

const create = (ns, name, is, key) => {

	const el = ns ? document.createElementNS(ns, name, { is }) : document.createElement(name, { is })

	el[Key] = key

	return el
}

const update = (attrs, el) => {

	const prev = el[Attrs] ??= slice.call(el.attributes).reduce((o, { name, value }) => (o[name] = value, o), {})

	for (const name in { ...prev, ...(el[Attrs] = attrs) }) {

		const value = attrs[name]

		if (value === prev[name]) continue

		if (name.startsWith('set:')) el[name.slice(4)] = value

		else if (value == null || value === false) el.removeAttribute(name)

		else el.setAttribute(name, value === true ? '' : value)
	}
}

const before = (parent, node, child) => {

	if (node.contains(document.activeElement)) {

		const ref = node.nextSibling

		while (child && child != node) {

			const next = child.nextSibling

			parent.insertBefore(child, ref)

			child = next
		}

	} else parent.insertBefore(node, child)
}

const unref = el => {

	for (const child of el.children) unref(child)

	el[Ref]?.(null)
}
