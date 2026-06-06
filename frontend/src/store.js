// store.js

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';
import { isValidConnection } from './graph';

const initialState = {
  nodes: [],
  edges: [],
  nodeIDs: {},
};

export const useStore = create(
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
        set({
          nodes: [...get().nodes, node],
        });
      },
      // Single source of truth for node creation, shared by canvas drop and
      // click/keyboard-to-add from the palette. Cascades position when none given.
      addNodeOfType: (type, position) => {
        const id = get().getNodeID(type);
        const count = get().nodes.length;
        const pos = position ?? {
          x: 280 + (count % 6) * 36,
          y: 100 + (count % 6) * 36,
        };
        get().addNode({ id, type, position: pos, data: { id, nodeType: type } });
        return id;
      },
      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
        });
      },
      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },
      onConnect: (connection) => {
        // Defense-in-depth: the canvas also guards via `isValidConnection`, but
        // never persist an edge that is invalid (self / duplicate / cycle).
        if (!isValidConnection(get().edges, connection)) {
          return;
        }
        set({
          edges: addEdge(
            {
              ...connection,
              type: 'smoothstep',
              animated: true,
              markerEnd: { type: MarkerType.Arrow, height: '20px', width: '20px' },
            },
            get().edges
          ),
        });
      },
      updateNodeField: (nodeId, fieldName, fieldValue) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, [fieldName]: fieldValue } }
              : node
          ),
        });
      },
      // Sets a Text node's parsed variables AND prunes any edges connected to
      // variable handles that no longer exist (e.g. after a {{var}} is removed).
      setTextNodeVariables: (nodeId, variables) => {
        const validHandleIds = new Set(variables.map((v) => `${nodeId}-${v}`));
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, variables } }
              : node
          ),
          edges: get().edges.filter(
            (edge) =>
              edge.target !== nodeId ||
              !edge.targetHandle ||
              validHandleIds.has(edge.targetHandle)
          ),
        });
      },
      clearPipeline: () => {
        set({ ...initialState });
      },
    }),
    {
      name: 'vectorshift-pipeline',
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        nodeIDs: state.nodeIDs,
      }),
    }
  )
);
