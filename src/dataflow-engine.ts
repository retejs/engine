import { GetSchemes, NodeEditor, NodeId, Root, Scope } from 'rete'

import { Dataflow } from './dataflow'
import { ClassicScheme } from './types'
import { Cache } from './utils/cache'
import { Cancellable, createCancellblePromise } from './utils/cancellable'

export type DataflowEngineScheme = GetSchemes<
    ClassicScheme['Node'] & { data(inputs: Record<string, any>): Promise<Record<string, any>> | Record<string, any> },
    ClassicScheme['Connection']
>

type Configure<Schemes extends DataflowEngineScheme> = (node: Schemes['Node']) => ({ inputs: string[], outputs: string[] })

export class DataflowEngine<Schemes extends DataflowEngineScheme> extends Scope<never, [Root<Schemes>]> {
    editor!: NodeEditor<Schemes>
    dataflow!: Dataflow<Schemes>
    cache = new Cache<NodeId, Cancellable<Record<string, any>>>(data => data?.cancel && data.cancel())

    constructor(private configure?: Configure<Schemes>) {
        super('dataflow-engine')

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
        this.dataflow = new Dataflow(this.editor)
    }

    private add(node: Schemes['Node']) {
        const options = this.configure
            ? this.configure(node)
            : { inputs: Object.keys(node.inputs), outputs: Object.keys(node.outputs) }

        this.dataflow.add(node, {
            inputs: options.inputs,
            outputs: options.outputs,
            data: async (fetchInputs) => {
                const cache = this.cache.get(node.id)

                if (cache) return cache

                const cancellable = createCancellblePromise(
                    () => fetchInputs(),
                    inputs => node.data(inputs)
                )

                this.cache.add(node.id, cancellable)

                return cancellable
            }
        })
    }

    private remove(node: Schemes['Node']) {
        this.dataflow.remove(node.id)
    }

    public update(nodeId: NodeId) {
        const node = this.editor.getNode(nodeId)

        if (!node) throw new Error('node')

        this.remove(node)
        this.add(node)
    }

    public reset(nodeId?: NodeId) {
        if (nodeId) {
            const setup = this.dataflow.setups.get(nodeId)

            if (!setup) throw 'setup'

            this.cache.delete(nodeId)
            this.editor.getConnections()
                .filter(c => c.source === nodeId && setup.outputs.includes(c.sourceOutput))
                .forEach(c => this.reset(c.target))
        } else {
            this.cache.clear()
        }
    }

    public async fetchInputs(nodeId: NodeId) {
        return this.dataflow.fetchInputs(nodeId)
    }

    public async fetch(nodeId: NodeId) {
        return this.dataflow.fetch(nodeId)
    }
}
