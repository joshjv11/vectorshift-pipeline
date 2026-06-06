// graph.js
// Pure, framework-agnostic graph helpers used for client-side connection
// validation. Kept free of React/React Flow imports so they are trivially
// unit-testable and mirror the backend DAG logic.

/**
 * @typedef {{ id?: string, source: string, target: string,
 *             sourceHandle?: string|null, targetHandle?: string|null }} EdgeLike
 * @typedef {{ source: string|null, target: string|null,
 *             sourceHandle?: string|null, targetHandle?: string|null }} ConnectionLike
 */

/**
 * Build a directed adjacency map (source -> [targets]) from edges.
 * @param {EdgeLike[]} edges
 * @returns {Map<string, string[]>}
 */
export const buildAdjacency = (edges) => {
  const adjacency = new Map();
  for (const edge of edges) {
    if (!edge?.source || !edge?.target) continue;
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    adjacency.get(edge.source).push(edge.target);
  }
  return adjacency;
};

/**
 * Depth-first reachability check: is `to` reachable from `from`?
 * @param {Map<string, string[]>} adjacency
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
export const hasPath = (adjacency, from, to) => {
  if (from === to) return true;
  const stack = [from];
  const visited = new Set();
  while (stack.length) {
    const node = stack.pop();
    if (node === to) return true;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const next of adjacency.get(node) || []) {
      if (!visited.has(next)) stack.push(next);
    }
  }
  return false;
};

/**
 * A connection whose source and target are the same node.
 * @param {ConnectionLike} connection
 */
export const isSelfConnection = (connection) =>
  !!connection && connection.source === connection.target;

/**
 * True if an identical edge (same source/target handles) already exists, or if
 * the target handle is already occupied (one input per target handle).
 * @param {EdgeLike[]} edges
 * @param {ConnectionLike} connection
 */
export const isDuplicateConnection = (edges, connection) => {
  if (!connection) return false;
  return edges.some(
    (edge) =>
      edge.target === connection.target &&
      (edge.targetHandle ?? null) === (connection.targetHandle ?? null)
  );
};

/**
 * True if adding this connection would introduce a directed cycle. Computed by
 * checking whether the new target can already reach the new source.
 * @param {EdgeLike[]} edges
 * @param {ConnectionLike} connection
 */
export const wouldCreateCycle = (edges, connection) => {
  if (!connection?.source || !connection?.target) return false;
  if (isSelfConnection(connection)) return true;
  const adjacency = buildAdjacency(edges);
  return hasPath(adjacency, connection.target, connection.source);
};

/**
 * Single entry point for React Flow's `isValidConnection`. Rejects
 * self-connections, duplicate target handles, and cycle-forming edges.
 * @param {EdgeLike[]} edges
 * @param {ConnectionLike} connection
 * @returns {boolean}
 */
export const isValidConnection = (edges, connection) => {
  if (!connection?.source || !connection?.target) return false;
  if (isSelfConnection(connection)) return false;
  if (isDuplicateConnection(edges, connection)) return false;
  if (wouldCreateCycle(edges, connection)) return false;
  return true;
};
