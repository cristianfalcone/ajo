import 'backdom/register'
import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { component, h, render } from './index.js'

let it

// ----------------------------------------------------------------------------

it = suite('h')

it('should create empty vnode', () => {
  const vnode = h('div')
  assert.equal(vnode, { tagName: 'div', children: null })
})

it('should create vnode with props', () => {
  assert.equal(h('div', { id: 'app' }), { tagName: 'div', children: null, id: 'app' })
})

it('should create vnode with one string child', () => {
  assert.equal(h('div', null, 'foo'), { tagName: 'div', children: 'foo' })
})

it('should create vnode with one vnode child', () => {
  const child = h('span')
  const vnode = h('div', null, child)
  assert.equal(vnode.children, { tagName: 'span', children: null })
})

it('should allow children as prop', () => {
  const child = h('span')
  const vnode = h('div', { children: child })
  assert.equal(vnode.children, { tagName: 'span', children: null })
})

it.run()

// ----------------------------------------------------------------------------

it = suite('render')

it('should render a vnode', () => {
  const host = document.createElement('div')
  render(h('div', { foo: 'bar' }, 'foobar'), host)
  assert.snapshot(host.innerHTML, '<div foo="bar">foobar</div>')
})

it('should render a stateless component', () => {
  const host = document.createElement('div')
  const Foo = ({ foo, children }) => h('div', { foo }, children)
  render(h(Foo, { foo: 'bar' }, h('span', null, 'foobar')), host)
  assert.snapshot(host.innerHTML, '<div foo="bar"><span>foobar</span></div>')
})

it('should render a stateful component', () => {
  const host = document.createElement('div')
  const Foo = component(() => ({ foo, children }) => h('div', { foo }, children))
  render(h(Foo, { is: 'foo-component', foo: 'bar' }, h('span', null, 'foobar')), host)
  assert.snapshot(host.innerHTML, '<foo-component><div foo="bar"><span>foobar</span></div></foo-component>')
})

it.run()
