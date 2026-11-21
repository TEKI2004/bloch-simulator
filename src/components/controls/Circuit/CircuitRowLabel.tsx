
import type { TrackedState } from "../../../simulator/SimulatorState";

type GateTarget = "shared" | number;

type Props = {
    target: GateTarget;
    label: string;
    color: string;
    states: TrackedState[];
    selectedStateId?: number;
    onSelectState: (id: number) => void;
    onJumpToStart: () => void;
};

export default function CircuitRowLabel({
    target,
    label,
    color,
    states,
    selectedStateId,
    onSelectState,
    onJumpToStart,
}: Props) {
    const selectedColor =
        states.find((state) => state.id === selectedStateId)
            ?.color ?? "#94A3B8";

    return (
        <button
            type="button"
            className="qc-row-label"
            style={{ color }}
            onClick={() => {
                if (typeof target === "number") {
                    onSelectState(target);
                }

                onJumpToStart();
            }}
        >
            {target === "shared" ? (
                <span
                    style={{
                        fontFamily: '"Cambria Math", serif',
                        whiteSpace: "nowrap",
                    }}
                >
                    |
                    <span style={{ color: selectedColor }}>
                        ψ
                    </span>

                    <sub style={{ fontSize: "0.7em" }}>
                        {[...states]
                            .sort((a, b) => a.id - b.id)
                            .map((state, index) => (
                                <span key={state.id}>
                                    {index > 0 && (
                                        <span
                                            style={{
                                                color: "#94A3B8",
                                            }}
                                        >
                                            ,
                                        </span>
                                    )}

                                    <span
                                        style={{ color: state.color }}
                                    >
                                        {state.id}
                                    </span>
                                </span>
                            ))}
                    </sub>
                    ⟩
                </span>
            ) : (
                label
            )}
        </button>
    );
}
