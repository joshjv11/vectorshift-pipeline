import { Handle, Position } from 'reactflow';

const handleClassName =
  '!h-3.5 !w-3.5 !border-2 !border-white !shadow-sm transition-all duration-150 hover:!scale-125';

/**
 * Position a handle label so it stays inside the padding zone (8 px from each
 * edge) — clear of the 12 px content padding — and vertically centred on its
 * handle dot.
 */
const getLabelStyle = (handle) => {
  const top = handle.style?.top ?? '50%';

  if (handle.position === Position.Left) {
    return { position: 'absolute', left: 8, top, transform: 'translateY(-50%)', pointerEvents: 'none' };
  }
  if (handle.position === Position.Right) {
    return { position: 'absolute', right: 8, top, transform: 'translateY(-50%)', pointerEvents: 'none' };
  }
  return { position: 'absolute', top, transform: 'translateY(-50%)', pointerEvents: 'none' };
};

/**
 * Returns extra inline padding so node content never slides under a handle
 * label. Nodes with left handles get extra left padding, right handles get
 * extra right padding.
 */
const getContentPadding = (handles) => {
  const hasLeft  = handles.some((h) => h.position === Position.Left);
  const hasRight = handles.some((h) => h.position === Position.Right);
  return {
    paddingLeft:  hasLeft  ? '1.75rem' : '0.75rem',
    paddingRight: hasRight ? '1.75rem' : '0.75rem',
  };
};

export const BaseNode = ({
  title,
  children,
  handles = [],
  style = {},
  className = '',
  accentColor = '#6366f1',   // indigo default
}) => {
  const headerBg     = `${accentColor}12`;  // ~7 % opacity
  const headerBorder = `${accentColor}28`;  // ~16 % opacity
  const handleBg     = accentColor;

  return (
    <div
      className={`relative min-w-[220px] overflow-visible rounded-xl border border-gray-200 bg-white shadow-md transition-all duration-150 hover:shadow-lg ${className}`}
      style={style}
    >
      {/* Handles */}
      {handles.map((handle) => (
        <Handle
          key={handle.id}
          type={handle.type}
          position={handle.position}
          id={handle.id}
          style={{ ...handle.style, backgroundColor: handleBg }}
          className={handleClassName}
        />
      ))}

      {/* Handle labels — inside padding zone, never over content */}
      {handles.map(
        (handle) =>
          handle.label && (
            <span
              key={`${handle.id}-label`}
              className="z-10 max-w-[60px] truncate text-[9px] font-semibold uppercase tracking-wider text-gray-400"
              style={getLabelStyle(handle)}
            >
              {handle.label}
            </span>
          )
      )}

      {/* Coloured header strip */}
      <div
        className="rounded-t-xl border-b px-3 py-2"
        style={{ backgroundColor: headerBg, borderColor: headerBorder }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <span className="text-[13px] font-semibold tracking-tight text-gray-800">
            {title}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className="space-y-2 py-2.5 text-sm text-gray-700"
        style={getContentPadding(handles)}
      >
        {children}
      </div>
    </div>
  );
};
