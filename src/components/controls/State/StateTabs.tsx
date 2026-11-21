
import type { CSSProperties } from "react";
import type { TrackedState } from "../../../simulator/SimulatorState";
import { STATE_LABELS } from "../../../simulator/statePresets";

import "./StateTabs.css";

type Props = {
    states: TrackedState[];
    selectedStateId?: number;
    onSelect: (id: number) => void;
    onRemove: (id: number) => void;
};

export default function StateTabs({
    states,
    selectedStateId,
    onSelect,
    onRemove,
}: Props) {
    const canRemove = states.length > 1;

    return (
        <div
            className="state-tabs"
            role="group"
            aria-label="Állapotvektor kiválasztása"
        >
            {[...states]
                .sort((a, b) => a.id - b.id)
                .map((state) => {
                    const selected =
                        state.id === selectedStateId;

                    const label =
                        STATE_LABELS[state.id - 1];

                    return (
                        <div
                            key={state.id}
                            className={[
                                "state-tab",
                                selected && "state-tab-selected",
                            ].filter(Boolean).join(" ")}
                            style={{
                                "--state-color": state.color,
                            } as CSSProperties}
                        >
                            <button
                                type="button"
                                className="state-tab-select"
                                aria-pressed={selected}
                                onClick={() => onSelect(state.id)}
                            >
                                {label}
                            </button>

                            {canRemove && (
                                <button
                                    type="button"
                                    className="state-tab-remove"
                                    title={`${label} törlése`}
                                    aria-label={`${label} törlése`}
                                    onClick={() => onRemove(state.id)}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    );
                })}
        </div>
    );
}
