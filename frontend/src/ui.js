// ui.js
// Canvas: drag-and-drop pipeline editor
// --------------------------------------------------

import { useRef, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { isValidConnection as isValidConnectionFn } from './graph';
import { InputNode }          from './nodes/inputNode';
import { LLMNode }            from './nodes/llmNode';
import { OutputNode }         from './nodes/outputNode';
import { TextNode }           from './nodes/textNode';
import { DocumentLoaderNode } from './nodes/documentLoaderNode';
import { VectorStoreNode }    from './nodes/vectorStoreNode';
import { PromptTemplateNode } from './nodes/promptTemplateNode';
import { OpenAI_LLMNode }     from './nodes/openaiLlmNode';
import { OutputParserNode }   from './nodes/outputParserNode';

import 'reactflow/dist/style.css';

const gridSize = 20;
const proOptions = { hideAttribution: true };

// Defined outside the component so React Flow never recreates nodeTypes.
const nodeTypes = {
  customInput:    InputNode,
  llm:            LLMNode,
  customOutput:   OutputNode,
  text:           TextNode,
  documentLoader: DocumentLoaderNode,
  vectorStore:    VectorStoreNode,
  promptTemplate: PromptTemplateNode,
  openaiLlm:      OpenAI_LLMNode,
  outputParser:   OutputParserNode,
};

const selector = (state) => ({
  nodes:          state.nodes,
  edges:          state.edges,
  addNodeOfType:  state.addNodeOfType,
  onNodesChange:  state.onNodesChange,
  onEdgesChange:  state.onEdgesChange,
  onConnect:      state.onConnect,
});

// ── Inner canvas component (has access to useReactFlow) ───────────────────────
// Must be rendered INSIDE <ReactFlowProvider> so useReactFlow works.
const FlowCanvas = () => {
  const reactFlowWrapper = useRef(null);
  // screenToFlowPosition replaces the deprecated reactFlowInstance.project()
  const { screenToFlowPosition } = useReactFlow();

  const {
    nodes,
    edges,
    addNodeOfType,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useStore(selector, shallow);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!reactFlowWrapper.current) return;

      const raw = event?.dataTransfer?.getData('application/reactflow');
      if (!raw) return;

      const type = JSON.parse(raw)?.nodeType;
      if (!type) return;

      // screenToFlowPosition handles viewport pan/zoom automatically —
      // no manual bounding-rect subtraction needed.
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNodeOfType(type, position);
    },
    [screenToFlowPosition, addNodeOfType]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const isValidConnection = useCallback(
    (connection) => isValidConnectionFn(edges, connection),
    [edges]
  );

  return (
    <div ref={reactFlowWrapper} className="relative flex-1">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        snapGrid={[gridSize, gridSize]}
        snapToGrid
        connectionLineType="smoothstep"
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background color="#cbd5e1" gap={gridSize} variant="dots" />
        <Controls className="!rounded-xl !border !border-gray-200 !shadow-md" />
        <MiniMap
          className="!rounded-xl !border !border-gray-200 !shadow-md"
          maskColor="rgba(241, 245, 249, 0.75)"
          nodeColor={(node) => {
            // tint minimap nodes by type
            const map = {
              customInput:    '#10b981',
              customOutput:   '#f43f5e',
              llm:            '#8b5cf6',
              openaiLlm:      '#a855f7',
              text:           '#f59e0b',
              documentLoader: '#3b82f6',
              vectorStore:    '#06b6d4',
              promptTemplate: '#f97316',
              outputParser:   '#ec4899',
            };
            return map[node.type] ?? '#94a3b8';
          }}
        />
      </ReactFlow>

      {/* Empty-state overlay — only shown when canvas is blank */}
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white text-2xl shadow-sm">
            ⚡
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">
              Click a node in the palette, or drag it here
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Connect handles to build your pipeline, then hit Submit
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Public export — wraps FlowCanvas in the required provider ─────────────────
export const PipelineUI = () => (
  <ReactFlowProvider>
    <FlowCanvas />
  </ReactFlowProvider>
);
