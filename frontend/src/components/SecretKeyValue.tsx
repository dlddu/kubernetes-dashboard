import { useState } from 'react';

interface SecretKeyValueProps {
  secretKey: string;
  value: string;
}

export function SecretKeyValue({ secretKey, value }: SecretKeyValueProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleRevealToggle = () => {
    setIsRevealed(!isRevealed);
  };

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
    <div data-testid={`secret-key-value-${secretKey}`} className="border-b border-gray-200 last:border-b-0 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-700 mb-1">{secretKey}</div>
          <div className="font-mono text-sm break-all">
            {isRevealed ? (
              <pre data-testid="secret-value-revealed" className="whitespace-pre-wrap text-gray-900">
                {value}
              </pre>
            ) : (
              <div data-testid="secret-value-masked" className="text-gray-400">
                ••••••••••••••••
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleRevealToggle}
            data-testid={isRevealed ? 'hide-button' : 'reveal-button'}
            aria-label={isRevealed ? `Hide ${secretKey} value` : `Reveal ${secretKey} value`}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            {isRevealed ? 'Hide' : 'Reveal'}
          </button>
          <button
            onClick={handleCopy}
            data-testid="copy-button"
            aria-label={`Copy ${secretKey} value to clipboard`}
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
