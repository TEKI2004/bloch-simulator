
import BlochAxes from "./BlochAxes";
import BlochGrid from "./BlochGrid";

export default function BlochSphere() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 64, 32]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <BlochGrid />
      <BlochAxes />
    </group>
  );
}
