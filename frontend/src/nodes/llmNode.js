import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';

/**
 * LLMNode — generic placeholder that represents any language model step.
 *
 * For actual inference, use the Groq LLM node instead. This node is useful
 * as a conceptual placeholder when designing a pipeline before wiring up
 * a specific model provider.
 */
export const LLMNode = ({ id, selected }) => {
  return (
    <BaseNode
      title="LLM"
      isSelected={selected}
      color="purple"
      nodeType="llm"
      style={{ minHeight: 100 }}
      handles={[
        {
          type:     'target',
          position: Position.Left,
          id:       `${id}-system`,
          label:    'system',
          style:    { top: `${100 / 3}%` },
        },
        {
          type:     'target',
          position: Position.Left,
          id:       `${id}-prompt`,
          label:    'prompt',
          style:    { top: `${200 / 3}%` },
        },
        {
          type:     'source',
          position: Position.Right,
          id:       `${id}-response`,
          label:    'response',
          style:    { top: '50%' },
        },
      ]}
    >
      <p className="text-xs leading-relaxed text-white/30 italic">
        Placeholder — drag a <span className="font-semibold not-italic text-indigo-400">Groq LLM</span> node
        for live inference, or keep this as a design marker.
      </p>
    </BaseNode>
  );
};
