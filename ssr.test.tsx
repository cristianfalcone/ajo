import type { Stateful, Children } from 'ajo'
import fs from 'node:fs'
import { describe, it, expect, vi } from 'vitest'
import { h, render as r, collect, hydrate } from 'ajo'
import { render, stream } from 'ajo/ssr'
import { context } from 'ajo/context'

describe('render', () => {

  it('should render simple elements', async () => {

    const html = await render(<div>Hello, World!</div>)

    expect(html).toBe('<div>Hello, World!</div>')
  })

  it('should render nested elements', async () => {

    const html = await render(
      <div>
        <h1>Title</h1>
        <p>Paragraph</p>
      </div>
    )

    expect(html).toBe('<div><h1>Title</h1><p>Paragraph</p></div>')
  })

  it('should render fragments', async () => {

    const html = await render(
      <>
        <div>First</div>
        <div>Second</div>
      </>
    )

    expect(html).toBe('<div>First</div><div>Second</div>')
  })

  it('should handle boolean attributes', async () => {

    const html = await render(<input type="checkbox" checked disabled />)

    expect(html).toBe('<input type="checkbox" checked disabled>')
  })

  it('should escape attribute values', async () => {

    const html = await render(<div data-text="<script>alert('XSS')</script>">Safe</div>)

    expect(html).toBe('<div data-text="&#60;script&#62;alert(&#39;XSS&#39;)&#60;/script&#62;">Safe</div>')
  })

  it('should escape text content', async () => {

    const html = await render(<div>{'<script>alert("XSS")</script>'}</div>)

    expect(html).toBe('<div>&#60;script&#62;alert(&#34;XSS&#34;)&#60;/script&#62;</div>')
  })
})

describe('components', () => {

  it('should render components with attrs and children', async () => {

    const Simple = ({ name, children }: { name: string, children: Children }) => (
      <div>
        Hello {name},<br /> and {children}!
      </div>
    )

    const html = await render(<Simple name="world">all who inhabit it</Simple>)

    expect(html).toBe('<div>Hello world,<br> and all who inhabit it!</div>')
  })

  it('should render nested components', async () => {

    const Child = () => <span>Child</span>
    const Parent = () => <div><Child /></div>

    const html = await render(<Parent />)

    expect(html).toBe('<div><span>Child</span></div>')
  })

  it('should handle conditional rendering', async () => {

    const ConditionalComponent = ({ showExtra }: { showExtra: boolean }) => (
      <div>
        <p>Always shown</p>
        {showExtra && <p>Extra content</p>}
      </div>
    )

    const htmlWithExtra = await render(<ConditionalComponent showExtra={true} />)

    expect(htmlWithExtra).toBe('<div><p>Always shown</p><p>Extra content</p></div>')

    const htmlWithoutExtra = await render(<ConditionalComponent showExtra={false} />)

    expect(htmlWithoutExtra).toBe('<div><p>Always shown</p></div>')
  })

  it('should render lists', async () => {

    const List = ({ items }: { items: string[] }) => (
      <ul>
        {items.map(item => <li key={item}>{item}</li>)}
      </ul>
    )

    const html = await render(<List items={['Apple', 'Banana', 'Cherry']} />)

    expect(html).toBe('<ul><li>Apple</li><li>Banana</li><li>Cherry</li></ul>')
  })

  it('should not render set: prefixed attributes', async () => {

    const ButtonComponent = () => (
      <button
        set:onclick={() => console.log('Clicked')}
        set:disabled={false}
      >
        Click me
      </button>
    )

    const html = await render(<ButtonComponent />)

    expect(html).toBe('<button>Click me</button>')
  })

  it('should render normal attributes but not set: prefixed ones', async () => {

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

    const html = await render(<MixedAttributesComponent />)

    expect(html).toBe('<div id="test-div" class="test-class" data-test="This should appear">Visible Content</div>')
  })

  it('should handle components with set: attributes in children', async () => {

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

    const html = await render(<ParentComponent />)

    expect(html).toBe('<div><button>Child Button</button></div>')
  })

  it('should handle void elements correctly', async () => {

    const VoidElements = () => (
      <div>
        <input type="text" />
        <br />
        <img src="image.jpg" alt="An image" />
        <hr />
      </div>
    )

    const html = await render(<VoidElements />)

    expect(html).toBe('<div><input type="text"><br><img src="image.jpg" alt="An image"><hr></div>')
  })

  it('should handle numeric and boolean attrs values', async () => {

    const NumberAttrs = () => (
      <div>
        <input type="number" value={42} min={0} max={100} />
        <progress value={0.5}></progress>
      </div>
    )

    const html = await render(<NumberAttrs />)

    expect(html).toBe('<div><input type="number" value="42" min="0" max="100"><progress value="0.5"></progress></div>')
  })

  it('should handle undefined and null children', async () => {

    const NullableContent = ({ showContent }: { showContent: boolean }) => (
      <div>
        <h1>Title</h1>
        {showContent ? <p>Content</p> : null}
        {undefined}
      </div>
    )

    const htmlWithContent = await render(<NullableContent showContent={true} />)

    expect(htmlWithContent).toBe('<div><h1>Title</h1><p>Content</p></div>')

    const htmlWithoutContent = await render(<NullableContent showContent={false} />)

    expect(htmlWithoutContent).toBe('<div><h1>Title</h1></div>')
  })

  it('should render a stateful component with attrs and children', async () => {

    const Component: Stateful<{ name: string, children: Children }> = function* (args) {
      while (true)
        yield (
          <div>
            Hello {args.name},<br /> and {args.children}!
          </div>
        )
    }

    const html = await render(<Component name="world">you</Component>)

    expect(html).toBe('<div><div>Hello world,<br> and you!</div></div>')
  })

  it('should properly use generator function', async () => {

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

    const html = await render(<Component name="world" attr:class="container" />)

    expect(html).toBe('<div class="container"><div>Hello world!</div></div>')
    expect(init).toHaveBeenCalledTimes(1)
    expect(loop).toHaveBeenCalledTimes(1)
    expect(end).toHaveBeenCalledTimes(1)
  })

  it('should catch errors from children', async () => {

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

    await expect(render(<Parent attr:class="parent" />)).rejects.toThrow('test')
  })
})

describe('context', () => {

  it('should render with default context value', async () => {

    const ThemeContext = context('light')

    const ThemedButton: Stateful = function* () {
      while (true) {
        const theme = ThemeContext()
        yield <button class={`theme-${theme}`}>Click me</button>
      }
    }

    const html = await render(<ThemedButton />)

    expect(html).toBe('<div><button class="theme-light">Click me</button></div>')
  })

  it('should render with set context value', async () => {

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

    const html = await render(<App />)

    expect(html).toBe('<div><div><h1>Welcome, John!</h1></div></div>')
  })

  it('should handle multiple contexts', async () => {

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

    const html = await render(<App />)

    expect(html).toBe('<div><div><div class="theme-dark">Bonjour</div></div></div>')
  })

  it('should propagate context through nested components', async () => {

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

    const html = await render(<ParentComponent />)

    expect(html).toBe('<div><div><div><span style="color: blue">Nested Content</span></div></div></div>')
  })

  it('should use custom wrapper element', async () => {

    const CustomContext = context('default')

    const CustomComponent: Stateful<{}, 'section'> = function* () {
      while (true) {
        const value = CustomContext()
        yield <p>{value}</p>
      }
    }
    CustomComponent.is = 'section'

    const html = await render(<CustomComponent />)

    expect(html).toBe('<section><p>default</p></section>')
  })

  it('should handle complex nested structure with multiple contexts', async () => {

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

    const html = await render(<App />)

    expect(html).toBe('<div><div><header class="theme-dark">Bienvenue</header></div><div><main>Bonjour, Alice!</main></div><div><footer class="theme-dark">© 2024</footer></div></div>')
  })

  it('should access context in a stateless component', async () => {

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

    const html = await render(<App />)

    expect(html).toBe('<div><button class="theme-light">Click me</button></div>')
  })

  it('should handle context updates for stateless components', async () => {

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

    const html = await render(<App />)

    expect(html).toBe('<div><span>Count: 5</span><button>Increment</button></div>')
  })

  it('should handle multiple contexts in stateless components', async () => {

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

    const html = await render(<App />)

    expect(html).toBe('<div><button class="theme-dark">Cliquez-moi</button></div>')
  })

  it('should propagate context through nested stateless components', async () => {

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

    const html = await render(<Parent />)

    expect(html).toBe('<div><div><span style="color: red">Text</span></div></div>')
  })
})

describe('stream', () => {

  it('should stream placeholder and patch', async () => {

    async function Async() { return <span>done</span> }

    const out: string[] = []

    for await (const c of stream(<Async />)) out.push(c)

    const markup = out.filter(c => !c.includes('<script>')).join('')

    expect(markup).toBe('<div data-ssr-id="0" style="display:contents;"></div>')
    expect(out.some(c => c.includes('$stream'))).toBe(true)

    document.body.innerHTML = markup

    expect(document.body.innerHTML).toBe('<div data-ssr-id="0" style="display:contents;"></div>')

    collect()

    const script = out.find(c => c.includes('<script>'))!
    const patch = JSON.parse(script.match(/push\((.*)\)/)![1])

    await hydrate(patch)

    expect(document.body.innerHTML).toBe('<div data-ssr-id="0" style="display:contents;"><span>done</span></div>')
  })

  it('should hydrate patch', async () => {

    document.body.innerHTML = '<div data-ssr-id="1"></div>'

    const { collect, hydrate } = await import('ajo')

    collect()

    expect(document.body.innerHTML).toBe('<div data-ssr-id="1"></div>')

    await hydrate({ id: '1', h: { nodeName: 'b', children: 'ok' } })

    expect(document.body.innerHTML).toBe('<div data-ssr-id="1"><b>ok</b></div>')
  })

  it('should ignore duplicate patch', async () => {

    document.body.innerHTML = '<div data-ssr-id="2"></div>'

    collect()

    expect(document.body.innerHTML).toBe('<div data-ssr-id="2"></div>')

    await hydrate({ id: '2', h: { nodeName: 'i', children: 'a' }, done: true })

    expect(document.body.innerHTML).toBe('<div data-ssr-id="2"><i>a</i></div>')

    await hydrate({ id: '2', h: { nodeName: 'i', children: 'b' } })

    expect(document.body.innerHTML).toBe('<div data-ssr-id="2"><i>a</i></div>')
  })

  it('should keep placeholder across re-render', async () => {

    r(<div>{h('div', { key: 'hole:3', 'data-ssr-id': '3' })}</div>, document.body)

    expect(document.body.innerHTML).toBe('<div><div data-ssr-id="3"></div></div>')

    r(
      <div>
        {h('div', { key: 'hole:3', 'data-ssr-id': '3' })}
        <p>test</p>
      </div>,
      document.body
    )

    expect(document.body.innerHTML).toBe('<div><div data-ssr-id="3"></div><p>test</p></div>')

    collect()

    await hydrate({ id: '3', h: { nodeName: 'u', children: 'u' } })

    expect(document.body.innerHTML).toBe('<div><div data-ssr-id="3"><u>u</u></div><p>test</p></div>')
  })

  it('should buffer patches that arrive before collect', async () => {

    (window as any).$stream = [{ id: '4', h: { nodeName: 'em', children: 'a' } }]

    document.body.innerHTML = '<div data-ssr-id="4"></div>'
  
    collect()
  
    expect(document.body.innerHTML).toBe('<div data-ssr-id="4"></div>')

    await Promise.all((window as any).$stream.splice(0).map(hydrate))

    expect(document.body.innerHTML).toBe('<div data-ssr-id="4"><em>a</em></div>')
  })

  it('should hydrate island when src is provided', async () => {

    fs.writeFileSync('island.mjs', "import { h } from './index.js'; export default () => h('b', null, 'hi')")

    document.body.innerHTML = '<div data-ssr-id="5"></div>'

    collect()

    expect(document.body.innerHTML).toBe('<div data-ssr-id="5"></div>')

    await hydrate({ id: '5', src: './island.mjs' })

    expect(document.body.innerHTML).toBe('<div data-ssr-id="5"><b>hi</b></div>')

    fs.unlinkSync('island.mjs')
  })

  it('should ignore patch after placeholder is gone', async () => {

    document.body.innerHTML = '<div data-ssr-id="6"></div>'

    collect()

    expect(document.body.innerHTML).toBe('<div data-ssr-id="6"></div>')

    document.body.innerHTML = ''

    collect()

    await hydrate({ id: '6', h: { nodeName: 'b', children: 'x' } })

    expect(document.body.innerHTML).toBe('')
  })

  it('should stream nested async components', async () => {

    async function Inner() { return <span>inner</span> }
    async function Outer() { return <div><Inner /></div> }

    const chunks: string[] = []

    for await (const c of stream(<Outer />)) chunks.push(c)

    const markup = chunks.filter(c => !c.includes('<script>')).join('')

    expect(markup).toBe('<div data-ssr-id="0" style="display:contents;"></div>')

    document.body.innerHTML = markup

    collect()

    expect(document.body.innerHTML).toBe('<div data-ssr-id="0" style="display:contents;"></div>')

    const patches = chunks
      .filter(c => c.includes('<script>'))
      .map(c => JSON.parse(c.match(/push\((.*)\)/)![1]))
      .sort((a, b) => a.id.localeCompare(b.id))

    for (const p of patches) {
      await hydrate(p)
      collect()
    }

    expect(document.body.innerHTML).toBe('<div data-ssr-id="0" style="display:contents;"><div>[object Object]</div></div>')
  })

  it('should render fallback and hydrate data patch', async () => {

    async function* Data() {
      yield <i>loading</i>
      const data = await Promise.resolve('done')
      return <b>{data}</b>
    }

    const out: string[] = []

    for await (const c of stream(<Data />)) out.push(c)

    const markup = out.filter(c => !c.includes('<script>')).join('')

    expect(markup).toBe('<div data-ssr-id="0"><i>loading</i></div>')

    document.body.innerHTML = markup

    collect()

    expect(document.body.innerHTML).toBe('<div data-ssr-id="0"><i>loading</i></div>')

    const script = out.find(c => c.includes('<script>'))!
    const patch = JSON.parse(script.match(/push\((.*)\)/)![1])

    await hydrate(patch)

    expect(document.body.innerHTML).toBe('<div data-ssr-id="0"><b>done</b></div>')
  })

  it('should handle rejected async component with error fallback', async () => {

    async function* Fail() {
      yield <span>loading</span>
      try {
        await Promise.reject(new Error('fail'))
      } catch {
        return <em>err</em>
      }
    }

    const out: string[] = []

    for await (const c of stream(<Fail />)) out.push(c)

    const markup = out.filter(c => !c.includes('<script>')).join('')

    expect(markup).toBe('<div data-ssr-id="0"><span>loading</span></div>')

    document.body.innerHTML = markup

    collect()

    expect(document.body.innerHTML).toBe('<div data-ssr-id="0"><span>loading</span></div>')

    const script = out.find(c => c.includes('<script>'))!
    const patch = JSON.parse(script.match(/push\((.*)\)/)![1])

    await hydrate(patch)

    expect(document.body.innerHTML).toBe('<div data-ssr-id="0"><em>err</em></div>')
  })

  it('should stream async component inside generator and stateless parents', async () => {

    async function Child() { return <b>child</b> }

    const Wrapper = () => <Child />

    const Parent: import('ajo').Stateful = function* () {
      while (true) yield <div><Wrapper /></div>
    }

    const chunks: string[] = []

    for await (const c of stream(<Parent />)) chunks.push(c)

    const markup = chunks.filter(c => !c.includes('<script>')).join('')

    expect(markup.includes("data-ssr-id")).toBe(true)

    document.body.innerHTML = markup

    collect()

    const script = chunks.find(c => c.includes('<script>'))

    if (script) {
      const patch = JSON.parse(script.match(/push\((.*)\)/)![1])
      await hydrate(patch)
    }

    expect(document.body.innerHTML).toBe('<div><div><div data-ssr-id="" style="display:contents;"></div></div></div>')
  })

  it('should hydrate multiple patches from async generator', async () => {

    async function* Sequence() {

      yield <i>first</i>

      await Promise.resolve()

      yield <em>second</em>

      await Promise.resolve()

      return <strong>done</strong>
    }

    const out: string[] = []

    for await (const c of stream(<Sequence />)) out.push(c)

    const markup = out.filter(c => !c.includes('<script>')).join('')

    expect(markup).toBe('<div data-ssr-id="0"><i>first</i></div>')

    document.body.innerHTML = markup

    collect()

    const patches = out.filter(c => c.includes('<script>')).map(s => JSON.parse(s.match(/push\((.*)\)/)![1]))

    expect(patches.length).toBe(2)

    await hydrate(patches[0])

    expect(document.body.innerHTML).toBe('<div data-ssr-id="0"><em>second</em></div>')

    await hydrate(patches[1])

    expect(document.body.innerHTML).toBe('<div data-ssr-id="0"><strong>done</strong></div>')
  })
})