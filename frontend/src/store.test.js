import { useStore } from './store';

const reset = () => useStore.getState().clearPipeline();

beforeEach(() => {
  reset();
});

describe('getNodeID', () => {
  test('produces sequential, per-type ids', () => {
    const { getNodeID } = useStore.getState();
    expect(getNodeID('text')).toBe('text-1');
    expect(getNodeID('text')).toBe('text-2');
    expect(getNodeID('llm')).toBe('llm-1');
  });
});

describe('addNode / updateNodeField', () => {
  test('adds nodes and updates fields immutably', () => {
    const { addNode, updateNodeField } = useStore.getState();
    addNode({ id: 'text-1', type: 'text', data: { id: 'text-1' } });
    const before = useStore.getState().nodes[0];

    updateNodeField('text-1', 'text', 'hello');
    const after = useStore.getState().nodes[0];

    expect(after.data.text).toBe('hello');
    expect(after).not.toBe(before); // new reference
    expect(before.data.text).toBeUndefined(); // original untouched
  });
});

describe('addNodeOfType', () => {
  test('creates a typed node with an id, data, and position', () => {
    const id = useStore.getState().addNodeOfType('text');
    const { nodes } = useStore.getState();
    expect(id).toBe('text-1');
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      id: 'text-1',
      type: 'text',
      data: { id: 'text-1', nodeType: 'text' },
    });
    expect(nodes[0].position).toEqual(expect.objectContaining({ x: expect.any(Number) }));
  });

  test('honors an explicit position (canvas drop)', () => {
    useStore.getState().addNodeOfType('llm', { x: 42, y: 99 });
    expect(useStore.getState().nodes[0].position).toEqual({ x: 42, y: 99 });
  });
});

describe('onConnect validation', () => {
  test('adds a valid edge with styling metadata', () => {
    useStore.getState().onConnect({
      source: 'a',
      target: 'b',
      sourceHandle: 'a-out',
      targetHandle: 'b-in',
    });
    const { edges } = useStore.getState();
    expect(edges).toHaveLength(1);
    expect(edges[0].animated).toBe(true);
  });

  test('rejects a self-connection', () => {
    useStore.getState().onConnect({ source: 'a', target: 'a' });
    expect(useStore.getState().edges).toHaveLength(0);
  });

  test('rejects a cycle-forming edge', () => {
    const { onConnect } = useStore.getState();
    onConnect({ source: 'a', target: 'b', targetHandle: 'b-in' });
    onConnect({ source: 'b', target: 'a', targetHandle: 'a-in' });
    expect(useStore.getState().edges).toHaveLength(1);
  });
});

describe('setTextNodeVariables edge pruning', () => {
  test('removes edges whose target handle no longer exists', () => {
    const { addNode } = useStore.getState();
    addNode({ id: 'text-1', type: 'text', data: { id: 'text-1' } });

    // Two incoming edges into two variable handles.
    useStore.setState({
      edges: [
        { id: 'e1', source: 'x', target: 'text-1', targetHandle: 'text-1-a' },
        { id: 'e2', source: 'y', target: 'text-1', targetHandle: 'text-1-b' },
      ],
    });

    // Variable "b" was removed from the template -> only "a" remains.
    useStore.getState().setTextNodeVariables('text-1', ['a']);

    const { edges, nodes } = useStore.getState();
    expect(edges.map((e) => e.id)).toEqual(['e1']);
    expect(nodes[0].data.variables).toEqual(['a']);
  });
});

describe('clearPipeline', () => {
  test('wipes nodes, edges, and id counters', () => {
    const { addNode, getNodeID } = useStore.getState();
    getNodeID('text');
    addNode({ id: 'text-1', type: 'text', data: {} });

    useStore.getState().clearPipeline();

    const state = useStore.getState();
    expect(state.nodes).toEqual([]);
    expect(state.edges).toEqual([]);
    expect(state.nodeIDs).toEqual({});
  });
});

describe('mcpConnector', () => {
  test('addNodeOfType creates a typed mcpConnector node', () => {
    const id = useStore.getState().addNodeOfType('mcpConnector');
    const { nodes } = useStore.getState();
    expect(id).toBe('mcpConnector-1');
    expect(nodes[0]).toMatchObject({
      id:   'mcpConnector-1',
      type: 'mcpConnector',
      data: { id: 'mcpConnector-1', nodeType: 'mcpConnector' },
    });
  });

  test('autoConnectToNewNode wires to mcpConnector-query handle', () => {
    useStore.getState().addNodeOfType('customInput');
    useStore.getState().autoConnectToNewNode(
      'customInput-1',
      'customInput-1-value',
      'mcpConnector',
      { x: 400, y: 200 }
    );
    const { edges } = useStore.getState();
    expect(edges).toHaveLength(1);
    expect(edges[0].targetHandle).toBe('mcpConnector-1-query');
  });

  test('loadPipeline accepts mcpConnector nodes and sets nodeIDs correctly', () => {
    const { loadPipeline, getNodeID } = useStore.getState();
    loadPipeline(
      [{ id: 'mcpConnector-3', type: 'mcpConnector', data: {} }],
      []
    );
    expect(getNodeID('mcpConnector')).toBe('mcpConnector-4');
  });
});

describe('loadPipeline', () => {
  test('replaces nodes, edges, and id counters atomically', () => {
    const { addNode, getNodeID, loadPipeline } = useStore.getState();
    // Pre-populate store with something that should be fully replaced
    getNodeID('text');
    addNode({ id: 'text-1', type: 'text', data: {} });

    const newNodes = [
      { id: 'customInput-1', type: 'customInput', data: {} },
      { id: 'customInput-2', type: 'customInput', data: {} },
    ];
    const newEdges = [{ id: 'e1', source: 'customInput-1', target: 'customInput-2' }];
    loadPipeline(newNodes, newEdges);

    const state = useStore.getState();
    expect(state.nodes).toEqual(newNodes);
    expect(state.edges).toEqual(newEdges);
    expect(state.nodeIDs).toEqual({ customInput: 2 });
  });

  test('getNodeID continues from loaded max with no id clash', () => {
    const { loadPipeline, getNodeID } = useStore.getState();
    loadPipeline([{ id: 'text-3', type: 'text', data: {} }], []);
    expect(getNodeID('text')).toBe('text-4');
  });

  test('loading over existing nodes fully replaces them', () => {
    const { addNode, loadPipeline } = useStore.getState();
    addNode({ id: 'llm-1', type: 'llm', data: {} });
    loadPipeline([{ id: 'text-1', type: 'text', data: {} }], []);
    const { nodes } = useStore.getState();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('text-1');
  });

  test('handles multi-hyphen type names (robust -N suffix parsing)', () => {
    const { loadPipeline, getNodeID } = useStore.getState();
    // 'groqLlm' has no hyphens but this exercises the regex path generically
    loadPipeline([{ id: 'groqLlm-5', type: 'groqLlm', data: {} }], []);
    expect(getNodeID('groqLlm')).toBe('groqLlm-6');
  });

  test('loading an empty pipeline clears all state', () => {
    const { addNode, loadPipeline } = useStore.getState();
    addNode({ id: 'text-1', type: 'text', data: {} });
    loadPipeline([], []);
    const state = useStore.getState();
    expect(state.nodes).toEqual([]);
    expect(state.edges).toEqual([]);
    expect(state.nodeIDs).toEqual({});
  });
});
