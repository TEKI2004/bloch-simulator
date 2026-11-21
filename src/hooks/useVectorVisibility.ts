import { useCallback, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

type VisibilityUpdate = {
  label: string;
  ownLabel: string;
  mergedHidden: boolean;
  isAnimating: boolean;
  keepMergedDuringAnimation: boolean;
  shouldAnimate: boolean;
  directionChanged: boolean;
  newlyVisible: boolean;
};

export function useVectorVisibility(initialLabel: string, initialHidden: boolean, consumeFinished: () => boolean) {
  const [displayHidden, setDisplayHidden] = useState(initialHidden);
  const [displayLabel, setDisplayLabel] = useState(initialLabel);

  const visualRef = useRef({
    hidden: initialHidden,
    label: initialLabel,
  });

  const pendingHide = useRef(false);
  const pendingLabel = useRef<string | null>(null);

  const getCurrentLabel = useCallback(() => visualRef.current.label, []);

  const updateVisibility = useCallback(
    ({
      label,
      ownLabel,
      mergedHidden,
      isAnimating,
      keepMergedDuringAnimation,
      shouldAnimate,
      directionChanged,
      newlyVisible,
    }: VisibilityUpdate) => {
      if (isAnimating && keepMergedDuringAnimation) {
        // Az együtt mozgó vektorok összevonva maradnak.
        pendingHide.current = false;
        pendingLabel.current = null;

        visualRef.current.hidden = mergedHidden;
        visualRef.current.label = label;
      } else if (isAnimating) {
        // Animáció közben még látható marad a vektor.
        visualRef.current.hidden = false;
        pendingHide.current = mergedHidden;

        const isMoving = shouldAnimate && directionChanged;

        const oldCount = visualRef.current.label ? visualRef.current.label.split(",").length : 0;

        const newCount = label ? label.split(",").length : 0;

        if (isMoving) {
          visualRef.current.label = ownLabel;
          pendingLabel.current = label === ownLabel ? null : label;
        } else if (newlyVisible || (!mergedHidden && newCount < oldCount)) {
          // Szétválás
          pendingLabel.current = null;
          visualRef.current.label = label;
        } else if (mergedHidden || newCount > oldCount) {
          // Összeolvadás: csak érkezéskor frissül.
          pendingLabel.current = label;
        } else {
          pendingLabel.current = null;
          visualRef.current.label = label;
        }
      } else {
        // Animáción kívüli azonnali frissítés.
        pendingHide.current = false;
        pendingLabel.current = null;

        visualRef.current.hidden = mergedHidden;
        visualRef.current.label = label;
      }
    },
    [],
  );

  useFrame(() => {
    if (consumeFinished()) {
      if (pendingHide.current) {
        pendingHide.current = false;
        visualRef.current.hidden = true;
      }

      if (pendingLabel.current !== null) {
        visualRef.current.label = pendingLabel.current;
        pendingLabel.current = null;
      }
    }

    if (displayHidden !== visualRef.current.hidden) {
      setDisplayHidden(visualRef.current.hidden);
    }

    if (displayLabel !== visualRef.current.label) {
      setDisplayLabel(visualRef.current.label);
    }
  });

  return {
    displayHidden,
    displayLabel,
    getCurrentLabel,
    updateVisibility,
  };
}
