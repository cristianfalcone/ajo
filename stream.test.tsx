import type { Stateful } from 'ajo'
import fs from 'node:fs'
import { describe, it, expect } from 'vitest'
import { h, render } from 'ajo'
import { stream, hydrate } from 'ajo/stream'

describe('stream', () => {

  it('should stream placeholder and patch', async () => {

    async function Async() { return <span>done</span> }

    const out: string[] = []

    for await (const chunk of stream(<Async />)) out.push(chunk)

    document.body.innerHTML = out.filter(c => !c.includes('<script>')).join('')

    expect(document.body.innerHTML).toBe('<div data-ssr="0"></div>')
    expect(out.some(c => c.includes('$stream'))).toBe(true)

    const script = out.find(c => c.includes('<script>'))!
    const patch = JSON.parse(script.match(/push\((.*)\)/)![1])

    hydrate(patch)

    expect(document.body.innerHTML).toBe('<div data-ssr="0"><span>done</span></div>')
  })

  it('should hydrate patch', () => {

    document.body.innerHTML = '<div data-ssr="1"></div>'

    hydrate({ id: '1', h: { nodeName: 'b', children: 'ok' } })

    expect(document.body.innerHTML).toBe('<div data-ssr="1"><b>ok</b></div>')
  })

  it('should hydrate multiple patches', () => {

    document.body.innerHTML = '<div data-ssr="2"></div>'

    hydrate({ id: '2', h: { nodeName: 'i', children: 'foo' } })

    expect(document.body.innerHTML).toBe('<div data-ssr="2"><i>foo</i></div>')

    hydrate({ id: '2', h: { nodeName: 'i', children: 'bar' } })

    expect(document.body.innerHTML).toBe('<div data-ssr="2"><i>bar</i></div>')
  })

  it('should keep placeholder across re-render', () => {

    render(<div>{h('div', { 'data-ssr': '3' })}</div>, document.body)

    expect(document.body.innerHTML).toBe('<div><div data-ssr="3"></div></div>')

    render(
      <div>
        {h('div', { 'data-ssr': '3' })}
        <p>test</p>
      </div>,
      document.body
    )

    expect(document.body.innerHTML).toBe('<div><div data-ssr="3"></div><p>test</p></div>')

    hydrate({ id: '3', h: { nodeName: 'u', children: 'u' } })

    expect(document.body.innerHTML).toBe('<div><div data-ssr="3"><u>u</u></div><p>test</p></div>')
  })

  it('should buffer patches', () => {

    (window as any).$stream = [{ id: '4', h: { nodeName: 'em', children: 'a' } }]

    document.body.innerHTML = '<div data-ssr="4"></div>';

    (window as any).$stream.splice(0).map(hydrate)

    expect(document.body.innerHTML).toBe('<div data-ssr="4"><em>a</em></div>')
  })

  it('should hydrate island when src is provided', async () => {

    fs.writeFileSync('island.mjs', "import { h } from './index.js'; export default () => h('b', null, 'hi')")

    document.body.innerHTML = '<div data-ssr="5"></div>'

    await hydrate({ id: '5', src: './island.mjs' })

    expect(document.body.innerHTML).toBe('<div data-ssr="5"><b>hi</b></div>')

    fs.unlinkSync('island.mjs')
  })

  it('should ignore patch on non-existing placeholder', () => {

    document.body.innerHTML = ''

    hydrate({ id: '6', h: { nodeName: 'b', children: 'x' } })

    expect(document.body.innerHTML).toBe('')
  })

  it('should stream nested async components', async () => {

    async function Inner() { return <span>inner</span> }

    async function Outer() { return <div><Inner /></div> }

    const chunks: string[] = []

    for await (const c of stream(<Outer />)) chunks.push(c)

    document.body.innerHTML = chunks.filter(c => !c.includes('<script>')).join('')

    expect(document.body.innerHTML).toBe('<div data-ssr="0"></div>')

    const patches = chunks
      .filter(c => c.includes('<script>'))
      .map(c => JSON.parse(c.match(/push\((.*)\)/)![1]))
      .sort((a, b) => a.id.localeCompare(b.id)) // Process parent before children

    for (const patch of patches) hydrate(patch)

    expect(document.body.innerHTML).toBe('<div data-ssr="0"><div><div data-ssr="0:0"><span>inner</span></div></div></div>')
  })

  it('should render fallback and hydrate data patch', async () => {

    async function* Data() {
      yield <i>loading</i>
      const data = await Promise.resolve('done')
      return <b>{data}</b>
    }

    const out: string[] = []

    for await (const c of stream(<Data />)) out.push(c)

    document.body.innerHTML = out.filter(c => !c.includes('<script>')).join('')

    expect(document.body.innerHTML).toBe('<div data-ssr="0"></div>')

    const scripts = out.filter(c => c.includes('<script>'))

    expect(scripts.length).toBe(2) // First yield and final return

    // First patch with yielded value
    const firstPatch = JSON.parse(scripts[0].match(/push\((.*)\)/)![1])

    expect(firstPatch.done).toBe(false)

    hydrate(firstPatch)

    expect(document.body.innerHTML).toBe('<div data-ssr="0"><i>loading</i></div>')

    // Second patch with final value
    const finalPatch = JSON.parse(scripts[1].match(/push\((.*)\)/)![1])

    expect(finalPatch.done).toBe(true)

    hydrate(finalPatch)

    expect(document.body.innerHTML).toBe('<div data-ssr="0"><b>done</b></div>')
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

    for await (const chunk of stream(<Fail />)) out.push(chunk)

    document.body.innerHTML = out.filter(c => !c.includes('<script>')).join('')

    expect(document.body.innerHTML).toBe('<div data-ssr="0"></div>')

    const scripts = out.filter(c => c.includes('<script>'))

    expect(scripts.length).toBe(2) // First yield and final return

    // First patch with yielded value
    const firstPatch = JSON.parse(scripts[0].match(/push\((.*)\)/)![1])

    expect(firstPatch.done).toBe(false)

    hydrate(firstPatch)

    expect(document.body.innerHTML).toBe('<div data-ssr="0"><span>loading</span></div>')

    // Second patch with error recovery
    const finalPatch = JSON.parse(scripts[1].match(/push\((.*)\)/)![1])

    expect(finalPatch.done).toBe(true)

    hydrate(finalPatch)

    expect(document.body.innerHTML).toBe('<div data-ssr="0"><em>err</em></div>')
  })

  it('should stream async component inside generator and stateless parents', async () => {

    async function Child() { return <b>child</b> }

    const Wrapper = () => <Child />

    const Parent: Stateful = function* () {
      while (true) yield <div><Wrapper /></div>
    }

    const chunks: string[] = []

    for await (const c of stream(<Parent />)) chunks.push(c)

    document.body.innerHTML = chunks.filter(c => !c.includes('<script>')).join('')

    expect(document.body.innerHTML.includes("data-ssr")).toBe(true)

    const script = chunks.find(c => c.includes('<script>'))

    if (script) hydrate(JSON.parse(script.match(/push\((.*)\)/)![1]))

    expect(document.body.innerHTML).toBe('<div><div><div data-ssr="0"><b>child</b></div></div></div>')
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

    document.body.innerHTML = out.filter(c => !c.includes('<script>')).join('')

    expect(document.body.innerHTML).toBe('<div data-ssr="0"></div>')

    const patches = out.filter(c => c.includes('<script>')).map(s => JSON.parse(s.match(/push\((.*)\)/)![1]))

    expect(patches.length).toBe(3) // first yield, second yield, and return value

    hydrate(patches[0])

    expect(document.body.innerHTML).toBe('<div data-ssr="0"><i>first</i></div>')

    hydrate(patches[1])

    expect(document.body.innerHTML).toBe('<div data-ssr="0"><em>second</em></div>')

    hydrate(patches[2])

    expect(document.body.innerHTML).toBe('<div data-ssr="0"><strong>done</strong></div>')
  })

  it('should handle multiple sibling async components', async () => {

    async function First() { return <span>first</span> }

    async function Second() { return <span>second</span> }

    const Parent = () => <div><First /><Second /></div>

    const chunks: string[] = []

    for await (const c of stream(<Parent />)) chunks.push(c)

    document.body.innerHTML = chunks.filter(c => !c.includes('<script>')).join('')

    expect(document.body.innerHTML).toBe('<div><div data-ssr="0"></div><div data-ssr="1"></div></div>')

    const patches = chunks
      .filter(c => c.includes('<script>'))
      .map(c => JSON.parse(c.match(/push\((.*)\)/)![1]))

    for (const patch of patches) hydrate(patch)

    expect(document.body.innerHTML).toBe('<div><div data-ssr="0"><span>first</span></div><div data-ssr="1"><span>second</span></div></div>')
  })

  it('should handle deeply nested async components', async () => {

    async function DeepChild() { return <span>deep</span> }

    async function MiddleChild() { return <div><DeepChild /></div> }

    async function Parent() { return <div><MiddleChild /></div> }

    const chunks: string[] = []

    for await (const c of stream(<Parent />)) chunks.push(c)

    document.body.innerHTML = chunks.filter(c => !c.includes('<script>')).join('')

    expect(document.body.innerHTML).toBe('<div data-ssr="0"></div>')

    const patches = chunks
      .filter(c => c.includes('<script>'))
      .map(c => JSON.parse(c.match(/push\((.*)\)/)![1]))
      .sort((a, b) => a.id.localeCompare(b.id)) // Process parent before children

    for (const patch of patches) hydrate(patch)

    expect(document.body.innerHTML).toBe('<div data-ssr="0"><div><div data-ssr="0:0"><div><div data-ssr="0:0:0"><span>deep</span></div></div></div></div></div>')
  })

  it('should handle mixed async and sync nested components', async () => {

    async function AsyncChild() { return <span>async</span> }

    const SyncChild = () => <span>sync</span>

    async function Parent() { return <div><SyncChild /><AsyncChild /></div> }

    const chunks: string[] = []

    for await (const c of stream(<Parent />)) chunks.push(c)

    document.body.innerHTML = chunks.filter(c => !c.includes('<script>')).join('')

    expect(document.body.innerHTML).toBe('<div data-ssr="0"></div>')

    const patches = chunks
      .filter(c => c.includes('<script>'))
      .map(c => JSON.parse(c.match(/push\((.*)\)/)![1]))
      .sort((a, b) => a.id.localeCompare(b.id)) // Process parent before children

    for (const patch of patches) await hydrate(patch)

    expect(document.body.innerHTML).toBe('<div data-ssr="0"><div><span>sync</span><div data-ssr="0:0"><span>async</span></div></div></div>')
  })
})
