import 'backdom/register'
import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { createComponent, createElement, isElement, render, } from './index.js'

let it

// ----------------------------------------------------------------------------

it = suite('createElement')

it('should create empty vnode', () => {
  const vnode = createElement('div')
  assert.ok(isElement(vnode))
  assert.equal(vnode, {})
})

it('should create vnode with props', () => {
  assert.equal(createElement('div', { id: 'app' }), { id: 'app' })
})

it('should create vnode with one string child', () => {
  assert.equal(createElement('div', null, 'foo'), { children: 'foo' })
})

it('should create vnode with one vnode child', () => {
  const child = createElement('span')
  const vnode = createElement('div', null, child)
  assert.ok(isElement(vnode.children))
})

it('should allow children as prop', () => {
  const child = createElement('span')
  const vnode = createElement('div', { children: child })
  assert.ok(isElement(vnode.children))
})

it.run()

// ----------------------------------------------------------------------------

it = suite('render')

it('should render a vnode', () => {
  const host = document.createElement('div')
  render(createElement('div', { foo: 'bar' }, 'foobar'), host)
  assert.snapshot(host.innerHTML, '<div foo="bar">foobar</div>')
})

it('should render a stateless component', () => {
  const host = document.createElement('div')
  const Foo = ({ foo, children }) => createElement('div', { foo }, children)
  debugger
  render(createElement(Foo, { foo: 'bar' }, createElement('span', null, 'foobar')), host)
  assert.snapshot(host.innerHTML, '<div foo="bar"><span>foobar</span></div>')
})

it('should render a stateful component', () => {
  const host = document.createElement('div')
  const Foo = createComponent(({ foo, children }) => createElement('div', { foo }, children))
  render(createElement(Foo, { is: 'foo-component', foo: 'bar' }, createElement('span', null, 'foobar')), host)
  assert.snapshot(host.innerHTML, '<foo-component><div foo="bar"><span>foobar</span></div></foo-component>')
})

it.run()
