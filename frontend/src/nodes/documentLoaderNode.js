import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { NODE_META } from './nodeColors';
import { useNodeField } from '../hooks/useNodeField';
import { fieldGroupClass, fieldLabelClass, inputClass, selectClass } from './nodeStyles';

const { accent } = NODE_META.documentLoader;

export const DocumentLoaderNode = ({ id, data }) => {
  const [loaderType, setLoaderType] = useNodeField(id, 'loaderType', data?.loaderType || 'PDF');
  const [filePath, setFilePath] = useNodeField(id, 'filePath', data?.filePath || '');

  return (
    <BaseNode
      title="Document Loader"
      accentColor={accent}
      style={{ minHeight: 120 }}
      handles={[
        {
          type: 'source',
          position: Position.Right,
          id: `${id}-documents`,
          label: 'docs',
          style: { top: '50%' },
        },
      ]}
    >
      <label className={fieldGroupClass}>
        <span className={fieldLabelClass}>Type</span>
        <select value={loaderType} onChange={(e) => setLoaderType(e.target.value)} className={selectClass}>
          <option value="PDF">PDF</option>
          <option value="CSV">CSV</option>
          <option value="Text">Text</option>
        </select>
      </label>
      <label className={fieldGroupClass}>
        <span className={fieldLabelClass}>Path</span>
        <input
          type="text"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="/path/to/file"
          className={inputClass}
        />
      </label>
    </BaseNode>
  );
};
