import { useCallback, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";

function capturePositions(root: HTMLElement): Map<string, DOMRect> {
  const result = new Map<string, DOMRect>();

  root.querySelectorAll<HTMLButtonElement>(".qc-gate[data-gate-id]").forEach((button) => {
    const id = button.dataset.gateId;

    if (id) {
      result.set(id, button.getBoundingClientRect());
    }
  });

  return result;
}

export function useGateFlipAnimation(rootRef: RefObject<HTMLDivElement | null>, gateEditRevision: number) {
  const beforeRef = useRef<Map<string, DOMRect> | null>(null);

  const movedIdRef = useRef<string | null>(null);

  const prepareDropCommit = useCallback(
    (movedId?: string) => {
      const root = rootRef.current;
      if (!root) return;

      beforeRef.current = capturePositions(root);
      movedIdRef.current = movedId ?? null;

      root.classList.add("qc-drop-committing");
    },
    [rootRef],
  );

  useLayoutEffect(() => {
    const before = beforeRef.current;
    if (!before) return;

    beforeRef.current = null;

    const movedId = movedIdRef.current;
    movedIdRef.current = null;

    const root = rootRef.current;
    if (!root) return;

    root.querySelectorAll<HTMLButtonElement>(".qc-gate[data-gate-id]").forEach((button) => {
      const id = button.dataset.gateId;

      if (!id || id === movedId) return;

      const oldRect = before.get(id);
      if (!oldRect) return;

      const currentRect = button.getBoundingClientRect();

      const dx = oldRect.left - currentRect.left;
      const dy = oldRect.top - currentRect.top;

      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        return;
      }

      button.animate(
        [
          {
            transform: `translate(${dx}px, ${dy}px)`,
          },
          {
            transform: "translate(0px, 0px)",
          },
        ],
        {
          duration: 180,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );
    });

    const frame = requestAnimationFrame(() => {
      root.classList.remove("qc-drop-committing");
    });

    return () => cancelAnimationFrame(frame);
  }, [gateEditRevision, rootRef]);

  return { prepareDropCommit };
}
