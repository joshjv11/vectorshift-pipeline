import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';

import { InputNode } from './inputNode';
import { LLMNode } from './llmNode';
import { OutputNode } from './outputNode';
import { TextNode } from './textNode';
import { DocumentLoaderNode } from './documentLoaderNode';
import { VectorStoreNode } from './vectorStoreNode';
import { PromptTemplateNode } from './promptTemplateNode';
import { OpenAI_LLMNode } from './openaiLlmNode';
import { OutputParserNode } from './outputParserNode';

const renderInFlow = (ui) =>
  render(<ReactFlowProvider>{ui}</ReactFlowProvider>);

const cases = [
  ['Input', <InputNode id="customInput-1" data={{}} />, 'Input'],
  ['LLM', <LLMNode id="llm-1" data={{}} />, 'LLM'],
  ['Output', <OutputNode id="customOutput-1" data={{}} />, 'Output'],
  ['Text', <TextNode id="text-1" data={{}} />, 'Text'],
  [
    'DocumentLoader',
    <DocumentLoaderNode id="documentLoader-1" data={{}} />,
    'Document Loader',
  ],
  ['VectorStore', <VectorStoreNode id="vectorStore-1" data={{}} />, 'Vector Store'],
  [
    'PromptTemplate',
    <PromptTemplateNode id="promptTemplate-1" data={{}} />,
    'Prompt Template',
  ],
  ['OpenAI_LLM', <OpenAI_LLMNode id="openaiLlm-1" data={{}} />, 'OpenAI LLM'],
  ['OutputParser', <OutputParserNode id="outputParser-1" data={{}} />, 'Output Parser'],
];

describe('node smoke tests', () => {
  test.each(cases)('%s renders its title', (_name, element, title) => {
    renderInFlow(element);
    expect(screen.getByText(title)).toBeInTheDocument();
  });
});

describe('TextNode dynamic variables', () => {
  test('renders a labeled handle per unique {{variable}}', () => {
    renderInFlow(<TextNode id="text-1" data={{ text: '{{a}} {{b}} {{a}}' }} />);
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
    expect(screen.getByText('out')).toBeInTheDocument();
  });
});
