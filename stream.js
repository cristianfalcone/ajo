import { h as hyperscript, render } from 'ajo'
import { html } from 'ajo/html'

export const stream = async function* (h, root = '') {

	const ids = new Map([[root, 0]])
	const tasks = new Set
	const patches = []

	const alloc = (parent = root) => {

		ids.set(parent, (ids.get(parent) ?? 0) + 1)

		return parent ? `${parent}:${ids.get(parent) - 1}` : String(ids.get(parent) - 1)
	}

	const placeholder = (id, children) => ({ nodeName: 'div', 'data-ssr': id, children })

	const push = patch => {

		const task = Promise.resolve(`<script>window.$stream?.push(${JSON.stringify(patch)})</script>`)

		tasks.add(task)

		task.then(script => patches.push(script)).finally(() => tasks.delete(task))
	}

	for (const chunk of html(h, { alloc, placeholder, push })) yield chunk

	while (tasks.size || patches.length) {

		while (patches.length) yield patches.shift()

		if (tasks.size) await Promise.race(tasks)
	}
}

const pending = new Set

export async function hydrate({ id, src, h }) {

	const el = document.querySelector(`[data-ssr="${id}"]`)

	if (!el) return pending.add({ id, src, h })

	if (src) render(hyperscript((await import(src)).default, h), el)

	else render(h, el)

	const prefix = id + ':'

	for (const patch of pending) if (patch.id.startsWith(prefix)) {

		pending.delete(patch)

		hydrate(patch)
	}
}
