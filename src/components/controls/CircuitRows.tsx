
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DragEvent as ReactDragEvent } from "react";

import type {
    GateStep,
    SimulatorState,
} from "../../simulator/SimulatorState";
import type { GateOption } from "../../simulator/gateCatalog";
import { GATE_OPTIONS } from "../../simulator/gateCatalog";
import { STATE_LABELS } from "../../simulator/statePresets";

import GatePopover from "./GatePopover";
import StepMarker from "./StepMarker";
import "./CircuitRows.css";

type GateTarget = "shared" | number;

type CircuitRow = {
    target: GateTarget;
    label: string;
    color: string;
    gates: GateStep[];
    stepIndex: number;
};

type ActiveMove = {
    target: GateTarget;
    id: string;
    sourceIndex: number;
};

type DropPosition = {
    target: GateTarget;
    index: number;
};

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
    onJumpToStep: (target: GateTarget, stepIndex: number) => void;
    onDeleteGate: (target: GateTarget, gateId: string) => void;
    onUpdateGateAngle: (
        target: GateTarget,
        gateId: string,
        degrees: number,
    ) => void;
    onClearGates: (target: GateTarget) => void;
};


function measureGateWidth(label: string): number {
    const container = document.querySelector(".sim-layout");
    if (!container) return 44;

    const probe = document.createElement("button");

    probe.className = "qc-gate";
    probe.textContent = label;

    probe.style.position = "fixed";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    probe.style.width = "max-content";

    container.appendChild(probe);

    const width = probe.getBoundingClientRect().width;
    probe.remove();

    return width;
}

// A kurzor X-koordinátájából kiszámítjuk a beszúrás helyét.
function getDropIndexAtX(target: GateTarget, x: number): number | null {
    const track = document.querySelector<HTMLElement>(
        `.qc-track[data-row-target="${target}"]`,
    );

    if (!track) return null;

    const gates = track.querySelectorAll<HTMLButtonElement>(
        ".qc-gate",
    );

    const gap = 16;
    let position = track.getBoundingClientRect().left;

    for (let i = 0; i < gates.length; i++) {
        const width = gates[i].getBoundingClientRect().width;

        position += gap;

        if (x < position + width / 2) {
            return i;
        }

        position += width;
    }

    return gates.length;
}


// Az Y-koordináta csak a célsor kiválasztásához kell.
// Ha nem vagyunk másik sor fölött, az eredeti marad.
function getTargetAtY(y: number, fallback: GateTarget): GateTarget {
    const rows = document.querySelectorAll<HTMLElement>(
        ".qc-row[data-row-target]",
    );

    for (const row of rows) {
        const rect = row.getBoundingClientRect();

        if (y >= rect.top && y <= rect.bottom) {
            const value = row.dataset.rowTarget;

            if (value === "shared") return "shared";

            const id = Number(value);
            if (Number.isInteger(id)) return id;
        }
    }

    return fallback;
}

// Saját maga előtt és mögött nincs valódi átrendezés.
function getDropPosition(
    move: ActiveMove,
    x: number,
    y: number,
): DropPosition | null {
    const target = getTargetAtY(y, move.target);
    const index = getDropIndexAtX(target, x);

    if (index === null) return null;

    if (
        target === move.target &&
        (index === move.sourceIndex || index === move.sourceIndex + 1)
    ) {
        return null;
    }

    return { target, index };
}

function captureGatePositions(
    root: HTMLElement | null,
): Map<string, DOMRect> {
    const positions = new Map<string, DOMRect>();

    if (!root) return positions;

    root.querySelectorAll<HTMLButtonElement>(
        ".qc-gate[data-gate-id]",
    ).forEach((button) => {
        const id = button.dataset.gateId;

        if (id) {
            positions.set(id, button.getBoundingClientRect());
        }
    });

    return positions;
}

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
}: Props) {
    const [previewGateWidth, setPreviewGateWidth] = useState(44);

    const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

    const [editingGate, setEditingGate] = useState<{
        target: GateTarget;
        gateId: string;
        anchor: HTMLButtonElement;
    } | null>(null);


    const activeMove = useRef<ActiveMove | null>(null);
    const onMoveGateRef = useRef(onMoveGate);
    const rowsRef = useRef<HTMLDivElement>(null);
    const positionsBeforeDrop = useRef<Map<string, DOMRect> | null>(null);
    const movedGateId = useRef<string | null>(null);

    useLayoutEffect(() => {
        const before = positionsBeforeDrop.current;
        if (!before) return;

        positionsBeforeDrop.current = null;

        const draggedId = movedGateId.current;
        movedGateId.current = null;

        const root = rowsRef.current;
        if (!root) return;

        const buttons = root.querySelectorAll<HTMLButtonElement>(
            ".qc-gate[data-gate-id]",
        );

        buttons.forEach((button) => {
            const id = button.dataset.gateId;
            if (!id) return;

            // A húzott kapu már a placeholder helyén van.
            // Nem animáljuk vissza az eredeti pozíciójából.
            if (id === draggedId) return;

            const oldRect = before.get(id);
            if (!oldRect) return;

            const newRect = button.getBoundingClientRect();

            const dx = oldRect.left - newRect.left;
            const dy = oldRect.top - newRect.top;

            if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
                return;
            }

            button.animate(
                [
                    { transform: `translate(${dx}px, ${dy}px)` },
                    { transform: "translate(0px, 0px)" },
                ],
                {
                    duration: 180,
                    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                },
            );
        });

        // Az új DOM-elrendezés után ismét engedélyezzük
        // a placeholder normál hover-animációját.
        const frame = requestAnimationFrame(() => {
            root.classList.remove("qc-drop-committing");
        });

        return () => cancelAnimationFrame(frame);
    }, [simulator.gateEditRevision]);

    useEffect(() => {
        onMoveGateRef.current = onMoveGate;
    }, [onMoveGate]);

    // Globális kezelés: a kaput függőlegesen
    // a saját sorától távolabb is elengedhetjük.
    useEffect(() => {
        function handleDragStart(event: globalThis.DragEvent) {
            const target = event.target;

            if (!(target instanceof Element)) return;

            const button = target.closest<HTMLButtonElement>(
                "[data-gate-label]",
            );

            if (!button?.dataset.gateLabel) return;

            setPreviewGateWidth(
                measureGateWidth(button.dataset.gateLabel),
            );
        }

        function handleDragOver(event: globalThis.DragEvent) {
            const move = activeMove.current;

            if (!move) {
                if (
                    event.dataTransfer?.types.includes(
                        "application/x-bloch-gate",
                    )
                ) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                }

                return;
            }

            // Az innen következő meglévő átrendezési logika marad.

            event.preventDefault();
            event.stopPropagation();

            const position = getDropPosition(
                move,
                event.clientX,
                event.clientY,
            );

            event.dataTransfer!.dropEffect = "move";

            const slot = position
                ? `${position.target}-${position.index}`
                : null;

            setHoveredSlot((current) =>
                current === slot ? current : slot,
            );
        }

        function handleDrop(event: globalThis.DragEvent) {
            const move = activeMove.current;
            if (!move) return;

            event.preventDefault();
            event.stopPropagation();

            const position = getDropPosition(
                move,
                event.clientX,
                event.clientY,
            );

            activeMove.current = null;
            setHoveredSlot(null);

            if (position) {
                positionsBeforeDrop.current = captureGatePositions(
                    rowsRef.current,
                );

                movedGateId.current = move.id;

                rowsRef.current?.classList.add("qc-drop-committing");

                onMoveGateRef.current(
                    move.target,
                    position.target,
                    move.id,
                    position.index,
                );
            }
        }

        function handleDragEnd() {
            activeMove.current = null;
            setHoveredSlot(null);
        }

        window.addEventListener("dragstart", handleDragStart);
        window.addEventListener("dragover", handleDragOver, true);
        window.addEventListener("drop", handleDrop, true);
        window.addEventListener("dragend", handleDragEnd, true);

        return () => {
            window.removeEventListener("dragstart", handleDragStart);
            window.removeEventListener("dragover", handleDragOver, true);
            window.removeEventListener("drop", handleDrop, true);
            window.removeEventListener("dragend", handleDragEnd, true);
        };
    }, []);

    const rows: CircuitRow[] = simulator.mode === "shared"
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


    const editingSequence = editingGate?.target === "shared"
        ? simulator.sharedGates
        : simulator.states.find(
            (state) => state.id === editingGate?.target,
        )?.individualGates;

    const selectedGate = editingSequence?.find(
        (gate) => gate.id === editingGate?.gateId,
    );

    function prepareDropCommit() {
        const root = rowsRef.current;
        if (!root) return;

        positionsBeforeDrop.current = captureGatePositions(root);

        // Az összehúzódás ne kapjon külön CSS-animációt.
        root.classList.add("qc-drop-committing");
    }

    // Új kapu behúzása a palettából.
    function handlePaletteDrop(
        event: ReactDragEvent<HTMLDivElement>,
        target: GateTarget,
        index: number,
    ) {
        event.preventDefault();

        const label = event.dataTransfer.getData(
            "application/x-bloch-gate",
        );

        const gate = GATE_OPTIONS.find((option) =>
            option.label === label,
        );

        setHoveredSlot(null);

        if (gate) {
            prepareDropCommit();
            setHoveredSlot(null);
            onInsertGate(target, index, gate);
        } else {
            setHoveredSlot(null);
        }
    }

    useLayoutEffect(() => {
        const root = rowsRef.current;
        if (!root) return;

        const tracks = root.querySelectorAll<HTMLElement>(".qc-track");

        tracks.forEach((track) => {
            const slots = track.querySelectorAll<HTMLElement>(".qc-drop-slot");

            const stepIndex = Number(track.dataset.stepIndex);
            const slot = slots[stepIndex];

            if (!slot) return;
        });
    }, [simulator, hoveredSlot]);

    return (
        <div className="qc-rows" ref={rowsRef}>
            {rows.map((row) => {
                const selected =
                    row.target === "shared" ||
                    row.target === selectedStateId;

                return (
                    <div
                        key={row.target}
                        data-row-target={row.target}
                        className={`qc-row ${selected ? "qc-row-selected" : ""}`}
                    >
                        <button
                            className="qc-row-label"
                            style={{ color: row.color }}
                            onClick={() => {
                                if (typeof row.target === "number") {
                                    onSelectState(row.target);
                                }

                                onJumpToStep(row.target, 0);
                            }}
                        >
                            {row.target === "shared" ? (
                                <span style={{
                                    fontFamily: '"Cambria Math", serif',
                                    whiteSpace: "nowrap",
                                }}>
                                    |<span style={{
                                        color: simulator.states.find(
                                            (state) => state.id === selectedStateId,
                                        )?.color ?? "#94A3B8",
                                    }}>ψ</span>
                                    <sub style={{ fontSize: "0.7em" }}>
                                        {[...simulator.states]
                                            .sort((a, b) => a.id - b.id)
                                            .map((state, index) => (
                                                <span key={state.id}>
                                                    {index > 0 && (
                                                        <span style={{ color: "#94A3B8" }}>,</span>
                                                    )}
                                                    <span style={{ color: state.color }}>
                                                        {state.id}
                                                    </span>
                                                </span>
                                            ))}
                                    </sub>⟩
                                </span>
                            ) : (
                                row.label
                            )}
                        </button>

                        <div
                            className="qc-row-scroll"
                            onClick={() => {
                                if (typeof row.target === "number") {
                                    onSelectState(row.target);
                                }
                            }}
                            onWheel={(event) => {
                                const element = event.currentTarget;

                                if (element.scrollWidth <= element.clientWidth) return;

                                const delta = event.deltaY !== 0
                                    ? event.deltaY
                                    : event.deltaX;

                                element.scrollLeft += delta;
                                event.preventDefault();
                            }}
                        >
                            <div
                                className="qc-track"
                                data-row-target={row.target}
                                data-step-index={row.stepIndex}
                                onDragOver={(event) => {
                                    // Meglévő kapukat a globális kezelő intézi.
                                    if (activeMove.current) return;

                                    event.preventDefault();

                                    const index = getDropIndexAtX(
                                        row.target,
                                        event.clientX,
                                    );

                                    if (index === null) return;

                                    setHoveredSlot(`${row.target}-${index}`);
                                    event.dataTransfer.dropEffect = "move";
                                }}
                                onDrop={(event) => {
                                    if (activeMove.current) return;

                                    const index = getDropIndexAtX(
                                        row.target,
                                        event.clientX,
                                    );

                                    if (index !== null) {
                                        handlePaletteDrop(event, row.target, index);
                                    }
                                }}
                            >
                                <div className="qc-wire" />

                                {Array.from(
                                    { length: row.gates.length + 1 },
                                    (_, index) => {
                                        const slotKey = `${row.target}-${index}`;
                                        const gate = row.gates[index];

                                        return (
                                            <div
                                                className="qc-entry"
                                                key={gate ? gate.id : `${row.target}-end`}
                                            >

                                                <div
                                                    className={`qc-drop-slot ${hoveredSlot === slotKey ? "qc-drop-active" : ""
                                                        }`}
                                                    style={
                                                        hoveredSlot === slotKey
                                                            ? { width: previewGateWidth + 32 }
                                                            : undefined
                                                    }
                                                />


                                                {gate && (
                                                    <button

                                                        className={[
                                                            "qc-gate",
                                                            index < row.stepIndex ? "qc-gate-done" : "",
                                                            editingGate?.target === row.target &&
                                                                editingGate.gateId === gate.id
                                                                ? "qc-gate-selected"
                                                                : "",
                                                        ].filter(Boolean).join(" ")}
                                                        data-gate-id={gate.id}

                                                        onClick={(event) => {
                                                            event.stopPropagation();

                                                            if (typeof row.target === "number") {
                                                                onSelectState(row.target);
                                                            }

                                                            // Ugrás a kapu utáni állapotra
                                                            onJumpToStep(row.target, index + 1);

                                                            // Szerkesztő megnyitása a kapu mellett
                                                            setEditingGate({
                                                                target: row.target,
                                                                gateId: gate.id,
                                                                anchor: event.currentTarget,
                                                            });
                                                        }}

                                                        draggable
                                                        onDragStart={(event) => {
                                                            setPreviewGateWidth(
                                                                event.currentTarget.getBoundingClientRect().width,
                                                            );
                                                            setEditingGate(null);
                                                            activeMove.current = {
                                                                target: row.target,
                                                                id: gate.id,
                                                                sourceIndex: index,
                                                            };

                                                            event.dataTransfer.setData(
                                                                "application/x-bloch-move",
                                                                gate.id,
                                                            );

                                                            event.dataTransfer.effectAllowed = "move";
                                                        }}
                                                        onDragEnd={() => {
                                                            activeMove.current = null;
                                                            setHoveredSlot(null);
                                                        }}
                                                        title={`${gate.label} – húzással átrendezhető`}
                                                    >
                                                        {gate.label}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        </div>


                        <div className="qc-row-actions">
                            <span className="qc-step-count">
                                {row.stepIndex}/{row.gates.length}
                            </span>

                            <button
                                type="button"
                                className="qc-clear-button"
                                disabled={row.gates.length === 0}
                                onClick={() => {
                                    setEditingGate(null);
                                    onClearGates(row.target);
                                }}
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
            })}


            {rows.map((row) => (
                <StepMarker
                    key={row.target}
                    target={row.target}
                    stepIndex={row.stepIndex}
                    gateCount={row.gates.length}
                    gateEditRevision={simulator.gateEditRevision}
                    instantJumpRevision={simulator.instantJumpRevision}
                    hoveredSlot={hoveredSlot}
                />
            ))}


            {editingGate && selectedGate && (
                <GatePopover
                    key={`${editingGate.target}-${editingGate.gateId}`}
                    gate={selectedGate}
                    anchor={editingGate.anchor}
                    onClose={() => setEditingGate(null)}
                    onUpdateAngle={(degrees) => {
                        onUpdateGateAngle(
                            editingGate.target,
                            editingGate.gateId,
                            degrees,
                        );
                    }}
                    onDelete={() => {
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
