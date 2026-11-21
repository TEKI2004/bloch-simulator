
import { useState } from "react";
import { Complex } from "../quantum/Complex";
import { QubitState } from "../quantum/QubitState";
import { toBlochVector } from "../quantum/bloch";
import { formatNumber } from "../quantum/format";

type Props = {
    state: QubitState;
    onChange: (state: QubitState) => void;
};

type Amplitudes = {
    alphaRe: string;
    alphaIm: string;
    betaRe: string;
    betaIm: string;
};

const toRadians = (degrees: number) => degrees * Math.PI / 180;
const toDegrees = (radians: number) => radians * 180 / Math.PI;


function getAngles(state: QubitState): [number, number] {
    const [x, y, z] = toBlochVector(state);

    const theta = toDegrees(
        Math.acos(Math.max(-1, Math.min(1, z))),
    );

    const phi = (
        toDegrees(Math.atan2(y, x)) + 360
    ) % 360;

    return [
        Number(theta.toFixed(4)),
        Number(phi.toFixed(4)),
    ];
}


function getAmplitudes(state: QubitState): Amplitudes {
    return {
        alphaRe: String(formatNumber(state.alpha.re)),
        alphaIm: String(formatNumber(state.alpha.im)),
        betaRe: String(formatNumber(state.beta.re)),
        betaIm: String(formatNumber(state.beta.im)),
    };
}

export default function InitialStateEditor({ state, onChange }: Props) {
    const [angles, setAngles] = useState(() => getAngles(state));
    const [amplitudes, setAmplitudes] = useState(() => getAmplitudes(state));
    const [error, setError] = useState("");

    const [theta, phi] = angles;

    function updateAngles(theta: number, phi: number) {
        if (!Number.isFinite(theta) || !Number.isFinite(phi)) return;

        theta = Math.max(0, Math.min(180, theta));
        phi = Math.max(0, Math.min(360, phi));

        const next = QubitState.fromAngles(toRadians(theta), toRadians(phi));

        setAngles([theta, phi]);
        setAmplitudes(getAmplitudes(next));
        setError("");
        onChange(next);
    }

    function applyAmplitudes() {
        const values = Object.values(amplitudes);

        if (values.some((value) => value.trim() === "")) {
            setError("Minden amplitúdókomponenst meg kell adni.");
            return;
        }

        const [ar, ai, br, bi] = values.map(Number);

        if (![ar, ai, br, bi].every(Number.isFinite)) {
            setError("Érvénytelen amplitúdó.");
            return;
        }

        const normSquared = ar * ar + ai * ai + br * br + bi * bi;

        if (!Number.isFinite(normSquared) || normSquared === 0) {
            setError("Az állapot nem lehet nullvektor vagy nem véges.");
            return;
        }

        const next = new QubitState(
            new Complex(ar, ai),
            new Complex(br, bi),
        ).normalized();

        setAngles(getAngles(next));
        setAmplitudes(getAmplitudes(next));
        setError("");
        onChange(next);
    }

    return (
        <div style={{ display: "grid", gap: 16 }}>
            <label>
                θ: {theta.toFixed(1)}°
                <input type="range" min={0} max={180} step={0.1}
                    value={theta} onChange={(e) => updateAngles(Number(e.target.value), phi)}
                    style={{ width: "100%" }} />
                <input type="number" min={0} max={180} step={0.1}
                    value={theta} onChange={(e) => updateAngles(Number(e.target.value), phi)} />
            </label>

            <label>
                φ: {phi.toFixed(1)}°
                <input type="range" min={0} max={360} step={0.1}
                    value={phi} onChange={(e) => updateAngles(theta, Number(e.target.value))}
                    style={{ width: "100%" }} />
                <input type="number" min={0} max={360} step={0.1}
                    value={phi} onChange={(e) => updateAngles(theta, Number(e.target.value))} />
            </label>

            <div style={{ display: "grid", gap: 8 }}>
                <strong>Komplex amplitúdók</strong>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {([
                        ["alphaRe", "Re(α)"],
                        ["alphaIm", "Im(α)"],
                        ["betaRe", "Re(β)"],
                        ["betaIm", "Im(β)"],
                    ] as const).map(([key, label]) => (
                        <label key={key}>
                            {label}
                            <input type="number" step="any" value={amplitudes[key]}
                                onChange={(e) => setAmplitudes((current) => ({
                                    ...current,
                                    [key]: e.target.value,
                                }))}
                                style={{ width: "100%" }} />
                        </label>
                    ))}
                </div>

                <button onClick={applyAmplitudes}>
                    Alkalmazás (normalizálva)
                </button>

                {error && <span role="alert" style={{ color: "#f87171" }}>{error}</span>}
            </div>
        </div>
    );
}
