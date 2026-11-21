
import type { DragEvent } from "react";
import type {
    GateStep,
    TrackedState,
} from "../../../simulator/SimulatorState";

import type { CircuitRowData } from "./types";
import CircuitRowLabel from "./CircuitRowLabel";
import CircuitTrack from "./CircuitTrack";

type Props = {
    row: CircuitRowData;
    selected: boolean;
    states: TrackedState[];
    selectedStateId?: number;
    hoveredSlot: string | null;
    previewGateWidth: number;
    editingGateId?: string;

    onSelectState: (id: number) => void;
    onJumpToStart: () => void;

    onPaletteDragOver: (
        event: DragEvent<HTMLDivElement>,
    ) => void;

    onPaletteDrop: (
        event: DragEvent<HTMLDivElement>,
    ) => void;

    onGateClick: (
        gate: GateStep,
        index: number,
        anchor: HTMLButtonElement,
    ) => void;

    onGateDragStart: (
        event: DragEvent<HTMLButtonElement>,
        gate: GateStep,
        index: number,
    ) => void;

    onGateDragEnd: () => void;
    onClear: () => void;
};

export default function CircuitRow({
    row,
    selected,
    states,
    selectedStateId,
    hoveredSlot,
    previewGateWidth,
    editingGateId,
    onSelectState,
    onJumpToStart,
    onPaletteDragOver,
    onPaletteDrop,
    onGateClick,
    onGateDragStart,
    onGateDragEnd,
    onClear,
}: Props) {
    return (
        <div
            data-row-target={row.target}
            className={`qc-row ${selected ? "qc-row-selected" : ""
                }`}
        >
            <CircuitRowLabel
                target={row.target}
                label={row.label}
                color={row.color}
                states={states}
                selectedStateId={selectedStateId}
                onSelectState={onSelectState}
                onJumpToStart={onJumpToStart}
            />

            <div
                className="qc-row-scroll"
                onClick={() => {
                    if (typeof row.target === "number") {
                        onSelectState(row.target);
                    }
                }}
                onWheel={(event) => {
                    const element = event.currentTarget;

                    if (
                        element.scrollWidth <=
                        element.clientWidth
                    ) {
                        return;
                    }

                    element.scrollLeft +=
                        event.deltaY || event.deltaX;

                    event.preventDefault();
                }}
            >
                <CircuitTrack
                    row={row}
                    hoveredSlot={hoveredSlot}
                    previewGateWidth={previewGateWidth}
                    editingGateId={editingGateId}
                    onPaletteDragOver={onPaletteDragOver}
                    onPaletteDrop={onPaletteDrop}
                    onGateClick={onGateClick}
                    onGateDragStart={onGateDragStart}
                    onGateDragEnd={onGateDragEnd}
                />
            </div>

            <div className="qc-row-actions">
                <span className="qc-step-count">
                    {row.stepIndex}/{row.gates.length}
                </span>

                <button
                    type="button"
                    className="qc-clear-button"
                    disabled={row.gates.length === 0}
                    onClick={onClear}
                    title="Kapusor törlése"
                    aria-label="Kapusor törlése"
                >
                    <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M5 6l1 14h12l1-14" />
                        <path d="M10 10v7M14 10v7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
