import { useEffect, useRef, useState } from "react";

type GateTarget = "shared" | number;

type Props = {
  target: GateTarget | null;
  stepIndex: number;
  totalSteps: number;
  nextStep: (target: GateTarget) => void;
};

const STEP_INTERVAL = 650;

export function usePlayback({ target, stepIndex, totalSteps, nextStep }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const nextStepRef = useRef(nextStep);

  useEffect(() => {
    nextStepRef.current = nextStep;
  }, [nextStep]);

  useEffect(() => {
    if (!isPlaying || target === null || stepIndex >= totalSteps) {
      return;
    }

    const timeout = window.setTimeout(() => {
      nextStepRef.current(target);

      if (stepIndex + 1 >= totalSteps) {
        setIsPlaying(false);
      }
    }, STEP_INTERVAL);

    return () => window.clearTimeout(timeout);
  }, [isPlaying, target, stepIndex, totalSteps]);

  function stopPlayback() {
    setIsPlaying(false);
  }

  function togglePlayback() {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    if (target === null || stepIndex >= totalSteps) return;

    nextStepRef.current(target);

    setIsPlaying(stepIndex + 1 < totalSteps);
  }

  return {
    isPlaying,
    stopPlayback,
    togglePlayback,
  };
}
