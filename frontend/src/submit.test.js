import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubmitButton } from './submit';
import { useStore } from './store';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  },
}));

// eslint-disable-next-line import/first
import { toast } from 'sonner';

const seedNode = () =>
  useStore.setState({
    nodes: [{ id: 'a', type: 'customInput', position: { x: 0, y: 0 }, data: {} }],
    edges: [],
  });

beforeEach(() => {
  jest.clearAllMocks();
  useStore.getState().clearPipeline();
});

afterEach(() => {
  delete global.fetch;
});

test('is disabled until at least one node exists', () => {
  render(<SubmitButton />);
  expect(screen.getByRole('button')).toBeDisabled();
});

test('shows a success toast for a valid DAG', async () => {
  seedNode();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ num_nodes: 1, num_edges: 0, is_dag: true, cycle_path: null }),
  });

  render(<SubmitButton />);
  fireEvent.click(screen.getByRole('button'));

  await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
  const [, opts] = toast.success.mock.calls[0];
  expect(opts.description).toContain('DAG: Yes');
});

test('warns and names the cycle when the graph is cyclic', async () => {
  seedNode();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      num_nodes: 2,
      num_edges: 2,
      is_dag: false,
      cycle_path: ['a', 'b', 'a'],
    }),
  });

  render(<SubmitButton />);
  fireEvent.click(screen.getByRole('button'));

  await waitFor(() => expect(toast.warning).toHaveBeenCalledTimes(1));
  const [, opts] = toast.warning.mock.calls[0];
  expect(opts.description).toContain('a → b → a');
});

test('shows an error toast when the request fails', async () => {
  seedNode();
  global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'));

  render(<SubmitButton />);
  fireEvent.click(screen.getByRole('button'));

  await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
});
