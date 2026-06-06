import { Position } from 'reactflow';
import TextareaAutosize from 'react-textarea-autosize';
import { BaseNode } from './BaseNode';
import { NODE_META } from './nodeColors';
import { useNodeField } from '../hooks/useNodeField';
import { fieldGroupClass, fieldLabelClass, textareaClass } from './nodeStyles';

const { accent } = NODE_META.promptTemplate;

export const PromptTemplateNode = ({ id, data }) => {
  const [template, setTemplate] = useNodeField(
    id,
    'template',
    data?.template || 'Answer the following: {input}'
  );

  return (
    <BaseNode
      title="Prompt Template"
      accentColor={accent}
      style={{ minHeight: 120 }}
      handles={[
        {
          type: 'target',
          position: Position.Left,
          id: `${id}-variables`,
          label: 'vars',
          style: { top: '40%' },
        },
        {
          type: 'source',
          position: Position.Right,
          id: `${id}-prompt`,
          label: 'prompt',
          style: { top: '60%' },
        },
      ]}
    >
      <label className={fieldGroupClass}>
        <span className={fieldLabelClass}>Template</span>
        <TextareaAutosize
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          minRows={2}
          className={textareaClass}
        />
      </label>
    </BaseNode>
  );
};
