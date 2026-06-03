import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useNodeField } from '../hooks/useNodeField';
import { fieldGroupClass, fieldLabelClass, inputClass, selectClass } from './nodeStyles';

export const OpenAI_LLMNode = ({ id, data }) => {
  const [model, setModel] = useNodeField(id, 'model', data?.model || 'gpt-4');
  const [temperature, setTemperature] = useNodeField(id, 'temperature', data?.temperature ?? 0.7);

  const handleTemperatureChange = (e) => {
    const parsed = parseFloat(e.target.value);
    setTemperature(Number.isNaN(parsed) ? 0 : parsed);
  };

  return (
    <BaseNode
      title="OpenAI LLM"
      style={{ minHeight: 120 }}
      handles={[
        {
          type: 'target',
          position: Position.Left,
          id: `${id}-prompt`,
          label: 'prompt',
          style: { top: '50%' },
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
      <label className={fieldGroupClass}>
        <span className={fieldLabelClass}>Model</span>
        <select value={model} onChange={(e) => setModel(e.target.value)} className={selectClass}>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </label>
      <label className={fieldGroupClass}>
        <span className={fieldLabelClass}>Temperature</span>
        <input
          type="number"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={handleTemperatureChange}
          className={inputClass}
        />
      </label>
    </BaseNode>
  );
};
