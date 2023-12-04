<div align="center">
  <img src="https://github.com/cristianfalcone/ajo/raw/main/ajo.png" alt="ajo" width="372" />
</div>

<br />

<div align="center">
  <a href="https://npmjs.org/package/ajo">
    <img src="https://badgen.now.sh/npm/v/ajo" alt="version" />
  </a>
  <a href="https://npmjs.org/package/ajo">
    <img src="https://badgen.now.sh/npm/dm/ajo" alt="downloads" />
  </a>
</div>

# Ajo

Ajo is a cutting-edge library designed for building dynamic UI components using JSX. Integrating ideas from Incremental DOM and Crank.js, Ajo offers a unique approach in the landscape of UI libraries.

Key features:

- **Efficient In-Place DOM Updating**: Ajo executes in-place DOM updates, directly applying the generated vDOM tree to the DOM. This approach avoids the need to store and diff a previous vDOM tree, leading to a reduced memory footprint.
- **Generator-Based State Management**: Leverages JavaScript Generators for managing component states and effects, offering developers a robust tool for controlling UI lifecycle events.
- **Minimalistic Rendering Approach**: Ajo’s rendering system is optimized for minimal overhead, enhancing the speed of DOM updates and overall application performance.
- **JSX Syntax for Intuitive Development**: Supports JSX, making it easy for developers familiar with React or similar libraries to adopt and use Ajo effectively.
- **Lifecycle Management for Components**: Provides a full suite of lifecycle methods for stateful components, facilitating precise control over component behaviors during their lifecycle.
- **Flexibility and Lightweight Design**: Ajo is designed to be both adaptable for various use cases and lightweight, ensuring minimal impact on project size.

## Install

```sh
npm install ajo
```

## Usage

Render JSX into DOM element:

```jsx
/** @jsx h */
import { h, render } from 'ajo'

document.body.innerHTML = '<div>Hello World</div>'

render(<div>Goodbye World</div>, document.body)
```

Stateless component:

```jsx
/** @jsx h */
import { h, render } from 'ajo'

const Greet = ({ name }) => <div>Hello {name}</div>

render(<Greet name="World" />, document.body)
```

Stateful component:

```jsx
/** @jsx h */
import { h, render } from 'ajo'

function* Counter() {

  let count = 0

  const handleClick = () => {
    count++
    this.refresh()
  }

  while (true) yield (
    <button set:onclick={handleClick}>
      Current: {count}
    </button>
  )
}

render(<Counter />, document.body)
```

## API

### render(h, el)

Renders a virtual DOM tree into the actual DOM element. It is the primary method used for updating the DOM with new content.

When called, it efficiently updates `el` with the new content, adding, updating, or removing DOM nodes as needed.

This function enables the declarative description of the UI to be transformed into actual UI elements in the browser. It's designed to be efficient, minimizing updates to the actual DOM to improve performance and user experience.

#### Parameters:

- **h** (Any): The virtual DOM tree to render. This can be any value, a simple string, a virtual DOM tree created by the `h` function, etc.
- **el** (HTMLElement): The DOM element into which the `h` should be rendered. This is typically a container element in your application.

#### Returns:

- There is no return value for this function as its primary purpose is side-effect (DOM manipulation).

#### Example Usage:

```jsx
/** @jsx h */
import { h, render } from 'ajo'

// Create a simple, stateless component
const App = () => <div>Hello, World!</div>

// Render the App component into the #root element
render(<App />, document.getElementById('root'))
```
> In this example, the `App` component is a simple function returning a `div` with text content. The `render` function then mounts this component into the DOM element with the ID `root`.

### h(type, [props], [...children])

Creates a virtual DOM tree for rendering. It's the core function for defining UI components in JSX syntax. The `h` function is a hyperscript function that returns a virtual DOM tree representing the UI component. This object can then be rendered to an actual DOM using the `render` function.

#### Parameters:

- **type** (String | Function | Generator Function): The name of the tag for the DOM element you want to create. If it's a function, it's treated as a stateless component, and if it's a generator function, it's treated as a stateful component.
- **props** (Object, optional): An object containing properties you want to set on the virtual DOM element.
- **children** (Any, optional): Child virtual nodes. Can be a nested array of child nodes, a string, or any other renderable JSX elements. Booleans, null, and undefined child nodes will be ignored, which is useful for conditional rendering.

#### Returns:

- **Object**: A virtual DOM tree.

#### Example Usage:

```jsx
/** @jsx h */
import { h } from 'ajo'

// Creating a simple virtual element
const myElement = h('div', { id: 'my-div' }, 'Hello World')

// or using JSX syntax
const myElementJSX = <div id="my-div">Hello World</div>

// Creating a virtual tree for a stateless component with children
const MyComponent = ({ class: className }) => h('div', { class: className },
  h('h1', null, 'Header'),
  'Text Content',
  h('p', null, 'Paragraph'),
)

// or using JSX syntax
const MyComponentJSX = ({ class: className }) => (
  <div class={className}>
    <h1>Header</h1>
    Text Content
    <p>Paragraph</p>
  </div>
)

// Composing
const MyApp = () => h(MyComponent, { class: 'my-class' })

// or using JSX syntax
const MyAppJSX = () => <MyComponent class="my-class" />

// Render into a DOM element
render(h(MyApp), document.body)

// or using JSX syntax
render(<MyAppJSX />, document.body)
```
> You won't typically use the `h` function, it's automatically used when you write JSX code. The previous examples demonstrate how to use the `h` function directly if you need to.

### `Fragment({ children })`

A utility component for grouping multiple elements without adding extra nodes to the DOM. It's particularly useful for returning multiple elements from components.

In JSX, fragments are typically represented with empty tags (`<>...</>`), but this function provides an alternative way to create them, especially useful in environments where the shorthand syntax might not be supported.

#### Example Usage:

```jsx
//* @jsx h */
//* @jsxFrag Fragment */
import { h, Fragment } from 'ajo'

const MyComponent = () => {
  return h(Fragment, null,
    h('h1', null, 'Hello'),
    h('h2', null, 'World')
  )
}

// Or using JSX syntax
const MyComponentJSX = () => (
  <>
    <h1>Hello</h1>
    <h2>World</h2>
  </>
)
```

### `set:`

The `set:` prefix in Ajo allows you to directly set properties on DOM elements from within your JSX. This is distinct from simply setting attributes, as it interacts with the properties of the DOM elements, much like how you would in plain JavaScript.

#### Purpose:

- **Direct DOM Property Manipulation:** The `set:` prefix is used for directly setting properties on DOM elements. This is crucial for cases where you need to interact with the DOM API, or when a property does not have a direct attribute equivalent.

#### Usage:

- **Versatile Property Assignment:** Use `set:` to assign various types of properties to DOM elements, including but not limited to event handlers. It can be used for properties like `textContent`, `scrollTop`, custom data properties, and more.
- **JavaScript-centric DOM Interaction:** Ideal for situations where setting a DOM property is more appropriate or efficient than setting an HTML attribute.

#### Examples:

**Assigning Text Content:**
```jsx
function* MyComponent() {
  const text = "Hello, Ajo!"
  yield <div set:textContent={text} skip></div>
}
```
> Here, `set:textContent` directly sets the `textContent` property of the `div`'s DOM node. `skip` is used to prevent Ajo from overriding the `div`'s children.

**Setting Inner HTML:**
```jsx
function* MyComponent() {
  const html = "<p>Hello, Ajo!</p>"
  yield <div set:innerHTML={html} skip></div>
}
```
> In this case, `set:innerHTML` is used to set the `innerHTML` property of the `div`'s DOM element. `skip` is used to prevent Ajo from overriding the `div`'s children.

**Event Handlers (e.g., onclick):**
```jsx
function* MyComponent() {
  const handleClick = () => console.log('Clicked')
  yield <button set:onclick={handleClick}>Click Me</button>
}
```
> `set:onclick` assigns the `handleClick` function as the click event listener for the button.

### Special Attributes in Ajo

In Ajo, there are several special attributes (`key`, `skip`, `memo`, and `ref`) that have specific purposes and behaviors. Understanding these attributes is crucial for optimizing rendering and managing component lifecycle and references in your applications.

#### `key` Attribute:
- **Purpose:** The `key` attribute is used to track the identity of elements in lists or sequences. It's crucial for optimizing the rendering process, especially when dealing with dynamic lists where items can be added, removed, or reordered.
- **Behavior:** When a list of elements is rendered, Ajo uses the `key` attribute to efficiently update the DOM. It identifies which elements have changed, need to be added, or can be reused. This minimizes DOM manipulations, leading to better performance.
- **Example:** In a list of items rendered by a map function, each item should have a unique `key` prop, like `h('li', { key: item.id }, item.text)`.

#### `skip` Attribute:
- **Purpose:** The `skip` attribute is used to instruct Ajo to skip rendering for a specific element child nodes. It's useful for preventing certain parts of the DOM from being updated, like when using a third-party library that manipulates the DOM directly.
- **Behavior:** When `skip` is set to `true` on an element, Ajo will not render or update that element's child nodes.
- **Example:** `h('div', { skip: shouldSkip })` - here, if `shouldSkip` is `true`, Ajo will not render or update the `div`'s child nodes.

#### `memo` Attribute:
- **Purpose:** The `memo` attribute is used for memoization. It's a performance optimization technique to prevent unnecessary renders.
- **Behavior:** When the `memo` attribute is provided, Ajo will shallow compare the memoized values with the new ones. If they are the same, Ajo will skip rendering the element attributes, properties and child nodes. For stateful components, this also prevents the component from re-rendering.
- **Example:** `h(div, { memo: [dependency1, dependency2] })` - the element will re-render only if `dependency1` or `dependency2` change.

#### `ref` Attribute:
- **Purpose:** The `ref` attribute provides a way to access the underlying DOM element.
- **Behavior:** When an element is mounted or updated, the `ref` callback is called with the DOM element as an argument. This allows you to store a reference to it for later use, such as focusing an input or measuring dimensions.
- **Example:** `h('input', { ref: el => (this.inputNode = el) })` - stores a reference to the input element.

## Stateful components

Stateful components in Ajo are defined using generator functions. These components are designed with a minimalistic API for controlling rendering and state updates. They are equipped with several lifecycle methods that allow for advanced control over component behavior, error handling, and rendering processes.

The following example demonstrates key features of stateful components in Ajo:

```jsx
function* ChatComponent({ user = 'Anonymous', room }) { // Receive arguments initial values.

  // Define mutable state variables.
  let message = '', connected = false

  // Define event handlers.
  const handleMessageChange = event => {

    message = event.target.value

    // Render synchronously.
    this.next()
  }

  const send = () => {

    if (message) {

      connection.send(JSON.stringify({ user: this.$args.user, message }))

      message = ''

      // Render asynchronously.
      this.refresh()
    }
  }

  const handleConnectionOpen = () => {
    connected = true
    this.refresh()
  }

  const handleConnectionError = error => {
    // Throw error to be caught by the component itself or a parent component.
    this.throw(new Error('Connection error: ' + error.message))
  }

  // Setup resources.
  const server = `ws://chat.com/${room}`
  const connection = new WebSocket(server)

  connection.onopen = handleConnectionOpen
  connection.onerror = handleConnectionError

  // 'this' is a DOM element, so we can use DOM APIs on it.
  this.classList.add('chat-component')

  try { // Optional try/finally block for cleanup logic.

    for ({ user } of this) { // Iterates over generator, optionally receiving updated arguments.

      try { // Optional try/catch block for error handling.

        // Compute derived values.
        const status = connected ? `You are connected as ${user}.` : "Connecting to chat..."

        // Render the component UI.
        yield (
          <>
            <div class="status-message">{status}</div>
            <div class="connection-status">{connected ? 'Connected' : 'Connecting...'}</div>
            <input type="text" value={message} set:onchange={handleMessageChange} />
            <button set:onclick={send}>Send</button>
          </>
        )
      } catch (e) {
        // Handle any errors that occur during rendering or state updates.
        yield <pre>Error: {e.message}</pre>
      }
    }
  } finally {
    // Cleanup logic: release resources, close connections, etc.
    connection.close()
  }
}
```

## Lifecycle methods

Stateful components in Ajo are equipped with several methods that allow for advanced control over component behavior, error handling, and rendering processes. These methods are called lifecycle methods and are invoked at different stages of the component's lifecycle.

### `this.refresh()`

The `refresh` method is used to asynchronously trigger a re-render of a stateful component in Ajo. It schedules a render using `requestAnimationFrame`, ensuring that the rendering aligns with the browser's paint cycle.

#### Purpose:

- **Asynchronous Rendering:** `this.refresh()` queues a render of the component in the next animation frame, making it asynchronous.
- **Single Render:** If called multiple times before the browser paints, `this.refresh()` schedules only one render, ensuring that the component is rendered only once.

#### Usage:

- **For Performance Optimization:** Ideal in scenarios where multiple state updates occur in quick succession.
- **In Event Handlers and Async Operations:** Useful in event handlers or after asynchronous operations where you need to update the UI in response to changes.

#### Example:

```jsx
function* DataFetcher() {

  let data = null

  const fetchData = async () => {

    data = await fetchSomeData()

    // Queue a re-render to update the component with the fetched data:
    this.refresh()
  }

  while (true) {
    yield (
      <div>
        <button set:onclick={fetchData}>Fetch Data</button>
        {data && <DisplayData data={data} />}
      </div>
    )
  }
}
```
> In this example, `DataFetcher` uses `this.refresh()` to update its display after data is fetched. The use of `this.refresh()` ensures that the rendering is efficient and aligned with the browser's rendering cycle.

### `this.next()`
> **Note:** `this.next()` is called asynchronously when calling `this.refresh()`.

The `next` method is used within stateful components in Ajo to manually advance the component's generator function to its next yield point. This method is crucial for synchronously rendering the next state of the component.

#### Purpose:

- **Synchronous Rendering:** `this.next()` is used to immediately render the next state of the component. It advances the generator function to the next yield, reflecting any changes in state or props right away.

#### Usage:

- **In Response to State Changes:** Typically, `this.next()` is called in scenarios where the component's state has changed and an immediate update to the DOM is required.
- **For Controlled Updates:** It allows for more controlled and predictable updates, as it bypasses the asynchronous rendering cycle from `this.refresh()`.

#### Example:

```jsx
function* Counter() {

  let count = 0

  const increment = () => {

    count++

    // Immediately render the updated count
    this.next()
  }

  while (true) {
    yield <button set:onclick={increment}>{count}</button>
  }
}
```
> In this example, `Counter` uses `this.next()` in its `increment` function to immediately render the updated count whenever the button is clicked.

### `this.throw()`
> **Note:** `this.throw()` is automatically called when an error is thrown from a component's generator function.

The `throw` method in Ajo stateful components is designed for error propagation within the component hierarchy. It allows developers to throw errors from a child component to be caught and handled by itself or a parent component, facilitating a structured approach to error management.

#### Purpose:

- **Error Propagation:** `this.throw()` is used to send errors from the current component up to its parents component, akin to creating an error boundary.

#### Usage:

- **Handling Uncaught Exceptions:** Typically used within event handlers or asynchronous operations where errors might occur. Instead of handling these errors locally within the component, `this.throw()` sends them to the parent component for a more centralized handling approach.
- **Creating Error Boundaries:** Useful in scenarios where a parent component is designed to handle errors from its child components, maintaining separation of concerns and cleaner code.

#### Example:

```jsx
function* ChildComponent() {

  const handleErrorProneOperation = async () => {
    try {

      // operation that might throw an error
      await doSomething()

    } catch (err) {

      // Propagate error to parent component
      this.throw(err) 
    }
  }

  while (true) {
    yield <button set:onclick={handleErrorProneOperation}>Click Me</button>
  }
}

function* ParentComponent() {
  while (true) {
    try {
      yield <ChildComponent />
    } catch (err) {
      yield <div>Error: {err.message}</div>
    }
  }
}
```
> In this example, `ChildComponent` uses `this.throw()` within an event handler to propagate errors upwards to its parent component, `ParentComponent`. The parent component then catches the error and renders it to the DOM.

### `this.return()`
> **Note:** `this.return()` is automatically called when a stateful component is unmounted.

The `return` method in Ajo is used to reset and restart the generator function of a stateful component. It effectively ends the current execution of the component's generator function, and optionally re-execute it from scratch allowing for a complete reset of the component's state and behavior.

#### Purpose:

- **Component Reset:** `this.return()` is used to restart a component's generator function from the beginning, resetting its internal state and re-initializing it as needed.

#### Usage:

- **Re-initializing Components:** Ideal for use cases where the component needs to reset its state completely, such as in response to significant prop changes or to reinitialize after certain user interactions.
- **Refreshing Component State:** Helps in scenarios where the existing state and logic of a component need to be discarded and started afresh.

#### Example:

```jsx
function* MultiStepForm({ initialData }) {

  let currentStep = 0
  let formData = { ...initialData }

  const handleNextStep = () => {

    // Logic to move to the next step
    currentStep++

    // Re-render with the next step
    this.refresh()
  }

  const handleRestart = () => {

    // Reset the generator function
    this.return()

    // Re-render the component in its initial state
    this.refresh()
  }

  while (true) {
    switch(currentStep) {
      case 0:
        yield <StepOne
                arg:data={formData}
                arg:onNext={handleNextStep}
                arg:onRestart={handleRestart}
              />
        break
      case 1:
        yield <StepTwo
                arg:data={formData}
                arg:onNext={handleNextStep}
                arg:onRestart={handleRestart}
              />
        break
      default:
        yield <FinalStep
                arg:data={formData}
                arg:onRestart={handleRestart}
              />
    }
  }
}
```
> In `handleRestart`, `this.return()` is first called to reset the generator function. This effectively ends the current execution of the component's generator function and prepares it to start from the beginning. Immediately after, `this.refresh()` is called to trigger a re-render of the component. This ensures that after the state is reset, the component's UI is also updated to reflect its initial state.

### `arg:`

- **Purpose:** The `arg:` prefix is used in Ajo to explicitly pass arguments to generator functions. This prefix distinguishes component arguments from regular HTML attributes and other special properties.

- **Behavior:**
  - When a stateful component is rendered in Ajo, any property on it that starts with `arg:` is treated as an argument to be passed to the component's generator function.
  - This mechanism ensures that the arguments are clearly identified and separated from other attributes or DOM properties.

- **Usage:** 
  - Use `arg:` prefixed attributes when you need to pass data or event handlers to a component's generator function.
  - This approach is particularly useful in maintaining a clear separation between component-specific arguments and other attributes that might be used for styling or DOM manipulation.

- **Example:**
```jsx
function* ParentComponent() {

  const someData = { /* ... */ }
  const handleEvent = () => { /* ... */ }

  yield <ChildComponent
          class="my-class"
          arg:data={someData}
          arg:onEvent={handleEvent}
        />
}

function* ChildComponent({ data, onEvent }) {
  // ...
}
```
> In this example, `ParentComponent` renders `ChildComponent`, passing `someData` and `handleEvent` as arguments using the `arg:` prefix. `class` is a regular HTML attribute and is not passed to the component's generator function, it is applied to the DOM element associated with the component.

This `arg:` prefixed attribute system in Ajo enhances the clarity and readability of component composition. It makes the intent of passing down arguments more explicit, reducing confusion between HTML attributes, and other special properties. This is especially beneficial in complex applications where components have multiple responsibilities and interact with both their children and the DOM.

## Acknowledgments
Ajo takes heavy inspiration from [Incremental DOM](https://github.com/google/incremental-dom) and [Crank.js](https://github.com/bikeshaving/crank)

## License

ISC © [Cristian Falcone](cristianfalcone.com)
