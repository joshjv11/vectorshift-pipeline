import { useState } from 'react';
import { shallow } from 'zustand/shallow';
import { toast } from 'sonner';
import { DraggableNode } from './draggableNode';
import { useStore } from './store';

const selector = (state) => ({
  nodeCount:     state.nodes.length,
  edgeCount:     state.edges.length,
  clearPipeline: state.clearPipeline,
});

const PALETTE = [
  { type: 'customInput',    label: 'Input'        },
  { type: 'llm',            label: 'LLM'          },
  { type: 'customOutput',   label: 'Output'       },
  { type: 'text',           label: 'Text'         },
  { type: 'documentLoader', label: 'Doc Loader'   },
  { type: 'vectorStore',    label: 'Vector Store' },
  { type: 'promptTemplate', label: 'Prompt'       },
  { type: 'openaiLlm',      label: 'OpenAI LLM'  },
  { type: 'outputParser',   label: 'Parser'       },
];

export const PipelineToolbar = () => {
  const { nodeCount, edgeCount, clearPipeline } = useStore(selector, shallow);
  // Inline two-step confirm — no native browser dialogs
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleClearClick = () => {
    if (nodeCount === 0 && edgeCount === 0) return;
    setConfirmOpen(true);
  };

  const handleConfirmClear = () => {
    clearPipeline();
    setConfirmOpen(false);
    toast.success('Pipeline cleared');
  };

  return (
    <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          Node Palette
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-gray-400" aria-live="polite">
            {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'} · {edgeCount}{' '}
            {edgeCount === 1 ? 'edge' : 'edges'}
          </span>

          {confirmOpen ? (
            <span className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500">Clear all?</span>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="rounded-md bg-red-500 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                Yes, clear
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleClearClick}
              disabled={nodeCount === 0 && edgeCount === 0}
              aria-label="Clear pipeline"
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 shadow-sm transition hover:border-red-200 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PALETTE.map(({ type, label }) => (
          <DraggableNode key={type} type={type} label={label} />
        ))}
      </div>
    </div>
  );
};
