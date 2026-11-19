import { memo, useMemo } from "react";
import BlochAxes from "./BlochAxes";
import BlochGrid from "./BlochGrid";
import StateVector from "./StateVector";
import { toBlochVector } from "../../quantum/bloch";
import type { BlochVector } from "../../quantum/bloch";
import type { QubitState } from "../../quantum/QubitState";
import type { GateStep, SimulatorMode, } from "../../simulator/SimulatorState";
import HistoryCurve from "./HistoryCurve";
import type { HistorySegment } from "../../simulator/history";

const MemoBlochAxes = memo(BlochAxes);
const MemoBlochGrid = memo(BlochGrid);

export type DisplayState = {
  id: number;
  state: QubitState;
  color: string;
  label: string;
  gates: GateStep[];
  stepIndex: number;
  mode: SimulatorMode;
  history: HistorySegment[];
};

type Props = {
  vectors: DisplayState[];
  selectedStateId?: number;
  mergeAnimationKey: string;
};

type Group = {
  direction: BlochVector;
  members: DisplayState[];
};

const MERGE_EPSILON = 1e-5;

function isSameDirection(a: BlochVector, b: BlochVector): boolean {
  return Math.hypot(
    a[0] - b[0],
    a[1] - b[1],
    a[2] - b[2],
  ) < MERGE_EPSILON;
}

export default function BlochSphere({
  vectors,
  selectedStateId,
  mergeAnimationKey,
}: Props) {

  const progressRefs = useMemo(
    () => new Map<number, { current: number }>(),
    [],
  );

  function getProgressRef(id: number) {
    let progress = progressRefs.get(id);

    if (!progress) {
      progress = { current: 1 };
      progressRefs.set(id, progress);
    }

    return progress;
  }

  const directions = new Map<number, BlochVector>();

  for (const vector of vectors) {
    directions.set(vector.id, toBlochVector(vector.state));
  }

  const groups: Group[] = [];

  for (const vector of vectors) {
    const direction = directions.get(vector.id)!;

    const existing = groups.find((group) =>
      isSameDirection(group.direction, direction),
    );

    if (existing) {
      existing.members.push(vector);
    } else {
      groups.push({
        direction,
        members: [vector],
      });
    }
  }

  const representativeById = new Map<number, number>();
  const labelById = new Map<number, string>();
  const hiddenById = new Map<number, boolean>();

  for (const group of groups) {
    const representative =
      group.members.find((member) => member.id === selectedStateId)
      ?? group.members[0];

    const mergedLabel = group.members.map((member) => member.label).join(", ");

    for (const member of group.members) {
      representativeById.set(member.id, representative.id);
      hiddenById.set(member.id, member.id !== representative.id);
      labelById.set(
        member.id,
        member.id === representative.id ? mergedLabel : "",
      );
    }
  }

  const gateSignature = vectors
    .map((vector) =>
      `${vector.id}:${vector.gates
        .map((gate) => `${gate.id}:${gate.label}`)
        .join("|")}`
    )
    .join(";");

  const stayMergedIds = new Set(
    groups
      .filter(
        (group) =>
          group.members.length > 1 &&
          group.members.every((member) => member.mode === "shared"),
      )
      .flatMap((group) => group.members.map((member) => member.id)),
  );

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

      {vectors.map((vector) => (
        <HistoryCurve
          key={vector.id}
          segments={vector.history}
          color={vector.color}
          stepIndex={vector.stepIndex}
          mode={vector.mode}
          progressRef={getProgressRef(vector.id)}
          gates={vector.gates}
        />
      ))}

      {vectors.map((vector) => (
        <StateVector
          key={`${vector.id}-${gateSignature}`}
          direction={directions.get(vector.id)!}
          color={vector.color}
          label={labelById.get(vector.id) ?? vector.label}
          gates={vector.gates}
          stepIndex={vector.stepIndex}
          mode={vector.mode}
          mergedHidden={hiddenById.get(vector.id) ?? false}
          renderOrder={vector.id === selectedStateId ? 30 : 10 + vector.id}
          mergeAnimationKey={mergeAnimationKey}
          progressRef={getProgressRef(vector.id)}
          ownLabel={vector.label}
          keepMergedDuringAnimation={stayMergedIds.has(vector.id)}
        />
      ))}
    </group>
  );
}