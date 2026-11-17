import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import BlochSphere from "./components/BlochSphere/BlochSphere";

export default function App() {
  return (
    <Canvas camera={{ position: [3, 3, 2], fov: 45, up: [0, 0, 1] }}>
      <color attach="background" args={["#101827"]} />
      <BlochSphere />
      <OrbitControls
        target={[0, 0, 0]}
        enablePan={false}
        enableDamping
        minDistance={2}
        maxDistance={8}
      />
    </Canvas>
  );
}
