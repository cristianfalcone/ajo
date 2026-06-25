export const adjectives = ['pretty', 'large', 'big', 'small', 'tall', 'short', 'long', 'handsome', 'plain', 'quaint', 'clean', 'elegant', 'easy', 'angry', 'crazy', 'helpful', 'mushy', 'odd', 'unsightly', 'adorable', 'important', 'inexpensive', 'cheap', 'expensive', 'fancy']
export const colours = ['red', 'yellow', 'blue', 'green', 'pink', 'brown', 'purple', 'brown', 'white', 'black', 'orange']
export const nouns = ['table', 'chair', 'house', 'bbq', 'desk', 'car', 'pony', 'cookie', 'sandwich', 'burger', 'pizza', 'mouse', 'keyboard']

let id = 1

export const pick = values => values[Math.round(Math.random() * 1000) % values.length]
export const label = () => `${pick(adjectives)} ${pick(colours)} ${pick(nouns)}`
export const build = count => {
	const rows = Array(count)

	for (let i = 0; i < count; i++) rows[i] = { id: id++, label: label() }

	return rows
}
