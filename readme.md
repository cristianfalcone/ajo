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

const Counter = component(host => {

  let count = 0

  const increment = () => {
    count++
    refresh(host)
  }

  return () =>
    <button set:onclick={increment}>
      Current: {count}
    </button>
})

render(<Counter />, document.body)
```

## rendering lists

```jsx
/** @jsx h */
import { h, render, component, For } from 'ajo'

const products = [
  { title: 'Cabbage', isFruit: false, id: 1 },
  { title: 'Garlic', isFruit: false, id: 2 },
  { title: 'Apple', isFruit: true, id: 3 },
];

const ShoppingList = component(() => {
  const listItem = product =>
    <li style={stx({ color: product.isFruit ? 'magenta' : 'darkgreen' })}>
      {product.title}
    </li>

  return ({ products }) => <For each={products} is="ul">{listItem}</For>
})

render(<ShoppingList producst={products} />, document.body)
```

## acknowledgments
ajo takes heavy inspiration from [Incremental DOM](https://github.com/google/incremental-dom) and [Crank.js](https://github.com/bikeshaving/crank)
