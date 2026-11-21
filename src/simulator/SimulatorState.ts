import { QubitState } from "../quantum/QubitState";
import { apply } from "../quantum/Matrix2";
import type { Matrix2 } from "../quantum/Matrix2";

export const MAX_STATES = 4;
export const DEFAULT_STATE_COLORS = ["#22D3EE", "#FB923C", "#C084FC", "#4ADE80"] as const;

export type SimulatorMode = "shared" | "individual";

export type GateParameter = {
  kind: "P" | "Rx" | "Ry" | "Rz";
  angle: number; // radián
};

export type GateStep = {
  id: string;
  label: string;
  matrix: Matrix2;
  parameter?: GateParameter;
};

export type TrackedState = {
  id: number;
  color: string;
  initialState: QubitState;
  visible: boolean;
  individualGates: GateStep[];
  individualStepIndex: number;
};

export type SimulatorState = {
  mode: SimulatorMode;
  states: TrackedState[];
  sharedGates: GateStep[];
  sharedStepIndex: number;
  gateEditRevision: number;
};

export function getCurrentState(tracked: TrackedState, simulator: SimulatorState): QubitState {
  const gates = simulator.mode === "shared" ? simulator.sharedGates : tracked.individualGates;
  const stepIndex = simulator.mode === "shared" ? simulator.sharedStepIndex : tracked.individualStepIndex;

  return gates.slice(0, stepIndex).reduce((state, gate) => apply(gate.matrix, state), tracked.initialState);
}

export function createInitialSimulatorState(): SimulatorState {
  return {
    mode: "shared",
    states: [
      {
        id: 1,
        color: DEFAULT_STATE_COLORS[0],
        initialState: QubitState.zero(),
        visible: true,
        individualGates: [],
        individualStepIndex: 0,
      },
    ],
    sharedGates: [],
    sharedStepIndex: 0,
    gateEditRevision: 0,
  };
}
