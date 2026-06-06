import { useEffect, useMemo } from 'react';
import { Position } from 'reactflow';
import TextareaAutosize from 'react-textarea-autosize';
import { useStore } from '../store';
import { BaseNode } from './BaseNode';
import { NODE_META } from './nodeColors';
import { fieldGroupClass, fieldLabelClass, textareaClass } from './nodeStyles';
import { computeTextNodeWidth, parseTextVariables } from './textVariables';
import { useNodeField } from '../hooks/useNodeField';

const { accent } = NODE_META.text;

export const TextNode = ({ id, data }) => {
  const setTextNodeVariables = useStore((state) => state.setTextNodeVariables);
  const [currText, setCurrText] = useNodeField(id, 'text', data?.text || '{{input}}');

  const variables = useMemo(() => parseTextVariables(currText), [currText]);

  useEffect(() => {
    setTextNodeVariables(id, variables);
  }, [id, variables, setTextNodeVariables]);

  const handles = useMemo(() => {
    const targetHandles = variables.map((variable, index) => ({
      type: 'target',
      position: Position.Left,
      id: `${id}-${variable}`,
      label: variable,
      style: {
        top: `${((index + 1) / (variables.length + 1)) * 100}%`,
      },
    }));

    return [
      ...targetHandles,
      {
        type: 'source',
        position: Position.Right,
        id: `${id}-output`,
        label: 'out',
        style: { top: '50%' },
      },
    ];
  }, [variables, id]);

  const nodeWidth = useMemo(() => computeTextNodeWidth(currText), [currText]);

  return (
    <BaseNode
      title="Text"
      accentColor={accent}
      handles={handles}
      style={{ width: nodeWidth, minHeight: 96 }}
    >
      <label className={fieldGroupClass}>
        <span className={fieldLabelClass}>Template</span>
        <TextareaAutosize
          value={currText}
          onChange={(e) => setCurrText(e.target.value)}
          minRows={1}
          className={textareaClass}
          placeholder="Hello {{ user_name }}"
        />
      </label>
    </BaseNode>
  );
};
