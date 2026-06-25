const VNode = Symbol.for('ajo.vnode')

export const mark = v => (v[VNode] = v, v)

export const isVNode = v => v?.[VNode] === v

export const Fragment = props => props.children

export function jsx(type, props, key) {

	(props ??= {}).nodeName = type

	if (key != null) props.key = key

	return mark(props)
}

export const jsxs = jsx

export const jsxDEV = jsx
