
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";

import { DEFAULT_STATE_COLORS } from "../../../simulator/SimulatorState";

import "./StateColorPicker.css";

type Props = {
    color: string;
    onChange: (color: string) => void;
};

const PRESET_COLORS = [
    { name: "Cián", value: DEFAULT_STATE_COLORS[0] },
    { name: "Narancs", value: DEFAULT_STATE_COLORS[1] },
    { name: "Lila", value: DEFAULT_STATE_COLORS[2] },
    { name: "Zöld", value: DEFAULT_STATE_COLORS[3] },
    { name: "Rózsaszín", value: "#F472B6" },
    { name: "Sárga", value: "#FACC15" },
    { name: "Kék", value: "#60A5FA" },
    { name: "Piros", value: "#F87171" },
];

const COLOR_DELAY = 100;
const POPOVER_WIDTH = 240;
const VIEWPORT_MARGIN = 12;
const POPOVER_GAP = 8;

export default function StateColorPicker({
    color,
    onChange,
}: Props) {
    const [open, setOpen] = useState(false);
    const [previewColor, setPreviewColor] = useState(color);

    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const pendingColor = useRef<string | null>(null);
    const colorTimer = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // A szimulátor kívülről érkező színváltozásait követjük,
    // de a még szerkesztett helyi előnézetet nem írjuk felül.
    useEffect(() => {
        if (pendingColor.current === null) {
            setPreviewColor(color);
        }
    }, [color]);

    const flushColor = useCallback(() => {
        if (colorTimer.current !== null) {
            clearTimeout(colorTimer.current);
            colorTimer.current = null;
        }

        const pending = pendingColor.current;
        pendingColor.current = null;

        if (pending !== null) {
            onChangeRef.current(pending);
        }
    }, []);

    const scheduleColorChange = useCallback(
        (nextColor: string) => {
            setPreviewColor(nextColor);
            pendingColor.current = nextColor;

            if (colorTimer.current !== null) {
                clearTimeout(colorTimer.current);
            }

            // Csak az utolsó színt alkalmazzuk,
            // ha a felhasználó 100 ms-ig nem változtat.
            colorTimer.current = setTimeout(
                flushColor,
                COLOR_DELAY,
            );
        },
        [flushColor],
    );

    function selectPreset(nextColor: string) {
        // A palettából választott szín azonnal alkalmazható.
        if (colorTimer.current !== null) {
            clearTimeout(colorTimer.current);
            colorTimer.current = null;
        }

        pendingColor.current = null;
        setPreviewColor(nextColor);
        onChangeRef.current(nextColor);
        setOpen(false);
    }

    const closePopover = useCallback(() => {
        flushColor();
        setOpen(false);
    }, [flushColor]);

    // A még függőben lévő módosítás nem veszhet el,
    // ha állapotváltáskor megszűnik a komponens.
    useEffect(() => {
        return () => {
            flushColor();
        };
    }, [flushColor]);

    // A paletta helye mindig a trigger tényleges
    // képernyőpozíciójához igazodik.
    useLayoutEffect(() => {
        if (!open) return;

        const trigger = triggerRef.current;
        const popover = popoverRef.current;

        if (!trigger || !popover) return;

        function updatePosition() {
            if (!trigger || !popover) return;

            const rect = trigger.getBoundingClientRect();

            const width = Math.min(
                POPOVER_WIDTH,
                window.innerWidth - 2 * VIEWPORT_MARGIN,
            );

            popover.style.width = `${width}px`;

            const left = Math.max(
                VIEWPORT_MARGIN,
                Math.min(
                    rect.left,
                    window.innerWidth -
                    width -
                    VIEWPORT_MARGIN,
                ),
            );

            const height = popover.getBoundingClientRect().height;

            let top = rect.bottom + POPOVER_GAP;

            // Ha alul nem fér el, felfelé nyitjuk.
            if (
                top + height >
                window.innerHeight - VIEWPORT_MARGIN
            ) {
                const above =
                    rect.top - height - POPOVER_GAP;

                top =
                    above >= VIEWPORT_MARGIN
                        ? above
                        : Math.max(
                            VIEWPORT_MARGIN,
                            window.innerHeight -
                            height -
                            VIEWPORT_MARGIN,
                        );
            }

            popover.style.left = `${left}px`;
            popover.style.top = `${top}px`;
        }

        updatePosition();

        const observer = new ResizeObserver(updatePosition);

        observer.observe(trigger);

        const sidebar = trigger.closest(".sim-side-panel");

        if (sidebar) {
            observer.observe(sidebar);
        }

        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);

        return () => {
            observer.disconnect();

            window.removeEventListener(
                "resize",
                updatePosition,
            );

            window.removeEventListener(
                "scroll",
                updatePosition,
                true,
            );
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;

        function handlePointerDown(event: PointerEvent) {
            const target = event.target;

            if (!(target instanceof Node)) return;

            const insideTrigger =
                rootRef.current?.contains(target);

            const insidePopover =
                popoverRef.current?.contains(target);

            if (!insideTrigger && !insidePopover) {
                closePopover();
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                closePopover();
            }
        }

        document.addEventListener(
            "pointerdown",
            handlePointerDown,
        );

        document.addEventListener(
            "keydown",
            handleKeyDown,
        );

        return () => {
            document.removeEventListener(
                "pointerdown",
                handlePointerDown,
            );

            document.removeEventListener(
                "keydown",
                handleKeyDown,
            );
        };
    }, [open, closePopover]);

    return (
        <div className="state-color-picker" ref={rootRef}>
            <div className="state-color-header">
                <span className="state-color-label">
                    Vektor színe
                </span>

                <button
                    ref={triggerRef}
                    type="button"
                    className="state-color-trigger"
                    aria-label="Vektor színének módosítása"
                    aria-expanded={open}
                    onClick={() => {
                        if (open) {
                            closePopover();
                        } else {
                            setOpen(true);
                        }
                    }}
                >
                    <span
                        className="state-color-preview"
                        style={{
                            backgroundColor: previewColor,
                        }}
                    />

                    <span className="state-color-hex">
                        {previewColor.toUpperCase()}
                    </span>

                    <span
                        className={`state-color-chevron ${open ? "is-open" : ""}`}
                        aria-hidden="true"
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </span>

                </button>
            </div>

            {open &&
                createPortal(
                    <div
                        ref={popoverRef}
                        className="state-color-popover"
                        role="group"
                        aria-label="Vektor színválasztó"
                    >
                        <div className="state-color-popover-title">
                            Színpaletta
                        </div>

                        <div className="state-color-grid">
                            {PRESET_COLORS.map((preset) => {
                                const selected =
                                    previewColor.toLowerCase() ===
                                    preset.value.toLowerCase();

                                return (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        className={[
                                            "state-color-preset",
                                            selected && "is-selected",
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                        style={{
                                            backgroundColor:
                                                preset.value,
                                        }}
                                        title={preset.name}
                                        aria-label={preset.name}
                                        aria-pressed={selected}
                                        onClick={() =>
                                            selectPreset(preset.value)
                                        }
                                    >
                                        {selected && (
                                            <svg
                                                viewBox="0 0 24 24"
                                                width="17"
                                                height="17"
                                                fill="none"
                                                stroke="#101827"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                aria-hidden="true"
                                            >
                                                <path d="m5 12 4 4L19 6" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="state-color-divider" />

                        <label className="state-color-custom">
                            <span>Egyedi szín</span>

                            <input
                                type="color"
                                value={previewColor}
                                onChange={(event) =>
                                    scheduleColorChange(
                                        event.target.value,
                                    )
                                }
                                onBlur={flushColor}
                                aria-label="Egyedi szín kiválasztása"
                            />
                        </label>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
