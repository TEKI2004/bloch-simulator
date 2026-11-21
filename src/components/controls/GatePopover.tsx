
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GateStep } from "../../simulator/SimulatorState";
import "./GatePopover.css";

type Props = {
    gate: GateStep;
    anchor: HTMLButtonElement;
    onClose: () => void;
    onUpdateAngle: (degrees: number) => void;
    onDelete: () => void;
};

export default function GatePopover({
    gate,
    anchor,
    onClose,
    onUpdateAngle,
    onDelete,
}: Props) {
    const popoverRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [angle, setAngle] = useState(
        gate.parameter
            ? String(Number((gate.parameter.angle * 180 / Math.PI).toFixed(4)))
            : "",
    );

    const hasParameter = !!gate.parameter;

    // Megnyitáskor fókusz és teljes kijelölés
    useLayoutEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, [gate.id]);

    useEffect(() => {
        function handlePointerDown(event: PointerEvent) {
            if (
                event.target instanceof Node &&
                popoverRef.current?.contains(event.target)
            ) {
                return;
            }

            if (hasParameter && angle.trim()) {
                const value = Number(angle.replace(",", "."));
                if (Number.isFinite(value)) {
                    onUpdateAngle(value);
                }
            }

            onClose();
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [angle, hasParameter, onClose, onUpdateAngle]);

    function applyAngle() {
        if (!hasParameter || !angle.trim()) return;

        const value = Number(angle.replace(",", "."));

        if (Number.isFinite(value)) {
            onUpdateAngle(value);
        }
    }

    useLayoutEffect(() => {
        const popover = popoverRef.current;
        if (!popover) return;

        function updatePosition() {
            if (!popover) return;

            const rect = anchor.getBoundingClientRect();

            const scrollContainer = anchor.closest<HTMLElement>(
                ".qc-row-scroll",
            );

            const viewport = scrollContainer?.getBoundingClientRect();

            // Ha a kapu nincs teljesen a látható tracken belül,
            // a popover se jelenjen meg.
            const visible = viewport &&
                rect.left >= viewport.left &&
                rect.right <= viewport.right &&
                rect.top >= viewport.top &&
                rect.bottom <= viewport.bottom;

            if (!visible) {
                popover.style.visibility = "hidden";
                return;
            }

            const openBelow = rect.top < 32;

            const left = hasParameter
                ? rect.left + rect.width / 2
                : rect.right - 15;

            const top = hasParameter
                ? (openBelow ? rect.bottom - 6 : rect.top + 6)
                : rect.top - 8;

            popover.style.left = `${left}px`;
            popover.style.top = `${top}px`;
            popover.style.width = `${hasParameter ? rect.width : 20}px`;

            popover.style.transform = hasParameter
                ? (openBelow
                    ? "translateX(-50%)"
                    : "translate(-50%, -100%)")
                : "none";

            popover.style.visibility = "visible";
        }

        updatePosition();

        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);

        const observer = new ResizeObserver(updatePosition);
        observer.observe(anchor);

        const scrollContainer = anchor.closest(".qc-row-scroll");
        if (scrollContainer) observer.observe(scrollContainer);

        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
            observer.disconnect();
        };
    }, [anchor, hasParameter]);

    return createPortal(
        <div
            ref={popoverRef}
            className={`gate-popover ${!hasParameter ? "gate-popover--delete-only" : ""
                }`}
            style={{ visibility: "hidden" }}
        >
            {hasParameter && (
                <input
                    ref={inputRef}
                    className="gate-popover-input"
                    type="text"
                    inputMode="decimal"
                    value={angle}
                    aria-label="Forgásszög fokban"
                    onChange={(event) => setAngle(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            applyAngle();
                            onClose();
                        }
                    }}
                />
            )}

            <button
                type="button"
                className="gate-popover-delete"
                onClick={onDelete}
                title="Kapu törlése"
                aria-label="Kapu törlése"
            >
                ×
            </button>
        </div>,
        document.body,
    );
}
