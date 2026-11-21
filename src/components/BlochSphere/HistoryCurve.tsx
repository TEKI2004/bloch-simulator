
import AnimatedHistorySegment from "./AnimatedHistorySegment";
import StaticHistorySegment from "./StaticHistorySegment";

import { useHistoryTransition } from "../../hooks/useHistoryTransition";
import type { HistorySegment } from "../../simulator/history";
import type {
    GateStep,
    SimulatorMode,
    VisualTransition,
} from "../../simulator/SimulatorState";
import { memo } from "react";

type Props = {
    segments: HistorySegment[];
    color: string;
    stepIndex: number;
    mode: SimulatorMode;
    progressRef: { current: number };
    gates: GateStep[];
    gateEditRevision: number;
    visualTransition: VisualTransition;
};

export function HistoryCurve({
    segments,
    color,
    stepIndex,
    mode,
    progressRef,
    gates,
    gateEditRevision,
    visualTransition,
}: Props) {
    const transition = useHistoryTransition({
        segments,
        gates,
        stepIndex,
        mode,
        gateEditRevision,
        visualTransition,
    });

    return (
        <group>
            {/* Végrehajtott kapuk görbéi */}
            {segments.map((segment) =>
                transition?.segment.gateId === segment.gateId &&
                    !transition.reverse ? (
                    <AnimatedHistorySegment
                        key={segment.gateId}
                        segment={segment}
                        color={color}
                        progressRef={progressRef}
                    />
                ) : (
                    <StaticHistorySegment
                        key={segment.gateId}
                        segment={segment}
                        color={color}
                    />
                ),
            )}

            {/* Visszaléptetéskor eltűnő görbe */}
            {transition?.reverse && (
                <AnimatedHistorySegment
                    key={`reverse-${transition.segment.gateId}`}
                    segment={transition.segment}
                    color={color}
                    progressRef={progressRef}
                    reverse
                />
            )}
        </group>
    );
}

export default memo(HistoryCurve);