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

function* Counter({ init = 0 }) {

	let count = init

	const handleClick = () => {
		count++
		this.next()
	}

	while (true) yield (
		<button set:onclick={handleClick}>
			Current: {count}
		</button>
	)
}

render(<Counter arg:init={5} />, document.body)
```

## acknowledgments
ajo takes heavy inspiration from [Incremental DOM](https://github.com/google/incremental-dom) and [Crank.js](https://github.com/bikeshaving/crank)
