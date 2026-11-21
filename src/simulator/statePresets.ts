import { QubitState } from "../quantum/QubitState";

export const STATE_LABELS = ["|ψ₁⟩", "|ψ₂⟩", "|ψ₃⟩", "|ψ₄⟩"] as const;

export const INITIAL_STATE_PRESETS = [
  () => QubitState.zero(),
  () => QubitState.fromAngles(Math.PI / 2, 0),
  () => QubitState.fromAngles(Math.PI / 2, Math.PI / 2),
  () => QubitState.one(),
] as const;
