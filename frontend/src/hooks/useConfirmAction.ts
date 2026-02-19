import { useState, useCallback } from 'react';

interface ConfirmActionTarget {
  name: string;
  namespace: string;
}

export interface UseConfirmActionReturn<T extends ConfirmActionTarget> {
  target: T | null;
  showDialog: boolean;
  isProcessing: boolean;
  error: string | null;
  requestAction: (item: T) => void;
  confirm: () => Promise<void>;
  cancel: () => void;
}

export function useConfirmAction<T extends ConfirmActionTarget>(
  action: (target: T) => Promise<void>,
  onSuccess: () => void,
  errorMessage: string,
): UseConfirmActionReturn<T> {
  const [target, setTarget] = useState<T | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestAction = useCallback((item: T) => {
    setTarget(item);
    setShowDialog(true);
    setError(null);
  }, []);

  const confirm = useCallback(async () => {
    if (!target) return;

    try {
      setIsProcessing(true);
      setError(null);
      await action(target);
      setShowDialog(false);
      setTarget(null);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [target, action, onSuccess, errorMessage]);

  const cancel = useCallback(() => {
    if (!isProcessing) {
      setShowDialog(false);
      setTarget(null);
      setError(null);
    }
  }, [isProcessing]);

  return { target, showDialog, isProcessing, error, requestAction, confirm, cancel };
}
