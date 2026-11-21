import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Quaternion, Vector3 } from "three";
import type { BlochVector } from "../quantum/bloch";
import type { GateRotation } from "../quantum/gateRotation";

const UP = new Vector3(0, 1, 0);
const IDENTITY = new Quaternion();
const DURATION = 0.45;

type ProgressRef = { current: number };

export function useVectorAnimation(initialDirection: BlochVector, progressRef: ProgressRef) {
  const [initialRotation] = useState(() => new Quaternion().setFromUnitVectors(UP, new Vector3(...initialDirection).normalize()));

  const groupRef = useRef<Group>(null);

  useLayoutEffect(() => {
    groupRef.current?.quaternion.copy(initialRotation);
  }, [initialRotation]);

  const from = useRef(initialRotation.clone());
  const to = useRef(initialRotation.clone());
  const elapsed = useRef(DURATION);

  const holdOnly = useRef(false);

  // Kvantumkapu forgáspályája
  const gatePath = useRef(false);
  const shortestPath = useRef(false);
  const shortestRotation = useRef(new Quaternion());
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
      shortestPath.current = false;
      holdOnly.current = false;
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

  const startShortest = useCallback(
    (nextDirection: Vector3) => {
      holdOnly.current = false;

      // A ténylegesen kirajzolt pozícióból indulunk.
      const currentRotation = groupRef.current?.quaternion ?? to.current;

      startDirection.current.copy(UP).applyQuaternion(currentRotation).normalize();

      shortestRotation.current.setFromUnitVectors(startDirection.current, nextDirection.clone().normalize());

      from.current.copy(currentRotation);
      to.current.setFromUnitVectors(UP, nextDirection);

      gatePath.current = false;
      shortestPath.current = true;

      elapsed.current = 0;
      progressRef.current = 0;
      justFinished.current = false;
    },
    [progressRef],
  );

  // Azonnali pozícióváltás animáció nélkül
  const snap = useCallback(
    (nextDirection: Vector3) => {
      shortestPath.current = false;
      holdOnly.current = false;
      to.current.setFromUnitVectors(UP, nextDirection);

      groupRef.current?.quaternion.copy(to.current);

      elapsed.current = DURATION;
      gatePath.current = false;
      progressRef.current = 1;
      justFinished.current = false;
    },
    [progressRef],
  );

  // Wait for another vector to reach this one, without snapping an
  // animation that was already in progress. Keep history progress unchanged.
  const waitForMerge = useCallback((targetDirection: Vector3) => {
    const target = targetDirection.clone().normalize();
    const currentTarget = UP.clone().applyQuaternion(to.current).normalize();

    // A previous transition is already heading toward this target.
    if (elapsed.current < DURATION && currentTarget.distanceToSquared(target) < 1e-10) {
      return;
    }

    const displayed = UP.clone()
      .applyQuaternion(groupRef.current?.quaternion ?? to.current)
      .normalize();

    // The previous transition was interrupted, and we're not yet at the
    // merge point. Finish the remaining distance smoothly, not by snapping.
    if (displayed.distanceToSquared(target) >= 1e-10) {
      startShortest(target);
      return;
    }

    shortestPath.current = false;
    gatePath.current = false;
    holdOnly.current = true;
    to.current.setFromUnitVectors(UP, target);
    from.current.copy(groupRef.current?.quaternion ?? to.current);

    elapsed.current = 0;
    justFinished.current = false;
  }, [startShortest]);

  const isRunning = useCallback(() => elapsed.current < DURATION, []);

  // Forgatás minden képkockán

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (elapsed.current >= DURATION) {
      const difference = 1 - Math.abs(group.quaternion.dot(to.current));

      if (difference > 1e-8) {
        group.quaternion.copy(to.current);
      }

      return;
    }

    elapsed.current = Math.min(DURATION, elapsed.current + delta);

    if (holdOnly.current) {
      if (elapsed.current >= DURATION) {
        holdOnly.current = false;
        justFinished.current = true;
      }
      return;
    }

    const t = elapsed.current / DURATION;
    const eased = t * t * (3 - 2 * t);

    progressRef.current = eased;

    if (gatePath.current) {
      tempQuaternion.current.setFromAxisAngle(axis.current, angle.current * eased);

      tempDirection.current.copy(startDirection.current).applyQuaternion(tempQuaternion.current).normalize();

      group.quaternion.setFromUnitVectors(UP, tempDirection.current);
    } else if (shortestPath.current) {
      tempQuaternion.current.slerpQuaternions(IDENTITY, shortestRotation.current, eased);

      tempDirection.current.copy(startDirection.current).applyQuaternion(tempQuaternion.current).normalize();

      group.quaternion.setFromUnitVectors(UP, tempDirection.current);
    } else {
      group.quaternion.slerpQuaternions(from.current, to.current, eased);
    }

    if (elapsed.current >= DURATION) {
      group.quaternion.copy(to.current);
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
    waitForMerge,
    startShortest,
  };
}
