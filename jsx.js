const { hasOwn } = Object

const vnodes = new WeakSet

export const mark = h => (vnodes.add(h), h)

export const isVNode = h => vnodes.has(h)

export const Fragment = props => props.children

export const h = (type, props, ...children) => {

	(props ??= {}).nodeName = type

	if (!hasOwn(props, 'children') && children.length) props.children = children.length == 1 ? children[0] : children

	return mark(props)
}

export function jsx(type, props, key) {

	if (key != null) (props ??= {}).key = key

	return h(type, props)
}

export const jsxs = jsx

export const jsxDEV = jsx
