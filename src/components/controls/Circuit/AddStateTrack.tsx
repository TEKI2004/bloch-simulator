
import {
    DEFAULT_STATE_COLORS,
} from "../../../simulator/SimulatorState";

import {
    STATE_LABELS,
} from "../../../simulator/statePresets";

import "./AddStateTrack.css";

type Props = {
    stateId: number;
    onAdd: () => void;
};

export default function AddStateTrack({
    stateId,
    onAdd,
}: Props) {
    return (
        <button
            type="button"
            className="qc-add-track"
            onClick={onAdd}
            aria-label={`${STATE_LABELS[stateId - 1]} hozzáadása`}
        >
            <span
                className="qc-add-track-label"
                style={{
                    color: DEFAULT_STATE_COLORS[stateId - 1],
                }}
            >
                {STATE_LABELS[stateId - 1]}
            </span>

            <span className="qc-add-track-content">
                <span className="qc-add-track-icon">
                    +
                </span>

                <span>Új állapot hozzáadása</span>
            </span>

            <span
                className="qc-add-track-spacer"
                aria-hidden="true"
            />
        </button>
    );
}
