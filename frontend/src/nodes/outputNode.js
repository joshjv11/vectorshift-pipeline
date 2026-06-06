import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useNodeField } from '../hooks/useNodeField';
import { fieldGroupClass, fieldLabelClass, inputClass, selectClass } from './nodeStyles';

export const OutputNode = ({ id, data, selected }) => {
  const [currName, setCurrName] = useNodeField(
    id,
    'outputName',
    data?.outputName || id.replace('customOutput-', 'output_')
  );
  const [outputType, setOutputType] = useNodeField(id, 'outputType', data?.outputType || 'Text');

  return (
    <BaseNode
      title="Output"
      isSelected={selected}
      color="emerald"
      nodeType="customOutput"
      style={{ minHeight: 120 }}
      handles={[
        {
          type: 'target',
          position: Position.Left,
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
        <select value={outputType} onChange={(e) => setOutputType(e.target.value)} className={selectClass}>
          <option value="Text">Text</option>
          <option value="Image">Image</option>
        </select>
      </label>
    </BaseNode>
  );
};
