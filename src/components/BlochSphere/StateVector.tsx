
import { Html, Line } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";

import { useVectorAnimation } from "../../hooks/useVectorAnimation";
import { useVectorVisibility } from "../../hooks/useVectorVisibility";
import { getGateRotation } from "../../quantum/gateRotation";
import type { BlochVector } from "../../quantum/bloch";
import type {
    GateStep,
    SimulatorMode,
} from "../../simulator/SimulatorState";

type Props = {
    direction: BlochVector;
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
    gateEditRevision: number;
};

export default function StateVector({
    direction,
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
    gateEditRevision,
}: Props) {
    // Előző szimulációs állapot
    const lastGates = useRef(gates);
    const lastDirection = useRef(
        new Vector3(...direction).normalize(),
    );
    const lastStepIndex = useRef(stepIndex);
    const lastMode = useRef(mode);
    const lastMergedHidden = useRef(mergedHidden);
    const lastMergeAnimationKey = useRef(mergeAnimationKey);
    const lastGateEditRevision = useRef(gateEditRevision);

    // Forgásanimáció
    const {
        groupRef,
        initialRotation,
        start,
        snap,
        isRunning,
        consumeFinished,
    } = useVectorAnimation(direction, progressRef);

    // Feliratok és láthatóság
    const {
        displayHidden,
        displayLabel,
        getCurrentLabel,
        updateVisibility,
    } = useVectorVisibility(label, mergedHidden, consumeFinished);

    useEffect(() => {
        const next = new Vector3(...direction).normalize();
        const previousDirection = lastDirection.current.clone();

        const previousStep = lastStepIndex.current;
        const previousMode = lastMode.current;

        const editChanged =
            lastGateEditRevision.current !== gateEditRevision;

        lastGateEditRevision.current = gateEditRevision;

        const gatesChanged = lastGates.current !== gates;

        const mergeStepChanged =
            !editChanged &&
            !gatesChanged &&
            previousMode === mode &&
            lastMergeAnimationKey.current !== mergeAnimationKey;

        const shouldAnimate =
            !editChanged &&
            previousMode === mode &&
            !gatesChanged &&
            previousStep !== stepIndex;

        const directionChanged =
            previousDirection.distanceToSquared(next) >= 1e-10;

        const wasHidden = lastMergedHidden.current;
        const newlyHidden = mergedHidden && !wasHidden;
        const newlyVisible = !mergedHidden && wasHidden;

        const mergeTransition =
            mergeStepChanged &&
            (
                newlyHidden ||
                (
                    label.includes(", ") &&
                    label !== getCurrentLabel()
                )
            );

        // Előző állapot frissítése
        lastGates.current = gates;
        lastDirection.current.copy(next);
        lastStepIndex.current = stepIndex;
        lastMode.current = mode;
        lastMergedHidden.current = mergedHidden;
        lastMergeAnimationKey.current = mergeAnimationKey;

        // Alkalmazott kvantumkapu
        const difference = stepIndex - previousStep;

        const gate =
            shouldAnimate && Math.abs(difference) === 1
                ? gates[Math.min(previousStep, stepIndex)]
                : undefined;

        const rotation = gate ? getGateRotation(gate) : null;

        const animate =
            (
                shouldAnimate &&
                (directionChanged || newlyHidden || rotation !== null)
            ) ||
            mergeTransition;

        // Mozgás vezérlése
        if (editChanged) {
            // Kapusor szerkesztése: minden vektor azonnal frissül.
            snap(next);
        } else if (animate) {
            start(previousDirection, next, rotation, difference);
        } else if (directionChanged || gatesChanged) {
            snap(next);
        }

        // Megjelenítés vezérlése
        updateVisibility({
            label,
            ownLabel,
            mergedHidden,
            isAnimating: editChanged ? false : isRunning(),
            keepMergedDuringAnimation,
            shouldAnimate,
            directionChanged,
            newlyVisible,
        });
    }, [
        direction,
        label,
        gates,
        stepIndex,
        mode,
        mergedHidden,
        mergeAnimationKey,
        ownLabel,
        keepMergedDuringAnimation,
        gateEditRevision,
        start,
        snap,
        isRunning,
        getCurrentLabel,
        updateVisibility,
    ]);

    return (
        <group
            ref={groupRef}
            quaternion={initialRotation}
            visible={!displayHidden}
        >
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
