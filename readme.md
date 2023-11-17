# ajo
ajo is a JavaScript view library for building user interfaces

## install

```sh
npm install ajo
```

## render JSX into DOM

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
import { h, render, component } from 'ajo'

const Counter = component(function* ({ init = 0 }) {

	let count = init

	const handleClick = () => {
		count++
		this.refresh()
	}

	while (true) yield (
		<button set:onclick={handleClick}>
			Current: {count}
		</button>
	)
})

render(<Counter init={5} />, document.body)
```

## acknowledgments
ajo takes heavy inspiration from [Incremental DOM](https://github.com/google/incremental-dom) and [Crank.js](https://github.com/bikeshaving/crank)
