
import { memo } from "react";
import BlochAxes from "./BlochAxes";
import BlochGrid from "./BlochGrid";
import StateVector from "./StateVector";
import { toBlochVector } from "../../quantum/bloch";
import type { BlochVector } from "../../quantum/bloch";
import type { QubitState } from "../../quantum/QubitState";

const MemoBlochAxes = memo(BlochAxes);
const MemoBlochGrid = memo(BlochGrid);

export type DisplayState = {
  id: number;
  state: QubitState;
  color: string;
  label: string;
};

type Props = {
  vectors: DisplayState[];
  selectedStateId?: number;
};

export default function BlochSphere({ vectors, selectedStateId }: Props) {
  const grouped: {
    ids: number[];
    direction: BlochVector;
    color: string;
    labels: string[];
  }[] = [];

  for (const vector of vectors) {
    const direction = toBlochVector(vector.state);

    const existing = grouped.find((group) =>
      Math.hypot(
        ...direction.map((value, i) => value - group.direction[i]),
      ) < 1e-5,
    );

    if (existing) {
      existing.ids.push(vector.id);
      existing.labels.push(vector.label);

      if (vector.id === selectedStateId) {
        existing.color = vector.color;
      }
    } else {
      grouped.push({
        ids: [vector.id],
        direction,
        color: vector.color,
        labels: [vector.label],
      });
    }
  }

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 64, 32]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>

      <MemoBlochGrid />
      <MemoBlochAxes />

      {grouped.map((group) => (
        <StateVector
          key={group.ids.join("-")}
          direction={group.direction}
          color={group.color}
          label={group.labels.join(", ")}
        />
      ))}
    </group>
  );
}
