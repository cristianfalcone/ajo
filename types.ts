declare namespace Ajo {

    interface VNode<TTag = Tag> extends Partial<AjoProps<ElementType<TTag>>> {
        nodeName: TTag,
        [key: string]: unknown,     
    }

    type Child = null | undefined | boolean | bigint | number | string | symbol | Node | VNode | Iterable<Child>

    type Tag = keyof (HTMLElementTagNameMap & SVGElementTagNameMap)

    type ElementType<TTag> =
        TTag extends keyof HTMLElementTagNameMap
        ? HTMLElementTagNameMap[TTag]
        : TTag extends keyof SVGElementTagNameMap
        ? SVGElementTagNameMap[TTag]
        : HTMLElement

    type AjoProps<TElement> = {
        key: unknown,
        skip: boolean,
        memo: unknown,
        ref: (el: TElement | null) => void,
        children: Child,
    }

    type SetProps<TTag> = {
        [K in keyof ElementType<TTag> as `set:${Exclude<K, symbol>}`]: ElementType<TTag>[K]
    }

    type AttrProps<T> = {
        [K in keyof T as `attr:${Exclude<K, symbol>}`]: T[K]
    }

    type Context<TArgs> = {
        $args: TArgs
        next: () => void
        throw: (error?: unknown) => void
        return: () => void
        refresh: () => void
        [Symbol.iterator]: () => Generator<TArgs, void, TArgs>
    }

    type Function<TArgs = {}> = (args: TArgs) => Child

    type Component<TArgs = {}, TTag extends Tag = 'div'> = {
        (this: ElementType<TTag> & Context<TArgs>, args: TArgs): Generator<Child, void, Child>
    } & (TTag extends 'div' ? { is?: TTag } : { is: TTag })
}

declare namespace JSX {

    type IntrinsicElements = {
        [TTag in Ajo.Tag]: Partial<Ajo.SetProps<TTag> & Ajo.AjoProps<Ajo.ElementType<TTag>>>
    }

    type IntrinsicAttributes = Partial<Ajo.AttrProps<any> & Omit<Ajo.AjoProps<any>, "skip" | "ref">>
}

declare namespace React {
    export const createElement: typeof import('ajo').h
    export const Fragment: typeof import('ajo').Fragment
}

declare module 'ajo' {
    function Fragment({ children }: { children: Ajo.Child }): typeof children
    function h<TProps = {}>(type: Ajo.Tag | Ajo.Function<TProps> | Ajo.Component<TProps>, props?: TProps | null, ...children: Ajo.Child[]): Ajo.VNode<typeof type>
    function render(h: Ajo.Child, el: Element): void
}
