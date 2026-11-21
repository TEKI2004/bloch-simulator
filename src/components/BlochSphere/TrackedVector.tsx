
import { useMemo, useRef } from "react";
import StateVector from "./StateVector";
import HistoryCurve from "./HistoryCurve";

import { getHistorySegments } from "../../simulator/history";
import type { BlochVector } from "../../quantum/bloch";
import type { DisplayState } from "./vectorGrouping";
import type { VisualTransition } from "../../simulator/SimulatorState";

type Props = {
    vector: DisplayState;
    direction: BlochVector;
    label: string;
    mergedHidden: boolean;
    renderOrder: number;
    mergeAnimationKey: string;
    gateEditRevision: number;
    keepMergedDuringAnimation: boolean;
    visualTransition: VisualTransition;
};

export default function TrackedVector({
    vector,
    direction,
    label,
    mergedHidden,
    renderOrder,
    mergeAnimationKey,
    gateEditRevision,
    keepMergedDuringAnimation,
    visualTransition,
}: Props) {
    const progressRef = useRef(1);

    const { initialState, gates, stepIndex } = vector;

    // Csak a kvantumállapot vagy a kapusor változásakor számoljuk újra.
    const history = useMemo(
        () => getHistorySegments(initialState, gates, stepIndex),
        [initialState, gates, stepIndex],
    );

    return (
        <>
            <HistoryCurve
                segments={history}
                color={vector.color}
                stepIndex={stepIndex}
                mode={vector.mode}
                gates={gates}
                progressRef={progressRef}
                gateEditRevision={gateEditRevision}
                visualTransition={visualTransition}
            />

            <StateVector
                direction={direction}
                initialState={vector.initialState}
                color={vector.color}
                label={label}
                gates={gates}
                stepIndex={stepIndex}
                mode={vector.mode}
                mergedHidden={mergedHidden}
                renderOrder={renderOrder}
                mergeAnimationKey={mergeAnimationKey}
                progressRef={progressRef}
                ownLabel={vector.label}
                keepMergedDuringAnimation={keepMergedDuringAnimation}
                visualTransition={visualTransition}
            />
        </>
    );
}
