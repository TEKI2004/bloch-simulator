
import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";


import BlochSphere from "./components/BlochSphere/BlochSphere";
import ModeSelector from "./components/controls/Playback/ModeSelector";
import InitialStatePanel from "./components/controls/State/InitialStatePanel";
import GatePalette from "./components/controls/Circuit/GatePalette";
import PlaybackControls from "./components/controls/Playback/PlaybackControls";
import StateInfoPanel from "./components/controls/State/StateInfoPanel";
import SimulatorLayout from "./components/layout/SimulatorLayout";
import CircuitRows from "./components/controls/Circuit/CircuitRows";
import BlochViewport from "./components/viewport/BlochViewport";

import StateTabs from "./components/controls/State/StateTabs";
import StateColorPicker from "./components/controls/State/StateColorPicker";


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
    updateGateAngle,
    clearGates,
    insertGate,
    moveGateTo,
    moveGateBetweenRows,
    nextStep,
    previousStep,
    resetSteps,
    jumpToStep,
  } = useSimulator();

  const [selectedStateId, setSelectedStateId] = useState(1);

  // Kiválasztott állapotvektor
  const selectedState =
    simulator.states.find((s) => s.id === selectedStateId)
    ?? simulator.states[0];

  const selectedCurrentState = selectedState
    ? getCurrentState(selectedState, simulator)
    : null;

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
    if (simulator.states.length <= 1) return;

    const remaining = simulator.states
      .filter((state) => state.id !== id)
      .sort((a, b) => a.id - b.id);

    if (remaining.length === simulator.states.length) {
      return;
    }

    stopPlayback();

    if (selectedState?.id === id) {
      const next =
        remaining.find((state) => state.id > id) ??
        remaining[remaining.length - 1];

      setSelectedStateId(next.id);
    }

    removeState(id);
  }


  function createState() {
    if (nextIndex === -1) return;

    stopPlayback();

    const id = nextIndex + 1;

    addState(INITIAL_STATE_PRESETS[nextIndex]());

    setSelectedStateId(id);
  }

  return (
    <SimulatorLayout
      left={
        <InitialStatePanel
          selectedState={selectedState}
          onInitialStateChange={setInitialState}
        />
      }


      center={
        <BlochViewport
          stateTabs={
            <StateTabs
              states={simulator.states}
              selectedStateId={selectedState?.id}
              onSelect={selectState}
              onRemove={deleteState}
            />
          }
          colorPicker={
            selectedState ? (
              <StateColorPicker
                key={selectedState.id}
                color={selectedState.color}
                compact
                onChange={(color) =>
                  setStateColor(selectedState.id, color)
                }
              />
            ) : null
          }
        >
          <Canvas

            style={{ width: "100%", height: "100%" }}
            camera={{
              position: [3, 3, 2],
              fov: 45,
              up: [0, 0, 1],
            }}
          >
            <color attach="background" args={["#101827"]} />

            <BlochSphere
              vectors={vectors}
              selectedStateId={selectedState?.id}
              mergeAnimationKey={mergeAnimationKey}
              gateEditRevision={
                simulator.gateEditRevision + simulator.instantJumpRevision
              }
              visualTransition={simulator.visualTransition}
            />

            <OrbitControls
              target={[0, 0, 0]}
              enablePan={false}
              enableDamping
              minDistance={2}
              maxDistance={8}
            />
          </Canvas>
        </BlochViewport>
      }

      right={
        selectedState && selectedCurrentState ? (
          <StateInfoPanel
            state={selectedCurrentState}
            label={STATE_LABELS[selectedState.id - 1]}
            color={selectedState.color}
          />
        ) : null
      }

      bottom={
        <>
          {/* Módválasztó és lejátszás */}
          <div className="sim-bottom-header">
            <ModeSelector
              mode={simulator.mode}
              selectedState={selectedState}
              onChange={(mode) => {
                stopPlayback();
                setMode(mode);
              }}
            />

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

          {/* Kapupaletta */}
          <div className="sim-gate-palette">
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
          </div>

          {/* Composer-szerű kapusorok */}
          <CircuitRows
            simulator={simulator}
            selectedStateId={selectedState?.id}
            onSelectState={selectState}
            onInsertGate={(rowTarget, index, gate) => {
              stopPlayback();
              insertGate(
                rowTarget,
                index,
                gate.label,
                gate.matrix,
                gate.parameter,
              );
            }}
            onMoveGate={(source, destination, id, index) => {
              stopPlayback();

              if (source === destination) {
                moveGateTo(source, id, index);
              } else if (
                typeof source === "number" &&
                typeof destination === "number"
              ) {
                moveGateBetweenRows(source, destination, id, index);
              }
            }}
            onJumpToStep={(rowTarget, stepIndex) => {
              stopPlayback();
              jumpToStep(rowTarget, stepIndex);
            }}

            onDeleteGate={(rowTarget, gateId) => {
              stopPlayback();
              removeGate(rowTarget, gateId);
            }}
            onUpdateGateAngle={(rowTarget, gateId, degrees) => {
              stopPlayback();
              updateGateAngle(rowTarget, gateId, degrees);
            }}
            onClearGates={(rowTarget) => {
              stopPlayback();
              clearGates(rowTarget);
            }}
            onAddState={createState}
          />
        </>
      }
    />
  );
}
