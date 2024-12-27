/* eslint-disable @typescript-eslint/ban-ts-comment */
import { describe, it } from '@jest/globals'
import { expectType } from 'jest-tsd'
import { ClassicPreset, NodeEditor } from 'rete'

import { DataflowEngine, DataflowEngineScheme, DataflowNode } from '../src/dataflow-engine'

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

  it('doesnt accept node instance as argument', () => {
    const node1 = new Node('label1')

    // @ts-expect-error
    void dataflow.fetch(node1)
  })

  it('doesnt have generic parameter for node data', () => {
    const node1 = new Node('label1')

    // @ts-expect-error
    void dataflow.fetch<Node>(node1.id)
  })
})
