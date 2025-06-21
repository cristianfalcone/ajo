import fs from 'node:fs'
import { describe, it, expect } from 'vitest'
import { render } from 'ajo'
import { stream, hydrate } from 'ajo/stream'
import type { Children, Stateful } from 'ajo'
import type { Patch } from 'ajo/html'

const patchRE = /push\((.*)\)/

const drain = async (h: Children) => {

	const patches: Patch[] = []

	let html = ''

	for await (const chunk of stream(h)) chunk.includes('<script>') ? patches.push(JSON.parse(chunk.match(patchRE)![1])) : html += chunk

	return [html, patches] as const
}

describe('stream', () => {

	it('should stream placeholder and patch', async () => {

		async function Async() { return <span>done</span> }

		const [html, patches] = await drain(<Async />)

		document.body.innerHTML = html

		expect(document.body.innerHTML).toBe('<div data-ssr="0"></div>')

		patches.forEach(hydrate)

		expect(document.body.innerHTML).toBe('<div data-ssr="0"><span>done</span></div>')
	})

	it('should hydrate patch', () => {

		document.body.innerHTML = '<div data-ssr="1"></div>'

		hydrate({ id: '1', h: { nodeName: 'b', children: 'ok' }, done: true })

		expect(document.body.innerHTML).toBe('<div data-ssr="1"><b>ok</b></div>')
	})

	it('should hydrate multiple patches', () => {

		document.body.innerHTML = '<div data-ssr="2"></div>'

		hydrate({ id: '2', h: { nodeName: 'i', children: 'foo' }, done: false })

		expect(document.body.innerHTML).toBe('<div data-ssr="2"><i>foo</i></div>')

		hydrate({ id: '2', h: { nodeName: 'i', children: 'bar' }, done: true })

		expect(document.body.innerHTML).toBe('<div data-ssr="2"><i>bar</i></div>')
	})

	it('should keep placeholder across re-render', () => {

		render(<div><div data-ssr="3"></div></div>, document.body)

		expect(document.body.innerHTML).toBe('<div><div data-ssr="3"></div></div>')

		render(
			<div>
				<div data-ssr="3"></div>
				<p>test</p>
			</div>,
			document.body
		)

		expect(document.body.innerHTML).toBe('<div><div data-ssr="3"></div><p>test</p></div>')

		hydrate({ id: '3', h: { nodeName: 'u', children: 'u' }, done: true })

		expect(document.body.innerHTML).toBe('<div><div data-ssr="3"><u>u</u></div><p>test</p></div>')
	})

	it('should buffer patches', () => {

		(window as any).$stream = [{ id: '4', h: { nodeName: 'em', children: 'a' }, done: true }]

		document.body.innerHTML = '<div data-ssr="4"></div>';

		(window as any).$stream.splice(0).map(hydrate)

		expect(document.body.innerHTML).toBe('<div data-ssr="4"><em>a</em></div>')
	})

	it('should hydrate stateless island when src is provided', async () => {

		fs.writeFileSync(

			'island-stateless.mjs',

			`
        import { h } from './index.js'

        export default ({ children }) => h('b', null, 'hi', children);
      `
		)

		document.body.innerHTML = '<div data-ssr="5"></div>'

		await hydrate({ id: '5', src: './island-stateless.mjs', h: { children: ' there!' }, done: true })

		fs.unlinkSync('island-stateless.mjs')

		expect(document.body.innerHTML).toBe('<div data-ssr="5"><b>hi there!</b></div>')
	})

	it('should hydrate a stateful component island when src is provided', async () => {

		fs.writeFileSync(

			'island-stateful.mjs',

			`
        import { h } from './index.js'

        export default function* (args) {

          let count = 0

          const increment = () => {

            count++

            this.render()
          }

          while (true) yield (

            h('button', { 'set:onclick': increment }, \`Count: \${count}\`, args.children)
          )
        }
      `
		)

		document.body.innerHTML = '<div data-ssr="5"></div>'

		await hydrate({ id: '5', src: './island-stateful.mjs', h: { children: ' times!' }, done: true })

		fs.unlinkSync('island-stateful.mjs')

		expect(document.body.innerHTML).toBe('<div data-ssr="5"><div><button>Count: 0 times!</button></div></div>')

		document.querySelector('button')!.click()

		expect(document.body.innerHTML).toBe('<div data-ssr="5"><div><button>Count: 1 times!</button></div></div>')
	})

	it('should ignore patch on non-existing placeholder', () => {

		document.body.innerHTML = ''

		hydrate({ id: '6', h: { nodeName: 'b', children: 'x' }, done: true })

		expect(document.body.innerHTML).toBe('')
	})

	it('should stream nested async components', async () => {

		async function Inner() { return <span>inner</span> }

		async function Outer() { return <div><Inner /></div> }

		const [html, patches] = await drain(<Outer fallback={<i>loading</i>} />)

		document.body.innerHTML = html

		expect(document.body.innerHTML).toBe('<div data-ssr="0"><i>loading</i></div>')

		patches.forEach(hydrate)

		expect(document.body.innerHTML).toBe('<div data-ssr="0"><div><div data-ssr="0:0"><span>inner</span></div></div></div>')
	})

	it('should render fallback and hydrate data patch', async () => {

		async function* Data() {

			yield <i>waiting</i>

			const data = await Promise.resolve('done')

			return <b>{data}</b>
		}

		const [html, patches] = await drain(<Data fallback={<i>loading</i>} />)

		document.body.innerHTML = html

		expect(document.body.innerHTML).toBe('<div data-ssr="0"><i>loading</i></div>')

		expect(patches.length).toBe(2) // First yield and final return

		// First patch with yielded value
		const firstPatch = patches[0]

		expect(firstPatch.done).toBe(false)

		hydrate(firstPatch)

		expect(document.body.innerHTML).toBe('<div data-ssr="0"><i>waiting</i></div>')

		// Second patch with final value
		const finalPatch = patches[1]

		expect(finalPatch.done).toBe(true)

		hydrate(finalPatch)

		expect(document.body.innerHTML).toBe('<div data-ssr="0"><b>done</b></div>')
	})

	it('should handle rejected async component with error fallback', async () => {

		async function* Fail() {

			yield <i>waiting</i>

			try {

				await Promise.reject(new Error('fail'))

			} catch {

				return <em>err</em>
			}
		}

		const [html, patches] = await drain(<Fail fallback={<i>loading</i>} />)

		document.body.innerHTML = html

		expect(document.body.innerHTML).toBe('<div data-ssr="0"><i>loading</i></div>')

		expect(patches.length).toBe(2) // First yield and final return

		// First patch with yielded value
		const firstPatch = patches[0]

		expect(firstPatch.done).toBe(false)

		hydrate(firstPatch)

		expect(document.body.innerHTML).toBe('<div data-ssr="0"><i>waiting</i></div>')

		// Second patch with error recovery
		const finalPatch = patches[1]

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

		const [html, patches] = await drain(<Parent />)

		document.body.innerHTML = html

		expect(document.body.innerHTML.includes("data-ssr")).toBe(true)

		patches.forEach(hydrate)

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

		const [html, patches] = await drain(<Sequence />)

		document.body.innerHTML = html

		expect(document.body.innerHTML).toBe('<div data-ssr="0"></div>')

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

		const [html, patches] = await drain(<Parent />)

		document.body.innerHTML = html

		expect(document.body.innerHTML).toBe('<div><div data-ssr="0"></div><div data-ssr="1"></div></div>')

		patches.forEach(hydrate)

		expect(document.body.innerHTML).toBe('<div><div data-ssr="0"><span>first</span></div><div data-ssr="1"><span>second</span></div></div>')
	})

	it('should handle deeply nested async components', async () => {

		async function DeepChild() { return <span>deep</span> }

		async function MiddleChild() { return <div><DeepChild /></div> }

		async function Parent() { return <div><MiddleChild /></div> }

		const [html, patches] = await drain(<Parent />)

		document.body.innerHTML = html

		expect(document.body.innerHTML).toBe('<div data-ssr="0"></div>')

		patches.forEach(hydrate)

		expect(document.body.innerHTML).toBe('<div data-ssr="0"><div><div data-ssr="0:0"><div><div data-ssr="0:0:0"><span>deep</span></div></div></div></div></div>')
	})

	it('should handle mixed async and sync nested components', async () => {

		async function AsyncChild() { return <span>async</span> }

		const SyncChild = () => <span>sync</span>

		async function Parent() { return <div><SyncChild /><AsyncChild /></div> }

		const [html, patches] = await drain(<Parent />)

		document.body.innerHTML = html

		expect(document.body.innerHTML).toBe('<div data-ssr="0"></div>')

		patches.forEach(hydrate)

		expect(document.body.innerHTML).toBe('<div data-ssr="0"><div><span>sync</span><div data-ssr="0:0"><span>async</span></div></div></div>')
	})
})
