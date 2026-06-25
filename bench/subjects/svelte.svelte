<script>
	import { build } from './data.js'

	let selected, data = []

	const run = () => (data = build(1000), selected = null)
	const runlots = () => (data = build(10000), selected = null)
	const add = () => data = data.concat(build(1000))
	const update = () => {
		for (let i = 0; i < data.length; i += 10) data[i].label += ' !!!'
		data = data
	}
	const clear = () => (data = [], selected = null)
	const swaprows = () => {
		if (data.length > 998) [data[1], data[998]] = [data[998], data[1]]
		data = data
	}
	const remove = row => {
		data.splice(data.indexOf(row), 1)
		data = data
	}
</script>

<div class="container">
	<div class="jumbotron"><div class="row">
		<div class="col-md-6"><h1>Svelte</h1></div>
		<div class="col-md-6"><div class="row">
			<div class="col-sm-6 smallpad"><button id="run" class="btn btn-primary btn-block" type="button" onclick={run}>Create 1,000 rows</button></div>
			<div class="col-sm-6 smallpad"><button id="runlots" class="btn btn-primary btn-block" type="button" onclick={runlots}>Create 10,000 rows</button></div>
			<div class="col-sm-6 smallpad"><button id="add" class="btn btn-primary btn-block" type="button" onclick={add}>Append 1,000 rows</button></div>
			<div class="col-sm-6 smallpad"><button id="update" class="btn btn-primary btn-block" type="button" onclick={update}>Update every 10th row</button></div>
			<div class="col-sm-6 smallpad"><button id="clear" class="btn btn-primary btn-block" type="button" onclick={clear}>Clear</button></div>
			<div class="col-sm-6 smallpad"><button id="swaprows" class="btn btn-primary btn-block" type="button" onclick={swaprows}>Swap Rows</button></div>
		</div></div>
	</div></div>
	<table class="table table-hover table-striped test-data"><tbody>
		{#each data as row (row.id)}
			<tr class={row == selected ? 'danger' : ''}>
				<td class="col-md-1">{row.id}</td>
				<td class="col-md-4"><a onclick={() => selected = row}>{row.label}</a></td>
				<td class="col-md-1"><a onclick={() => remove(row)}><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></td>
				<td class="col-md-6"></td>
			</tr>
		{/each}
	</tbody></table>
	<span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
</div>
