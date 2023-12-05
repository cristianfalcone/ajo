import { describe, it, expect, vi } from 'vitest'
import { render } from './html.js'

describe('render', () => {

	it('should render a stateless component with attrs and children', () => {

		const Simple = ({ name, children }) => <div>Hello {name},<br /> and {children}!</div>

		const html = render(<Simple name="world">all who inhabit it</Simple>)

		expect(html).toBe('<div>Hello world,<br> and all who inhabit it!</div>')
	})
})

describe('component', () => {

  it('should render a stateful component with attrs and children', () => {

		function* Component() {
			for (const { name, children } of this) yield <div>Hello {name},<br /> and {children}!</div>
		}

		const html = render(<Component arg:name="world">you</Component>)
		
		expect(html).toBe('<div><div>Hello world,<br> and you!</div></div>')
	})

	it('should properly use generator function', () => {

		const init = vi.fn()
		const loop = vi.fn()
		const end = vi.fn()

		function* Component() {

			init()

			try {
				for (const { name } of this) {
					loop()
					yield <div>Hello {name}!</div>
				}
			} finally {
				end()
			}
		}

		const html = render(<Component class="container" arg:name="world" ref={el => ref = el} />)

		expect(html).toBe('<div class="container"><div>Hello world!</div></div>')
		expect(init).toHaveBeenCalledTimes(1)
		expect(loop).toHaveBeenCalledTimes(1)
		expect(end).toHaveBeenCalledTimes(1)
	})

	it('should catch errors from children', () => {

		const Thrower = () => {
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

		const html = render(<Parent />)

		expect(html).toBe('<div><div>test</div></div>')
	})
})
