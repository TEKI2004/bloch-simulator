import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent, RefObject } from "react";

import { GATE_OPTIONS } from "../../../simulator/gateCatalog";

import type { GateOption } from "../../../simulator/gateCatalog";

import type { GateTarget } from "./types";

type ActiveMove = {
  target: GateTarget;
  id: string;
  sourceIndex: number;
};

type DropPosition = {
  target: GateTarget;
  index: number;
};

type Props = {
  rootRef: RefObject<HTMLDivElement | null>;

  prepareDropCommit: (movedId?: string, destination?: DropPosition, source?: GateTarget) => void;

  onInsertGate: (target: GateTarget, index: number, gate: GateOption) => void;

  onMoveGate: (source: GateTarget, destination: GateTarget, id: string, index: number) => void;
};

function measureGateWidth(label: string): number {
  const container = document.querySelector(".sim-layout");

  if (!container) return 44;

  const probe = document.createElement("button");

  probe.className = "qc-gate";
  probe.textContent = label;

  probe.style.position = "fixed";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.width = "max-content";

  container.appendChild(probe);

  const width = probe.getBoundingClientRect().width;

  probe.remove();

  return width;
}

function getDropIndexAtX(root: HTMLElement | null, target: GateTarget, x: number): number | null {
  const track = root?.querySelector<HTMLElement>(`.qc-track[data-row-target="${target}"]`);

  if (!track) return null;

  const gates = track.querySelectorAll<HTMLButtonElement>(".qc-gate");

  let position = track.getBoundingClientRect().left;

  for (let i = 0; i < gates.length; i++) {
    position += 16;

    const width = gates[i].getBoundingClientRect().width;

    if (x < position + width / 2) {
      return i;
    }

    position += width;
  }

  return gates.length;
}

function getTargetAtY(root: HTMLElement | null, y: number, fallback: GateTarget): GateTarget {
  const rows = root?.querySelectorAll<HTMLElement>(".qc-row[data-row-target]");

  if (!rows) return fallback;

  for (const row of rows) {
    const rect = row.getBoundingClientRect();

    if (y < rect.top || y > rect.bottom) {
      continue;
    }

    const value = row.dataset.rowTarget;

    if (value === "shared") {
      return "shared";
    }

    const id = Number(value);

    if (Number.isInteger(id)) {
      return id;
    }
  }

  return fallback;
}

function getDropPosition(root: HTMLElement | null, move: ActiveMove, x: number, y: number): DropPosition | null {
  if (!root) return null;

  const element = document.elementFromPoint(x, y);
  const overAddTrack = Boolean(element?.closest(".qc-add-track"));

  let target: GateTarget;

  if (overAddTrack) {
    // A ghost track a legalsó valódi kapusor
    // meghosszabbításaként működik drag közben.
    const rows = root.querySelectorAll<HTMLElement>(".qc-row[data-row-target]");

    const lastRow = rows.item(rows.length - 1);
    const value = lastRow?.dataset.rowTarget;

    if (!value) return null;

    target = value === "shared" ? "shared" : Number(value);

    if (typeof target === "number" && !Number.isInteger(target)) {
      return null;
    }
  } else {
    target = getTargetAtY(root, y, move.target);
  }

  // A vízszintes pozíciót MINDIG
  // az aktuális egér X koordinátája határozza meg.
  const index = getDropIndexAtX(root, target, x);

  if (index === null) return null;

  // Saját pozícióba visszahúzás.
  if (target === move.target && (index === move.sourceIndex || index === move.sourceIndex + 1)) {
    return null;
  }

  return { target, index };
}

export function useCircuitDragDrop({ rootRef, prepareDropCommit, onInsertGate, onMoveGate }: Props) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const [previewGateWidth, setPreviewGateWidth] = useState(44);

  const activeMove = useRef<ActiveMove | null>(null);

  const moveCallbackRef = useRef(onMoveGate);

  useEffect(() => {
    moveCallbackRef.current = onMoveGate;
  }, [onMoveGate]);

  // Globális drag-and-drop:
  // meglévő kapu másik sorba is húzható.
  useEffect(() => {
    function onGlobalDragStart(event: globalThis.DragEvent) {
      if (!(event.target instanceof Element)) {
        return;
      }

      const button = event.target.closest<HTMLButtonElement>("[data-gate-label]");

      if (button?.dataset.gateLabel) {
        setPreviewGateWidth(measureGateWidth(button.dataset.gateLabel));
      }
    }

    function onGlobalDragOver(event: globalThis.DragEvent) {
      const move = activeMove.current;

      if (!move) {
        if (event.dataTransfer?.types.includes("application/x-bloch-gate")) {
          event.preventDefault();

          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "move";
          }
        }

        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const position = getDropPosition(rootRef.current, move, event.clientX, event.clientY);

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }

      const slot = position ? `${position.target}-${position.index}` : null;

      setHoveredSlot((current) => (current === slot ? current : slot));
    }

    function onGlobalDrop(event: globalThis.DragEvent) {
      const move = activeMove.current;
      if (!move) return;

      event.preventDefault();
      event.stopPropagation();

      const position = getDropPosition(rootRef.current, move, event.clientX, event.clientY);

      // Először elmentjük a placeholder és
      // a kapuk jelenlegi pozícióját.
      if (position) {
        prepareDropCommit(move.id, position, move.target);
      }
      activeMove.current = null;
      setHoveredSlot(null);

      // Ezután történik meg a kapusor átrendezése.
      if (position) {
        moveCallbackRef.current(move.target, position.target, move.id, position.index);
      }
    }

    function onGlobalDragEnd() {
      activeMove.current = null;
      setHoveredSlot(null);
    }

    window.addEventListener("dragstart", onGlobalDragStart);

    window.addEventListener("dragover", onGlobalDragOver, true);

    window.addEventListener("drop", onGlobalDrop, true);

    window.addEventListener("dragend", onGlobalDragEnd, true);

    return () => {
      window.removeEventListener("dragstart", onGlobalDragStart);

      window.removeEventListener("dragover", onGlobalDragOver, true);

      window.removeEventListener("drop", onGlobalDrop, true);

      window.removeEventListener("dragend", onGlobalDragEnd, true);
    };
  }, [rootRef, prepareDropCommit]);

  const onPaletteDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>, target: GateTarget) => {
      if (activeMove.current) return;

      event.preventDefault();

      const index = getDropIndexAtX(rootRef.current, target, event.clientX);

      if (index === null) return;

      setHoveredSlot(`${target}-${index}`);

      event.dataTransfer.dropEffect = "move";
    },
    [rootRef],
  );

  const onPaletteDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, target: GateTarget) => {
      if (activeMove.current) return;

      event.preventDefault();

      const index = getDropIndexAtX(rootRef.current, target, event.clientX);

      const label = event.dataTransfer.getData("application/x-bloch-gate");

      const gate = GATE_OPTIONS.find((option) => option.label === label);

      setHoveredSlot(null);

      if (gate && index !== null) {
        prepareDropCommit();
        onInsertGate(target, index, gate);
      }
    },
    [rootRef, prepareDropCommit, onInsertGate],
  );

  const onGateDragStart = useCallback((event: DragEvent<HTMLButtonElement>, target: GateTarget, id: string, index: number) => {
    setPreviewGateWidth(event.currentTarget.getBoundingClientRect().width);

    activeMove.current = {
      target,
      id,
      sourceIndex: index,
    };

    event.dataTransfer.setData("application/x-bloch-move", id);

    event.dataTransfer.effectAllowed = "move";
  }, []);

  const onGateDragEnd = useCallback(() => {
    activeMove.current = null;
    setHoveredSlot(null);
  }, []);

  return {
    hoveredSlot,
    previewGateWidth,
    onPaletteDragOver,
    onPaletteDrop,
    onGateDragStart,
    onGateDragEnd,
  };
}
