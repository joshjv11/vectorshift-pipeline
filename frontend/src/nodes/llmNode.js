import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { NODE_META } from './nodeColors';

const { accent } = NODE_META.llm;

export const LLMNode = ({ id }) => {
  return (
    <BaseNode
      title="LLM"
      accentColor={accent}
      style={{ minHeight: 100 }}
      handles={[
        {
          type: 'target',
          position: Position.Left,
          id: `${id}-system`,
          label: 'system',
          style: { top: `${100 / 3}%` },
        },
        {
          type: 'target',
          position: Position.Left,
          id: `${id}-prompt`,
          label: 'prompt',
          style: { top: `${200 / 3}%` },
        },
        {
          type: 'source',
          position: Position.Right,
          id: `${id}-response`,
          label: 'response',
          style: { top: '50%' },
        },
      ]}
    >
      <p className="text-xs leading-relaxed text-gray-500">
        Connect system and prompt inputs, then route the model response downstream.
      </p>
    </BaseNode>
  );
};
