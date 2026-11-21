import type { BlochVector } from "../../../../quantum/bloch";
import { formatNumber } from "../../../../quantum/format";

type Props = {
    coordinates: BlochVector;
};

export default function BlochCoordinates({
    coordinates,
}: Props) {
    const axes = ["x", "y", "z"] as const;

    return (
        <section className="state-info-section">
            <h4>Bloch-koordináták</h4>

            <div className="state-info-coordinates">
                {axes.map((axis, index) => (
                    <div
                        key={axis}
                        className="state-info-coordinate"
                    >
                        <span className="state-info-coordinate-label">
                            {axis}
                        </span>

                        <span className="state-info-coordinate-value">
                            {formatNumber(coordinates[index])}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}
