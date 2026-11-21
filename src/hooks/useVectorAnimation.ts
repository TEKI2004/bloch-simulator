import { useCallback, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Quaternion, Vector3 } from "three";
import type { BlochVector } from "../quantum/bloch";
import type { GateRotation } from "../quantum/gateRotation";

const UP = new Vector3(0, 1, 0);
const DURATION = 0.45;

type ProgressRef = { current: number };

export function useVectorAnimation(initialDirection: BlochVector, progressRef: ProgressRef) {
  const [initialRotation] = useState(() => new Quaternion().setFromUnitVectors(UP, new Vector3(...initialDirection).normalize()));

  const groupRef = useRef<Group>(null);

  const from = useRef(initialRotation.clone());
  const to = useRef(initialRotation.clone());
  const elapsed = useRef(DURATION);

  // Kvantumkapu forgáspályája
  const gatePath = useRef(false);
  const axis = useRef(new Vector3(0, 0, 1));
  const angle = useRef(0);
  const startDirection = useRef(new Vector3(...initialDirection).normalize());

  // Segédobjektumok, amelyeket képkockánként újrahasználunk
  const tempQuaternion = useRef(new Quaternion());
  const tempDirection = useRef(new Vector3());

  const justFinished = useRef(false);

  // Animáció elindítása
  const start = useCallback(
    (previousDirection: Vector3, nextDirection: Vector3, rotation: GateRotation | null, stepDirection: number) => {
      const previousFinished = elapsed.current >= DURATION;

      from.current.copy(groupRef.current?.quaternion ?? to.current);

      to.current.setFromUnitVectors(UP, nextDirection);
      gatePath.current = false;

      if (rotation && previousFinished) {
        axis.current.set(...rotation.axis).normalize();

        angle.current = rotation.angle * Math.sign(stepDirection);

        startDirection.current.copy(previousDirection);
        gatePath.current = true;
      }

      elapsed.current = 0;
      progressRef.current = 0;
      justFinished.current = false;
    },
    [progressRef],
  );

  // Azonnali pozícióváltás animáció nélkül
  const snap = useCallback(
    (nextDirection: Vector3) => {
      to.current.setFromUnitVectors(UP, nextDirection);

      groupRef.current?.quaternion.copy(to.current);

      elapsed.current = DURATION;
      gatePath.current = false;
      progressRef.current = 1;
      justFinished.current = false;
    },
    [progressRef],
  );

  const isRunning = useCallback(() => elapsed.current < DURATION, []);

  // Forgatás minden képkockán
  useFrame((_, delta) => {
    if (!groupRef.current || elapsed.current >= DURATION) {
      return;
    }

    elapsed.current = Math.min(DURATION, elapsed.current + delta);

    const t = elapsed.current / DURATION;
    const eased = t * t * (3 - 2 * t);

    progressRef.current = eased;

    if (gatePath.current) {
      // Tényleges kvantumkapu-forgás
      tempQuaternion.current.setFromAxisAngle(axis.current, angle.current * eased);

      tempDirection.current.copy(startDirection.current).applyQuaternion(tempQuaternion.current).normalize();

      groupRef.current.quaternion.setFromUnitVectors(UP, tempDirection.current);
    } else {
      // Tartalék interpoláció megszakított animációnál
      groupRef.current.quaternion.slerpQuaternions(from.current, to.current, eased);
    }

    if (elapsed.current >= DURATION) {
      groupRef.current.quaternion.copy(to.current);
      justFinished.current = true;
    }
  });

  const consumeFinished = useCallback((): boolean => {
    if (!justFinished.current) return false;

    justFinished.current = false;
    return true;
  }, []);

  return {
    groupRef,
    initialRotation,
    start,
    snap,
    isRunning,
    consumeFinished,
  };
}
