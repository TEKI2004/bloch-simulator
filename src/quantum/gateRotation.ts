import type { BlochVector } from "./bloch";
import type { GateStep } from "../simulator/SimulatorState";

export type GateRotation = {
  axis: BlochVector;
  angle: number;
};

export function getGateRotation(gate: GateStep): GateRotation | null {
  if (gate.parameter) {
    const { kind, angle } = gate.parameter;

    switch (kind) {
      case "Rx":
        return { axis: [1, 0, 0], angle };
      case "Ry":
        return { axis: [0, 1, 0], angle };
      case "Rz":
      case "P":
        return { axis: [0, 0, 1], angle };
    }
  }

  switch (gate.label) {
    case "I":
      return null;
    case "X":
      return { axis: [1, 0, 0], angle: Math.PI };
    case "Y":
      return { axis: [0, 1, 0], angle: Math.PI };
    case "Z":
      return { axis: [0, 0, 1], angle: Math.PI };
    case "H":
      return {
        axis: [Math.SQRT1_2, 0, Math.SQRT1_2],
        angle: Math.PI,
      };
    case "S":
      return { axis: [0, 0, 1], angle: Math.PI / 2 };
    case "Sdg":
      return { axis: [0, 0, 1], angle: -Math.PI / 2 };
    case "T":
      return { axis: [0, 0, 1], angle: Math.PI / 4 };
    case "Tdg":
      return { axis: [0, 0, 1], angle: -Math.PI / 4 };
    default:
      throw new Error(`Unknown gate rotation: ${gate.label}`);
  }
}
