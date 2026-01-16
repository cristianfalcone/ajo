# Ajo

<div align="center">
  <img src="https://github.com/cristianfalcone/ajo/raw/main/ajo.png" alt="ajo" width="372" />
</div>

<div align="center">
  <a href="https://npmjs.org/package/ajo">
    <img src="https://badgen.now.sh/npm/v/ajo" alt="version" />
  </a>
  <a href="https://npmjs.org/package/ajo">
    <img src="https://badgen.now.sh/npm/dm/ajo" alt="downloads" />
  </a>
</div>

A modern JavaScript library for building user interfaces with generator-based state management, efficient DOM updates, and streaming server-side rendering.

- **Generator-Based Components**: Use `function*` for stateful components with built-in lifecycle
- **Efficient DOM Updates**: In-place reconciliation minimizes DOM manipulation
- **Streaming SSR**: Progressive rendering with selective hydration (islands)

## Quick Start

```bash
npm install ajo
```

```javascript
import { render } from 'ajo'

function* Counter() {
  let count = 0

  while (true) yield (
    <button set:onclick={() => this.next(() => count++)}>
      Count: {count}
    </button>
  )
}

render(<Counter />, document.body)
```

### Build Configuration

Configure your build tool to use Ajo's JSX factory:

**Vite:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: `import { h, Fragment } from 'ajo'`,
  },
})
```

**TypeScript:**
```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment"
  }
}
```

**Other build tools:** Set `jsxFactory: 'h'`, `jsxFragment: 'Fragment'`, and auto-import `{ h, Fragment }` from `'ajo'`.

## Core Concepts

### Stateless Components

Pure functions that receive props and return JSX:

```javascript
const Greeting = ({ name }) => <p>Hello, {name}!</p>
```

### Stateful Components

Generator functions with automatic wrapper elements. The structure provides a natural mental model:

- **Before the loop**: Persistent state and handlers (survives re-renders)
- **Inside the loop**: Derived values (computed fresh each render)

```javascript
function* TodoList() {
  let todos = []
  let text = ''

  const add = () => this.next(() => {
    if (text.trim()) {
      todos.push({ id: Date.now(), text })
      text = ''
    }
  })

  while (true) {
    const count = todos.length

    yield (
      <>
        <input
          set:value={text}
          set:oninput={e => text = e.target.value}
          set:onkeydown={e => e.key === 'Enter' && add()}
        />
        <button set:onclick={add}>Add ({count})</button>
        <ul>
          {todos.map(t => <li key={t.id}>{t.text}</li>)}
        </ul>
      </>
    )
  }
}
```

### Re-rendering with `this.next()`

Call `this.next()` to trigger a re-render. The optional callback receives current props, useful when props may have changed:

```javascript
function* Stepper(args) {
  let count = 0

  // Access current props in callback
  const inc = () => this.next(({ step = 1 }) => count += step)

  while (true) yield (
    <button set:onclick={inc}>Count: {count} (+{args.step})</button>
  )
}
```

**Never destructure args in the generator signature** - it locks values to initial props:

```javascript
// DON'T - values frozen at mount
function* Bad({ step }) { let count = step }

// DO - use args directly, or destructure inside the loop
function* Good(args) {
  while (true) {
    const { step } = args  // fresh each render
    yield ...
  }
}
```

### Lifecycle and Cleanup

Use `try...finally` for cleanup when the component unmounts:

```javascript
function* Clock() {
  let time = new Date()
  const interval = setInterval(() => this.next(() => time = new Date()), 1000)

  try {
    while (true) yield <p>{time.toLocaleTimeString()}</p>
  } finally {
    clearInterval(interval)
  }
}
```

### Error Boundaries

Use `try...catch` **inside** the loop to catch errors and recover:

```javascript
function* ErrorBoundary(args) {
  while (true) {
    try {
      yield args.children
    } catch (error) {
      yield (
        <>
          <p>Error: {error.message}</p>
          <button set:onclick={() => this.next()}>Retry</button>
        </>
      )
    }
  }
}
```

## Special Attributes

| Attribute | Description |
|-----------|-------------|
| `key` | Unique identifier for list reconciliation |
| `ref` | Callback receiving DOM element (or `null` on unmount) |
| `memo` | Skip reconciliation: `memo={[deps]}`, `memo={value}`, or `memo` (render once) |
| `skip` | Exclude children from reconciliation (required with `set:innerHTML`) |
| `set:*` | Set DOM properties instead of HTML attributes |
| `attr:*` | Force HTML attributes on stateful component wrappers |

### `set:` - DOM Properties vs HTML Attributes

```javascript
// Events (always use set:)
<button set:onclick={handleClick}>Click</button>

// Dynamic values that need to sync with state
<input set:value={text} />              // DOM property (syncs)
<input value="initial" />                // HTML attribute (initial only)

<input type="checkbox" set:checked={bool} />
<video set:currentTime={0} set:muted />

// innerHTML requires skip
<div set:innerHTML={html} skip />
```

### `ref` - DOM Access

```javascript
function* AutoFocus() {
  let input = null

  while (true) yield (
    <>
      <input ref={el => el?.focus()} />
      <button set:onclick={() => input?.select()}>Select</button>
    </>
  )
}

// Ref to stateful component includes control methods
let timer = null
<Clock ref={el => timer = el} />
timer?.next()  // trigger re-render from outside
```

### `memo` - Performance Optimization

```javascript
<div memo={[user.id]}>...</div>   // re-render when user.id changes
<div memo={count}>...</div>        // re-render when count changes
<footer memo>Static content</footer>  // render once, never update
```

### `skip` - Third-Party DOM

```javascript
function* Chart(args) {
  let chart = null

  while (true) yield (
    <div skip ref={el => el && (chart ??= new ChartLib(el, args.data))} />
  )
}
```

### `attr:` - Wrapper Attributes

```javascript
<Counter
  initial={0}                    // → args
  attr:id="main"                 // → wrapper HTML attribute
  attr:class="widget"            // → wrapper HTML attribute
  set:onclick={fn}               // → wrapper DOM property
/>
```

## Context API

Share data across component trees without prop drilling:

```javascript
import { context } from 'ajo/context'

const ThemeContext = context('light')
```

**Stateless**: read only.
**Stateful**: read/write. Write inside the loop to update each render, or outside for a one-time set.

```javascript
// Stateless - read only
const Card = ({ title }) => {
  const theme = ThemeContext()
  return <div class={`card theme-${theme}`}>{title}</div>
}

// Stateful - write inside loop (updates each render)
function* ThemeProvider(args) {
  let theme = 'light'

  while (true) {
    ThemeContext(theme)
    yield (
      <>
        <button set:onclick={() => this.next(() => theme = theme === 'light' ? 'dark' : 'light')}>
          {theme}
        </button>
        {args.children}
      </>
    )
  }
}

// Stateful - write outside loop (one-time set)
function* FixedTheme(args) {
  ThemeContext('dark')  // set once at mount
  while (true) yield args.children
}
```

## Async Operations

```javascript
function* UserProfile(args) {
  let data = null, error = null, loading = true

  fetch(`/api/users/${args.id}`)
    .then(r => r.json())
    .then(d => this.next(() => { data = d; loading = false }))
    .catch(e => this.next(() => { error = e; loading = false }))

  while (true) {
    if (loading) yield <p>Loading...</p>
    else if (error) yield <p>Error: {error.message}</p>
    else yield <h1>{data.name}</h1>
  }
}
```

## Server-Side Rendering

```javascript
// Static
import { render } from 'ajo/html'
const html = render(<App />)

// Streaming
import { stream } from 'ajo/stream'
for await (const chunk of stream(<App />)) res.write(chunk)

// Hydration (client-side)
import { hydrate } from 'ajo/stream'
window.$stream = { push: hydrate }
```

### Islands Architecture

```javascript
function* Interactive() {
  let count = 0
  while (true) yield (
    <button set:onclick={() => this.next(() => count++)}>
      {count}
    </button>
  )
}

Interactive.src = '/islands/interactive.js'  // hydrate on client

const Page = () => (
  <html>
    <body>
      <p>Static content</p>
      <Interactive fallback={<button>0</button>} />
    </body>
  </html>
)
```

## TypeScript

```typescript
import type { Stateless, Stateful, WithChildren } from 'ajo'

// Stateless
type CardProps = WithChildren<{ title: string }>
const Card: Stateless<CardProps> = ({ title, children }) => (
  <div class="card"><h3>{title}</h3>{children}</div>
)

// Stateful with custom wrapper element
type CounterProps = { initial: number; step?: number }

const Counter: Stateful<CounterProps, 'section'> = function* (args) {
  let count = args.initial

  while (true) {
    const { step = 1 } = args
    yield <button set:onclick={() => this.next(() => count += step)}>+{step}</button>
  }
}

Counter.is = 'section'               // wrapper element (default: 'div')
Counter.attrs = { class: 'counter' } // default wrapper attributes
Counter.args = { step: 1 }           // default args

// Ref typing
let ref: ThisParameterType<typeof Counter> | null = null
<Counter ref={el => ref = el} initial={0} />
```

## API Reference

### `ajo`
| Export | Description |
|--------|-------------|
| `render(children, container, start?, end?)` | Render to DOM. Optional `start`/`end` for targeted updates. |
| `h`, `Fragment` | JSX factory and fragment |

### `ajo/context`
| Export | Description |
|--------|-------------|
| `context<T>(fallback?)` | Create context. Call with value to write, without to read. |

### `ajo/html`
| Export | Description |
|--------|-------------|
| `render(children)` | Render to HTML string |

### `ajo/stream`
| Export | Description |
|--------|-------------|
| `stream(children)` | Async iterator for streaming SSR |
| `hydrate(patch)` | Apply streamed patch on client |

### Stateful `this`
| Method | Description |
|--------|-------------|
| `this.next(fn?)` | Re-render. Callback receives current args. |
| `this.throw(error)` | Throw to parent boundary |
| `this.return()` | Terminate generator |

`this` is also the wrapper element (`this.addEventListener()`, etc).

## For AI Assistants

See [LLMs.md](./LLMs.md) for a condensed reference.

## License

ISC © [Cristian Falcone](https://cristianfalcone.com)
