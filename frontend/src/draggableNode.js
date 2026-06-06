import { useStore } from './store';
import { NODE_META } from './nodes/nodeColors';

export const DraggableNode = ({ type, label }) => {
  const addNodeOfType = useStore((state) => state.addNodeOfType);
  const meta = NODE_META[type] ?? { accent: '#6366f1', icon: '◆' };

  const onDragStart = (event) => {
    event.currentTarget.style.opacity = '0.7';
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({ nodeType: type })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragEnd = (event) => {
    event.currentTarget.style.opacity = '1';
  };

  const addNode = () => addNodeOfType(type);

  const onKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      addNode();
    }
  };

  return (
    <div
      className="group flex cursor-grab select-none flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm transition-all duration-150 hover:border-transparent hover:shadow-md focus:outline-none focus:ring-2 active:cursor-grabbing active:opacity-75"
      style={{
        minWidth: 76,
        // subtle top accent border on hover via box-shadow trick
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 1.5px ${meta.accent}55, 0 4px 12px -2px rgba(0,0,0,0.08)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 2px ${meta.accent}88`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = '';
      }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={addNode}
      onKeyDown={onKeyDown}
      draggable
      role="button"
      tabIndex={0}
      aria-label={`Add ${label} node`}
    >
      {/* Coloured icon dot */}
      <div
        className="flex h-6 w-6 items-center justify-center rounded-lg text-white text-[12px] font-semibold leading-none shadow-sm"
        style={{ backgroundColor: meta.accent }}
      >
        {meta.icon}
      </div>
      <span className="text-[11px] font-medium text-gray-600 group-hover:text-gray-800">
        {label}
      </span>
    </div>
  );
};
