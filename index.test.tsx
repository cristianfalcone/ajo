/// <reference types="." />
// @vitest-environment jsdom
import type { Children, Component, ComponentElement } from 'ajo'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from 'ajo'

describe('render', () => {
	beforeEach(() => {
		render(null, document.body)
	})

	it('should render a stateless component with attrs and children', () => {
		const Simple = ({
			name,
			children,
		}: {
			name: string
			children: Children
		}) => (
			<div class="container">
				Hello {name},<br /> and {children}!
			</div>
		)

		render(<Simple name="world">you</Simple>, document.body)

		expect(document.body.innerHTML).toBe(
			'<div class="container">Hello world,<br> and you!</div>'
		)
	})

	it('should hydrate a stateless component', () => {
		const fn = vi.fn()
		const Simple = () => (
			<div class="container" set:onclick={fn} ref={(el) => (ref = el)}>
				Hello world
			</div>
		)
		const html = '<div class="container">Hello world</div>'

		let ref: HTMLDivElement | null = null

		document.body.innerHTML = html

		render(<Simple />, document.body)

		expect(document.body.innerHTML).toBe(html)

		expect(ref!.onclick).toBe(fn)

		ref!.click()

		expect(fn).toHaveBeenCalled()
	})

	it('should call ref with null when unmounting', () => {
		const Simple = () => <div ref={(el) => (ref = el)}>Hello world</div>

		let ref: HTMLDivElement | null = null

		render(
			<div>
				<Simple />
			</div>,
			document.body
		)

		expect(ref).not.toBe(null)

		render(null, document.body)

		expect(ref).toBe(null)
	})
})

describe('component', () => {
	beforeEach(() => {
		render(null, document.body)
	})

	it('should render a stateful component with attrs and children', () => {
		const Component: Component<{ name: string, children: Children }> = function* () {
			for (const { name, children } of this)
				yield (
					<div>
						Hello {name},<br /> and {children}!
					</div>
				)
		}

		render(
			<Component name="world" attr:class="container">
				you
			</Component>,
			document.body
		)

		expect(document.body.innerHTML).toBe(
			'<div class="container"><div>Hello world,<br> and you!</div></div>'
		)
	})

	it('should reuse the same stateful component instance', () => {
		const Component: Component<{ name: string }> = function* () {
			for (const { name } of this)
				yield (
					<div
						ref={(el) => {
							ref = el
							count++
						}}
					>
						Hello {name}!
					</div>
				)
		}

		let ref: HTMLDivElement | null = null,
			count = 0

		render(<Component name="world" attr:class="container" />, document.body)

		expect(document.body.innerHTML).toBe(
			'<div class="container"><div>Hello world!</div></div>'
		)

		const firstDiv = ref

		render(<Component name="you" />, document.body)

		const secondDiv = ref

		expect(document.body.innerHTML).toBe('<div><div>Hello you!</div></div>')
		expect(firstDiv).toBe(secondDiv)
		expect(count).toBe(2)
	})

	it('should extend a built-in element', () => {
		const Component: Component<{ name: string }, 'section'> = function* () {
			for (const { name } of this) yield <div>Hello {name}!</div>
		}

		Component.is = 'section'

		render(<Component name="world" attr:class="container" />, document.body)

		expect(document.body.innerHTML).toBe(
			'<section class="container"><div>Hello world!</div></section>'
		)
	})

	it('should properly use generator function', () => {
		const html = '<section class="container"><span>Hello world!</span></section>'

		document.body.innerHTML = html

		const el = document.querySelector(
			'[class="container"]'
		) as typeof ref
		
		let ref: ComponentElement<ComponentProps, typeof Component.is> | null = null
		let child: HTMLSpanElement | null = null

		const init = vi.fn()
		const loop = vi.fn()
		const end = vi.fn()
		const click = vi.fn()

		type ComponentProps = {
			ref: (el: typeof ref) => void
			name: string
		}

		const Component: Component<ComponentProps, 'section'> = function* ({
			ref,
		}) {
			if (typeof ref === 'function') ref(this)

			init()

			try {
				for (const { name } of this) {
					loop()
					yield (
						<span ref={(el) => (child = el)} set:onclick={click}>
							Hello {name}!
						</span>
					)
				}
			} finally {
				end()
				if (typeof ref === 'function') ref(null)
			}
		}

		Component.is = 'section'

		render(
			<Component
				name="world"
				ref={(el) => (ref = el)}
				attr:class="container"
				
			/>,
			document.body
		)

		child!.click()

		expect(document.body.innerHTML).toBe(html)
		expect(init).toHaveBeenCalledTimes(1)
		expect(loop).toHaveBeenCalledTimes(1)
		expect(click).toHaveBeenCalledTimes(1)
		expect(end).not.toHaveBeenCalled()
		expect(el).toBe(ref)
		expect(child!.innerHTML).toBe('Hello world!')

		el!.next()

		expect(loop).toHaveBeenCalledTimes(2)

		render(null, document.body)

		expect(end).toHaveBeenCalledTimes(1)
		expect(ref).toBe(null)
		expect(child).toBe(null)
	})

	it('should call ref with null when unmounting a stateful component', () => {

		let ref: ComponentElement<ComponentProps> | null = null

		type ComponentProps = {
			name: string;
			ref: (el: typeof ref) => void
		}

		const Component: Component<ComponentProps> = function* ({ ref }) {
			if (typeof ref === 'function') ref(this)

			try {
				for (const { name } of this) yield <div>Hello {name}!</div>
			} finally {
				if (typeof ref === 'function') ref(null)
			}
		}

		render(
			<div>
				<Component name="world" ref={(el) => (ref = el)} />
			</div>,
			document.body
		)

		expect(ref).not.toBe(null)

		render(null, document.body)

		expect(ref).toBe(null)
	})

	it('should catch errors from children', () => {
		function Thrower() {
			throw new Error('test')
		}

		function* Child() {
			for ({} of this) yield <Thrower />
		}

		function* Parent() {
			for ({} of this) {
				try {
					yield <Child />
				} catch (e) {
					yield <div>{e.message}</div>
				}
			}
		}

		render(<Parent />, document.body)

		expect(document.body.innerHTML).toBe('<div><div>test</div></div>')
	})
})
