import { create, useStore as _useZustandStore } from "zustand";
import { persist } from "zustand/middleware";
import { temporal } from 'zundo';
import { addEdge, applyNodeChanges, applyEdgeChanges, MarkerType } from 'reactflow';
import { isValidConnection } from './graph';
import { getLayoutedElements } from './autoLayout';

const initialState = {
  nodes: [],
  edges: [],
  nodeIDs: {},
};

const getDefaultTargetHandle = (nodeId, nodeType) => {
  const mapping = {
    customOutput:   `${nodeId}-value`,
    llm:            `${nodeId}-prompt`,
    openaiLlm:      `${nodeId}-prompt`,
    groqLlm:        `${nodeId}-prompt`,
    text:           `${nodeId}-input`,
    vectorStore:    `${nodeId}-documents`,
    promptTemplate: `${nodeId}-variables`,
    outputParser:   `${nodeId}-response`,
    mcpConnector:   `${nodeId}-query`,
  };
  return mapping[nodeType] || null;
};

export const useStore = create(
  temporal(
    persist(
      (set, get) => ({
      ...initialState,

      getNodeID: (type) => {
        const newIDs = { ...get().nodeIDs };
        if (newIDs[type] === undefined) {
          newIDs[type] = 0;
        }
        newIDs[type] += 1;
        set({ nodeIDs: newIDs });
        return `${type}-${newIDs[type]}`;
      },

      addNode: (node) => {
        set({ nodes: [...get().nodes, node] });
      },

      addNodeOfType: (type, position) => {
        const id = get().getNodeID(type);
        const count = get().nodes.length;
        const col = count % 4;
        const row = Math.floor(count / 4);
        const pos = position ?? { x: 60 + col * 280, y: 60 + row * 180 };
        get().addNode({ id, type, position: pos, data: { id, nodeType: type } });
        return id;
      },

      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
      },

      onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
      },

      onConnect: (connection) => {
        if (!isValidConnection(get().edges, connection)) return;

        let strokeColor = '#6366f1';
        let isAnimated = true;
        let strokeDasharray = undefined;
        let strokeWidth = 2;

        const handleId = connection.sourceHandle || '';

        if (handleId.includes('documents')) {
          strokeColor = '#3b82f6';
          strokeWidth = 3;
          strokeDasharray = '5 5';
        } else if (handleId.includes('store')) {
          strokeColor = '#06b6d4';
          strokeWidth = 2.5;
        } else if (handleId.includes('parsed')) {
          strokeColor = '#ec4899';
        } else if (handleId.includes('response')) {
          strokeColor = '#a855f7';
        } else if (handleId.includes('context')) {
          strokeColor = '#64748b';
        }

        set({
          edges: addEdge(
            {
              ...connection,
              type: 'smoothstep',
              animated: isAnimated,
              style: { stroke: strokeColor, strokeWidth, strokeDasharray },
              markerEnd: { type: MarkerType.Arrow, height: '20px', width: '20px', color: strokeColor },
            },
            get().edges
          ),
        });
      },

      applyNodeLayout: () => {
        const { nodes, edges } = get();
        if (nodes.length === 0) return;
        const { layoutedNodes, layoutedEdges } = getLayoutedElements(nodes, edges, 'LR');
        set({ nodes: layoutedNodes, edges: layoutedEdges });
      },

      autoConnectToNewNode: (sourceNodeId, sourceHandleId, newNodeType, position) => {
        const newNodeId = get().addNodeOfType(newNodeType, position);
        const targetHandle = getDefaultTargetHandle(newNodeId, newNodeType);

        if (targetHandle) {
          get().onConnect({
            source: sourceNodeId,
            sourceHandle: sourceHandleId,
            target: newNodeId,
            targetHandle: targetHandle,
          });
        }
      },

      groupSelectedNodes: (groupName = 'Sub-Pipeline') => {
        const { nodes, getNodeID } = get();
        const selectedNodes = nodes.filter(n => n.selected && !n.parentId);

        if (selectedNodes.length < 2) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        selectedNodes.forEach(n => {
          if (n.position.x < minX) minX = n.position.x;
          if (n.position.y < minY) minY = n.position.y;
          if (n.position.x + 280 > maxX) maxX = n.position.x + 280;
          if (n.position.y + 150 > maxY) maxY = n.position.y + 150;
        });

        const padding = 40;
        const groupId = getNodeID('groupNode');

        const groupNode = {
          id: groupId,
          type: 'groupNode',
          position: { x: minX - padding, y: minY - padding - 15 },
          style: { width: maxX - minX + padding * 2, height: maxY - minY + padding * 2 + 15 },
          data: { label: groupName },
          zIndex: -1,
        };

        const updatedNodes = nodes.map(n => {
          if (selectedNodes.find(sn => sn.id === n.id)) {
            return {
              ...n,
              parentId: groupId,
              extent: 'parent',
              position: {
                x: n.position.x - groupNode.position.x,
                y: n.position.y - groupNode.position.y,
              },
            };
          }
          return n;
        });

        // Parent must precede its children in the React Flow nodes array
        set({ nodes: [groupNode, ...updatedNodes] });
      },

      ungroupSelectedNodes: () => {
        const { nodes } = get();
        const selectedGroups = nodes.filter(n => n.selected && n.type === 'groupNode');
        if (selectedGroups.length === 0) return;

        const groupIds = new Set(selectedGroups.map(g => g.id));

        let nextNodes = nodes.filter(n => !groupIds.has(n.id));

        nextNodes = nextNodes.map(n => {
          if (groupIds.has(n.parentId)) {
            const parent = nodes.find(g => g.id === n.parentId);
            return {
              ...n,
              parentId: undefined,
              extent: undefined,
              position: {
                x: n.position.x + parent.position.x,
                y: n.position.y + parent.position.y,
              },
            };
          }
          return n;
        });

        set({ nodes: nextNodes });
      },

      updateNodeField: (nodeId, fieldName, fieldValue) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId ? { ...node, data: { ...node.data, [fieldName]: fieldValue } } : node
          ),
        });
      },

      setTextNodeVariables: (nodeId, variables) => {
        const validHandleIds = new Set(variables.map((v) => `${nodeId}-${v}`));
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId ? { ...node, data: { ...node.data, variables } } : node
          ),
          edges: get().edges.filter(
            (edge) => edge.target !== nodeId || !edge.targetHandle || validHandleIds.has(edge.targetHandle)
          ),
        });
      },

      loadPipeline: (newNodes, newEdges) => {
        const newNodeIDs = {};
        newNodes.forEach((node) => {
          const type = node.type;
          if (!type) return;
          const match = node.id.match(/-(\d+)$/);
          const num = match ? parseInt(match[1], 10) : 0;
          if (!newNodeIDs[type] || num > newNodeIDs[type]) {
            newNodeIDs[type] = num;
          }
        });
        set({ nodes: newNodes, edges: newEdges, nodeIDs: newNodeIDs });
      },

      animateCycleError: (cyclePath) => {
        if (!cyclePath || cyclePath.length === 0) return;

        const { nodes, edges } = get();
        const cycleNodeSet = new Set(cyclePath);

        // Consecutive pairs in the cycle path are the cycle edges
        const cycleEdgeSet = new Set();
        for (let i = 0; i < cyclePath.length - 1; i++) {
          cycleEdgeSet.add(`${cyclePath[i]}→${cyclePath[i + 1]}`);
        }

        const snapshotNodes = nodes.map(n => ({ ...n }));
        const snapshotEdges = edges.map(e => ({ ...e }));

        useStore.temporal.getState().pause();

        const restore = () => {
          set({ nodes: snapshotNodes, edges: snapshotEdges });
          useStore.temporal.getState().resume();
        };

        try {
          set({
            nodes: nodes.map(n => ({
              ...n,
              style: cycleNodeSet.has(n.id)
                ? { ...n.style, opacity: 1, boxShadow: '0 0 20px 4px rgba(239, 68, 68, 0.7)', border: '2px solid #ef4444' }
                : { ...n.style, opacity: 0.2 },
            })),
            edges: edges.map(e => {
              const key = `${e.source}→${e.target}`;
              return cycleEdgeSet.has(key)
                ? { ...e, animated: true, style: { stroke: '#ef4444', strokeWidth: 4, filter: 'drop-shadow(0 0 6px #ef4444)', opacity: 1 } }
                : { ...e, animated: false, style: { stroke: '#e2e8f0', strokeWidth: 1, opacity: 0.1 } };
            }),
          });

          setTimeout(restore, 4000);
        } catch (err) {
          restore();
        }
      },

      animateTopologicalSort: async (executionTiers, criticalPath) => {
        const { nodes, edges } = get();
        if (!executionTiers || executionTiers.length === 0) return;

        const criticalSet = new Set(criticalPath);

        // Snapshot pre-animation state so we can restore perfectly — preserving
        // each edge's type-specific colour (purple, cyan, blue, pink, etc.)
        const snapshotNodes = nodes.map(n => ({ ...n }));
        const snapshotEdges = edges.map(e => ({ ...e }));

        useStore.temporal.getState().pause();

        const restore = () => {
          set({ nodes: snapshotNodes, edges: snapshotEdges });
          useStore.temporal.getState().resume();
        };

        try {
          // Dim everything to signal "simulation starting"
          set({
            nodes: nodes.map(n => ({ ...n, style: { ...n.style, opacity: 0.3 } })),
            edges: edges.map(e => ({
              ...e,
              animated: false,
              style: { stroke: '#e2e8f0', strokeWidth: 1, opacity: 0.2 },
            })),
          });

          // ACT 1: Light up tier by tier in green
          for (let i = 0; i < executionTiers.length; i++) {
            const currentTier = new Set(executionTiers[i]);
            await new Promise(res => setTimeout(res, 600));

            set({
              nodes: get().nodes.map(n => ({
                ...n,
                style: currentTier.has(n.id)
                  ? { ...n.style, opacity: 1, boxShadow: '0 0 15px 3px rgba(16, 185, 129, 0.5)', border: '2px solid #10b981' }
                  : n.style,
              })),
              edges: get().edges.map(e => ({
                ...e,
                animated: currentTier.has(e.source) ? true : e.animated,
                style: currentTier.has(e.source)
                  ? { stroke: '#10b981', strokeWidth: 3, filter: 'drop-shadow(0 0 3px #10b981)', opacity: 1 }
                  : e.style,
              })),
            });
          }

          await new Promise(res => setTimeout(res, 1000));

          // ACT 2: Critical Path reveal in pulsing gold
          set({
            nodes: get().nodes.map(n => ({
              ...n,
              style: criticalSet.has(n.id)
                ? { ...n.style, opacity: 1, boxShadow: '0 0 25px 5px rgba(245, 158, 11, 0.7)', border: '2px solid #f59e0b' }
                : { ...n.style, opacity: 0.15, boxShadow: 'none', border: '1px solid #e2e8f0' },
            })),
            edges: get().edges.map(e => ({
              ...e,
              animated: criticalSet.has(e.source) && criticalSet.has(e.target),
              style: criticalSet.has(e.source) && criticalSet.has(e.target)
                ? { stroke: '#f59e0b', strokeWidth: 5, filter: 'drop-shadow(0 0 8px #f59e0b)', opacity: 1 }
                : { stroke: '#e2e8f0', strokeWidth: 1, opacity: 0.1 },
            })),
          });

          // Restore the exact pre-animation state (colours, animated flags, everything)
          setTimeout(restore, 5000);
        } catch (err) {
          restore();
        }
      },

      clearPipeline: () => set({ ...initialState }),
    }),
    {
      name: 'vectorshift-pipeline',
      version: 2,
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges, nodeIDs: state.nodeIDs }),
      migrate: (persisted, version) => {
        if (version < 1) {
          persisted.nodes = (persisted.nodes ?? []).map((n) =>
            n.type === 'openaiLlm' ? { ...n, type: 'groqLlm' } : n
          );
          if (persisted.nodeIDs?.openaiLlm) {
            persisted.nodeIDs.groqLlm = persisted.nodeIDs.openaiLlm;
            delete persisted.nodeIDs.openaiLlm;
          }
        }
        if (version < 2) {
          persisted.edges = (persisted.edges ?? []).map((e) => {
            const handle = e.sourceHandle || '';
            let stroke = '#818cf8';
            if (handle.includes('response')) stroke = '#c084fc';
            else if (handle.includes('store'))     stroke = '#22d3ee';
            else if (handle.includes('parsed'))    stroke = '#fb7185';
            else if (handle.includes('documents')) stroke = '#60a5fa';
            return {
              ...e,
              animated: true,
              style: { ...(e.style ?? {}), stroke, strokeWidth: 1.5 },
              markerEnd: { type: MarkerType.Arrow, height: '16px', width: '16px', color: stroke },
            };
          });
        }
        return persisted;
      },
    }
  ),
  {
    limit: 50,

    // Only snapshot canvas topology — skip nodeIDs, functions, and UI-only
    // fields (selected, measured/dimensions) that should never be undoable.
    partialize: (state) => ({
      nodes: state.nodes.map(({ id, type, position, data, parentId, extent, style, zIndex }) => ({
        id, type, position, data, parentId, extent, style, zIndex,
      })),
      edges: state.edges,
    }),

    // Structural equality: ignore React-Flow-only mutations (select, measure)
    // that create new array refs without meaningful pipeline changes. We do an
    // O(n) per-node check so that position drags ARE captured while deselect
    // clicks and dimension measurements are silently skipped.
    equality: (a, b) => {
      if (a.edges !== b.edges) return false;
      if (a.nodes.length !== b.nodes.length) return false;
      return a.nodes.every((n, i) => {
        const bn = b.nodes[i];
        return (
          n.id       === bn.id       &&
          n.type     === bn.type     &&
          n.parentId === bn.parentId &&
          n.extent   === bn.extent   &&
          n.style    === bn.style    &&
          n.zIndex   === bn.zIndex   &&
          n.data     === bn.data     &&
          n.position?.x === bn.position?.x &&
          n.position?.y === bn.position?.y
        );
      });
    },

    // Debounce snapshot recording to 300 ms and capture the FIRST pastState
    // seen in the window (state before the drag started) so that Undo
    // restores the full pre-drag position rather than a mid-drag frame.
    handleSet: (handleSet) => {
      let timer     = null;
      let firstArgs = null;
      return (...args) => {
        if (!firstArgs) firstArgs = args;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          handleSet(...firstArgs);
          timer     = null;
          firstArgs = null;
        }, 300);
      };
    },
  }
  )
);

/**
 * useTemporalStore — React hook for subscribing to the zundo temporal store.
 * useStore.temporal is a vanilla StoreApi (object), not a React hook function.
 * This bridges it to React using zustand's own useStore hook.
 */
export const useTemporalStore = (selector, equalityFn) =>
  _useZustandStore(useStore.temporal, selector, equalityFn);
