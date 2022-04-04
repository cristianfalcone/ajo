# ajo
ajo is a JavaScript view library for building user interfaces

```bash
npm install ajo
```

## Incremental DOM
To keep the UI in sync, ajo uses a technique called incremental DOM.
It is a way to build UI components without the need to keep previous virtual DOM in memory.
Instead, generated virtual DOM is diffed against the actual DOM, and changes are applied along the way.
This reduces memory usage and makes ajo code more simple and concise. As a result, ajo is easy to read and maintain, but lacks perfomance oportunities that diffing two virtual DOM trees can provide.

```jsx
/** @jsx createElement */
import { render, createElement } from 'ajo'

document.body.innerHTML = '<div>Hello World</div>'

render(<div>Goodbye World</div>, document.body)
```

## Stateless components
As a way to reuse markup snipets, ajo uses simple synchroneous functions that return virtual DOM.
This type of components are ment to be "consumers" of data.
No state is preserved between invocations, so generated virtual DOM should rely exclusively on function's arguments. 

```jsx
/** @jsx createElement */
import { render, createElement } from 'ajo'

const Greet = ({ name }) => <div>Hello {name}</div>

render(<Greet name="World" />, document.body)
```

## Stateful components
Since ajo does not store previous virtual DOM, stateful components rely on a DOM node to preserve its state between UI updates.
This DOM node is called a host node (similar to a Web Component host node).
State is declared in a generator function local scope.
Then ajo asociates the returned iterator with the host, and updates host children nodes each time, retrieving iterator's next value. Lifecycle of these components are closely related to its host nodes, and generator function provides a way to manage them.

```jsx
/** @jsx createElement */
import { render, createElement, createComponent } from 'ajo'

const Counter = createComponent(function* () {
	let count = 1
	
	const increment = () => {
		count++
		this.update()
	}
	
	for ({} of this) yield (
		<button onclick={increment}>
			Current: {count}
		</button>
	)
})

render(<Counter />, document.body)
```
