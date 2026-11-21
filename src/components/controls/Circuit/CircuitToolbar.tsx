import type { ReactNode } from "react";

import "./CircuitToolbar.css";

type Props = {
    palette: ReactNode;
    playback: ReactNode;
    mode: ReactNode;
};

export default function CircuitToolbar({
    palette,
    playback,
    mode,
}: Props) {
    return (
        <div className="qc-toolbar">
            <div className="qc-toolbar-palette">
                {palette}
            </div>

            <div className="qc-toolbar-playback">
                {playback}
            </div>

            <div className="qc-toolbar-mode">
                {mode}
            </div>
        </div>
    );
}
