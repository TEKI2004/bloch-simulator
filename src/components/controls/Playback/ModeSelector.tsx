
import type {
    SimulatorMode,
} from "../../../simulator/SimulatorState";

import "./ModeSelector.css";

type Props = {
    mode: SimulatorMode;
    onChange: (mode: SimulatorMode) => void;
};

export default function ModeSelector({
    mode,
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
                    onChange(
                        individual ? "shared" : "individual",
                    )
                }
            />

            <span className={individual ? "qc-mode-active" : ""}>
                Egyéni
            </span>
        </div>
    );
}
