type Props = {
    p0: number;
    p1: number;
};

function ProbabilityBar({
    basis,
    formula,
    probability,
}: {
    basis: string;
    formula: string;
    probability: number;
}) {
    const percent = Math.max(
        0,
        Math.min(100, probability * 100),
    );

    return (
        <div className="state-info-probability">
            <div className="state-info-probability-header">
                <span className="state-info-basis">
                    {basis}
                </span>

                <span className="state-info-formula">
                    {formula}
                </span>

                <span className="state-info-probability-value">
                    {percent.toFixed(1)}%
                </span>
            </div>

            <div
                className="state-info-probability-track"
                role="progressbar"
                aria-label={`${basis} mérési valószínűsége`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Number(percent.toFixed(1))}
            >
                <div
                    className="state-info-probability-fill"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

export default function MeasurementProbabilities({
    p0,
    p1,
}: Props) {
    return (
        <section className="state-info-section">
            <h4>Mérési valószínűségek</h4>

            <div className="state-info-probabilities">
                <ProbabilityBar
                    basis="|0⟩"
                    formula="|α|²"
                    probability={p0}
                />

                <ProbabilityBar
                    basis="|1⟩"
                    formula="|β|²"
                    probability={p1}
                />
            </div>

            <p className="state-info-note">
                Z-bázisú mérés esetén
            </p>
        </section>
    );
}
