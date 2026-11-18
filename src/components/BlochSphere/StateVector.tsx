
import { Html, Line } from "@react-three/drei";
import { Quaternion, Vector3 } from "three";

type Props = {
    direction: [number, number, number];
    color: string;
    label: string;
};

export default function StateVector({ direction, color, label }: Props) {
    const v = new Vector3(...direction).normalize();
    const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), v);

    return (
        <group>
            <Line
                points={[[0, 0, 0], [v.x * 0.84, v.y * 0.84, v.z * 0.84]]}
                color={color}
                lineWidth={3}
                transparent
                opacity={1}
                depthTest={false}
                depthWrite={false}
                renderOrder={10}
                toneMapped={false}
            />

            <mesh
                position={[v.x * 0.92, v.y * 0.92, v.z * 0.92]}
                quaternion={rotation}
                renderOrder={10}
            >
                <coneGeometry args={[0.055, 0.16, 16]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={1}
                    toneMapped={false}
                    depthTest={false}
                    depthWrite={false}
                />
            </mesh>

            <Html
                position={[v.x * 1.15, v.y * 1.15, v.z * 1.15]}
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
                {label}
            </Html>
        </group>
    );
}
