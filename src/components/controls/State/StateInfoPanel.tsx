
import type { CSSProperties } from "react";

import type { QubitState } from "../../../quantum/QubitState";
import { toBlochVector } from "../../../quantum/bloch";
import { formatNumber } from "../../../quantum/format";
import type { GateStep } from "../../../simulator/SimulatorState";

import StateVectorCard from "./Info/StateVectorCard";
import MeasurementProbabilities from "./Info/MeasurementProbabilities";
import BlochCoordinates from "./Info/BlochCoordinates";
import GateMatrixCard from "./Info/GateMatrixCard";

import "./StateInfoPanel.css";

type Props = {
    state: QubitState;
    label: string;
    color: string;

    stepIndex: number;
    totalSteps: number;
    activeGate?: GateStep;
};

function getRelativePhase(
    state: QubitState,
): number | null {
    const { alpha, beta } = state;

    // A pólusokon a relatív fázis nem értelmezhető.
    if (
        alpha.absSquared() < 1e-20 ||
        beta.absSquared() < 1e-20
    ) {
        return null;
    }

    const alphaPhase = Math.atan2(alpha.im, alpha.re);
    const betaPhase = Math.atan2(beta.im, beta.re);

    const degrees =
        (betaPhase - alphaPhase) * 180 / Math.PI;

    // A szöget [-180°, 180°) tartományra hozzuk.
    return (
        ((degrees + 180) % 360 + 360) % 360
    ) - 180;
}

export default function StateInfoPanel({
    state,
    label,
    color,
    stepIndex,
    totalSteps,
    activeGate,
}: Props) {
    const normalized = state.normalized();

    const { alpha, beta } = normalized;

    const coordinates = toBlochVector(normalized);

    const p0 = alpha.absSquared();
    const p1 = beta.absSquared();

    const relativePhase = getRelativePhase(normalized);

    return (
        <aside
            className="sim-side-panel state-info-panel"
            style={{
                "--state-color": color,
            } as CSSProperties}
        >
            <header className="state-info-header">
                <h3>Állapotinformációk</h3>

                <div className="state-info-selected">
                    <span className="state-info-selected-dot" />
                    <span>{label}</span>
                </div>
            </header>

            <div className="state-info-step">
                <span>Aktuális állapot</span>

                <span>
                    {stepIndex} / {totalSteps}. lépés
                </span>
            </div>

            <GateMatrixCard gate={activeGate} />

            <StateVectorCard
                label={label}
                alpha={alpha}
                beta={beta}
            />

            <MeasurementProbabilities
                p0={p0}
                p1={p1}
            />

            <BlochCoordinates
                coordinates={coordinates}
            />

            <div className="state-info-relative-phase">
                <span>Relatív fázis</span>

                <span className="state-info-relative-phase-value">
                    {relativePhase === null
                        ? "—"
                        : `${formatNumber(relativePhase)}°`}
                </span>
            </div>
        </aside>
    );
}
