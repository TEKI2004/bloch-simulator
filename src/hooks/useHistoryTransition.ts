import { useLayoutEffect, useRef, useState } from "react";

import type { HistorySegment } from "../simulator/history";
import type { GateStep, SimulatorMode } from "../simulator/SimulatorState";

export type HistoryTransition = {
  segment: HistorySegment;
  reverse: boolean;
};

type HistorySnapshot = {
  segments: HistorySegment[];
  gates: GateStep[];
  stepIndex: number;
  mode: SimulatorMode;
  gateEditRevision: number;
};

export function useHistoryTransition({ segments, gates, stepIndex, mode, gateEditRevision }: HistorySnapshot): HistoryTransition | null {
  const previous = useRef<HistorySnapshot>({
    segments,
    gates,
    stepIndex,
    mode,
    gateEditRevision,
  });

  const [transition, setTransition] = useState<HistoryTransition | null>(null);

  useLayoutEffect(() => {
    const prev = previous.current;
    const difference = stepIndex - prev.stepIndex;
    const gatesChanged = prev.gates !== gates;
    const editChanged = prev.gateEditRevision !== gateEditRevision;

    if (editChanged || gatesChanged) {
      // Kapusor szerkesztésekor nincs átmenet
      setTransition(null);
    } else if (prev.mode === mode && difference === 1) {
      // Előrelépés
      const added = segments.find((segment) => !prev.segments.some((old) => old.gateId === segment.gateId));

      setTransition(added ? { segment: added, reverse: false } : null);
    } else if (prev.mode === mode && difference === -1) {
      // Visszalépés
      const removed = prev.segments.find((segment) => !segments.some((current) => current.gateId === segment.gateId));

      setTransition(removed ? { segment: removed, reverse: true } : null);
    } else if (difference !== 0 || prev.mode !== mode) {
      // Reset vagy módváltás
      setTransition(null);
    }

    previous.current = {
      segments,
      gates,
      stepIndex,
      mode,
      gateEditRevision,
    };
  }, [segments, gates, stepIndex, mode, gateEditRevision]);

  return transition;
}
