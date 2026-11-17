import { Html, Line } from "@react-three/drei";
import type { CSSProperties } from "react";

const labelStyle: CSSProperties = {
  fontFamily: '"Cambria Math", "Times New Roman", serif',
  fontStyle: "italic",
  fontSize: "24px",
  fontWeight: 400,
  userSelect: "none",
  pointerEvents: "none",
};

export default function BlochAxes() {
  return (
    <group>
      <Line points={[[-1.3, 0, 0], [1.3, 0, 0]]} color="#ef4444" lineWidth={2} />
      <Line points={[[0, -1.3, 0], [0, 1.3, 0]]} color="#22c55e" lineWidth={2} />
      <Line points={[[0, 0, -1.3], [0, 0, 1.3]]} color="#3b82f6" lineWidth={2} />


      {/* X tengely nyílhegye */}
      <mesh position={[1.35, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.07, 0.2, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Y tengely nyílhegye */}
      <mesh position={[0, 1.35, 0]}>
        <coneGeometry args={[0.07, 0.2, 16]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>

      {/* Z tengely nyílhegye */}
      <mesh position={[0, 0, 1.35]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.07, 0.2, 16]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>

      <Html position={[1.65, 0, 0]} center style={{ ...labelStyle, color: "#ef4444" }}>X</Html>
      <Html position={[0, 1.65, 0]} center style={{ ...labelStyle, color: "#22c55e" }}>Y</Html>
      <Html position={[0, 0, 1.65]} center style={{ ...labelStyle, color: "#3b82f6" }}>Z</Html>
    </group>
  );
}
