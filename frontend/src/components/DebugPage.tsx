import { useState } from 'react';
import { useDebugContext, ApiLog } from '../contexts/DebugContext';
import { DebugDetailView } from './DebugDetailView';

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
      <div data-testid="debug-right-panel" className="flex-1">
        <DebugDetailView
          selectedLog={selectedLog}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
      </div>
    </div>
  );
}
