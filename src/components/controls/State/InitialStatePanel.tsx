
import InitialStateEditor from "../../InitialStateEditor";

import type { QubitState } from "../../../quantum/QubitState";
import type { TrackedState } from "../../../simulator/SimulatorState";

type Props = {
    selectedState?: TrackedState;

    onInitialStateChange: (
        id: number,
        state: QubitState,
    ) => void;
};

export default function InitialStatePanel({
    selectedState,
    onInitialStateChange,
}: Props) {
    return (
        <aside className="sim-side-panel initial-state-panel">
            <h3>Kezdőállapot</h3>

            {selectedState && (
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
            )}
        </aside>
    );
}
