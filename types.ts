declare module 'ajo' {

	type Tag = keyof (HTMLElementTagNameMap & SVGElementTagNameMap)

	type Type = Tag | Stateless | Stateful

	type Component<TProps extends Props = {}> = Stateless<TProps> | Stateful<TProps>

	type Props = Record<string, unknown>

	type VNode<TTag extends Type, TProps extends Props> = TProps & {
		nodeName: TTag,
		children?: Children,
	}

	type Children = unknown

	type ElementType<TTag> = TTag extends keyof HTMLElementTagNameMap
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

	type PropSetter<TTag> = {
		[K in keyof ElementType<TTag> as `set:${Exclude<K, symbol>}`]: ElementType<TTag>[K]
	}

	type AttrSetter = {
		[key: `attr:${string}`]: unknown
	}

	type Stateless<TArguments extends Props = {}> = (args: TArguments) => Children

	type Stateful<TArguments extends Props = {}, TTag extends Tag = 'div'> = {
		(this: StatefulElement<TTag>, args: StatefulProps<TArguments, TTag>): Iterator<Children>
	} & (TTag extends 'div' ? { is?: TTag } : { is: TTag }) & { attrs?: Partial<PropSetter<TTag>> & Props, args?: Partial<TArguments> }

	type StatefulProps<TArguments, TTag> =
		Partial<SpecialProps<StatefulElement<TTag>> & PropSetter<TTag>> &
		AttrSetter &
		TArguments

	type StatefulElement<TTag> = ElementType<TTag> & {
		render: () => void,
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
}

declare module 'ajo/context' {
	function context<T>(fallback?: T): (value?: T) => T
}

declare module 'ajo/html' {

	type Patch = {
		id: string,
		h: import('ajo').Children,
		src?: string,
		done: boolean,
	}

	type Hooks = {
		alloc?: (parentId: string) => string,
		placeholder?: (id: string, children: import('ajo').Children) => unknown,
		push?: (patch: Patch) => void,
	}

	function render(h: import('ajo').Children): string
	function html(h: import('ajo').Children, hooks?: Hooks): IterableIterator<string>
}

declare module 'ajo/stream' {
	function stream(h: import('ajo').Children): AsyncIterableIterator<string>
	function hydrate(patch: import('ajo/html').Patch): Promise<void>
}

declare namespace JSX {
	type ElementChildrenAttribute = import('ajo').ElementChildrenAttribute
	type IntrinsicElements = import('ajo').IntrinsicElements
}
