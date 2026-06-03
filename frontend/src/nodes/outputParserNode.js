import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useNodeField } from '../hooks/useNodeField';
import { fieldGroupClass, fieldLabelClass, inputClass, selectClass } from './nodeStyles';

export const OutputParserNode = ({ id, data }) => {
  const [parserType, setParserType] = useNodeField(id, 'parserType', data?.parserType || 'String');
  const [schema, setSchema] = useNodeField(id, 'schema', data?.schema || '');

  return (
    <BaseNode
      title="Output Parser"
      style={{ minHeight: 120 }}
      handles={[
        {
          type: 'target',
          position: Position.Left,
          id: `${id}-response`,
          label: 'response',
          style: { top: '40%' },
        },
        {
          type: 'source',
          position: Position.Right,
          id: `${id}-parsed`,
          label: 'parsed',
          style: { top: '60%' },
        },
      ]}
    >
      <label className={fieldGroupClass}>
        <span className={fieldLabelClass}>Parser</span>
        <select value={parserType} onChange={(e) => setParserType(e.target.value)} className={selectClass}>
          <option value="String">String</option>
          <option value="JSON">JSON</option>
          <option value="Structured">Structured</option>
        </select>
      </label>
      <label className={fieldGroupClass}>
        <span className={fieldLabelClass}>Schema</span>
        <input
          type="text"
          value={schema}
          onChange={(e) => setSchema(e.target.value)}
          placeholder="Optional JSON schema"
          className={inputClass}
        />
      </label>
    </BaseNode>
  );
};
