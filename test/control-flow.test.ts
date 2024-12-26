import { describe, expect, it } from '@jest/globals'
import { ClassicPreset, NodeEditor } from 'rete'

import { ControlFlow } from '../src/control-flow'
import { ClassicScheme } from '../src/types'

describe('ControlFlow', () => {
  let editor!: NodeEditor<ClassicScheme>
  let controlFlow: ControlFlow<ClassicScheme>

  beforeEach(() => {
    editor = new NodeEditor<ClassicScheme>()
    controlFlow = new ControlFlow(editor)
  })

  it('adds a node to the control flow', () => {
    const node = new ClassicPreset.Node('label')

    controlFlow.add(node, {
      inputs: () => [],
      outputs: () => [],
      execute: () => null
    })

    expect(controlFlow.setups.has(node.id)).toBe(true)
  })

  it('removes a node from the control flow', () => {
    const node = new ClassicPreset.Node('label')

    controlFlow.add(node, {
      inputs: () => [],
      outputs: () => [],
      execute: () => null
    })

    controlFlow.remove(node.id)

    expect(controlFlow.setups.has(node.id)).toBe(false)
  })

  it('executes a node', () => {
    const node = new ClassicPreset.Node('label')
    const fn1 = jest.fn()

    controlFlow.add(node, {
      inputs: () => [],
      outputs: () => [],
      execute: fn1
    })

    expect(fn1).not.toHaveBeenCalled()
    controlFlow.execute(node.id)
    expect(fn1).toHaveBeenCalled()
  })

  it('executes sequence of nodes', async () => {
    const node1 = new ClassicPreset.Node('label')
    const node2 = new ClassicPreset.Node('label')

    node1.addOutput('out', new ClassicPreset.Output(new ClassicPreset.Socket('number')))
    node2.addInput('in', new ClassicPreset.Input(new ClassicPreset.Socket('number')))

    await editor.addConnection(new ClassicPreset.Connection(node1, 'out', node2, 'in'))

    const fn1 = jest.fn()
    const fn2 = jest.fn()

    controlFlow.add(node1, {
      inputs: () => [],
      outputs: () => ['out'],
      execute: (input, forward) => {
        fn1()
        forward('out')
      }
    })
    controlFlow.add(node2, {
      inputs: () => ['in'],
      outputs: () => [],
      execute: fn2
    })

    expect(fn1).not.toHaveBeenCalled()
    expect(fn2).not.toHaveBeenCalled()
    controlFlow.execute(node1.id)
    expect(fn1).toHaveBeenCalled()
    expect(fn2).toHaveBeenCalled()
  })

  it('throws error when node is not initialized', () => {
    const node = new ClassicPreset.Node('label')

    expect(() => controlFlow.execute(node.id)).toThrowError('node is not initialized')
  })

  it('throws error when trying to add a node more than once', () => {
    const node = new ClassicPreset.Node('label')

    controlFlow.add(node, {
      inputs: () => [],
      outputs: () => [],
      execute: () => null
    })

    expect(() => controlFlow.add(node, {
      inputs: () => [],
      outputs: () => [],
      execute: () => null
    })).toThrowError('already processed')
  })

  it('throws error when trying to remove a node that does not exist', () => {
    const node = new ClassicPreset.Node('label')

    expect(() => controlFlow.remove(node.id)).not.toThrow()
  })

  it('throws error when input is not specified', () => {
    const node = new ClassicPreset.Node('label')

    controlFlow.add(node, {
      inputs: () => [],
      outputs: () => [],
      execute: () => null
    })

    expect(() => controlFlow.execute(node.id, 'input')).toThrowError('inputs don\'t have a key')
  })

  it('throws error when output is not specified', () => {
    const node = new ClassicPreset.Node('label')

    controlFlow.add(node, {
      inputs: () => [],
      outputs: () => [],
      execute: (inputs, forward) => forward('output')
    })

    expect(() => controlFlow.execute(node.id)).toThrowError('outputs don\'t have a key')
  })
})
