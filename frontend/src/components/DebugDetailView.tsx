import { useState } from 'react';

interface ApiLog {
  method: string;
  url: string;
  params?: unknown;
  status: number;
  timestamp: number;
  duration: number;
  responseBody: unknown;
  responseSize: number;
  contentType?: string;
}

interface DebugDetailViewProps {
  selectedLog: ApiLog | null;
  activeTab?: 'response' | 'request' | 'metadata';
  onTabChange?: (tab: 'response' | 'request' | 'metadata') => void;
}

type TabType = 'response' | 'request' | 'metadata';

export function DebugDetailView({ selectedLog, activeTab, onTabChange }: DebugDetailViewProps) {
  const [internalTab, setInternalTab] = useState<TabType>('response');
  const [copied, setCopied] = useState(false);

  const currentTab = activeTab ?? internalTab;

  const handleTabClick = (tab: TabType) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const formatJson = (obj: unknown): JSX.Element[] => {
    const json = JSON.stringify(obj, null, 2);
    const lines = json.split('\n');

    return lines.map((line, index) => {
      const elements: JSX.Element[] = [];
      let remainingLine = line;

      // Match JSON keys (property names)
      const keyRegex = /"([^"]+)":/g;
      let match;
      let lastIndex = 0;

      while ((match = keyRegex.exec(line)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
          elements.push(
            <span key={`${index}-text-${lastIndex}`}>
              {line.substring(lastIndex, match.index)}
            </span>
          );
        }

        // Add the key with purple color
        elements.push(
          <span key={`${index}-key-${match.index}`} className="text-purple-400 json-key">
            "{match[1]}"
          </span>
        );
        elements.push(<span key={`${index}-colon-${match.index}`}>:</span>);

        lastIndex = match.index + match[0].length;
      }

      // Process the rest of the line for values
      remainingLine = line.substring(lastIndex);

      // Match string values
      const stringRegex = /: (".+?")/g;
      const stringMatches: { value: string; index: number }[] = [];
      let stringMatch;

      while ((stringMatch = stringRegex.exec(line)) !== null) {
        stringMatches.push({
          value: stringMatch[1],
          index: stringMatch.index + 2, // +2 to skip ": "
        });
      }

      // Match number values
      const numberRegex = /: (-?\d+\.?\d*)/g;
      const numberMatches: { value: string; index: number }[] = [];
      let numberMatch;

      while ((numberMatch = numberRegex.exec(line)) !== null) {
        numberMatches.push({
          value: numberMatch[1],
          index: numberMatch.index + 2,
        });
      }

      // If we have keys, rebuild the rest
      if (elements.length > 0) {
        const restParts: JSX.Element[] = [];
        let restLastIndex = 0;

        // Combine and sort matches
        const allMatches = [
          ...stringMatches.map(m => ({ ...m, type: 'string' as const })),
          ...numberMatches.map(m => ({ ...m, type: 'number' as const })),
        ].sort((a, b) => a.index - b.index);

        allMatches.forEach((match, idx) => {
          const relativeIndex = match.index - lastIndex;

          if (relativeIndex > restLastIndex) {
            restParts.push(
              <span key={`${index}-rest-${restLastIndex}`}>
                {remainingLine.substring(restLastIndex, relativeIndex)}
              </span>
            );
          }

          const baseClassName = match.type === 'string' ? 'text-amber-400' : 'text-cyan-400';
          const typeClassName = match.type === 'string' ? 'json-string' : 'json-number';
          restParts.push(
            <span key={`${index}-value-${idx}`} className={`${baseClassName} ${typeClassName}`}>
              {match.value}
            </span>
          );

          restLastIndex = relativeIndex + match.value.length;
        });

        if (restLastIndex < remainingLine.length) {
          restParts.push(
            <span key={`${index}-rest-end`}>
              {remainingLine.substring(restLastIndex)}
            </span>
          );
        }

        elements.push(...restParts);
      } else {
        // No keys, just add the whole line
        elements.push(<span key={`${index}-line`}>{line}</span>);
      }

      return <div key={index}>{elements.length > 0 ? elements : <span>{line}</span>}</div>;
    });
  };

  const formatResponseSize = (bytes: number): string => {
    if (bytes >= 1048576) {
      return `${(bytes / 1048576).toFixed(1)} MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${bytes} bytes`;
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const getTabContent = (): string => {
    if (!selectedLog) return '';

    switch (currentTab) {
      case 'response':
        return `// endpoint: ${selectedLog.url}\n${JSON.stringify(selectedLog.responseBody, null, 2)}`;
      case 'request': {
        const params = selectedLog.params
          ? `\n${JSON.stringify(selectedLog.params, null, 2)}`
          : '';
        return `Method: ${selectedLog.method}\nURL: ${selectedLog.url}\nParams:${params}`;
      }
      case 'metadata': {
        const metadata = [
          `Timestamp: ${formatTimestamp(selectedLog.timestamp)}`,
          `Duration: ${selectedLog.duration} ms`,
          `Status: ${selectedLog.status}`,
        ];

        if ('contentType' in selectedLog && selectedLog.contentType) {
          metadata.push(`Content-Type: ${selectedLog.contentType}`);
        }

        metadata.push(`Response Size: ${formatResponseSize(selectedLog.responseSize)}`);

        return metadata.join('\n');
      }
      default:
        return '';
    }
  };

  const handleCopy = async () => {
    const content = getTabContent();
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!selectedLog) {
    return (
      <div
        data-testid="detail-view"
        className="bg-gray-800 rounded-lg p-6 flex items-center justify-center h-full"
      >
        <p className="text-gray-400 text-center">
          Select a log from the list to view details
        </p>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 'response':
        return (
          <div data-testid="response-content" className="bg-gray-950 rounded-lg p-4 font-mono text-sm overflow-auto">
            <div className="text-gray-500 mb-2">// endpoint: {selectedLog.url}</div>
            <div className="text-gray-100">
              {formatJson(selectedLog.responseBody)}
            </div>
          </div>
        );
      case 'request':
        return (
          <div data-testid="request-content" className="bg-gray-900 rounded-lg p-4 space-y-3">
            <div>
              <span className="text-gray-400 font-medium">Method:</span>
              <span className="ml-2 text-gray-100">{selectedLog.method}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium">URL:</span>
              <span className="ml-2 text-gray-100">{selectedLog.url}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium">Params:</span>
              {selectedLog.params ? (
                <pre className="mt-2 text-gray-100 text-sm">
                  {JSON.stringify(selectedLog.params, null, 2)}
                </pre>
              ) : null}
            </div>
          </div>
        );
      case 'metadata':
        return (
          <div data-testid="metadata-content" className="bg-gray-900 rounded-lg p-4 space-y-3">
            <div>
              <span className="text-gray-400 font-medium">Timestamp:</span>
              <span data-testid="request-timestamp" className="ml-2 text-gray-100">{formatTimestamp(selectedLog.timestamp)}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium">Duration:</span>
              <span data-testid="request-duration" className="ml-2 text-gray-100">{selectedLog.duration} ms</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium">Status:</span>
              <span data-testid="status-code" className="ml-2 text-gray-100">{selectedLog.status}</span>
            </div>
            {selectedLog.contentType && (
              <div>
                <span className="text-gray-400 font-medium">Content-Type:</span>
                <span data-testid="content-type" className="ml-2 text-gray-100">{selectedLog.contentType}</span>
              </div>
            )}
            <div>
              <span className="text-gray-400 font-medium">Response Size:</span>
              <span data-testid="response-size" className="ml-2 text-gray-100">{formatResponseSize(selectedLog.responseSize)}</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      data-testid="detail-view"
      className="bg-gray-800 rounded-lg p-4 flex flex-col gap-4 h-full"
    >
      <div className="flex items-center justify-between border-b border-gray-700 pb-3">
        <div className="flex gap-2" role="tablist">
          <button
            data-testid="tab-response"
            role="tab"
            aria-selected={currentTab === 'response'}
            onClick={() => handleTabClick('response')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentTab === 'response'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Response
          </button>
          <button
            data-testid="tab-request"
            role="tab"
            aria-selected={currentTab === 'request'}
            onClick={() => handleTabClick('request')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentTab === 'request'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Request
          </button>
          <button
            data-testid="tab-metadata"
            role="tab"
            aria-selected={currentTab === 'metadata'}
            onClick={() => handleTabClick('metadata')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentTab === 'metadata'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Metadata
          </button>
        </div>

        <button
          data-testid="copy-button"
          onClick={handleCopy}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-md transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {renderTabContent()}
      </div>
    </div>
  );
}
