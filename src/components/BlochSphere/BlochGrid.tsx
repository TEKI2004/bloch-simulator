
import { Line } from "@react-three/drei";

const radius = 1.005;
const segments = 128;

const angles = Array.from({ length: segments + 1 }, (_, i) => (i / segments) * Math.PI * 2);

const equator = angles.map((a) => [radius * Math.cos(a), radius * Math.sin(a), 0] as const);
const meridianXZ = angles.map((a) => [radius * Math.cos(a), 0, radius * Math.sin(a)] as const);
const meridianYZ = angles.map((a) => [0, radius * Math.cos(a), radius * Math.sin(a)] as const);

export default function BlochGrid() {
    return (
        <group>
            {[equator, meridianXZ, meridianYZ].map((points, i) => (
                <Line key={i} points={points} color="#93b4dc" lineWidth={1} transparent opacity={0.4} />
            ))}
        </group>
    );
}
