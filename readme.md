# ajo
ajo is a JavaScript view library for building user interfaces

## install

```sh
npm install ajo
```

## render JSX to a DOM element

```jsx
/** @jsx h */
import { h, render } from 'ajo'

document.body.innerHTML = '<div>Hello World</div>'

render(<div>Goodbye World</div>, document.body)
```

## stateless component

```jsx
/** @jsx h */
import { h, render } from 'ajo'

const Greet = ({ name }) => <div>Hello {name}</div>

render(<Greet name="World" />, document.body)
```

## stateful component

```jsx
/** @jsx h */
import { h, component, refresh, render } from 'ajo'

const Counter = component(({ start = 0 }, host) => {
  
  let count = start
  
  const increment = () => {
    count++
    refresh(host)
  }
  
  return () =>
    <button set:onclick={increment}>
      Current: {count}
    </button>
})

render(<Counter start={1} />, document.body)
```

## acknowledgments
ajo takes heavy inspiration from [Incremental DOM](https://github.com/google/incremental-dom) and [Crank.js](https://github.com/bikeshaving/crank)
