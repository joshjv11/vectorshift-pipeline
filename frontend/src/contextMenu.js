import { useState, useEffect, useRef } from 'react';
import { NODE_META } from './nodes/nodeColors';

const PALETTE = [
  { type: 'customInput',    label: 'Input'        },
  { type: 'llm',            label: 'LLM'          },
  { type: 'customOutput',   label: 'Output'       },
  { type: 'text',           label: 'Text'         },
  { type: 'documentLoader', label: 'Doc Loader'   },
  { type: 'vectorStore',    label: 'Vector Store' },
  { type: 'promptTemplate', label: 'Prompt'       },
  { type: 'groqLlm',        label: 'Groq LLM'     },
  { type: 'outputParser',   label: 'Parser'       },
  { type: 'mcpConnector',   label: 'MCP Server'   },
];

export const ContextMenu = ({ mouseX, mouseY, onAddNode, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);
  const menuRef  = useRef(null);
  const [pos, setPos] = useState({ x: mouseX, y: mouseY });

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!menuRef.current) return;
    const { offsetWidth, offsetHeight } = menuRef.current;
    setPos({
      x: Math.min(mouseX, window.innerWidth  - offsetWidth  - 8),
      y: Math.min(mouseY, window.innerHeight - offsetHeight - 8),
    });
  }, [mouseX, mouseY]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const filtered = PALETTE.filter(({ label }) =>
    label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={onClose}
      onContextMenu={(e) => { e.preventDefault(); onClose(); }}
    >
      <div
        ref={menuRef}
        className="context-menu-panel absolute z-50 flex w-52 flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0a0a0f]/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
        style={{ top: pos.y, left: pos.x }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search */}
        <div className="border-b border-white/10 p-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search nodes…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none transition placeholder:text-white/25 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
          />
        </div>

        {/* Node list */}
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length > 0 ? (
            filtered.map(({ type, label }) => {
              const meta = NODE_META[type] ?? { icon: '◆' };
              return (
                <button
                  key={type}
                  onClick={() => onAddNode(type)}
                  className={[
                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs text-white/60',
                    'transition hover:bg-white/5 hover:text-white focus:bg-white/5 focus:outline-none',
                    meta.paletteHover,
                  ].join(' ')}
                >
                  {meta.materialIcon ? (
                    <span className="material-symbols-outlined leading-none shrink-0" style={{ fontSize: 14 }}>
                      {meta.materialIcon}
                    </span>
                  ) : (
                    <span className="text-[10px]">{meta.icon}</span>
                  )}
                  <span className="font-medium">{label}</span>
                </button>
              );
            })
          ) : (
            <p className="p-3 text-center text-[11px] text-white/30">No nodes found</p>
          )}
        </div>
      </div>
    </div>
  );
};
