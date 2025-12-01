declare module 'ajo' {

	type Tag = keyof (HTMLElementTagNameMap & SVGElementTagNameMap)

	type Type<TArguments extends Args = {}, TTag extends Tag = 'div'> = Tag | Stateless<TArguments> | Stateful<TArguments, TTag>

	type Component<TArguments extends Args = {}> = Stateless<TArguments> | Stateful<TArguments>

	type Args = Record<string, unknown>

	type VNode<TTag extends Type, TArgs extends Args> = TArgs & {
		nodeName: TTag,
		children?: Children,
	}

	type Children = unknown

	type ElementType<TTag> = TTag extends keyof HTMLElementTagNameMap
		? HTMLElementTagNameMap[TTag]
		: TTag extends keyof SVGElementTagNameMap
		? SVGElementTagNameMap[TTag]
		: never

	type SpecialAttrs<TElement> = {
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

	type Stateless<TArguments extends Args = {}> = (args: TArguments) => Children

	type Stateful<TArguments extends Args = {}, TTag extends Tag = 'div'> = {
		(this: StatefulElement<TArguments, TTag>, args: StatefulArgs<TArguments, TTag>): Iterator<Children>
	} & (TTag extends 'div' ? { is?: TTag } : { is: TTag }) & {
		attrs?: Partial<PropSetter<TTag>> & Args,
		args?: Partial<TArguments>,
		src?: string,
		fallback?: Children,
	}

	type StatefulArgs<TArguments, TTag> =
		Partial<SpecialAttrs<StatefulElement<TArguments, TTag>> & PropSetter<TTag>> &
		AttrSetter &
		TArguments

	type StatefulElement<TArguments, TTag> = ElementType<TTag> & {
		next: (fn?: (this: StatefulElement<TArguments, TTag>, args: StatefulArgs<TArguments, TTag>) => void) => void,
		throw: (value?: unknown) => void,
		return: () => void,
	}

	type IntrinsicElements = {
		[TTag in Tag]: Partial<PropSetter<TTag> & SpecialAttrs<ElementType<TTag>>> & Args
	}

	type ElementChildrenAttribute = { children: Children }

	type WithChildren<T extends Args = {}> = T & Partial<ElementChildrenAttribute>

	function Fragment({ children }: ElementChildrenAttribute): typeof children
	function h(tag: Type, attrs?: Args | null, ...children: Children[]): VNode<Type, Args>
	function render(h: Children, el: ParentNode, child?: ChildNode, ref?: ChildNode): void
}

declare module 'ajo/context' {
	function context<T>(fallback?: T): {
		(): T
		<V extends T>(value: V): V
	}
	function current(): import('ajo').StatefulElement<any, any> | null
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
