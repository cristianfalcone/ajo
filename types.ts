declare module 'ajo' {

  type Tag = keyof (HTMLElementTagNameMap & SVGElementTagNameMap)

  type Type = Tag | Stateless | Stateful

  type Component = Stateless | Stateful

  type Props = Record<string, unknown>

  type VNode<TTag extends Type, TProps extends Props = Props> = TProps & {
    nodeName: TTag,
  }

  type Children = unknown

  type ElementType<TTag = Tag> = TTag extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[TTag]
    : TTag extends keyof SVGElementTagNameMap
    ? SVGElementTagNameMap[TTag]
    : never

  type SpecialProps<TElement> = {
    key: unknown,
    skip: boolean,
    memo: unknown,
    ref: (el: TElement | null) => void,
  } & ElementChildrenAttribute

  type PropSetter<TTag = Tag> = {
    [K in keyof ElementType<TTag> as `set:${Exclude<K, symbol>}`]: ElementType<TTag>[K]
  }

  type AttrSetter = {
    [key: `attr:${string}`]: unknown
  }

  type Stateless<TArguments extends Props = Props> = (args: TArguments) => Children

  type Stateful<TArguments extends Props = Props, TTag extends Tag = 'div'> = {
    (this: StatefulElement<TArguments, TTag>, args: StatefulProps<TArguments, TTag>): Iterator<Children>
  } & (TTag extends 'div' ? { is?: TTag } : { is: TTag }) & { attrs?: Partial<PropSetter<TTag>> & Props, args?: Partial<TArguments> }

  type StatefulProps<TArguments extends Props = Props, TTag extends Tag = 'div'> =
    Partial<SpecialProps<StatefulElement<TArguments, TTag>> & PropSetter<TTag>> &
    AttrSetter &
    TArguments

  type StatefulElement<TArguments extends Props = Props, TTag extends Tag = Tag> = ElementType<TTag> & {
    [Symbol.iterator]: () => Iterator<TArguments>,
    render: () => void,
    queueMicrotask: () => void,
    requestAnimationFrame: () => void,
    effect: (fn: () => void | (() => void)) => () => void,
    cleanup: (fn: () => void) => () => void,
    next: () => void,
    throw: (value?: unknown) => void,
    return: () => void,
  }

  type IntrinsicElements = {
    [TTag in Tag]: Partial<PropSetter<TTag> & SpecialProps<ElementType<TTag>>> & Props
  }

  type ElementChildrenAttribute = { children: Children }

  function Fragment({ children }: ElementChildrenAttribute): typeof children
  function h(tag: Type, props?: Props | null, ...children: Children[]): VNode<Type, Props>
  function render(h: Children, el: Element, child?: Node, ref?: Node): void
  function context<T>(fallback?: T): (value?: T) => T
}

declare module 'ajo/html' {
  function render(h: import('ajo').Children): string
  function html(h: import('ajo').Children): IterableIterator<string>
  function context<T>(fallback?: T): (value?: T) => T
}

declare namespace JSX {
  type ElementChildrenAttribute = import('ajo').ElementChildrenAttribute
  type IntrinsicElements = import('ajo').IntrinsicElements
}
