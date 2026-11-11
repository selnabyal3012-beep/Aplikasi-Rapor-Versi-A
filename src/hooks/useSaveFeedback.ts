import { useState, useRef, useEffect, useCallback } from 'react';
import { SaveStatus } from '../components/common/SaveStatusIndicator';

export interface UseSaveFeedbackOptions {
  savingDelayMs?: number; // Delay to make 'Saving...' perceptibly smooth (default 400ms)
  savedDurationMs?: number; // Duration to keep 'Saved' visible (default 2600ms)
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export function useSaveFeedback(options: UseSaveFeedbackOptions = {}) {
  const {
    savingDelayMs = 400,
    savedDurationMs = 2600,
    onSuccess,
    onError
  } = options;

  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | undefined>(undefined);
  const timeoutRef = useRef<any>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const triggerSave = useCallback(
    async (saveAction?: () => any | Promise<any>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setStatus('saving');

      try {
        if (saveAction) {
          await Promise.resolve(saveAction());
        }

        // Realistic subtle delay so user visually sees "Saving..." transition
        if (savingDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, savingDelayMs));
        }

        if (mountedRef.current) {
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
            now.getMinutes()
          ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
          setLastSavedTime(timeStr);
          setStatus('saved');
          onSuccess?.();

          timeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              setStatus('idle');
            }
          }, savedDurationMs);
        }
      } catch (err) {
        if (mountedRef.current) {
          setStatus('error');
          onError?.(err);
          timeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              setStatus('idle');
            }
          }, 3000);
        }
        throw err;
      }
    },
    [savingDelayMs, savedDurationMs, onSuccess, onError]
  );

  const resetStatus = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus('idle');
  }, []);

  return {
    status,
    setStatus,
    triggerSave,
    resetStatus,
    lastSavedTime,
    isSaving: status === 'saving',
    isSaved: status === 'saved'
  };
}
