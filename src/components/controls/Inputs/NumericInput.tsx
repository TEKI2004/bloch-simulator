import {
    useEffect,
    useRef,
    useState,
} from "react";

import "./NumericInput.css";

type Props = {
    label: string;
    value: number;
    onCommit: (value: number) => void;

    normalize?: (value: number) => number;
    suffix?: string;
    precision?: number;
};

function formatValue(value: number, precision: number): string {
    return String(Number(value.toFixed(precision)));
}

export default function NumericInput({
    label,
    value,
    onCommit,
    normalize,
    suffix,
    precision = 4,
}: Props) {
    const [draft, setDraft] = useState(
        () => formatValue(value, precision),
    );

    const focusedRef = useRef(false);
    const cancelRef = useRef(false);

    useEffect(() => {
        if (!focusedRef.current) {
            setDraft(formatValue(value, precision));
        }
    }, [value, precision]);

    function commit() {
        const text = draft.trim().replace(",", ".");

        if (text === "") {
            setDraft(formatValue(value, precision));
            return;
        }

        const parsed = Number(text);

        if (!Number.isFinite(parsed)) {
            setDraft(formatValue(value, precision));
            return;
        }

        const next = normalize
            ? normalize(parsed)
            : parsed;

        if (!Number.isFinite(next)) {
            setDraft(formatValue(value, precision));
            return;
        }

        setDraft(formatValue(next, precision));

        if (next !== value) {
            onCommit(next);
        }
    }

    return (
        <div className="numeric-input">
            <input
                type="text"
                inputMode="decimal"
                className="numeric-input-field"
                aria-label={label}
                value={draft}
                spellCheck={false}
                autoComplete="off"
                onFocus={(event) => {
                    focusedRef.current = true;
                    cancelRef.current = false;
                    event.currentTarget.select();
                }}
                onChange={(event) => {
                    setDraft(event.target.value);
                }}
                onBlur={() => {
                    focusedRef.current = false;

                    if (cancelRef.current) {
                        cancelRef.current = false;
                        setDraft(formatValue(value, precision));
                        return;
                    }

                    commit();
                }}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        event.currentTarget.blur();
                    }

                    if (event.key === "Escape") {
                        cancelRef.current = true;
                        event.currentTarget.blur();
                    }
                }}
            />

            {suffix && (
                <span className="numeric-input-suffix">
                    {suffix}
                </span>
            )}
        </div>
    );
}
