import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebugContext, ApiLog } from '../contexts/DebugContext';
import { DebugDetailView } from './DebugDetailView';

export function DebugPage() {
  const navigate = useNavigate();
  const { logs } = useDebugContext();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedLog: ApiLog | null =
    selectedIndex !== null && selectedIndex < logs.length
      ? logs[selectedIndex]
      : null;

  return (
    <div data-testid="debug-page">
      <div className="flex items-center gap-3 mb-6">
        <button
          data-testid="debug-back-button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 data-testid="debug-page-title" className="text-2xl font-bold">Debug</h1>
      </div>
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
      <div data-testid="debug-right-panel" className="flex-1 border border-gray-200 rounded-lg bg-white overflow-hidden">
        <DebugDetailView entry={selectedLog} />
      </div>
      </div>
    </div>
  );
}
