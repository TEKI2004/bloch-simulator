import { toBlochVector } from "../../quantum/bloch";
import type { BlochVector } from "../../quantum/bloch";
import type { QubitState } from "../../quantum/QubitState";
import type { GateStep, SimulatorMode } from "../../simulator/SimulatorState";

export type DisplayState = {
  id: number;
  state: QubitState;
  initialState: QubitState;
  color: string;
  label: string;
  gates: GateStep[];
  stepIndex: number;
  mode: SimulatorMode;
};

export type PreparedVector = {
  vector: DisplayState;
  direction: BlochVector;
  label: string;
  mergedHidden: boolean;
  keepMergedDuringAnimation: boolean;
};

type VectorGroup = {
  direction: BlochVector;
  members: DisplayState[];
};

const MERGE_EPSILON = 1e-5;

function isSameDirection(a: BlochVector, b: BlochVector): boolean {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < MERGE_EPSILON;
}

export function prepareVectors(vectors: DisplayState[], selectedStateId?: number): PreparedVector[] {
  const directions = new Map<number, BlochVector>();
  const groups: VectorGroup[] = [];

  // Bloch-koordináták és csoportok meghatározása
  for (const vector of vectors) {
    const direction = toBlochVector(vector.state);
    directions.set(vector.id, direction);

    const group = groups.find((group) => isSameDirection(group.direction, direction));

    if (group) {
      group.members.push(vector);
    } else {
      groups.push({
        direction,
        members: [vector],
      });
    }
  }

  const prepared: PreparedVector[] = [];

  // Megjelenítési adatok meghatározása
  for (const group of groups) {
    const representative = group.members.find((member) => member.id === selectedStateId) ?? group.members[0];

    const mergedLabel = group.members.map((member) => member.label).join(", ");

    const keepMergedDuringAnimation = group.members.length > 1 && group.members.every((member) => member.mode === "shared");

    for (const vector of group.members) {
      const isRepresentative = vector.id === representative.id;

      prepared.push({
        vector,
        direction: directions.get(vector.id)!,
        label: isRepresentative ? mergedLabel : "",
        mergedHidden: !isRepresentative,
        keepMergedDuringAnimation,
      });
    }
  }

  return prepared;
}
