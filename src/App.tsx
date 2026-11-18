
import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import BlochSphere from "./components/BlochSphere/BlochSphere";
import InitialStateEditor from "./components/InitialStateEditor";
import { useSimulator } from "./hooks/useSimulator";
import { getCurrentState, MAX_STATES } from "./simulator/SimulatorState";
import { QubitState } from "./quantum/QubitState";
import type { Matrix2 } from "./quantum/Matrix2";
import type { GateParameter } from "./simulator/SimulatorState";
import { X, H, S, T, P, Rx, Ry, Rz } from "./quantum/gates";

type GateOption = {
  label: string;
  matrix: Matrix2;
  parameter?: GateParameter;
};

const gates: GateOption[] = [
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

const initialStates = [
  () => QubitState.zero(),
  () => QubitState.fromAngles(Math.PI / 2, 0),
  () => QubitState.fromAngles(Math.PI / 2, Math.PI / 2),
  () => QubitState.one(),
];

const labels = ["|ψ₁⟩", "|ψ₂⟩", "|ψ₃⟩", "|ψ₄⟩"];

export default function App() {
  const {
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
  } = useSimulator();

  const [selectedStateId, setSelectedStateId] = useState(1);

  const selectedState =
    simulator.states.find((state) => state.id === selectedStateId)
    ?? simulator.states[0];

  const target = simulator.mode === "shared"
    ? "shared" as const
    : (selectedState?.id ?? null);

  const activeGates = simulator.mode === "shared"
    ? simulator.sharedGates
    : (selectedState?.individualGates ?? []);

  const activeStepIndex = simulator.mode === "shared"
    ? simulator.sharedStepIndex
    : (selectedState?.individualStepIndex ?? 0);

  const vectors = simulator.states
    .filter((tracked) => tracked.visible)
    .map((tracked) => ({
      id: tracked.id,
      state: getCurrentState(tracked, simulator),
      color: tracked.color,
      label: labels[tracked.id - 1],
    }));

  const nextIndex = Array.from({ length: MAX_STATES }, (_, i) => i)
    .find((i) => !simulator.states.some((state) => state.id === i + 1)) ?? -1;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas camera={{ position: [3, 3, 2], fov: 45, up: [0, 0, 1] }}>
        <color attach="background" args={["#101827"]} />
        <BlochSphere
          vectors={vectors}
          selectedStateId={selectedState?.id}
        />
        <OrbitControls
          target={[0, 0, 0]}
          enablePan={false}
          enableDamping
          minDistance={2}
          maxDistance={8}
        />
      </Canvas>

      {/* Kezdőállapot-szerkesztő */}
      <div style={{
        position: "absolute",
        top: 24,
        left: 24,
        width: 250,
        padding: 16,
        background: "#1E293B",
        color: "white",
        borderRadius: 12,
      }}>
        <h3>Kezdőállapot</h3>

        {selectedState && (
          <>
            <select
              value={selectedState.id}
              onChange={(e) => setSelectedStateId(Number(e.target.value))}
            >
              {simulator.states.map((tracked) => (
                <option key={tracked.id} value={tracked.id}>
                  {labels[tracked.id - 1]}
                </option>
              ))}
            </select>

            <label style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
            }}>
              Szín:
              <input
                type="color"
                value={selectedState.color}
                onChange={(e) =>
                  setStateColor(selectedState.id, e.target.value)
                }
              />
            </label>

            <InitialStateEditor
              key={selectedState.id}
              state={selectedState.initialState}
              onChange={(state) =>
                setInitialState(selectedState.id, state)
              }
            />
          </>
        )}
      </div>

      {/* Alsó vezérlőpanel */}
      <div style={{
        position: "absolute",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        maxWidth: "calc(100vw - 48px)",
        color: "white",
      }}>

        {/* Állapotvektorok */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {simulator.states.map((tracked) => (
            <div key={tracked.id} style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}>
              <button
                onClick={() => setSelectedStateId(tracked.id)}
                style={{
                  color: tracked.color,
                  border: selectedState?.id === tracked.id
                    ? `1px solid ${tracked.color}`
                    : "1px solid transparent",
                }}
              >
                {labels[tracked.id - 1]}
              </button>
              <button onClick={() => {
                removeState(tracked.id);

                if (selectedState?.id === tracked.id) {
                  const remaining = simulator.states.find(
                    (state) => state.id !== tracked.id,
                  );
                  setSelectedStateId(remaining?.id ?? 1);
                }
              }}>×</button>
            </div>
          ))}

          <button
            disabled={nextIndex === -1}
            onClick={() => {
              if (nextIndex !== -1) addState(initialStates[nextIndex]());
            }}
          >
            + Állapot
          </button>
        </div>

        {/* Módválasztó */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label htmlFor="simulator-mode">Kapusor mód:</label>

          <select
            id="simulator-mode"
            value={simulator.mode}
            onChange={(e) =>
              setMode(e.target.value === "individual" ? "individual" : "shared")
            }
          >
            <option value="shared">Közös</option>
            <option value="individual">Egyéni</option>
          </select>

          {simulator.mode === "individual" && selectedState && (
            <span style={{ color: selectedState.color }}>
              {labels[selectedState.id - 1]}
            </span>
          )}
        </div>

        {/* Kvantumkapuk */}
        <div style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "center",
        }}>
          {gates.map(({ label, matrix, parameter }) => (
            <button
              key={label}
              disabled={target === null}
              onClick={() => {
                if (target !== null) addGate(target, label, matrix, parameter);
              }}
            >
              + {label}
            </button>
          ))}
        </div>

        {/* Kapusor szerkesztése */}
        <div style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
        }}>
          {activeGates.map((gate, index) => (
            <div key={gate.id} style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: 6,
              borderRadius: 6,
              background: "#1E293B",
            }}>
              <span style={{
                color: index < activeStepIndex ? "#4ADE80" : "white",
              }}>
                {gate.label}
              </span>

              {gate.parameter && (
                <input
                  type="number"
                  step="any"
                  value={Number(
                    (gate.parameter.angle * 180 / Math.PI).toFixed(4),
                  )}
                  onChange={(e) => {
                    if (target === null || e.target.value.trim() === "") return;
                    updateGateAngle(target, gate.id, Number(e.target.value));
                  }}
                  title="Szög fokban"
                  style={{ width: 65 }}
                />
              )}

              <button
                disabled={index === 0}
                onClick={() => {
                  if (target !== null) moveGate(target, gate.id, -1);
                }}
              >←</button>

              <button
                disabled={index === activeGates.length - 1}
                onClick={() => {
                  if (target !== null) moveGate(target, gate.id, 1);
                }}
              >→</button>

              <button onClick={() => {
                if (target !== null) removeGate(target, gate.id);
              }}>×</button>
            </div>
          ))}

          <button
            disabled={target === null || activeGates.length === 0}
            onClick={() => {
              if (target !== null) clearGates(target);
            }}
          >
            Kapusor törlése
          </button>
        </div>

        {/* Léptetés */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <button
            disabled={target === null || activeStepIndex === 0}
            onClick={() => {
              if (target !== null) previousStep(target);
            }}
          >◀</button>

          <span>{activeStepIndex} / {activeGates.length}</span>

          <button
            disabled={target === null || activeStepIndex >= activeGates.length}
            onClick={() => {
              if (target !== null) nextStep(target);
            }}
          >▶</button>

          <button
            disabled={target === null}
            onClick={() => {
              if (target !== null) resetSteps(target);
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
