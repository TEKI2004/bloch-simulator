import type { Matrix2 } from "../quantum/Matrix2";
import type { GateParameter } from "./SimulatorState";
import { X, H, S, T, P, Rx, Ry, Rz } from "../quantum/gates";

export type GateOption = {
  label: string;
  matrix: Matrix2;
  parameter?: GateParameter;
};

export const GATE_OPTIONS: GateOption[] = [
  { label: "X", matrix: X },
  { label: "H", matrix: H },
  { label: "S", matrix: S },
  { label: "T", matrix: T },
  {
    label: "P(90°)",
    matrix: P(Math.PI / 2),
    parameter: { kind: "P", angle: Math.PI / 2 },
  },
  {
    label: "Rx(90°)",
    matrix: Rx(Math.PI / 2),
    parameter: { kind: "Rx", angle: Math.PI / 2 },
  },
  {
    label: "Ry(90°)",
    matrix: Ry(Math.PI / 2),
    parameter: { kind: "Ry", angle: Math.PI / 2 },
  },
  {
    label: "Rz(90°)",
    matrix: Rz(Math.PI / 2),
    parameter: { kind: "Rz", angle: Math.PI / 2 },
  },
];
