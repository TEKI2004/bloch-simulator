import {
    useEffect,
    useId,
    useRef,
    useState,
} from "react";

import type {
    FocusEvent,
    KeyboardEvent,
} from "react";

import { Complex } from "../../../quantum/Complex";
import { QubitState } from "../../../quantum/QubitState";
import { formatNumber } from "../../../quantum/format";

import "./ComplexAmplitudeEditor.css";

type Props = {
    state: QubitState;
    onCommit: (state: QubitState) => void;
};

type FieldKey =
    | "alphaRe"
    | "alphaIm"
    | "betaRe"
    | "betaIm";

type Draft = Record<FieldKey, string>;

function getDraft(state: QubitState): Draft {
    return {
        alphaRe: String(formatNumber(state.alpha.re)),
        alphaIm: String(formatNumber(state.alpha.im)),
        betaRe: String(formatNumber(state.beta.re)),
        betaIm: String(formatNumber(state.beta.im)),
    };
}

type AmplitudeRowProps = {
    symbol: "α" | "β";
    basis: "|0⟩" | "|1⟩";

    real: string;
    imaginary: string;

    onRealChange: (value: string) => void;
    onImaginaryChange: (value: string) => void;

    onKeyDown: (
        event: KeyboardEvent<HTMLInputElement>,
    ) => void;
};

function AmplitudeRow({
    symbol,
    basis,
    real,
    imaginary,
    onRealChange,
    onImaginaryChange,
    onKeyDown,
}: AmplitudeRowProps) {
    return (
        <div className="amplitude-row">
            <div className="amplitude-row-title">
                <span className="amplitude-symbol">
                    {symbol}
                </span>

                <span className="amplitude-description">
                    {basis} amplitúdója
                </span>
            </div>

            <div className="amplitude-fields">
                <label className="amplitude-field">
                    <span className="amplitude-field-label">
                        Re
                    </span>

                    <span className="amplitude-input-wrap">
                        <input
                            type="text"
                            inputMode="decimal"
                            className="amplitude-input"
                            aria-label={`${symbol} valós része`}
                            autoComplete="off"
                            spellCheck={false}
                            value={real}
                            onChange={(event) =>
                                onRealChange(event.target.value)
                            }
                            onFocus={(event) =>
                                event.currentTarget.select()
                            }
                            onKeyDown={onKeyDown}
                        />
                    </span>
                </label>

                <label className="amplitude-field">
                    <span className="amplitude-field-label">
                        Im
                    </span>

                    <span className="amplitude-input-wrap">
                        <input
                            type="text"
                            inputMode="decimal"
                            className="amplitude-input"
                            aria-label={`${symbol} képzetes része`}
                            autoComplete="off"
                            spellCheck={false}
                            value={imaginary}
                            onChange={(event) =>
                                onImaginaryChange(
                                    event.target.value,
                                )
                            }
                            onFocus={(event) =>
                                event.currentTarget.select()
                            }
                            onKeyDown={onKeyDown}
                        />

                        <span
                            className="amplitude-imaginary-unit"
                            aria-hidden="true"
                        >
                            i
                        </span>
                    </span>
                </label>
            </div>
        </div>
    );
}

export default function ComplexAmplitudeEditor({
    state,
    onCommit,
}: Props) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<Draft>(
        () => getDraft(state),
    );
    const [error, setError] = useState<string | null>(null);

    const contentId = useId();

    const editingRef = useRef(false);
    const dirtyRef = useRef(false);

    // Szögszerkesztés vagy külső állapotfrissítés után
    // frissítjük a mezőket, ha nincs folyamatban szerkesztés.
    useEffect(() => {
        if (!editingRef.current && !dirtyRef.current) {
            setDraft(getDraft(state));
        }
    }, [state]);

    function updateField(
        key: FieldKey,
        value: string,
    ) {
        dirtyRef.current = true;

        setDraft((current) => ({
            ...current,
            [key]: value,
        }));

        setError(null);
    }

    function reset() {
        dirtyRef.current = false;
        editingRef.current = false;

        setDraft(getDraft(state));
        setError(null);
    }

    function commit(): boolean {
        if (!dirtyRef.current) return true;

        const rawValues = [
            draft.alphaRe,
            draft.alphaIm,
            draft.betaRe,
            draft.betaIm,
        ];

        if (rawValues.some((value) => value.trim() === "")) {
            setError("Minden komponenst meg kell adni.");
            return false;
        }

        const values = rawValues.map((value) =>
            Number(value.trim().replace(",", ".")),
        );

        if (!values.every(Number.isFinite)) {
            setError("Érvénytelen számérték.");
            return false;
        }

        const [ar, ai, br, bi] = values;

        const normSquared =
            ar * ar + ai * ai +
            br * br + bi * bi;

        if (
            !Number.isFinite(normSquared) ||
            normSquared === 0
        ) {
            setError(
                "A nullvektor nem normalizálható.",
            );
            return false;
        }

        // A QubitState.normalized() megőrzi
        // a komplex amplitúdók relatív és globális fázisát.
        const next = new QubitState(
            new Complex(ar, ai),
            new Complex(br, bi),
        ).normalized();

        dirtyRef.current = false;

        setDraft(getDraft(next));
        setError(null);

        onCommit(next);

        return true;
    }

    function handleBlur(event: FocusEvent<HTMLDivElement>) {
        const nextTarget = event.relatedTarget;

        // A négy mező közötti Tab nem véglegesíti
        // a szerkesztést.
        if (
            nextTarget instanceof Node &&
            event.currentTarget.contains(nextTarget)
        ) {
            return;
        }

        editingRef.current = false;
        commit();
    }

    function handleKeyDown(
        event: KeyboardEvent<HTMLInputElement>,
    ) {
        if (event.key === "Enter") {
            event.preventDefault();

            if (commit()) {
                event.currentTarget.blur();
            }
        }

        if (event.key === "Escape") {
            event.preventDefault();

            reset();
            event.currentTarget.blur();
        }
    }

    function toggleOpen() {
        if (open && !commit()) {
            // Hibás érték esetén nyitva marad,
            // hogy javítható legyen.
            return;
        }

        setOpen((current) => !current);
    }

    return (
        <section className="complex-amplitude-editor">
            <button
                type="button"
                className="complex-amplitude-toggle"
                aria-expanded={open}
                aria-controls={contentId}
                onClick={toggleOpen}
            >
                <span className="complex-amplitude-heading">
                    Komplex amplitúdók
                </span>

                <span className="complex-amplitude-heading-right">
                    <span className="complex-amplitude-hint">
                        α / β
                    </span>

                    <svg
                        className={`complex-amplitude-chevron ${open ? "is-open" : ""
                            }`}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </span>
            </button>

            <div
                id={contentId}
                className={`complex-amplitude-content ${open ? "is-open" : ""
                    }`}
                aria-hidden={!open}
                inert={!open}
            >
                <div className="complex-amplitude-content-inner">
                    <div className="complex-amplitude-panel">
                        <div className="complex-state-equation">
                            |ψ⟩ = α|0⟩ + β|1⟩
                        </div>

                        <div
                            className="complex-amplitude-edit-group"
                            onFocusCapture={() => {
                                editingRef.current = true;
                            }}
                            onBlurCapture={handleBlur}
                        >
                            <AmplitudeRow
                                symbol="α"
                                basis="|0⟩"
                                real={draft.alphaRe}
                                imaginary={draft.alphaIm}
                                onRealChange={(value) =>
                                    updateField("alphaRe", value)
                                }
                                onImaginaryChange={(value) =>
                                    updateField("alphaIm", value)
                                }
                                onKeyDown={handleKeyDown}
                            />

                            <div className="complex-amplitude-divider" />

                            <AmplitudeRow
                                symbol="β"
                                basis="|1⟩"
                                real={draft.betaRe}
                                imaginary={draft.betaIm}
                                onRealChange={(value) =>
                                    updateField("betaRe", value)
                                }
                                onImaginaryChange={(value) =>
                                    updateField("betaIm", value)
                                }
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        {error ? (
                            <div
                                className="complex-amplitude-error"
                                role="alert"
                            >
                                {error}
                            </div>
                        ) : (
                            <div className="complex-amplitude-status">
                                <span className="complex-amplitude-status-dot" />
                                Normalizált kvantumállapot
                                <span className="complex-amplitude-norm">
                                    (‖ψ‖ = 1)
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
