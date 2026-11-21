import InitialStateEditor from "../../InitialStateEditor";
import StateTabs from "./StateTabs";
import StateColorPicker from "./StateColorPicker";

import type { QubitState } from "../../../quantum/QubitState";
import type { TrackedState } from "../../../simulator/SimulatorState";

type Props = {
    states: TrackedState[];
    selectedState?: TrackedState;

    onSelect: (id: number) => void;
    onRemove: (id: number) => void;

    onColorChange: (id: number, color: string) => void;

    onInitialStateChange: (
        id: number,
        state: QubitState,
    ) => void;
};

export default function InitialStatePanel({
    states,
    selectedState,
    onSelect,
    onRemove,
    onColorChange,
    onInitialStateChange,
}: Props) {
    return (
        <aside className="sim-side-panel">
            <h3>Kezdőállapot</h3>

            <StateTabs
                states={states}
                selectedStateId={selectedState?.id}
                onSelect={onSelect}
                onRemove={onRemove}
            />

            {selectedState && (
                <>
                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 12,
                        }}
                    >
                        Szín:

                        <StateColorPicker
                            key={selectedState.id}
                            color={selectedState.color}
                            onChange={(color) =>
                                onColorChange(selectedState.id, color)
                            }
                        />
                    </label>

                    <InitialStateEditor
                        key={selectedState.id}
                        state={selectedState.initialState}
                        onChange={(state) =>
                            onInitialStateChange(
                                selectedState.id,
                                state,
                            )
                        }
                    />
                </>
            )}
        </aside>
    );
}
