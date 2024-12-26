import { describe, expect, it } from '@jest/globals'
import { ClassicPreset, NodeEditor } from 'rete'

import { Dataflow } from '../src/dataflow'
import { ClassicScheme } from '../src/types'

describe('Dataflow', () => {
  let editor!: NodeEditor<ClassicScheme>
  let dataflow: Dataflow<ClassicScheme>

  beforeEach(() => {
    editor = new NodeEditor<ClassicScheme>()
    dataflow = new Dataflow(editor)
  })

  it('adds a node to the dataflow', () => {
    const node = new ClassicPreset.Node('label')

    dataflow.add(node, {
      inputs: () => [],
      outputs: () => [],
      data: () => Promise.resolve({})
    })

    expect(dataflow.setups.has(node.id)).toBe(true)
  })

  it('throws error when adding a node that is already processed', () => {
    const node = new ClassicPreset.Node('label')
    const setup = {
      inputs: () => [],
      outputs: () => [],
      data: () => Promise.resolve({})
    }

    dataflow.add(node, setup)

    expect(() => dataflow.add(node, setup)).toThrow('already processed')
  })

  it('removes a node from the dataflow', () => {
    const node = new ClassicPreset.Node('label')

    dataflow.add(node, {
      inputs: () => [],
      outputs: () => [],
      data: () => Promise.resolve({})
    })
    dataflow.remove(node.id)

    expect(dataflow.setups.has(node.id)).toBe(false)
  })

  it('fetchs inputs of a node', async () => {
    const data = 'my data'
    const node1 = new ClassicPreset.Node('label1')
    const node2 = new ClassicPreset.Node('label2')

    node1.addOutput('out', new ClassicPreset.Output(new ClassicPreset.Socket('output')))
    node2.addInput('in', new ClassicPreset.Input(new ClassicPreset.Socket('input')))

    dataflow.add(node1, {
      inputs: () => [],
      outputs: () => ['out'],
      data: () => Promise.resolve({ out: data })
    })
    dataflow.add(node2, {
      inputs: () => ['in'],
      outputs: () => [],
      data: async fetchInputs => {
        const inputs = await fetchInputs()

        return { in: inputs.in }
      }
    })

    await editor.addConnection(new ClassicPreset.Connection(node1, 'out', node2, 'in'))

    const inputs = await dataflow.fetchInputs(node2.id)

    expect(inputs).toEqual({ in: [data] })
  })

  it('fetchs outputs of a node', async () => {
    const node = new ClassicPreset.Node('label')

    node.addOutput('out', new ClassicPreset.Output(new ClassicPreset.Socket('output')))

    dataflow.add(node, {
      inputs: () => [],
      outputs: () => ['out'],
      data: () => ({ out: 'data' })
    })

    const outputs = await dataflow.fetch(node.id)

    expect(outputs).toEqual({ out: 'data' })
  })

  it('throws error if node is not initialized when fetching inputs', async () => {
    await expect(dataflow.fetchInputs('1')).rejects.toThrow('node is not initialized')
  })

  it('throws error if node is not initialized when fetching outputs', async () => {
    await expect(dataflow.fetch('1')).rejects.toThrow('node is not initialized')
  })

  it('throws error if data function does not return all required outputs', async () => {
    const node = new ClassicPreset.Node('label')

    node.addOutput('out', new ClassicPreset.Output(new ClassicPreset.Socket('output')))

    dataflow.add(node, {
      inputs: () => [],
      outputs: () => ['out'],
      data: () => ({})
    })

    await expect(dataflow.fetch(node.id)).rejects.toThrow(Error)
  })
})
