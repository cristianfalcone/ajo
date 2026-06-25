const vnodes = new WeakSet

export const mark = v => (vnodes.add(v), v)

export const isVNode = v => vnodes.has(v)

export const Fragment = props => props.children

export function jsx(type, props, key) {

	(props ??= {}).nodeName = type

	if (key != null) props.key = key

	return mark(props)
}

export const jsxs = jsx

export const jsxDEV = jsx
