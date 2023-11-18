import { describe, it, expect } from 'vitest'
import { render, component } from './html.js'

describe('render', () => {

	it('should render a stateless component with attrs and children', () => {

		const Simple = ({ name, children }) => <div>Hello {name},<br /> and {children}!</div>

		const html = render(<Simple name="world">all who inhabit it</Simple>)

		expect(html).toBe('<div>Hello world,<br> and all who inhabit it!</div>')
	})

	it('should render a stateful component with attrs and children', () => {

		const Component = component(function* () {
			for (const { name, children } of this) yield <div>Hello {name},<br /> and {children}!</div>
		})

		const html = render(<Component arg:name="world">you</Component>)
		
		expect(html).toBe('<host-0><div>Hello world,<br> and you!</div></host-0>')
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

		const html = render(<Parent />)

		expect(html).toBe('<host-2><div>test</div></host-2>')
	})
})
