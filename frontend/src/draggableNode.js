import { NODE_META } from './nodes/nodeColors';

/**
 * DraggableNode — a palette chip that can be dragged onto the canvas to
 * create a new node at the drop position.
 */
export const DraggableNode = ({ type, label, icon }) => {
  const meta = NODE_META[type] ?? {};
  const hoverClasses = meta.paletteHover ?? 'hover:text-white/80 hover:bg-white/5 hover:border-white/20';

  const onDragStart = (event) => {
    event.dataTransfer.setData('application/reactflow/type', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      role="button"
      tabIndex={0}
      aria-label={`Add ${label} node`}
      className={[
        'group flex items-center gap-3 rounded-lg border border-transparent',
        'px-3 py-2 transition-all duration-150',
        'cursor-grab active:cursor-grabbing active:scale-[0.97] select-none',
        'text-white/40',
        hoverClasses,
        'focus:outline-none focus:ring-1 focus:ring-white/10',
      ].join(' ')}
    >
      {meta.materialIcon ? (
        <span
          className="material-symbols-outlined leading-none shrink-0 transition-colors"
          style={{ fontSize: 17 }}
        >
          {meta.materialIcon}
        </span>
      ) : (
        icon && (
          <span className="text-sm leading-none shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
            {icon}
          </span>
        )
      )}
      <span className="text-[11px] font-semibold uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
};
