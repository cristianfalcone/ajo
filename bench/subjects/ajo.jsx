import { render } from '../../index.js'
import { build } from './data.js'

const icon = <span class="glyphicon glyphicon-remove" aria-hidden="true" />

const Button = ({ id, onclick, children }) =>
	<div class="col-sm-6 smallpad">
		<button id={id} class="btn btn-primary btn-block" type="button" set:onclick={onclick}>
			{children}
		</button>
	</div>

const Row = (row, selected) =>
	<tr class={row == selected ? 'danger' : null} set:$row={row} memo={[row.label, row == selected]} key={row.id}>
		<td class="col-md-1" memo={row.id}>{row.id}</td>
		<td class="col-md-4"><a>{row.label}</a></td>
		<td class="col-md-1" memo><a>{icon}</a></td>
		<td class="col-md-6" memo />
	</tr>

const App = function* () {

	let selected, data = []

	const run = () => this.next(() => (data = build(1000), selected = null))
	const runlots = () => this.next(() => (data = build(10000), selected = null))
	const add = () => this.next(() => data = data.concat(build(1000)))
	const update = () => this.next(() => { for (let i = 0; i < data.length; i += 10) data[i].label += ' !!!' })
	const clear = () => this.next(() => (data = [], selected = null))
	const swaprows = () => this.next(() => { if (data.length > 998) [data[1], data[998]] = [data[998], data[1]] })

	const click = event => {
		const a = event.target.closest('a')
		const el = a?.closest('tr')
		const row = el?.$row

		if (row) if (a.firstElementChild) {
			this.next(() => data.splice(data.indexOf(row), 1))
		} else {
			this.next(() => {
				selected = row == selected ? null : row
			})
		}
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
			<tbody set:onclick={click}>
				{data.map(row => Row(row, selected))}
			</tbody>
		</table>,
		<span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true" memo />,
	]
}

App.attrs = { class: 'container' }

render(<App />, document.getElementById('main'))
