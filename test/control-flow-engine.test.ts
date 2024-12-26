import { describe, expect, it, jest } from '@jest/globals'
import { ClassicPreset, NodeEditor } from 'rete'

import { ControlFlowEngine, ControlFlowEngineScheme } from '../src/control-flow-engine'

class Node extends ClassicPreset.Node {
  constructor(public label: string) {
    super(label)

    this.addInput('input', new ClassicPreset.Input(new ClassicPreset.Socket('input')))
    this.addOutput('output', new ClassicPreset.Output(new ClassicPreset.Socket('output')))
  }

  execute(input: string, forward: (output: string) => void): void {
    forward('output')
  }
}

class Connection<N extends Node> extends ClassicPreset.Connection<N, N> {
  constructor(public node1: N, public output: string, public node2: N, public input: string) {
    super(node1, output, node2, input)
  }
}

describe('ControlFlow', () => {
  let editor!: NodeEditor<ControlFlowEngineScheme>
  let controlFlow: ControlFlowEngine<ControlFlowEngineScheme>

  beforeEach(() => {
    editor = new NodeEditor<ControlFlowEngineScheme>()
    controlFlow = new ControlFlowEngine()

    editor.use(controlFlow)
  })

  it('executes sequence of nodes', async () => {
    const node1 = new Node('label1')
    const node2 = new Node('label2')

    await editor.addNode(node1)
    await editor.addNode(node2)

    await editor.addConnection(new Connection(node1, 'output', node2, 'input'))

    const spy1 = jest.spyOn(node1, 'execute')
    const spy2 = jest.spyOn(node2, 'execute')

    controlFlow.execute(node1.id)

    expect(spy1).toHaveBeenCalled()
    expect(spy2).toHaveBeenCalled()
  })
})
