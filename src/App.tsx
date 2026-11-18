
import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import BlochSphere from "./components/BlochSphere/BlochSphere";
import InitialStateEditor from "./components/InitialStateEditor";
import { useSimulator } from "./hooks/useSimulator";
import { getCurrentState, MAX_STATES } from "./simulator/SimulatorState";
import { QubitState } from "./quantum/QubitState";
import { X, H, S, T, Rx, Ry, Rz } from "./quantum/gates";

const gates = [
  { label: "X", matrix: X },
  { label: "H", matrix: H },
  { label: "S", matrix: S },
  { label: "T", matrix: T },
  { label: "Rx(π/2)", matrix: Rx(Math.PI / 2) },
  { label: "Ry(π/2)", matrix: Ry(Math.PI / 2) },
  { label: "Rz(π/2)", matrix: Rz(Math.PI / 2) },
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
    addState,
    removeState,
    setInitialState,
    setStateColor,
    addSharedGate,
    nextStep,
    previousStep,
    resetShared,
  } = useSimulator();

  const [selectedStateId, setSelectedStateId] = useState(1);

  const selectedState =
    simulator.states.find((state) => state.id === selectedStateId)
    ?? simulator.states[0];

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

        <BlochSphere vectors={vectors} />

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
                onChange={(e) => setStateColor(selectedState.id, e.target.value)}
              />
            </label>

            <InitialStateEditor
              key={selectedState.id}
              state={selectedState.initialState}
              onChange={(state) => setInitialState(selectedState.id, state)}
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
      }}>

        {/* Állapotvektorok */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {simulator.states.map((tracked) => (
            <div key={tracked.id} style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}>
              <span style={{ color: tracked.color }}>
                {labels[tracked.id - 1]}
              </span>
              <button onClick={() => removeState(tracked.id)}>×</button>
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

        {/* Kvantumkapuk */}
        <div style={{ display: "flex", gap: 8 }}>
          {gates.map(({ label, matrix }) => (
            <button key={label} onClick={() => addSharedGate(label, matrix)}>
              + {label}
            </button>
          ))}
        </div>

        {/* Kapusor */}
        <div style={{ color: "white" }}>
          Kapusor: {simulator.sharedGates.map((gate) => gate.label).join(" → ") || "Üres"}
        </div>

        {/* Léptetés */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={previousStep}
            disabled={simulator.sharedStepIndex === 0}
          >
            ◀
          </button>

          <span style={{ color: "white" }}>
            {simulator.sharedStepIndex} / {simulator.sharedGates.length}
          </span>

          <button
            onClick={nextStep}
            disabled={simulator.sharedStepIndex >= simulator.sharedGates.length}
          >
            ▶
          </button>

          <button onClick={resetShared}>Reset</button>
        </div>
      </div>
    </div>
  );
}
