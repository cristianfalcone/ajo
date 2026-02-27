export const Fragment = props => props.children

export const h = (type, props, ...children) => {

	(props ??= {}).nodeName = type

	if (!('children' in props) && children.length) props.children = children.length == 1 ? children[0] : children

	return props
}

export function jsx(type, props, key) {

	if (key != null) (props ??= {}).key = key

	return h(type, props)
}

export const jsxs = jsx

export const jsxDEV = jsx
