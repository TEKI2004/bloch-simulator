import { Html, Line } from "@react-three/drei";
import type { CSSProperties } from "react";

const labelStyle: CSSProperties = {
  fontFamily: '"Cambria Math", "Times New Roman", serif',
  fontStyle: "italic",
  fontSize: "24px",
  fontWeight: 400,
  whiteSpace: "nowrap",
  userSelect: "none",
  pointerEvents: "none",
};

export default function BlochAxes() {
  return (
    <group>


      {/* X */}
      <Line points={[[-1.3, 0, 0], [0, 0, 0]]} color="#94A3B8" lineWidth={2} dashed dashSize={0.06} gapSize={0.04} transparent opacity={0.3} />
      <Line points={[[0, 0, 0], [1.3, 0, 0]]} color="#94A3B8" lineWidth={2} transparent opacity={0.9} />

      {/* Y */}
      <Line points={[[0, -1.3, 0], [0, 0, 0]]} color="#94A3B8" lineWidth={2} dashed dashSize={0.06} gapSize={0.04} transparent opacity={0.3} />
      <Line points={[[0, 0, 0], [0, 1.3, 0]]} color="#94A3B8" lineWidth={2} transparent opacity={0.9} />

      {/* Z */}
      <Line points={[[0, 0, -1.3], [0, 0, 0]]} color="#94A3B8" lineWidth={2} dashed dashSize={0.06} gapSize={0.04} transparent opacity={0.3} />
      <Line points={[[0, 0, 0], [0, 0, 1.3]]} color="#94A3B8" lineWidth={2} transparent opacity={0.9} />




      {/* X */}
      <mesh position={[1.325, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.0525, 0.15, 16]} />
        <meshBasicMaterial color="#94A3B8" />
      </mesh>

      {/* Y */}
      <mesh position={[0, 1.325, 0]}>
        <coneGeometry args={[0.0525, 0.15, 16]} />
        <meshBasicMaterial color="#94A3B8" />
      </mesh>

      {/* Z */}
      <mesh position={[0, 0, 1.325]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.0525, 0.15, 16]} />
        <meshBasicMaterial color="#94A3B8" />
      </mesh>


      <Html position={[1.5, 0, 0]} center style={{ ...labelStyle, color: "#94A3B8" }}>X</Html>
      <Html position={[0, 1.5, 0]} center style={{ ...labelStyle, color: "#94A3B8" }}>Y</Html>
      <Html position={[0, 0, 1.5]} center style={{ ...labelStyle, color: "#94A3B8" }}>Z</Html>


      <Html position={[0, 0.12, 1.38]} center style={{ ...labelStyle, fontStyle: "normal", color: "#94A3B8" }}>|0⟩</Html>
      <Html position={[0, 0.12, -1.38]} center style={{ ...labelStyle, fontStyle: "normal", color: "#94A3B8" }}>|1⟩</Html>

      <Html position={[1.15, 0, 0.2]} center style={{ ...labelStyle, fontStyle: "normal", color: "#94A3B8" }}>|+⟩</Html>
      <Html position={[-1.15, 0, 0.2]} center style={{ ...labelStyle, fontStyle: "normal", color: "#94A3B8" }}>|−⟩</Html>

    </group>
  );
}
