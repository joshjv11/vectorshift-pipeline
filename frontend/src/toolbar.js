import { shallow } from 'zustand/shallow';
import { toast } from 'sonner';
import { DraggableNode } from './draggableNode';
import { useStore } from './store';

const selector = (state) => ({
  nodeCount: state.nodes.length,
  edgeCount: state.edges.length,
  clearPipeline: state.clearPipeline,
});

export const PipelineToolbar = () => {
  const { nodeCount, edgeCount, clearPipeline } = useStore(selector, shallow);

  const handleClear = () => {
    if (nodeCount === 0 && edgeCount === 0) return;
    if (window.confirm('Clear the entire pipeline? This cannot be undone.')) {
      clearPipeline();
      toast.success('Pipeline cleared');
    }
  };

  return (
    <div className="border-b border-gray-200 bg-gray-50/80 px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Node Palette
        </p>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400" aria-live="polite">
            {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'} · {edgeCount}{' '}
            {edgeCount === 1 ? 'edge' : 'edges'}
          </span>
          <button
            type="button"
            onClick={handleClear}
            disabled={nodeCount === 0 && edgeCount === 0}
            aria-label="Clear pipeline"
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:border-red-200 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <DraggableNode type="customInput" label="Input" />
        <DraggableNode type="llm" label="LLM" />
        <DraggableNode type="customOutput" label="Output" />
        <DraggableNode type="text" label="Text" />
        <DraggableNode type="documentLoader" label="Doc Loader" />
        <DraggableNode type="vectorStore" label="Vector Store" />
        <DraggableNode type="promptTemplate" label="Prompt" />
        <DraggableNode type="openaiLlm" label="OpenAI LLM" />
        <DraggableNode type="outputParser" label="Parser" />
      </div>
    </div>
  );
};
