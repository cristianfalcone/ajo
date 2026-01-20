import type { Stateful, Children } from 'ajo'
import { describe, it, expect, vi } from 'vitest'
import { render } from 'ajo/html'
import { context } from 'ajo/context'

describe('render', () => {

	it('should render simple elements', () => {

		const html = render(<div>Hello, World!</div>)

		expect(html).toBe('<div>Hello, World!</div>')
	})

	it('should render nested elements', () => {

		const html = render(
			<div>
				<h1>Title</h1>
				<p>Paragraph</p>
			</div>
		)

		expect(html).toBe('<div><h1>Title</h1><p>Paragraph</p></div>')
	})

	it('should render fragments', () => {

		const html = render(
			<>
				<div>First</div>
				<div>Second</div>
			</>
		)

		expect(html).toBe('<div>First</div><div>Second</div>')
	})

	it('should handle boolean attributes', () => {

		const html = render(<input type="checkbox" checked disabled />)

		expect(html).toBe('<input type="checkbox" checked disabled>')
	})

	it('should escape attribute values', () => {

		const html = render(<div data-text="<script>alert('XSS')</script>">Safe</div>)

		expect(html).toBe('<div data-text="&#60;script&#62;alert(&#39;XSS&#39;)&#60;/script&#62;">Safe</div>')
	})

	it('should escape text content', () => {

		const html = render(<div>{'<script>alert("XSS")</script>'}</div>)

		expect(html).toBe('<div>&#60;script&#62;alert(&#34;XSS&#34;)&#60;/script&#62;</div>')
	})
})

describe('components', () => {

	it('should render components with attrs and children', () => {

		const Simple = ({ name, children }: { name: string, children: Children }) => (
			<div>
				Hello {name},<br /> and {children}!
			</div>
		)

		const html = render(<Simple name="world">all who inhabit it</Simple>)

		expect(html).toBe('<div>Hello world,<br> and all who inhabit it!</div>')
	})

	it('should render nested components', () => {

		const Child = () => <span>Child</span>
		const Parent = () => <div><Child /></div>

		const html = render(<Parent />)

		expect(html).toBe('<div><span>Child</span></div>')
	})

	it('should handle conditional rendering', () => {

		const ConditionalComponent = ({ showExtra }: { showExtra: boolean }) => (
			<div>
				<p>Always shown</p>
				{showExtra && <p>Extra content</p>}
			</div>
		)

		const htmlWithExtra = render(<ConditionalComponent showExtra={true} />)

		expect(htmlWithExtra).toBe('<div><p>Always shown</p><p>Extra content</p></div>')

		const htmlWithoutExtra = render(<ConditionalComponent showExtra={false} />)

		expect(htmlWithoutExtra).toBe('<div><p>Always shown</p></div>')
	})

	it('should render lists', () => {

		const List = ({ items }: { items: string[] }) => (
			<ul>
				{items.map(item => <li key={item}>{item}</li>)}
			</ul>
		)

		const html = render(<List items={['Apple', 'Banana', 'Cherry']} />)

		expect(html).toBe('<ul><li>Apple</li><li>Banana</li><li>Cherry</li></ul>')
	})

	it('should not render set: prefixed attributes', () => {

		const ButtonComponent = () => (
			<button
				set:onclick={() => console.log('Clicked')}
				set:disabled={false}
			>
				Click me
			</button>
		)

		const html = render(<ButtonComponent />)

		expect(html).toBe('<button>Click me</button>')
	})

	it('should render normal attributes but not set: prefixed ones', () => {

		const MixedAttributesComponent = () => (
			<div
				id="test-div"
				class="test-class"
				set:textContent="This should not appear"
				data-test="This should appear"
				set:hidden={false}
			>
				Visible Content
			</div>
		)

		const html = render(<MixedAttributesComponent />)

		expect(html).toBe('<div id="test-div" class="test-class" data-test="This should appear">Visible Content</div>')
	})

	it('should handle components with set: attributes in children', () => {

		const ChildComponent = () => (
			<button set:onclick={() => console.log('Child clicked')}>
				Child Button
			</button>
		)

		const ParentComponent = () => (
			<div set:onmouseover={() => console.log('Parent hovered')}>
				<ChildComponent />
			</div>
		)

		const html = render(<ParentComponent />)

		expect(html).toBe('<div><button>Child Button</button></div>')
	})

	it('should handle void elements correctly', () => {

		const VoidElements = () => (
			<div>
				<input type="text" />
				<br />
				<img src="image.jpg" alt="An image" />
				<hr />
			</div>
		)

		const html = render(<VoidElements />)

		expect(html).toBe('<div><input type="text"><br><img src="image.jpg" alt="An image"><hr></div>')
	})

	it('should handle numeric and boolean attrs values', () => {

		const NumberAttrs = () => (
			<div>
				<input type="number" value={42} min={0} max={100} />
				<progress value={0.5}></progress>
			</div>
		)

		const html = render(<NumberAttrs />)

		expect(html).toBe('<div><input type="number" value="42" min="0" max="100"><progress value="0.5"></progress></div>')
	})

	it('should handle undefined and null children', () => {

		const NullableContent = ({ showContent }: { showContent: boolean }) => (
			<div>
				<h1>Title</h1>
				{showContent ? <p>Content</p> : null}
				{undefined}
			</div>
		)

		const htmlWithContent = render(<NullableContent showContent={true} />)

		expect(htmlWithContent).toBe('<div><h1>Title</h1><p>Content</p></div>')

		const htmlWithoutContent = render(<NullableContent showContent={false} />)

		expect(htmlWithoutContent).toBe('<div><h1>Title</h1></div>')
	})

	it('should render a stateful component with attrs and children', () => {

		const Component: Stateful<{ name: string, children: Children }> = function* (args) {
			while (true)
				yield (
					<div>
						Hello {args.name},<br /> and {args.children}!
					</div>
				)
		}

		const html = render(<Component name="world">you</Component>)

		expect(html).toBe('<div><div>Hello world,<br> and you!</div></div>')
	})

	it('should properly use generator function', () => {

		const init = vi.fn()
		const loop = vi.fn()
		const end = vi.fn()

		const Component: Stateful<{ name: string }> = function* (args) {

			init()

			try {
				while (true) {
					loop()
					yield <div>Hello {args.name}!</div>
				}
			} finally {
				end()
			}
		}

		const html = render(<Component name="world" attr:class="container" />)

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
			while (true) yield <Thrower />
		}

		function* Parent() {
			while (true) {
				try {
					yield <Child />
				} catch (e) {
					yield <div>{e instanceof Error ? e.message : String(e)}</div>
				}
			}
		}

		const html = render(<Parent attr:class="parent" />)

		expect(html).toBe('<div class="parent"><div>test</div></div>')
	})
})

describe('context', () => {

	it('should render with default context value', () => {

		const ThemeContext = context('light')

		const ThemedButton: Stateful = function* () {
			while (true) {
				const theme = ThemeContext()
				yield <button class={`theme-${theme}`}>Click me</button>
			}
		}

		const html = render(<ThemedButton />)

		expect(html).toBe('<div><button class="theme-light">Click me</button></div>')
	})

	it('should render with set context value', () => {

		const UserContext = context('Guest')

		const Greeting: Stateful = function* () {
			while (true) {
				const user = UserContext()
				yield <h1>Welcome, {user}!</h1>
			}
		}

		const App: Stateful = function* () {
			UserContext('John')
			while (true) yield <Greeting />
		}

		const html = render(<App />)

		expect(html).toBe('<div><div><h1>Welcome, John!</h1></div></div>')
	})

	it('should handle multiple contexts', () => {

		const ThemeContext = context('light')
		const LanguageContext = context('en')

		const MultiContextComponent: Stateful = function* () {
			while (true) {
				const theme = ThemeContext()
				const lang = LanguageContext()
				yield <div class={`theme-${theme}`}>{lang === 'en' ? 'Hello' : 'Bonjour'}</div>
			}
		}

		const App: Stateful = function* () {
			ThemeContext('dark')
			LanguageContext('fr')
			while (true) yield <MultiContextComponent />
		}

		const html = render(<App />)

		expect(html).toBe('<div><div><div class="theme-dark">Bonjour</div></div></div>')
	})

	it('should propagate context through nested components', () => {

		const ColorContext = context('black')

		const DeepChild: Stateful = function* () {
			while (true) {
				const color = ColorContext()
				yield <span style={`color: ${color}`}>Nested Content</span>
			}
		}

		const MiddleComponent = () => <div><DeepChild /></div>

		const ParentComponent: Stateful = function* () {
			ColorContext('blue')
			while (true) yield <MiddleComponent />
		}

		const html = render(<ParentComponent />)

		expect(html).toBe('<div><div><div><span style="color: blue">Nested Content</span></div></div></div>')
	})

	it('should use custom wrapper element', () => {

		const CustomContext = context('default')

		const CustomComponent: Stateful<{}, 'section'> = function* () {
			while (true) {
				const value = CustomContext()
				yield <p>{value}</p>
			}
		}
		CustomComponent.is = 'section'

		const html = render(<CustomComponent />)

		expect(html).toBe('<section><p>default</p></section>')
	})

	it('should handle complex nested structure with multiple contexts', () => {

		const ThemeContext = context('light')
		const UserContext = context('Anonymous')
		const LanguageContext = context('en')

		const Header: Stateful = function* () {
			while (true) {
				const theme = ThemeContext()
				const lang = LanguageContext()
				yield <header class={`theme-${theme}`}>{lang === 'en' ? 'Welcome' : 'Bienvenue'}</header>
			}
		}

		const Content: Stateful = function* () {
			while (true) {
				const user = UserContext()
				const lang = LanguageContext()
				yield <main>{lang === 'en' ? `Hello, ${user}!` : `Bonjour, ${user}!`}</main>
			}
		}

		const Footer: Stateful = function* () {
			while (true) {
				const theme = ThemeContext()
				yield <footer class={`theme-${theme}`}>© 2024</footer>
			}
		}

		const App: Stateful = function* () {

			ThemeContext('dark')
			UserContext('Alice')
			LanguageContext('fr')

			while (true) yield (
				<>
					<Header />
					<Content />
					<Footer />
				</>
			)
		}

		const html = render(<App />)

		expect(html).toBe('<div><div><header class="theme-dark">Bienvenue</header></div><div><main>Bonjour, Alice!</main></div><div><footer class="theme-dark">© 2024</footer></div></div>')
	})

	it('should access context in a stateless component', () => {

		const ThemeContext = context('light')

		const ThemedButton = () => {
			const theme = ThemeContext()
			return <button class={`theme-${theme}`}>Click me</button>
		}

		const App = () => (
			<div>
				<ThemedButton />
			</div>
		)

		const html = render(<App />)

		expect(html).toBe('<div><button class="theme-light">Click me</button></div>')
	})

	it('should handle context updates for stateless components', () => {

		const CountContext = context(0)

		const Counter = () => {
			const count = CountContext()
			return <span>Count: {count}</span>
		}

		const App: Stateful = function* () {
			CountContext(5)
			while (true) {
				yield (
					<>
						<Counter />
						<button>Increment</button>
					</>
				)
			}
		}

		const html = render(<App />)

		expect(html).toBe('<div><span>Count: 5</span><button>Increment</button></div>')
	})

	it('should handle multiple contexts in stateless components', () => {

		const ThemeContext = context('light')
		const LanguageContext = context('en')

		const ThemedMultiLingualButton = () => {
			const theme = ThemeContext()
			const lang = LanguageContext()
			return <button class={`theme-${theme}`}>{lang === 'en' ? 'Click me' : 'Cliquez-moi'}</button>
		}

		const App: Stateful = function* () {
			ThemeContext('dark')
			LanguageContext('fr')
			while (true) yield <ThemedMultiLingualButton />
		}

		const html = render(<App />)

		expect(html).toBe('<div><button class="theme-dark">Cliquez-moi</button></div>')
	})

	it('should propagate context through nested stateless components', () => {

		const ColorContext = context('blue')

		const GrandChild = () => {
			const color = ColorContext()
			return <span style={`color: ${color}`}>Text</span>
		}

		const Child = () => <div><GrandChild /></div>

		const Parent: Stateful = function* () {
			ColorContext('red')
			while (true) yield <Child />
		}

		const html = render(<Parent />)

		expect(html).toBe('<div><div><span style="color: red">Text</span></div></div>')
	})
})
