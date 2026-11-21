
import { Line } from "@react-three/drei";
import type { HistorySegment } from "../../simulator/history";

type Props = {
    segment: HistorySegment;
    color: string;
};

export default function StaticHistorySegment({ segment, color }: Props) {
    return (
        <Line
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
    );
}
