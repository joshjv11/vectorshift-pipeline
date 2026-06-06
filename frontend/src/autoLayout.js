import dagre from 'dagre';

const NODE_WIDTH  = 280;
const NODE_HEIGHT = 150;

export const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  // Create a fresh graph each call to prevent stale nodes/edges from a prior
  // layout run producing NaN positions on subsequent invocations.
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, ranksep: 120, nodesep: 80 });

  // Only layout top-level nodes; children inside groups hold relative positions
  const layoutableNodes = nodes.filter((n) => !n.parentId);

  layoutableNodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Only include edges between top-level nodes so dagre ranks correctly
  const layoutableIds = new Set(layoutableNodes.map((n) => n.id));
  edges.forEach((edge) => {
    if (layoutableIds.has(edge.source) && layoutableIds.has(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    // Leave grouped children exactly where they are (relative to parent)
    if (node.parentId) return node;
    const positioned = g.node(node.id);
    // Guard: if dagre didn't assign a position (isolated node after edge filtering),
    // fall back to the node's current position to avoid NaN coordinates.
    if (!positioned) return node;
    return {
      ...node,
      position: {
        x: positioned.x - NODE_WIDTH  / 2,
        y: positioned.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { layoutedNodes, layoutedEdges: edges };
};
