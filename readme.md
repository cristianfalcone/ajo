# ajo
ajo is a JavaScript view library for building user interfaces

## install

```sh
npm install ajo
```

## render a JSX element to a DOM element

```jsx
/** @jsx h */
import { h, render } from 'ajo'

document.body.innerHTML = '<div>Hello World</div>'

render(<div>Goodbye World</div>, document.body)
```

## function element (stateless)

```jsx
/** @jsx h */
import { h, render } from 'ajo'

const Greet = ({ name }) => <div>Hello {name}</div>

render(<Greet name="World" />, document.body)
```

## component element (stateful)

```jsx
/** @jsx h */
import { h, component, useState, render } from 'ajo'

const Counter = component(() => {

  const [count, setCount] = useState(0)

  return (
    <button set:onclick={() => setCount(count + 1)}>
      Current: {count}
    </button>
	)
})

render(<Counter />, document.body)
```

## acknowledgments
ajo takes heavy inspiration from [Incremental DOM](https://github.com/google/incremental-dom) and [React](https://github.com/facebook/react)
