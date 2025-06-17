import type { Children, Stateful } from 'ajo'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from 'ajo'
import { context } from 'ajo/context'

describe('render', () => {

	beforeEach(() => {
		render(null, document.body)
	})

	it('should render a simple element', () => {

		render(<div>Hello, World!</div>, document.body)
		expect(document.body.innerHTML).toBe('<div>Hello, World!</div>')
	})

	it('should render nested elements', () => {

		render(
			<div>
				<h1>Title</h1>
				<p>Paragraph</p>
			</div>,
			document.body
		)

		expect(document.body.innerHTML).toBe('<div><h1>Title</h1><p>Paragraph</p></div>')
	})

	it('should render fragments', () => {

		render(
			<>
				<div>First</div>
				<div>Second</div>
			</>,
			document.body
		)

		expect(document.body.innerHTML).toBe('<div>First</div><div>Second</div>')
	})

	it('should render with attributes', () => {

		render(<div id="test" class="sample">Attributes</div>, document.body)
		expect(document.body.innerHTML).toBe('<div id="test" class="sample">Attributes</div>')
	})

	it('should handle boolean attributes', () => {

		render(<input type="checkbox" checked disabled />, document.body)

		const input = document.body.querySelector('input')

		expect(input).not.toBeNull()
		expect(input!.checked).toBe(true)
		expect(input!.disabled).toBe(true)
	})

	it('should render numbers and booleans correctly', () => {

		render(<div>{42}</div>, document.body)
		expect(document.body.innerHTML).toBe('<div>42</div>')
		render(<div>{true}</div>, document.body)
		expect(document.body.innerHTML).toBe('<div></div>')
	})

	it('should render SVG elements', () => {

		const ns = 'http://www.w3.org/2000/svg'

		render(
			<svg xmlns={ns} width="100" height="100">
				<circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
			</svg>,
			document.body
		)

		const svg = document.body.querySelector('svg')
		const circle = document.body.querySelector('circle')

		expect(svg).not.toBeNull()
		expect(circle).not.toBeNull()
		expect(svg!.namespaceURI).toBe(ns)
		expect(circle!.namespaceURI).toBe(ns)
	})

	it('should not render set: prefixed attributes', () => {

		render(
			<button set:onclick={() => { }} data-testid="test-button">
				Click me
			</button>,
			document.body
		)

		const button = document.body.querySelector('button')

		expect(button).not.toBeNull()
		expect(button!.getAttribute('set:onclick')).toBeNull()
		expect(button!.getAttribute('onclick')).toBeNull()
		expect(button!.getAttribute('data-testid')).toBe('test-button')
	})
})

describe('components', () => {

	beforeEach(() => {
		render(null, document.body)
	})

	it('should render null and undefined correctly', () => {

		const NullComponent = () => null

		render(<NullComponent />, document.body)
		expect(document.body.innerHTML).toBe('')

		const UndefinedComponent = () => undefined

		render(<UndefinedComponent />, document.body)
		expect(document.body.innerHTML).toBe('')
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

	it('should render a stateful component with attrs and children', () => {

		const Self: Stateful<{ name: string, children: Children }> = function* (args) {
			while (true) yield (
				<div>
					Hello {args.name},<br /> and {args.children}!
				</div>
			)
		}

		render(
			<Self name="world" attr:class="container">
				you
			</Self>,
			document.body
		)

		expect(document.body.innerHTML).toBe(
			'<div class="container"><div>Hello world,<br> and you!</div></div>'
		)
	})

	it('should reuse the same stateful component instance', () => {

		const Self: Stateful<{ name: string }> = function* (args) {
			while (true) yield (
				<div
					ref={(el) => {
						ref = el
						count++
					}}
				>
					Hello {args.name}!
				</div>
			)
		}

		let ref: HTMLDivElement | null = null, count = 0

		render(<Self name="world" attr:class="container" />, document.body)
		expect(document.body.innerHTML).toBe(
			'<div class="container"><div>Hello world!</div></div>'
		)

		const firstDiv = ref

		render(<Self name="you" />, document.body)

		const secondDiv = ref

		expect(document.body.innerHTML).toBe('<div><div>Hello you!</div></div>')
		expect(firstDiv).toBe(secondDiv)
		expect(count).toBe(2)
	})

	it('should extend a built-in element', () => {

		const Self: Stateful<{ name: string }, 'section'> = function* (args) {
			while (true) yield <div>Hello {args.name}!</div>
		}

		Self.is = 'section'

		render(<Self name="world" attr:class="container" />, document.body)

		expect(document.body.innerHTML).toBe(
			'<section class="container"><div>Hello world!</div></section>'
		)
	})

	it.skip('should properly use generator function', () => {

		const html = '<section class="container"><span>Hello world!</span></section>'

		document.body.innerHTML = html

		const el = document.querySelector(
			'[class="container"]'
		) as typeof ref

		let ref: ThisParameterType<typeof Self> | null = null
		let child: HTMLSpanElement | null = null

		const init = vi.fn()
		const loop = vi.fn()
		const end = vi.fn()
		const click = vi.fn()

		const Self: Stateful<{ name: string }, 'section'> = function* (args) {

			init()

			try {
				while (true) {
					loop()
					yield (
						<span ref={(el) => (child = el)} set:onclick={click}>
							Hello {args.name}!
						</span>
					)
				}
			} finally {
				end()
			}
		}

		Self.is = 'section'

		render(
			<Self
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

		el!.render()

		expect(loop).toHaveBeenCalledTimes(2)

		render(null, document.body)

		expect(end).toHaveBeenCalledTimes(1)
		expect(ref).toBe(null)
		expect(child).toBe(null)
	})

	it('should catch errors from children', () => {

		function Thrower() {
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

		render(<Parent />, document.body)
		expect(document.body.innerHTML).toBe('<div><div>test</div></div>')
	})

	it('should render and update simple elements', () => {

		const App: Stateful = function* () {

			let count = 0

			const increment = () => {
				count++
				this.render()
			}

			while (true) yield <button set:onclick={increment}>Count: {count}</button>
		}

		render(<App />, document.body)
		expect(document.body.innerHTML).toBe('<div><button>Count: 0</button></div>')

		document.querySelector('button')!.click()

		expect(document.body.innerHTML).toBe('<div><button>Count: 1</button></div>')
	})

	it('should handle conditional rendering', () => {

		const App: Stateful = function* () {

			let showExtra = false

			const toggle = () => {
				showExtra = !showExtra
				this.render()
			}

			while (true) yield (
				<div>
					<button set:onclick={toggle}>Toggle</button>
					{showExtra && <p>Extra content</p>}
				</div>
			)
		}

		render(<App />, document.body)
		expect(document.body.innerHTML).toBe('<div><div><button>Toggle</button></div></div>')

		document.querySelector('button')!.click()

		expect(document.body.innerHTML).toBe('<div><div><button>Toggle</button><p>Extra content</p></div></div>')
	})

	it('should handle list rendering and updates', () => {

		const App: Stateful = function* () {

			let items = ['Apple', 'Banana']

			const addItem = () => {
				items.push('Cherry')
				this.render()
			}

			while (true) yield (
				<>
					<ul>
						{items.map(item => <li key={item}>{item}</li>)}
					</ul>
					<button set:onclick={addItem}>Add Item</button>
				</>
			)
		}

		render(<App />, document.body)
		expect(document.body.innerHTML).toBe('<div><ul><li>Apple</li><li>Banana</li></ul><button>Add Item</button></div>')

		document.querySelector('button')!.click()

		expect(document.body.innerHTML).toBe('<div><ul><li>Apple</li><li>Banana</li><li>Cherry</li></ul><button>Add Item</button></div>')
	})

	it('should handle form inputs and state', () => {

		const App: Stateful = function* () {

			let inputValue = ''

			const handleInput = (e: Event) => {
				inputValue = (e.target as HTMLInputElement).value
				this.render()
			}

			while (true) yield (
				<>
					<input type="text" value={inputValue} set:oninput={handleInput} />
					<p>You typed: {inputValue}</p>
				</>
			)
		}

		render(<App />, document.body)

		const input = document.querySelector('input') as HTMLInputElement

		input.value = 'Hello, Ajo!'
		input.dispatchEvent(new Event('input'))

		expect(document.body.innerHTML).toBe('<div><input type="text" value="Hello, Ajo!"><p>You typed: Hello, Ajo!</p></div>')
	})

	it('should handle custom events', () => {

		const CustomButton: Stateful<{ onCustomClick: () => void }> = function* ({ onCustomClick }) {
			while (true) {
				yield <button set:onclick={onCustomClick}>Custom Button</button>
			}
		}

		const App: Stateful = function* () {

			let clickCount = 0

			const handleCustomClick = () => {
				clickCount++
				this.render()
			}

			while (true) yield (
				<>
					<CustomButton onCustomClick={handleCustomClick} />
					<p>Clicks: {clickCount}</p>
				</>
			)
		}

		render(<App />, document.body)

		document.querySelector('button')!.click()

		expect(document.body.innerHTML).toBe('<div><div><button>Custom Button</button></div><p>Clicks: 1</p></div>')
	})

	it.skip('should handle component lifecycle', () => {

		const lifecycleEvents: string[] = []

		const ChildComponent: Stateful = function* () {

			lifecycleEvents.push('Child mounted')

			try {
				while (true) yield <div>Child Component</div>
			} finally {
				lifecycleEvents.push('Child unmounted')
			}
		}

		const App: Stateful = function* () {

			let showChild = true

			const toggleChild = () => {
				showChild = !showChild
				this.render()
			}

			lifecycleEvents.push('Parent mounted')

			try {
				while (true) yield (
					<div>
						<button set:onclick={toggleChild}>Toggle Child</button>
						{showChild && <ChildComponent />}
					</div>
				)
			} finally {
				lifecycleEvents.push('Parent unmounted')
			}
		}

		render(<App />, document.body)
		expect(lifecycleEvents).toEqual(['Parent mounted', 'Child mounted'])

		document.querySelector('button')!.click()

		expect(lifecycleEvents).toEqual(['Parent mounted', 'Child mounted', 'Child unmounted'])

		document.querySelector('button')!.click()

		expect(lifecycleEvents).toEqual(['Parent mounted', 'Child mounted', 'Child unmounted', 'Child mounted'])
		render(null, document.body)
		expect(lifecycleEvents).toEqual(['Parent mounted', 'Child mounted', 'Child unmounted', 'Child mounted', 'Child unmounted', 'Parent unmounted'])
	})

	it('should handle async operations', async () => {

		vi.useFakeTimers()

		const AsyncComponent: Stateful = function* () {

			let data = 'Loading...'

			const fetchData = async () => {

				await new Promise(resolve => setTimeout(resolve, 1000))

				data = 'Data loaded'

				this.render()
			}

			fetchData()

			while (true) yield <div>{data}</div>
		}

		render(<AsyncComponent />, document.body)
		expect(document.body.innerHTML).toBe('<div><div>Loading...</div></div>')

		await vi.runAllTimersAsync()

		expect(document.body.innerHTML).toBe('<div><div>Data loaded</div></div>')

		vi.useRealTimers()
	})
})

describe('context', () => {

	beforeEach(() => {
		render(null, document.body)
	})

	it('should create and use a context with default value', () => {

		const ThemeContext = context('light')

		const ThemedButton: Stateful = function* () {
			while (true) {
				const theme = ThemeContext()
				yield <button class={`theme-${theme}`}>Click me</button>
			}
		}

		render(<ThemedButton />, document.body)
		expect(document.body.innerHTML).toBe(
			'<div><button class="theme-light">Click me</button></div>'
		)
	})

	it('should set and retrieve context value', () => {

		const UserContext = context<{ name: string } | null>(null)

		const UserProfile: Stateful = function* () {
			while (true) {
				const user = UserContext()
				yield <div>Welcome, {user ? user.name : 'Guest'}!</div>
			}
		}

		const App: Stateful = function* () {
			UserContext({ name: 'John' })
			while (true) yield <UserProfile />
		}

		render(<App />, document.body)
		expect(document.body.innerHTML).toBe(
			'<div><div><div>Welcome, John!</div></div></div>'
		)
	})

	it('should update context and re-render', () => {

		const CountContext = context(0)

		const Counter: Stateful = function* () {
			while (true) {
				const count = CountContext()
				yield <span>Count: {count}</span>
			}
		}

		const App: Stateful = function* () {

			let count = 0

			const increment = () => {
				count++
				CountContext.call(this, count)
				this.render()
			}

			while (true) yield (
				<>
					<Counter />
					<button set:onclick={increment}>Increment</button>
				</>
			)
		}

		render(<App />, document.body)
		expect(document.body.innerHTML).toBe('<div><div><span>Count: 0</span></div><button>Increment</button></div>')

		document.querySelector('button')!.click()

		expect(document.body.innerHTML).toBe('<div><div><span>Count: 1</span></div><button>Increment</button></div>')
	})

	it('should handle multiple contexts', () => {

		const ThemeContext = context('light')
		const LanguageContext = context('en')

		const Component: Stateful = function* () {
			while (true) {
				const theme = ThemeContext()
				const lang = LanguageContext()
				yield <span class={`theme-${theme}`}>{lang === 'en' ? 'Hello' : 'Hola'}</span>
			}
		}

		const App: Stateful = function* () {
			ThemeContext('dark')
			LanguageContext('es')
			while (true) yield <Component />
		}

		render(<App />, document.body)
		expect(document.body.innerHTML).toBe(
			'<div><div><span class="theme-dark">Hola</span></div></div>'
		)
	})

	it('should propagate context through nested components', () => {

		const ColorContext = context('blue')

		const GrandChild: Stateful = function* () {
			while (true) {
				const color = ColorContext()
				yield <span style={`color: ${color}`}>Text</span>
			}
		}

		const Child = () => <div><GrandChild /></div>

		const Parent: Stateful = function* () {
			ColorContext('red')
			while (true) yield <Child />
		}

		render(<Parent />, document.body)
		expect(document.body.innerHTML).toBe(
			'<div><div><div><span style="color: red">Text</span></div></div></div>'
		)
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

		render(<App />, document.body)
		expect(document.body.innerHTML).toBe('<div><button class="theme-light">Click me</button></div>')
	})

	it('should update context for stateless components', () => {

		const CountContext = context(0)

		const Counter = () => {
			const count = CountContext()
			return <span>Count: {count}</span>
		}

		const App: Stateful = function* () {
			let count = 0

			const increment = () => {
				count++
				CountContext.call(this, count)
				this.render()
			}

			while (true) yield (
				<>
					<Counter />
					<button set:onclick={increment}>Increment</button>
				</>
			)
		}

		render(<App />, document.body)
		expect(document.body.innerHTML).toBe('<div><span>Count: 0</span><button>Increment</button></div>')

		document.querySelector('button')!.click()
		expect(document.body.innerHTML).toBe('<div><span>Count: 1</span><button>Increment</button></div>')
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

		render(<App />, document.body)
		expect(document.body.innerHTML).toBe('<div><button class="theme-dark">Cliquez-moi</button></div>')
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

		render(<Parent />, document.body)
		expect(document.body.innerHTML).toBe('<div><div><span style="color: red">Text</span></div></div>')
	})
})

describe('key special attribute', () => {

	beforeEach(() => {
		document.body.innerHTML = ''
	})

	it('should render a list with keyed items', () => {

		const List = (args: { items: string[] }) => (
			<ul>
				{args.items.map(item => (
					<li key={item}>{item}</li>
				))}
			</ul>
		)

		const items = ['Apple', 'Banana', 'Cherry']

		render(<List items={items} />, document.body)

		const listItems = document.querySelectorAll('li')

		expect(listItems.length).toBe(3)
		expect(listItems[0].textContent).toBe('Apple')
		expect(listItems[1].textContent).toBe('Banana')
		expect(listItems[2].textContent).toBe('Cherry')
	})

	it('should update keyed list efficiently', () => {

		const List: Stateful<{ items: string[] }> = function* (args) {
			while (true) yield (
				<ul>
					{args.items.map(item => (
						<li key={item}>{item}</li>
					))}
				</ul>
			)
		}

		let items = ['Apple', 'Banana', 'Cherry']

		render(<List items={items} />, document.body)

		// Initial render
		let listItems = document.querySelectorAll('li')

		expect(listItems.length).toBe(3)

		// Store references to original DOM nodes
		const originalNodes = Array.from(listItems)

		// Update list: remove 'Banana' and add 'Date'
		items = ['Apple', 'Cherry', 'Date']

		render(<List items={items} />, document.body)

		listItems = document.querySelectorAll('li')

		expect(listItems.length).toBe(3)
		expect(listItems[0].textContent).toBe('Apple')
		expect(listItems[1].textContent).toBe('Cherry')
		expect(listItems[2].textContent).toBe('Date')

		// Check if 'Apple' and 'Cherry' nodes are reused
		expect(listItems[0]).toBe(originalNodes[0])
		expect(listItems[1]).toBe(originalNodes[2])

		// 'Date' should be a new node
		expect(listItems[2]).not.toBe(originalNodes[1])
	})

	it('should handle keyed elements with the same content but different keys', () => {

		const KeyedComponent: Stateful = function* () {
			while (true) yield (
				<div>Content</div>
			)
		}

		const App: Stateful = function* () {

			let id = 'a'

			const toggle = () => {
				id = id === 'a' ? 'b' : 'a'
				this.render()
			}

			while (true) yield (
				<>
					<KeyedComponent key={id} />
					<button set:onclick={toggle}>Toggle</button>
				</>
			)
		}

		render(<App />, document.body)

		// App wrapper > KeyedComponent wrapper > content div
		const getContent = () => document.querySelector('div > div > div')

		const originalContent = getContent()

		expect(originalContent).not.toBeNull()
		expect(originalContent!.textContent).toBe('Content')

		document.querySelector('button')!.click()

		const newContent = getContent()

		// Content should be the same, but it should be a new DOM node due to different key
		expect(newContent).not.toBeNull()
		expect(newContent!.textContent).toBe('Content')
		expect(newContent).not.toBe(originalContent)
	})
})

it('should hydrate a server-rendered keyed list', () => {

	document.body.innerHTML = '<div><ul><li>Apple</li><li>Banana</li><li>Cherry</li></ul></div>'

	const List: Stateful<{ items: string[] }> = function* ({ items }) {
		while (true) yield (
			<ul>
				{items.map(item => <li key={item}>{item}</li>)}
			</ul>
		)
	}

	const items = ['Apple', 'Banana', 'Cherry']

	const original = Array.from(document.querySelectorAll('li'))

	render(<List items={items} />, document.body)

	const hydrated = document.querySelectorAll('li')

	// Same order, same text, same DOM nodes
	expect(Array.from(hydrated).map(n => n.textContent)).toEqual(items)
	expect(hydrated[0]).toBe(original[0])
	expect(hydrated[1]).toBe(original[1])
	expect(hydrated[2]).toBe(original[2])
})

describe('skip special attribute', () => {

	beforeEach(() => {
		render(null, document.body)
	})

	it('should not render children when skip is true', () => {

		const Skip = () => (
			<div skip={true}>
				<p>This should not be rendered</p>
			</div>
		)

		render(<Skip />, document.body)
		expect(document.body.innerHTML).toBe('<div></div>')
	})

	it('should render children when skip is false', () => {

		const NoSkip = () => (
			<div skip={false}>
				<p>This should be rendered</p>
			</div>
		)

		render(<NoSkip />, document.body)
		expect(document.body.innerHTML).toBe('<div><p>This should be rendered</p></div>')
	})

	it('should not update children when skip is true', () => {

		let count = 0

		const SkipUpdate: Stateful = function* () {

			while (true) yield (
				<div skip={true}>
					<p>{count}</p>
				</div>
			)
		}

		render(<SkipUpdate />, document.body)
		expect(document.body.innerHTML).toBe('<div><div></div></div>')

		count = 1
		render(<SkipUpdate />, document.body)
		expect(document.body.innerHTML).toBe('<div><div></div></div>')
	})

	it('should update children when skip changes from true to false', () => {

		let shouldSkip = true

		const DynamicSkip: Stateful = function* () {
			while (true) yield (
				<div skip={shouldSkip}>
					<p>Content</p>
				</div>
			)
		}

		render(<DynamicSkip />, document.body)
		expect(document.body.innerHTML).toBe('<div><div></div></div>')

		shouldSkip = false
		render(<DynamicSkip />, document.body)
		expect(document.body.innerHTML).toBe('<div><div><p>Content</p></div></div>')
	})

	it('should work with nested components and skip', () => {

		const Child = () => <p>Child content</p>

		const Parent = ({ skip }: { skip: boolean }) => (
			<div skip={skip}>
				<Child />
			</div>
		)

		render(<Parent skip={true} />, document.body)
		expect(document.body.innerHTML).toBe('<div></div>')
		render(<Parent skip={false} />, document.body)
		expect(document.body.innerHTML).toBe('<div><p>Child content</p></div>')
	})

	it('should not affect siblings when skip is used', () => {

		const Sibling = () => (
			<div>
				<p skip={true}>
					<span>Skipped content</span>
				</p>
				<p>Visible content</p>
			</div>
		)

		render(<Sibling />, document.body)
		expect(document.body.innerHTML).toBe('<div><p></p><p>Visible content</p></div>')
	})

	it('should respect skip on wrapper element of stateful component', () => {

		const SkipWrapper: Stateful = function* () {
			while (true) yield <p>This content may or may not be skipped</p>
		}

		render(<SkipWrapper skip={true} />, document.body)
		expect(document.body.innerHTML).toBe('<div></div>')
		render(<SkipWrapper skip={false} />, document.body)
		expect(document.body.innerHTML).toBe('<div><p>This content may or may not be skipped</p></div>')
	})
})

describe('ref special attribute', () => {

	beforeEach(() => {
		render(null, document.body)
	})

	it('should set ref for DOM elements', () => {

		let divRef: HTMLDivElement | null = null

		const RefComponent = () => (
			<div ref={el => divRef = el}>
				Test content
			</div>
		)

		render(<RefComponent />, document.body)
		expect(divRef).not.toBeNull()
		expect(divRef!.textContent).toBe('Test content')
	})

	it('should update ref when component re-renders', () => {

		let buttonRef: HTMLButtonElement | null = null
		let count = 0

		const CounterComponent: Stateful = function* () {
			while (true) yield (
				<button ref={el => buttonRef = el} set:onclick={() => { count++; this.render() }}>
					Count: {count}
				</button>
			)
		}

		render(<CounterComponent />, document.body)
		expect(buttonRef).not.toBeNull()
		expect(buttonRef!.textContent).toBe('Count: 0')

		buttonRef!.click()
		expect(buttonRef).not.toBeNull()
		expect(buttonRef!.textContent).toBe('Count: 1')
	})

	it.skip('should call ref with null when unmounting', () => {

		const refCallback = vi.fn()
		const UnmountTestComponent = () => <div ref={refCallback}>Test</div>

		render(<UnmountTestComponent />, document.body)
		expect(refCallback).toHaveBeenCalledWith(expect.any(HTMLDivElement))
		render(null, document.body)
		expect(refCallback).toHaveBeenLastCalledWith(null)
	})

	it('should work with stateful components', () => {

		type ComponentElement = ThisParameterType<typeof StatefulComponent> | null

		let componentRef: ComponentElement = null

		const StatefulComponent: Stateful = function* () {

			let count = 0

			while (true) {
				yield <div>{count}</div>
				count++
			}
		}

		render(<StatefulComponent ref={el => componentRef = el} />, document.body)
		expect(componentRef).not.toBeNull()
		expect(document.body.innerHTML).toBe('<div><div>0</div></div>')

		componentRef!.render()
		expect(document.body.innerHTML).toBe('<div><div>1</div></div>')
	})

	it.skip('should call ref with null when unmounting a stateful component', () => {

		let ref: ThisParameterType<typeof Self> | null = null

		type Args = {
			name: string
		}

		const Self: Stateful<Args> = function* (args) {
			while (true) yield <div>Hello {args.name}!</div>
		}

		render(
			<div>
				<Self name="world" ref={(el) => (ref = el)} />
			</div>,
			document.body
		)

		expect(ref).not.toBe(null)
		render(null, document.body)
		expect(ref).toBe(null)
	})

	it('should handle multiple refs', () => {

		let ref1: HTMLDivElement | null = null
		let ref2: HTMLSpanElement | null = null

		const MultiRefComponent = () => (
			<div ref={el => ref1 = el}>
				<span ref={el => ref2 = el}>Multiple refs</span>
			</div>
		)

		render(<MultiRefComponent />, document.body)
		expect(ref1).not.toBeNull()
		expect(ref2).not.toBeNull()
		expect(ref1!.contains(ref2)).toBe(true)
	})

	it('should work with function components that return null', () => {

		const refCallback = vi.fn()

		const NullComponent = (args: { ref: typeof refCallback }) => null

		render(<NullComponent ref={refCallback} />, document.body)
		expect(refCallback).not.toHaveBeenCalled()
		expect(document.body.innerHTML).toBe('')
	})
})

describe('memo attribute', () => {

	beforeEach(() => {
		render(null, document.body)
	})

	it('should not update memoized element and its children when memo values are the same', () => {

		let count = 0
		let otherProp = 'initial'

		const MemoComponent = () => (
			<div>
				<p>This will always update: {otherProp}</p>
				<div memo={[count]}>
					<p>Memoized count: {count}</p>
					<p>This won't update: {otherProp}</p>
				</div>
			</div>
		)

		render(<MemoComponent />, document.body)
		expect(document.body.innerHTML).toBe('<div><p>This will always update: initial</p><div><p>Memoized count: 0</p><p>This won\'t update: initial</p></div></div>')

		otherProp = 'changed'
		render(<MemoComponent />, document.body)
		expect(document.body.innerHTML).toBe('<div><p>This will always update: changed</p><div><p>Memoized count: 0</p><p>This won\'t update: initial</p></div></div>')
	})

	it('should update memoized element and its children when memo values change', () => {

		let count = 0
		let otherProp = 'initial'

		const MemoComponent = () => (
			<div>
				<p>This will always update: {otherProp}</p>
				<div memo={[count]}>
					<p>Memoized count: {count}</p>
					<p>This will update with count: {otherProp}</p>
				</div>
			</div>
		)

		render(<MemoComponent />, document.body)
		expect(document.body.innerHTML).toBe('<div><p>This will always update: initial</p><div><p>Memoized count: 0</p><p>This will update with count: initial</p></div></div>')

		count = 1
		otherProp = 'changed'
		render(<MemoComponent />, document.body)
		expect(document.body.innerHTML).toBe('<div><p>This will always update: changed</p><div><p>Memoized count: 1</p><p>This will update with count: changed</p></div></div>')
	})

	it('should only memo the specific element with memo attribute and its children', () => {

		let count = 0
		let text = 'Hello'

		const MemoComponent = () => (
			<div>
				<p memo={[count]}>
					Memoized count: {count}
					<span>{text}</span>
				</p>
				<p>{text}</p>
			</div>
		)

		render(<MemoComponent />, document.body)
		expect(document.body.innerHTML).toBe('<div><p>Memoized count: 0<span>Hello</span></p><p>Hello</p></div>')

		text = 'World'
		render(<MemoComponent />, document.body)
		expect(document.body.innerHTML).toBe('<div><p>Memoized count: 0<span>Hello</span></p><p>World</p></div>')

		count = 1
		render(<MemoComponent />, document.body)
		expect(document.body.innerHTML).toBe('<div><p>Memoized count: 1<span>World</span></p><p>World</p></div>')
	})

	it('should work with stateful components', () => {

		let ref: ThisParameterType<typeof StatefulMemoComponent> | null = null

		type Args = {
			count: number
			text: string
		}

		const StatefulMemoComponent: Stateful<Args> = function* (args) {

			while (true) yield (
				<div>
					<p>Always updates: {args.text}</p>
					<div memo={[args.count]}>
						<p>Memoized count: {args.count}</p>
						<p>Won't update unless count changes: {args.text}</p>
					</div>
				</div>
			)
		}

		render(<StatefulMemoComponent count={0} text="initial" ref={(el) => { ref = el }} />, document.body)
		expect(document.body.innerHTML).toBe('<div><div><p>Always updates: initial</p><div><p>Memoized count: 0</p><p>Won\'t update unless count changes: initial</p></div></div></div>')

		render(<StatefulMemoComponent count={0} text="changed" ref={(el) => { ref = el }} />, document.body)
		expect(document.body.innerHTML).toBe('<div><div><p>Always updates: changed</p><div><p>Memoized count: 0</p><p>Won\'t update unless count changes: initial</p></div></div></div>')

		render(<StatefulMemoComponent count={1} text="changed again" ref={(el) => { ref = el }} />, document.body)
		expect(document.body.innerHTML).toBe('<div><div><p>Always updates: changed again</p><div><p>Memoized count: 1</p><p>Won\'t update unless count changes: changed again</p></div></div></div>')
	})

	it('should work when memo is on a parent element of a stateful component', () => {

		let childRef: ThisParameterType<typeof StatefulChild> | null

		type Args = {
			text: string
		}

		const StatefulChild: Stateful<Args> = function* (args) {

			let internalCount = 0

			while (true) {
				yield (
					<div>
						<p>Child internal count: {internalCount}</p>
						<p>Child prop: {args.text}</p>
					</div>
				)
				internalCount++
			}
		}

		let parentCount = 0
		let childText = 'initial'

		const ParentComponent = () => (
			<div memo={[parentCount]}>
				<p>Parent count: {parentCount}</p>
				<StatefulChild text={childText} ref={el => childRef = el} />
			</div>
		)

		render(<ParentComponent />, document.body)
		expect(document.body.innerHTML).toBe('<div><p>Parent count: 0</p><div><div><p>Child internal count: 0</p><p>Child prop: initial</p></div></div></div>')

		childText = 'updated'
		render(<ParentComponent />, document.body)
		expect(document.body.innerHTML).toBe('<div><p>Parent count: 0</p><div><div><p>Child internal count: 0</p><p>Child prop: initial</p></div></div></div>')

		parentCount = 1
		render(<ParentComponent />, document.body)
		expect(document.body.innerHTML).toBe('<div><p>Parent count: 1</p><div><div><p>Child internal count: 1</p><p>Child prop: updated</p></div></div></div>')

		childRef!.render()
		expect(document.body.innerHTML).toBe('<div><p>Parent count: 1</p><div><div><p>Child internal count: 2</p><p>Child prop: updated</p></div></div></div>')
	})

	it('should work when memo is directly on the stateful component', () => {

		let componentRef: ThisParameterType<typeof MemoStatefulComponent> | null

		type Args = {
			count: number
			text: string
		}

		const MemoStatefulComponent: Stateful<Args> = function* (args) {

			let internalCount = 0

			while (true) {
				yield (
					<div memo={[args.count]}>
						<p>Args count: {args.count}</p>
						<p>Internal count: {internalCount}</p>
						<p>Text: {args.text}</p>
					</div>
				)
				internalCount++
			}
		}

		render(<MemoStatefulComponent count={0} text="initial" ref={el => componentRef = el} />, document.body)
		expect(document.body.innerHTML).toBe('<div><div><p>Args count: 0</p><p>Internal count: 0</p><p>Text: initial</p></div></div>')

		componentRef!.render()
		expect(document.body.innerHTML).toBe('<div><div><p>Args count: 0</p><p>Internal count: 0</p><p>Text: initial</p></div></div>')
		render(<MemoStatefulComponent count={0} text="updated" ref={(el) => { componentRef = el }} />, document.body)

		expect(document.body.innerHTML).toBe('<div><div><p>Args count: 0</p><p>Internal count: 0</p><p>Text: initial</p></div></div>')
		render(<MemoStatefulComponent count={1} text="final" ref={(el) => { componentRef = el }} />, document.body)
		expect(document.body.innerHTML).toBe('<div><div><p>Args count: 1</p><p>Internal count: 3</p><p>Text: final</p></div></div>')

		componentRef!.render()
		expect(document.body.innerHTML).toBe('<div><div><p>Args count: 1</p><p>Internal count: 3</p><p>Text: final</p></div></div>')
	})

	it('should work when memo is applied at the component JSX level', () => {

		let componentRef: ThisParameterType<typeof StatefulComponent> | null = null

		type Args = {
			count: number
			text: string
		}

		const StatefulComponent: Stateful<Args> = function* (args) {

			let internalCount = 0

			while (true) {
				yield (
					<div>
						<p>Args count: {args.count}</p>
						<p>Internal count: {internalCount}</p>
						<p>Text: {args.text}</p>
					</div>
				)
				internalCount++
			}
		}

		let count = 0
		let text = 'initial'

		const ParentComponent = () => (
			<div>
				<p>Parent text: {text}</p>
				<StatefulComponent
					memo={[count]}
					count={count}
					text={text}
					ref={(el) => { componentRef = el }}
				/>
			</div>
		)

		render(<ParentComponent />, document.body)
		expect(document.body.innerHTML).toBe('<div><p>Parent text: initial</p><div><div><p>Args count: 0</p><p>Internal count: 0</p><p>Text: initial</p></div></div></div>')

		text = 'updated'
		render(<ParentComponent />, document.body)
		expect(document.body.innerHTML).toBe('<div><p>Parent text: updated</p><div><div><p>Args count: 0</p><p>Internal count: 0</p><p>Text: initial</p></div></div></div>')

		componentRef!.render()
		expect(document.body.innerHTML).toBe('<div><p>Parent text: updated</p><div><div><p>Args count: 0</p><p>Internal count: 1</p><p>Text: initial</p></div></div></div>')

		count = 1
		render(<ParentComponent />, document.body)
		expect(document.body.innerHTML).toBe('<div><p>Parent text: updated</p><div><div><p>Args count: 1</p><p>Internal count: 2</p><p>Text: updated</p></div></div></div>')

		componentRef!.render()
		expect(document.body.innerHTML).toBe('<div><p>Parent text: updated</p><div><div><p>Args count: 1</p><p>Internal count: 3</p><p>Text: updated</p></div></div></div>')
	})

	it('should correctly handle full app re-rendering', () => {

		const Layout = (args: { children: Children }) =>
			<main>
				{args.children}
			</main>

		const Page1 = function* (args: { children: Children }) {

			while (true) yield (
				<>
					<div>
						Marketing Layout
					</div>
					{args.children}
				</>
			)
		}

		const Page2 = (args: { children: Children }) =>
			<>
				<div>
					Shop Layout
					<Counter />
				</div>
				{args.children}
			</>

		const Counter: Stateful = function* () {

			let count = 0

			const increment = () => {
				count++
				this.render()
			}

			while (true) yield (
				<button set:onclick={increment}>
					{count}
				</button>
			)
		}

		let Page = Page1

		const App = () =>
			<div memo={Page}>
				<Layout>
					<Page>
						Page Content
					</Page>
				</Layout>
			</div>

		render(<App />, document.body)

		expect(document.body.innerHTML).toBe('<div><main><div><div>Marketing Layout</div>Page Content</div></main></div>')

		Page = Page2

		render(<App />, document.body)

		expect(document.body.innerHTML).toBe('<div><main><div>Shop Layout<div><button>0</button></div></div>Page Content</main></div>')

		document.querySelector('button')!.click()

		expect(document.body.innerHTML).toBe('<div><main><div>Shop Layout<div><button>1</button></div></div>Page Content</main></div>')

		Page = Page1

		render(<App />, document.body)

		expect(document.body.innerHTML).toBe('<div><main><div><div>Marketing Layout</div>Page Content</div></main></div>')
	})
})
