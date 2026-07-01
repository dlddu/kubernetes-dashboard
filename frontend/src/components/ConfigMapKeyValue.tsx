import { useState } from 'react';

interface ConfigMapKeyValueProps {
  configKey: string;
  value: string;
}

export function ConfigMapKeyValue({ configKey, value }: ConfigMapKeyValueProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboardFallback = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        copyToClipboardFallback(value);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      try {
        copyToClipboardFallback(value);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div data-testid={`configmap-key-value-${configKey}`} className="border-b border-gray-200 last:border-b-0 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-700 mb-1">{configKey}</div>
          <pre
            data-testid="configmap-value"
            className="font-mono text-sm whitespace-pre-wrap break-all text-gray-900"
          >
            {value}
          </pre>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleCopy}
            data-testid="copy-button"
            aria-label={`Copy ${configKey} value to clipboard`}
            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
          >
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      {isCopied && (
        <div data-testid="copied-indicator" className="text-xs text-green-600 mt-1 text-right">
          Copied to clipboard
        </div>
      )}
    </div>
  );
}
