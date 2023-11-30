let queue, queued

export const schedule = el => {

	if (!(el instanceof HTMLElement && typeof el?.next === 'function')) {
		
		throw new TypeError('el must be a web component with a next method')
	}

	queue ??= new Set

	if (queue.has(el)) queue.delete(el)

	for (const n of queue) {

		if (n.contains(el)) return cancel(el)

		if (el.contains(n)) queue.delete(n)
	}

	queue.add(el)

	return cancel(el)
}

const cancel = el => {

	queued ??= requestAnimationFrame(run)

	return () => queue.delete(el)
}

const run = () => {

	for (const el of queue) if (el.isConnected) el.next()

	queue.clear()

	queued = null
}
