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
