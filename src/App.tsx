
import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import BlochSphere from "./components/BlochSphere/BlochSphere";
import StateSelector from "./components/controls/StateSelector";
import ModeSelector from "./components/controls/ModeSelector";
import InitialStatePanel from "./components/controls/InitialStatePanel";
import GatePalette from "./components/controls/GatePalette";
import GateSequenceEditor from "./components/controls/GateSequenceEditor";
import PlaybackControls from "./components/controls/PlaybackControls";

import { useSimulator } from "./hooks/useSimulator";
import { usePlayback } from "./hooks/usePlayback";

import { getCurrentState, MAX_STATES } from "./simulator/SimulatorState";
import { STATE_LABELS, INITIAL_STATE_PRESETS } from "./simulator/statePresets";



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

  // Kiválasztott állapotvektor
  const selectedState =
    simulator.states.find((s) => s.id === selectedStateId)
    ?? simulator.states[0];

  // Aktív kapusor
  const target = simulator.mode === "shared"
    ? "shared" as const
    : (selectedState?.id ?? null);

  const activeGates = simulator.mode === "shared"
    ? simulator.sharedGates
    : (selectedState?.individualGates ?? []);

  const activeStepIndex = simulator.mode === "shared"
    ? simulator.sharedStepIndex
    : (selectedState?.individualStepIndex ?? 0);

  // Automatikus lejátszás
  const {
    isPlaying,
    stopPlayback,
    togglePlayback,
  } = usePlayback({
    target,
    stepIndex: activeStepIndex,
    totalSteps: activeGates.length,
    nextStep,
  });

  // Megjelenítendő vektorok

  const vectors = simulator.states
    .filter((tracked) => tracked.visible)
    .map((tracked) => ({
      id: tracked.id,
      state: getCurrentState(tracked, simulator),
      initialState: tracked.initialState,
      color: tracked.color,
      label: STATE_LABELS[tracked.id - 1],
      gates: simulator.mode === "shared"
        ? simulator.sharedGates
        : tracked.individualGates,
      stepIndex: simulator.mode === "shared"
        ? simulator.sharedStepIndex
        : tracked.individualStepIndex,
      mode: simulator.mode,
    }));

  const mergeAnimationKey = simulator.mode === "shared"
    ? `shared:${simulator.sharedStepIndex}`
    : `individual:${simulator.states
      .map((s) => `${s.id}:${s.individualStepIndex}`)
      .join(",")}`;

  // Első szabad állapotazonosító
  const nextIndex = Array.from({ length: MAX_STATES }, (_, i) => i)
    .find((i) =>
      !simulator.states.some((state) => state.id === i + 1)
    ) ?? -1;

  function selectState(id: number) {
    stopPlayback();
    setSelectedStateId(id);
  }

  function deleteState(id: number) {
    stopPlayback();
    removeState(id);

    if (selectedState?.id === id) {
      const remaining = simulator.states.find(
        (state) => state.id !== id,
      );

      setSelectedStateId(remaining?.id ?? 1);
    }
  }

  return (
    <div style={{
      width: "100%",
      height: "100%",
      position: "relative",
    }}>
      {/* 3D jelenet */}
      <Canvas camera={{
        position: [3, 3, 2],
        fov: 45,
        up: [0, 0, 1],
      }}>
        <color attach="background" args={["#101827"]} />

        <BlochSphere
          vectors={vectors}
          selectedStateId={selectedState?.id}
          mergeAnimationKey={mergeAnimationKey}
          gateEditRevision={simulator.gateEditRevision}
        />

        <OrbitControls
          target={[0, 0, 0]}
          enablePan={false}
          enableDamping
          minDistance={2}
          maxDistance={8}
        />
      </Canvas>

      {/* Kezdőállapot szerkesztése */}
      <InitialStatePanel
        states={simulator.states}
        selectedState={selectedState}
        onSelect={selectState}
        onColorChange={setStateColor}
        onInitialStateChange={setInitialState}
      />

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
        <StateSelector
          states={simulator.states}
          selectedStateId={selectedState?.id}
          canAdd={nextIndex !== -1}
          onSelect={selectState}
          onRemove={deleteState}
          onAdd={() => {
            if (nextIndex === -1) return;

            stopPlayback();
            addState(INITIAL_STATE_PRESETS[nextIndex]());
          }}
        />

        {/* Közös / egyéni mód */}
        <ModeSelector
          mode={simulator.mode}
          selectedState={selectedState}
          onChange={(mode) => {
            stopPlayback();
            setMode(mode);
          }}
        />

        {/* Kvantumkapuk */}
        <GatePalette
          disabled={target === null}
          onAdd={(gate) => {
            if (target === null) return;

            stopPlayback();
            addGate(
              target,
              gate.label,
              gate.matrix,
              gate.parameter,
            );
          }}
        />

        {/* Kapusor szerkesztése */}
        <GateSequenceEditor
          gates={activeGates}
          stepIndex={activeStepIndex}
          disabled={target === null}
          onRemove={(id) => {
            if (target === null) return;

            stopPlayback();
            removeGate(target, id);
          }}
          onMove={(id, direction) => {
            if (target === null) return;

            stopPlayback();
            moveGate(target, id, direction);
          }}
          onUpdateAngle={(id, degrees) => {
            if (target === null) return;

            stopPlayback();
            updateGateAngle(target, id, degrees);
          }}
          onClear={() => {
            if (target === null) return;

            stopPlayback();
            clearGates(target);
          }}
        />

        {/* Lejátszásvezérlés */}
        <PlaybackControls
          stepIndex={activeStepIndex}
          totalSteps={activeGates.length}
          isPlaying={isPlaying}
          disabled={target === null}
          onPrevious={() => {
            if (target !== null) previousStep(target);
          }}
          onNext={() => {
            if (target !== null) nextStep(target);
          }}
          onPlayPause={togglePlayback}
          onReset={() => {
            stopPlayback();

            if (target !== null) resetSteps(target);
          }}
        />
      </div>
    </div>
  );
}
