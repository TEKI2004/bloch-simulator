import { useLayoutEffect, useRef, useState } from "react";

import type { HistorySegment } from "../simulator/history";
import type {
  GateStep,
  SimulatorMode,
  VisualTransition,
} from "../simulator/SimulatorState";

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
  visualTransition: VisualTransition;
};

/** Only Next/Previous/Play draw the *actual* gate arc incrementally.
 * Editing, resetting, jumping and changing modes recalculate history
 * directly: a shortest-arc visual transition isn't a physical gate path.
 */
export function useHistoryTransition(snapshot: HistorySnapshot): HistoryTransition | null {
  const previous = useRef(snapshot);
  const [transition, setTransition] = useState<HistoryTransition | null>(null);
  const { segments, gates, stepIndex, mode, gateEditRevision, visualTransition } = snapshot;

  useLayoutEffect(() => {
    const prev = previous.current;
    const difference = stepIndex - prev.stepIndex;
    const circuitChanged = prev.gates !== gates || prev.gateEditRevision !== gateEditRevision;
    const stateChanged =
      prev.segments !== segments ||
      difference !== 0 ||
      prev.mode !== mode ||
      circuitChanged;

    const physicalStep =
      prev.visualTransition.revision !== visualTransition.revision &&
      visualTransition.kind === "step" &&
      prev.mode === mode &&
      !circuitChanged &&
      Math.abs(difference) === 1;

    if (physicalStep && difference === 1) {
      const added = segments.find((segment) =>
        !prev.segments.some((old) => old.gateId === segment.gateId),
      );
      setTransition(added ? { segment: added, reverse: false } : null);
    } else if (physicalStep && difference === -1) {
      const removed = prev.segments.find((segment) =>
        !segments.some((current) => current.gateId === segment.gateId),
      );
      setTransition(removed ? { segment: removed, reverse: true } : null);
    } else if (stateChanged) {
      setTransition(null);
    }
    // Presentation-only updates (e.g. a color change) do not interrupt
    // the animated history segment already in progress.
    previous.current = {
      segments,
      gates,
      stepIndex,
      mode,
      gateEditRevision,
      visualTransition,
    };
  }, [segments, gates, stepIndex, mode, gateEditRevision, visualTransition]);

  return transition;
}
