import {
  buildAdjacency,
  hasPath,
  isSelfConnection,
  isDuplicateConnection,
  wouldCreateCycle,
  isValidConnection,
} from './graph';

const edge = (source, target, targetHandle = null) => ({
  source,
  target,
  targetHandle,
});

describe('buildAdjacency / hasPath', () => {
  test('finds direct and transitive paths', () => {
    const adj = buildAdjacency([edge('a', 'b'), edge('b', 'c')]);
    expect(hasPath(adj, 'a', 'c')).toBe(true);
    expect(hasPath(adj, 'c', 'a')).toBe(false);
  });

  test('a node always reaches itself', () => {
    expect(hasPath(buildAdjacency([]), 'a', 'a')).toBe(true);
  });
});

describe('isSelfConnection', () => {
  test('detects same-node connections', () => {
    expect(isSelfConnection({ source: 'a', target: 'a' })).toBe(true);
    expect(isSelfConnection({ source: 'a', target: 'b' })).toBe(false);
  });
});

describe('isDuplicateConnection', () => {
  test('rejects a second edge into an occupied target handle', () => {
    const edges = [edge('a', 'b', 'b-in')];
    expect(isDuplicateConnection(edges, edge('c', 'b', 'b-in'))).toBe(true);
  });

  test('allows a different target handle on the same node', () => {
    const edges = [edge('a', 'b', 'b-in1')];
    expect(isDuplicateConnection(edges, edge('c', 'b', 'b-in2'))).toBe(false);
  });
});

describe('wouldCreateCycle', () => {
  test('flags a direct back-edge', () => {
    const edges = [edge('a', 'b')];
    expect(wouldCreateCycle(edges, { source: 'b', target: 'a' })).toBe(true);
  });

  test('flags a transitive cycle', () => {
    const edges = [edge('a', 'b'), edge('b', 'c')];
    expect(wouldCreateCycle(edges, { source: 'c', target: 'a' })).toBe(true);
  });

  test('allows edges that keep the graph acyclic', () => {
    const edges = [edge('a', 'b')];
    expect(wouldCreateCycle(edges, { source: 'b', target: 'c' })).toBe(false);
  });

  test('treats a self-connection as a cycle', () => {
    expect(wouldCreateCycle([], { source: 'a', target: 'a' })).toBe(true);
  });
});

describe('isValidConnection', () => {
  test('accepts a clean new edge', () => {
    expect(isValidConnection([], edge('a', 'b', 'b-in'))).toBe(true);
  });

  test('rejects self / duplicate / cycle / incomplete connections', () => {
    expect(isValidConnection([], { source: 'a', target: 'a' })).toBe(false);
    expect(
      isValidConnection([edge('a', 'b', 'b-in')], edge('c', 'b', 'b-in'))
    ).toBe(false);
    expect(
      isValidConnection([edge('a', 'b')], { source: 'b', target: 'a' })
    ).toBe(false);
    expect(isValidConnection([], { source: 'a', target: null })).toBe(false);
  });
});
