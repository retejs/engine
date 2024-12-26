import { describe, expect, it, jest } from '@jest/globals'
import { ClassicPreset, NodeEditor } from 'rete'

import { DataflowEngine, DataflowEngineScheme, DataflowNode } from '../src/dataflow-engine'

class Node extends ClassicPreset.Node implements DataflowNode {
  constructor(public label: string, private produces: string) {
    super(label)

    this.addInput('input', new ClassicPreset.Input(new ClassicPreset.Socket('input')))
    this.addOutput('output', new ClassicPreset.Output(new ClassicPreset.Socket('output')))
  }

  data(): { output: string } {
    return {
      output: this.produces
    }
  }
}

class Connection<N extends Node> extends ClassicPreset.Connection<N, N> {
  constructor(public node1: N, public output: string, public node2: N, public input: string) {
    super(node1, output, node2, input)
  }
}

describe('ControlFlow', () => {
  let editor!: NodeEditor<DataflowEngineScheme>
  let dataflow: DataflowEngine<DataflowEngineScheme>

  beforeEach(() => {
    editor = new NodeEditor<DataflowEngineScheme>()
    dataflow = new DataflowEngine()

    editor.use(dataflow)
  })

  it('collects input data from the predecessor nodes', async () => {
    const node1 = new Node('label1', 'data1')
    const node2 = new Node('label2', 'data2')
    const node3 = new Node('label3', 'data3')

    await editor.addNode(node1)
    await editor.addNode(node2)
    await editor.addNode(node3)

    await editor.addConnection(new Connection(node1, 'output', node3, 'input'))
    await editor.addConnection(new Connection(node2, 'output', node3, 'input'))

    const spy1 = jest.spyOn(node1, 'data')
    const spy2 = jest.spyOn(node2, 'data')
    const spy3 = jest.spyOn(node3, 'data')

    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).not.toHaveBeenCalled()
    expect(spy3).not.toHaveBeenCalled()

    await dataflow.fetchInputs(node3.id)

    expect(spy1).toHaveBeenCalled()
    expect(spy2).toHaveBeenCalled()
    expect(spy3).not.toHaveBeenCalled()

    expect(spy1).toHaveReturnedWith({ output: 'data1' })
    expect(spy2).toHaveReturnedWith({ output: 'data2' })
  })

  it('fetches data from the leaf node', async () => {
    const node1 = new Node('label1', 'data1')
    const node2 = new Node('label2', 'data2')
    const node3 = new Node('label3', 'data3')

    await editor.addNode(node1)
    await editor.addNode(node2)
    await editor.addNode(node3)

    await editor.addConnection(new Connection(node1, 'output', node3, 'input'))
    await editor.addConnection(new Connection(node2, 'output', node3, 'input'))

    const spy1 = jest.spyOn(node1, 'data')
    const spy2 = jest.spyOn(node2, 'data')
    const spy3 = jest.spyOn(node3, 'data')

    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).not.toHaveBeenCalled()
    expect(spy3).not.toHaveBeenCalled()

    await dataflow.fetch(node3.id)

    expect(spy1).toHaveBeenCalled()
    expect(spy2).toHaveBeenCalled()
    expect(spy3).toHaveBeenCalled()

    expect(spy1).toHaveReturnedWith({ output: 'data1' })
    expect(spy2).toHaveReturnedWith({ output: 'data2' })
    expect(spy3).toHaveReturnedWith({ output: 'data3' })
  })

  it('caches the data', async () => {
    const node = new Node('label', 'data')

    await editor.addNode(node)

    const spy = jest.spyOn(node, 'data')

    expect(spy).not.toHaveBeenCalled()

    await dataflow.fetch(node.id)

    expect(spy).toHaveBeenCalledTimes(1)

    await dataflow.fetch(node.id)

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('clears the cache', async () => {
    const node = new Node('label', 'data')

    await editor.addNode(node)

    const spy = jest.spyOn(node, 'data')

    expect(spy).not.toHaveBeenCalled()

    await dataflow.fetch(node.id)

    expect(spy).toHaveBeenCalledTimes(1)

    dataflow.reset(node.id)
    await dataflow.fetch(node.id)

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('resets the cache of the node and all its successors', async () => {
    const node1 = new Node('label1', 'data1')
    const node2 = new Node('label2', 'data2')
    const node3 = new Node('label3', 'data3')

    await editor.addNode(node1)
    await editor.addNode(node2)
    await editor.addNode(node3)

    await editor.addConnection(new Connection(node1, 'output', node2, 'input'))
    await editor.addConnection(new Connection(node2, 'output', node3, 'input'))

    const spy1 = jest.spyOn(node1, 'data')
    const spy3 = jest.spyOn(node3, 'data')

    expect(spy1).not.toHaveBeenCalled()
    expect(spy3).not.toHaveBeenCalled()

    await dataflow.fetch(node3.id)

    expect(spy1).toHaveBeenCalled()
    expect(spy3).toHaveBeenCalledTimes(1)

    await dataflow.fetch(node3.id)

    expect(spy1).toHaveBeenCalledTimes(1)
    expect(spy3).toHaveBeenCalledTimes(1)

    dataflow.reset(node2.id)
    await dataflow.fetch(node3.id)

    expect(spy1).toHaveBeenCalledTimes(1)
    expect(spy3).toHaveBeenCalledTimes(2)
  })
})
