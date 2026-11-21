
import type {
    SimulatorMode,
    TrackedState,
} from "../../simulator/SimulatorState";
import { STATE_LABELS } from "../../simulator/statePresets";
import "./ModeSelector.css";

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
    const individual = mode === "individual";

    return (
        <div className="qc-mode-selector">
            <span className={!individual ? "qc-mode-active" : ""}>
                Közös
            </span>

            <button
                type="button"
                className="qc-mode-switch"
                role="switch"
                aria-label="Egyéni kapusor mód"
                aria-checked={individual}
                onClick={() =>
                    onChange(individual ? "shared" : "individual")
                }
            />

            <span className={individual ? "qc-mode-active" : ""}>
                Egyéni
            </span>

            {individual && selectedState && (
                <span
                    className="qc-mode-state"
                    style={{ color: selectedState.color }}
                >
                    {STATE_LABELS[selectedState.id - 1]}
                </span>
            )}
        </div>
    );
}
