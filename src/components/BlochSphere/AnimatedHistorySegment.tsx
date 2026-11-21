
import { useEffect, useLayoutEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
    BufferGeometry,
    Line as ThreeLine,
    LineBasicMaterial,
    Vector3,
} from "three";

import type { HistorySegment } from "../../simulator/history";

type Props = {
    segment: HistorySegment;
    color: string;
    progressRef: { current: number };
    reverse?: boolean;
};

export default function AnimatedHistorySegment({
    segment,
    color,
    progressRef,
    reverse = false,
}: Props) {
    const line = useMemo(() => {
        const points = segment.points.map(
            ([x, y, z]) => new Vector3(x, y, z),
        );

        const geometry = new BufferGeometry().setFromPoints(points);
        geometry.setDrawRange(0, reverse ? points.length : 0);

        const material = new LineBasicMaterial({
            color: "#ffffff",
            transparent: true,
            opacity: 0.45,
            toneMapped: false,
            depthTest: false,
            depthWrite: false,
        });

        const object = new ThreeLine(geometry, material);
        object.renderOrder = 5;

        return object;
    }, [segment.points, reverse]);

    // Szín frissítése az objektum újralétrehozása nélkül
    useLayoutEffect(() => {
        line.material.color.set(color);
    }, [line, color]);

    // Three.js erőforrások felszabadítása
    useEffect(() => {
        return () => {
            line.geometry.dispose();
            line.material.dispose();
        };
    }, [line]);

    // A görbe kirajzolásának előrehaladása
    useFrame(() => {
        const progress = Math.max(0, Math.min(1, progressRef.current));
        const visibleProgress = reverse ? 1 - progress : progress;

        const count = segment.points.length;

        const visible = visibleProgress <= 0
            ? 0
            : Math.min(
                count,
                Math.max(2, Math.floor(visibleProgress * (count - 1)) + 1),
            );

        line.geometry.setDrawRange(0, visible);
    });

    return <primitive object={line} />;
}
