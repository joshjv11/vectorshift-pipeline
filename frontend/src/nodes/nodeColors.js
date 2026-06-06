// Shared colour + icon definitions for every node type.
// Using plain hex values (not Tailwind classes) so Tailwind's JIT
// doesn't strip them out when referenced dynamically.

export const NODE_META = {
  customInput: {
    accent: '#10b981',   // emerald-500
    icon:   '↘',
    label:  'Input',
  },
  customOutput: {
    accent: '#f43f5e',   // rose-500
    icon:   '↗',
    label:  'Output',
  },
  llm: {
    accent: '#8b5cf6',   // violet-500
    icon:   '⚡',
    label:  'LLM',
  },
  openaiLlm: {
    accent: '#a855f7',   // purple-500
    icon:   '✦',
    label:  'OpenAI LLM',
  },
  text: {
    accent: '#f59e0b',   // amber-500
    icon:   'Aa',
    label:  'Text',
  },
  documentLoader: {
    accent: '#3b82f6',   // blue-500
    icon:   '📄',
    label:  'Doc Loader',
  },
  vectorStore: {
    accent: '#06b6d4',   // cyan-500
    icon:   '🗄',
    label:  'Vector Store',
  },
  promptTemplate: {
    accent: '#f97316',   // orange-500
    icon:   '💬',
    label:  'Prompt',
  },
  outputParser: {
    accent: '#ec4899',   // pink-500
    icon:   '⚙',
    label:  'Parser',
  },
};
