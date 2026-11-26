import { useEffect, useRef, useState } from "react";

import {
    MAX_STATES,
} from "../../../simulator/SimulatorState";

import AddStateTrack from "./AddStateTrack";

import type {
    SimulatorState,
} from "../../../simulator/SimulatorState";

import type {
    GateOption,
} from "../../../simulator/gateCatalog";

import {
    STATE_LABELS,
} from "../../../simulator/statePresets";

import GatePopover from "./GatePopover";
import StepMarker from "./StepMarker";

import CircuitRow from "./CircuitRow";

import {
    useCircuitDragDrop,
} from "./useCircuitDragDrop";

import {
    useGateFlipAnimation,
} from "./useGateFlipAnimation";

import type {
    CircuitRowData,
    EditingGate,
    GateTarget,
} from "./types";

import "./CircuitRows.css";

type Props = {
    simulator: SimulatorState;
    selectedStateId?: number;

    onSelectState: (id: number) => void;

    onInsertGate: (
        target: GateTarget,
        index: number,
        gate: GateOption,
    ) => void;

    onMoveGate: (
        source: GateTarget,
        destination: GateTarget,
        id: string,
        index: number,
    ) => void;

    onJumpToStep: (
        target: GateTarget,
        stepIndex: number,
    ) => void;

    onDeleteGate: (
        target: GateTarget,
        gateId: string,
    ) => void;

    onUpdateGateAngle: (
        target: GateTarget,
        gateId: string,
        degrees: number,
    ) => void;

    onClearGates: (
        target: GateTarget,
    ) => void;

    onAddState: () => void;
};

export default function CircuitRows({
    simulator,
    selectedStateId,
    onSelectState,
    onInsertGate,
    onMoveGate,
    onJumpToStep,
    onDeleteGate,
    onUpdateGateAngle,
    onClearGates,
    onAddState,
}: Props) {
    const rowsRef = useRef<HTMLDivElement>(null);

    const previousStateIds = useRef(
        simulator.states.map((state) => state.id),
    );


    useEffect(() => {
        const currentIds = simulator.states.map(
            (state) => state.id,
        );

        const addedId = currentIds.find(
            (id) => !previousStateIds.current.includes(id),
        );

        previousStateIds.current = currentIds;

        if (
            addedId === undefined ||
            simulator.mode !== "individual"
        ) {
            return;
        }

        const newRow = Array.from(
            rowsRef.current?.querySelectorAll<HTMLElement>(
                ".qc-row[data-row-target]",
            ) ?? [],
        ).find(
            (row) => row.dataset.rowTarget === String(addedId),
        );

        newRow?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
        });
    }, [simulator.states, simulator.mode]);


    const [editingGate, setEditingGate] =
        useState<EditingGate | null>(null);

    const {
        prepareDropCommit,
        prepareGateDeletion,
    } = useGateFlipAnimation(
        rowsRef,
        simulator.gateEditRevision,
    );

    const dragDrop = useCircuitDragDrop({
        rootRef: rowsRef,
        prepareDropCommit,
        onInsertGate,
        onMoveGate,
    });

    const rows: CircuitRowData[] =
        simulator.mode === "shared"
            ? [{
                target: "shared",
                label: "Közös kapusor",
                color: "#94A3B8",
                gates: simulator.sharedGates,
                stepIndex: simulator.sharedStepIndex,
            }]
            : simulator.states.map((state) => ({
                target: state.id,
                label: STATE_LABELS[state.id - 1],
                color: state.color,
                gates: state.individualGates,
                stepIndex: state.individualStepIndex,
            }));

    const rowLayoutKey = rows
        .map((row) => row.target)
        .join("|");

    const nextStateId = Array.from(
        { length: MAX_STATES },
        (_, index) => index + 1,
    ).find(
        (id) => !simulator.states.some(
            (state) => state.id === id,
        ),
    );

    const editingSequence =
        editingGate?.target === "shared"
            ? simulator.sharedGates
            : simulator.states.find(
                (state) =>
                    state.id === editingGate?.target,
            )?.individualGates;

    const selectedGate = editingSequence?.find(
        (gate) =>
            gate.id === editingGate?.gateId,
    );

    return (
        <div className="qc-rows" ref={rowsRef}>
            {rows.map((row) => (
                <CircuitRow
                    key={row.target}
                    row={row}
                    selected={
                        row.target === "shared" ||
                        row.target === selectedStateId
                    }
                    states={simulator.states}
                    selectedStateId={selectedStateId}
                    hoveredSlot={dragDrop.hoveredSlot}
                    previewGateWidth={
                        dragDrop.previewGateWidth
                    }
                    editingGateId={
                        editingGate?.target === row.target
                            ? editingGate.gateId
                            : undefined
                    }
                    onSelectState={onSelectState}
                    onJumpToStart={() =>
                        onJumpToStep(row.target, 0)
                    }
                    onPaletteDragOver={(event) =>
                        dragDrop.onPaletteDragOver(
                            event,
                            row.target,
                        )
                    }
                    onPaletteDrop={(event) =>
                        dragDrop.onPaletteDrop(
                            event,
                            row.target,
                        )
                    }
                    onGateClick={(gate, index, anchor) => {
                        if (
                            typeof row.target === "number"
                        ) {
                            onSelectState(row.target);
                        }

                        onJumpToStep(
                            row.target,
                            index + 1,
                        );

                        setEditingGate({
                            target: row.target,
                            gateId: gate.id,
                            anchor,
                        });
                    }}
                    onGateDragStart={(event, gate, index) => {
                        setEditingGate(null);

                        dragDrop.onGateDragStart(
                            event,
                            row.target,
                            gate.id,
                            index,
                        );
                    }}
                    onGateDragEnd={
                        dragDrop.onGateDragEnd
                    }
                    onClear={() => {
                        setEditingGate(null);
                        onClearGates(row.target);
                    }}
                />
            ))}

            {nextStateId !== undefined && (
                <AddStateTrack
                    stateId={nextStateId}
                    onAdd={() => {
                        setEditingGate(null);
                        onAddState();
                    }}
                />
            )}

            {rows.map((row) => (
                <StepMarker
                    key={row.target}
                    target={row.target}
                    rowLayoutKey={rowLayoutKey}
                    stepIndex={row.stepIndex}
                    gateCount={row.gates.length}
                    gateEditRevision={simulator.gateEditRevision}
                    instantJumpRevision={simulator.instantJumpRevision}
                    hoveredSlot={dragDrop.hoveredSlot}
                />
            ))}

            {editingGate && selectedGate && (
                <GatePopover
                    key={
                        `${editingGate.target}-${editingGate.gateId}`
                    }
                    gate={selectedGate}
                    anchor={editingGate.anchor}
                    onClose={() =>
                        setEditingGate(null)
                    }
                    onUpdateAngle={(degrees) =>
                        onUpdateGateAngle(
                            editingGate.target,
                            editingGate.gateId,
                            degrees,
                        )
                    }

                    onDelete={() => {
                        prepareGateDeletion();

                        onDeleteGate(
                            editingGate.target,
                            editingGate.gateId,
                        );

                        setEditingGate(null);
                    }}

                />
            )}
        </div>
    );
}
