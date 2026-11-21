import type { DragEvent } from "react";
import type { GateStep } from "../../../simulator/SimulatorState";

type Props = {
    gate: GateStep;
    done: boolean;
    selected: boolean;
    onClick: (anchor: HTMLButtonElement) => void;
    onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
    onDragEnd: () => void;
};

export default function CircuitGate({
    gate,
    done,
    selected,
    onClick,
    onDragStart,
    onDragEnd,
}: Props) {
    return (
        <button
            type="button"
            className={[
                "qc-gate",
                done && "qc-gate-done",
                selected && "qc-gate-selected",
            ].filter(Boolean).join(" ")}
            data-gate-id={gate.id}
            draggable
            onClick={(event) => {
                event.stopPropagation();
                onClick(event.currentTarget);
            }}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            title={`${gate.label} – húzással átrendezhető`}
        >
            {gate.label}
        </button>
    );
}
