// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from './dom.js'
import { component } from './component.js'

describe('render', () => {

	beforeEach(() => {
		document.body.innerHTML = ''
	})

	it('should render a stateless component with attrs and children', () => {

		const Simple = ({ name, children }) => <div class="container">Hello {name},<br /> and {children}!</div>

		render(<Simple name="world">you</Simple>, document.body)

		expect(document.body.innerHTML).toBe('<div class="container">Hello world,<br> and you!</div>')
	})

	it('should hydrate a stateless component', () => {

		const Simple = () => <div class="container" set:onclick={fn} ref={el => div = el}>Hello world</div>
		const html = '<div class="container">Hello world</div>'
		const fn = () => { }

		let div = null

		document.body.innerHTML = html

		render(<Simple />, document.body)

		expect(document.body.innerHTML).toBe(html)
		expect(div.onclick).toBe(fn)
	})

	it('should call ref with null when unmounting', () => {

		const Simple = () => <div ref={el => div = el}>Hello world</div>

		let div = null

		render(<div><Simple /></div>, document.body)

		expect(div).not.toBe(null)

		render(null, document.body)

		expect(div).toBe(null)
	})
})

describe('component', () => {

	beforeEach(() => {
		document.body.innerHTML = ''
	})

	it('should render a stateful component with attrs and children', async () => {

		const Component = component(function* () {
			for (const { name, children } of this) yield <div>Hello {name},<br /> and {children}!</div>
		})

		render(<Component class="container" arg:name="world">you</Component>, document.body)

		expect(document.body.innerHTML).toBe('<host-0 class="container"><div>Hello world,<br> and you!</div></host-0>')
	})

	it('should reuse the same stateful component instance', async () => {

		const Component = component(function* () {
			for (const { name } of this) yield <div ref={el => { div = el; count++ }}>Hello {name}!</div>
		})

		let div = null, count = 0

		render(<Component class="container" arg:name="world" />, document.body)

		expect(document.body.innerHTML).toBe('<host-1 class="container"><div>Hello world!</div></host-1>')

		const firstDiv = div

		render(<Component arg:name="you" />, document.body)

		const secondDiv = div

		expect(document.body.innerHTML).toBe('<host-1><div>Hello you!</div></host-1>')
		expect(firstDiv).toBe(secondDiv)
		expect(count).toBe(2)
	})

	it('should extend a built-in element', async () => {

		const Component = component(function* () {
			for (const { name } of this) yield <div>Hello {name}!</div>
		}, { as: 'div' })

		render(<Component class="container" arg:name="world" />, document.body)

		expect(document.body.innerHTML).toBe('<div is="host-2" class="container"><div>Hello world!</div></div>')
	})

	it('should hydrate a stateful component', async () => {

		const html = '<div is="host-3" class="container"><div>Hello world!</div></div>'

		document.body.innerHTML = html

		const el = document.querySelector('[is="host-3"]')

		let ref = null
		let child = null

		const init = vi.fn()
		const loop = vi.fn()
		const end = vi.fn()
		const click = vi.fn()

		const Component = component(function* () {

			init()
			
			try {
				for (const { name } of this) {
					loop()
					yield <div ref={el => child = el} set:onclick={click}>Hello {name}!</div>
				}
			} finally {
				end()
			}
		}, { as: 'div' })

		render(<Component class="container" arg:name="world" ref={el => ref = el} />, document.body)

		child.click()

		expect(document.body.innerHTML).toBe(html)
		expect(init).toHaveBeenCalledTimes(1)
		expect(loop).toHaveBeenCalledTimes(1)
		expect(click).toHaveBeenCalledTimes(1)
		expect(end).not.toHaveBeenCalled()
		expect(el).toBe(ref)
		expect(child.innerHTML).toBe('Hello world!')

		render(null, document.body)

		expect(end).toHaveBeenCalledTimes(1)
		expect(ref).toBe(null)
		expect(child).toBe(null)
	})

	it('should call ref with null when unmounting a stateful component', async () => {

		const Component = component(function* () {
			for (const { name } of this) yield <div>Hello {name}!</div>
		})

		let div = null

		render(<div><Component ref={el => div = el} arg:name="world" /></div>, document.body)

		expect(div).not.toBe(null)

		render(null, document.body)

		expect(div).toBe(null)
	})

	it('should catch errors from children', () => {

		const Thrower = () => {
			throw new Error('test')
		}

		const Child = component(function* Child() {
			for ({} of this) yield <Thrower />
		})

		const Parent = component(function* Parent() {
			for ({} of this) {
				try {
					yield <Child />
				} catch (e) {
					yield <div>{e.message}</div>
				}
			}
		})

		render(<Parent />, document.body)

		expect(document.body.innerHTML).toBe('<host-6><div>test</div></host-6>')
	})
})
