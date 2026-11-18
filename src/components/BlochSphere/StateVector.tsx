import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Group, Quaternion, Vector3 } from "three";

type Props = {
    direction: [number, number, number];
    color: string;
    label: string;
    animationKey: string;
    mergedHidden?: boolean;
    renderOrder?: number;
};

const UP = new Vector3(0, 1, 0);
const DURATION = 0.45;

export default function StateVector({
    direction,
    color,
    label,
    animationKey,
    mergedHidden = false,
    renderOrder = 10,
}: Props) {
    const [initialRotation] = useState(() =>
        new Quaternion().setFromUnitVectors(
            UP,
            new Vector3(...direction).normalize(),
        ),
    );

    const [displayHidden, setDisplayHidden] = useState(mergedHidden);
    const [displayLabel, setDisplayLabel] = useState(label);
    const pendingLabel = useRef<string | null>(null);
    const lastMergedHidden = useRef(mergedHidden);

    const groupRef = useRef<Group>(null);
    const lastDirection = useRef(new Vector3(...direction).normalize());
    const lastAnimationKey = useRef(animationKey);
    const pendingHide = useRef(false);

    const from = useRef(initialRotation.clone());
    const to = useRef(initialRotation.clone());
    const elapsed = useRef(DURATION);


    useEffect(() => {
        const next = new Vector3(...direction).normalize();

        const shouldAnimate = lastAnimationKey.current !== animationKey;
        lastAnimationKey.current = animationKey;

        const directionChanged =
            lastDirection.current.distanceToSquared(next) >= 1e-10;

        const newlyHidden = mergedHidden && !lastMergedHidden.current;
        lastMergedHidden.current = mergedHidden;
        lastDirection.current.copy(next);

        const delayLabel = shouldAnimate && (
            newlyHidden ||
            (label.includes(", ") && label !== displayLabel)
        );

        if (delayLabel) {
            pendingLabel.current = label;
        } else {
            pendingLabel.current = null;
            setDisplayLabel(label);
        }

        to.current.setFromUnitVectors(UP, next);

        if (shouldAnimate && (directionChanged || delayLabel)) {
            from.current.copy(groupRef.current?.quaternion ?? to.current);
            elapsed.current = 0;
        } else if (directionChanged) {
            groupRef.current?.quaternion.copy(to.current);
            elapsed.current = DURATION;
        }

        if (newlyHidden && shouldAnimate) {
            pendingHide.current = true;
            setDisplayHidden(false);
        } else if (!mergedHidden) {
            pendingHide.current = false;
            setDisplayHidden(false);
        } else if (!pendingHide.current) {
            setDisplayHidden(true);
        }
    }, [direction, animationKey, mergedHidden, label, displayLabel]);


    useFrame((_, delta) => {
        if (!groupRef.current || elapsed.current >= DURATION) return;

        elapsed.current = Math.min(DURATION, elapsed.current + delta);

        const t = elapsed.current / DURATION;
        const eased = t * t * (3 - 2 * t);

        groupRef.current.quaternion.slerpQuaternions(
            from.current,
            to.current,
            eased,
        );

        if (elapsed.current >= DURATION) {
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
        <group ref={groupRef} quaternion={initialRotation} visible={!displayHidden}>
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

            {displayLabel && (
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