
import type { GateStep } from "../../../../simulator/SimulatorState";
import { formatComplex } from "../../../../quantum/format";

type Props = {
    gate?: GateStep;
};

export default function GateMatrixCard({ gate }: Props) {
    return (
        <section className="state-info-gate-section">
            <div className="state-info-gate-header">
                <h4>Aktuális kapu</h4>

                <span className="state-info-gate-name">
                    {gate?.label ?? "—"}
                </span>
            </div>

            {gate ? (
                <div className="state-info-gate-card">
                    <div className="state-info-gate-matrix-scroll">
                        <div
                            className="state-info-matrix"
                            aria-label={`${gate.label} kapu mátrixa`}
                        >
                            <span
                                className="state-info-matrix-bracket"
                                aria-hidden="true"
                            />

                            <div className="state-info-matrix-values">
                                {gate.matrix.flatMap(
                                    (row, rowIndex) =>
                                        row.map((value, columnIndex) => (
                                            <span
                                                key={`${rowIndex}-${columnIndex}`}
                                                className="state-info-matrix-value"
                                            >
                                                {formatComplex(value)}
                                            </span>
                                        )),
                                )}
                            </div>

                            <span
                                className="state-info-matrix-bracket"
                                aria-hidden="true"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <p className="state-info-gate-empty">
                    Még nincs végrehajtott kapu.
                </p>
            )}
        </section>
    );
}
