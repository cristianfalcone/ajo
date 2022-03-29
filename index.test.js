import 'backdom/register.js'
import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { createElement, render, } from './index.js'

let it

// ----------------------------------------------------------------------------

it = suite('createElement')

it('should create empty vnode', () => {
  assert.equal(createElement('div'), {})
})

it('should create vnode with props', () => {
  assert.equal(createElement('div', { id: 'app' }), { id: 'app' })
})

it('should create vnode with one string child', () => {
  assert.equal(createElement('div', null, 'foo'), { children: 'foo' })
})

it('should create vnode with one vnode child', () => {
  assert.equal(createElement('div', null, createElement('span')), { children: {} })
})

it.run()

// ----------------------------------------------------------------------------

it = suite('render')

it('should render a vnode', () => {
  const host = document.createElement('div')
  render(createElement('div', { foo: 'bar' }, 'foobar'), host)
  assert.snapshot(host.innerHTML, '<div foo="bar">foobar</div>')
})

it('should render a component', () => {
  const host = document.createElement('div')
  const Foo = ({ foo, children }) => createElement('div', { foo }, children)
  debugger
  render(createElement(Foo, { foo: 'bar' }, createElement('span', null, 'foobar')), host)
  assert.snapshot(host.innerHTML, '<div foo="bar"><span>foobar</span></div>')
})

it.run()
