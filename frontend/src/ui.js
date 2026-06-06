import { useRef, useCallback, useState } from 'react';
import ReactFlow, { Controls, MiniMap, useReactFlow } from 'reactflow';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { toast } from 'sonner';
import { isValidConnection as isValidConnectionFn, getConnectionTypeMismatchMessage } from './graph';
import { ContextMenu } from './contextMenu';

import { InputNode }          from './nodes/inputNode';
import { LLMNode }            from './nodes/llmNode';
import { OutputNode }         from './nodes/outputNode';
import { TextNode }           from './nodes/textNode';
import { DocumentLoaderNode } from './nodes/documentLoaderNode';
import { VectorStoreNode }    from './nodes/vectorStoreNode';
import { PromptTemplateNode } from './nodes/promptTemplateNode';
import { GroqLLMNode }        from './nodes/groqLlmNode';
import { OutputParserNode }   from './nodes/outputParserNode';
import { GroupNode }          from './nodes/groupNode';
import { McpNode }            from './nodes/mcpNode';
import 'reactflow/dist/style.css';

const gridSize   = 20;
const proOptions = { hideAttribution: true };

const nodeTypes = {
  customInput:    InputNode,
  llm:            LLMNode,
  customOutput:   OutputNode,
  text:           TextNode,
  documentLoader: DocumentLoaderNode,
  vectorStore:    VectorStoreNode,
  promptTemplate: PromptTemplateNode,
  groqLlm:        GroqLLMNode,
  openaiLlm:      GroqLLMNode, // backwards-compat
  outputParser:   OutputParserNode,
  mcpConnector:   McpNode,
  groupNode:      GroupNode,
};

const minimapColor = (node) => {
  const map = {
    customInput:    '#818cf8',
    customOutput:   '#34d399',
    llm:            '#c084fc',
    groqLlm:        '#c084fc',
    text:           '#60a5fa',
    documentLoader: '#fbbf24',
    vectorStore:    '#22d3ee',
    promptTemplate: '#a78bfa',
    outputParser:   '#fb7185',
    mcpConnector:   '#64748b',
    groupNode:      '#2a2d33',
  };
  return map[node.type] ?? '#2a2d33';
};

const storeSelector = (state) => ({
  nodes:                state.nodes,
  edges:                state.edges,
  addNodeOfType:        state.addNodeOfType,
  onNodesChange:        state.onNodesChange,
  onEdgesChange:        state.onEdgesChange,
  onConnect:            state.onConnect,
  autoConnectToNewNode: state.autoConnectToNewNode,
});

const FlowCanvas = () => {
  const reactFlowWrapper = useRef(null);
  const { project, viewportInitialized } = useReactFlow();

  const [menu, setMenu] = useState(null);
  const connectingNodeId      = useRef(null);
  const connectingHandleId    = useRef(null);
  const lastMismatchToastRef  = useRef(0);

  const {
    nodes,
    edges,
    addNodeOfType,
    onNodesChange,
    onEdgesChange,
    onConnect,
    autoConnectToNewNode,
  } = useStore(storeSelector, shallow);

  const onPaneContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      if (!viewportInitialized || !reactFlowWrapper.current) return;
      const bounds       = reactFlowWrapper.current.getBoundingClientRect();
      const flowPosition = project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
      setMenu({ type: 'create', mouseX: event.clientX, mouseY: event.clientY, flowPosition });
    },
    [project, viewportInitialized]
  );

  const onPaneClick = useCallback(() => setMenu(null), []);

  const onConnectStart = useCallback((_, { nodeId, handleId }) => {
    connectingNodeId.current   = nodeId;
    connectingHandleId.current = handleId;
  }, []);

  const onConnectEnd = useCallback(
    (event) => {
      const targetIsPane = event.target.classList.contains('react-flow__pane');
      if (targetIsPane && connectingNodeId.current && viewportInitialized && reactFlowWrapper.current) {
        const bounds       = reactFlowWrapper.current.getBoundingClientRect();
        const flowPosition = project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
        setMenu({
          type:          'spawn',
          mouseX:         event.clientX,
          mouseY:         event.clientY,
          flowPosition,
          sourceNodeId:   connectingNodeId.current,
          sourceHandleId: connectingHandleId.current,
        });
      }
      connectingNodeId.current   = null;
      connectingHandleId.current = null;
    },
    [project, viewportInitialized]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!reactFlowWrapper.current || !viewportInitialized) return;
      const type = event.dataTransfer.getData('application/reactflow/type');
      if (!type) return;
      const bounds   = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
      addNodeOfType(type, position);
    },
    [project, viewportInitialized, addNodeOfType]
  );

  const handleAddNode = useCallback(
    (nodeType) => {
      if (!menu) return;
      if (menu.type === 'create') {
        addNodeOfType(nodeType, menu.flowPosition);
      } else if (menu.type === 'spawn') {
        autoConnectToNewNode(menu.sourceNodeId, menu.sourceHandleId, nodeType, menu.flowPosition);
      }
      setMenu(null);
    },
    [menu, addNodeOfType, autoConnectToNewNode]
  );

  const isValidConnection = useCallback(
    (connection) => {
      const valid = isValidConnectionFn(edges, connection);
      if (!valid) {
        const mismatchMsg = getConnectionTypeMismatchMessage(connection);
        if (mismatchMsg) {
          const now = Date.now();
          if (now - lastMismatchToastRef.current > 2500) {
            lastMismatchToastRef.current = now;
            toast.warning(mismatchMsg, {
              description: 'These handle types are incompatible. Check the node docs.',
            });
          }
        }
      }
      return valid;
    },
    [edges]
  );

  return (
    <div
      ref={reactFlowWrapper}
      className="relative flex-1 h-full bg-canvas grid-bg"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={onPaneClick}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        snapGrid={[gridSize, gridSize]}
        snapToGrid
        connectionLineType="smoothstep"
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        style={{ background: 'transparent' }}
      >
        <Controls showInteractive={false} />

        <MiniMap
          maskColor="rgba(9, 9, 11, 0.75)"
          nodeColor={minimapColor}
          nodeStrokeWidth={0}
        />
      </ReactFlow>

      {menu && (
        <ContextMenu
          mouseX={menu.mouseX}
          mouseY={menu.mouseY}
          onAddNode={handleAddNode}
          onClose={() => setMenu(null)}
        />
      )}

      {/* Empty-state hint */}
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.03] text-white/20">
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>bolt</span>
          </div>
          <div>
            <p className="text-[13px] font-medium text-white/30">
              Drag a node from the palette, or right-click to add one
            </p>
            <p className="mt-1 text-[11px] text-white/20">
              Use <kbd className="rounded border border-white/15 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono">Template Library</kbd> in the sidebar to get started
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export const PipelineUI = () => <FlowCanvas />;
