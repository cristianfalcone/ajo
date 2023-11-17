export const { isArray, prototype: { slice } } = Array, { assign, entries } = Object

export const Fragment = ({ children }) => children

export const h = function (nodeName, attrs) {

	const node = { ...attrs, nodeName }, { length } = arguments

	if (!('children' in node || length < 3)) node.children = length === 3 ? arguments[2] : slice.call(arguments, 2)

	return node
}

export const normalize = function* (h, buffer = { value: '' }, root = true) {

	for (h of isArray(h) ? h : [h]) {

		if (h == null || typeof h === 'boolean') continue

		const { nodeName, ...attrs } = h, type = typeof nodeName

		if (type === 'string') buffer.value && (yield buffer.value, buffer.value = ''), yield h

		else if (type === 'function') yield* normalize(nodeName(attrs), buffer, false)

		else isArray(h) ? yield* normalize(h, buffer, false) : buffer.value += h
	}

	if (root && buffer.value) yield buffer.value
}
