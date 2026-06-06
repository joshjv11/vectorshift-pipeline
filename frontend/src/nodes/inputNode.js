import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { NODE_META } from './nodeColors';
import { useNodeField } from '../hooks/useNodeField';
import { fieldGroupClass, fieldLabelClass, inputClass, selectClass } from './nodeStyles';

const { accent } = NODE_META.customInput;

export const InputNode = ({ id, data }) => {
  const [currName, setCurrName] = useNodeField(
    id,
    'inputName',
    data?.inputName || id.replace('customInput-', 'input_')
  );
  const [inputType, setInputType] = useNodeField(id, 'inputType', data?.inputType || 'Text');

  return (
    <BaseNode
      title="Input"
      accentColor={accent}
      style={{ minHeight: 120 }}
      handles={[
        {
          type: 'source',
          position: Position.Right,
          id: `${id}-value`,
          label: 'value',
          style: { top: '50%' },
        },
      ]}
    >
      <label className={fieldGroupClass}>
        <span className={fieldLabelClass}>Name</span>
        <input
          type="text"
          value={currName}
          onChange={(e) => setCurrName(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className={fieldGroupClass}>
        <span className={fieldLabelClass}>Type</span>
        <select value={inputType} onChange={(e) => setInputType(e.target.value)} className={selectClass}>
          <option value="Text">Text</option>
          <option value="File">File</option>
        </select>
      </label>
    </BaseNode>
  );
};
