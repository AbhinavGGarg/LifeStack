"use client";

function toPath(points, height) {
  if (points.length === 0) {
    return "";
  }

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${height - point.y}`)
    .join(" ");
}

export default function LineTrendChart({ data = [], label = "Trend" }) {
  const width = 520;
  const height = 180;
  const maxValue = Math.max(100, ...data.map((item) => item.value || 0));
  const step = data.length > 1 ? width / (data.length - 1) : width;

  const points = data.map((item, index) => ({
    x: Math.round(index * step),
    y: Math.round(((item.value || 0) / maxValue) * (height - 20)),
    label: item.label,
    value: item.value || 0,
  }));

  const path = toPath(points, height);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
          <defs>
            <linearGradient id="trajectoryFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="#cbd5e1" strokeWidth="1" />

          {path ? (
            <>
              <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill="url(#trajectoryFill)" />
              <path d={path} fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : null}

          {points.map((point) => (
            <circle
              key={`${point.label}-${point.x}`}
              cx={point.x}
              cy={height - point.y}
              r="3.5"
              fill="#0369a1"
              stroke="#e0f2fe"
              strokeWidth="2"
            />
          ))}
        </svg>

        <div className="mt-2 grid grid-cols-4 gap-2 text-[11px] text-slate-500 sm:grid-cols-8">
          {data.map((item) => (
            <div key={`${item.label}-${item.value}`} className="truncate">
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
