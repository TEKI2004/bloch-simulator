import type { CSSProperties } from "react";
import NumericInput from "./NumericInput";

import "./AngleSlider.css";

type Props = {
    symbol: string;
    label: string;

    value: number;
    min: number;
    max: number;
    step?: number;

    onChange: (value: number) => void;
    normalize?: (value: number) => number;
    onCommit?: (value: number) => void;
    onInteractionEnd?: () => void;
};

export default function AngleSlider({
    symbol,
    label,
    value,
    min,
    max,
    step = 0.1,
    onChange,
    normalize,
    onCommit,
    onInteractionEnd,
}: Props) {
    const progress =
        max > min
            ? Math.max(
                0,
                Math.min(
                    100,
                    ((value - min) / (max - min)) * 100,
                ),
            )
            : 0;

    function handleCommit(next: number) {
        const normalized = normalize
            ? normalize(next)
            : Math.max(min, Math.min(max, next));

        if (onCommit) {
            onCommit(normalized);
        } else {
            onChange(normalized);
        }
    }

    return (
        <div className="angle-slider">
            <div className="angle-slider-header">
                <div className="angle-slider-title">
                    <span className="angle-slider-symbol">
                        {symbol}
                    </span>

                    <span className="angle-slider-label">
                        {label}
                    </span>
                </div>

                <NumericInput
                    label={`${symbol} – ${label}`}
                    value={value}
                    suffix="°"
                    normalize={normalize}
                    onCommit={handleCommit}
                />
            </div>

            <input
                type="range"
                className="angle-slider-range"
                min={min}
                max={max}
                step={step}
                value={value}
                aria-label={`${symbol} – ${label}`}
                aria-valuetext={`${value} fok`}
                style={
                    {
                        "--angle-progress": `${progress}%`,
                    } as CSSProperties
                }
                onChange={(event) => {
                    onChange(Number(event.target.value));
                }}
                onPointerUp={onInteractionEnd}
                onPointerCancel={onInteractionEnd}
                onKeyUp={onInteractionEnd}
                onBlur={onInteractionEnd}
            />

            <div className="angle-slider-limits">
                <span>{min}°</span>
                <span>{max}°</span>
            </div>
        </div>
    );
}
