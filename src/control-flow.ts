import { NodeEditor, NodeId } from 'rete'

import { ClassicScheme } from './types'

export type ControlFlowNodeSetup<T extends ClassicScheme['Node'], I extends (keyof T['inputs'])[] = string[], O extends (keyof T['outputs'])[] = string[]> = {
  inputs: () => I
  outputs: () => O
  execute(input: I[number], forward: (output: O[number]) => any): any
}

export class ControlFlow<Schemes extends ClassicScheme> {
  setups = new Map<NodeId, ControlFlowNodeSetup<any, any, any>>()

  constructor(private editor: NodeEditor<Schemes>) { }

  public add<T extends Schemes['Node']>(node: T, setup: ControlFlowNodeSetup<T, (keyof T['inputs'])[], (keyof T['outputs'])[]>) {
    const affected = this.setups.get(node.id)

    if (affected) {
      throw new Error('already processed')
    }
    this.setups.set(node.id, setup)
  }

  public remove(nodeId: NodeId) {
    this.setups.delete(nodeId)
  }

  public execute(nodeId: NodeId, input?: string) {
    const setup = this.setups.get(nodeId)

    if (!setup) throw new Error('node is not initialized')
    const inputKeys = setup.inputs()

    if (input && !inputKeys.includes(input)) throw new Error('inputs don\'t have a key')

    setup.execute(input, (output) => {
      const outputKeys = setup.outputs()

      if (!outputKeys.includes(output)) throw new Error('outputs don\'t have a key')

      const cons = this.editor.getConnections().filter(c => {
        return c.source === nodeId && c.sourceOutput === output
      })

      cons.forEach(con => {
        this.execute(con.target, con.targetInput)
      })
    })
  }
}
