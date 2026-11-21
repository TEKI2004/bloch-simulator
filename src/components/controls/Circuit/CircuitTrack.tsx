import type { DragEvent } from "react";
import type { GateStep } from "../../../simulator/SimulatorState";
import type { CircuitRowData } from "./types";
import CircuitGate from "./CircuitGate";

type Props = {
    row: CircuitRowData;
    hoveredSlot: string | null;
    previewGateWidth: number;
    editingGateId?: string;

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
};

export default function CircuitTrack({
    row,
    hoveredSlot,
    previewGateWidth,
    editingGateId,
    onPaletteDragOver,
    onPaletteDrop,
    onGateClick,
    onGateDragStart,
    onGateDragEnd,
}: Props) {
    return (
        <div
            className="qc-track"
            data-row-target={row.target}
            data-step-index={row.stepIndex}
            onDragOver={onPaletteDragOver}
            onDrop={onPaletteDrop}
        >
            <div className="qc-wire" />

            {Array.from(
                { length: row.gates.length + 1 },
                (_, index) => {
                    const gate = row.gates[index];

                    const active =
                        hoveredSlot === `${row.target}-${index}`;

                    return (
                        <div
                            className="qc-entry"
                            key={
                                gate
                                    ? gate.id
                                    : `${row.target}-end`
                            }
                        >
                            <div
                                className={`qc-drop-slot ${active ? "qc-drop-active" : ""
                                    }`}
                                style={
                                    active
                                        ? {
                                            width:
                                                previewGateWidth + 32,
                                        }
                                        : undefined
                                }
                            />

                            {gate && (
                                <CircuitGate
                                    gate={gate}
                                    done={index < row.stepIndex}
                                    selected={
                                        editingGateId === gate.id
                                    }
                                    onClick={(anchor) =>
                                        onGateClick(
                                            gate,
                                            index,
                                            anchor,
                                        )
                                    }
                                    onDragStart={(event) =>
                                        onGateDragStart(
                                            event,
                                            gate,
                                            index,
                                        )
                                    }
                                    onDragEnd={onGateDragEnd}
                                />
                            )}
                        </div>
                    );
                },
            )}
        </div>
    );
}
