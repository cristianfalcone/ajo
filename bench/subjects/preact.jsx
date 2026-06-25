import { render } from 'preact'
import { useState } from 'preact/hooks'
import { build } from './data.js'

const Button = props => <div class="col-sm-6 smallpad"><button id={props.id} class="btn btn-primary btn-block" type="button" onClick={props.onClick}>{props.children}</button></div>
const App = () => {
	const [data, setData] = useState([])
	const [selected, setSelected] = useState()
	const run = () => setData(build(1000))
	const runlots = () => setData(build(10000))
	const add = () => setData(data => data.concat(build(1000)))
	const update = () => setData(data => {
		const next = data.slice()
		for (let i = 0; i < next.length; i += 10) next[i].label += ' !!!'
		return next
	})
	const clear = () => (setData([]), setSelected())
	const swaprows = () => setData(data => {
		const next = data.slice()
		if (next.length > 998) [next[1], next[998]] = [next[998], next[1]]
		return next
	})
	const remove = row => setData(data => data.toSpliced(data.indexOf(row), 1))

	return <div class="container">
		<div class="jumbotron"><div class="row">
			<div class="col-md-6"><h1>Preact</h1></div>
			<div class="col-md-6"><div class="row">
				<Button id="run" onClick={run}>Create 1,000 rows</Button>
				<Button id="runlots" onClick={runlots}>Create 10,000 rows</Button>
				<Button id="add" onClick={add}>Append 1,000 rows</Button>
				<Button id="update" onClick={update}>Update every 10th row</Button>
				<Button id="clear" onClick={clear}>Clear</Button>
				<Button id="swaprows" onClick={swaprows}>Swap Rows</Button>
			</div></div>
		</div></div>
		<table class="table table-hover table-striped test-data"><tbody>{data.map(row => <tr key={row.id} class={row == selected ? 'danger' : ''}>
			<td class="col-md-1">{row.id}</td>
			<td class="col-md-4"><a onClick={() => setSelected(row)}>{row.label}</a></td>
			<td class="col-md-1"><a onClick={() => remove(row)}><span class="glyphicon glyphicon-remove" aria-hidden="true" /></a></td>
			<td class="col-md-6" />
		</tr>)}</tbody></table>
		<span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
	</div>
}

render(<App />, document.getElementById('main'))
