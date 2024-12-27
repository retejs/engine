import { describe, it } from '@jest/globals'
import { expectType } from 'jest-tsd'
import { ClassicPreset, NodeEditor } from 'rete'

import { Dataflow } from '../src/dataflow'
import { DataflowEngine, DataflowEngineScheme, DataflowNode } from '../src/dataflow-engine'
import { ClassicScheme } from '../src/types'

describe('Dataflow types', () => {
  let editor!: NodeEditor<ClassicScheme>
  let dataflow: Dataflow<ClassicScheme>

  beforeEach(() => {
    editor = new NodeEditor<ClassicScheme>()
    dataflow = new Dataflow(editor)
  })

  it('returns default Record type for node data', () => {
    const node = new ClassicPreset.Node('label')

    expectType<Promise<Record<string, any>>>(dataflow.fetch(node.id))
  })

  it('returns default Record type for node inputs', () => {
    const node = new ClassicPreset.Node('label')

    expectType<Promise<Record<string, any>>>(dataflow.fetchInputs(node.id))
  })

  it('accepts fetch data type as generic parameter', () => {
    const node = new ClassicPreset.Node('label')

    expectType<Promise<{ a: string }>>(dataflow.fetch<{ a: string }>(node.id))
  })

  it('accepts inputs data type as generic parameter', () => {
    const node = new ClassicPreset.Node('label')

    expectType<Promise<{ a?: string[] }>>(dataflow.fetchInputs<{ a: string[] }>(node.id))
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
  let editor!: NodeEditor<DataflowEngineScheme>
  let dataflow: DataflowEngine<DataflowEngineScheme>

  beforeEach(() => {
    editor = new NodeEditor<DataflowEngineScheme>()
    dataflow = new DataflowEngine()

    editor.use(dataflow)
  })

  it('returns default Record type for node data', async () => {
    const node1 = new Node('label1')

    const data = await dataflow.fetch(node1.id)

    expectType<Record<string, any>>(data)
  })

  it('returns default Record type fetch inputs', async () => {
    const node1 = new Node('label1')

    const data = await dataflow.fetchInputs(node1.id)

    expectType<Record<string, any>>(data)
  })

  it('returns custom type for node instance', async () => {
    const node1 = new Node('label1')

    const data = await dataflow.fetch(node1)

    expectType<{ a: string, b: string }>(data)
  })

  it('returns custom type for genetic parameter', async () => {
    const node1 = new Node('label1')

    const data = await dataflow.fetch<Node>(node1)

    expectType<{ a: string, b: string }>(data)
  })

  it('returns custom type for fetch inputs', async () => {
    const node1 = new Node('label1')

    const data = await dataflow.fetchInputs(node1)

    expectType<{ a?: number[], b?: boolean[] }>(data)
  })

  it('returns custom type for fetch inputs generic parameter', async () => {
    const node1 = new Node('label1')

    const data = await dataflow.fetchInputs<Node>(node1)

    expectType<{ a?: number[], b?: boolean[] }>(data)
  })
})
