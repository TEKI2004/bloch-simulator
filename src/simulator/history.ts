import { Vector3 } from "three";
import { apply } from "../quantum/Matrix2";
import { toBlochVector } from "../quantum/bloch";
import type { BlochVector } from "../quantum/bloch";
import type { QubitState } from "../quantum/QubitState";
import { getGateRotation } from "../quantum/gateRotation";
import type { GateStep } from "./SimulatorState";

export type HistorySegment = {
  gateId: string;
  points: BlochVector[];
};

const SEGMENTS = 64;

export function getHistorySegments(initialState: QubitState, gates: GateStep[], stepIndex: number): HistorySegment[] {
  const history: HistorySegment[] = [];
  let state = initialState;

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
