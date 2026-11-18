
import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Vector3 } from "three";

type Plane = "xy" | "xz" | "yz";

const radius = 1;
const segments = 64;
const planes: Plane[] = ["xy", "xz", "yz"];

function createArc(plane: Plane, start: number, end: number) {
    return Array.from({ length: segments + 1 }, (_, i) => {
        const a = start + (end - start) * i / segments;
        const c = radius * Math.cos(a);
        const s = radius * Math.sin(a);

        if (plane === "xy") return [c, s, 0] as const;
        if (plane === "xz") return [c, 0, s] as const;
        return [0, c, s] as const;
    });
}

function splitCircle(plane: Plane, camera: Vector3) {
    const [x, y] = plane === "xy" ? [camera.x, camera.y]
        : plane === "xz" ? [camera.x, camera.z]
            : [camera.y, camera.z];

    if (Math.hypot(x, y) < 0.001) {
        return { front: createArc(plane, 0, Math.PI * 2), back: null };
    }

    const angle = Math.atan2(y, x);

    return {
        front: createArc(plane, angle - Math.PI / 2, angle + Math.PI / 2),
        back: createArc(plane, angle + Math.PI / 2, angle + 3 * Math.PI / 2),
    };
}

export default function BlochGrid() {
    const camera = useThree((state) => state.camera);
    const lastPosition = useRef(camera.position.clone());
    const [cameraPosition, setCameraPosition] = useState(() => camera.position.clone());

    useFrame(({ camera }) => {
        if (lastPosition.current.distanceToSquared(camera.position) < 0.0001) return;

        lastPosition.current.copy(camera.position);
        setCameraPosition(camera.position.clone());
    });

    return (
        <group>
            {planes.map((plane) => {
                const { front, back } = splitCircle(plane, cameraPosition);

                return (
                    <group key={plane}>
                        <Line points={front} color="#64748B" lineWidth={1} transparent opacity={0.6} depthWrite={false} />

                        {back && (
                            <Line points={back} color="#64748B" lineWidth={1} dashed
                                dashSize={0.06} gapSize={0.04} transparent opacity={0.3} depthWrite={false} />
                        )}
                    </group>
                );
            })}
        </group>
    );
}
