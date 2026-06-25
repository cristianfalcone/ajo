import { render } from 'inferno'
import { createElement } from 'inferno-create-element'
import { build } from './data.js'

let selected, data = []

const main = document.getElementById('main')
const draw = () => render(<App />, main)
const run = () => (data = build(1000), selected = null, draw())
const runlots = () => (data = build(10000), selected = null, draw())
const add = () => (data = data.concat(build(1000)), draw())
const update = () => {
	for (let i = 0; i < data.length; i += 10) data[i].label += ' !!!'
	draw()
}
const clear = () => (data = [], selected = null, draw())
const swaprows = () => {
	if (data.length > 998) [data[1], data[998]] = [data[998], data[1]]
	draw()
}
const remove = row => (data.splice(data.indexOf(row), 1), draw())
const Button = (id, text, onClick) => <div className="col-sm-6 smallpad">
	<button id={id} className="btn btn-primary btn-block" type="button" onClick={onClick}>{text}</button>
</div>
const Row = row => <tr key={row.id} className={row == selected ? 'danger' : null}>
	<td className="col-md-1">{row.id}</td>
	<td className="col-md-4"><a onClick={() => (selected = row, draw())}>{row.label}</a></td>
	<td className="col-md-1"><a onClick={() => remove(row)}><span className="glyphicon glyphicon-remove" aria-hidden="true" /></a></td>
	<td className="col-md-6" />
</tr>
const App = () => <div className="container">
	<div className="jumbotron"><div className="row">
		<div className="col-md-6"><h1>Inferno</h1></div>
		<div className="col-md-6"><div className="row">
			{Button('run', 'Create 1,000 rows', run)}
			{Button('runlots', 'Create 10,000 rows', runlots)}
			{Button('add', 'Append 1,000 rows', add)}
			{Button('update', 'Update every 10th row', update)}
			{Button('clear', 'Clear', clear)}
			{Button('swaprows', 'Swap Rows', swaprows)}
		</div></div>
	</div></div>
	<table className="table table-hover table-striped test-data"><tbody>{data.map(Row)}</tbody></table>
	<span className="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
</div>

draw()
