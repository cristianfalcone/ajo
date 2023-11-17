// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, component } from 'ajo'

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
    const fn = () => {}

    let div = null

    document.body.innerHTML = html

    render(<Simple />, document.body)

    expect(document.body.innerHTML).toBe(html)
    expect(div.onclick).toBe(fn)
  })
})

describe('component', () => {

	beforeEach(() => {
    document.body.innerHTML = ''
    vi.useFakeTimers()
  })

	it('should render a stateful component with attrs and children', async () => {

    const Component = component(function* () {
			for (const { name, children } of this) yield <div>Hello {name},<br /> and {children}!</div>
		})

    render(<Component class="container" arg:name="world">you</Component>, document.body)
    
    vi.runAllTimers()

    expect(document.body.innerHTML).toBe('<host-0 class="container"><div>Hello world,<br> and you!</div></host-0>')
  })

  it('should reuse the same stateful component instance', async () => {

    const Component = component(function* () {
      for (const { name } of this) yield <div ref={el => { div = el; count++ }}>Hello {name}!</div>
    })
    
    let div = null, count = 0

    render(<Component class="container" arg:name="world" />, document.body)

    vi.runAllTimers()

    expect(document.body.innerHTML).toBe('<host-1 class="container"><div>Hello world!</div></host-1>')
    
    const firstDiv = div

    vi.clearAllTimers()

    render(<Component arg:name="you" />, document.body)

    vi.runAllTimers()

    const secondDiv = div
    
    expect(document.body.innerHTML).toBe('<host-1><div>Hello you!</div></host-1>')
    expect(firstDiv).toBe(secondDiv)
    expect(count).toBe(2)
  })

  it('should extend a built-in element', async () => {

    const Component = component(function* ({ name }) {
      for ({} of this) yield <div>Hello {name}!</div>
    }, { as: 'div' })

    render(<Component class="container" arg:name="world" />, document.body)

    vi.runAllTimers()
    
    expect(document.body.innerHTML).toBe('<div is="host-2" class="container"><div>Hello world!</div></div>')
  })

  it('should hydrate a stateful component', async () => {

    const Component = component(function* ({ name }) {
      for ({} of this) yield <div>Hello {name}!</div>
    }, { as: 'div' })

    const html = '<div is="host-3" class="container"><div>Hello world!</div></div>'

    document.body.innerHTML = html

    render(<Component class="container" arg:name="world" />, document.body)

    vi.runAllTimers()

    expect(document.body.innerHTML).toBe(html)
  })
})
