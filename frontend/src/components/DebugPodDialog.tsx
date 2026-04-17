import { useEffect, useState } from 'react';
import { PodDetails, DebugPodRequest, DebugPodResult } from '../api/pods';

export const DEBUG_IMAGE_PRESETS: { value: string; label: string }[] = [
  { value: 'nicolaka/netshoot:latest', label: 'netshoot (network debugging)' },
  { value: 'busybox:1.36', label: 'busybox (minimal)' },
  { value: 'alpine:3.19', label: 'alpine (minimal + apk)' },
  { value: 'ubuntu:22.04', label: 'ubuntu (full distro)' },
  { value: 'praqma/network-multitool', label: 'network-multitool' },
  { value: 'curlimages/curl:latest', label: 'curl' },
];

const CUSTOM_IMAGE_VALUE = '__custom__';

export interface DebugPodDialogProps {
  isOpen: boolean;
  pod: PodDetails | null;
  onCancel: () => void;
  onSubmit: (request: DebugPodRequest) => Promise<DebugPodResult>;
  testId?: string;
}

export function DebugPodDialog({
  isOpen,
  pod,
  onCancel,
  onSubmit,
  testId = 'debug-pod-dialog',
}: DebugPodDialogProps) {
  const [imageSelection, setImageSelection] = useState<string>(DEBUG_IMAGE_PRESETS[0].value);
  const [customImage, setCustomImage] = useState<string>('');
  const [targetContainer, setTargetContainer] = useState<string>('');
  const [allowPtrace, setAllowPtrace] = useState<boolean>(false);
  const [allowSysAdmin, setAllowSysAdmin] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reset fields each time the dialog (re)opens.
  useEffect(() => {
    if (isOpen) {
      setImageSelection(DEBUG_IMAGE_PRESETS[0].value);
      setCustomImage('');
      setTargetContainer('');
      setAllowPtrace(false);
      setAllowSysAdmin(false);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, pod?.name, pod?.namespace]);

  // Close on Escape unless submitting.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen || !pod) {
    return (
      <div data-testid={testId} style={{ display: 'none' }} aria-hidden="true" />
    );
  }

  const resolvedImage =
    imageSelection === CUSTOM_IMAGE_VALUE ? customImage.trim() : imageSelection;
  const canSubmit = resolvedImage.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        image: resolvedImage,
        targetContainer: targetContainer || undefined,
        allowPtrace: allowPtrace || undefined,
        allowSysAdmin: allowSysAdmin || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start debug container');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => !isSubmitting && onCancel()}
        aria-hidden="true"
      />

      <div
        data-testid={testId}
        role="dialog"
        aria-modal="true"
        aria-labelledby="debug-dialog-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
          <h2 id="debug-dialog-title" className="text-xl font-bold text-gray-900">
            Debug Pod
          </h2>

          <div className="text-sm text-gray-700">
            <p>Inject an ephemeral container into the pod and open a shell.</p>
            <p className="font-semibold mt-2">
              {pod.name} <span className="text-gray-500">({pod.namespace})</span>
            </p>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="debug-image-select"
              className="block text-sm font-medium text-gray-700"
            >
              Debug image
            </label>
            <select
              id="debug-image-select"
              data-testid="debug-image-select"
              value={imageSelection}
              onChange={(e) => setImageSelection(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded border border-gray-300 bg-white text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {DEBUG_IMAGE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
              <option value={CUSTOM_IMAGE_VALUE}>Custom...</option>
            </select>
            {imageSelection === CUSTOM_IMAGE_VALUE && (
              <input
                type="text"
                data-testid="debug-image-custom-input"
                value={customImage}
                onChange={(e) => setCustomImage(e.target.value)}
                placeholder="e.g. myregistry.example.com/debug:latest"
                disabled={isSubmitting}
                className="mt-1 w-full rounded border border-gray-300 text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="debug-target-select"
              className="block text-sm font-medium text-gray-700"
            >
              Target container (for process namespace sharing)
            </label>
            <select
              id="debug-target-select"
              data-testid="debug-target-select"
              value={targetContainer}
              onChange={(e) => setTargetContainer(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded border border-gray-300 bg-white text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">None</option>
              {(pod.containers ?? []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              data-testid="debug-ptrace-checkbox"
              checked={allowPtrace}
              onChange={(e) => setAllowPtrace(e.target.checked)}
              disabled={isSubmitting}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Allow ptrace (SYS_PTRACE)</span>
              <span className="block text-xs text-gray-500">
                Required to follow /proc/&lt;pid&gt;/root and inspect the target container&apos;s filesystem.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              data-testid="debug-sysadmin-checkbox"
              checked={allowSysAdmin}
              onChange={(e) => setAllowSysAdmin(e.target.checked)}
              disabled={isSubmitting}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Allow sys admin (SYS_ADMIN)</span>
              <span className="block text-xs text-gray-500">
                Grants broad privileged operations (mount, setns, etc.). Use with caution.
              </span>
            </span>
          </label>

          {error && (
            <div
              data-testid="debug-pod-error"
              role="alert"
              className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              data-testid="debug-pod-cancel"
              onClick={onCancel}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                isSubmitting
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              data-testid="debug-pod-submit"
              onClick={handleSubmit}
              disabled={!canSubmit}
              aria-busy={isSubmitting}
              className={`px-4 py-2 rounded text-sm text-white transition-colors ${
                canSubmit
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-blue-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Start Debug'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
