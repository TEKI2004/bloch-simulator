import { Vector3 } from "three";
import { apply } from "../quantum/Matrix2";
import { toBlochVector } from "../quantum/bloch";
import type { BlochVector } from "../quantum/bloch";
import { getGateRotation } from "../quantum/gateRotation";
import type { SimulatorState, TrackedState } from "./SimulatorState";

export type HistorySegment = {
  gateId: string;
  points: BlochVector[];
};

const SEGMENTS = 64;

export function getHistorySegments(tracked: TrackedState, simulator: SimulatorState): HistorySegment[] {
  const gates = simulator.mode === "shared" ? simulator.sharedGates : tracked.individualGates;

  const stepIndex = simulator.mode === "shared" ? simulator.sharedStepIndex : tracked.individualStepIndex;

  const history: HistorySegment[] = [];
  let state = tracked.initialState;

  for (const gate of gates.slice(0, stepIndex)) {
    const rotation = getGateRotation(gate);
    const nextState = apply(gate.matrix, state);

    if (rotation && Math.abs(rotation.angle) > 1e-10) {
      const axis = new Vector3(...rotation.axis).normalize();
      const start = new Vector3(...toBlochVector(state));

      const points: BlochVector[] = [];

      for (let i = 0; i <= SEGMENTS; i++) {
        const angle = (rotation.angle * i) / SEGMENTS;

        const point = start.clone().applyAxisAngle(axis, angle);
        points.push(point.toArray() as BlochVector);
      }

      points[SEGMENTS] = toBlochVector(nextState);

      history.push({
        gateId: gate.id,
        points,
      });
    }

    state = nextState;
  }

  return history;
}
