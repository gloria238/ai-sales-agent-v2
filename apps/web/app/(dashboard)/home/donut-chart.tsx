"use client";

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: Segment[];
  size?: number;
  thickness?: number;
  label?: string;
}

export function DonutChart({ segments, size = 120, thickness = 28, label = "Total" }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const ratio = seg.value / total;
    const start = cumulative;
    cumulative += ratio;
    return {
      key: seg.label,
      color: seg.color,
      ratio,
      dashArray: ratio * circumference,
      dashOffset: circumference - start * circumference,
    };
  });

  // Need a guard: if ratio > 0.995, it's effectively a full circle => render as complete ring
  const effectiveArcs = arcs.map((a) => {
    if (a.ratio > 0.98) {
      // Full circle: dashArray = circumference, no gap needed
      return { ...a, dashArray: circumference, dashOffset: 0 };
    }
    return a;
  });

  const fontSize = Math.round(size * 0.18);
  const subFontSize = Math.round(size * 0.11);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0" style={{ transform: "rotate(-90deg)" }}>
      {/* Background ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="hsl(var(--background-subtle))"
        strokeWidth={thickness}
      />
      {/* Foreground arcs */}
      {effectiveArcs.map((arc) => (
        <circle
          key={arc.key}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={arc.color}
          strokeWidth={thickness}
          strokeDasharray={`${arc.dashArray} ${circumference}`}
          strokeDashoffset={arc.dashOffset}
          className="transition-all duration-500 ease-out"
          strokeLinecap="butt"
        />
      ))}

      {/* Center text — un-rotated */}
      <g style={{ transform: `rotate(90deg)`, transformOrigin: `${center}px ${center}px` }}>
        <text
          x={center}
          y={center - 2}
          textAnchor="middle"
          dominantBaseline="auto"
          style={{ fill: "hsl(var(--foreground))", fontSize: `${fontSize}px`, fontWeight: 700 }}
        >
          {total > 0 ? total : "—"}
        </text>
        <text
          x={center}
          y={center + subFontSize + 1}
          textAnchor="middle"
          dominantBaseline="auto"
          style={{ fill: "hsl(var(--muted-foreground))", fontSize: `${subFontSize}px`, fontWeight: 500 }}
        >
          {label}
        </text>
      </g>
    </svg>
  );
}
