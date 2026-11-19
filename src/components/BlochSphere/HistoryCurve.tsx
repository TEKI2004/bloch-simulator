
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
    BufferGeometry,
    Line as ThreeLine,
    LineBasicMaterial,
    Vector3,
} from "three";
import type { HistorySegment } from "../../simulator/history";
import type { GateStep, SimulatorMode } from "../../simulator/SimulatorState";

type Props = {
    segments: HistorySegment[];
    color: string;
    stepIndex: number;
    mode: SimulatorMode;
    progressRef: { current: number };
    gates: GateStep[];
};

type SegmentProps = {
    segment: HistorySegment;
    color: string;
    progressRef: { current: number };
    reverse?: boolean;
};

type Transition = {
    segment: HistorySegment;
    reverse: boolean;
};

function AnimatedSegment({
    segment,
    color,
    progressRef,
    reverse = false,
}: SegmentProps) {
    const line = useMemo(() => {
        const points = segment.points.map(
            ([x, y, z]) => new Vector3(x, y, z),
        );

        const geometry = new BufferGeometry().setFromPoints(points);
        geometry.setDrawRange(0, reverse ? points.length : 0);

        const material = new LineBasicMaterial({
            color,
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

    useEffect(() => {
        line.material.color.set(color);
    }, [line, color]);

    useEffect(() => {
        return () => {
            line.geometry.dispose();
            line.material.dispose();
        };
    }, [line]);

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

export default function HistoryCurve({
    segments,
    color,
    stepIndex,
    mode,
    progressRef,
    gates,
}: Props) {
    const previous = useRef({ stepIndex, mode, segments, gates });
    const [transition, setTransition] = useState<Transition | null>(null);

    useLayoutEffect(() => {
        const prev = previous.current;
        const difference = stepIndex - prev.stepIndex;

        const gatesChanged = previous.current.gates !== gates;

        if (gatesChanged) {
            setTransition(null);
        } else if (prev.mode === mode && difference === 1) {
            // Előrelépés: megkeressük az új görbeszakaszt
            const added = segments.find(
                (segment) =>
                    !prev.segments.some((old) => old.gateId === segment.gateId),
            );

            setTransition(added ? { segment: added, reverse: false } : null);
        } else if (prev.mode === mode && difference === -1) {
            // Visszalépés: megőrizzük az eltűnő görbeszakaszt
            const removed = prev.segments.find(
                (segment) =>
                    !segments.some((current) => current.gateId === segment.gateId),
            );

            setTransition(removed ? { segment: removed, reverse: true } : null);
        } else if (difference !== 0 || prev.mode !== mode) {
            setTransition(null);
        }

        previous.current = { stepIndex, mode, segments, gates };
    }, [segments, stepIndex, mode, gates]);

    return (
        <group>
            {/* Már végrehajtott kapuk görbéi */}
            {segments.map((segment) =>
                transition?.segment.gateId === segment.gateId &&
                    !transition.reverse ? (
                    <AnimatedSegment
                        key={segment.gateId}
                        segment={segment}
                        color={color}
                        progressRef={progressRef}
                    />
                ) : (
                    <Line
                        key={segment.gateId}
                        points={segment.points}
                        color={color}
                        lineWidth={1.5}
                        transparent
                        opacity={0.45}
                        toneMapped={false}
                        depthTest={false}
                        depthWrite={false}
                        renderOrder={5}
                    />
                ),
            )}

            {/* Visszalépéskor ideiglenesen megőrzött görbe */}
            {transition?.reverse && (
                <AnimatedSegment
                    key={`reverse-${transition.segment.gateId}`}
                    segment={transition.segment}
                    color={color}
                    progressRef={progressRef}
                    reverse
                />
            )}
        </group>
    );
}
