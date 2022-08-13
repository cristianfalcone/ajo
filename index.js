export const
  Fragment = ({ children }) => children,

  h = (nodeName, props, ...children) => {
    children = children.length == 0 ? null : children.length == 1 ? children[0] : children
    return { children, ...props, nodeName }
  },

  component = setup => ({ nodeName, is, key, block, ref, host, ...props }) =>
    h(is ?? setup.is ?? 'div', {
      key, skip: true, ref: node => {

        node.$params = { ...setup.props, ...props }
        node.$render ??= setup(node.$params, node)

        if (!(block != null && every(node.$deps, node.$deps = block))) {
          update({ ...setup.host, ...host }, node)
          refresh(node)
        }

        isFn(ref) && ref(node)
      }
    }),

  render = (h, host) => {

    const nodes = []
    let child = host.firstChild, node

    for (h of normalize(h, host)) {

      if (typeof h == 'string') {

        for (node = child; node; node = node.nextSibling) if (node.nodeType == 3) break
        node ? node.data !== h && (node.data = h) : node = document.createTextNode(h)

      } else if (h instanceof Node) {

        node = h

      } else {

        const { nodeName, key, skip, block, ref, children, ...props } = h

        if (key != null) {
          (host.$keyed ??= new Map).set(key, node = host.$keyed.get(key) ?? document.createElement(nodeName))
        } else {
          for (node = child; node; node = node.nextSibling) if (node.localName == nodeName) break
          node ??= document.createElement(nodeName)
        }

        if (!(skip || block != null && every(node.$deps, node.$deps = block))) {
          update(props, node)
          render(children, node)
        }

        isFn(ref) && ref(node)
      }

      nodes.push(node) && node === child && (child = child.nextSibling)
    }

    arrange(host, [...host.childNodes], nodes)
  },

  refresh = host => {
    try {
      render(host.$render(host.$params, host), host)
    } catch (error) {
      propagate(host, error)
    }
  },

  provide = (host, key, value) => (host.$provisions ??= new Map).set(key, value),

  consume = (host, key, fallback) => {
    let map
    while (host) {
      if ((map = host.$provisions) && map.has(key)) return map.get(key)
      host = host.parentNode
    }
    return fallback
  },

  intercept = (host, fn) => host.$interceptor = fn,

  propagate = (host, error) => {
    for (let fn; host; host = host.parentNode) if (fn = host.$interceptor) return render(fn(error), host)
    throw error
  },

  cleanup = (host, fn) => (host.$cleanups ??= new Set).add(fn),

  clx = o => keys(o).filter(k => o[k]).join(' ') || null,
  stx = o => entries(o).map(t => t.join(':')).join(';') || null,
  keb = o => keys(o).reduce((r, k) => ((r[k.replace(search, replace).toLowerCase()] = o[k]), r), {})

const
  every = (a, b) => a === b || isArray(a) && isArray(b) && a.length == b.length && a.every((v, i) => v === b[i]),
  apply = (o, { name, value }) => ((o[name] = value), o),
  reduce = list => from(list).reduce(apply, {}),
  ref = v => (...args) => args.length ? v = args[0] : v,
  isFn = v => typeof v == 'function',

  { keys, entries } = Object, { isArray, from } = Array,

  search = /([a-z0-9])([A-Z])/g, replace = '$1-$2', it = Symbol.iterator,

  normalize = function* (h, host, buffer = ref(''), root = true) {

    let type, text

    for (h of isFn(h?.[it]) ? h : [h]) {

      if (h == null || (type = typeof h) == 'boolean') continue

      if (type == 'string' || type == 'number') {
        buffer(buffer() + h)
        continue
      }

      if ('nodeName' in Object(h)) {

        if (isFn(h.nodeName)) {
          yield* normalize(h.nodeName(h), host, buffer, false)
          continue
        }

        if (text = buffer()) {
          yield text
          buffer('')
        }

        yield h
        continue
      }

      isFn(h[it]) ? yield* normalize(h, host, buffer, false) : buffer(buffer() + h)
    }

    if (root && (text = buffer())) yield text
  },

  update = (props, host) => {

    const prev = host.$props ?? (host.hasAttributes() ? reduce(host.attributes) : {})

    for (const name in { ...prev, ...props }) {

      let value = props[name]

      if (value === prev[name]) {
        continue
      }

      if (name.startsWith('set:')) {
        host[name.slice(4)] = value
        continue
      }

      if (value == null || value === false) {
        host.removeAttribute(name)
        continue
      }

      host.setAttribute(name, value === true ? '' : value)
    }

    host.$props = props
  },

  arrange = (host, a, b) => {

    const aLength = a.length, bLength = b.length
    let aIndex = 0, bIndex = 0, aValue, bValue, aMap, bMap, i

    while (aIndex !== aLength || bIndex !== bLength) {

      aValue = a[aIndex], bValue = b[bIndex]

      if (aValue === null) {
        aIndex++
        continue
      }

      if (bLength <= bIndex) {
        host.removeChild(aValue).nodeType == 1 && dispose(aValue)
        aIndex++
        continue
      }

      if (aLength <= aIndex) {
        host.insertBefore(bValue, aValue)
        bIndex++
        continue
      }

      if (aValue === bValue) {
        aIndex++
        bIndex++
        continue
      }

      if (!aMap) {
        aMap = new Map()
        bMap = new Map()
        for (i = 0; i < aLength; i++) aMap.set(a[i], i)
        for (i = 0; i < bLength; i++) bMap.set(b[i], i)
      }

      if (bMap.get(aValue) == null) {
        host.removeChild(aValue).nodeType == 1 && dispose(aValue)
        aIndex++
        continue
      }

      host.insertBefore(bValue, aValue)
      bIndex++

      if ((i = aMap.get(bValue)) != null) {
        if (i > aIndex + 1) aIndex++
        a[i] = null
      }
    }
  },

  dispose = host => {
    for (const child of host.children) dispose(child)
    for (const fn of host.$cleanups ?? []) fn(host)
  }
