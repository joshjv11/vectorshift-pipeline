import { MarkerType } from 'reactflow';

const mkEdge = (color, animated = true, dashArray) => ({
  animated,
  type: 'smoothstep',
  style: { stroke: color, strokeWidth: 1.5, ...(dashArray ? { strokeDasharray: dashArray } : {}) },
  markerEnd: { type: MarkerType.Arrow, height: '16px', width: '16px', color },
});

export const TEMPLATES = [
  {
    id: 'creative-writer',
    name: 'Creative Writer',
    icon: '✍️',
    description: 'A dynamic text pipeline that generates stylized content using Groq LLM.',
    nodes: [
      { id: 'customInput-1', type: 'customInput', position: { x: 0, y: 0 }, data: { id: 'customInput-1', nodeType: 'customInput', inputName: 'topic', inputType: 'Text' } },
      { id: 'customInput-2', type: 'customInput', position: { x: 0, y: 0 }, data: { id: 'customInput-2', nodeType: 'customInput', inputName: 'author_style', inputType: 'Text' } },
      { id: 'text-1',        type: 'text',        position: { x: 0, y: 0 }, data: { id: 'text-1', nodeType: 'text', text: 'Write a creative haiku about {{topic}} in the style of {{author_style}}.', variables: ['topic', 'author_style'] } },
      { id: 'groqLlm-1',    type: 'groqLlm',     position: { x: 0, y: 0 }, data: { id: 'groqLlm-1', nodeType: 'groqLlm', model: 'llama-3.3-70b-versatile', temperature: 0.8 } },
      { id: 'customOutput-1', type: 'customOutput', position: { x: 0, y: 0 }, data: { id: 'customOutput-1', nodeType: 'customOutput', outputName: 'final_poem', outputType: 'Text' } },
    ],
    edges: [
      { ...mkEdge('#818cf8'), id: 'e1', source: 'customInput-1', target: 'text-1',         sourceHandle: 'customInput-1-value',  targetHandle: 'text-1-topic'         },
      { ...mkEdge('#818cf8'), id: 'e2', source: 'customInput-2', target: 'text-1',         sourceHandle: 'customInput-2-value',  targetHandle: 'text-1-author_style'  },
      { ...mkEdge('#60a5fa'), id: 'e3', source: 'text-1',        target: 'groqLlm-1',      sourceHandle: 'text-1-output',        targetHandle: 'groqLlm-1-prompt'     },
      { ...mkEdge('#c084fc'), id: 'e4', source: 'groqLlm-1',     target: 'customOutput-1', sourceHandle: 'groqLlm-1-response',   targetHandle: 'customOutput-1-value' },
    ],
  },
  {
    id: 'rag-engine',
    name: 'RAG Knowledge Base',
    icon: '🧠',
    description: 'Retrieval-Augmented Generation. Embeds PDFs into a Vector Store for Q&A.',
    nodes: [
      { id: 'documentLoader-1', type: 'documentLoader', position: { x: 0, y: 0 }, data: { id: 'documentLoader-1', nodeType: 'documentLoader', loaderType: 'PDF', filePath: '/data/company_policies.pdf' } },
      { id: 'vectorStore-1',    type: 'vectorStore',    position: { x: 0, y: 0 }, data: { id: 'vectorStore-1', nodeType: 'vectorStore', storeType: 'Pinecone', collection: 'hr_policies' } },
      { id: 'promptTemplate-1', type: 'promptTemplate', position: { x: 0, y: 0 }, data: { id: 'promptTemplate-1', nodeType: 'promptTemplate', template: 'Answer the user query using the provided documents: {input}' } },
      { id: 'groqLlm-1',       type: 'groqLlm',       position: { x: 0, y: 0 }, data: { id: 'groqLlm-1', nodeType: 'groqLlm', model: 'llama-3.3-70b-versatile', temperature: 0.1 } },
      { id: 'customOutput-1',   type: 'customOutput',  position: { x: 0, y: 0 }, data: { id: 'customOutput-1', nodeType: 'customOutput', outputName: 'answer', outputType: 'Text' } },
    ],
    edges: [
      { ...mkEdge('#f59e0b'), id: 'e1', source: 'documentLoader-1', target: 'vectorStore-1', sourceHandle: 'documentLoader-1-documents', targetHandle: 'vectorStore-1-documents' },
      { ...mkEdge('#22d3ee'), id: 'e2', source: 'vectorStore-1',    target: 'groqLlm-1',     sourceHandle: 'vectorStore-1-store',       targetHandle: 'groqLlm-1-prompt'         },
      { ...mkEdge('#a78bfa'), id: 'e3', source: 'promptTemplate-1', target: 'groqLlm-1',     sourceHandle: 'promptTemplate-1-prompt',   targetHandle: 'groqLlm-1-system'         },
      { ...mkEdge('#c084fc'), id: 'e4', source: 'groqLlm-1',        target: 'customOutput-1', sourceHandle: 'groqLlm-1-response',       targetHandle: 'customOutput-1-value'     },
    ],
  },
  {
    id: 'data-extractor',
    name: 'Data Extractor',
    icon: '⚙️',
    description: 'Parses unstructured text into clean, structured JSON data.',
    nodes: [
      { id: 'customInput-1',  type: 'customInput',  position: { x: 0, y: 0 }, data: { id: 'customInput-1', nodeType: 'customInput', inputName: 'raw_email', inputType: 'Text' } },
      { id: 'groqLlm-1',     type: 'groqLlm',      position: { x: 0, y: 0 }, data: { id: 'groqLlm-1', nodeType: 'groqLlm', model: 'llama-3.1-8b-instant', temperature: 0.0 } },
      { id: 'outputParser-1', type: 'outputParser', position: { x: 0, y: 0 }, data: { id: 'outputParser-1', nodeType: 'outputParser', parserType: 'JSON', schema: '{ "name": "", "phone": "" }' } },
      { id: 'customOutput-1', type: 'customOutput', position: { x: 0, y: 0 }, data: { id: 'customOutput-1', nodeType: 'customOutput', outputName: 'structured_json', outputType: 'Text' } },
    ],
    edges: [
      { ...mkEdge('#818cf8'), id: 'e1', source: 'customInput-1',  target: 'groqLlm-1',     sourceHandle: 'customInput-1-value',    targetHandle: 'groqLlm-1-prompt'        },
      { ...mkEdge('#c084fc'), id: 'e2', source: 'groqLlm-1',      target: 'outputParser-1', sourceHandle: 'groqLlm-1-response',     targetHandle: 'outputParser-1-response' },
      { ...mkEdge('#fb7185'), id: 'e3', source: 'outputParser-1', target: 'customOutput-1', sourceHandle: 'outputParser-1-parsed',  targetHandle: 'customOutput-1-value'    },
    ],
  },
  {
    id: 'mcp-database-bot',
    name: 'MCP Database Bot',
    icon: '🔌',
    description: 'Routes natural language questions through an MCP Server to a live PostgreSQL database, answered by Groq LLM.',
    nodes: [
      { id: 'customInput-1',  type: 'customInput',  position: { x: 0, y: 0 }, data: { id: 'customInput-1',  nodeType: 'customInput',  inputName: 'question',   inputType: 'Text'       } },
      { id: 'mcpConnector-1', type: 'mcpConnector', position: { x: 0, y: 0 }, data: { id: 'mcpConnector-1', nodeType: 'mcpConnector', serverUrl: 'stdio://local/mcp', resourceType: 'database' } },
      { id: 'groqLlm-1',     type: 'groqLlm',      position: { x: 0, y: 0 }, data: { id: 'groqLlm-1',     nodeType: 'groqLlm',     model: 'llama-3.3-70b-versatile', temperature: 0.2 } },
      { id: 'customOutput-1', type: 'customOutput', position: { x: 0, y: 0 }, data: { id: 'customOutput-1', nodeType: 'customOutput', outputName: 'answer',    outputType: 'Text'      } },
    ],
    edges: [
      { ...mkEdge('#818cf8'), id: 'e1', source: 'customInput-1',  target: 'mcpConnector-1', sourceHandle: 'customInput-1-value',     targetHandle: 'mcpConnector-1-query'  },
      { ...mkEdge('#64748b'), id: 'e2', source: 'mcpConnector-1', target: 'groqLlm-1',      sourceHandle: 'mcpConnector-1-context',  targetHandle: 'groqLlm-1-prompt'      },
      { ...mkEdge('#c084fc'), id: 'e3', source: 'groqLlm-1',      target: 'customOutput-1', sourceHandle: 'groqLlm-1-response',      targetHandle: 'customOutput-1-value'  },
    ],
  },

  // --- ANTI-PATTERN TESTS (DAG validation demo) ---
  {
    id: 'deadlock-test',
    name: 'Test: Infinite Loop',
    icon: '🚨',
    description: 'Anti-pattern: two LLMs passing data to each other forever. Bypasses frontend guards to simulate a corrupted import.',
    nodes: [
      { id: 'groqLlm-1', type: 'groqLlm', position: { x: 0, y: 0 }, data: { id: 'groqLlm-1', nodeType: 'groqLlm', model: 'llama-3.1-8b-instant', temperature: 0.7 } },
      { id: 'groqLlm-2', type: 'groqLlm', position: { x: 0, y: 0 }, data: { id: 'groqLlm-2', nodeType: 'groqLlm', model: 'llama-3.1-8b-instant', temperature: 0.7 } },
    ],
    edges: [
      { ...mkEdge('#c084fc'), id: 'e1', source: 'groqLlm-1', target: 'groqLlm-2', sourceHandle: 'groqLlm-1-response', targetHandle: 'groqLlm-2-prompt' },
      { ...mkEdge('#c084fc'), id: 'e2', source: 'groqLlm-2', target: 'groqLlm-1', sourceHandle: 'groqLlm-2-response', targetHandle: 'groqLlm-1-prompt' },
    ],
  },
  {
    id: 'self-loop-test',
    name: 'Test: Self-Loop Paradox',
    icon: '⚠️',
    description: 'Anti-pattern: a Text node feeding its own output back into its own variable input — an unsolvable paradox.',
    nodes: [
      { id: 'text-1', type: 'text', position: { x: 0, y: 0 }, data: { id: 'text-1', nodeType: 'text', text: 'Generate an idea from {{idea}}', variables: ['idea'] } },
    ],
    edges: [
      { ...mkEdge('#60a5fa'), id: 'e1', source: 'text-1', target: 'text-1', sourceHandle: 'text-1-output', targetHandle: 'text-1-idea' },
    ],
  },
];
