import type { Complex } from "../../../../quantum/Complex";
import { formatComplex } from "../../../../quantum/format";

type Props = {
    label: string;
    alpha: Complex;
    beta: Complex;
};

function formatCoefficient(value: Complex): string {
    const text = formatComplex(value);

    // A többtagú vagy negatív együtthatókat
    // zárójelbe tesszük az egyértelműség érdekében.
    return text.includes(" ") || text.startsWith("-")
        ? `(${text})`
        : text;
}

export default function StateVectorCard({
    label,
    alpha,
    beta,
}: Props) {
    const betaIsNegative =
        formatComplex(beta).startsWith("-");

    const displayedBeta = betaIsNegative
        ? beta.scale(-1)
        : beta;

    return (
        <section className="state-info-vector-card">
            <div className="state-info-card-caption">
                Állapotvektor
            </div>

            <div className="state-info-equation">
                <span className="state-info-equation-label">
                    {label} =
                </span>

                <div className="state-info-equation-terms">
                    <span className="state-info-term">
                        {formatCoefficient(alpha)}|0⟩
                    </span>

                    <span className="state-info-operator">
                        {betaIsNegative ? "−" : "+"}
                    </span>

                    <span className="state-info-term">
                        {formatCoefficient(displayedBeta)}|1⟩
                    </span>
                </div>
            </div>
        </section>
    );
}
