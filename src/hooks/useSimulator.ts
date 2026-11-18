import { useRef, useState } from "react";
import { QubitState } from "../quantum/QubitState";
import type { Matrix2 } from "../quantum/Matrix2";
import { createInitialSimulatorState, MAX_STATES, DEFAULT_STATE_COLORS } from "../simulator/SimulatorState";
import type { SimulatorState } from "../simulator/SimulatorState";
import { P, Rx, Ry, Rz } from "../quantum/gates";
import type { GateParameter } from "../simulator/SimulatorState";

export function useSimulator() {
  const [simulator, setSimulator] = useState<SimulatorState>(createInitialSimulatorState);

  const nextGateId = useRef(1);

  // Állapotvektor hozzáadása
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

  // Állapotvektor kezdeti állapotának beállítása
  function setInitialState(id: number, initialState: QubitState) {
    setSimulator((current) => ({
      ...current,
      states: current.states.map((state) => (state.id === id ? { ...state, initialState: initialState.normalized() } : state)),
    }));
  }

  // Állapotvektor színének beállítása
  function setStateColor(id: number, color: string) {
    setSimulator((current) => ({
      ...current,
      states: current.states.map((state) => (state.id === id ? { ...state, color } : state)),
    }));
  }

  // Állapotvektor törlése
  function removeState(id: number) {
    setSimulator((current) => ({
      ...current,
      states: current.states.filter((state) => state.id !== id),
    }));
  }

  // Kapu hozzáadása a közös kapusorhoz
  function addSharedGate(label: string, matrix: Matrix2, parameter?: GateParameter) {
    const id = `gate-${nextGateId.current++}`;

    setSimulator((current) => ({
      ...current,
      sharedGates: [...current.sharedGates, { id, label, matrix, parameter }],
    }));
  }

  // Kapu törlése a közös kapusorból
  function removeSharedGate(id: string) {
    setSimulator((current) => ({
      ...current,
      sharedGates: current.sharedGates.filter((gate) => gate.id !== id),
      sharedStepIndex: 0,
    }));
  }

  // Kapu mozgatása a közös kapusorban
  function moveSharedGate(id: string, direction: -1 | 1) {
    setSimulator((current) => {
      const gates = [...current.sharedGates];
      const index = gates.findIndex((gate) => gate.id === id);
      const target = index + direction;

      if (index === -1 || target < 0 || target >= gates.length) {
        return current;
      }

      const [gate] = gates.splice(index, 1);
      gates.splice(target, 0, gate);

      return {
        ...current,
        sharedGates: gates,
        sharedStepIndex: 0,
      };
    });
  }

  // Kapu paraméterének frissítése a közös kapusorban
  function updateSharedGateAngle(id: string, degrees: number) {
    if (!Number.isFinite(degrees)) return;

    const angle = (degrees * Math.PI) / 180;
    const factories = { P, Rx, Ry, Rz };

    setSimulator((current) => ({
      ...current,
      sharedGates: current.sharedGates.map((gate) => {
        if (gate.id !== id || !gate.parameter) return gate;

        const kind = gate.parameter.kind;

        return {
          ...gate,
          label: `${kind}(${degrees}°)`,
          matrix: factories[kind](angle),
          parameter: { kind, angle },
        };
      }),
      sharedStepIndex: 0,
    }));
  }

  // Kapuk törlése a közös kapusorból
  function clearSharedGates() {
    setSimulator((current) => ({
      ...current,
      sharedGates: [],
      sharedStepIndex: 0,
    }));
  }

  // Visszaállítás a kezdőállapotokra
  function resetShared() {
    setSimulator((current) => ({
      ...current,
      sharedStepIndex: 0,
    }));
  }

  // Következő kapu végrehajtása
  function nextStep() {
    setSimulator((current) => ({
      ...current,
      sharedStepIndex: Math.min(current.sharedStepIndex + 1, current.sharedGates.length),
    }));
  }

  // Visszalépés az előző kapuhoz
  function previousStep() {
    setSimulator((current) => ({
      ...current,
      sharedStepIndex: Math.max(0, current.sharedStepIndex - 1),
    }));
  }

  return {
    simulator,
    addState,
    setInitialState,
    setStateColor,
    removeState,
    addSharedGate,
    removeSharedGate,
    moveSharedGate,
    updateSharedGateAngle,
    clearSharedGates,
    resetShared,
    nextStep,
    previousStep,
  };
}
