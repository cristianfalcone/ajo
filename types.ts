declare module 'ajo' {

  type Tag = keyof (HTMLElementTagNameMap & SVGElementTagNameMap)

  type Type = Tag | Function | Component

  type Props = Record<string, unknown>

  type AjoNode<TTag extends Type> = { nodeName: TTag } & TagProps<TTag>

  type Children = any

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
    $args: TArguments,
    $context: { [key: symbol]: unknown },
    render: () => void,
    $next: () => void
    $throw: (value?: unknown) => void
    $return: () => void
  }

  type Function<TArguments = Props> = (args: TArguments) => Children

  type Component<TArguments = Props, TTag extends Tag = 'div'> = {
    (this: ElementType<TTag> & Context<TArguments>, args: TArguments): Iterator<Children, unknown, unknown>
  } & (TTag extends 'div' ? { is?: TTag } : { is: TTag })

  type Ref<TComponent> = TComponent extends Component<infer TArguments, infer TTag>
    ? Component<TArguments & { ref: (el: ThisParameterType<Ref<TComponent>> | null) => void }, TTag>
    : never 

  type IntrinsicElements = {
    [TTag in Tag]: Partial<SetProps<TTag> & AjoProps<ElementType<TTag>>> & Props
  }

  type IntrinsicAttributes = Partial<Omit<AjoProps<ElementType<Tag>>, 'skip' | 'ref'>> & AttrProps

  type ElementChildrenAttribute = { children: Children }

  type TagProps<TTag extends Type> = TTag extends Tag
    ? IntrinsicElements[TTag] & IntrinsicAttributes
    : TTag extends Function<infer TArguments>
    ? TArguments
    : TTag extends Component<infer TArguments>
    ? TArguments
    : never

  function Fragment({ children }: ElementChildrenAttribute): typeof children
  function h<TTag extends Tag>(tag: TTag, props?: TagProps<TTag> | null, ...children: Array<unknown>): AjoNode<TTag>
  function render(h: Children, el: Element): void
  function context<T>(fallback?: T): { (el: ThisParameterType<Component<unknown, Tag>>, value?: T): T }
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
