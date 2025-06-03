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

  while (true) yield (
    <>
      <p>Count: {count}</p>
      <button set:onclick={increment}>Increment</button>
    </>
  )
}

function* App() {
  while (true) yield (
    <>
      <Greeting name="Ajo Developer" />
      <Counter />
    </>
  )
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

  while (true) yield (
    <button set:onclick={() => { count++; this.render(); }}>
      {count}
    </button>
  )
}
```

State handling in Ajo is straightforward:
- State is managed using regular variables within the generator function.
- The `this.render()` method triggers a re-render when state changes.
- The `this.cleanup()` method is used to clean up resources when the component unmounts.
- Each iteration of the generator function represents a new render cycle.

```jsx
function* Timer() {

  let seconds = 0

  const intervalId = setInterval(() => {
    seconds++
    this.render()  // Trigger a re-render
  }, 1000)

  this.cleanup(() => clearInterval(intervalId))  // Cleanup

  while (true) yield <div>Seconds: {seconds}</div>
}
```

### Component Lifecycle

Stateful components have a simple lifecycle pattern:
- After mount: Component's element is mounted and the generator function is called. You can initialize resources here.
- Before render: Before component's children render
- After render: After component's children render
- Before re-render: Before component's children re-render
- Before unmount: Component's element is about to be unmounted. You can clean up resources here.

```jsx
function* LifecycleDemo() {

  console.log('After mount')

  this.cleanup(() => console.log('Before unmount'))

  while (true) {

    console.log('Before render')

    this.effect(() => console.log('After render'))

    yield <div>Hello, Ajo!</div>

    console.log('Before re-render')
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

### Component.attrs, Component.args and Component.is

Use `Component.attrs` to set default attributes for a component:

```jsx
function* CustomButton(args) {
  while (true) yield <>{props.children}</>
}
CustomButton.attrs = { class: 'btn btn-primary' }
```

Use `Component.args` to set default arguments for a component:

```jsx
function* Greeting(args) {
  while (true) yield <>Hello, {props.name}!</>
}
Greeting.args = { name: 'Guest' }
```

Use `Component.is` to specify the HTML element for a component:

```jsx
function* CustomInput(args) {
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
        <StatelessComponent />
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

- `this.queueMicrotasks()`: Schedules an asynchronous re-render of the component. This is useful for batching multiple updates together for better performance.

  ```javascript
  function* AsyncCounter() {

    let count = 0

    const increment = () => {
      count++
      this.queueMicrotask()  // Schedule an asynchronous re-render
    }

    while (true) {
      yield <button set:onclick={increment}>{count}</button>
    }
  }
  ```

- `this.requestAnimationFrame()`: Similar to `this.queueMicrotask()`, but uses `requestAnimationFrame` for smooth animations.

  ```javascript
  function* AnimatedCounter() {

    let count = 0

    const increment = () => {
      count++
      this.requestAnimationFrame()  // Schedule a re-render on the next animation frame
    }

    while (true) {
      yield <button set:onclick={increment}>{count}</button>
    }
  }
  ```

- `this.cleanup(fn)`: Registers a callback to be executed when the component unmounts. This is useful for cleaning up resources or subscriptions.

  ```javascript
  function* TimerComponent() {

    let seconds = 0

    const timer = setInterval(() => {
      seconds++
      this.render()
    }, 1000)

    this.cleanup(() => clearInterval(timer))  // Clean up the timer when unmounting

    while (true) {
      yield <div>Seconds: {seconds}</div>
    }
  }
  ```

- `this.effect(fn)`: Registers a callback to be run after the next render.

  ```javascript
  function* DataFetchingComponent() {

    let data = null

    this.effect(async () => {
      const response = await fetch('https://api.example.com/data')
      data = await response.json()
      this.render()
    })

    while (true) {
      yield data ? <div>{JSON.stringify(data)}</div> : <div>Loading...</div>
    }
  }
  ```

  If you want to execute an effect after each render, place it inside the main loop:

  ```javascript
  function* EffectfulComponent() {

    let count = 0

    while (true) {

      this.effect(() => console.log(`Count updated to ${count}`))

      yield <button set:onclick={() => { count++; this.render() }}>{count}</button>

      console.log(`Optionally you can clean up effect for count ${count} here`)
    }
  }
  ```

- `this.next()`: Advances the generator to the next yield point. It's automatically called by `this.render()` and is rarely used directly.

- `this.throw(error)`: Throws an error in the generator. Useful for error propagation and creating error boundaries.

- `this.return()`: Completes the generator execution. It's automatically called when a component is unmounted, but can be used manually to reset a component's state.

These methods provide powerful control over the component's lifecycle, state management, and side effects, allowing for efficient and flexible UI updates. Note that `this.throw()` and `this.return()` are often called automatically by Ajo in response to errors or component unmounting, respectively, but can also be used manually when needed.

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
