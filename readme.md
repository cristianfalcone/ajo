# ajo
ajo is a JavaScript view library for building user interfaces

```sh
npm install ajo
```

## Incremental DOM
To keep the UI in sync, ajo uses a technique called incremental DOM.
It is a way to build UI components without the need to keep previous virtual DOM in memory.
Instead, generated virtual DOM is diffed against the actual DOM, and changes are applied along the way.
This reduces memory usage and makes ajo code more simple and concise. As a result, ajo is easy to read and maintain, but lacks perfomance oportunities that diffing two virtual DOM trees can provide.

```jsx
/** @jsx h */
import { h, render } from 'ajo'

document.body.innerHTML = '<div>Hello World</div>'

render(document.body, <div>Goodbye World</div>)
```

## Stateless components
As a way to reuse markup snipets, ajo uses simple synchroneous functions that return virtual DOM.
This type of components are ment to be "consumers" of data.
No state is preserved between invocations, so generated virtual DOM should rely exclusively on function's arguments. 

```jsx
/** @jsx h */
import { h, render } from 'ajo'

const Greet = ({ name }) => <div>Hello {name}</div>

render(document.body, <Greet name="World" />)
```

## Stateful components
Since ajo does not store previous virtual DOM, stateful components rely on a DOM node to preserve its state between UI updates.
This DOM node is called a host node (similar to a Web Component host node).
State is declared in a generator function local scope.
Then ajo asociates the returned iterator with the host, and updates host children nodes each time, retrieving iterator's next value. Lifecycle of these components are closely related to its host nodes, and generator function provides a way to manage them.

```jsx
/** @jsx h */
import { h, component, render, refresh } from 'ajo'

const Counter = component(({ start = 0 }, host) => {
  let count = start
  
  const increment = () => {
    count++
    refresh(host)
  }
  
  return () =>
    <button onclick={increment}>
      Current: {count}
    </button>
})

render(document.body, <Counter start={1} />)
```
