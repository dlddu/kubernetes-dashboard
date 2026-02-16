import { useState } from 'react';
import type { ApiLog } from '../contexts/DebugContext';

interface Props {
  entry: ApiLog | null;
}

type TabName = 'response' | 'request' | 'metadata';

export function DebugDetailView({ entry }: Props) {
  const [activeTab, setActiveTab] = useState<TabName>('response');
  const [copied, setCopied] = useState(false);

  if (!entry) {
    return (
      <div data-testid="detail-view" className="flex items-center justify-center h-full text-gray-400">
        <p>Select an endpoint to view details</p>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      let content = '';

      if (activeTab === 'response') {
        content = JSON.stringify(entry.responseBody, null, 2);
      } else if (activeTab === 'request') {
        content = `Method: ${entry.method}\nURL: ${entry.url}`;
        if (entry.params) {
          content += `\nParams: ${JSON.stringify(entry.params, null, 2)}`;
        }
      } else {
        content = `Status: ${entry.status}\nTimestamp: ${new Date(entry.timestamp).toISOString()}\nDuration: ${Math.round(entry.duration)} ms\nResponse Size: ${entry.responseSize} bytes\nContent-Type: application/json`;
      }

      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      // Handle clipboard errors gracefully
    }
  };

  const renderJsonValue = (value: unknown, indent: number = 0): React.ReactNode => {
    if (value === null) {
      return <span className="json-null text-gray-400">null</span>;
    }
    if (typeof value === 'boolean') {
      return <span className="json-boolean text-cyan-400">{String(value)}</span>;
    }
    if (typeof value === 'number') {
      return <span className="json-number text-cyan-400">{value}</span>;
    }
    if (typeof value === 'string') {
      return <span className="json-string text-amber-400">&quot;{value}&quot;</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return <span>[]</span>;
      return (
        <>
          {'[\n'}
          {value.map((item, i) => (
            <span key={i}>
              {'  '.repeat(indent + 1)}
              {renderJsonValue(item, indent + 1)}
              {i < value.length - 1 ? ',\n' : '\n'}
            </span>
          ))}
          {'  '.repeat(indent)}{']'}
        </>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) return <span>{'{}'}</span>;
      return (
        <>
          {'{\n'}
          {entries.map(([key, val], i) => (
            <span key={key}>
              {'  '.repeat(indent + 1)}
              <span className="json-key text-purple-400">&quot;{key}&quot;</span>
              {': '}
              {renderJsonValue(val, indent + 1)}
              {i < entries.length - 1 ? ',\n' : '\n'}
            </span>
          ))}
          {'  '.repeat(indent)}
          {'}'}
        </>
      );
    }

    return String(value);
  };

  const renderResponseTab = () => {
    const comment = `// ${entry.method} ${entry.url}`;

    return (
      <div data-testid="response-content" className="bg-gray-950 p-4 rounded font-mono text-sm overflow-auto">
        <div className="text-gray-500 mb-2">{comment}</div>
        <pre className="whitespace-pre text-white">
          {renderJsonValue(entry.responseBody)}
        </pre>
      </div>
    );
  };

  const renderRequestTab = () => {
    return (
      <div data-testid="request-content" className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Method</h3>
          <p data-testid="http-method" className="text-sm font-mono">{entry.method}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">URL</h3>
          <p data-testid="request-url" className="text-sm font-mono">{entry.url}</p>
        </div>
        {entry.params ? (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Params</h3>
            <pre className="text-sm font-mono whitespace-pre-wrap bg-gray-50 p-4 rounded">
              {JSON.stringify(entry.params, null, 2)}
            </pre>
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Params</h3>
            <p className="text-sm text-gray-400">No parameters</p>
          </div>
        )}
      </div>
    );
  };

  const renderMetadataTab = () => {
    return (
      <div data-testid="metadata-content" className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Status</h3>
          <p data-testid="status-code" className="text-sm font-mono">{entry.status}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Timestamp</h3>
          <p data-testid="request-timestamp" className="text-sm font-mono">{new Date(entry.timestamp).toISOString()}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Duration</h3>
          <p data-testid="request-duration" className="text-sm font-mono">{Math.round(entry.duration)} ms</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Response Size</h3>
          <p className="text-sm font-mono">{entry.responseSize} bytes</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Content-Type</h3>
          <p className="text-sm font-mono">application/json</p>
        </div>
      </div>
    );
  };

  return (
    <div data-testid="detail-view" className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 items-center gap-2 px-4">
        <div role="tablist" className="flex flex-1">
          <button
            data-testid="tab-response"
            role="tab"
            aria-selected={activeTab === 'response'}
            onClick={() => setActiveTab('response')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'response'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Response
          </button>
          <button
            data-testid="tab-request"
            role="tab"
            aria-selected={activeTab === 'request'}
            onClick={() => setActiveTab('request')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'request'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Request
          </button>
          <button
            data-testid="tab-metadata"
            role="tab"
            aria-selected={activeTab === 'metadata'}
            onClick={() => setActiveTab('metadata')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'metadata'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Metadata
          </button>
        </div>

        {/* Copy button */}
        <button
          data-testid="copy-button"
          aria-label="Copy to clipboard"
          onClick={handleCopy}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Tab content */}
      <div role="tabpanel" className="flex-1 overflow-auto p-4">
        {activeTab === 'response' && renderResponseTab()}
        {activeTab === 'request' && renderRequestTab()}
        {activeTab === 'metadata' && renderMetadataTab()}
      </div>
    </div>
  );
}
