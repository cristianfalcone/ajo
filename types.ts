declare module 'ajo' {

  type Tag = keyof (HTMLElementTagNameMap & SVGElementTagNameMap)

  type Props = Record<string, unknown>

  type AjoNode<TTag = Tag> = { nodeName: TTag } & AjoProps<ElementType<TTag>> & Props

  type Children =
    | null
    | undefined
    | boolean
    | bigint
    | number
    | string
    | symbol
    | Node
    | AjoNode
    | Iterable<Children>

  type ElementType<TTag = Tag> = TTag extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[TTag]
    : TTag extends keyof SVGElementTagNameMap
    ? SVGElementTagNameMap[TTag]
    : never

  type AjoProps<TElement> = {
    key: unknown
    skip: boolean
    memo: unknown
    ref: (el: TElement | null) => void
  } & ElementChildrenAttribute

  type SetProps<TTag = Tag> = {
    [K in keyof ElementType<TTag> as `set:${Exclude<K, symbol>}`]: ElementType<TTag>[K]
  }

  type AttrProps<TAttribute = Props> = {
    [K in keyof TAttribute as `attr:${Exclude<K, symbol>}`]: TAttribute[K]
  }

  type Context<TArguments = Props> = {
    $args: TArguments
    next: () => void
    throw: (value?: unknown) => void
    return: () => void
    refresh: () => void
    [Symbol.iterator]: () => Generator<TArguments, unknown, unknown>
  }

  type Function<TArguments = Props> = (args: TArguments) => Children

  type Component<TArguments = Props, TTag extends Tag = 'div'> = {
    (this: ComponentElement<TArguments, TTag>, args: TArguments): Generator<Children, unknown, unknown>
  } & (TTag extends 'div' ? { is?: TTag } : { is: TTag })

  type ComponentElement<TArguments = Props, TTag = Tag> = Context<TArguments> & ElementType<TTag>

  type IntrinsicElements = {
    [TTag in Tag]: Partial<SetProps<TTag> & AjoProps<ElementType<TTag>>> & Props
  }

  type IntrinsicAttributes = Partial<Omit<AjoProps<ElementType<Tag>>, 'skip' | 'ref'>> & AttrProps

  type ElementChildrenAttribute = { children: Children }

  function Fragment({ children }: ElementChildrenAttribute): typeof children
  function h<TProps = Props>(type: Tag | Function<TProps> | Component<TProps>, props?: TProps | null, ...children: Children[]): AjoNode<typeof type>
  function render(h: Children, el: Element): void
}

declare namespace JSX {
  type ElementChildrenAttribute = import('ajo').ElementChildrenAttribute
  type IntrinsicElements = import('ajo').IntrinsicElements
  type IntrinsicAttributes = import('ajo').IntrinsicAttributes
}

declare namespace React {
  const createElement: typeof import('ajo').h
  const Fragment: typeof import('ajo').Fragment
  type ReactNode = import('ajo').Children
}
