
import { GATE_OPTIONS } from "../../simulator/gateCatalog";
import type { GateOption } from "../../simulator/gateCatalog";

type Props = {
    disabled: boolean;
    onAdd: (gate: GateOption) => void;
};

export default function GatePalette({ disabled, onAdd }: Props) {
    return (
        <div
            style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "center",
            }}
        >
            {GATE_OPTIONS.map((gate) => (
                <button
                    key={gate.label}
                    data-gate-label={gate.label}
                    disabled={disabled}
                    draggable={!disabled}
                    onDragStart={(event) => {
                        event.dataTransfer.setData(
                            "application/x-bloch-gate",
                            gate.label,
                        );
                        event.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => onAdd(gate)}
                >
                    + {gate.label}
                </button>
            ))}
        </div>
    );
}
