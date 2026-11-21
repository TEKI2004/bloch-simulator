
import type {
    SimulatorMode,
    TrackedState,
} from "../../simulator/SimulatorState";
import { STATE_LABELS } from "../../simulator/statePresets";

type Props = {
    mode: SimulatorMode;
    selectedState?: TrackedState;
    onChange: (mode: SimulatorMode) => void;
};

export default function ModeSelector({
    mode,
    selectedState,
    onChange,
}: Props) {
    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
        }}>
            <label htmlFor="simulator-mode">
                Kapusor mód:
            </label>

            <select
                id="simulator-mode"
                value={mode}
                onChange={(e) =>
                    onChange(e.target.value as SimulatorMode)
                }
            >
                <option value="shared">Közös</option>
                <option value="individual">Egyéni</option>
            </select>

            {mode === "individual" && selectedState && (
                <span style={{ color: selectedState.color }}>
                    {STATE_LABELS[selectedState.id - 1]}
                </span>
            )}
        </div>
    );
}
