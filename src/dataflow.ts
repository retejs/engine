import { NodeEditor, NodeId } from 'rete'

import { ClassicScheme } from './types'

export type DataflowNodeSetup<
  T extends ClassicScheme['Node'],
  I extends {[key in keyof T['inputs']]: any},
  O extends {[key in keyof T['outputs']]: any}
> = {
  inputs: () => (keyof I)[]
  outputs: () => (keyof O)[]
  data(fetchInputs: () => Promise<{[key in keyof I]: I[key][]}>): Promise<O> | O
}

export class Dataflow<Schemes extends ClassicScheme> {
  setups = new Map<NodeId, DataflowNodeSetup<any, any, any>>()

  constructor(private editor: NodeEditor<Schemes>) { }

  public add<T extends Schemes['Node']>(node: T, setup: DataflowNodeSetup<T, any, any>) {
    const affected = this.setups.get(node.id)

    if (affected) {
      throw new Error('already processed')
    }
    this.setups.set(node.id, setup)
  }

  public remove(nodeId: NodeId) {
    this.setups.delete(nodeId)
  }

  public async fetchInputs(nodeId: NodeId) {
    const result = this.setups.get(nodeId)

    if (!result) throw new Error('node is not initialized')

    const inputKeys = result.inputs()

    const cons = this.editor.getConnections().filter(c => {
      return c.target === nodeId && inputKeys.includes(c.targetInput)
    })

    const inputs: Record<string, any> = {}
    const consWithSourceData = await Promise.all(cons.map(async c => {
      return {
        c,
        sourceData: await this.fetch(c.source)
      }
    }))

    for (const { c, sourceData } of consWithSourceData) {
      const previous = inputs[c.targetInput] ? inputs[c.targetInput] : []

      inputs[c.targetInput] = [...previous, sourceData[c.sourceOutput]]
    }

    return inputs
  }

  public async fetch(nodeId: NodeId): Promise<Record<string, any>> {
    const result = this.setups.get(nodeId)

    if (!result) throw new Error('node is not initialized')

    const outputKeys = result.outputs()
    const data = await result.data(() => this.fetchInputs(nodeId))

    const returningKeys = Object.keys(data) as (string | number | symbol)[]

    if (!outputKeys.every(key => returningKeys.includes(key))) {
      throw new Error(`dataflow node "${nodeId}" doesn't return all of required properties. Expected ["${outputKeys.join('", "')}]. Got ["${returningKeys.join('", "')}"]`)
    }

    return data
  }
}
