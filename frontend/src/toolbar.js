import { DraggableNode } from './draggableNode';

export const PipelineToolbar = () => {
  return (
    <div className="border-b border-gray-200 bg-gray-50/80 px-4 py-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Node Palette</p>
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
