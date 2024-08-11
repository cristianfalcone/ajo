declare module 'ajo' {

  type Tag = keyof (HTMLElementTagNameMap & SVGElementTagNameMap)

  type Type = Tag | Function | Component

  type Attrs = Record<string, unknown>

  type VNode<TTag extends Type> = { nodeName: TTag } & Attrs

  type Children = any

  type ElementType<TTag = Tag> = TTag extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[TTag]
    : TTag extends keyof SVGElementTagNameMap
    ? SVGElementTagNameMap[TTag]
    : never

  type AjoAttrs<TElement> = {
    key: unknown
    skip: boolean
    memo: unknown
    ref: (el: TElement | null) => void
  } & ElementChildrenAttribute

  type PropSetter<TTag = Tag> = {
    [K in keyof ElementType<TTag> as `set:${Exclude<K, symbol>}`]: ElementType<TTag>[K]
  }

  type AttrSetter = {
    [key: `attr:${string}`]: unknown
  }

  type Function<TArguments extends Attrs = Attrs> = (args: TArguments) => Children

  type Component<TArguments extends Attrs = Attrs, TTag extends Tag = 'div'> = {
    (this: ComponentElement<TArguments, TTag>, args: ComponentProps<TArguments, TTag>): Iterator<Children, unknown, unknown>
  } & (TTag extends 'div' ? { is?: TTag } : { is: TTag })

  type ComponentProps<TArguments extends Attrs = Attrs, TTag extends Tag = 'div'> =
    Partial<PropSetter<TTag> & AjoAttrs<ComponentElement<TArguments, TTag>>> &
    AttrSetter &
    TArguments

  type ComponentElement<TArguments extends Attrs = Attrs, TTag extends Tag = Tag> = ElementType<TTag> & {
    $args: TArguments,
    $context: { [key: symbol]: unknown },
    render: () => void,
    next: () => void
    throw: (value?: unknown) => void
    return: () => void
  }

  type IntrinsicElements = {
    [TTag in Tag]: Partial<PropSetter<TTag> & AjoAttrs<ElementType<TTag>>> & Attrs
  }

  type ElementChildrenAttribute = { children: Children }

  function Fragment({ children }: ElementChildrenAttribute): typeof children
  function h<TTag extends Tag>(tag: TTag, props?: Attrs | null, ...children: Array<unknown>): VNode<TTag>
  function render(h: Children, el: Element): void
  function context<T>(fallback?: T): (value?: T) => T
}

declare namespace JSX {
  type ElementChildrenAttribute = import('ajo').ElementChildrenAttribute
  type IntrinsicElements = import('ajo').IntrinsicElements
}

declare namespace React {
  const createElement: typeof import('ajo').h
  const Fragment: typeof import('ajo').Fragment
  type ReactNode = import('ajo').Children
}
