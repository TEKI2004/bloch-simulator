
import type { ReactNode } from "react";

import "./BlochViewport.css";

type Props = {
    children: ReactNode;
    stateTabs: ReactNode;
    colorPicker: ReactNode;
};

export default function BlochViewport({
    children,
    stateTabs,
    colorPicker,
}: Props) {
    return (
        <div className="bloch-viewport">
            <div className="bloch-viewport-scene">
                {children}
            </div>

            <div className="bloch-viewport-tabs">
                {stateTabs}
            </div>

            <div className="bloch-viewport-color">
                {colorPicker}
            </div>
        </div>
    );
}
