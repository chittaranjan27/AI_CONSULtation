"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface Bubble {
  id: number;
  left: string;
  width: number;
  height: number;
  duration: string;
  delay: string;
  driftDuration: string;
  background: string;
}

const BUBBLE_COLORS = [
  "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.02) 70%, transparent 100%)",
  "radial-gradient(circle, rgba(59, 130, 246, 0.10) 0%, rgba(59, 130, 246, 0.02) 70%, transparent 100%)",
  "radial-gradient(circle, rgba(6, 182, 212, 0.10) 0%, rgba(6, 182, 212, 0.02) 70%, transparent 100%)",
  "radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.04) 50%, transparent 100%)",
  "radial-gradient(circle, rgba(236, 72, 153, 0.06) 0%, rgba(139, 92, 246, 0.03) 60%, transparent 100%)",
];

function generateBubbles(count: number): Bubble[] {
  const bubbles: Bubble[] = [];
  for (let i = 0; i < count; i++) {
    const size = Math.random() * 120 + 30; // 30px to 150px
    bubbles.push({
      id: i,
      left: `${Math.random() * 100}%`,
      width: size,
      height: size,
      duration: `${Math.random() * 15 + 12}s`, // 12s to 27s
      delay: `${Math.random() * 20}s`, // 0s to 20s stagger
      driftDuration: `${Math.random() * 6 + 4}s`, // 4s to 10s horizontal drift
      background: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
    });
  }
  return bubbles;
}

export default function BubbleBackground() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const pathname = usePathname();

  // Skip bubble rendering on admin and dashboard routes to reduce GPU load
  const isAppRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard");

  // Generate bubbles only on mount (client-side) to avoid SSR hydration mismatches
  useEffect(() => {
    if (!isAppRoute) {
      setBubbles(generateBubbles(22));
    } else {
      setBubbles([]);
    }
  }, [isAppRoute]);

  if (bubbles.length === 0) return null;

  return (
    <div className="bubble-container" aria-hidden="true">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="bubble"
          style={
            {
              left: b.left,
              bottom: `-${b.height}px`,
              width: `${b.width}px`,
              height: `${b.height}px`,
              background: b.background,
              "--duration": b.duration,
              "--delay": b.delay,
              "--drift-duration": b.driftDuration,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
