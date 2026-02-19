import { useEffect } from 'react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  resourceName: string;
  resourceNamespace: string;
  description: string;
  warning?: string;
  confirmLabel: string;
  confirmingLabel: string;
  confirmColor: 'blue' | 'red';
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
  error?: string;
  testId?: string;
}

const confirmColorClasses = {
  blue: {
    active: 'bg-blue-600 text-white hover:bg-blue-700',
    disabled: 'bg-blue-400 text-white cursor-not-allowed',
  },
  red: {
    active: 'bg-red-600 text-white hover:bg-red-700',
    disabled: 'bg-red-400 text-white cursor-not-allowed',
  },
};

export function ConfirmDialog({
  isOpen,
  title,
  resourceName,
  resourceNamespace,
  description,
  warning,
  confirmLabel,
  confirmingLabel,
  confirmColor,
  onConfirm,
  onCancel,
  isProcessing = false,
  error,
  testId = 'confirm-dialog',
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isProcessing) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, isProcessing, onCancel]);

  if (!isOpen) {
    return (
      <div
        data-testid={testId}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    );
  }

  const colors = confirmColorClasses[confirmColor];

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => !isProcessing && onCancel()}
        aria-hidden="true"
      />

      <div
        data-testid={testId}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
          <h2 id="dialog-title" className="text-xl font-bold text-gray-900">
            {title}
          </h2>

          <div className="text-gray-700">
            <p>{description}</p>
            <p className="font-semibold mt-2">
              {resourceName} <span className="text-gray-500">({resourceNamespace})</span>
            </p>
            {warning && (
              <p className={`text-sm mt-2 ${confirmColor === 'red' ? 'text-red-600' : 'text-gray-600'}`}>
                {warning}
              </p>
            )}
          </div>

          {error && (
            <div
              data-testid="error-message"
              role="alert"
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              data-testid="cancel-button"
              onClick={onCancel}
              disabled={isProcessing}
              className={`px-4 py-2 rounded transition-colors ${
                isProcessing
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              data-testid="confirm-button"
              onClick={onConfirm}
              disabled={isProcessing}
              aria-busy={isProcessing}
              className={`px-4 py-2 rounded transition-colors ${
                isProcessing ? colors.disabled : colors.active
              }`}
            >
              {isProcessing ? confirmingLabel : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
