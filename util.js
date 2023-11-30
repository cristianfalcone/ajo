export const { isArray, prototype: { slice } } = Array, { assign, entries } = Object

export const Key = Symbol(), Memo = Symbol(), Ref = Symbol(), Attrs = Symbol(), Iterator = Symbol()

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
