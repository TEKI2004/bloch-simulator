
import type { GateStep } from "../../../simulator/SimulatorState";

type Props = {
    gates: GateStep[];
    stepIndex: number;
    disabled: boolean;
    onRemove: (id: string) => void;
    onMove: (id: string, direction: -1 | 1) => void;
    onUpdateAngle: (id: string, degrees: number) => void;
    onClear: () => void;
};

export default function GateSequenceEditor({
    gates,
    stepIndex,
    disabled,
    onRemove,
    onMove,
    onUpdateAngle,
    onClear,
}: Props) {
    return (
        <div
            style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "nowrap",
                justifyContent: "flex-start",
                width: "max-content",
                minWidth: "100%",
            }}
        >
            {gates.map((gate, index) => (
                <div
                    key={gate.id}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: 6,
                        borderRadius: 6,
                        background: "#1E293B",
                    }}
                >
                    <span
                        style={{
                            color: index < stepIndex ? "#4ADE80" : "white",
                        }}
                    >
                        {gate.label}
                    </span>

                    {gate.parameter && (
                        <input
                            type="number"
                            step="any"
                            value={Number(
                                (gate.parameter.angle * 180 / Math.PI).toFixed(4),
                            )}
                            onChange={(e) => {
                                if (e.target.value.trim() === "") return;
                                onUpdateAngle(gate.id, Number(e.target.value));
                            }}
                            title="Szög fokban"
                            style={{ width: 65 }}
                        />
                    )}

                    <button
                        disabled={disabled || index === 0}
                        onClick={() => onMove(gate.id, -1)}
                    >
                        ←
                    </button>

                    <button
                        disabled={disabled || index === gates.length - 1}
                        onClick={() => onMove(gate.id, 1)}
                    >
                        →
                    </button>

                    <button
                        disabled={disabled}
                        onClick={() => onRemove(gate.id)}
                    >
                        ×
                    </button>
                </div>
            ))}

            <button
                disabled={disabled || gates.length === 0}
                onClick={onClear}
            >
                Kapusor törlése
            </button>
        </div>
    );
}
