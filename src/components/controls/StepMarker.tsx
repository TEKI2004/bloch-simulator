
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Props = {
    target: string | number;
    stepIndex: number;
    gateCount: number;
    gateEditRevision: number;
    instantJumpRevision: number;
    hoveredSlot: string | null;
};

type Snapshot = {
    step: number;
    count: number;
    edit: number;
    jump: number;
    hoveredSlot: string | null;
};

const GATE_GAP = 16;

const STEP_DURATION = 450;
const DRAG_DURATION = 120;


function getMarkerPosition(
    target: string | number,
    stepIndex: number,
    hoveredSlot: string | null,
) {
    const track = document.querySelector<HTMLElement>(
        `.qc-track[data-row-target="${target}"]`,
    );

    const scrollContainer = track?.closest<HTMLElement>(
        ".qc-row-scroll",
    );

    if (!track || !scrollContainer) return null;

    const trackRect = track.getBoundingClientRect();
    const viewportRect = scrollContainer.getBoundingClientRect();

    const gates = Array.from(
        track.querySelectorAll<HTMLElement>(".qc-gate"),
    );

    const index = Math.max(
        0,
        Math.min(stepIndex, gates.length),
    );

    let left = trackRect.left + GATE_GAP / 2;

    for (let i = 0; i < index; i++) {
        left += gates[i].getBoundingClientRect().width + GATE_GAP;
    }

    const prefix = `${target}-`;

    if (hoveredSlot?.startsWith(prefix)) {
        const hoveredIndex = Number(
            hoveredSlot.slice(prefix.length),
        );

        if (
            Number.isInteger(hoveredIndex) &&
            hoveredIndex < index
        ) {
            const previewSlot = track.querySelector<HTMLElement>(
                ".qc-drop-active",
            );

            if (previewSlot) {
                const previewWidth = Number.parseFloat(
                    previewSlot.style.width,
                );

                if (Number.isFinite(previewWidth)) {
                    left += previewWidth - GATE_GAP;
                }
            }
        }
    }

    return {
        viewport: viewportRect,
        left: left - viewportRect.left,
        top: trackRect.top + 2 - viewportRect.top,
    };
}


export default function StepMarker({
    target,
    stepIndex,
    gateCount,
    gateEditRevision,
    instantJumpRevision,
    hoveredSlot,
}: Props) {
    const markerRef = useRef<HTMLSpanElement>(null);
    const previous = useRef<Snapshot | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    const updateMarkerPosition = useCallback((duration: number) => {
        const overlay = overlayRef.current;
        const marker = markerRef.current;

        const position = getMarkerPosition(
            target,
            stepIndex,
            hoveredSlot,
        );

        if (!overlay || !marker || !position) return;

        const { viewport } = position;

        overlay.style.left = `${viewport.left}px`;
        overlay.style.top = `${viewport.top}px`;
        overlay.style.width = `${viewport.width}px`;
        overlay.style.height = `${viewport.height}px`;

        marker.style.transition = duration > 0
            ? `left ${duration}ms ${duration === DRAG_DURATION ? "ease" : "ease-in-out"
            }`
            : "none";

        marker.style.left = `${position.left}px`;
        marker.style.top = `${position.top}px`;
    }, [target, stepIndex, hoveredSlot]);


    useLayoutEffect(() => {
        const marker = markerRef.current;
        const position = getMarkerPosition(target, stepIndex, hoveredSlot);

        if (!marker || !position) return;

        const old = previous.current;

        const stepChanged = old !== null && old.step !== stepIndex;

        const editChanged =
            old !== null && old.edit !== gateEditRevision;

        const jumpChanged =
            old !== null && old.jump !== instantJumpRevision;

        // Kapu törlése a már végrehajtott szakaszból
        const deletedBeforeStep =
            old !== null &&
            editChanged &&
            old.count === gateCount + 1 &&
            old.step === stepIndex + 1;

        // Normál előre-/visszaléptetés
        const normalStep =
            stepChanged && !editChanged && !jumpChanged;

        // Drag-előnézet változása
        const previewChanged =
            old !== null && old.hoveredSlot !== hoveredSlot;

        let duration = 0;

        if (normalStep || deletedBeforeStep) {
            duration = STEP_DURATION;
        } else if (previewChanged) {
            duration = DRAG_DURATION;
        }

        updateMarkerPosition(duration);

        previous.current = {
            step: stepIndex,
            count: gateCount,
            edit: gateEditRevision,
            jump: instantJumpRevision,
            hoveredSlot,
        };
    }, [
        target,
        stepIndex,
        gateCount,
        gateEditRevision,
        instantJumpRevision,
        hoveredSlot,
        updateMarkerPosition,
    ]);

    // Görgetéskor és ablakméret-változáskor igazítás
    useEffect(() => {
        function updatePosition() {
            updateMarkerPosition(0);
        }

        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);

        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [updateMarkerPosition]);

    return createPortal(
        <div
            ref={overlayRef}
            className="qc-step-overlay"
            aria-hidden="true"
        >
            <span
                ref={markerRef}
                className="qc-step-marker"
            />
        </div>,
        document.body,
    );
}
