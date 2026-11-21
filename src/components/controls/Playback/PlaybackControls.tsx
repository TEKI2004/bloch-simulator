
import "./PlaybackControls.css";

type Props = {
    stepIndex: number;
    totalSteps: number;
    isPlaying: boolean;
    disabled: boolean;

    onPrevious: () => void;
    onNext: () => void;
    onPlayPause: () => void;
    onReset: () => void;
};

export default function PlaybackControls({
    stepIndex,
    totalSteps,
    isPlaying,
    disabled,
    onPrevious,
    onNext,
    onPlayPause,
    onReset,
}: Props) {
    return (
        <div className="qc-playback-controls">
            <button
                type="button"
                className="qc-playback-button"
                disabled={disabled || isPlaying || stepIndex === 0}
                onClick={onPrevious}
                title="Előző lépés"
                aria-label="Előző lépés"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m15 6-6 6 6 6" />
                </svg>
            </button>

            <span className="qc-playback-step">
                {stepIndex} / {totalSteps}
            </span>

            <button
                type="button"
                className="qc-playback-button"
                disabled={
                    disabled ||
                    isPlaying ||
                    stepIndex >= totalSteps
                }
                onClick={onNext}
                title="Következő lépés"
                aria-label="Következő lépés"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m9 6 6 6-6 6" />
                </svg>
            </button>

            <button
                type="button"
                className="qc-playback-button"
                disabled={
                    disabled ||
                    (!isPlaying && stepIndex >= totalSteps)
                }
                onClick={onPlayPause}
                title={isPlaying ? "Szünet" : "Lejátszás"}
                aria-label={isPlaying ? "Szünet" : "Lejátszás"}
            >
                {isPlaying ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 5v14M15 5v14" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                            d="m8 5 11 7-11 7z"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
            </button>

            <button
                type="button"
                className="qc-playback-button"
                disabled={disabled}
                onClick={onReset}
                title="Reset – vissza a 0. lépésre"
                aria-label="Reset – vissza a 0. lépésre"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 11a9 9 0 1 1 2.64 6.36" />
                    <path d="M3 3v8h8" />
                </svg>
            </button>
        </div>
    );
}
