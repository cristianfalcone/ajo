export const
  Fragment = ({ children }) => children,

  h = (nodeName, props, ...children) => {
    children = children.length == 0 ? null : children.length == 1 ? children[0] : children
    return { children, ...props, nodeName }
  },

  component = setup => ({ is, key, host, ref, ...props }) => h(is ?? setup.is ?? 'div', {
    key, ...setup.host, ...host, skip: true, ref: host => (refresh(host, props, setup), isFn(ref) && ref(host))
  }),

  render = (h, host) => {

    let child = host.firstChild, node, byKey = keyed.get(host)

    for (h of normalize(h, host)) {

      if (typeof h == 'string') {

        for (node = child; node; node = node.nextSibling) if (node.nodeType == 3) break
        node ? node.data !== h && (node.data = h) : node = document.createTextNode(h)

      } else if (h instanceof Node) {

        node = h

      } else {

        const { key, nodeName, skip, block, children, ref, ...props } = h

        if (key != null && (node = byKey?.get(key)));
        else for (node = child; node; node = node.nextSibling) if (node.localName == nodeName) break

        node ||= document.createElement(nodeName)

        key != null && (byKey ||= keyed.set(host, new Map)).set(key, node)

        update(props, node)

        !(skip || block != null && every(deps.get(node), deps.set(node, block))) && render(children, node)

        isFn(ref) && ref(node)
      }

      node === child ? child = child.nextSibling : before(host, child, node)
    }

    while (child) {
      const next = child.nextSibling
      host.removeChild(child).nodeType == 1 && dispose(child)
      child = next
    }
  },

  refresh = (host, props, setup) => {
    try {
      if (setup && !isFn(setup)) throwTypeError('Setup', setup, fn)
      props = props ? memo.set(host, { ...setup?.props, ...props }) : memo.get(host) ?? {}
      render((renders.get(host) ?? renders.set(host, setup(props, host)))(props, host), host)
    } catch (error) {
      propagate(host, error)
    }
  },

  provide = (host, key, value) => (provisions.get(host) ?? provisions.set(host, new Map)).set(key, value),

  consume = (host, key, fallback) => {
    let map
    while (host) {
      if ((map = provisions.get(host)) && map.has(key)) return map.get(key)
      host = host.parentNode
    }
    return fallback
  },

  intercept = (host, interceptor) => {
    if (!isFn(interceptor)) throwTypeError('Interceptor', interceptor, fn)
    interceptors.set(host, interceptor)
  },

  propagate = (host, error) => {
    for (let interceptor; host; host = host.parentNode)
      if (interceptor = interceptors.get(host)) return render(interceptor(error), host)
    throw error
  },

  cleanup = (host, cleaner) => {
    if (!isFn(cleaner)) throwTypeError('Cleaner', cleaner, fn);
    (cleaners.get(host) ?? cleaners.set(host, new Set)).add(cleaner)
  },

  clx = o => keys(o).filter(k => o[k]).join(' ') || null,
  stx = o => entries(o).map(t => t.join(':')).join(';') || null,
  keb = o => keys(o).reduce((r, k) => ((r[k.replace(search, replace).toLowerCase()] = o[k]), r), {})

const
  wm = () => {
    const instance = new WeakMap, { set } = instance
    instance.set = (key, value) => (set.call(instance, key, value), value)
    return instance
  },

  throwTypeError = (name, value, expected) => {
    throw new TypeError(`Expected ${name} to be of type ${expected}, got ${typeof value} instead`)
  },

  every = (a, b) => a === b || isArray(a) && isArray(b) && a.length == b.length && a.every((v, i) => v === b[i]),
  apply = (o, { name, value }) => ((o[name] = value), o),
  reduce = list => from(list).reduce(apply, {}),
  isFn = v => typeof v == fn,

  { keys, entries } = Object, { isArray, from } = Array,

  fn = 'function', search = /([a-z0-9])([A-Z])/g, replace = '$1-$2',

  keyed = wm(), deps = wm(), memo = wm(), renders = wm(), provisions = wm(), interceptors = wm(), cleaners = wm(), cache = wm(),

  normalize = function* (h, host) {

    let type, buffer = ''

    for (h of isFn(h?.[Symbol.iterator]) ? h : [h]) {

      if (h == null || (type = typeof h) == 'boolean') continue

      if (type == 'string' || type == 'number') {
        buffer += h
        continue
      }

      if ('nodeName' in Object(h)) {

        if (isFn(h.nodeName)) {
          yield* normalize(h.nodeName(h, host), host)
          continue
        }

        if (buffer) {
          yield buffer
          buffer = ''
        }

        yield h
        continue
      }

      isFn(h[Symbol.iterator]) ? yield* normalize(h, host) : buffer += h
    }

    if (buffer) yield buffer
  },

  update = (props, host) => {

    const prev = cache.get(host) ?? (host.hasAttributes() ? reduce(host.attributes) : {})

    for (const name in { ...prev, ...props }) {

      let value = props[name]

      if (value === prev[name]) continue

      if (name.startsWith('set:')) {
        host[name.slice(4)] = value
        continue
      }

      if (value === true) value = ''
      else if (value == null || value === false) {
        host.removeAttribute(name)
        continue
      }

      host.setAttribute(name, value)
    }

    cache.set(host, props)
  },

  before = (host, child, node) => {
    if (node.contains?.(document.activeElement)) {

      const ref = node.nextSibling

      while (child && child !== node) {
        const next = child.nextSibling
        host.insertBefore(child, ref)
        child = next
      }

    } else host.insertBefore(node, child)
  },

  dispose = host => {
    for (const child of host.children) dispose(child)
    for (const cleaner of cleaners.get(host) ?? []) cleaner(host)
  }
