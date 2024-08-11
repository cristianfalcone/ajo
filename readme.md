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

Ajo is a lightweight and efficient JavaScript library for building dynamic user interfaces. It combines the best ideas from Incremental DOM and Crank.js to offer a unique approach to UI development.

## Key Features

- Efficient in-place DOM updates
- Generator-based state management
- JSX syntax support
- Lightweight design
- Server-Side Rendering (SSR) support

## Quick Start

### Installation

```bash
npm install ajo
```

### Basic Usage

```jsx
/** @jsx h */
import { h, render } from 'ajo'

const Greeting = ({ name }) => <h1>Hello, {name}!</h1>

function* Counter() {
  let count = 0

  const increment = () => {
    count++
    this.render()
  }

  while (true) {
    yield (
      <>
        <p>Count: {count}</p>
        <button set:onclick={increment}>Increment</button>
      </>
    )
  }
}

function* App() {
  while (true) {
    yield (
      <>
        <Greeting name="Ajo Developer" />
        <Counter />
      </>
    )
  }
}

render(<App />, document.body)
```

## Core Concepts

### HTML Attributes vs DOM Properties

Ajo distinguishes between HTML attributes and DOM properties. Use regular attributes for HTML attributes, and the `set:` prefix to set DOM properties directly:

```jsx
<input
  type="text"
  id="username"
  class="form-input"
  placeholder="Enter username"
  set:value={inputValue}
  set:onclick={handleClick}
  set:disabled={isDisabled}
/>
```

In this example:
- `type`, `id`, `class`, and `placeholder` are regular HTML attributes.
- `set:value`, `set:onclick`, and `set:disabled` are DOM properties set directly on the element.

### Special Attributes

Ajo uses special attributes for optimization and control:
- `key`: For efficient list rendering
- `skip`: To prevent rendering of child elements
- `memo`: For memoization of components or elements
- `ref`: To get references to DOM nodes or component instances

```jsx
<TodoItem
  key={todo.id}
  memo={[todo.completed]}
  ref={el => el ? todosRefs.add(el) : todosRefs.delete(todo.id)}
>
  <TodoTitle>{todo.title}</TodoTitle>
  <div set:innerHTML={marked(todo.content)} skip></div>
</TodoItem>
```

### Stateless and Stateful Components

Stateless components are simple functions:

```jsx
const Greeting = ({ name }) => <h1>Hello, {name}!</h1>
```

Stateful components use generator functions:

```jsx
function* Counter() {
  let count = 0
  while (true) {
    yield (
      <button set:onclick={() => { count++; this.render(); }}>
        {count}
      </button>
    )
  }
}
```

State handling in Ajo is straightforward:
- State is managed using regular variables within the generator function.
- The `this.render()` method triggers a re-render when state changes.
- Each iteration of the generator function represents a new render cycle.

```jsx
function* Timer() {
  let seconds = 0
  const intervalId = setInterval(() => {
    seconds++
    this.render()  // Trigger a re-render
  }, 1000)

  try {
    while (true) {
      yield <div>Seconds: {seconds}</div>
    }
  } finally {
    clearInterval(intervalId)  // Cleanup
  }
}
```

### Component Lifecycle

Stateful components have a simple lifecycle:
- Initialization: When the generator is first called
- Rendering: Each time the generator yields
- Cleanup: When the generator's `finally` block is executed

```jsx
function* LifecycleDemo() {
  console.log('Initialized')
  try {
    while (true) {
      console.log('Rendering')
      yield <div>Hello, Ajo!</div>
    }
  } finally {
    console.log('Cleanup')
  }
}
```

### attr: Attributes

Use the `attr:` prefix to add HTML attributes to a component's root element:

```jsx
function* CustomButton(props) {
  while (true) yield <>{props.children}</>
}
CustomButton.is = 'button'

// Usage
<CustomButton attr:class="primary" attr:id="submit-btn">
  Click me
</CustomButton>
```

### Component.attrs and Component.is

Use `Component.attrs` to set default attributes for a component:

```jsx
function* CustomButton(props) {
  while (true) yield <>{props.children}</>
}
CustomButton.attrs = { class: 'btn btn-primary' }
```

Use `Component.is` to specify the HTML element for a component:

```jsx
function* CustomInput(props) {
  while (true) yield <>{props.children}</>
}
CustomInput.is = 'input'
```

## API

### `ajo` module

#### `h(type, props?, ...children)`

Creates virtual DOM elements.

```javascript
const element = h('div', { class: 'container' }, 'Hello, Ajo!')
```

#### `render(vnode, container)`

Renders a virtual DOM tree into a DOM element.

```javascript
render(h(App), document.body)
```

#### `Fragment({ children })`

A component for grouping elements without adding extra nodes to the DOM.

```jsx
const List = () => (
  <Fragment>
    <li>Item 1</li>
    <li>Item 2</li>
  </Fragment>
)
```

#### `context(defaultValue)`

Creates a context with an optional default value.

```javascript
const ThemeContext = context('light')

// In a stateless component:
const StatelessComponent = () => {
  const theme = ThemeContext()
  return <div>Current theme: {theme}</div>
}

// In a stateful component:
function* StatefulComponent() {
  while (true) {
    const theme = ThemeContext()
    yield <div>Current theme: {theme}</div>
  }
}

// Setting context value:
function* App() {
  ThemeContext('dark')
  while (true) {
    yield (
      <>
        <FunctionalComponent />
        <StatefulComponent />
      </>
    )
  }
}
```

#### Stateful Components and Component Methods

Ajo's stateful components are implemented as generator functions and have access to several special methods:

```javascript
function* StatefulComponent(props) {
  // Component logic here
  while (true) {
    yield (/* JSX */)
  }
}
```

Component methods:

- `this.render()`: Triggers a re-render of the component. It's the primary method for updating the component's UI after state changes.

  ```javascript
  function* Counter() {
    let count = 0
    const increment = () => {
      count++
      this.render()  // Re-render to reflect the new count
    }
    while (true) {
      yield <button set:onclick={increment}>{count}</button>
    }
  }
  ```

- `this.next()`: Advances the generator to the next yield point. It's automatically called by `this.render()` and is rarely used directly.

- `this.throw(error)`: Throws an error in the generator. Useful for error propagation and creating error boundaries. Ajo automatically calls this method when an error occurs during rendering.

  ```javascript
  function* ErrorBoundary(props) {
    try {
      while (true) {
        yield <div>{props.children}</div>
      }
    } catch (error) {
      yield <div>An error occurred: {error.message}</div>
    }
  }
  ```

- `this.return()`: Completes the generator execution. It's automatically called by Ajo when a component is unmounted, but can be used manually to reset a component's state.

  ```javascript
  function* ResetableComponent() {
    let count = 0
    const reset = () => {
      this.return()  // Reset the generator
      this.render()  // Re-render from the beginning
    }
    while (true) {
      yield (
        <div>
          <p>Count: {count}</p>
          <button set:onclick={() => { count++; this.render(); }}>Increment</button>
          <button set:onclick={reset}>Reset</button>
        </div>
      )
    }
  }
  ```

- `this.$args`: Provides access to the current args of the component.

  ```javascript
  function* DynamicGreeting() {
    while (true) {
      yield <h1>Hello, {this.$args.name}!</h1>
    }
  }
  ```

These methods provide powerful control over the component's lifecycle and state management, allowing for efficient and flexible UI updates. Note that `this.throw()` and `this.return()` are often called automatically by Ajo in response to errors or component unmounting, respectively, but can also be used manually when needed.

### `ajo/html` module

For server-side rendering:

#### `render(vnode)`

Renders a virtual DOM tree to an HTML string.

```javascript
import { render } from 'ajo/html'
import { App } from './components'

const html = render(<App />)
```

#### `html(vnode)`

Generates an iterator of HTML strings for streaming.

```javascript
import { html } from 'ajo/html'
import { App } from './components'

for (const chunk of html(<App />)) {
  // Send chunk to the client
  stream.write(chunk)
}
```

## License

ISC © [Cristian Falcone](cristianfalcone.com)