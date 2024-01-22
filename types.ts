declare namespace Ajo {

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
        children: any,
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
        [Symbol.iterator]: () => Generator<TArgs, void, any>
    }

    type Component<TArgs, TElement extends keyof (HTMLElementTagNameMap & SVGElementTagNameMap) = 'div'> = {
        (this: ElementType<TElement> & Context<TArgs>, props: TArgs): Generator<TArgs, void, any>
    } & (TElement extends 'div' ? { is?: TElement } : { is: TElement })
}

declare namespace JSX {
    
    type IntrinsicElements = {
        [K in keyof HTMLElementTagNameMap]: Partial<Ajo.SetProps<K> & Ajo.AjoProps<Ajo.ElementType<K>>>
    }

    type IntrinsicAttributes = Partial<Ajo.AttrProps<any> & Omit<Ajo.AjoProps<any>, "skip" | "ref">>
}
