import AngleSlider from "./controls/Inputs/AngleSlider";
import ComplexAmplitudeEditor from "./controls/State/ComplexAmplitudeEditor";

import { useState } from "react";
import { QubitState } from "../quantum/QubitState";
import { toBlochVector } from "../quantum/bloch";
import { useRafCommit } from "../hooks/useRafCommit";

type Props = {
    state: QubitState;
    onChange: (state: QubitState) => void;
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

export default function InitialStateEditor({ state, onChange }: Props) {
    const [angles, setAngles] = useState(() => getAngles(state));
    const {
        schedule: scheduleStateUpdate,
        flush: flushStateUpdate,
        commitNow: commitStateNow,
    } = useRafCommit(onChange);

    const [theta, phi] = angles;

    function updateAngles(
        theta: number,
        phi: number,
        immediate = false,
    ) {
        if (
            !Number.isFinite(theta) ||
            !Number.isFinite(phi)
        ) {
            return;
        }

        theta = Math.max(0, Math.min(180, theta));
        phi = Math.max(0, Math.min(360, phi));

        const next = QubitState.fromAngles(
            toRadians(theta),
            toRadians(phi),
        );

        // A szerkesztő azonnal követi a változást.
        setAngles([theta, phi]);

        // Csak a teljes szimulátor frissítését korlátozzuk.
        if (immediate) {
            commitStateNow(next);
        } else {
            scheduleStateUpdate(next);
        }
    }

    return (
        <div style={{ display: "grid", gap: 16 }}>
            <div
                style={{
                    display: "grid",
                    gap: 24,
                }}
            >
                <AngleSlider
                    symbol="θ"
                    label="Polárszög"
                    value={theta}
                    min={0}
                    max={180}
                    step={0.1}
                    normalize={(value) =>
                        Math.max(0, Math.min(180, value))
                    }
                    onChange={(value) =>
                        updateAngles(value, phi)
                    }
                    onCommit={(value) =>
                        updateAngles(value, phi, true)
                    }
                    onInteractionEnd={flushStateUpdate}
                />

                <AngleSlider
                    symbol="φ"
                    label="Azimutszög"
                    value={phi}
                    min={0}
                    max={360}
                    step={0.1}
                    normalize={(value) =>
                        value >= 0 && value <= 360
                            ? value
                            : ((value % 360) + 360) % 360
                    }
                    onChange={(value) =>
                        updateAngles(theta, value)
                    }
                    onCommit={(value) =>
                        updateAngles(theta, value, true)
                    }
                    onInteractionEnd={flushStateUpdate}
                />
            </div>

            <ComplexAmplitudeEditor
                state={state}
                onCommit={(next) => {
                    setAngles(getAngles(next));
                    commitStateNow(next);
                }}
            />

        </div>
    );
}
