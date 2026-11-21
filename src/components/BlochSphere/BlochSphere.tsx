
import { memo } from "react";

import BlochAxes from "./BlochAxes";
import BlochGrid from "./BlochGrid";
import TrackedVector from "./TrackedVector";

import { prepareVectors } from "./vectorGrouping";
import type { DisplayState } from "./vectorGrouping";
import type { VisualTransition } from "../../simulator/SimulatorState";

// A korábbi típusimportok kompatibilitásához
export type { DisplayState } from "./vectorGrouping";

const MemoBlochAxes = memo(BlochAxes);
const MemoBlochGrid = memo(BlochGrid);

type Props = {
  vectors: DisplayState[];
  selectedStateId?: number;
  mergeAnimationKey: string;
  gateEditRevision: number;
  visualTransition: VisualTransition;
};

export default function BlochSphere({
  vectors,
  selectedStateId,
  mergeAnimationKey,
  gateEditRevision,
  visualTransition,
}: Props) {
  const preparedVectors = prepareVectors(vectors, selectedStateId);

  return (
    <group>
      {/* Gömbfelület */}
      <mesh>
        <sphereGeometry args={[1, 64, 32]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* Koordinátarendszer */}
      <MemoBlochGrid />
      <MemoBlochAxes />

      {/* Állapotvektorok és history curve-ök */}
      {preparedVectors.map((prepared) => {
        const {
          vector,
          direction,
          label,
          mergedHidden,
          keepMergedDuringAnimation,
        } = prepared;

        return (
          <TrackedVector
            key={vector.id}
            vector={vector}
            direction={direction}
            label={label}
            mergedHidden={mergedHidden}
            renderOrder={
              vector.id === selectedStateId
                ? 30
                : 10 + vector.id
            }
            mergeAnimationKey={mergeAnimationKey}
            gateEditRevision={gateEditRevision}
            keepMergedDuringAnimation={keepMergedDuringAnimation}
            visualTransition={visualTransition}
          />
        );
      })}
    </group>
  );
}
