/* ===== Charts (pure SVG) ===== */

function DonutChart({ data, size = 168, thickness = 24, center }) {
  const total = data.reduce((s, d) => s + d.valor, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        {data.map((d, i) => {
          const frac = d.valor / total;
          const len = frac * C;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color}
              strokeWidth={thickness} strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-acc} strokeLinecap="butt" />
          );
          acc += len;
          return el;
        })}
      </svg>
      {center && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
          {center}
        </div>
      )}
    </div>
  );
}

function LineChart({ data, height = 200, color = "var(--accent)", color2 = "var(--c-transporte)" }) {
  const pad = { t: 16, r: 12, b: 26, l: 12 };
  const W = 560, H = height;
  const keys = data.map((d) => d.m);
  const max = Math.max(...data.map((d) => Math.max(d.rec, d.gasto))) * 1.12;
  const min = Math.min(...data.map((d) => Math.min(d.rec, d.gasto))) * 0.82;
  const x = (i) => pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
  const line = (sel) => data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[sel]).toFixed(1)}`).join(" ");
  const area = (sel) => line(sel) + ` L${x(data.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lg-rec" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g, i) => (
        <line key={i} x1={pad.l} x2={W - pad.r} y1={pad.t + g * (H - pad.t - pad.b)} y2={pad.t + g * (H - pad.t - pad.b)}
          stroke="var(--border)" strokeWidth="1" strokeDasharray="3 5" />
      ))}
      <path d={area("rec")} fill="url(#lg-rec)" />
      <path d={line("rec")} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d={line("gasto")} fill="none" stroke={color2} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 5" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.rec)} r="3.4" fill="var(--surface)" stroke={color} strokeWidth="2.4" />
          <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-3)">{d.m}</text>
        </g>
      ))}
    </svg>
  );
}

function BarPair({ data, height = 200 }) {
  const W = 560, H = height, pad = { t: 16, b: 26 };
  const max = Math.max(...data.map((d) => Math.max(d.rec, d.gasto))) * 1.1;
  const groupW = W / data.length;
  const bw = 16;
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      {data.map((d, i) => {
        const gx = i * groupW + groupW / 2;
        return (
          <g key={i}>
            <rect x={gx - bw - 3} y={y(d.rec)} width={bw} height={H - pad.b - y(d.rec)} rx="4" fill="var(--accent)" />
            <rect x={gx + 3} y={y(d.gasto)} width={bw} height={H - pad.b - y(d.gasto)} rx="4" fill="var(--c-transporte)" opacity="0.85" />
            <text x={gx} y={H - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-3)">{d.m}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Sparkline({ data, w = 92, h = 32, color = "var(--accent)" }) {
  const max = Math.max(...data), min = Math.min(...data);
  const x = (i) => (i / (data.length - 1)) * w;
  const y = (v) => h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
  const d = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} style={{ flex: "none" }}>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

Object.assign(window, { DonutChart, LineChart, BarPair, Sparkline });
