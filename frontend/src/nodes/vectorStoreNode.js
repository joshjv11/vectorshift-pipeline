import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useNodeField } from '../hooks/useNodeField';
import { fieldGroupClass, fieldLabelClass, inputClass, selectClass } from './nodeStyles';

export const VectorStoreNode = ({ id, data, selected }) => {
  const [storeType, setStoreType] = useNodeField(id, 'storeType', data?.storeType || 'Chroma');
  const [collection, setCollection] = useNodeField(id, 'collection', data?.collection || 'default');

  return (
    <BaseNode
      title="Vector Store"
      isSelected={selected}
      color="cyan"
      nodeType="vectorStore"
      style={{ minHeight: 120 }}
      handles={[
        {
          type: 'target',
          position: Position.Left,
          id: `${id}-documents`,
          label: 'docs',
          style: { top: '40%' },
        },
        {
          type: 'source',
          position: Position.Right,
          id: `${id}-store`,
          label: 'store',
          style: { top: '60%' },
        },
      ]}
    >
      <label className={fieldGroupClass}>
        <span className={fieldLabelClass}>Store</span>
        <select value={storeType} onChange={(e) => setStoreType(e.target.value)} className={selectClass}>
          <option value="Chroma">Chroma</option>
          <option value="Pinecone">Pinecone</option>
          <option value="FAISS">FAISS</option>
        </select>
      </label>
      <label className={fieldGroupClass}>
        <span className={fieldLabelClass}>Collection</span>
        <input
          type="text"
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          className={inputClass}
        />
      </label>
    </BaseNode>
  );
};
