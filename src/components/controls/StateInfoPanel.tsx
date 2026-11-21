
import type { CSSProperties } from "react";
import type { QubitState } from "../../quantum/QubitState";
import { toBlochVector } from "../../quantum/bloch";
import { formatComplex, formatNumber } from "../../quantum/format";

type Props = {
    state: QubitState;
    label: string;
    color: string;
};

const rowStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "5px 0",
};

const valueStyle: CSSProperties = {
    fontFamily: '"Cambria Math", "Consolas", monospace',
    fontSize: 14,
    overflowWrap: "anywhere",
    textAlign: "right",
};

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={rowStyle}>
            <span style={{ color: "#94A3B8" }}>{label}</span>
            <span style={valueStyle}>{value}</span>
        </div>
    );
}

function ProbabilityBar({
    label,
    probability,
    color,
}: {
    label: string;
    probability: number;
    color: string;
}) {
    return (
        <div style={{ display: "grid", gap: 6 }}>
            <InfoRow
                label={label}
                value={`${formatNumber(probability * 100)}%`}
            />

            <div style={{
                height: 6,
                borderRadius: 3,
                background: "#334155",
                overflow: "hidden",
            }}>
                <div style={{
                    width: `${Math.max(0, Math.min(100, probability * 100))}%`,
                    height: "100%",
                    background: color,
                    borderRadius: 3,
                }} />
            </div>
        </div>
    );
}

export default function StateInfoPanel({
    state,
    label,
    color,
}: Props) {
    const normalized = state.normalized();

    const { alpha, beta } = normalized;
    const [x, y, z] = toBlochVector(normalized);

    const theta = Math.acos(
        Math.max(-1, Math.min(1, z)),
    ) * 180 / Math.PI;

    const phi = Math.hypot(x, y) < 1e-10
        ? null
        : (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

    const p0 = alpha.absSquared();
    const p1 = beta.absSquared();

    return (
        <aside className="sim-side-panel">
            <h3 style={{ marginTop: 0 }}>
                Állapotinformációk
            </h3>

            <div style={{
                color,
                fontFamily: '"Cambria Math", serif',
                fontSize: 24,
                marginBottom: 16,
            }}>
                {label}
            </div>

            <h4>Komplex amplitúdók</h4>
            <InfoRow label="α" value={formatComplex(alpha)} />
            <InfoRow label="β" value={formatComplex(beta)} />

            <h4>Bloch-koordináták</h4>
            <InfoRow label="x" value={String(formatNumber(x))} />
            <InfoRow label="y" value={String(formatNumber(y))} />
            <InfoRow label="z" value={String(formatNumber(z))} />

            <h4>Gömbi szögek</h4>
            <InfoRow label="θ" value={`${formatNumber(theta)}°`} />
            <InfoRow
                label="φ"
                value={phi === null ? "—" : `${formatNumber(phi)}°`}
            />

            <h4>Mérési valószínűségek</h4>

            <div style={{ display: "grid", gap: 12 }}>
                <ProbabilityBar label="P(0)" probability={p0} color={color} />
                <ProbabilityBar label="P(1)" probability={p1} color={color} />
            </div>
        </aside>
    );
}
