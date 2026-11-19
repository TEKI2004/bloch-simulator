import { useRef, useState } from "react";
import { QubitState } from "../quantum/QubitState";
import type { Matrix2 } from "../quantum/Matrix2";
import { P, Rx, Ry, Rz } from "../quantum/gates";
import { createInitialSimulatorState, DEFAULT_STATE_COLORS, MAX_STATES } from "../simulator/SimulatorState";
import type { GateParameter, GateStep, SimulatorMode, SimulatorState } from "../simulator/SimulatorState";

type GateTarget = "shared" | number;

const gateFactories: Record<GateParameter["kind"], (angle: number) => Matrix2> = {
  P,
  Rx,
  Ry,
  Rz,
};

// Közös vagy egyéni kapusor módosítása
function editGates(
  current: SimulatorState,
  target: GateTarget,
  edit: (gates: GateStep[]) => GateStep[],
  resetPosition = true,
): SimulatorState {
  if (target === "shared") {
    const gates = edit(current.sharedGates);
    if (gates === current.sharedGates) return current;

    return {
      ...current,
      sharedGates: gates,
      sharedStepIndex: resetPosition ? 0 : current.sharedStepIndex,
    };
  }

  const tracked = current.states.find((state) => state.id === target);
  if (!tracked) return current;

  const gates = edit(tracked.individualGates);
  if (gates === tracked.individualGates) return current;

  return {
    ...current,
    states: current.states.map((state) =>
      state.id === target
        ? {
            ...state,
            individualGates: gates,
            individualStepIndex: resetPosition ? 0 : state.individualStepIndex,
          }
        : state,
    ),
  };
}

export function useSimulator() {
  const [simulator, setSimulator] = useState<SimulatorState>(createInitialSimulatorState);

  const nextGateId = useRef(1);

  function setMode(mode: SimulatorMode) {
    setSimulator((current) => (current.mode === mode ? current : { ...current, mode }));
  }

  function addState(initialState = QubitState.zero()) {
    setSimulator((current) => {
      if (current.states.length >= MAX_STATES) return current;

      const id = Array.from({ length: MAX_STATES }, (_, i) => i + 1).find((id) => !current.states.some((state) => state.id === id));

      if (id === undefined) return current;

      return {
        ...current,
        states: [
          ...current.states,
          {
            id,
            color: DEFAULT_STATE_COLORS[id - 1],
            initialState,
            visible: true,
            individualGates: [],
            individualStepIndex: 0,
          },
        ],
      };
    });
  }

  function removeState(id: number) {
    setSimulator((current) => ({
      ...current,
      states: current.states.filter((state) => state.id !== id),
    }));
  }

  function setInitialState(id: number, initialState: QubitState) {
    const normalized = initialState.normalized();

    setSimulator((current) => ({
      ...current,
      states: current.states.map((state) => (state.id === id ? { ...state, initialState: normalized } : state)),
    }));
  }

  function setStateColor(id: number, color: string) {
    setSimulator((current) => ({
      ...current,
      states: current.states.map((state) => (state.id === id ? { ...state, color } : state)),
    }));
  }

  function addGate(target: GateTarget, label: string, matrix: Matrix2, parameter?: GateParameter) {
    const id = `gate-${nextGateId.current++}`;

    setSimulator((current) => editGates(current, target, (gates) => [...gates, { id, label, matrix, parameter }], false));
  }

  function removeGate(target: GateTarget, id: string) {
    setSimulator((current) => {
      if (target === "shared") {
        const index = current.sharedGates.findIndex((gate) => gate.id === id);

        if (index === -1) return current;

        return {
          ...current,
          sharedGates: current.sharedGates.filter((gate) => gate.id !== id),
          sharedStepIndex: current.sharedStepIndex - (index < current.sharedStepIndex ? 1 : 0),
        };
      }

      const tracked = current.states.find((state) => state.id === target);

      if (!tracked) return current;

      const index = tracked.individualGates.findIndex((gate) => gate.id === id);

      if (index === -1) return current;

      return {
        ...current,
        states: current.states.map((state) =>
          state.id === target
            ? {
                ...state,
                individualGates: state.individualGates.filter((gate) => gate.id !== id),
                individualStepIndex: state.individualStepIndex - (index < state.individualStepIndex ? 1 : 0),
              }
            : state,
        ),
      };
    });
  }

  function moveGate(target: GateTarget, id: string, direction: -1 | 1) {
    setSimulator((current) =>
      editGates(
        current,
        target,
        (gates) => {
          const index = gates.findIndex((gate) => gate.id === id);
          const destination = index + direction;

          if (index === -1 || destination < 0 || destination >= gates.length) {
            return gates;
          }

          const result = [...gates];
          const [gate] = result.splice(index, 1);
          result.splice(destination, 0, gate);

          return result;
        },
        false,
      ),
    );
  }

  function updateGateAngle(target: GateTarget, id: string, degrees: number) {
    if (!Number.isFinite(degrees)) return;

    const angle = (degrees * Math.PI) / 180;

    setSimulator((current) =>
      editGates(
        current,
        target,
        (gates) => {
          if (!gates.some((gate) => gate.id === id && gate.parameter)) {
            return gates;
          }

          return gates.map((gate) => {
            if (gate.id !== id || !gate.parameter) return gate;

            const kind = gate.parameter.kind;

            return {
              ...gate,
              label: `${kind}(${degrees}°)`,
              matrix: gateFactories[kind](angle),
              parameter: { kind, angle },
            };
          });
        },
        false,
      ),
    );
  }

  function clearGates(target: GateTarget) {
    setSimulator((current) => editGates(current, target, (gates) => (gates.length ? [] : gates)));
  }

  function changeStep(target: GateTarget, change: (step: number, length: number) => number) {
    setSimulator((current) => {
      if (target === "shared") {
        const step = Math.max(0, Math.min(current.sharedGates.length, change(current.sharedStepIndex, current.sharedGates.length)));

        if (step === current.sharedStepIndex) return current;

        return { ...current, sharedStepIndex: step };
      }

      return {
        ...current,
        states: current.states.map((state) => {
          if (state.id !== target) return state;

          const step = Math.max(0, Math.min(state.individualGates.length, change(state.individualStepIndex, state.individualGates.length)));

          return { ...state, individualStepIndex: step };
        }),
      };
    });
  }

  function nextStep(target: GateTarget) {
    changeStep(target, (step) => step + 1);
  }

  function previousStep(target: GateTarget) {
    changeStep(target, (step) => step - 1);
  }

  function resetSteps(target: GateTarget) {
    changeStep(target, () => 0);
  }

  return {
    simulator,
    setMode,
    addState,
    removeState,
    setInitialState,
    setStateColor,
    addGate,
    removeGate,
    moveGate,
    updateGateAngle,
    clearGates,
    nextStep,
    previousStep,
    resetSteps,
  };
}
