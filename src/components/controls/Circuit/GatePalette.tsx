
import { useEffect, useRef } from "react";

import { GATE_OPTIONS } from "../../../simulator/gateCatalog";
import type { GateOption } from "../../../simulator/gateCatalog";

import "./GatePalette.css";

type Props = {
    disabled: boolean;
    onAdd: (gate: GateOption) => void;
};

export default function GatePalette({
    disabled,
    onAdd,
}: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Normál egérgörgővel is vízszintesen görgethető.
    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        function handleWheel(event: WheelEvent) {
            if (!element) return;

            const maxScroll =
                element.scrollWidth - element.clientWidth;

            if (maxScroll <= 0) return;

            const delta =
                Math.abs(event.deltaX) > Math.abs(event.deltaY)
                    ? event.deltaX
                    : event.deltaY;

            const next = Math.max(
                0,
                Math.min(maxScroll, element.scrollLeft + delta),
            );

            if (Math.abs(next - element.scrollLeft) < 0.5) {
                return;
            }

            event.preventDefault();
            element.scrollLeft = next;
        }

        element.addEventListener("wheel", handleWheel, {
            passive: false,
        });

        return () => {
            element.removeEventListener("wheel", handleWheel);
        };
    }, []);

    return (
        <div
            ref={scrollRef}
            className="qc-gate-palette"
            aria-label="Kvantumkapuk"
        >
            {GATE_OPTIONS.map((gate) => (
                <button
                    key={gate.label}
                    type="button"
                    className="qc-gate-palette-button"
                    data-gate-label={gate.label}
                    disabled={disabled}
                    draggable={!disabled}
                    onDragStart={(event) => {
                        event.dataTransfer.setData(
                            "application/x-bloch-gate",
                            gate.label,
                        );

                        event.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => onAdd(gate)}
                >
                    + {gate.label}
                </button>
            ))}
        </div>
    );
}
