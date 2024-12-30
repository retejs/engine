import { ClassicPreset, NodeEditor } from 'rete'
import { describe, expect, it } from 'tstyche'

import { Dataflow } from '../src/dataflow'
import { DataflowEngine, DataflowEngineScheme, DataflowNode } from '../src/dataflow-engine'
import { ClassicScheme } from '../src/types'

describe('Dataflow types', () => {
  const editor = new NodeEditor<ClassicScheme>()
  const dataflow = new Dataflow(editor)

  it('returns default Record type for node data', () => {
    const node = new ClassicPreset.Node('label')

    expect(dataflow.fetch(node.id)).type.toBe<Promise<Record<string, any>>>()
  })

  it('returns default Record type for node inputs', () => {
    const node = new ClassicPreset.Node('label')

    expect(dataflow.fetchInputs(node.id)).type.toBe<Promise<Record<string, any>>>()
  })

  it('accepts fetch data type as generic parameter', () => {
    const node = new ClassicPreset.Node('label')

    expect(dataflow.fetch<{ a: string }>(node.id)).type.toBe<Promise<{ a: string }>>()
  })

  it('accepts inputs data type as generic parameter', () => {
    const node = new ClassicPreset.Node('label')

    expect(dataflow.fetchInputs<{ a: string[] }>(node.id)).type.toBe<Promise<{ a?: string[] }>>()
  })
})

class Node extends ClassicPreset.Node implements DataflowNode {
  data(inputs: { a?: number[], b?: boolean[] }) {
    return {
      a: inputs.a?.join('') ?? '',
      b: inputs.b?.join('') ?? ''
    }
  }
}

describe('DataflowEngine types', () => {
  const editor = new NodeEditor<DataflowEngineScheme>()
  const dataflow = new DataflowEngine()

  editor.use(dataflow)

  it('returns default Record type for node data', async () => {
    const node1 = new Node('label1')

    const data = await dataflow.fetch(node1.id)

    expect(data).type.toBe<Record<string, any>>()
  })

  it('returns default Record type fetch inputs', async () => {
    const node1 = new Node('label1')

    const data = await dataflow.fetchInputs(node1.id)

    expect(data).type.toBe<Record<string, any>>()
  })

  it('returns custom type for node instance', async () => {
    const node1 = new Node('label1')

    const data = await dataflow.fetch(node1)

    expect(data).type.toBe<{ a: string, b: string }>()
  })

  it('returns custom type for genetic parameter', async () => {
    const node1 = new Node('label1')

    const data = await dataflow.fetch<Node>(node1)

    expect(data).type.toBe<{ a: string, b: string }>()
  })

  it('returns custom type for fetch inputs', async () => {
    const node1 = new Node('label1')

    const data = await dataflow.fetchInputs(node1)

    expect(data).type.toBe<{ a?: number[], b?: boolean[] }>()
  })

  it('returns custom type for fetch inputs generic parameter', async () => {
    const node1 = new Node('label1')

    const data = await dataflow.fetchInputs<Node>(node1)

    expect(data).type.toBe<{ a?: number[], b?: boolean[] }>()
  })
})
