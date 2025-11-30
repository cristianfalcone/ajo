# Ajo LLM Instructions

Ajo is a micro UI library using JSX and generators. **No React imports**: JSX compiles to Ajo via build config.

## Stateless Component

```tsx
import type { Children, Stateless } from 'ajo'
import clsx from 'clsx' // optional, for conditional classes

type Args = { title: string; active?: boolean; children?: Children }

const Card: Stateless<Args> = ({ title, active, children }) => ( // can destructure args here
  <div class={clsx('card', { active })}>
    <h3>{title}</h3>
    {children}
  </div>
)

// Example usage - everything goes to args:
<Card title="Hello" active>
  <p>This is a card.</p>
</Card>
```

## Stateful Component

```tsx
import type { Stateful } from 'ajo'

type Args = { initial: number; step?: number }

const Counter: Stateful<Args, 'section'> = function* (args) { // do NOT destructure args here

  // before loop: persistent state & handlers

  let count = args.initial
  let inputRef: HTMLInputElement | null = null

  const inc = () => this.next(({ step = 1 }) => count += step)
  const dec = () => this.next(() => count--)

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') inc()
    else if (e.key === 'ArrowDown' && count > 0) dec()
  }

  this.addEventListener('keydown', handleKeydown) // this = wrapper element with .next(), .throw(), .return()

  try { // optional: cleanup wrapper

    while (true) { // main render loop

      try { // optional: error boundary

        // fresh destructure each render
        const { step = 1 } = args

        // derived values
        const isEven = count % 2 === 0

        yield (
          <>
            <input
              ref={el => inputRef = el}
              value={count}
              set:oninput={e => this.next(() => count = +(e.target as HTMLInputElement).value)}
            />
            <button set:onclick={inc}>+{step}</button>
            <button set:onclick={dec} disabled={count <= 0}>-</button>
            <p memo={isEven}>Even: {isEven ? 'yes' : 'no'}</p>
            <footer memo>Static content - rendered once</footer>
            <div skip>{/* third-party managed DOM here */}</div>
          </>
        )
      } catch (err: unknown) {
        yield <p class="error">{err instanceof Error ? err.message : String(err)}</p>
      }
    }
  } finally {
    this.removeEventListener('keydown', handleKeydown)
  }
}

Counter.is = 'section'                    // wrapper element (default: div)
Counter.attrs = { class: 'counter-wrap' } // default wrapper attributes
Counter.args = { step: 1 }                // default args

// Example usage - special attrs apply to wrapper, rest goes to args:

let ref: ThisParameterType<typeof Counter> | null = null

<Counter
  initial={0} step={5}                    // → args
  attr:id="main" attr:class="my-counter"  // → wrapper attributes (HTML attrs)
  set:onclick={fn}                        // → wrapper properties (DOM props)
  key={id}                                // → wrapper key
  memo={[id]}                             // → wrapper memo (array)
  memo={id}                               // → wrapper memo (single value)
  memo                                    // → wrapper memo (render once)
  ref={el => ref = el}                    // → wrapper ref (el is <section> + .next()/.throw()/.return())
/>

ref?.next()  // trigger re-render from outside
```

## Rules

| Topic | Rule |
|-------|------|
| **Elements** | Everything becomes HTML attributes. `set:prop` assigns DOM properties instead (`node[prop] = value`) |
| **Stateless** | Everything goes to `args`. Special attrs like `memo` must be applied to elements inside |
| **Stateful** | `key`, `memo`, `skip`, `ref`, `set:*` apply to implicit wrapper element. `attr:*` sets wrapper attributes. Rest goes to `args` |
| **Events** | `set:onclick`, `set:oninput`, etc. Never `onClick` |
| **Classes** | `class`, never `className`. Must be string, no object/array syntax. Use `clsx()` or template literals |
| **Styles** | `style` must be string (`style="color: red"`), not object. No special handling |
| **Args** | Never destructure in generator signature. Use `args` param |
| **Root JSX** | Use `<>...</>` in stateful to avoid double wrapper |
| **Re-render** | `this.next()` or `this.next(fn)` where `fn` receives current `args` |
| **Context** | `context<T>(fallback)` creates context. Stateless: read only. Stateful: read/write inside `while` loop |
| **Lists** | Always provide unique `key` on elements |
| **Refs** | `ref={el => ...}` on elements. Receives `null` on unmount. Stateful ref type: `ThisParameterType<typeof Component>` |
| **Memo** | `memo={[deps]}` array, `memo={value}` single, or just `memo` (never re-render). Skips subtree if unchanged |
| **Skip** | `skip` excludes children from reconciliation. Use for `set:textContent`/`set:innerHTML` or third-party maneged DOM |
| **Custom wrapper** | Set `.is = 'tagname'` AND TypeScript generic `Stateful<Args, 'tagname'>` for stateful components. Default is `div` (no need to set) |
| **Default attrs** | `.attrs = { class: '...' }` on stateful component generator function |
| **Default args** | `.args = { prop: value }` on stateful component generator function |
| **Cleanup** | `try { while(true) yield ... } finally { cleanup }` |
| **Error recovery** | `try { ... } catch { yield error UI }` inside loop |
| **this** | Stateful component wrapper element with `.next()`, `.throw()`, `.return()`. Type: `ThisParameterType<typeof Component>` |

## Common Patterns

```tsx
import type { Children, Stateful, Stateless } from 'ajo'
import { context } from 'ajo/context'

// Async data loading
type LoaderArgs = { url: string }

const DataLoader: Stateful<LoaderArgs> = function* (args) {

  let data: unknown = null
  let error: Error | null = null

  fetch(args.url)
    .then(r => r.json())
    .then(d => this.next(() => data = d))
    .catch(e => this.next(() => error = e))

  while (true) yield (
    <>
      {error ? <p>Error: {error.message}</p>
       : data ? <div>{JSON.stringify(data)}</div>
       : <p>Loading...</p>}
    </>
  )
}

// List with keys
type Item = { id: string; text: string }

const List: Stateless<{ items: Item[] }> = ({ items }) => (
  <ul>
    {items.map(item => <li key={item.id}>{item.text}</li>)}
  </ul>
)

// Conditional rendering
type ShowArgs = { when: boolean; children: Children }

const Show: Stateless<ShowArgs> = ({ when, children }) => when ? children : null

// Context - create with fallback value
const ThemeContext = context<'light' | 'dark'>('light')
const UserContext = context<{ name: string } | null>(null)

// Stateless - read only (call without args)
const ThemedCard: Stateless<{ title: string }> = ({ title }) => {
  const theme = ThemeContext()  // reads current value
  return <div class={`card theme-${theme}`}>{title}</div>
}

// Stateful - read/write inside while loop
const ThemeProvider: Stateful<{ children: Children }> = function* (args) {

  let theme: 'light' | 'dark' = 'light'

  const toggle = () => this.next(() => theme = theme === 'light' ? 'dark' : 'light')

  while (true) {

    ThemeContext(theme)  // write: sets value for descendants
    const user = UserContext()  // read: gets value from ancestor

    yield (
      <>
        <button set:onclick={toggle}>Theme: {theme}</button>
        {user && <span>User: {user.name}</span>}
        {args.children}
      </>
    )
  }
}

// Ref typing for stateful components
let counterRef: ThisParameterType<typeof Counter> | null = null
<Counter ref={el => counterRef = el} initial={0} />
// counterRef is <section> element + .next(), .throw(), .return() methods
counterRef?.next()  // trigger re-render from outside

// memo variations
<div memo={[a, b]}>{/* re-render when a or b changes */}</div>
<div memo={count}>{/* re-render when count changes (single value) */}</div>
<div memo>{/* render once, never update - good for static content */}</div>

// Boolean attributes
<input type="checkbox" checked disabled />  // checked="" disabled=""
<button disabled={false} />                 // removes disabled attr

// Attributes vs Properties (HTML-first)
<input value="text" />                       // HTML attribute: initial value only
<input set:value={text} />                   // DOM property: syncs with state
<input type="checkbox" checked />            // HTML attribute: initial state
<input type="checkbox" set:checked={bool} /> // DOM property: syncs with state
<video set:currentTime={0} set:muted />      // DOM properties
<div set:textContent={str} skip />           // DOM property + skip (required!)
<div set:innerHTML={html} skip />            // DOM property + skip (required!)

// Third-party managed DOM
let map: MapLibrary | null = null
<div skip ref={el => el ? (map ??= new MapLibrary(el)) : map?.destroy()} />  // skip lets library control children
```

## Anti-patterns

```tsx
// ❌ React patterns: NEVER use
import React from 'react'
className="..."
onClick={...}
useState, useEffect, useCallback

// ❌ class/style as object or array: no special handling in Ajo
<div class={{ active: isActive }} />        // won't work
<div class={['btn', 'primary']} />          // won't work
<div style={{ color: 'red' }} />            // won't work

// ✅ class/style must be strings
<div class={`btn ${isActive ? 'active' : ''}`} />
<div class={clsx('btn', { active: isActive })} />  // use clsx library
<div style="color: red; font-size: 14px" />
<div style={`color: ${color}`} />

// ❌ memo in args but not applied to element - does nothing
const Bad: Stateless<{ memo: unknown }> = ({ memo }) => (
  <div>content</div>  // memo arg ignored, no memoization
)

// ✅ Pass deps in args, apply to root element  
const Good: Stateless<{ deps?: unknown }> = ({ deps }) => (
  <div memo={deps}>content</div>  // memoized when deps provided
)
// <Good deps={[id]} /> or <Good deps={data} />

// ❌ Destructure in signature - locks to initial values
function* Bad({ count }) { ... }

// ❌ Context read/write outside loop in stateful - stale values
function* Bad(args) {
  const theme = ThemeContext()  // frozen at mount
  ThemeContext('dark')          // only set once, not updated
  while (true) yield ...
}

// ✅ Context read/write inside loop in stateful
function* Good(args) {
  let theme = 'light'
  while (true) {
    ThemeContext(theme)           // write: updated each render
    const user = UserContext()    // read: fresh value each render
    yield ...
  }
}

// ❌ Missing key in lists
{items.map(item => <li>{item}</li>)}

// ❌ Direct state mutation without next()
const inc = () => count++  // won't re-render

// ❌ set:textContent/innerHTML without skip: content gets cleared
<div set:innerHTML={html} />

// ✅ Correct
const inc = () => this.next(() => count++)
<div set:innerHTML={html} skip />
```

## Setup

```bash
npm install ajo
pnpm add ajo
yarn add ajo
```

Configure JSX factory (Vite example):

```ts
// vite.config.ts
export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: `import { h, Fragment } from 'ajo'`,
  },
})
```

For other build systems: `jsxFactory: 'h'`, `jsxFragment: 'Fragment'`, auto-import `{ h, Fragment }` from `'ajo'`.