# ajo
ajo is a JavaScript view library for building user interfaces

## Install

```sh
npm install ajo
```

## Render JSX to a DOM element

```jsx
/** @jsx h */
import { h, render } from 'ajo'

document.body.innerHTML = '<div>Hello World</div>'

render(<div>Goodbye World</div>, document.body)
```

## Stateless Component

```jsx
/** @jsx h */
import { h, render } from 'ajo'

const Greet = ({ name }) => <div>Hello {name}</div>

render(<Greet name="World" />, document.body)
```

## Stateful Component

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
    <button onclick={increment}>
      Current: {count}
    </button>
})

render(<Counter start={1} />, document.body)
```
