import { useRef, useState } from "react";
import { QubitState } from "../quantum/QubitState";
import type { Matrix2 } from "../quantum/Matrix2";
import { P, Rx, Ry, Rz } from "../quantum/gates";
import { createInitialSimulatorState, DEFAULT_STATE_COLORS, MAX_STATES } from "../simulator/SimulatorState";
import type { GateParameter, GateStep, SimulatorMode, SimulatorState, VisualTransitionKind } from "../simulator/SimulatorState";

type GateTarget = "shared" | number;

type GateSequence = {
  gates: GateStep[];
  stepIndex: number;
};

const gateFactories: Record<GateParameter["kind"], (angle: number) => Matrix2> = { P, Rx, Ry, Rz };

function nextVisualTransition(current: SimulatorState, kind: VisualTransitionKind) {
  return { revision: current.visualTransition.revision + 1, kind };
}

function updateGateSequence(
  current: SimulatorState,
  target: GateTarget,
  update: (sequence: GateSequence) => GateSequence,
  kind: "edit" | "step" | "jump" = "edit",
): SimulatorState {
  if (target === "shared") {
    const previous: GateSequence = {
      gates: current.sharedGates,
      stepIndex: current.sharedStepIndex,
    };

    const next = update(previous);
    const gatesChanged = next.gates !== previous.gates;

    if (!gatesChanged && next.stepIndex === previous.stepIndex) {
      return current;
    }

    return {
      ...current,
      sharedGates: next.gates,
      sharedStepIndex: next.stepIndex,
      gateEditRevision: current.gateEditRevision + (gatesChanged ? 1 : 0),
      visualTransition: nextVisualTransition(current, gatesChanged ? "edit" : kind),
    };
  }

  const tracked = current.states.find((state) => state.id === target);
  if (!tracked) return current;

  const previous: GateSequence = {
    gates: tracked.individualGates,
    stepIndex: tracked.individualStepIndex,
  };

  const next = update(previous);
  const gatesChanged = next.gates !== previous.gates;

  if (!gatesChanged && next.stepIndex === previous.stepIndex) {
    return current;
  }

  return {
    ...current,
    gateEditRevision: current.gateEditRevision + (gatesChanged ? 1 : 0),
    visualTransition: nextVisualTransition(current, gatesChanged ? "edit" : kind),
    states: current.states.map((state) =>
      state.id === target
        ? {
            ...state,
            individualGates: next.gates,
            individualStepIndex: next.stepIndex,
          }
        : state,
    ),
  };
}

export function useSimulator() {
  const [simulator, setSimulator] = useState<SimulatorState>(createInitialSimulatorState);

  const nextGateId = useRef(1);

  function setMode(mode: SimulatorMode) {
    setSimulator((current) =>
      current.mode === mode
        ? current
        : {
            ...current,
            mode,
            visualTransition: nextVisualTransition(current, "mode"),
          },
    );
  }

  function addState(initialState = QubitState.zero()) {
    setSimulator((current) => {
      if (current.states.length >= MAX_STATES) return current;

      const id = Array.from({ length: MAX_STATES }, (_, i) => i + 1).find((id) => !current.states.some((state) => state.id === id));

      if (id === undefined) return current;

      return {
        ...current,
        visualTransition: nextVisualTransition(current, "state-list"),
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
    setSimulator((current) => {
      if (current.states.length <= 1 || !current.states.some((state) => state.id === id)) {
        return current;
      }

      return {
        ...current,
        states: current.states.filter((state) => state.id !== id),
      };
    });
  }

  function setInitialState(id: number, initialState: QubitState) {
    const normalized = initialState.normalized();

    setSimulator((current) => ({
      ...current,
      states: current.states.map((state) => (state.id === id ? { ...state, initialState: normalized } : state)),
      visualTransition: nextVisualTransition(current, "initial-state"),
    }));
  }

  function setStateColor(id: number, color: string) {
    setSimulator((current) => ({
      ...current,
      states: current.states.map((state) => (state.id === id ? { ...state, color } : state)),
      visualTransition: nextVisualTransition(current, "appearance"),
    }));
  }

  function addGate(target: GateTarget, label: string, matrix: Matrix2, parameter?: GateParameter) {
    const id = `gate-${nextGateId.current++}`;

    setSimulator((current) =>
      updateGateSequence(current, target, ({ gates, stepIndex }) => ({
        gates: [...gates, { id, label, matrix, parameter }],
        stepIndex,
      })),
    );
  }

  function removeGate(target: GateTarget, id: string) {
    setSimulator((current) =>
      updateGateSequence(current, target, (sequence) => {
        const index = sequence.gates.findIndex((gate) => gate.id === id);

        if (index === -1) return sequence;

        return {
          gates: sequence.gates.filter((gate) => gate.id !== id),
          stepIndex: sequence.stepIndex - (index < sequence.stepIndex ? 1 : 0),
        };
      }),
    );
  }

  function moveGate(target: GateTarget, id: string, direction: -1 | 1) {
    setSimulator((current) =>
      updateGateSequence(current, target, (sequence) => {
        const index = sequence.gates.findIndex((gate) => gate.id === id);

        const destination = index + direction;

        if (index === -1 || destination < 0 || destination >= sequence.gates.length) {
          return sequence;
        }

        const gates = [...sequence.gates];
        const [gate] = gates.splice(index, 1);
        gates.splice(destination, 0, gate);

        return { ...sequence, gates };
      }),
    );
  }

  function updateGateAngle(target: GateTarget, id: string, degrees: number) {
    if (!Number.isFinite(degrees)) return;

    const angle = (degrees * Math.PI) / 180;

    setSimulator((current) =>
      updateGateSequence(current, target, (sequence) => {
        const existing = sequence.gates.find((gate) => gate.id === id);

        if (!existing?.parameter || existing.parameter.angle === angle) {
          return sequence;
        }

        const gates = sequence.gates.map((gate) => {
          if (gate.id !== id || !gate.parameter) return gate;

          const kind = gate.parameter.kind;

          return {
            ...gate,
            label: `${kind}(${degrees}°)`,
            matrix: gateFactories[kind](angle),
            parameter: { kind, angle },
          };
        });

        return { ...sequence, gates };
      }),
    );
  }

  function clearGates(target: GateTarget) {
    setSimulator((current) =>
      updateGateSequence(current, target, (sequence) => {
        if (sequence.gates.length === 0 && sequence.stepIndex === 0) {
          return sequence;
        }

        return { gates: [], stepIndex: 0 };
      }),
    );
  }

  function insertGate(target: GateTarget, index: number, label: string, matrix: Matrix2, parameter?: GateParameter) {
    const id = `gate-${nextGateId.current++}`;

    setSimulator((current) =>
      updateGateSequence(current, target, ({ gates, stepIndex }) => {
        const insertIndex = Math.max(0, Math.min(index, gates.length));
        const updated = [...gates];

        updated.splice(insertIndex, 0, {
          id,
          label,
          matrix,
          parameter,
        });

        return {
          gates: updated,
          stepIndex: stepIndex + (insertIndex < stepIndex ? 1 : 0),
        };
      }),
    );
  }

  function moveGateTo(target: GateTarget, id: string, insertIndex: number) {
    setSimulator((current) =>
      updateGateSequence(
        current,
        target,
        (sequence) => {
          const gates = [...sequence.gates];

          const oldIndex = gates.findIndex((gate) => gate.id === id);

          if (oldIndex === -1) return sequence;

          const boundedIndex = Math.max(0, Math.min(insertIndex, gates.length));

          const newIndex = boundedIndex > oldIndex ? boundedIndex - 1 : boundedIndex;

          if (oldIndex === newIndex) return sequence;

          const [gate] = gates.splice(oldIndex, 1);
          gates.splice(newIndex, 0, gate);

          let stepIndex = sequence.stepIndex;

          if (oldIndex >= stepIndex && newIndex < stepIndex) {
            stepIndex++;
          } else if (oldIndex < stepIndex && newIndex >= stepIndex) {
            stepIndex--;
          }

          return {
            ...sequence,
            gates,
            stepIndex,
          };
        },
        "edit",
      ),
    );
  }

  function moveGateBetweenRows(sourceId: number, destinationId: number, gateId: string, insertIndex: number) {
    if (sourceId === destinationId) {
      moveGateTo(sourceId, gateId, insertIndex);
      return;
    }

    setSimulator((current) => {
      const source = current.states.find((s) => s.id === sourceId);
      const destination = current.states.find((s) => s.id === destinationId);

      if (!source || !destination) return current;

      const oldIndex = source.individualGates.findIndex((gate) => gate.id === gateId);

      if (oldIndex === -1) return current;

      const gate = source.individualGates[oldIndex];

      const index = Math.max(0, Math.min(insertIndex, destination.individualGates.length));

      return {
        ...current,
        gateEditRevision: current.gateEditRevision + 1,
        visualTransition: nextVisualTransition(current, "edit"),
        states: current.states.map((state) => {
          if (state.id === sourceId) {
            return {
              ...state,
              individualGates: state.individualGates.filter((g) => g.id !== gateId),
              individualStepIndex: state.individualStepIndex - (oldIndex < state.individualStepIndex ? 1 : 0),
            };
          }

          if (state.id === destinationId) {
            const gates = [...state.individualGates];
            gates.splice(index, 0, gate);

            return {
              ...state,
              individualGates: gates,
              individualStepIndex: state.individualStepIndex + (index < state.individualStepIndex ? 1 : 0),
            };
          }

          return state;
        }),
      };
    });
  }

  function changeStep(target: GateTarget, change: (step: number) => number, kind: "step" | "jump") {
    setSimulator((current) =>
      updateGateSequence(
        current,
        target,
        (sequence) => ({
          ...sequence,
          stepIndex: Math.max(0, Math.min(sequence.gates.length, change(sequence.stepIndex))),
        }),
        kind,
      ),
    );
  }

  function nextStep(target: GateTarget) {
    changeStep(target, (step) => step + 1, "step");
  }

  function previousStep(target: GateTarget) {
    changeStep(target, (step) => step - 1, "step");
  }

  function resetSteps(target: GateTarget) {
    changeStep(target, () => 0, "jump");
  }

  function jumpToStep(target: GateTarget, index: number) {
    if (!Number.isFinite(index)) return;

    setSimulator((current) => {
      const tracked = current.states.find((state) => state.id === target);

      const previousStep = target === "shared" ? current.sharedStepIndex : tracked?.individualStepIndex;

      const gateCount = target === "shared" ? current.sharedGates.length : tracked?.individualGates.length;

      if (previousStep === undefined || gateCount === undefined) {
        return current;
      }

      const nextIndex = Math.max(0, Math.min(gateCount, Math.trunc(index)));

      if (nextIndex === previousStep) {
        return current;
      }

      const difference = Math.abs(nextIndex - previousStep);

      // Pontosan egy lépés: ugyanaz, mint a nyilakkal.
      // Több lépés: ugrás, legrövidebb gömbi ívvel.
      const kind = difference === 1 ? "step" : "jump";

      return updateGateSequence(
        current,
        target,
        (sequence) => ({
          ...sequence,
          stepIndex: nextIndex,
        }),
        kind,
      );
    });
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
    insertGate,
    moveGateTo,
    moveGateBetweenRows,
    nextStep,
    previousStep,
    resetSteps,
    jumpToStep,
  };
}
