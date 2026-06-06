import { Handle, Position } from 'reactflow';
import { NODE_COLORS, NODE_META } from './nodeColors';

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

const getContentPadding = (handles) => {
  const hasLeft  = handles.some((h) => h.position === Position.Left);
  const hasRight = handles.some((h) => h.position === Position.Right);
  return {
    paddingLeft:  hasLeft  ? '1.75rem' : '1rem',
    paddingRight: hasRight ? '1.75rem' : '1rem',
  };
};

export const BaseNode = ({
  title,
  children,
  handles = [],
  style = {},
  className = '',
  isSelected = false,
  color = 'indigo',
  nodeType = null,
}) => {
  const theme = NODE_COLORS[color] ?? NODE_COLORS.indigo;
  const meta  = nodeType ? (NODE_META[nodeType] ?? null) : null;
  const materialIcon = meta?.materialIcon ?? null;

  return (
    <div
      className={[
        'min-w-[220px] overflow-visible rounded-lg',
        'bg-[#0a0a0f]/90 backdrop-blur-md border transition-all',
        isSelected
          ? `${theme.selectedBorder} ${theme.selectedShadow}`
          : `${theme.border} ${theme.shadow}`,
        className,
      ].join(' ')}
      style={style}
    >
      {/* Handles */}
      {handles.map((handle) => {
        const isSource = handle.type === 'source';
        const handleClass = isSource ? theme.handleSource : theme.handleTarget;
        return (
          <Handle
            key={handle.id}
            type={handle.type}
            position={handle.position}
            id={handle.id}
            style={handle.style}
            className={`transition-all ${handleClass}`}
          />
        );
      })}

      {/* Handle labels */}
      {handles.map(
        (handle) =>
          handle.label && (
            <span
              key={`${handle.id}-label`}
              className={`pointer-events-none absolute z-10 max-w-[72px] truncate text-[9px] font-semibold uppercase tracking-widest ${theme.labelColor}`}
              style={getHandleLabelStyle(handle)}
            >
              {handle.label}
            </span>
          )
      )}

      {/* Header */}
      <div
        className={[
          'flex items-center justify-between border-b border-white/10 px-4 py-3 rounded-t-lg',
          `bg-gradient-to-r ${theme.headerGradient} to-transparent`,
        ].join(' ')}
      >
        <div className="flex items-center gap-2">
          {materialIcon && (
            <span
              className={`material-symbols-outlined ${theme.iconColor} leading-none`}
              style={{ fontSize: 15 }}
            >
              {materialIcon}
            </span>
          )}
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white">
            {title}
          </span>
        </div>
        <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
      </div>

      {/* Content */}
      <div
        className="space-y-3 py-3 text-sm text-white/80"
        style={getContentPadding(handles)}
      >
        {children}
      </div>
    </div>
  );
};
