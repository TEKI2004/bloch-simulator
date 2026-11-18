
import BlochAxes from "./BlochAxes";
import BlochGrid from "./BlochGrid";
import StateVector from "./StateVector";
import { toBlochVector } from "../../quantum/bloch";
import type { QubitState } from "../../quantum/QubitState";
import { memo } from "react";

export type DisplayState = {
  id: number;
  state: QubitState;
  color: string;
  label: string;
};

type Props = {
  vectors: DisplayState[];
};

const MemoBlochAxes = memo(BlochAxes);
const MemoBlochGrid = memo(BlochGrid);

export default function BlochSphere({ vectors }: Props) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 64, 32]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.1} depthWrite={false} />
      </mesh>

      <MemoBlochGrid />
      <MemoBlochAxes />

      {vectors.map(({ id, state, color, label }) => (
        <StateVector
          key={id}
          direction={toBlochVector(state)}
          color={color}
          label={label}
        />
      ))}
    </group>
  );
}
