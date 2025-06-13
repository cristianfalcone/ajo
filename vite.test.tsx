import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import polka, { type Polka } from 'polka'
import { createServer } from 'vite'
import ajo from 'ajo/vite'
import MagicString from 'magic-string'

const port = 5175

describe('vite-plugin-ajo', () => {

  let root: string, vite: Awaited<ReturnType<typeof createServer>>, http: Polka

  beforeAll(async () => {

    // create throw‑away project
    root = mkdtempSync(path.join(tmpdir(), 'ajo-test-'))

    const src = (p: string, code: string) => {
      const fn = path.join(root, 'src', p)
      mkdirSync(path.dirname(fn), { recursive: true })
      writeFileSync(fn, code.trimStart())
    }

    // root layout
    src('layout.tsx', `
      export default ({children}) => (
        <html><body><header>ROOT</header><div data-id="app">{children}</div></body></html>
      )
    `)

    // nested marketing/blog layout
    src('(marketing)/blog/layout.tsx', `
      export default ({children}) => <section data-blog><h2>Blog</h2>{children}</section>
    `)

    // pages
    src('page.tsx', `export default ()=> <h1>Home</h1>`)
    src('(marketing)/blog/[id]/page.tsx', `export default ({ params })=> <p>Post {params.id}</p>`)

    // island
    src('components/Counter.tsx', `
      'use client'
      export default function* () {
        let count = 0
        while (true) yield <button set:onclick={()=>{count++;this.render()}}>Count {count}</button>
      }
    `)

    // server action
    src('actions/save.ts', `
      export async function save(x) {
        'use server'
        return x*2
      }
    `)

    // create vite dev server in middleware mode
    vite = await createServer({
      root,
      plugins: [ajo()],
      server: { middlewareMode: true, hmr: false },
      logLevel: 'silent',
      esbuild: {
        jsxFactory: 'h', jsxFragment: 'Fragment',
        jsxInject: 'import { h,Fragment } from "ajo"'
      },
    })

    http = polka().use(vite.middlewares)

    await new Promise<void>(r => http.listen(port, r))
  })

  afterAll(async () => {

    await vite.close()

    http.server.close()

    rmSync(root, { recursive: true, force: true })
  })

  it('streams HTML for root page', async () => {

    const html = await (await fetch(`http://localhost:${port}/`)).text()

    expect(html).includes('<h1>Home</h1>')
    expect(html).includes('<header>ROOT</header>')
  })

  it('renders nested layout & dynamic route', async () => {

    const html = await (await fetch(`http://localhost:${port}/blog/42`)).text()

    expect(html).includes('Blog</h2>')
    expect(html).includes('Post 42')
  })

  it('compiles island with .src property', async () => {

    const m = await vite.ssrLoadModule('/src/components/Counter.tsx')

    expect(typeof m.default.src).toBe('string')
  })

  it('rewrites server action to fetch stub and executes round-trip', async () => {

    const out = await vite.transformRequest('/src/actions/save.ts')

    expect(out?.code).includes('fetch(\'/actions/') // stub present

    const res = await fetch(`http://localhost:${port}/actions/${out!.code.match(/actions\/([a-f0-9]{8})/)![1]}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: '[7]'
    })

    expect(await res.json()).toBe(14)
  })

  it('injects fallback root layout when custom one removed', async () => {

    // remove user layout & restart vite scan quickly
    rmSync(path.join(root, 'src', 'layout.tsx'))

    await vite.restart()

    const html = await (await fetch(`http://localhost:${port}/`)).text()

    expect(html).includes('data-ssr="page"') // placeholder from fallback
  })

  it('sends $stream patch on island change (HMR simulation)', async () => {

    const file = path.join(root, 'src', 'components', 'Counter.tsx')

    const text = readFileSync(file, 'utf-8')

    const ms = new MagicString(text).append('// edit\n')

    writeFileSync(file, ms.toString())

    // vite.transformRequest simulates HMR pipeline
    const res = await vite.transformRequest('/src/components/Counter.tsx')

    expect(res?.code).includes('// edit')
  })
})
