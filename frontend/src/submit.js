import { useState } from 'react';
import { toast } from 'sonner';
import { shallow } from 'zustand/shallow';
import { useStore } from './store';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const PARSE_URL = `${API_BASE}/pipelines/parse`;

export const SubmitButton = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { nodes, edges } = useStore(
    (state) => ({ nodes: state.nodes, edges: state.edges }),
    shallow
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(PARSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const result = await response.json();
      const {
        num_nodes: numNodes,
        num_edges: numEdges,
        is_dag: isDag,
        cycle_path: cyclePath,
      } = result;

      const description = `Nodes: ${numNodes} · Edges: ${numEdges} · Valid DAG: ${
        isDag ? 'Yes' : 'No'
      }`;

      if (isDag) {
        toast.success('Pipeline parsed successfully', { description });
      } else {
        const cycle =
          Array.isArray(cyclePath) && cyclePath.length
            ? `\nCycle: ${cyclePath.join(' → ')}`
            : '';
        toast.warning('Pipeline has a cycle', {
          description: `${description}${cycle}`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to parse pipeline', {
        description: message.includes('fetch')
          ? `Could not reach backend at ${API_BASE}. Is the server running?`
          : message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmpty = nodes.length === 0;

  return (
    <div className="flex items-center justify-center border-t border-gray-200 bg-white px-4 py-5">
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || isEmpty}
        aria-label="Submit pipeline for parsing"
        title={isEmpty ? 'Add at least one node first' : undefined}
        className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Submitting…' : 'Submit'}
      </button>
    </div>
  );
};
