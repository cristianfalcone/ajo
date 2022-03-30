const { isArray } = Array
const { hasOwn, keys } = Object

export const Skip = Symbol()
export const Fragment = ({ children }) => children
export const Portal = ({ host, children }) => render(host, children)

const Element = Symbol()

export const createTextNode = data => ({ [Element]: '#text', data, skip: true })

export const createElement = (name, props, ...children) => {
  props = { ...props, [Element]: name }
  children = props.children ?? children
  if (children.length > 0) props.children = children.length === 1 ? children[0] : children
  return props
}

export const isElement = el => hasOwn(el ?? {}, Element)

function* g(vnode, host) {
  const vnodes = isArray(vnode) ? vnode : [vnode]
  let data = ''

  while (vnodes.length > 0) {
    vnode = vnodes.shift()

    if (vnode == null || typeof vnode === 'boolean') continue
    if (typeof vnode === 'string') data += vnode
    else if (isElement(vnode)) {
      const { [Element]: name } = vnode

      if (typeof name === 'function') {
        vnodes.unshift(name(vnode, host))
        continue
      }

      if (data) {
        yield createTextNode(data)
        data = ''
      }

      yield vnode
    } else typeof vnode[Symbol.iterator] === 'function'
      ? vnodes.unshift(...vnode)
      : data += vnode
  }

  if (data) yield createTextNode(data)
}

export const render = (vnode, host) => {
  let child = host.firstChild

  for (const { [Element]: name, ref, skip, children, ...props } of g(vnode, host)) {

    if (name === Skip) {
      child = props.end ? null : child?.nextSibling ?? null
      continue
    }

    let node = child

    while (node != null) {
      if (node.nodeName.toLowerCase() === name && node.getAttribute?.('key') == props.key) break
      node = node.nextSibling
    }

    if (node == null) node = name === '#text'
      ? document.createTextNode('')
      : document.createElement(name)

    patch(props, node)

    if (typeof ref === 'function') ref(node)
    else if (typeof ref === 'object' && ref !== null) ref.current = node

    skip || render(children, node)

    if (node === child) child = child.nextSibling
    else if (node.contains?.(document.activeElement)) {
      const { nextSibling } = node
      let ref = child

      while (ref != null && ref !== node) {
        const next = ref.nextSibling
        host.insertBefore(ref, nextSibling)
        ref = next
      }
    } else host.insertBefore(node, child)
  }

  while (child != null) {
    const { nextSibling } = child
    if (child.nodeType === Node.ELEMENT_NODE) dispose(child)
    host.removeChild(child)
    child = nextSibling
  }
}

const patch = (props, node) => {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.data !== props.data) node.data = props.data
    return
  }

  for (const name of new Set([...node.getAttributeNames(), ...keys(props)])) {
    let value = props[name]

    if (name in node && !(typeof value === 'string' && typeof node[name] === 'boolean')) {
      try {
        if (node[name] !== value) node[name] = value
        continue
      } catch (err) { }
    }

    if (value === true) value = ''
    else if (value == null || value === false) {
      node.removeAttribute(name)
      continue
    }

    if (node.getAttribute(name) !== value) node.setAttribute(name, value)
  }
}

const components = new WeakMap

export const createComponent = fn => ({ is, host, key, ...props }) =>
  createElement(is ?? fn.is ?? 'div', {
    ...fn.host, ...host, key, skip: true, ref: host => {
      let cmp = components.get(host)
      if (cmp == null) components.set(host, cmp = new Component(host, fn))
      cmp.props = { ...fn.props, ...props }
      cmp.update()
    }
  })

class Component {
  constructor(host, fn) {
    this.host = host
    this.fn = fn
    this.props = null
    this.it = null
    this.err = false
  }

  update({ method = 'next', arg } = {}) {
    if (this.host == null) return
    if (this.err) try { this.it.return() } catch (e) { this.host = null } finally { return }

    try {
      if (this.it == null) {
        const init = this.fn.call(this, this.props, this.host)
        this.it = typeof init?.next === 'function' ? init : generate.call(this, init)
      }

      const { value, done } = this.it[method](arg)

      render(value, this.host)
      if (done) this.host = null
    } catch (err) {
      this.err = true
      propagate(this.host.parentNode, err)
    }
  }

  *[Symbol.iterator]() {
    while (this.host) yield this.props
  }
}

function* generate(init) {
  yield init
  for (const props of this) yield this.fn.call(this, props, this.host)
}

const propagate = (el, err) => {
  if (el == null) throw err
  const cmp = components.get(el)
  typeof cmp?.it?.throw === 'function'
    ? cmp.update({ method: 'throw', arg: err })
    : propagate(el.parentNode, err)
}

const dispose = el => {
  for (const child of el.children) dispose(child)
  components.get(el)?.update({ method: 'return' })
}

const provisions = new WeakMap

export const provide = (host, key, value) => {
  let map = provisions.get(host)
  if (map == null) provisions.set(host, map = new Map)
  map.set(key, value)
}

export const consume = (host, key) => {
  for (let node = host; node != null; node = node.parentNode) {
    if (provisions.has(node)) {
      const map = provisions.get(node)
      if (map.has(key)) return map.get(key)
    }
  }
}
