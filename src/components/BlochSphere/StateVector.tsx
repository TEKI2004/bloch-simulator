
import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Group, Quaternion, Vector3 } from "three";
import { getGateRotation } from "../../quantum/gateRotation";
import type {
    GateStep,
    SimulatorMode,
} from "../../simulator/SimulatorState";

type Props = {
    direction: [number, number, number];
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
};

const UP = new Vector3(0, 1, 0);
const DURATION = 0.45;

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
    keepMergedDuringAnimation,
}: Props) {
    const [initialRotation] = useState(() =>
        new Quaternion().setFromUnitVectors(
            UP,
            new Vector3(...direction).normalize(),
        ),
    );

    const [displayHidden, setDisplayHidden] = useState(mergedHidden);
    const [displayLabel, setDisplayLabel] = useState(label);

    const groupRef = useRef<Group>(null);

    const lastGates = useRef(gates);
    const lastDirection = useRef(new Vector3(...direction).normalize());
    const lastStepIndex = useRef(stepIndex);
    const lastMode = useRef(mode);
    const lastMergedHidden = useRef(mergedHidden);
    const lastMergeAnimationKey = useRef(mergeAnimationKey);

    const pendingHide = useRef(false);
    const pendingLabel = useRef<string | null>(null);

    const from = useRef(initialRotation.clone());
    const to = useRef(initialRotation.clone());
    const elapsed = useRef(DURATION);

    // A tényleges kapuforgás adatai
    const useGatePath = useRef(false);
    const rotationAxis = useRef(new Vector3(0, 0, 1));
    const rotationAngle = useRef(0);
    const startDirection = useRef(new Vector3(...direction).normalize());

    const tempQuaternion = useRef(new Quaternion());
    const tempDirection = useRef(new Vector3());


    useEffect(() => {
        const next = new Vector3(...direction).normalize();
        const previousDirection = lastDirection.current.clone();

        const previousStep = lastStepIndex.current;
        const previousMode = lastMode.current;

        const gatesChanged = lastGates.current !== gates;
        lastGates.current = gates;

        const mergeStepChanged =
            !gatesChanged && previousMode === mode &&
            lastMergeAnimationKey.current !== mergeAnimationKey;

        lastMergeAnimationKey.current = mergeAnimationKey;

        const shouldAnimate =
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
                (label.includes(", ") && label !== displayLabel)
            );

        lastStepIndex.current = stepIndex;
        lastMode.current = mode;
        lastMergedHidden.current = mergedHidden;
        lastDirection.current.copy(next);

        const stepDifference = stepIndex - previousStep;
        let rotation = null;

        if (shouldAnimate && Math.abs(stepDifference) === 1) {
            const gateIndex = Math.min(previousStep, stepIndex);
            const gate = gates[gateIndex];

            if (gate) {
                rotation = getGateRotation(gate);
            }
        }

        to.current.setFromUnitVectors(UP, next);

        const animate =
            (shouldAnimate &&
                (directionChanged || newlyHidden || rotation !== null)) ||
            mergeTransition;

        if (animate) {
            progressRef.current = 0;

            const previousAnimationFinished = elapsed.current >= DURATION;

            from.current.copy(
                groupRef.current?.quaternion ?? to.current,
            );

            useGatePath.current = false;

            if (rotation && previousAnimationFinished) {
                rotationAxis.current.set(...rotation.axis).normalize();
                rotationAngle.current =
                    rotation.angle * Math.sign(stepDifference);

                startDirection.current.copy(previousDirection);
                useGatePath.current = true;
            }

            elapsed.current = 0;
        } else if (directionChanged || gatesChanged) {
            // Kezdőállapot szerkesztése: azonnali követés
            groupRef.current?.quaternion.copy(to.current);
            elapsed.current = DURATION;
            useGatePath.current = false;
            progressRef.current = 1;
        }

        // Láthatóság és feliratok kezelése
        const isAnimating = elapsed.current < DURATION;

        if (isAnimating && keepMergedDuringAnimation) {
            // Az együtt mozgó vektorok végig összevonva maradnak.
            pendingHide.current = false;
            pendingLabel.current = null;

            setDisplayHidden(mergedHidden);
            setDisplayLabel(label);

        } else if (isAnimating) {
            setDisplayHidden(false);
            pendingHide.current = mergedHidden;

            const isMoving = shouldAnimate && directionChanged;

            const oldCount = displayLabel
                ? displayLabel.split(",").length
                : 0;

            const newCount = label
                ? label.split(",").length
                : 0;

            if (isMoving) {
                // A mozgó vektor csak a saját feliratát viszi magával.
                setDisplayLabel(ownLabel);
                pendingLabel.current = label === ownLabel ? null : label;

            } else if (
                newlyVisible ||
                (!mergedHidden && newCount < oldCount)
            ) {
                // Szétválás: a helyben maradó vektor
                // azonnal megkapja az új feliratát.
                pendingLabel.current = null;
                setDisplayLabel(label);

            } else if (mergedHidden || newCount > oldCount) {
                // Összeolvadás: várjuk meg az animáció végét.
                pendingLabel.current = label;

            } else {
                pendingLabel.current = null;
                setDisplayLabel(label);
            }

        } else {
            pendingHide.current = false;
            pendingLabel.current = null;

            setDisplayHidden(mergedHidden);
            setDisplayLabel(label);
        }
    }, [direction, gates, stepIndex, mode, mergedHidden, label, mergeAnimationKey, keepMergedDuringAnimation]);


    useFrame((_, delta) => {
        if (!groupRef.current || elapsed.current >= DURATION) return;

        elapsed.current = Math.min(DURATION, elapsed.current + delta);

        const t = elapsed.current / DURATION;
        const eased = t * t * (3 - 2 * t);

        progressRef.current = eased;

        if (useGatePath.current) {
            // Forgatás a kapu tengelye körül
            tempQuaternion.current.setFromAxisAngle(
                rotationAxis.current,
                rotationAngle.current * eased,
            );

            tempDirection.current
                .copy(startDirection.current)
                .applyQuaternion(tempQuaternion.current)
                .normalize();

            groupRef.current.quaternion.setFromUnitVectors(
                UP,
                tempDirection.current,
            );
        } else {
            // Tartalék interpoláció több lépéses ugrásnál
            groupRef.current.quaternion.slerpQuaternions(
                from.current,
                to.current,
                eased,
            );
        }

        if (elapsed.current >= DURATION) {
            groupRef.current.quaternion.copy(to.current);

            if (pendingHide.current) {
                pendingHide.current = false;
                setDisplayHidden(true);
            }

            if (pendingLabel.current !== null) {
                setDisplayLabel(pendingLabel.current);
                pendingLabel.current = null;
            }
        }
    });

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
