// ui.js
// Displays the drag-and-drop UI
// --------------------------------------------------

import { useState, useRef, useCallback } from 'react';
import ReactFlow, { Controls, Background, MiniMap } from 'reactflow';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { isValidConnection as isValidConnectionFn } from './graph';
import { InputNode } from './nodes/inputNode';
import { LLMNode } from './nodes/llmNode';
import { OutputNode } from './nodes/outputNode';
import { TextNode } from './nodes/textNode';
import { DocumentLoaderNode } from './nodes/documentLoaderNode';
import { VectorStoreNode } from './nodes/vectorStoreNode';
import { PromptTemplateNode } from './nodes/promptTemplateNode';
import { OpenAI_LLMNode } from './nodes/openaiLlmNode';
import { OutputParserNode } from './nodes/outputParserNode';

import 'reactflow/dist/style.css';

const gridSize = 20;
const proOptions = { hideAttribution: true };
const nodeTypes = {
  customInput: InputNode,
  llm: LLMNode,
  customOutput: OutputNode,
  text: TextNode,
  documentLoader: DocumentLoaderNode,
  vectorStore: VectorStoreNode,
  promptTemplate: PromptTemplateNode,
  openaiLlm: OpenAI_LLMNode,
  outputParser: OutputParserNode,
};

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  addNodeOfType: state.addNodeOfType,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

export const PipelineUI = () => {
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const {
      nodes,
      edges,
      addNodeOfType,
      onNodesChange,
      onEdgesChange,
      onConnect
    } = useStore(selector, shallow);

    const onDrop = useCallback(
        (event) => {
          event.preventDefault();

          if (!reactFlowInstance || !reactFlowWrapper.current) {
            return;
          }

          const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
          if (event?.dataTransfer?.getData('application/reactflow')) {
            const appData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
            const type = appData?.nodeType;

            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
              return;
            }

            const position = reactFlowInstance.project({
              x: event.clientX - reactFlowBounds.left,
              y: event.clientY - reactFlowBounds.top,
            });

            addNodeOfType(type, position);
          }
        },
        [reactFlowInstance, addNodeOfType]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    // Live connection validation: rejects self-connections, occupied target
    // handles, and any edge that would introduce a cycle (keeps the graph a DAG).
    const isValidConnection = useCallback(
      (connection) => isValidConnectionFn(edges, connection),
      [edges]
    );

    return (
        <>
        <div ref={reactFlowWrapper} className="relative h-[70vh] w-full bg-slate-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                isValidConnection={isValidConnection}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onInit={setReactFlowInstance}
                nodeTypes={nodeTypes}
                proOptions={proOptions}
                snapGrid={[gridSize, gridSize]}
                connectionLineType='smoothstep'
                deleteKeyCode={['Backspace', 'Delete']}
            >
                <Background color="#cbd5e1" gap={gridSize} />
                <Controls className="!rounded-lg !border !border-gray-200 !shadow-sm" />
                <MiniMap
                  className="!rounded-lg !border !border-gray-200 !shadow-sm"
                  maskColor="rgba(241, 245, 249, 0.75)"
                />
            </ReactFlow>
            {nodes.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-sm font-medium text-gray-400">
                  Drag a node from the palette to begin
                </p>
                <p className="mt-1 text-xs text-gray-300">
                  Connect handles to build your pipeline, then hit Submit
                </p>
              </div>
            )}
        </div>
        </>
    )
}
