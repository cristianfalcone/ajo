# Welcome to Ajo! 🌟

## Crafting Dynamic UIs with Elegance and Efficiency

Hey there, fellow developer! Ready to spice up your web development journey? Say hello to Ajo, your new best friend in building dynamic, efficient, and beautifully responsive user interfaces. Whether you're a seasoned pro or just starting out, Ajo is here to make your coding experience smoother, faster, and dare we say, more fun!

### What's Ajo All About?

Imagine a world where your UI components are as fresh and vibrant as a perfectly seasoned dish. That's what Ajo brings to the table! It's a lightweight, powerful library that combines the best ideas from Incremental DOM and Crank.js, served with a dash of innovation.

With Ajo, you can:
- 🚀 Create lightning-fast UIs with efficient in-place DOM updates
- 🧠 Manage state effortlessly using JavaScript Generators
- 📝 Write intuitive code with JSX syntax
- 🔄 Control component lifecycles with precision
- 🌈 Build flexible and adaptable applications

### Why Choose Ajo?

1. **Speedy and Efficient**: Ajo's in-place DOM updates mean your apps run faster with less memory overhead.
2. **Generator-Powered**: Harness the power of JavaScript Generators for smooth state management and effects.
3. **JSX Friendly**: Feel right at home with JSX syntax, making your transition from React or similar libraries a breeze.
4. **Lightweight Champion**: Keep your project nimble with Ajo's minimal footprint.
5. **SSR Ready**: Seamlessly integrate server-side rendering for SEO-friendly, fast-loading pages.

### Let's Get Cooking with Ajo!

Ready to add some flavor to your project? Let's start by getting Ajo into your kitchen... err, development environment!

#### Installation

Fire up your terminal and run:

```bash
npm install ajo
```

That's it! Ajo is now ready to spice up your project.

#### Your First Ajo Recipe

Let's whip up a quick example to see Ajo in action:

```jsx
/** @jsx h */
/** @jsxFrag Fragment */
import { h, Fragment, render } from 'ajo'

// A simple, stateless component
const Greeting = ({ name }) => <h1>Hello, {name}!</h1>

// A stateful component with a dash of interactivity
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

// Let's bring it all together
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

// Serve it hot to the DOM!
render(<App />, document.body)
```

And voilà! You've just created your first Ajo application. A warm greeting and an interactive counter, all served up in a few lines of code.

Notice how our stateful components (`Counter` and `App`) use fragments (`<>...</>`) as their root elements. This is a best practice in Ajo to avoid creating unnecessary DOM nodes, as stateful components always render a wrapper element.

### What's Next?

This is just a taste of what Ajo can do. As you explore further, you'll discover how Ajo makes complex UI interactions simple and performant. From managing application state to creating reusable components, Ajo has got your back.

Ready to dive deeper? Let's explore Ajo's core concepts and APIs in the following sections. Trust us, it's going to be a delicious journey! 🌶️

Happy coding, and welcome to the Ajo family!

# The Ajo Rendering Process: Efficient UI Updates

Welcome to the world of Ajo rendering! Let's dive into how Ajo efficiently updates your UI, keeping things fast and responsive. No chef's hat required, but do bring your curiosity! 🚀

## Understanding Ajo's Rendering Approach

Ajo takes a unique approach to rendering that sets it apart:

1. **Lightweight Virtual Representation**: Ajo creates a minimal virtual representation of your components, reducing memory overhead.

2. **In-Place DOM Updates**: Instead of recreating the entire DOM tree, Ajo updates only what has changed, leading to efficient renders.

3. **Minimal Overhead**: By avoiding full virtual DOM diffing, Ajo keeps things speedy and memory-friendly.

Let's break these down and see how they work in practice!

## The `render` Function: Your Gateway to the DOM

The `render` function is your main tool for getting Ajo components onto the page:

```jsx
import { h, render } from 'ajo'

const App = () => <div>Welcome to Ajo!</div>

render(<App />, document.body)
```

This function takes your virtual DOM tree and efficiently updates the real DOM to match.

## Stateful Components: Where the Magic Happens

Stateful components in Ajo are where things get really interesting. They're implemented as generator functions, allowing for powerful state management:

```jsx
function* Counter() {

  let count = 0

  const increment = () => {
    count++
    this.render()  // Trigger a re-render
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

render(<Counter />, document.body)
```

Key points to remember:
- Use generator functions for stateful components.
- Call `this.render()` to trigger a re-render when state changes.
- The `while (true)` loop allows the component to yield new UI representations indefinitely.

## Efficient List Rendering

Ajo handles lists with impressive efficiency. Here's how you can leverage this:

```jsx
function* TodoList() {

  let todos = ['Learn Ajo', 'Build an app']

  const addTodo = () => {
    todos = [...todos, 'New todo']
    this.render()
  }

  while (true) {
    yield (
      <>
        <ul>
          {todos.map((todo, index) => (
            <li key={index}>{todo}</li>
          ))}
        </ul>
        <button set:onclick={addTodo}>Add Todo</button>
      </>
    )
  }
}
```

Note the use of the `key` prop on list items. This helps Ajo track individual items efficiently across renders.

## Why This Approach Matters

Ajo's rendering strategy offers several benefits:

1. **Performance**: Minimal DOM manipulation leads to faster updates.
2. **Scalability**: The approach works well for both small and large applications.
3. **Simplicity**: Write declarative code and let Ajo handle the DOM updates.

## Diving Deeper: The Render Cycle

Let's break down what happens when you call `this.render()`:

1. The generator function is advanced to its next `yield` point.
2. Ajo creates a lightweight virtual representation of the new UI state.
3. This representation is compared with the current DOM state.
4. Only the necessary changes are applied to the DOM.

This process ensures that updates are fast and efficient, regardless of the complexity of your UI.

## Conclusion

Understanding Ajo's rendering process is key to building efficient, responsive UIs. By leveraging stateful components, efficient list rendering, and judicious use of `this.render()`, you can create applications that are both powerful and performant.

Remember, the more you work with Ajo, the more intuitive this process will become. So dive in, experiment, and watch as your UIs come to life with lightning-fast updates!

Happy coding, and may your renders always be swift! 🚀✨

# Special Attributes: The Secret Spices of Your Ajo Components

Welcome, Ajo chefs! Let's dive into the special attributes - the secret ingredients that give your components that extra zing! These attributes are like the spices in your code kitchen, each adding its own unique flavor to your Ajo dish. Let's spice things up! 👩‍🍳

## 1. `key`: The Identification Seasoning 🏷️

Just as every great chef needs to identify their signature dishes, Ajo needs to identify items in a list. Enter the `key` attribute - your component's name tag at the rendering party!

```jsx
function* TodoList() {

  let todos = [
    { id: 1, text: 'Learn Ajo' },
    { id: 2, text: 'Build an app' }
  ]

  const addTodo = () => {
    todos = [...todos, { id: Date.now(), text: 'New Todo' }]
    this.render()
  }

  while (true) {
    yield (
      <>
        <ul>
          {todos.map(todo => (
            <li key={todo.id}>{todo.text}</li>
          ))}
        </ul>
        <button set:onclick={addTodo}>Add Todo</button>
      </>
    )
  }
}
```

🌶️ Spice Tip: Always use unique `key`s for list items. It helps Ajo keep track of which item is which, like a good chef knowing each ingredient in the pantry!

## 2. `skip`: The "Do Not Disturb" Sign 🚫

Sometimes, you want to tell Ajo, "Hey, hands off this part!" That's where `skip` comes in handy. It's like putting a "Do Not Disturb" sign on a hotel door, but for your component's children.

```jsx
function* ChartComponent() {

  let chart

  const initChart = (canvas) => {

    if (canvas == null) {
      chart?.destroy()
      return
    }

    chart ??= new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
          label: '# of Votes',
          data: [12, 19, 3, 5, 2, 3]
        }]
      }
    })
  }

  while (true) {
    yield (
      <canvas ref={initChart} skip></canvas>
    )
  }
}
```

🌶️ Spice Tip: Use `skip` when you're working with third-party ingredients that don't play well with Ajo's cooking style. It tells Ajo, "I've got this part covered, chef!"

## 3. `memo`: The Flavor Preserver 🧊

Why recook a dish if the taste hasn't changed? That's the philosophy behind `memo`. It's like vacuum-sealing your component's flavor, preserving it until the ingredients actually change.

```jsx
function* ExpensiveComponent({ data }) {

  const expensiveCalculation = () => {
    // Imagine this is a costly operation
    return data.reduce((acc, val) => acc + val, 0)
  }

  while (true) {
    yield (
      <div memo={[data]}>
        <p>Result: {expensiveCalculation()}</p>
      </div>
    )
  }
}
```

🌶️ Spice Tip: Use `memo` for components with expensive computations. It's like meal prepping - do the work once, enjoy the results many times!

## 4. `ref`: The Kitchen Assistant 🧑‍🍳

Sometimes you need to reach out and touch a DOM element directly. That's where `ref` comes in - it's like having a kitchen assistant who can hand you any tool you need, exactly when you need it.

```jsx
function* FormWithFocus() {

  let inputRef

  const focusInput = () => {
    inputRef.focus()
  }

  while (true) {
    yield (
      <>
        <input ref={el => inputRef = el} />
        <button set:onclick={focusInput}>Focus Input</button>
      </>
    )
  }
}
```

🌶️ Spice Tip: Use `ref` when you need direct access to DOM elements. It's like having X-ray vision in your kitchen!

## 5. `attr:`: The Attribute Sprinkler 🧂

When you want to sprinkle some HTML attributes onto your component's root element, `attr:` is your go-to seasoning shaker!

```jsx
function* CustomButton(args) {
  while (true) yield (
    <>
      <i class="fa-solid fa-hand-pointer"></i>
      {args.children}
    </>
  )
}

CustomButton.attrs = { class: 'btn btn-primary' }
CustomButton.is = 'button'

// Usage
<CustomButton attr:id="submit-btn" attr:aria-label="Submit">
  Click Me
</CustomButton>
```

🌶️ Spice Tip: Use `attr:` to add any HTML attribute to your component's root element. It's like adding the final garnish to your gourmet component dish!

## Putting It All Together: The Ajo Feast 🍽️

These special attributes are the secret spices in your Ajo cookbook:

- Use `key` to help Ajo identify your list items - like name tags at a potluck.
- Apply `skip` when you need to tell Ajo "hands off" - it's the "I'll handle this dish myself" of attributes.
- Sprinkle `memo` to preserve expensive computations - think of it as your component's flavor-saver.
- Reach for `ref` when you need direct DOM access - it's your kitchen assistant, always ready to hand you the right tool.
- Shake some `attr:` to add HTML attributes - the final seasoning for your component masterpiece.

By mastering these special attributes, you'll be able to cook up Ajo components that are not just functional, but Michelin-star worthy! Your UI will be so responsive, efficient, and well-managed, it'll make Gordon Ramsay weep tears of joy.

Now go forth and create your Ajo masterpieces. May your components be tasty and your renders be swift! Bon appétit! 👨‍🍳🎉

# Stateless Components in Ajo: Simple, Efficient, and Powerful

Welcome to the world of stateless components in Ajo! These are the building blocks of your UI that focus purely on presentation. Let's dive into what makes them tick and how to use them effectively. 🧱✨

## What are Stateless Components?

In Ajo, stateless components are simple function wrappers that return JSX. They're pure functions of their args, meaning they always render the same output for a given input, without any internal state or side effects.

## Basic Structure

Here's the simplest form of a stateless component:

```jsx
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>
}
```

## Using Args

In Ajo, we typically refer to the arguments passed to components as "args". Here's how you can use them:

```jsx
function UserCard({ name, email, avatar }) {
  return (
    <div className="user-card">
      <img src={avatar} alt={name} />
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  )
}

// Usage
<UserCard 
  name="Alice Smith" 
  email="alice@example.com" 
  avatar="https://example.com/alice.jpg"
/>
```

## Composition

One of the strengths of stateless components is how easily they can be composed to create more complex UIs:

```jsx
function Header({ title }) {
  return <header><h1>{title}</h1></header>
}

function Footer({ copyright }) {
  return <footer>&copy; {copyright}</footer>
}

function Page({ title, content, year }) {
  return (
    <>
      <Header title={title} />
      <main>{content}</main>
      <Footer copyright={year} />
    </>
  )
}

// Usage
<Page 
  title="Welcome to Ajo" 
  content={<p>Ajo makes building UIs efficient and fun!</p>} 
  year={2024} 
/>
```

## Best Practices

1. **Keep It Simple**: Stateless components should focus on presentation. If you need state, consider using a stateful component instead.

2. **Args Types**: While Ajo doesn't enforce args types, it's a good practice to use TypeScript to define the expected args:

   ```typescript
   interface UserCardArgs {
     name: string;
     email: string;
     avatar: string;
   }

   function UserCard({ name, email, avatar }: UserCardArgs) {
     // Component body
   }
   ```

3. **Default Args**: You can provide default values for args to make your components more flexible:

   ```jsx
   function Button({ text = 'Click me', onClick }) {
     return <button set:onclick={onClick}>{text}</button>
   }
   ```

4. **Destructuring Args**: For better readability, destructure your args in the function parameters:

   ```jsx
   function Profile({ name, bio, isVerified }) {
     return (
       <div>
         <h2>{name} {isVerified && '✓'}</h2>
         <p>{bio}</p>
       </div>
     )
   }
   ```

## Conclusion

Stateless components in Ajo are powerful in their simplicity. They're easy to write, test, and reason about, making them an essential tool in your Ajo toolkit. By focusing on creating small, reusable stateless components, you can build complex UIs that are both performant and maintainable.

Remember, the art of great Ajo development often lies in knowing when to use stateless components and when to reach for stateful ones. As you continue your Ajo journey, you'll develop an intuition for this balance. 🚀📦

# Mastering Stateful Components in Ajo

Stateful components in Ajo are powerful constructs that form the backbone of dynamic, interactive UIs. Let's dive into how they work and how to use them effectively.

## Understanding Stateful Components

In Ajo, stateful components are implemented using generator functions. This unique approach allows components to maintain state across renders and react to changes over time.

## Basic Structure

Here's the fundamental structure of a stateful component in Ajo:

```typescript
import { Component } from 'ajo'

const Counter: Component<{ initial?: number }> = function* (args) {

  let count = args.initial ?? 0

  while (true) {
    yield (
      <div>
        <p>Count: {count}</p>
        <button set:onclick={() => { count++; this.render(); }}>Increment</button>
      </div>
    )
  }
}
```

Key points:
1. Stateful components are generator functions.
2. They use a `while (true)` loop to yield JSX indefinitely.
3. `this.render()` triggers re-renders when state changes.

## The Lifecycle of a Stateful Component

1. **Initialization**: The generator function is called, and runs until the first `yield`.
2. **Rendering**: Ajo renders the yielded JSX.
3. **Updates**: When `this.render()` is called, the generator advances to the next `yield`.
4. **Cleanup**: When the component is unmounted, the generator's `finally` block (if present) is executed.

## Managing State

Unlike React's useState, state in Ajo components is managed using regular variables:

```typescript
const Timer: Component = function* () {

  let seconds = 0
  let intervalId: number | null = null

  const start = () => {
    if (intervalId === null) {
      intervalId = setInterval(() => {
        seconds++
        this.render()
      }, 1000)
    }
  }

  const stop = () => {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  try {
    while (true) {
      yield (
        <div>
          <p>Time: {seconds} seconds</p>
          <button set:onclick={start}>Start</button>
          <button set:onclick={stop}>Stop</button>
        </div>
      )
    }
  } finally {
    stop() // Cleanup on unmount
  }
}
```

## Working with Args

In Ajo, we use "args" instead of "props". It's crucial not to destructure args in the generator function, as they always point to the same object and get updated on re-renders:

```typescript
const Greeter: Component<{ name: string }> = function* (args) {
  while (true) {
    yield <h1>Hello, {args.name}!</h1>
    // args.name will always be up-to-date, even if changed by a parent
  }
}
```

## Attributes vs Args

To pass HTML attributes to a stateful component's root element, use the `attr:` prefix:

```typescript
<Greeter name="Alice" attr:class="greeting" attr:id="main-greeting" />
```

## Component.attrs and Component.is

Ajo provides two special properties for customizing components:

```typescript
const CustomButton: Component<{ children: any }> = function* (args) {

  const handleClick = () => {
    console.log('Button clicked!')
  }

  this.addEventListener('click', handleClick)

  try {
    while (true) yield (
      <>
        <i class="icon-click"></i>
        {args.children}
      </>
    )
  } finally {
    this.removeEventListener('click', handleClick)
  }
}

CustomButton.attrs = { class: 'btn btn-primary' }
CustomButton.is = 'button'

// Usage
<CustomButton>Click Me</CustomButton>
// Renders as: <button class="btn btn-primary"><i class="icon-click"></i>Click Me</button>
```

## Handling Side Effects

Side effects in Ajo are managed directly within the generator function:

```typescript
const DataFetcher: Component<{ url: string }> = function* (args) {

  let data = null
  let error = null

  const fetchData = async () => {
    try {
      const response = await fetch(args.url)
      data = await response.json()
    } catch (e) {
      error = e
    }
    this.render()
  }

  fetchData() // Initial fetch

  while (true) {
    if (error) {
      yield <div>Error: {error.message}</div>
    } else if (data) {
      yield <div>Data: {JSON.stringify(data)}</div>
    } else {
      yield <div>Loading...</div>
    }
  }
}
```

## Advanced: Using Refs

Refs in Ajo allow parent components to interact with child components:

```typescript
import { Ref, Component } from 'ajo'

type ChildComponentElement = ThisParameterType<typeof ChildComponent> | null

const ChildComponent: Ref<Component<{ value: number }>> = function* (props) {

  props.ref(this)
  
  try {
    while (true) {
      yield <div>Value: {props.value}</div>
    }
  } finally {
    props.ref(null)
  }
}

const ParentComponent: Component = function* () {

  let childRef: ChildComponentElement = null
  let value = 0

  const incrementChild = () => {
    if (childRef) {
      value++
      childRef.render()
    }
  }

  while (true) {
    yield (
      <>
        <ChildComponent ref={el => childRef = el} value={value} />
        <button set:onclick={incrementChild}>Increment Child</button>
      </>
    )
  }
}
```

## Best Practices

1. Use the `finally` block for cleanup operations.
2. Avoid destructuring args to ensure you always have the latest values.
3. Use TypeScript for better type safety and editor support.
4. Keep your components focused and consider breaking large components into smaller ones.
5. Use refs judiciously, preferring props and composition when possible.

## Conclusion

Stateful components in Ajo offer a powerful way to create dynamic, interactive UIs. By leveraging generator functions, you can create components that are both expressive and efficient. As you continue to work with Ajo, you'll discover even more ways to harness the power of stateful components. 🎛️✨

# Mastering the Rhythm of Your Components

Let's dive into the lifecycle methods that give your components their pulse and responsiveness. These methods are your secret weapons for creating dynamic, efficient UIs that respond to change like a well-choreographed dance.

## The Maestro: this.render()

Think of `this.render()` as the conductor of your component orchestra. It's your go-to method when you want your component to reflect its latest state.

```jsx
function* DynamicGreeter(args) {

  let greeting = "Hello"

  const changeGreeting = () => {
    greeting = greeting === "Hello" ? "Bonjour" : "Hello"
    this.render()  // 🎭 Cue the UI update!
  }

  while (true) {
    yield (
      <>
        <h1>{greeting}, {args.name}!</h1>
        <button set:onclick={changeGreeting}>Switch Language</button>
      </>
    )
  }
}
```

🎵 Pro Tip: `this.render()` ensures your component doesn't try to sing two songs at once. If it's already in the middle of a performance (execution), it won't start another until the current one is done.

## The Understudy: this.next()

While `this.next()` is the behind-the-scenes hero, it's rarely in the spotlight of your code. It's called automatically by `this.render()` and Ajo's rendering process.

```jsx
function* AsyncGreeter(args) {

  let greeting = "Hello"

  const fetchGreeting = async () => {
    greeting = await getRandomGreeting()
    this.render()  // 🌟 We use render() here, not next()
  }

  fetchGreeting()

  while (true) {
    yield <h1>{greeting}, {args.name}!</h1>
  }
}
```

🎭 Stage Whisper: You'll rarely need to call `this.next()` directly. Let Ajo handle this backstage work!

## The Reset Button: this.return()

`this.return()` is like the "reset" button on your component. Use it to start fresh or clean up when your component leaves the stage!

```jsx
function* ColorCycler(args) {

  const colors = ['red', 'green', 'blue']
  let index = 0

  const cycleColor = () => {
    index = (index + 1) % colors.length
    this.render()
  }

  const reset = () => {
    this.return()  // 🔄 Reset the generator state
    this.render()  // 🎬 Start fresh!
  }

  while (true) {
    yield (
      <>
        <div style={`background-color: ${colors[index]}; padding: 20px;`}>
          Current Color: {colors[index]}
        </div>
        <button set:onclick={cycleColor}>Next Color</button>
        <button set:onclick={reset}>Reset</button>
      </>
    )
  }
}
```

🎭 Director's Note: Clicking "Reset" will call `this.return()`, resetting `index` to 0 on the next render. It's like giving your component a fresh start!

## The Error Handler: this.throw()

When things go off-script, `this.throw()` is your error-handling superhero. But Ajo has some built-in error handling tricks up its sleeve too!

```jsx
function* PotentiallyErrorProneComponent(args) {
  while (true) {
    if (Math.random() < 0.5) {
      throw new Error("Oops! Something went wrong.")
    }
    yield <div>Everything's fine!</div>
  }
}

function* ErrorBoundary(args) {
  try {
    while (true) {
      yield <PotentiallyErrorProneComponent />
    }
  } catch (error) {
    yield <div style="color: red;">Error caught: {error.message}</div>
  }
}
```

🎭 Safety Net: Ajo automatically propagates errors thrown in the generator function during rendering. You don't need to explicitly use `this.throw()` for errors in the main component body!

## Putting It All Together

Now that we've explored each lifecycle method, let's recap how they work in harmony to create dynamic, efficient Ajo components:

1. **this.render()**: Your trusty conductor 🎭
   - Use it to update your component's UI when state changes.
   - It's smart enough to avoid overlapping renders.
   - Example: `this.render()` after updating a counter or fetching new data.

2. **this.next()**: The behind-the-scenes hero 🎬
   - Rarely called directly in your code.
   - Automatically used by `this.render()` and Ajo's internal rendering process.
   - Advances the generator to its next yield point.

3. **this.return()**: The grand finale (or intermission) 🎟️
   - Automatically called by Ajo when the component is unmounted from the DOM.
   - Can be called manually to reset the component's state.
   - Ensures proper cleanup of resources.
   - Example: Resetting a form or clearing intervals before unmounting.

4. **this.throw()**: The plot-twist handler 🎭
   - Use it to manually propagate errors up the component tree.
   - Allows parent components to catch and handle errors from children.
   - Ajo automatically propagates errors thrown in the generator function during rendering.
   - Example: Bubbling up network errors or validation issues.

Remember, these methods work together to create the lifecycle of your Ajo components:

- Use `this.render()` for most UI updates.
- Let Ajo handle `this.next()` for you.
- `this.return()` will clean up automatically on unmount, but you can also use it for manual resets.
- Errors in your generator function will automatically propagate, but use `this.throw()` for manual error handling when needed.

By mastering these lifecycle methods, you'll be able to create Ajo components that are not just reactive, but proactive – anticipating and handling all the twists and turns of user interaction, data flow, and even unexpected errors. Your components will perform like seasoned actors, ready for any scenario, from opening night jitters to surprise plot twists!

So go forth and compose your Ajo symphonies with confidence. Break a leg! 🌟🎭

# Context: The Prototype Chain of Flavor

Now, we're diving deep into Ajo's context - a mechanism as layered and nuanced as a perfectly crafted tiramisu. It's all about the JavaScript prototype chain, folks! Let's see how this chain of inheritance flavors our component tree. 🍯

## Brewing the Base: Creating Context 🧪

First, let's create our base context flavor:

```javascript
import { context } from 'ajo'

const ThemeContext = context('light')  // Our base flavor
```

🍯 Flavor Note: This 'light' theme is like the bottom layer of our tiramisu - it's the foundation everything else builds upon.

## Tasting the Context: Using It in Components 🍽️

Let's see how components can taste this flavor:

```jsx
function* ThemedButton() {
  while (true) {
    const theme = ThemeContext()  // Sampling the current flavor
    yield (
      <button class={`btn-${theme}`}>
        I'm a {theme} themed button!
      </button>
    )
  }
}
```

🍯 Flavor Note: `ThemeContext()` is like dipping a spoon into our layered dessert - you taste the most immediate flavor.

## Layering Flavors: The Prototype Chain in Action 🎂

Now, let's see how we can layer different flavors down our component tree:

```jsx
function* App() {

  ThemeContext('dark')  // Changing the base flavor to 'dark'
  
  while (true) {
    yield (
      <>
        <ThemedButton />{/* This will be 'dark' */}
        <NestedTheme />
      </>
    )
  }
}

function* NestedTheme() {

  ThemeContext('neon')  // Adding a new flavor layer
  
  while (true) {
    yield (
      <>
        <ThemedButton />{/* This will be 'neon' */}
        <DeeplyNestedTheme />
      </>
    )
  }
}

function* DeeplyNestedTheme() {

  const theme = ThemeContext()  // Still tasting 'neon' here
  
  while (true) {
    yield (
      <>
        <p>Current theme: {theme}</p>
        <ThemedButton />{/* This will also be 'neon' */}
      </>
    )
  }
}
```

🍯 Flavor Note: Each call to `ThemeContext(value)` is like adding a new layer to our dessert. Components further down the tree taste the most recently added flavor, thanks to the prototype chain!

## The Flavor Doesn't Rise: Preserving Upper Layers 🏗️

Here's the kicker - changing the flavor down the tree doesn't affect the taste up above:

```jsx
function* App() {

  ThemeContext('dark')
  
  while (true) {
    const appTheme = ThemeContext()  // Still 'dark'
    yield (
      <>
        <p>App theme: {appTheme}</p>{/* Shows 'dark' */}
        <ThemedButton />{/* Uses 'dark' theme */}
        <NestedTheme />{/* Overrides 'dark' with 'neon'*/}
      </>
    )
  }
}
```

🍯 Flavor Note: The `App` component and its direct children still taste 'dark', even though `NestedTheme` changed the flavor to 'neon'. It's like each layer of our dessert maintains its own distinct taste!

## Putting It All Together: The Prototype Chain Feast 🍰

Context in Ajo leverages JavaScript's prototype chain, creating a delicious layer cake of data:

- Create your base context with `const MyContext = context(defaultValue)`.
- Access the current context value in components with `MyContext()`.
- Set a new context value with `MyContext(newValue)` in stateful components. This creates a new "layer" in the prototype chain.
- Child components inherit context from their parents but can override it without affecting their ancestors.
- Each component tastes the most immediate flavor in its prototype chain.

By understanding this prototype-based approach, you can create Ajo applications with sophisticated, hierarchical data flow. Your components will inherit and override context as needed, creating a rich, multi-layered experience.

Now go forth and layer your contexts! May your components be flavorful and your prototype chains be long and prosperous. Happy coding, chefs! 👩‍🍳🎉

# SSR and Hydration: From Stage Direction to Live Performance 🎭

Welcome, directors of the digital stage! Today, we're exploring the art of Server-Side Rendering (SSR) and hydration in Ajo. It's like preparing a Broadway show where the server sets the stage, and the client brings the performance to life. Let's raise the curtain on this spectacular process!

## Act I: Server-Side Rendering - Setting the Stage 🎬

In SSR, your server is like a meticulous stage manager, preparing everything before the audience (users) arrives. Let's see how to set up this initial scene:

```javascript
import express from 'express'
import { render } from 'ajo/html'
import { App } from './components'

const app = express()

app.get('/', (req, res) => {

  const html = render(<App />)
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Ajo Theater</title></head>
      <body>
        <div id="stage">${html}</div>
        <script src="/app.js"></script>
      </body>
    </html>
  `)
})

app.listen(3000, () => console.log('The theater is open on port 3000!'))
```

🎭 Director's Note: `render` from 'ajo/html' is our stage designer. It creates a static HTML representation of our App, like a beautifully painted backdrop.

## Act II: Client-Side Hydration - Bringing the Stage to Life 🌊

Now that our stage is set, it's time for the client to breathe life into our static scenery. This is where hydration comes in:

```javascript
import { render } from 'ajo'
import { App } from './components'

// Hydrate the #stage element with our live App performance
render(<App />, document.getElementById('stage'))
```

🎭 Director's Note: The same `render` function we use for normal rendering also handles hydration. It's like our actors stepping into the pre-set stage and beginning their performance!

## Act III: The Magic of Seamless Transitions 🎩✨

The beauty of Ajo's approach is in its simplicity. The same `render` function works for both initial renders and updates. It's like having actors who can smoothly transition from static mannequins to living, breathing performers without missing a beat!

```jsx
function* DynamicScene(props) {

  let mood = 'happy'

  const changeMood = () => {
    mood = mood === 'happy' ? 'sad' : 'happy'
    this.render()
  }

  while (true) {
    yield (
      <div>
        <p>The protagonist is feeling {mood}!</p>
        <button set:onclick={changeMood}>Change Mood</button>
      </div>
    )
  }
}
```

🎭 Director's Note: Whether this scene was initially rendered on the server or the client, the `changeMood` function will work seamlessly after hydration.

## Act IV: Streaming - A Continuous Performance 🌊🎭

Ajo even supports streaming, allowing your server to send your page in chunks, like a play unfolding act by act:

```javascript
import { html } from 'ajo/html'

app.get('/stream', (req, res) => {

  res.write('<!DOCTYPE html><html><body>')
  
  for (const chunk of html(<App />)) {
    res.write(chunk)
  }
  
  res.write('</body></html>')
  res.end()
})
```

🎭 Director's Note: Streaming is like revealing your play scene by scene, allowing the audience to start watching before the entire performance is ready!

## Epilogue: The Standing Ovation 👏

By mastering SSR and hydration in Ajo, you're creating a seamless experience for your users. It's like giving them a glimpse of the stage (fast initial load with SSR), and then magically bringing everything to life (hydration) without them even noticing the transition.

Remember:
1. Use `render` from 'ajo/html' on the server to set your static stage.
2. Use the same `render` (but from 'ajo') on the client to bring your live performance to life.
3. Your components work the same way whether they're rendered on the server or client.
4. Consider streaming for an even faster initial page load.

Now go forth and create web experiences so smooth, they'll make Broadway jealous! May your servers render swiftly and your hydration be seamless. Break a leg! 🎭✨

# TypeScript with Ajo: Spicing Up Your Components with Type Safety 🌶️

Hey there, Ajo enthusiasts! Ready to add some type-safe zest to your components? Let's dive into the world of TypeScript with Ajo and see how it can make your development experience even more delightful!

## Setting the Table: TypeScript Setup 🍽️

First things first, let's get our TypeScript ingredients ready:

```bash
npm install --save-dev typescript @types/node
```

## The Secret Sauce: Ajo's Type Definitions 🥫

Ajo comes with its own special blend of type definitions. These are like the perfect spice mix for your TypeScript dishes!

## Cooking Up Components 👨‍🍳

### Stateless Components: The Quick and Easy Appetizers 🥗

For our stateless components, think of them as simple, no-fuss appetizers:

```typescript
import { h } from 'ajo'

interface GreetingProps {
  name: string;
  age?: number;
}

const Greeting = (props: GreetingProps) => (
  <div>
    <h1>Hello, {props.name}!</h1>
    {props.age && <p>You are {props.age} years old.</p>}
  </div>
)
```

### Stateful Components: The Main Course 🍲

Now, for our stateful components, we're cooking with gas! Remember, we don't destructure args here - it's like keeping all our ingredients in one pot:

```typescript
import { Component } from 'ajo'

interface CounterProps {
  initialCount?: number;
}

const Counter: Component<CounterProps> = function* (args) {

  let count = args.initialCount ?? 0

  const increment = () => {
    count++
    this.render()
  }

  while (true) {
    yield (
      <div>
        <p>Count: {count}</p>
        <button set:onclick={increment}>Spice it up!</button>
      </div>
    )
  }
}
```

## Seasoning with Context 🧂

Let's add some context to our dish:

```typescript
import { Component, context } from 'ajo'

interface Theme {
  primaryColor: string;
  secondaryColor: string;
}

const ThemeContext = context<Theme>({
  primaryColor: '#FF6347', // Tomato red, spicy!
  secondaryColor: '#FFA500' // Orange, for a zesty kick
})

const ThemedButton: Component = function* () {
  while (true) {
    const theme = ThemeContext()
    yield (
      <button style={`background-color: ${theme.primaryColor}; color: ${theme.secondaryColor};`}>
        Spicy Button
      </button>
    )
  }
}
```

## Handling Refs: Two Flavors of Garnish 🌿

In the Ajo kitchen, we have two types of refs - think of them as two different garnishes that can add that perfect finishing touch to your dish. Let's explore both!

### 1. DOM Node Refs: The Classic Garnish 🍃

When you need to interact directly with DOM elements, use refs like this:

```typescript
import { Component } from 'ajo'

const InputWithFocus: Component = function* () {

  let inputRef: HTMLInputElement | null = null

  const focusInput = () => {
    inputRef?.focus()
  }

  while (true) {
    yield (
      <>
        <input ref={el => inputRef = el} />
        <button set:onclick={focusInput}>Focus Input</button>
      </>
    )
  }
}
```

Here, we're using a ref to get a handle on the input element, allowing us to focus it programmatically. It's like having a direct line to that specific ingredient in your dish!

### 2. Stateful Component Refs: The Gourmet Garnish 🌱

Now, for the more advanced flavor - refs with stateful components. This is like creating a special connection between your main dish and a complex side dish:

```typescript
import { Component } from 'ajo'

// First, let's define the type for our component's "this" context
type ComponentElement = ThisParameterType<typeof StatefulComponent> | null

// Now, let's create our stateful component
const StatefulComponent: Component<{ name: string }> = function* (props) {
  while (true) {
    yield <div>Hello, {props.name}!</div>
  }
}

// Here's how we use our component with a ref
function* ParentComponent() {

  let componentRef: ComponentElement = null

  while (true) {
    yield (
      <StatefulComponent
        name="Ajo Chef"
        ref={(el) => (componentRef = el)}
      />
    )
  }
}
```

In this gourmet recipe:
1. We define `ComponentElement` as the type of our component instance.
2. We use `Component<Props>` to type our component, which has a `ref` property added to its props.
3. In the component, we can now use the `ref` prop to get a reference to the component instance.

This approach allows for type-safe refs that play nicely with Ajo's component lifecycle. It's like having a perfectly coordinated multi-course meal where each dish complements the others!

## Chef's Tips for Refs 👨‍🍳💡

1. Use DOM node refs when you need to interact directly with HTML elements.
2. Use stateful component refs when you need to access or control a component instance.
3. Use TypeScript's type inference and the provided types (`Component<Props>`) to ensure type safety when working with refs.

By mastering these two types of refs, you'll be able to create more interactive and dynamic Ajo applications. It's like having two secret ingredients that can elevate your code cuisine to new heights! 🚀🍽️

## Event Handlers: Stirring the Pot 🥄

Let's make our event handlers type-safe and tasty:

```typescript
import { Component } from 'ajo'

const SpicyForm: Component = function* () {

  let spiceLevel = ''

  const handleInput = (e: Event) => {
    if (e.target instanceof HTMLInputElement) {
      spiceLevel = e.target.value
      this.render()
    }
  }

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    console.log(`Cooking with ${spiceLevel} spiciness!`)
  }

  while (true) {
    yield (
      <form onSubmit={handleSubmit}>
        <input type="text" value={spiceLevel} set:oninput={handleInput} />
        <button type="submit">Bring the heat!</button>
      </form>
    )
  }
}
```

## Chef's Tips: Best Practices 👨‍🍳💡

1. Always season your components with prop types, even if they're as plain as flour (use `{}` for no props).
2. Use the `Component` type from Ajo to properly type your stateful components - it's the secret ingredient!
3. Let TypeScript's type inference do the heavy lifting when it can, but don't be shy about adding explicit types when they make your code more flavorful.
4. Turn up the heat with `strictNullChecks` in your `tsconfig.json` to catch any bland null or undefined errors.
5. When using refs, always check if they're fully cooked (not null) before digging in.

By following these recipes, you'll be cooking up type-safe, delicious Ajo applications that are a feast for the eyes (and the linter)! Now go forth and create some TypeScript masterpieces that would make any code chef proud! 👨‍🍳🎉
