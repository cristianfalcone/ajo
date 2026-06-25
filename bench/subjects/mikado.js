import Mikado from 'mikado'
import { build } from './data.js'

document.getElementById('main').innerHTML = `
<div class="container">
	<div class="jumbotron"><div class="row">
		<div class="col-md-6"><h1>Mikado</h1></div>
		<div class="col-md-6"><div class="row">
			<div class="col-sm-6 smallpad"><button id="run" class="btn btn-primary btn-block" type="button">Create 1,000 rows</button></div>
			<div class="col-sm-6 smallpad"><button id="runlots" class="btn btn-primary btn-block" type="button">Create 10,000 rows</button></div>
			<div class="col-sm-6 smallpad"><button id="add" class="btn btn-primary btn-block" type="button">Append 1,000 rows</button></div>
			<div class="col-sm-6 smallpad"><button id="update" class="btn btn-primary btn-block" type="button">Update every 10th row</button></div>
			<div class="col-sm-6 smallpad"><button id="clear" class="btn btn-primary btn-block" type="button">Clear</button></div>
			<div class="col-sm-6 smallpad"><button id="swaprows" class="btn btn-primary btn-block" type="button">Swap Rows</button></div>
		</div></div>
	</div></div>
	<table class="table table-hover table-striped test-data"><tbody id="tbody"></tbody></table>
	<span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
</div>`

const state = { selected: -1 }
const view = new Mikado({
	name: 'row',
	key: 'id',
	cache: true,
	tpl: { tag: 'tr', class: [], child: [
		{ tag: 'td', class: 'col-md-1', text: [] },
		{ tag: 'td', class: 'col-md-4', child: { tag: 'a', event: { click: 'select:root' }, text: [] } },
		{ tag: 'td', class: 'col-md-1', child: { tag: 'a', event: { click: 'remove:root' }, child: { tag: 'span', class: 'glyphicon glyphicon-remove', attr: { 'aria-hidden': 'true' } } } },
		{ tag: 'td', class: 'col-md-6' },
	] },
	fn: [function (data, state, index, p, f, x) {
		let o, v, c
		o = p[0]; x && (x[0] = c = {}); v = state.selected === index ? 'danger' : ''; c && (c._c = v); if (o.c._c !== v) { o.c._c = v; o.n.className = v }
		o = p[1]; x && (x[1] = c = {}); v = data.id; c && (c._t = v); if (o.c._t !== v) { o.c._t = v; o.n.nodeValue = v }
		o = p[2]; x && (x[2] = c = {}); v = data.label; c && (c._t = v); if (o.c._t !== v) { o.c._t = v; o.n.nodeValue = v }
	}],
}, { mount: document.getElementById('tbody'), state })
let data = []

const draw = () => view.render(data, state)
const run = () => (data = build(1000), state.selected = -1, draw())
const runlots = () => (data = build(10000), state.selected = -1, draw())
const add = () => {
	const rows = build(1000)
	data = data.concat(rows)
	view.append(rows, state)
}
const update = () => {
	for (let i = 0; i < data.length; i += 10) {
		data[i].label += ' !!!'
		view.update(i, data[i], state)
	}
}
const clear = () => (data = [], state.selected = -1, view.clear())
const swaprows = () => {
	if (data.length > 998) {
		[data[1], data[998]] = [data[998], data[1]]
		draw()
	}
}

for (const [id, fn] of Object.entries({ run, runlots, add, update, clear, swaprows })) document.getElementById(id).onclick = fn
Mikado.route('remove', target => {
	const index = view.index(target)
	data.splice(index, 1)
	view.remove(target)
})
Mikado.route('select', target => {
	const current = state.selected
	state.selected = view.index(target)
	if (current > -1) view.update(current, data[current], state)
	view.update(state.selected, data[state.selected], state)
})
