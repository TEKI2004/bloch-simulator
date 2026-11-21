
import InitialStateEditor from "../InitialStateEditor";
import type { QubitState } from "../../quantum/QubitState";
import type { TrackedState } from "../../simulator/SimulatorState";
import { STATE_LABELS } from "../../simulator/statePresets";
import { useEffect, useRef } from "react";

type Props = {
    states: TrackedState[];
    selectedState?: TrackedState;
    onSelect: (id: number) => void;
    onColorChange: (id: number, color: string) => void;
    onInitialStateChange: (id: number, state: QubitState) => void;
};

export default function InitialStatePanel({
    states,
    selectedState,
    onSelect,
    onColorChange,
    onInitialStateChange,
}: Props) {

    const colorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingColor = useRef<{ id: number; color: string } | null>(null);

    function flushColor() {
        if (colorTimer.current !== null) {
            clearTimeout(colorTimer.current);
            colorTimer.current = null;
        }

        const pending = pendingColor.current;
        pendingColor.current = null;

        if (pending) {
            onColorChange(pending.id, pending.color);
        }
    }

    function scheduleColorChange(id: number, color: string) {
        pendingColor.current = { id, color };

        if (colorTimer.current !== null) return;

        colorTimer.current = setTimeout(flushColor, 100);
    }

    useEffect(() => {
        return () => {
            if (colorTimer.current !== null) {
                clearTimeout(colorTimer.current);
            }
        };
    }, []);
    return (
        <aside className="sim-side-panel">
            <h3>Kezdőállapot</h3>

            {selectedState && (
                <>
                    <select
                        value={selectedState.id}
                        onChange={(e) => onSelect(Number(e.target.value))}
                    >
                        {states.map((state) => (
                            <option key={state.id} value={state.id}>
                                {STATE_LABELS[state.id - 1]}
                            </option>
                        ))}
                    </select>

                    <label style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 12,
                    }}>
                        Szín:
                        <input
                            key={selectedState.id}
                            type="color"
                            defaultValue={selectedState.color}
                            onChange={(e) =>
                                scheduleColorChange(selectedState.id, e.target.value)
                            }
                            onBlur={flushColor}
                        />
                    </label>

                    <InitialStateEditor
                        key={selectedState.id}
                        state={selectedState.initialState}
                        onChange={(state) =>
                            onInitialStateChange(selectedState.id, state)
                        }
                    />
                </>
            )}
        </aside>
    );
}
