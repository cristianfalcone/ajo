import { render } from '../../index.js'
import { build } from './data.js'

const Keyed = Symbol.for('ajo.keyed')
const icon = <span class="glyphicon glyphicon-remove" aria-hidden="true" />

const Button = ({ id, onclick, children }) =>
	<div class="col-sm-6 smallpad">
		<button id={id} class="btn btn-primary btn-block" type="button" set:onclick={onclick}>{children}</button>
	</div>

const Row = (row, selected) =>
	<tr key={row.id} class={row == selected ? 'danger' : null} set:$row={row} memo={[row.label, row == selected]}>
		<td class="col-md-1" memo={row.id}>{row.id}</td>
		<td class="col-md-4"><a>{row.label}</a></td>
		<td class="col-md-1" memo><a>{icon}</a></td>
		<td class="col-md-6" memo />
	</tr>

const App = function* () {

	let selected, tbody, data = []

	const remove = row => {
		const index = data.indexOf(row)
		if (index > -1) data.splice(index, 1)
	}

	const run = () => (data = build(1000), selected = null, draw())
	const runlots = () => (data = build(10000), selected = null, draw())
	const add = () => { const items = build(1000); data = data.concat(items); render(rows(items), tbody, null) }
	const update = () => { for (let i = 0; i < data.length; i += 10) { const row = data[i], el = tbody[Keyed].get(row.id); row.label += ' !!!'; render(Row(row, selected), tbody, el, el.nextSibling) } }
	const clear = () => (data = [], selected = null, render(null, tbody))
	const swaprows = () => this.next(() => { if (data.length > 998) [data[1], data[998]] = [data[998], data[1]] })
	const draw = () => (render(null, tbody), render(rows(), tbody))
	const rows = function* (items = data) { for (const row of items) yield Row(row, selected) }

	const click = event => {
		const a = event.target.closest('a')
		const row = a?.closest('tr')?.$row
		if (row) this.next(() => a.firstElementChild ? remove(row) : selected = row)
	}

	while (true) yield [
		<div class="jumbotron" memo>
			<div class="row">
				<div class="col-md-6">
					<h1>Ajo</h1>
				</div>
				<div class="col-md-6">
					<div class="row">
						<Button id="run" onclick={run}>Create 1,000 rows</Button>
						<Button id="runlots" onclick={runlots}>Create 10,000 rows</Button>
						<Button id="add" onclick={add}>Append 1,000 rows</Button>
						<Button id="update" onclick={update}>Update every 10th row</Button>
						<Button id="clear" onclick={clear}>Clear</Button>
						<Button id="swaprows" onclick={swaprows}>Swap Rows</Button>
					</div>
				</div>
			</div>
		</div>,
		<table class="table table-hover table-striped test-data">
			<tbody ref={el => tbody = el} set:onclick={click}>
				{rows()}
			</tbody>
		</table>,
		<span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true" memo />,
	]
}

App.attrs = { class: 'container' }

render(<App />, document.getElementById('main'))
