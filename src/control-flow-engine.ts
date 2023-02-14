import { GetSchemes, NodeEditor, NodeId, Root, Scope } from 'rete'

import { ControlFlow } from './control-flow'
import { ClassicScheme } from './types'

export type ControlFlowEngineScheme = GetSchemes<
    ClassicScheme['Node'] & { execute(input: string, forward: (output: string) => void): void },
    ClassicScheme['Connection']
>

type Configure<Schemes extends ControlFlowEngineScheme> = (node: Schemes['Node']) => ({ inputs: string[], outputs: string[] })

export class ControlFlowEngine<Schemes extends ControlFlowEngineScheme> extends Scope<never, [Root<Schemes>]> {
  editor!: NodeEditor<Schemes>
  controlflow!: ControlFlow<Schemes>

  constructor(private configure?: Configure<Schemes>) {
    super('control-flow-engine')

    this.addPipe(context => {
      if (context.type === 'nodecreated') {
        this.add(context.data)
      }
      if (context.type === 'noderemoved') {
        this.remove(context.data)
      }
      return context
    })
  }

  setParent(scope: Scope<Root<Schemes>>): void {
    super.setParent(scope)

    this.editor = this.parentScope<NodeEditor<Schemes>>(NodeEditor)
    this.controlflow = new ControlFlow(this.editor)
  }

  private add(node: Schemes['Node']) {
    const options = this.configure
      ? this.configure(node)
      : { inputs: Object.keys(node.inputs), outputs: Object.keys(node.outputs) }

    this.controlflow.add(node, {
      inputs: options.inputs,
      outputs: options.outputs,
      execute: (input, forward) => {
        node.execute(String(input), forward)
      }
    })
  }

  private remove(node: Schemes['Node']) {
    this.controlflow.remove(node.id)
  }

  public update(nodeId: NodeId) {
    const node = this.editor.getNode(nodeId)

    if (!node) throw new Error('node')

    this.remove(node)
    this.add(node)
  }

  public execute(nodeId: NodeId, input?: string) {
    this.controlflow.execute(nodeId, input)
  }
}
