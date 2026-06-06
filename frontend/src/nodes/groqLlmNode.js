import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useNodeField } from '../hooks/useNodeField';
import { fieldGroupClass, fieldLabelClass, inputClass, selectClass } from './nodeStyles';

/**
 * Supported Groq models — must match the catalogue in backend/main.py GROQ_MODELS.
 * Add new entries here and in the backend when Groq releases new models.
 */
const GROQ_MODELS = [
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 · 70B — versatile' },
  { value: 'llama-3.1-8b-instant',    label: 'Llama 3.1 · 8B  — instant'   },
  { value: 'mixtral-8x7b-32768',      label: 'Mixtral · 8×7B — 32 k ctx'  },
  { value: 'gemma2-9b-it',            label: 'Gemma 2 · 9B  — Google'      },
];

const DEFAULT_MODEL = GROQ_MODELS[0].value;

export const GroqLLMNode = ({ id, data, selected }) => {
  const [model, setModel]           = useNodeField(id, 'model',       data?.model       ?? DEFAULT_MODEL);
  const [temperature, setTemperature] = useNodeField(id, 'temperature', data?.temperature ?? 0.7);

  const handleTemperature = (e) => {
    const v = parseFloat(e.target.value);
    setTemperature(Number.isNaN(v) ? 0 : Math.min(2, Math.max(0, v)));
  };

  return (
    <BaseNode
      title="Groq LLM"
      isSelected={selected}
      color="purple"
      nodeType="groqLlm"
      style={{ minHeight: 130 }}
      handles={[
        {
          type:     'target',
          position: Position.Left,
          id:       `${id}-system`,
          label:    'system',
          style:    { top: '33%' },
        },
        {
          type:     'target',
          position: Position.Left,
          id:       `${id}-prompt`,
          label:    'prompt',
          style:    { top: '66%' },
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
      <div className={fieldGroupClass}>
        <label className={fieldLabelClass}>Model</label>
        <select value={model} onChange={(e) => setModel(e.target.value)} className={selectClass}>
          {GROQ_MODELS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className={fieldGroupClass}>
        <label className={fieldLabelClass}>Temperature</label>
        <input
          type="number"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={handleTemperature}
          className={inputClass}
        />
      </div>
    </BaseNode>
  );
};
