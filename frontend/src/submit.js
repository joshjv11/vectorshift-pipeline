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

      if (!response.ok) throw new Error(`Server error ${response.status}`);

      const result = await response.json();
      const {
        num_nodes: numNodes,
        num_edges: numEdges,
        is_dag:    isDag,
        cycle_path: cyclePath,
      } = result;

      const desc = `${numNodes} nodes · ${numEdges} edges · DAG: ${isDag ? 'Yes ✓' : 'No ✗'}`;

      if (isDag) {
        toast.success('Pipeline is valid', { description: desc });
      } else {
        const cycle = Array.isArray(cyclePath) && cyclePath.length
          ? `  Cycle: ${cyclePath.join(' → ')}`
          : '';
        toast.warning('Pipeline has a cycle', { description: `${desc}${cycle}` });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Failed to reach backend', {
        description: msg.includes('fetch')
          ? `Cannot connect to ${API_BASE}. Is the server running?`
          : msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmpty = nodes.length === 0;

  return (
    <div className="shrink-0 flex items-center justify-between border-t border-gray-200 bg-white px-5 py-3">
      {/* Left: lightweight stats */}
      <span className="text-[11px] text-gray-400">
        {isEmpty
          ? 'No pipeline yet'
          : `${nodes.length} ${nodes.length === 1 ? 'node' : 'nodes'} · ${edges.length} ${edges.length === 1 ? 'edge' : 'edges'}`}
      </span>

      {/* Right: submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || isEmpty}
        aria-label="Submit pipeline for validation"
        title={isEmpty ? 'Add at least one node first' : 'Validate pipeline with backend'}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Validating…
          </>
        ) : (
          'Validate Pipeline'
        )}
      </button>
    </div>
  );
};
