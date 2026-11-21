
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
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
            }}
        >
            <button
                disabled={disabled || isPlaying || stepIndex === 0}
                onClick={onPrevious}
            >
                ◀
            </button>

            <span>{stepIndex} / {totalSteps}</span>

            <button
                disabled={disabled || isPlaying || stepIndex >= totalSteps}
                onClick={onNext}
            >
                ▶
            </button>

            <button
                disabled={disabled || (!isPlaying && stepIndex >= totalSteps)}
                onClick={onPlayPause}
            >
                {isPlaying ? "⏸ Pause" : "▶ Play"}
            </button>

            <button
                disabled={disabled}
                onClick={onReset}
            >
                Reset
            </button>
        </div>
    );
}
