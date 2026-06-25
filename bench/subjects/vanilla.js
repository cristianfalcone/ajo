import { build } from './data.js'

let selected, data = [], tbody

document.getElementById('main').innerHTML = `
<div class="container">
	<div class="jumbotron">
		<div class="row">
			<div class="col-md-6"><h1>Vanilla DOM</h1></div>
			<div class="col-md-6"><div class="row">
				<div class="col-sm-6 smallpad"><button id="run" class="btn btn-primary btn-block" type="button">Create 1,000 rows</button></div>
				<div class="col-sm-6 smallpad"><button id="runlots" class="btn btn-primary btn-block" type="button">Create 10,000 rows</button></div>
				<div class="col-sm-6 smallpad"><button id="add" class="btn btn-primary btn-block" type="button">Append 1,000 rows</button></div>
				<div class="col-sm-6 smallpad"><button id="update" class="btn btn-primary btn-block" type="button">Update every 10th row</button></div>
				<div class="col-sm-6 smallpad"><button id="clear" class="btn btn-primary btn-block" type="button">Clear</button></div>
				<div class="col-sm-6 smallpad"><button id="swaprows" class="btn btn-primary btn-block" type="button">Swap Rows</button></div>
			</div></div>
		</div>
	</div>
	<table class="table table-hover table-striped test-data"><tbody></tbody></table>
	<span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
</div>`

tbody = document.querySelector('tbody')

const row = item => {
	const tr = document.createElement('tr')
	const id = document.createElement('td')
	const label = document.createElement('td')
	const remove = document.createElement('td')
	const tail = document.createElement('td')
	const a = document.createElement('a')
	const x = document.createElement('a')
	const icon = document.createElement('span')

	tr.$row = item
	id.className = 'col-md-1'
	label.className = 'col-md-4'
	remove.className = 'col-md-1'
	tail.className = 'col-md-6'
	icon.className = 'glyphicon glyphicon-remove'
	icon.setAttribute('aria-hidden', 'true')
	id.textContent = item.id
	a.textContent = item.label
	item.labelNode = a
	label.append(a)
	x.append(icon)
	remove.append(x)
	tr.append(id, label, remove, tail)

	return tr
}
const draw = () => {
	const fragment = document.createDocumentFragment()

	tbody.textContent = ''
	for (const item of data) fragment.append(row(item))
	tbody.append(fragment)
}
const run = () => (data = build(1000), selected = null, draw())
const runlots = () => (data = build(10000), selected = null, draw())
const add = () => {
	const fragment = document.createDocumentFragment()
	const rows = build(1000)

	data = data.concat(rows)
	for (const item of rows) fragment.append(row(item))
	tbody.append(fragment)
}
const update = () => {
	for (let i = 0; i < data.length; i += 10) {
		data[i].label += ' !!!'
		data[i].labelNode.textContent = data[i].label
	}
}
const clear = () => (data = [], selected = null, tbody.textContent = '')
const swaprows = () => {
	if (data.length > 998) {
		[data[1], data[998]] = [data[998], data[1]]
		tbody.insertBefore(tbody.children[998], tbody.children[1])
		tbody.insertBefore(tbody.children[2], tbody.children[999])
	}
}

for (const [id, fn] of Object.entries({ run, runlots, add, update, clear, swaprows })) document.getElementById(id).onclick = fn

tbody.onclick = event => {
	const a = event.target.closest('a')
	const tr = a?.closest('tr')
	const item = tr?.$row

	if (!item) return
	if (a.firstElementChild) {
		data.splice(data.indexOf(item), 1)
		tr.remove()
	} else {
		if (selected) selected.className = ''
		selected = tr
		tr.className = 'danger'
	}
}
