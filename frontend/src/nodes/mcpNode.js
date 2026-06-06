import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useNodeField } from '../hooks/useNodeField';
import { fieldGroupClass, fieldLabelClass, inputClass, selectClass } from './nodeStyles';

export const McpNode = ({ id, data, selected }) => {
  const [serverUrl, setServerUrl] = useNodeField(
    id, 'serverUrl', data?.serverUrl ?? 'stdio://local/mcp'
  );
  const [resourceType, setResourceType] = useNodeField(
    id, 'resourceType', data?.resourceType ?? 'database'
  );

  return (
    <BaseNode
      title="MCP Server"
      color="slate"
      nodeType="mcpConnector"
      isSelected={selected}
      style={{ minHeight: 130 }}
      handles={[
        {
          type: 'target', position: Position.Left,
          id: `${id}-query`, label: 'query', style: { top: '50%' },
        },
        {
          type: 'source', position: Position.Right,
          id: `${id}-context`, label: 'context', style: { top: '50%' },
        },
      ]}
    >
      <div className="mb-2 rounded border border-hairline bg-surface/60 p-1.5 text-[9px] font-bold uppercase tracking-widest text-muted text-center">
        Model Context Protocol
      </div>

      <label className={fieldGroupClass}>
        <span className={fieldLabelClass}>Server URI</span>
        <input
          type="text"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          placeholder="stdio://local/mcp"
          className={inputClass}
        />
      </label>

      <label className={fieldGroupClass}>
        <span className={fieldLabelClass}>Resource Type</span>
        <select
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          className={selectClass}
        >
          <option value="database">PostgreSQL / SQL</option>
          <option value="github">GitHub Repo</option>
          <option value="slack">Slack Workspace</option>
          <option value="filesystem">Local Filesystem</option>
        </select>
      </label>
    </BaseNode>
  );
};
