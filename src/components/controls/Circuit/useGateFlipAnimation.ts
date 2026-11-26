import { useCallback, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import type { GateTarget } from "./types";

type DropDestination = {
  target: GateTarget;
  index: number;
};

type GatePosition = {
  left: number;
  top: number;
};

const FLIP_DURATION = 280;
const PREVIEW_INSET = 16;

function capturePositions(root: HTMLElement): Map<string, DOMRect> {
  const positions = new Map<string, DOMRect>();

  root.querySelectorAll<HTMLButtonElement>(".qc-gate[data-gate-id]").forEach((button) => {
    const id = button.dataset.gateId;

    if (id) {
      positions.set(id, button.getBoundingClientRect());
    }
  });

  return positions;
}

function getPlaceholderPosition(root: HTMLElement, destination: DropDestination, gateHeight: number): GatePosition | null {
  const track = root.querySelector<HTMLElement>(`.qc-track[data-row-target="${destination.target}"]`);

  if (!track) return null;

  const slots = track.querySelectorAll<HTMLElement>(":scope > .qc-entry > .qc-drop-slot");

  const slot = slots.item(destination.index);
  if (!slot) return null;

  const rect = slot.getBoundingClientRect();

  return {
    left: rect.left + PREVIEW_INSET,
    top: rect.top + (rect.height - gateHeight) / 2,
  };
}

export function useGateFlipAnimation(rootRef: RefObject<HTMLDivElement | null>, gateEditRevision: number) {
  const beforeRef = useRef<Map<string, DOMRect> | null>(null);

  const movedGateRef = useRef<(GatePosition & { id: string }) | null>(null);

  // Törlésnél 450 ms, normál FLIP-nél 180 ms.
  const animationDurationRef = useRef(FLIP_DURATION);

  // Sorok közötti mozgatásnál a forrássor külön
  // 450 ms-os összehúzódási animációt kap.
  const collapsingSourceRef = useRef<GateTarget | null>(null);

  // Beszúrás és áthelyezés előkészítése.
  const prepareDropCommit = useCallback(
    (movedId?: string, destination?: DropDestination, source?: GateTarget) => {
      const root = rootRef.current;
      if (!root) return;

      const positions = capturePositions(root);

      beforeRef.current = positions;
      movedGateRef.current = null;
      animationDurationRef.current = FLIP_DURATION;

      collapsingSourceRef.current = movedId && destination && source !== undefined && source !== destination.target ? source : null;

      if (movedId && destination) {
        const original = positions.get(movedId);

        if (original) {
          const placeholder = getPlaceholderPosition(root, destination, original.height);

          if (placeholder) {
            movedGateRef.current = {
              id: movedId,
              ...placeholder,
            };
          }
        }
      }

      root.classList.add("qc-drop-committing");
    },
    [rootRef],
  );

  // Egyetlen kapu törlésének előkészítése.
  const prepareGateDeletion = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    beforeRef.current = capturePositions(root);
    movedGateRef.current = null;
    collapsingSourceRef.current = null;

    animationDurationRef.current = FLIP_DURATION;

    root.classList.add("qc-drop-committing");
  }, [rootRef]);

  // React DOM-frissítés utáni FLIP animáció.
  useLayoutEffect(() => {
    const before = beforeRef.current;
    if (!before) return;

    beforeRef.current = null;

    const movedGate = movedGateRef.current;
    movedGateRef.current = null;

    const collapsingSource = collapsingSourceRef.current;
    collapsingSourceRef.current = null;

    const defaultDuration = animationDurationRef.current;

    const root = rootRef.current;
    if (!root) return;

    root.querySelectorAll<HTMLButtonElement>(".qc-gate[data-gate-id]").forEach((button) => {
      const id = button.dataset.gateId;
      if (!id) return;

      const oldRect = before.get(id);
      if (!oldRect) return;

      // Az áthelyezett kapu a placeholderből,
      // a többi kapu a korábbi pozíciójából indul.
      const start = movedGate?.id === id ? movedGate : oldRect;

      const current = button.getBoundingClientRect();

      const dx = start.left - current.left;
      const dy = start.top - current.top;

      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        return;
      }

      // Ellenőrizzük, hogy a kapu a forrássorban van-e.
      const rowTarget = button.closest<HTMLElement>(".qc-row[data-row-target]")?.dataset.rowTarget;

      const isSourceRow = collapsingSource !== null && rowTarget === String(collapsingSource);

      const duration = isSourceRow ? FLIP_DURATION : defaultDuration;

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
          duration,
          easing: "ease-in-out",
        },
      );
    });

    const frame = requestAnimationFrame(() => {
      root.classList.remove("qc-drop-committing");
    });

    return () => cancelAnimationFrame(frame);
  }, [gateEditRevision, rootRef]);

  return {
    prepareDropCommit,
    prepareGateDeletion,
  };
}
