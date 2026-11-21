import { useCallback, useEffect, useRef } from "react";

export function useRafCommit<T>(onCommit: (value: T) => void) {
  const callbackRef = useRef(onCommit);
  const pendingRef = useRef<T | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = onCommit;
  }, [onCommit]);

  const flush = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const pending = pendingRef.current;
    pendingRef.current = null;

    if (pending !== null) {
      callbackRef.current(pending);
    }
  }, []);

  const schedule = useCallback((value: T) => {
    pendingRef.current = value;

    // Egy képkockán belül csak egyetlen
    // szimulátorfrissítés történhet.
    if (frameRef.current !== null) return;

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;

      const pending = pendingRef.current;
      pendingRef.current = null;

      if (pending !== null) {
        callbackRef.current(pending);
      }
    });
  }, []);

  const commitNow = useCallback(
    (value: T) => {
      pendingRef.current = value;
      flush();
    },
    [flush],
  );

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      pendingRef.current = null;
    };
  }, []);

  return {
    schedule,
    flush,
    commitNow,
  };
}
