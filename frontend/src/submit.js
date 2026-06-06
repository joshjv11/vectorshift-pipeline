import { useState } from 'react';
import { toast } from 'sonner';
import { shallow } from 'zustand/shallow';
import { useStore } from './store';

const API_BASE  = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const PARSE_URL = `${API_BASE}/pipelines/parse`;

/**
 * SubmitButton — validates the current pipeline with the backend.
 * Rendered inside the top navigation bar (App.js).
 */
export const SubmitButton = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { nodes, edges } = useStore(
    (state) => ({ nodes: state.nodes, edges: state.edges }),
    shallow
  );

  const isEmpty = nodes.length === 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(PARSE_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) throw new Error(`Server error ${response.status}`);

      const { num_nodes, num_edges, is_dag, cycle_path, execution_tiers, critical_path, total_latency_ms } = await response.json();
      const desc = `${num_nodes} nodes · ${num_edges} edges · DAG: ${is_dag ? 'Yes ✓' : 'No ✗'}`;

      if (is_dag) {
        const latencySec = (total_latency_ms / 1000).toFixed(2);
        toast.success('Pipeline Executed Successfully!', {
          description: `Total parallel latency: ${latencySec}s. Highlighting Critical Path.`,
        });
        useStore.getState().animateTopologicalSort(execution_tiers, critical_path);
      } else {
        const cycle = Array.isArray(cycle_path) && cycle_path.length
          ? `  Cycle: ${cycle_path.join(' → ')}`
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

  return (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={isSubmitting || isEmpty}
      aria-label="Validate pipeline with backend"
      title={isEmpty ? 'Add at least one node first' : 'Validate pipeline'}
      className={[
        'inline-flex items-center gap-2',
        'rounded-md bg-[#0a0a0f] px-4 py-1.5',
        'text-[11px] font-semibold uppercase tracking-widest text-indigo-300',
        'border border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.35)]',
        'transition-all hover:bg-indigo-500/20 hover:shadow-[0_0_25px_rgba(79,70,229,0.55)] active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500/30',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none',
      ].join(' ')}
    >
      {isSubmitting ? (
        <>
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Validating…
        </>
      ) : (
        <>
          <span className="material-symbols-outlined leading-none" style={{ fontSize: 14 }}>play_arrow</span>
          Run Pipeline
        </>
      )}
    </button>
  );
};
