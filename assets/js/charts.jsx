/* ===== Charts (pure SVG) ===== */

function DonutChart({ data, size = 168, thickness = 24, center }) {
  const total = data.reduce((s, d) => s + d.valor, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  const items = data.filter((d) => d.valor > 0);
  const gap = items.length > 1 ? Math.min(C * 0.012, 6) : 0; // espaço entre fatias
  const uid = "dn" + Math.random().toString(36).slice(2, 9);
  let acc = 0;
  return (
    <div className="donut-wrap" style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
        <defs>
          <filter id={uid} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="rgba(15,27,45,.20)" />
          </filter>
        </defs>
        {/* trilho de fundo */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        <g filter={`url(#${uid})`}>
          {data.map((d, i) => {
            if (d.valor <= 0) return null;
            const frac = d.valor / total;
            const len = frac * C;
            // arredonda as pontas sem distorcer a proporção: descontamos a espessura
            // (que as pontas redondas voltam a preencher) e centramos a fatia na fenda.
            const seg = Math.max(len - gap - thickness, 0.5);
            const start = acc + gap / 2 + thickness / 2;
            const el = (
              <circle key={i} className="donut-seg" cx={cx} cy={cy} r={r} fill="none" stroke={d.color}
                strokeWidth={thickness} strokeDasharray={`${seg} ${C - seg}`}
                strokeDashoffset={-start} strokeLinecap="round"
                style={{ animationDelay: `${0.1 + i * 0.08}s` }} />
            );
            acc += len;
            return el;
          })}
        </g>
      </svg>
      {center && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
          {center}
        </div>
      )}
    </div>
  );
}

function LineChart({ data, height = 216, color = "var(--accent)", color2 = "var(--c-transporte)" }) {
  const pad = { t: 18, r: 14, b: 28, l: 14 };
  const W = 560, H = height;
  const vals = data.flatMap((d) => [d.rec, d.gasto]);
  const max = (Math.max(...vals) || 1) * 1.14;
  const min = Math.min(0, ...vals);
  const x = (i) => pad.l + (i / (data.length - 1 || 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - min) / (max - min || 1)) * (H - pad.t - pad.b);

  // curva suave (Catmull-Rom -> Bézier), sem distorcer os pontos reais
  const toPts = (sel) => data.map((d, i) => ({ x: x(i), y: y(d[sel]) }));
  const smooth = (P) => {
    if (P.length < 2) return P.length ? `M${P[0].x},${P[0].y}` : "";
    let d = `M${P[0].x.toFixed(1)},${P[0].y.toFixed(1)}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };
  const recLine = smooth(toPts("rec"));
  const gastoLine = smooth(toPts("gasto"));
  const base = H - pad.b;
  const recArea = recLine + ` L${x(data.length - 1).toFixed(1)},${base} L${x(0).toFixed(1)},${base} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="lg-rec" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((g, i) => {
        const gy = pad.t + g * (H - pad.t - pad.b);
        return <line key={i} x1={pad.l} x2={W - pad.r} y1={gy} y2={gy} stroke="var(--border)" strokeWidth="1" strokeDasharray={g === 1 ? undefined : "3 6"} opacity={g === 1 ? 0.9 : 0.55} />;
      })}
      <path className="lc-fade" d={recArea} fill="url(#lg-rec)" />
      <path className="lc-fade" d={gastoLine} fill="none" stroke={color2} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 7" opacity="0.9" />
      <path className="lc-draw" pathLength="1" d={recLine} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <g className="lc-fade">
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(d.gasto)} r="3" fill="var(--surface)" stroke={color2} strokeWidth="2" opacity="0.9" />
            <circle cx={x(i)} cy={y(d.rec)} r="3.6" fill="var(--surface)" stroke={color} strokeWidth="2.4" />
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-3)">{d.m}</text>
          </g>
        ))}
      </g>
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