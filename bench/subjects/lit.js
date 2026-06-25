import { html, render } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import { build } from './data.js'

let selected, data = []

const draw = () => render(view(), document.getElementById('main'))
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
const view = () => html`<div class="container">
	<div class="jumbotron"><div class="row">
		<div class="col-md-6"><h1>Lit</h1></div>
		<div class="col-md-6"><div class="row">
			${button('run', 'Create 1,000 rows', run)}
			${button('runlots', 'Create 10,000 rows', runlots)}
			${button('add', 'Append 1,000 rows', add)}
			${button('update', 'Update every 10th row', update)}
			${button('clear', 'Clear', clear)}
			${button('swaprows', 'Swap Rows', swaprows)}
		</div></div>
	</div></div>
	<table class="table table-hover table-striped test-data"><tbody>${repeat(data, row => row.id, row => html`<tr class=${row == selected ? 'danger' : ''}>
		<td class="col-md-1">${row.id}</td>
		<td class="col-md-4"><a @click=${() => (selected = row, draw())}>${row.label}</a></td>
		<td class="col-md-1"><a @click=${() => remove(row)}><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></td>
		<td class="col-md-6"></td>
	</tr>`)}</tbody></table>
	<span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
</div>`
const button = (id, label, click) => html`<div class="col-sm-6 smallpad"><button id=${id} class="btn btn-primary btn-block" type="button" @click=${click}>${label}</button></div>`

draw()
