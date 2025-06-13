import path from 'node:path'
import crypto from 'node:crypto'
import fg from 'fast-glob'
import acorn from 'acorn'
import * as walk from 'acorn-walk'
import MagicString from 'magic-string'
import { normalizePath as viteNormalizePath } from 'vite'

const base = { pagesDir: 'src', actionsPrefix: '/actions' }

const ROOT = '\0ajo-root-layout'

const sha = data => crypto.createHash('sha1').update(data).digest('hex').slice(0, 8)

const normalizePath = p => viteNormalizePath(p).replace(/\\/g, '/')

const hasDirective = (src, directive) => {

  const node = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' }).body[0]

  return node?.type === 'ExpressionStatement' && node.directive === directive
}

const isClient = src => hasDirective(src, 'use client')

const isServer = src => hasDirective(src, 'use server')

let config                // vite resolved config
const pages = []          // { file, seg }
const layouts = new Map() // dir -> layoutFile
const islands = []        // abs paths marked "use client"
const actions = []        // { id, file, name }

// scan project
async function scan(root, dir) {

  const glb = `${dir}/**/{page,layout}.{js,jsx,ts,tsx}`

  const list = await fg(glb, { cwd: root })

  list.forEach(f => {

    const abs = '/' + normalizePath(f)

    const rel = normalizePath(f.slice(dir.length + 1))

    const seg = rel.split('/')

    if (f.includes('/layout.')) layouts.set('/' + normalizePath(path.dirname(f)).slice(dir.length + 1) || '/', abs)

    else pages.push({ file: abs, seg })
  })

  if (!layouts.has('/')) layouts.set('/', ROOT)
}

// pattern for navaid / trouter
const pattern = seg => seg
  .filter(s => !/^\(.*\)$/.test(s))
  .map(s => s.replace(/^\[(\.{3})?(.+?)\]$/, (_, d, n) => d ? '*' : ':' + n))
  .join('/') || '/'

// rows for router
const rows = () => pages.map(({ file, seg }) => {

  const list = []

  let dir = '/' + seg.slice(0, -1).join('/')

  for (let d = dir; ; d = path.posix.dirname(d)) {

    if (layouts.has(d)) list.unshift(layouts.get(d))

    if (!d || d === '/') break
  }

  return `{p:${JSON.stringify(pattern(seg))},f:${JSON.stringify(file)},l:${JSON.stringify(list)}}`

}).join(',')

// virtual modules

const codeIslands = () => `export default ${JSON.stringify(islands)}`

const codeStream = () => `
import list from 'virtual:ajo-kit/islands'
import { hydrate } from 'ajo/stream'

const mods = import.meta.glob(list)
const buf = window.$stream ?? []

window.$stream = { push(p){
  if (p.src && mods[p.src]) mods[p.src]().then(() => hydrate(p))
  else hydrate(p)
}}

buf.forEach(window.$stream.push)
`
const codeClient = () => `
import 'virtual:ajo-kit/stream'
import { mount } from 'virtual:ajo-kit/router'

mount()
`
const codeActions = () => `
import polka from 'polka'

const app = polka()

${actions.map(action => `
app.post('/${action.id}', async (req, res) => {

  const d = await req.text().then(t => JSON.parse(t || '[]'))
  const m = await import('/${action.file}')

  res.end(JSON.stringify(await m.${action.name}(...d) ?? null))

})`).join('\n')}

export default app
`

const codeRouter = () => `
import navaid from 'navaid'
import trouter from 'trouter'
import { stream } from 'ajo/stream'

const R=[${rows()}]

export function mount(){

  const navigate = url => fetch(url, { headers: { 'x-ajo': '1' } }).then(r => r.text()).then(eval).then(() => history.pushState(null, '', url))

  const router = navaid('/', path => console.warn('404', path))

  R.forEach(e => router.on(e.p, () => navigate(e.p.startsWith('/') ? e.p : '/' + e.p)))

  router.listen()
}

export function createServer() {

  const router = new trouter()

  R.forEach(e => {

    router.add('GET', e.p, async (q, s) => {

      const spa = q.headers['x-ajo'] === '1'

      const [{ default: P }, ...Ls] = await Promise.all([import(e.f), ...e.l.map(i => import(i))])

      let v = () => h(P)

      Ls.reverse().forEach(L => {

        const C = v

        v = () => h(L.default, null, h(C))
      })

      if (spa) {

        let str = ''
        
        for await (const c of stream(v())) str += c

        return s.end(\`<script>window.$stream.push({ id: 'page', h: \${JSON.stringify(str)} })</script>\`)
      }

      s.setHeader('content-type', 'text/html')

      for await (const c of stream(v())) s.write(c)

      s.end()
    })
  })

  return router
}
`

const codeRoot = () => `
export default ({ children }) => (
  <html lang="en"><head><meta charset=utf-8></head>
  <body><div data-ssr="page">{children}</div></body></html>
)
`

/**
 * @param {import('ajo/vite').Options} options
 * @returns {import('vite').Plugin}
 */
export default function ajo(options = {}) {

  options = { ...base, ...options }

  return {

    name: 'vite-plugin-ajo',

    enforce: 'post',

    async configResolved(c) {

      config = c

      await scan(c.root, options.pagesDir)
    },

    transform(src, id, info) {

      if (!id.startsWith(config.root) || id.includes('\0')) return

      const file = '/' + normalizePath(path.relative(config.root, id))

      const out = wrapRoot(src, file, options.pagesDir)

      if (out) return out

      if (isClient(src)) {

        islands.push(file)

        if (info?.ssr) return `const C=()=>null;C.src='${file}';export default C`

        return src.replace(isClient, '') + '\nexport default Object.assign(defaultExport ?? exports.default,{src:import.meta.url})'
      }

      if (isServer(src)) {

        const out = rewriteAction(src, file, info?.ssr, options.actionsPrefix)

        if (out) return out
      }
    },

    async configureServer(s) { await plugRouterAndActs(s.middlewares, s.ssrLoadModule.bind(s)) },

    async configurePreview(s) { await plugRouterAndActs(s.middlewares, s.ssrLoadModule.bind(s)) },

    resolveId(id) {
      if (id === 'virtual:ajo-kit/islands') return '\0islands'
      if (id === 'virtual:ajo-kit/stream') return '\0stream'
      if (id === 'virtual:ajo-kit/client') return '\0client'
      if (id === 'virtual:ajo-kit/actions') return '\0actions'
      if (id === 'virtual:ajo-kit/router') return '\0router'
      if (id === ROOT) return ROOT
    },

    load(id) {
      if (id === '\0islands') return codeIslands()
      if (id === '\0stream') return codeStream()
      if (id === '\0client') return codeClient()
      if (id === '\0actions') return codeActions(options.actionsPrefix)
      if (id === '\0router') return codeRouter()
      if (id === ROOT) return codeRoot()
    },

    transformIndexHtml() {
      return {
        html: '<!doctype html><div id="root"><!--ssr:root--></div>',
        tags: [{
          tag: 'script',
          attrs: { type: 'module', src: '/@id/virtual:ajo-kit/client' },
          injectTo: 'body'
        }]
      }
    },
  }

  function wrapRoot(src, file, dir) {

    if (!new RegExp(`^/?${dir}/layout\\.[jt]sx?$`).test(file)) return null

    const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' })
  
    const ms = new MagicString(src)

    let name = null, patched = false

    walk.simple(ast, {

      ExportDefaultDeclaration(node) {

        const fn = node.declaration

        if (fn && (fn.type === 'ArrowFunctionExpression' || fn.type === 'FunctionExpression')) {

          const param = fn.params[0]

          if (!param) return

          if (param.type === 'Identifier') name = param.name

          else if (param.type === 'ObjectPattern') {

            const prop = param.properties.find(prop => prop.key?.name === 'children')

            if (prop && prop.value.type === 'Identifier') name = prop.value.name
          }
        }
      }
    })

    if (!name) return null

    walk.simple(ast, {

      CallExpression(node) {

        if (patched) return

        const arg = node.arguments[2]

        if (arg && arg.type === 'Identifier' && arg.name === name) {

          ms.prependLeft(arg.start, `h('div', { 'data-ssr': 'page' }, `)

          ms.appendRight(arg.end, ')')

          patched = true
        }
      }
    })

    return patched ? ms.toString() : null
  }

  function rewriteAction(src, file, ssr, base) {

    const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' })

    const ms = new MagicString(src); let changed = false

    walk.simple(ast, {

      FunctionDeclaration(node) {

        const dir = node.body.body[0]

        if (dir?.directive !== 'use server') return

        const name = node.id.name, idn = sha(file + name)

        actions.push({ id: idn, file: file.slice(1), name })

        changed = true

        if (ssr) {

          ms.remove(dir.start, dir.end)

          return
        }

        ms.overwrite(node.start, node.end, `
export async function ${name}(...a){
  return (await fetch('${base}/${idn}',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify(a)
  })).json()
}`)
      }
    })

    return changed ? ms.toString() : null
  }

  async function plugRouterAndActs(stack, ssrLoad) {

    stack.use((await ssrLoad('virtual:ajo-kit/actions')).default.handler)

    stack.use((await ssrLoad('virtual:ajo-kit/router')).createServer().handler)
  }
}
