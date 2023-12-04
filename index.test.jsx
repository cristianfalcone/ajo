// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from './index.js'

describe('render', () => {

	beforeEach(() => {
		render(null, document.body)
	})

	it('should render a stateless component with attrs and children', () => {

		const Simple = ({ name, children }) => <div class="container">Hello {name},<br /> and {children}!</div>

		render(<Simple name="world">you</Simple>, document.body)

		expect(document.body.innerHTML).toBe('<div class="container">Hello world,<br> and you!</div>')
	})

	it('should hydrate a stateless component', () => {

		const fn = vi.fn()
		const Simple = () => <div class="container" set:onclick={fn} ref={el => ref = el}>Hello world</div>
		const html = '<div class="container">Hello world</div>'

		let ref = null

		document.body.innerHTML = html

		render(<Simple />, document.body)

		expect(document.body.innerHTML).toBe(html)
		expect(ref.onclick).toBe(fn)

    ref.click()

    expect(fn).toHaveBeenCalled()
	})

	it('should call ref with null when unmounting', () => {

		const Simple = () => <div ref={el => ref = el}>Hello world</div>

		let ref = null

		render(<div><Simple /></div>, document.body)

		expect(ref).not.toBe(null)

		render(null, document.body)

		expect(ref).toBe(null)
	})
})

describe('component', () => {

	beforeEach(() => {
		render(null, document.body)
	})

	it('should render a stateful component with attrs and children', async () => {

		function* Component() {
			for (const { name, children } of this) yield <div>Hello {name},<br /> and {children}!</div>
		}

		render(<Component class="container" arg:name="world">you</Component>, document.body)

		expect(document.body.innerHTML).toBe('<div class="container"><div>Hello world,<br> and you!</div></div>')
	})

  it('should reuse the same stateful component instance', async () => {

		function* Component() {
			for (const { name } of this) yield <div ref={el => { ref = el; count++ }}>Hello {name}!</div>
		}

		let ref = null, count = 0

		render(<Component class="container" arg:name="world" />, document.body)

		expect(document.body.innerHTML).toBe('<div class="container"><div>Hello world!</div></div>')

		const firstDiv = ref

		render(<Component arg:name="you" />, document.body)

		const secondDiv = ref

		expect(document.body.innerHTML).toBe('<div><div>Hello you!</div></div>')
		expect(firstDiv).toBe(secondDiv)
		expect(count).toBe(2)
	})

  it('should extend a built-in element', async () => {

		function* Component() {
			for (const { name } of this) yield <div>Hello {name}!</div>
		}

    Component.is = 'section'

		render(<Component class="container" arg:name="world" />, document.body)

		expect(document.body.innerHTML).toBe('<section class="container"><div>Hello world!</div></section>')
	})

  it('should hydrate a stateful component', async () => {

		const html = '<div class="container"><div>Hello world!</div></div>'

		document.body.innerHTML = html

		const el = document.querySelector('[class="container"]')

		let ref = null
		let child = null

		const init = vi.fn()
		const loop = vi.fn()
		const end = vi.fn()
		const click = vi.fn()

		function* Component() {

			init()

			try {
				for (const { name } of this) {
					loop()
					yield <div ref={el => child = el} set:onclick={click}>Hello {name}!</div>
				}
			} finally {
				end()
			}
		}

		render(<Component class="container" arg:name="world" ref={el => ref = el} />, document.body)

		child.click()

		expect(document.body.innerHTML).toBe(html)
		expect(init).toHaveBeenCalledTimes(1)
		expect(loop).toHaveBeenCalledTimes(1)
		expect(click).toHaveBeenCalledTimes(1)
		expect(end).not.toHaveBeenCalled()
		expect(el).toBe(ref)
		expect(child.innerHTML).toBe('Hello world!')

		el.next()

		expect(loop).toHaveBeenCalledTimes(2)

		render(null, document.body)

		expect(end).toHaveBeenCalledTimes(1)
		expect(ref).toBe(null)
		expect(child).toBe(null)
	})

  it('should call ref with null when unmounting a stateful component', async () => {

		function* Component () {
			for (const { name } of this) yield <div>Hello {name}!</div>
		}

		let ref = null

		render(<div><Component ref={el => ref = el} arg:name="world" /></div>, document.body)

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
