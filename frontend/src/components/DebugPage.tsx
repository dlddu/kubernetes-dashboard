import { useState } from 'react';
import { useDebugContext, ApiLog } from '../contexts/DebugContext';

type TabName = 'response' | 'request' | 'metadata';

export function DebugPage() {
  const { logs } = useDebugContext();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>('response');

  const selectedLog: ApiLog | null =
    selectedIndex !== null && selectedIndex < logs.length
      ? logs[selectedIndex]
      : null;

  return (
    <div data-testid="debug-page">
      <h1 data-testid="debug-page-title" className="text-2xl font-bold mb-6">Debug</h1>
      <div className="flex gap-4 h-[calc(100vh-200px)]">
      {/* Left panel - endpoint list */}
      <div
        data-testid="debug-left-panel"
        className="w-1/3 border border-gray-200 rounded-lg overflow-y-auto bg-white"
      >
        <div data-testid="endpoint-list" role="list">
          {logs.length === 0 ? (
            <div data-testid="debug-empty-state" className="text-center py-8 text-gray-500">
              <p className="text-lg font-medium">No API calls recorded</p>
              <p className="mt-2">Navigate to other pages to see API logs.</p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                role="listitem"
                data-testid="endpoint-item"
                onClick={() => {
                  setSelectedIndex(index);
                  setActiveTab('response');
                }}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedIndex === index ? 'bg-cyan-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-600">
                    {log.method}
                  </span>
                  <span
                    data-testid="status-code"
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      log.status < 400
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
                <div className="text-sm text-gray-700 mt-1 font-mono truncate">
                  {log.url}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {Math.round(log.duration)}ms
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel - detail view */}
      <div data-testid="debug-right-panel" className="flex-1 border border-gray-200 rounded-lg bg-white overflow-hidden flex flex-col">
        {selectedLog ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-200" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'response'}
                onClick={() => setActiveTab('response')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'response'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Response
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'request'}
                onClick={() => setActiveTab('request')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'request'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Request
              </button>
              <button
                role="tab"
                data-testid="metadata-tab"
                aria-selected={activeTab === 'metadata'}
                onClick={() => setActiveTab('metadata')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'metadata'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Metadata
              </button>
            </div>

            {/* Tab content */}
            <div role="tabpanel" className="flex-1 overflow-y-auto p-4">
              {activeTab === 'response' && (
                <pre className="text-sm font-mono whitespace-pre-wrap break-all bg-gray-50 p-4 rounded">
                  {JSON.stringify(selectedLog.responseBody, null, 2)}
                </pre>
              )}

              {activeTab === 'request' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Method</h3>
                    <p className="text-sm font-mono">{selectedLog.method}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">URL</h3>
                    <p className="text-sm font-mono">{selectedLog.url}</p>
                  </div>
                  {selectedLog.params != null && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Params</h3>
                      <pre className="text-sm font-mono whitespace-pre-wrap bg-gray-50 p-4 rounded">
                        {JSON.stringify(selectedLog.params, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'metadata' && (
                <div data-testid="metadata-content" className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p data-testid="status-code" className="text-sm font-mono">
                      {selectedLog.status}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Timestamp</h3>
                    <p data-testid="request-timestamp" className="text-sm font-mono">
                      {new Date(selectedLog.timestamp).toISOString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                    <p data-testid="request-duration" className="text-sm font-mono">
                      {Math.round(selectedLog.duration)} ms
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Response Size</h3>
                    <p className="text-sm font-mono">{selectedLog.responseSize} bytes</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>Select an endpoint to view details</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
