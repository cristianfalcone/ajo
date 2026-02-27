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

A modern JavaScript library for building user interfaces with generator-based state management and efficient DOM updates.

- **Generator-Based Components**: Use `function*` for stateful components with built-in lifecycle
- **Efficient DOM Updates**: In-place reconciliation minimizes DOM manipulation

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

Configure your build tool to use Ajo's automatic JSX runtime:

**Vite:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'ajo',
  },
})
```

**TypeScript:**
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "ajo"
  }
}
```

**Other build tools:** Set `jsx: 'react-jsx'` (or `'automatic'`), `jsxImportSource: 'ajo'`. No manual imports needed — the build tool auto-imports from `ajo/jsx-runtime`.

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

Call `this.next()` to trigger a re-render. The optional callback receives current args and its return value is passed through:

```javascript
function* Stepper() {

  let count = 0

  // Access current args in callback
  const inc = () => this.next(({ step = 1 }) => count += step)

  for (const { step = 1 } of this) yield (
    <button set:onclick={inc}>Count: {count} (+{step})</button>
  )
}
```

### Args in the Render Loop

Use `for...of this` to receive fresh args each render cycle. Destructure in the parameter for values needed in init code:

```javascript
function* Counter({ initial }) {

  let count = initial  // parameter destructuring for init code

  for (const { step = 1 } of this) {  // fresh args each cycle
    yield <button set:onclick={() => this.next(() => count += step)}>+{step}</button>
  }
}
```

Use `while (true)` when you don't need args in the loop:

```javascript
function* Timer() {
  let seconds = 0
  setInterval(() => this.next(() => seconds++), 1000)
  while (true) yield <p>{seconds}s</p>
}
```

### Lifecycle and Cleanup

Every stateful component has a `this.signal` (AbortSignal) that aborts when the component unmounts. Use it with any API that accepts a signal:

```javascript
function* MouseTracker() {

  let pos = { x: 0, y: 0 }

  document.addEventListener('mousemove', e => this.next(() => {
    pos = { x: e.clientX, y: e.clientY }
  }), { signal: this.signal }) // auto-removed on unmount

  while (true) yield <p>{pos.x}, {pos.y}</p>
}
```

For APIs that don't accept a signal, use `try...finally`:

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
function* ErrorBoundary() {
  for (const { children } of this) {
    try {
      yield children
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
function* Chart() {

  let chart = null

  for (const { data } of this) yield (
    <div skip ref={el => el && (chart ??= new ChartLib(el, data))} />
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
**Stateful**: read/write. Write inside the loop when the value depends on state, or outside for a constant value.

```javascript
// Stateless - read only
const Card = ({ title }) => {
  const theme = ThemeContext()
  return <div class={`card theme-${theme}`}>{title}</div>
}

// Stateful - write inside loop (value depends on state)
function* ThemeProvider() {

  let theme = 'light'

  for (const { children } of this) {
    ThemeContext(theme)
    yield (
      <>
        <button set:onclick={() => this.next(() => theme = theme === 'light' ? 'dark' : 'light')}>
          {theme}
        </button>
        {children}
      </>
    )
  }
}

// Stateful - write outside loop (constant value)
function* FixedTheme() {
  ThemeContext('dark')  // set once at mount
  for (const { children } of this) yield children
}
```

## Async Operations

```javascript
function* UserProfile({ id }) {

  let data = null, error = null, loading = true

  fetch(`/api/users/${id}`, { signal: this.signal })
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
import { render } from 'ajo/html'
const html = render(<App />)
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

const Counter: Stateful<CounterProps, 'section'> = function* ({ initial }) {

  let count = initial

  for (const { step = 1 } of this) {
    yield <button set:onclick={() => this.next(() => count += step)}>+{step}</button>
  }
}

Counter.is = 'section'               // wrapper element (default: 'div')
Counter.attrs = { class: 'counter' } // default wrapper attributes
Counter.args = { step: 1 }           // default args

// Or use stateful() to avoid duplicating 'section':
// const Counter = stateful(function* ({ initial }: CounterProps) { ... }, 'section')

// Ref typing
let ref: ThisParameterType<typeof Counter> | null = null
<Counter ref={el => ref = el} initial={0} />
```

## API Reference

### `ajo`
| Export | Description |
|--------|-------------|
| `render(children, container, start?, end?)` | Render to DOM. Optional `start`/`end` for targeted updates. |
| `stateful(fn, tag?)` | Create stateful component with type inference for custom wrapper. |
| `defaults` | Default wrapper tag config (`defaults.tag`). |

### `ajo/context`
| Export | Description |
|--------|-------------|
| `context<T>(fallback?)` | Create context. Call with value to write, without to read. |

### `ajo/html`
| Export | Description |
|--------|-------------|
| `render(children)` | Render to HTML string. |
| `html(children)` | Render to HTML generator (yields strings). |

### Stateful `this`
| Property | Description |
|----------|-------------|
| `for...of this` | Iterable: yields fresh args each render cycle. |
| `this.signal` | AbortSignal that aborts on unmount. Pass to `fetch()`, `addEventListener()`, etc. |
| `this.next(fn?)` | Re-render. Callback receives current args. Returns callback's result. |
| `this.throw(error)` | Throw to parent boundary. |
| `this.return(deep?)` | Terminate generator. Pass `true` to also terminate child generators. |

`this` is also the wrapper element (`this.addEventListener()`, etc).

## For AI Assistants

See [LLMs.md](./LLMs.md) for a condensed reference.

## License

ISC © [Cristian Falcone](https://cristianfalcone.com)
