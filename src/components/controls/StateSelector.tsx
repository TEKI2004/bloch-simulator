
import type { TrackedState } from "../../simulator/SimulatorState";
import { STATE_LABELS } from "../../simulator/statePresets";

type Props = {
    states: TrackedState[];
    selectedStateId?: number;
    canAdd: boolean;
    onSelect: (id: number) => void;
    onRemove: (id: number) => void;
    onAdd: () => void;
};

export default function StateSelector({
    states,
    selectedStateId,
    canAdd,
    onSelect,
    onRemove,
    onAdd,
}: Props) {
    return (
        <div style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
        }}>
            {states.map((state) => (
                <div key={state.id} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                }}>
                    <button
                        onClick={() => onSelect(state.id)}
                        style={{
                            color: state.color,
                            border: selectedStateId === state.id
                                ? `1px solid ${state.color}`
                                : "1px solid transparent",
                        }}
                    >
                        {STATE_LABELS[state.id - 1]}
                    </button>

                    <button onClick={() => onRemove(state.id)}>
                        ×
                    </button>
                </div>
            ))}

            <button disabled={!canAdd} onClick={onAdd}>
                + Állapot
            </button>
        </div>
    );
}
