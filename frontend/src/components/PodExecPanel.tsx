import { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { PodDetails, buildExecWebSocketURL } from '../api/pods';
import { StatusBadge } from './StatusBadge';

interface PodExecPanelProps {
  pod: PodDetails;
  onClose: () => void;
  initialContainer?: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export function PodExecPanel({ pod, onClose, initialContainer }: PodExecPanelProps) {
  const [selectedContainer, setSelectedContainer] = useState<string>(
    initialContainer ?? pod.containers?.[0] ?? ''
  );
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [pasted, setPasted] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (xtermRef.current) {
      xtermRef.current.dispose();
      xtermRef.current = null;
    }
    fitAddonRef.current = null;
  }, []);

  const connect = useCallback(() => {
    cleanup();
    setStatus('connecting');

    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0a0a0a',
        foreground: '#e5e5e5',
        cursor: '#e5e5e5',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Fit after a frame to ensure the container has dimensions.
    requestAnimationFrame(() => {
      fitAddon.fit();
    });

    const url = buildExecWebSocketURL(pod.namespace, pod.name, selectedContainer);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      // Send initial resize.
      ws.send(JSON.stringify({
        type: 'resize',
        cols: term.cols,
        rows: term.rows,
      }));
      term.focus();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'stdout' || msg.type === 'stderr') {
          term.write(msg.data);
        } else if (msg.type === 'error') {
          term.write(`\r\n\x1b[31mError: ${msg.data}\x1b[0m\r\n`);
        } else if (msg.type === 'exit') {
          term.write(`\r\n\x1b[33mProcess exited.\x1b[0m\r\n`);
          setStatus('disconnected');
        }
      } catch {
        // Ignore non-JSON messages.
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
    };

    ws.onerror = () => {
      setStatus('disconnected');
    };

    // Send keystrokes to the server.
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stdin', data }));
      }
    });

    // Send resize events.
    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    });
  }, [pod.namespace, pod.name, selectedContainer, cleanup]);

  // Connect on mount and when container changes.
  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  // Handle window resize.
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleContainerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedContainer(e.target.value);
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const handlePaste = async () => {
    setPasteError(null);
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!navigator.clipboard?.readText) {
      setPasteError('Clipboard API is not available in this browser.');
      setTimeout(() => setPasteError(null), 5000);
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      ws.send(JSON.stringify({ type: 'stdin', data: text }));
      xtermRef.current?.focus();
      setPasted(true);
      setTimeout(() => setPasted(false), 1500);
    } catch (err) {
      const reason = err instanceof Error && err.message ? err.message : 'Unable to read clipboard.';
      setPasteError(`Paste failed: ${reason}`);
      setTimeout(() => setPasteError(null), 5000);
    }
  };

  const statusColor = {
    connecting: 'text-yellow-400',
    connected: 'text-green-400',
    disconnected: 'text-red-400',
  }[status];

  const statusDotColor = {
    connecting: 'bg-yellow-400',
    connected: 'bg-green-400',
    disconnected: 'bg-red-400',
  }[status];

  const statusLabel = {
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
  }[status];

  return (
    <div data-testid="exec-panel" className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        data-testid="exec-panel-backdrop"
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative z-10 flex flex-col w-full max-w-3xl bg-gray-900 shadow-xl h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-4 min-w-0">
            <h2 data-testid="exec-panel-title" className="text-lg font-semibold text-white shrink-0">
              Pod Shell
            </h2>
            <div data-testid="exec-panel-pod-info" className="text-sm text-gray-400 truncate">
              <span>{pod.namespace}</span>
              <span className="mx-1">/</span>
              <span>{pod.name}</span>
            </div>
            <StatusBadge status={pod.status} testId="status-badge" />
          </div>
          <button
            data-testid="exec-panel-close-button"
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
            data-testid="exec-panel-container-selector"
            value={selectedContainer}
            onChange={handleContainerChange}
            className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
          >
            {(pod.initContainers ?? []).length > 0 && (
              <optgroup label="Init Containers">
                {pod.initContainers.map((c) => (
                  <option key={`init-${c}`} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Containers">
              {(pod.containers ?? []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </optgroup>
            {(pod.ephemeralContainers ?? []).length > 0 && (
              <optgroup label="Ephemeral Containers">
                {pod.ephemeralContainers!.map((c) => (
                  <option key={`eph-${c}`} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          <button
            data-testid="exec-panel-paste-button"
            onClick={handlePaste}
            disabled={status !== 'connected'}
            title="Paste clipboard contents into the shell"
            className={`text-sm px-3 py-1 rounded border ${
              pasted
                ? 'bg-green-600 border-green-500 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {pasted ? 'Pasted!' : 'Paste'}
          </button>

          <button
            data-testid="exec-panel-reconnect-button"
            onClick={connect}
            className="text-sm px-3 py-1 rounded border bg-gray-700 border-gray-600 text-gray-300 hover:text-white"
          >
            Reconnect
          </button>

          {pasteError && (
            <span
              data-testid="exec-panel-paste-error"
              role="alert"
              title={pasteError}
              className="text-xs text-red-400 truncate max-w-xs"
            >
              {pasteError}
            </span>
          )}
        </div>

        {/* Terminal */}
        <div
          ref={terminalRef}
          data-testid="exec-panel-terminal"
          className="flex-1 overflow-hidden bg-[#0a0a0a] px-2 py-2"
        />

        {/* Footer */}
        <div
          data-testid="exec-panel-footer"
          className="flex items-center justify-between px-6 py-3 border-t border-gray-700 bg-gray-800 text-xs text-gray-400"
        >
          <span
            data-testid="exec-panel-status"
            className={`flex items-center gap-1 ${statusColor}`}
          >
            <span className={`h-2 w-2 rounded-full inline-block ${statusDotColor} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
            {statusLabel}
          </span>
          <span>/bin/sh</span>
        </div>
      </div>
    </div>
  );
}
