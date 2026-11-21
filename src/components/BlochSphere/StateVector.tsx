import { Html, Line } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";

import { useVectorAnimation } from "../../hooks/useVectorAnimation";
import { useVectorVisibility } from "../../hooks/useVectorVisibility";
import { getGateRotation } from "../../quantum/gateRotation";
import type { BlochVector } from "../../quantum/bloch";
import type { QubitState } from "../../quantum/QubitState";
import type {
  GateStep,
  SimulatorMode,
  VisualTransition,
} from "../../simulator/SimulatorState";

type Props = {
  direction: BlochVector;
  initialState: QubitState;
  color: string;
  label: string;
  gates: GateStep[];
  stepIndex: number;
  mode: SimulatorMode;
  mergedHidden?: boolean;
  renderOrder?: number;
  mergeAnimationKey: string;
  progressRef: { current: number };
  ownLabel: string;
  keepMergedDuringAnimation?: boolean;
  visualTransition: VisualTransition;
};

/**
 * Transition policy:
 * - initial-state editing: snap (for every vector; includes merge/unmerge)
 * - single step, unchanged circuit: animate the physical gate rotation
 * - any other direction change: animate the shortest spherical arc
 * - unchanged direction involved in a merge: hold until moving vectors arrive
 * - no visual change: leave any animation already running untouched
 */
export default function StateVector({
  direction,
  initialState,
  color,
  label,
  gates,
  stepIndex,
  mode,
  mergedHidden = false,
  renderOrder = 10,
  mergeAnimationKey,
  progressRef,
  ownLabel,
  keepMergedDuringAnimation = false,
  visualTransition,
}: Props) {
  const previous = useRef({
    direction: new Vector3(...direction).normalize(),
    initialState,
    gates,
    stepIndex,
    mode,
    mergedHidden,
    label,
    keepMergedDuringAnimation,
    mergeAnimationKey,
    transitionRevision: visualTransition.revision,
  });

  const {
    groupRef,
    start,
    startShortest,
    snap,
    isRunning,
    consumeFinished,
    waitForMerge,
  } = useVectorAnimation(direction, progressRef);

  const {
    displayHidden,
    displayLabel,
    getCurrentLabel,
    updateVisibility,
  } = useVectorVisibility(label, mergedHidden, consumeFinished);

  useEffect(() => {
    const before = previous.current;
    const next = new Vector3(...direction).normalize();
    const previousDirection = before.direction;

    const directionChanged = previousDirection.distanceToSquared(next) > 1e-10;
    const gatesChanged = before.gates !== gates;
    const stepDifference = stepIndex - before.stepIndex;
    const modeChanged = before.mode !== mode;
    const eventChanged = before.transitionRevision !== visualTransition.revision;
    const ownInitialStateChanged = before.initialState !== initialState;
    const groupingChanged =
      before.mergedHidden !== mergedHidden ||
      before.label !== label ||
      before.keepMergedDuringAnimation !== keepMergedDuringAnimation;

    // Skip unrelated renders (e.g. camera, color, selection without grouping
    // changes). In particular, don't interrupt an in-flight animation.
    const relevantChange =
      directionChanged ||
      gatesChanged ||
      stepDifference !== 0 ||
      modeChanged ||
      ownInitialStateChanged ||
      groupingChanged ||
      before.mergeAnimationKey !== mergeAnimationKey;

    if (!relevantChange) {
      // Changes to an unrelated vector (or appearance-only updates) must
      // not restart this vector or discard its pending merge animation.
      before.transitionRevision = visualTransition.revision;
      return;
    }

    const initialStateEdit =
      (eventChanged && visualTransition.kind === "initial-state") ||
      ownInitialStateChanged;

    // Only the actual Previous / Next / Play action is a physical gate
    // rotation. Clicking a gate, Reset and multi-step jumps use a short arc.
    const singleStep =
      eventChanged &&
      visualTransition.kind === "step" &&
      !modeChanged &&
      !gatesChanged &&
      Math.abs(stepDifference) === 1;

    const gate = singleStep
      ? gates[Math.min(before.stepIndex, stepIndex)]
      : undefined;
    const rotation = gate ? getGateRotation(gate) : null;

    const newlyHidden = mergedHidden && !before.mergedHidden;
    const newlyVisible = !mergedHidden && before.mergedHidden;

    const mergeTransition =
      eventChanged &&
      !initialStateEdit &&
      visualTransition.kind !== "appearance" &&
      (newlyHidden || (label.includes(", ") && label !== getCurrentLabel()));

    // Update the snapshot before invoking callbacks. One render can only
    // start one transition; later edits begin at the *displayed* position.
    previous.current = {
      direction: next.clone(),
      initialState,
      gates,
      stepIndex,
      mode,
      mergedHidden,
      label,
      keepMergedDuringAnimation,
      mergeAnimationKey,
      transitionRevision: visualTransition.revision,
    };

    if (initialStateEdit) {
      snap(next);
    } else if (singleStep && (directionChanged || rotation !== null)) {
      start(previousDirection, next, rotation, stepDifference);
    } else if (directionChanged) {
      startShortest(next);
    } else if (mergeTransition) {
      waitForMerge(next);
    }
    // No movement needed: preserve the current animation, if any.

    const animating = !initialStateEdit && isRunning();

    updateVisibility({
      label,
      ownLabel,
      mergedHidden,
      isAnimating: animating,
      keepMergedDuringAnimation,
      shouldAnimate: animating && (directionChanged || singleStep),
      directionChanged,
      newlyVisible,
    });
  }, [
    direction,
    initialState,
    gates,
    stepIndex,
    mode,
    mergedHidden,
    label,
    mergeAnimationKey,
    keepMergedDuringAnimation,
    visualTransition,
    ownLabel,
    start,
    startShortest,
    snap,
    isRunning,
    waitForMerge,
    getCurrentLabel,
    updateVisibility,
  ]);

  return (
    <group ref={groupRef} visible={!displayHidden}>
      <Line
        points={[[0, 0, 0], [0, 0.84, 0]]}
        color={color}
        lineWidth={3}
        transparent
        opacity={1}
        toneMapped={false}
        depthTest={false}
        depthWrite={false}
        renderOrder={renderOrder}
      />

      <mesh position={[0, 0.92, 0]} renderOrder={renderOrder}>
        <coneGeometry args={[0.055, 0.16, 16]} />
        <meshBasicMaterial
          color={color}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {!displayHidden && displayLabel && (
        <Html
          position={[0, 1.15, 0]}
          center
          style={{
            color,
            fontFamily: '"Cambria Math", "Times New Roman", serif',
            fontStyle: "italic",
            fontSize: "22px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {displayLabel}
        </Html>
      )}
    </group>
  );
}
