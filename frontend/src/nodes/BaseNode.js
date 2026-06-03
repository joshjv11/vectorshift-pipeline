import { Handle, Position } from 'reactflow';

const handleClassName =
  '!h-3 !w-3 !border-2 !border-white !bg-indigo-500 !shadow-sm transition-colors hover:!bg-indigo-600';

const getHandleLabelStyle = (handle) => {
  const top = handle.style?.top ?? '50%';

  if (handle.position === Position.Left) {
    return { left: 14, top, transform: 'translateY(-50%)' };
  }

  if (handle.position === Position.Right) {
    return { right: 14, top, transform: 'translateY(-50%)' };
  }

  return { top, transform: 'translateY(-50%)' };
};

export const BaseNode = ({ title, children, handles = [], style = {}, className = '' }) => {
  return (
    <div
      className={`min-w-[220px] overflow-visible rounded-xl border border-gray-200 bg-white shadow-md transition-shadow hover:shadow-lg ${className}`}
      style={style}
    >
      {handles.map((handle) => (
        <Handle
          key={handle.id}
          type={handle.type}
          position={handle.position}
          id={handle.id}
          style={handle.style}
          className={handleClassName}
        />
      ))}
      {handles.map(
        (handle) =>
          handle.label && (
            <span
              key={`${handle.id}-label`}
              className="pointer-events-none absolute z-10 max-w-[72px] truncate text-[10px] font-medium text-gray-400"
              style={getHandleLabelStyle(handle)}
            >
              {handle.label}
            </span>
          )
      )}
      <div className="rounded-t-xl border-b border-gray-100 bg-indigo-50/80 px-3 py-2">
        <span className="text-sm font-semibold tracking-tight text-gray-800">{title}</span>
      </div>
      <div className="space-y-2 px-3 py-2.5 text-sm text-gray-700">{children}</div>
    </div>
  );
};
