import { memo } from 'react';

/**
 * GroupNode — a transparent container that visually groups child nodes.
 * It has no handles; connections run through its children.
 */
export const GroupNode = memo(({ data, selected }) => {
  return (
    <div
      className={[
        'relative h-full w-full rounded-xl border-2 border-dashed transition-colors',
        selected
          ? 'border-indigo-500/50 bg-indigo-500/5'
          : 'border-white/10 bg-white/[0.02]',
      ].join(' ')}
    >
      <div className="absolute -top-3 left-4 rounded-md border border-white/10 bg-[#0a0a0f] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white/30">
        {data.label || 'Sub-Pipeline'}
      </div>
    </div>
  );
});
