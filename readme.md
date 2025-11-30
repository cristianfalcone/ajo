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

## Features

- **Generator-Based Components**: Use JavaScript generator functions (`function*`) for stateful components with built-in lifecycle management
- **Efficient DOM Updates**: In-place DOM reconciliation minimizes DOM manipulation and maximizes performance
- **Declarative JSX**: Write components using familiar JSX syntax with full TypeScript support
- **Performance Optimization**: Built-in `memo` attribute for fine-grained performance optimization
- **Context API**: Share state across component trees without prop drilling
- **Server-Side Rendering**: Complete SSR solution with streaming and hydration support
- **Islands Architecture**: Selective hydration for maximum performance with minimal client-side JavaScript

## Quick Start

Install Ajo using your preferred package manager:

```bash
npm install ajo
```

Create your first component:

```javascript
import { render } from 'ajo'

// Stateless component
const Greeting = ({ name }) => <p>Hello, {name}!</p>

// Stateful component
function* Counter() {

  let count = 0

  const increment = () => this.next(() => count++)

  while (true) yield (
    <button set:onclick={increment}>
      Count: {count}
    </button>
  )
}

// Render to DOM
render(<Counter />, document.body)
```

## Core Concepts

### Component Types

**Stateless Components** are pure functions:
```javascript
const UserCard = ({ user }) => (
  <div class="user-card">
    <h3>{user.name}</h3>
    <p>{user.email}</p>
  </div>
);
```

**Stateful Components** use generator functions with automatic wrapper elements:
```javascript
function* TodoList() {

  let todos = []
  
  const addTodo = text => this.next(() => todos.push({ id: Date.now(), text }))

  while (true) yield (
    <>
      <input set:onkeydown={e => e.key === 'Enter' && addTodo(e.target.value)} />
      <ul>
        {todos.map(todo => <li key={todo.id}>{todo.text}</li>)}
      </ul>
    </>
  )
}
```

### State Management Pattern

The generator structure provides a natural mental model:
- **Before the loop**: Persistent state, handlers, and utilities  
- **Inside the loop**: Re-executed on each render for derived values

```javascript
function* ShoppingCart(args) {

  // Persistent state (like useState)
  let items = []

  // Persistent handlers (like useCallback)
  const addItem = product => this.next(() => items.push(product))

  // Main render loop
  while (true) {

    // Derived values computed fresh each render
    const total = items.reduce((sum, item) => sum + item.price, 0)
    const itemCount = items.length

    yield (
      <>
        <h2>Cart ({itemCount} items)</h2>
        <p>Total: ${total}</p>
        {/* ... */}
      </>
    )
  }
}
```

### Special Attributes

- **`key`**: List reconciliation
- **`ref`**: DOM element access
- **`memo`**: Performance optimization 
- **`skip`**: Third-party DOM management
- **`set:`**: Direct property setting
- **`attr:`**: Force HTML attributes

```javascript
function* MapComponent(args) {

  let mapRef = null

  while (true) yield (
    <div 
      ref={el => {
        if (el && !mapRef) {
          mapRef = el
          // Third-party map library controls this DOM
          new GoogleMap(el, args.config)
        }
      }}
      skip
    >
      {/* Google Maps API manages children elements */}
    </div>
  )
}
```

## Server-Side Rendering

### Static SSR
```javascript
import { render } from 'ajo/html'

const html = render(<App />)
```

### Streaming SSR
```javascript
import { stream } from 'ajo/stream'

for await (const chunk of stream(<App />)) response.write(chunk)
```

## Best Practices

1. **Use fragments in stateful components** to avoid unnecessary DOM nesting
2. **Don't destructure props in function signatures** - use `args` parameter or destructure inside the render loop
3. **Leverage the generator structure** for natural state and lifecycle management
4. **Use TypeScript** for enhanced developer experience

## API Reference

### Core Module (`ajo`)

#### `render(children: Children, container: Element, child?: ChildNode, ref?: ChildNode): void`
Renders JSX into a DOM container element. When `child` and `ref` are provided, only nodes between them (inclusive of `child`, exclusive of `ref`) are reconciled, leaving the rest of the container untouched.

```javascript
import { render } from 'ajo'

render(<App />, document.getElementById('root'))

// Update only the <main> region without touching header/footer
const container = document.body
render(<main>Updated</main>, container, container.querySelector('main'), container.querySelector('footer'))
```

#### `h(type: Type, props?: Props, ...children: Children[]): VNode`
JSX factory function (rarely used directly).

#### `Fragment({ children }: { children: Children }): Children`
JSX fragment component for rendering multiple elements without a wrapper.

```javascript
const List = () => (
  <>
    <li>Item 1</li>
    <li>Item 2</li>
  </>
)
```

### Stateful Component Instance Methods

Stateful components have access to several instance methods through `this`:

#### `this.next(callback?: (args: ComponentArgs) => void): void`
Triggers a re-render of the component by advancing to the next yield point. Optionally accepts a callback function that receives the component's current props/args as the first parameter.

```javascript
function* Counter(args) {

  let count = 0

  const increment = () => {
    // Simple re-render
    this.next(() => count++)
  }

  const incrementByStep = () => {
    // Access current props in callback
    this.next(({ step }) => count += step)
  }

  // ... rest of component
}
```

#### `this.throw(error: unknown): void`
Throws an error that can be caught by parent error boundaries.

#### `this.return(): void`
Terminates the generator and triggers cleanup (rarely used directly).

### Context Module (`ajo/context`)

#### `context<T>(fallback?: T): ContextFunction<T>`
Creates a context for sharing data across component trees.

```javascript
import { context } from 'ajo/context'

const ThemeContext = context('light')

// Set value
ThemeContext('dark')

// Get value
const theme = ThemeContext() // 'dark'
```

### HTML Module (`ajo/html`)

#### `render(children: Children): string`
Renders JSX to an HTML string for static site generation.

```javascript
import { render } from 'ajo/html'

const html = render(<HomePage title="Welcome" />)
```

#### `html(children: Children, hooks?: Hooks): IterableIterator<string>`
Low-level HTML streaming function with custom hooks.

### Stream Module (`ajo/stream`)

#### `stream(children: Children): AsyncIterableIterator<string>`
Renders components to an async stream for progressive SSR.

```javascript
import { stream } from 'ajo/stream'

for await (const chunk of stream(<App />)) response.write(chunk)
```

#### `hydrate(patch: Patch): Promise<void>`
Client-side function for applying streamed patches during hydration.

```javascript
import { hydrate } from 'ajo/stream'

window.$stream = { push: hydrate }
```

### TypeScript Support

```typescript
// Component types
type Stateless<Props = {}> = (props: Props) => Children
type Stateful<Props = {}, Tag = 'div'> = {
  (this: StatefulElement<Tag>, props: Props): Iterator<Children>
  is?: Tag
  attrs?: Record<string, unknown>
  args?: Partial<Props>
}

// Stateful component instance
type StatefulElement<Tag> = HTMLElement & {
  next: (callback?: (args: ComponentArgs) => void) => void
  throw: (error: unknown) => void
  return: () => void
};

// Element types
type Children = unknown
type VNode<Type, Props> = Props & {
  nodeName: Type
  children?: Children
};

// Special attributes
type SpecialAttributes = {
  key?: unknown
  ref?: (element: Element | null) => void
  memo?: unknown[]
  skip?: boolean
};
```

## Documentation

For comprehensive guides, advanced patterns, and detailed examples, see [documentation.md](./documentation.md).

## License

ISC © [Cristian Falcone](cristianfalcone.com)
