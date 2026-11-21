import type { GateStep } from "../../../simulator/SimulatorState";

export type GateTarget = "shared" | number;

export type CircuitRowData = {
  target: GateTarget;
  label: string;
  color: string;
  gates: GateStep[];
  stepIndex: number;
};

export type EditingGate = {
  target: GateTarget;
  gateId: string;
  anchor: HTMLButtonElement;
};
