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
 * Maps the terminal segment of a handle ID to a semantic data type.
 * Handle IDs follow the convention `nodeId-handleName`.
 *
 * Full handle catalogue (derived from all node definitions):
 *   value     → any       (Input source, Output target)
 *   documents → document  (DocumentLoader source, VectorStore target)
 *   store     → any       (VectorStore source — retrieval result, accepted by any target)
 *   prompt    → string    (LLM/GroqLLM target, PromptTemplate source)
 *   response  → string    (LLM/GroqLLM source, OutputParser target)
 *   parsed    → json      (OutputParser source)
 *   system    → string    (LLM/GroqLLM target)
 *   variables → string    (PromptTemplate target)
 *   output    → string    (TextNode source)
 *   input     → string    (TextNode dynamic variable targets)
 *   query     → string    (McpConnector target)
 *   context   → string    (McpConnector source)
 *
 * @param {string|null|undefined} handleId
 * @returns {string}
 */
const getHandleDataType = (handleId) => {
  if (!handleId) return 'any';
  const name = handleId.split('-').pop();
  const typeMap = {
    documents: 'document',
    store:     'any',
    prompt:    'string',
    response:  'string',
    parsed:    'json',
    value:     'any',
    system:    'string',
    variables: 'string',
    input:     'string',
    output:    'string',
    query:     'string',
    context:   'string',
  };
  // Dynamic text-node variable handles (arbitrary names) fall back to 'string'
  return typeMap[name] ?? 'string';
};

/**
 * Two types are compatible if either side accepts anything (`'any'`) or
 * both sides share the same named type.
 * @param {string} sourceType
 * @param {string} targetType
 * @returns {boolean}
 */
const isTypeCompatible = (sourceType, targetType) => {
  if (sourceType === 'any' || targetType === 'any') return true;
  return sourceType === targetType;
};

/**
 * If the connection would be blocked specifically due to a data-type mismatch,
 * returns a human-readable error string. Returns null when types are compatible
 * (or when handles are not provided — other validators handle those cases).
 * @param {ConnectionLike} connection
 * @returns {string|null}
 */
export const getConnectionTypeMismatchMessage = (connection) => {
  if (!connection?.sourceHandle || !connection?.targetHandle) return null;
  const sourceType = getHandleDataType(connection.sourceHandle);
  const targetType = getHandleDataType(connection.targetHandle);
  if (isTypeCompatible(sourceType, targetType)) return null;
  return `Cannot connect '${sourceType}' → '${targetType}'`;
};

/**
 * Single entry point for React Flow's `isValidConnection`. Rejects
 * self-connections, duplicate target handles, cycle-forming edges, and
 * incompatible data-type pairings.
 * @param {EdgeLike[]} edges
 * @param {ConnectionLike} connection
 * @returns {boolean}
 */
export const isValidConnection = (edges, connection) => {
  if (!connection?.source || !connection?.target) return false;
  if (isSelfConnection(connection)) return false;
  if (isDuplicateConnection(edges, connection)) return false;
  if (wouldCreateCycle(edges, connection)) return false;

  const sourceType = getHandleDataType(connection.sourceHandle);
  const targetType = getHandleDataType(connection.targetHandle);
  if (!isTypeCompatible(sourceType, targetType)) {
    console.warn(`[Type Mismatch] Cannot connect '${sourceType}' → '${targetType}'`);
    return false;
  }

  return true;
};
