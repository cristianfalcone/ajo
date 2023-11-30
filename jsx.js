import { slice } from './util.js'

export const Fragment = ({ children }) => children

export const h = function (nodeName, attrs) {

	const node = { ...attrs, nodeName }, { length } = arguments

	if (!('children' in node || length < 3)) node.children = length === 3 ? arguments[2] : slice.call(arguments, 2)

	return node
}
