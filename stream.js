import { render } from 'ajo'
import { html } from 'ajo/html'

export const stream = async function* (h) {

	const tasks = new Set(), patches = [], counters = new Map()

	const alloc = (parent = '') => {

		if (!counters.has(parent)) counters.set(parent, 0)

		const id = counters.get(parent)

		counters.set(parent, id + 1)

		return parent ? `${parent}:${id}` : String(id)
	}

	const push = patch => {

		const task = Promise.resolve(`<script>window.$stream?.push(${JSON.stringify(patch)})</script>`)

		tasks.add(task)

		task.then(script => patches.push(script)).finally(() => tasks.delete(task))
	}

	for (h of html(h, alloc, push)) yield h

	while (tasks.size) {

		await Promise.race(tasks)

		while (patches.length) yield patches.shift()
	}

	while (patches.length) yield patches.shift()
}

export const hydrate = async ({ id, h, src }) => {

  const el = document.querySelector(`[data-ssr="${id}"]`)

  if (!el) return

  render(h, el)

	if (src) render((await import(src)).default(), el)
}
