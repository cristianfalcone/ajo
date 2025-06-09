export const Context = Symbol.for('ajo.context')

export const context = (fallback, key = Symbol()) => function (...args) {

  const self = this ?? component

  return self
    ? args.length
      ? self[Context][key] = args[0]
      : key in self[Context]
        ? self[Context][key]
        : fallback
    : fallback
}

let component = null

export const current = (...args) => args.length ? (component = args[0]) : component
