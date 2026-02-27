declare module 'ajo' {

	type Tag = keyof (HTMLElementTagNameMap & SVGElementTagNameMap)

	type Type = Tag | (string & {}) | Stateless | Stateful

	type Children = unknown

	type Args = Record<string, unknown>

	type VNode = {
		nodeName: Type,
		children?: Children,
		[key: string]: unknown,
	}

	type ElementType<TTag> = TTag extends keyof HTMLElementTagNameMap
		? HTMLElementTagNameMap[TTag]
		: TTag extends keyof SVGElementTagNameMap
		? SVGElementTagNameMap[TTag]
		: object

	type SpecialAttrs<TElement> = {
		key: string | number,
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

	interface Defaults { }

	type DefaultTag = Defaults extends { tag: infer T extends string } ? T : 'div'

	const defaults: { tag: string }

	type Stateless<TArgs extends Args = {}> = (args: TArgs) => Children

	type Stateful<TArgs extends Args = {}, TTag extends string = DefaultTag> = {
		(this: StatefulElement<TArgs, TTag>, args: TArgs): Iterator<Children>
	} & (TTag extends DefaultTag ? { is?: TTag } : { is: TTag }) & {
		attrs?: Partial<PropSetter<TTag>> & Args,
		args?: Partial<TArgs>,
	}

	type Component<TArgs extends Args = {}> = Stateless<TArgs> | Stateful<TArgs>

	type StatefulArgs<TArgs, TTag> =
		Partial<SpecialAttrs<StatefulElement<TArgs, TTag>> & PropSetter<TTag>> &
		AttrSetter &
		TArgs

	type StatefulElement<TArgs, TTag> = ElementType<TTag> & {
		[Symbol.iterator](): Iterator<TArgs>,
		signal: AbortSignal,
		next: <R>(fn?: (this: StatefulElement<TArgs, TTag>, args: TArgs) => R) => R,
		throw: (value?: unknown) => void,
		return: (deep?: boolean) => void,
	}

	type HTMLIntrinsicElements = {
		[TTag in Tag]: Partial<PropSetter<TTag> & SpecialAttrs<ElementType<TTag>>> & Args
	}

	interface IntrinsicElements extends HTMLIntrinsicElements { }

	type ElementChildrenAttribute = { children: Children }

	type WithChildren<T extends Args = {}> = T & Partial<ElementChildrenAttribute>

	type ManagedAttributes<C, P> =
		C extends (...args: any) => Iterator<any>
			? C extends { is?: infer TTag }
				? StatefulArgs<P, TTag & string>
				: P
			: P

	function render(h: Children, el: ParentNode, child?: ChildNode, ref?: ChildNode): void

	function stateful<TArgs extends Args, TTag extends string = DefaultTag>(
		fn: (this: StatefulElement<TArgs, TTag>, args: TArgs) => Iterator<Children>,
		is?: TTag
	): Stateful<TArgs, TTag>
}

declare module 'ajo/context' {
	function context<T>(fallback?: T): {
		(): T
		<V extends T>(value: V): V
	}
	function current(): import('ajo').StatefulElement<any, any> | null
}

declare module 'ajo/html' {
	function render(h: import('ajo').Children): string
	function html(h: import('ajo').Children): IterableIterator<string>
}

declare module 'ajo/jsx-runtime' {
	import { Type, Args, VNode, Children, ElementChildrenAttribute, IntrinsicElements as _IE } from 'ajo'
	export function Fragment({ children }: ElementChildrenAttribute): typeof children
	export function h(tag: Type, attrs?: Args | null, ...children: Children[]): VNode
	export function jsx(type: Type, props: Args | null, key?: string | number): VNode
	export function jsxs(type: Type, props: Args | null, key?: string | number): VNode
	export function jsxDEV(type: Type, props: Args | null, key?: string | number): VNode
	export namespace JSX {
		type ElementChildrenAttribute = import('ajo').ElementChildrenAttribute
		type LibraryManagedAttributes<C, P> = import('ajo').ManagedAttributes<C, P>
		interface IntrinsicElements extends _IE { }
	}
}

declare module 'ajo/jsx-dev-runtime' {
	import { IntrinsicElements as _IE } from 'ajo'
	export { Fragment, h, jsx, jsxs, jsxDEV } from 'ajo/jsx-runtime'
	export namespace JSX {
		type ElementChildrenAttribute = import('ajo').ElementChildrenAttribute
		type LibraryManagedAttributes<C, P> = import('ajo').ManagedAttributes<C, P>
		interface IntrinsicElements extends _IE { }
	}
}

declare namespace JSX {
	type ElementChildrenAttribute = import('ajo').ElementChildrenAttribute
	type LibraryManagedAttributes<C, P> = import('ajo').ManagedAttributes<C, P>
	type IntrinsicElements = import('ajo').IntrinsicElements
}
