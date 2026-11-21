
import { useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import "./SimulatorLayout.css";

type Props = {
    left: ReactNode;
    center: ReactNode;
    right: ReactNode;
    bottom: ReactNode;
};

const MIN_BOTTOM_HEIGHT = 220;
const DEFAULT_BOTTOM_HEIGHT = 300;
const HEADER_HEIGHT = 56;
const MIN_WORKSPACE_HEIGHT = 180;

export default function SimulatorLayout({
    left,
    center,
    right,
    bottom,
}: Props) {
    const [bottomHeight, setBottomHeight] = useState(
        DEFAULT_BOTTOM_HEIGHT,
    );

    const resizing = useRef(false);

    function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
        resizing.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
        if (!resizing.current) return;

        const maxHeight = Math.max(
            MIN_BOTTOM_HEIGHT,
            window.innerHeight - HEADER_HEIGHT - MIN_WORKSPACE_HEIGHT,
        );

        const height = window.innerHeight - event.clientY;

        setBottomHeight(
            Math.max(MIN_BOTTOM_HEIGHT, Math.min(maxHeight, height)),
        );
    }

    function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
        resizing.current = false;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    }


    return (
        <div
            className="sim-layout"
            style={{
                gridTemplateRows:
                    `${HEADER_HEIGHT}px minmax(0, 1fr) ${bottomHeight}px`,
            }}
        >
            <header className="sim-header">
                <div className="sim-brand">
                    <img
                        src={`${import.meta.env.BASE_URL}favicon.ico`}
                        alt=""
                        className="sim-brand-logo"
                    />
                    <span>Bloch Sphere Simulator</span>
                </div>
            </header>

            <main className="sim-workspace">
                <section className="sim-sidebar">
                    {left}
                </section>

                <section className="sim-viewport">
                    {center}
                </section>
            </main>

            {/* Jobb panel: felső munkaterület + alsó QC magassága */}
            <section className="sim-right-sidebar">
                {right}
            </section>

            {/* QC: csak a bal oldali és középső oszlop alatt */}
            <section className="sim-bottom">
                <div
                    className="sim-resize-handle"
                    role="separator"
                    aria-label="Kapusorpanel átméretezése"
                    aria-orientation="horizontal"
                    aria-valuenow={bottomHeight}
                    aria-valuemin={MIN_BOTTOM_HEIGHT}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                >
                    <div className="sim-resize-indicator" />
                </div>

                <div className="sim-bottom-content">
                    {bottom}
                </div>
            </section>
        </div>
    );
}
