import { useState, useEffect, useRef, useCallback } from 'react';
import { PodDetails, fetchPodLogs, streamPodLogs } from '../api/pods';
import { StatusBadge } from './StatusBadge';

interface PodLogPanelProps {
  pod: PodDetails;
  onClose: () => void;
}

const DEFAULT_TAIL_LINES = 100;

function getLineClass(line: string): string {
  if (line.includes('ERROR')) return 'text-red-400';
  if (line.includes('WARN')) return 'text-amber-400';
  return 'text-gray-300';
}

export function PodLogPanel({ pod, onClose }: PodLogPanelProps) {
  const [selectedContainer, setSelectedContainer] = useState<string>(
    pod.containers?.[0] ?? ''
  );
  const [logLines, setLogLines] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const cleanupRef = useRef<(() => void) | null>(null);
  const logViewerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);
  const logLineKeyRef = useRef(0);

  // Stop streaming helper
  const stopStreaming = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    setIsFollowing(false);
  }, []);

  // Auto-scroll to bottom when following and new logs arrive
  useEffect(() => {
    if (isFollowing && autoScrollRef.current && logViewerRef.current) {
      logViewerRef.current.scrollTop = logViewerRef.current.scrollHeight;
    }
  }, [logLines, isFollowing]);

  // Detect manual scroll to pause auto-scroll
  const handleScroll = useCallback(() => {
    const el = logViewerRef.current;
    if (!el || !isFollowing) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
    autoScrollRef.current = atBottom;
  }, [isFollowing]);

  // Fetch logs when pod or container changes
  useEffect(() => {
    // Stop any ongoing stream when pod/container changes
    stopStreaming();

    setIsLoading(true);
    setError(null);
    setLogLines([]);
    logLineKeyRef.current = 0;

    fetchPodLogs(pod.namespace, pod.name, selectedContainer, DEFAULT_TAIL_LINES)
      .then((text) => {
        const lines = text ? text.split('\n') : [];
        logLineKeyRef.current = lines.length;
        setLogLines(lines);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message || 'Failed to fetch logs');
        setIsLoading(false);
      });
  }, [pod.namespace, pod.name, selectedContainer, stopStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  const handleContainerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedContainer(e.target.value);
  };

  const handleFollowToggle = () => {
    if (isFollowing) {
      stopStreaming();
    } else {
      setIsFollowing(true);
      autoScrollRef.current = true;
      const cleanup = streamPodLogs(
        pod.namespace,
        pod.name,
        (line: string) => {
          logLineKeyRef.current += 1;
          setLogLines((prev) => [...prev, line]);
        },
        selectedContainer,
        DEFAULT_TAIL_LINES,
      );
      cleanupRef.current = cleanup;
    }
  };

  const handleClose = () => {
    stopStreaming();
    onClose();
  };

  return (
    <div data-testid="log-panel" className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        data-testid="log-panel-backdrop"
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative z-10 flex flex-col w-full max-w-3xl bg-gray-900 shadow-xl h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-4 min-w-0">
            <h2 data-testid="log-panel-title" className="text-lg font-semibold text-white shrink-0">
              Pod Logs
            </h2>
            <div data-testid="log-panel-pod-info" className="text-sm text-gray-400 truncate">
              <span>{pod.namespace}</span>
              <span className="mx-1">/</span>
              <span>{pod.name}</span>
            </div>
            <StatusBadge status={pod.status} testId="status-badge" />
          </div>
          <button
            data-testid="log-panel-close-button"
            onClick={handleClose}
            className="text-gray-400 hover:text-white ml-4 shrink-0"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-700 bg-gray-800">
          <select
            data-testid="log-panel-container-selector"
            value={selectedContainer}
            onChange={handleContainerChange}
            className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
          >
            {(pod.containers ?? []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            data-testid="log-panel-follow-button"
            onClick={handleFollowToggle}
            className={`text-sm px-3 py-1 rounded border ${
              isFollowing
                ? 'bg-blue-600 border-blue-500 text-white animate-pulse'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:text-white'
            }`}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        </div>

        {/* Log Viewer */}
        <div
          ref={logViewerRef}
          data-testid="log-panel-log-viewer"
          className="flex-1 overflow-auto bg-gray-950 px-6 py-4 font-mono text-xs"
          onScroll={handleScroll}
        >
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-400">
              <div
                role="status"
                className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"
              />
              <span>Loading logs for {selectedContainer}...</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="text-red-400">
              Error: {error}
            </div>
          )}

          {!isLoading && !error && logLines.length === 0 && (
            <div className="text-gray-500">
              No logs available for container {selectedContainer}
            </div>
          )}

          {!isLoading && !error && logLines.length > 0 && logLines.map((line, idx) => (
            <div key={`log-${idx}`} className={getLineClass(line)}>
              {line}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          data-testid="log-panel-footer"
          className="flex items-center justify-between px-6 py-3 border-t border-gray-700 bg-gray-800 text-xs text-gray-400"
        >
          <div>
            {isFollowing && (
              <span
                data-testid="log-panel-streaming-indicator"
                className="flex items-center gap-1 text-green-400"
              >
                <span className="animate-pulse h-2 w-2 rounded-full bg-green-400 inline-block" />
                Streaming live
              </span>
            )}
          </div>
          <div>{logLines.length} lines</div>
        </div>
      </div>
    </div>
  );
}
