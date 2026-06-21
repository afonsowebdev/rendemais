function DonutChart({ data, size = 168, thickness = 24, center }) {
  const total = data.reduce((s, d) => s + d.valor, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  const items = data.filter((d) => d.valor > 0);
  const gap = items.length > 1 ? Math.min(C * 0.012, 6) : 0;
  const uid = "dn" + Math.random().toString(36).slice(2, 9);
  let acc = 0;
  return /* @__PURE__ */ React.createElement("div", { className: "donut-wrap", style: { position: "relative", width: size, height: size, flex: "none" } }, /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}`, style: { transform: "rotate(-90deg)", overflow: "visible" } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("filter", { id: uid, x: "-40%", y: "-40%", width: "180%", height: "180%" }, /* @__PURE__ */ React.createElement("feDropShadow", { dx: "0", dy: "1.5", stdDeviation: "2.5", floodColor: "rgba(15,27,45,.20)" }))), /* @__PURE__ */ React.createElement("circle", { cx, cy, r, fill: "none", stroke: "var(--surface-2)", strokeWidth: thickness }), /* @__PURE__ */ React.createElement("g", { filter: `url(#${uid})` }, data.map((d, i) => {
    if (d.valor <= 0) return null;
    const frac = d.valor / total;
    const len = frac * C;
    const seg = Math.max(len - gap - thickness, 0.5);
    const start = acc + gap / 2 + thickness / 2;
    const el = /* @__PURE__ */ React.createElement(
      "circle",
      {
        key: i,
        className: "donut-seg",
        cx,
        cy,
        r,
        fill: "none",
        stroke: d.color,
        strokeWidth: thickness,
        strokeDasharray: `${seg} ${C - seg}`,
        strokeDashoffset: -start,
        strokeLinecap: "round",
        style: { animationDelay: `${0.1 + i * 0.08}s` }
      }
    );
    acc += len;
    return el;
  }))), center && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" } }, center));
}
function LineChart({ data, height = 216, color = "var(--accent)", color2 = "var(--c-transporte)" }) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(560);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const nw = Math.round(el.clientWidth || 560);
      setW((p) => p === nw ? p : nw);
    };
    measure();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    } else {
      window.addEventListener("resize", measure);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", measure);
    };
  }, []);
  const W = Math.max(260, w);
  const mobile = W < 430;
  const H = mobile ? 200 : height;
  const pad = { t: 18, r: 16, b: 28, l: 16 };
  const vals = data.flatMap((d) => [d.rec, d.gasto]);
  const max = (Math.max(...vals) || 1) * 1.14;
  const min = Math.min(0, ...vals);
  const x = (i) => pad.l + i / (data.length - 1 || 1) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - min) / (max - min || 1)) * (H - pad.t - pad.b);
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
  const fs = mobile ? 12 : 11.5;
  const rRec = mobile ? 4 : 3.8, rGasto = mobile ? 3.4 : 3.2;
  return /* @__PURE__ */ React.createElement("div", { ref, style: { width: "100%" } }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height: H, style: { display: "block", overflow: "visible" } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "lg-rec", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: color, stopOpacity: "0.20" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: color, stopOpacity: "0" }))), [0, 0.5, 1].map((g, i) => {
    const gy = pad.t + g * (H - pad.t - pad.b);
    return /* @__PURE__ */ React.createElement("line", { key: i, x1: pad.l, x2: W - pad.r, y1: gy, y2: gy, stroke: "var(--border)", strokeWidth: "1", strokeDasharray: g === 1 ? void 0 : "3 6", opacity: g === 1 ? 0.9 : 0.55 });
  }), /* @__PURE__ */ React.createElement("path", { className: "lc-fade", d: recArea, fill: "url(#lg-rec)" }), /* @__PURE__ */ React.createElement("path", { className: "lc-fade", d: gastoLine, fill: "none", stroke: color2, strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "1 7", opacity: "0.9" }), /* @__PURE__ */ React.createElement("path", { className: "lc-draw", pathLength: "1", d: recLine, fill: "none", stroke: color, strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }), /* @__PURE__ */ React.createElement("g", { className: "lc-fade" }, data.map((d, i) => /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("circle", { cx: x(i), cy: y(d.gasto), r: rGasto, fill: "var(--surface)", stroke: color2, strokeWidth: "2", opacity: "0.9" }), /* @__PURE__ */ React.createElement("circle", { cx: x(i), cy: y(d.rec), r: rRec, fill: "var(--surface)", stroke: color, strokeWidth: "2.4" }), /* @__PURE__ */ React.createElement("text", { x: x(i), y: H - 8, textAnchor: "middle", fontSize: fs, fontWeight: "700", fill: "var(--ink-3)" }, d.m))))));
}
function BarPair({ data, height = 220, color = "var(--accent)", color2 = "var(--c-transporte)" }) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(560);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const nw = Math.round(el.clientWidth || 560);
      setW((p) => p === nw ? p : nw);
    };
    measure();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    } else {
      window.addEventListener("resize", measure);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", measure);
    };
  }, []);
  const W = Math.max(260, w);
  const mobile = W < 430;
  const H = mobile ? 188 : height;
  const pad = { t: 14, b: 26 };
  const max = (Math.max(...data.map((d) => Math.max(d.rec, d.gasto))) || 1) * 1.12;
  const groupW = W / data.length;
  const bw = Math.min(mobile ? 13 : 17, groupW / 3.2);
  const gapIn = Math.max(3, bw * 0.28);
  const base = H - pad.b;
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const bar = (bx, v, fill, key, delay, op) => {
    const h = base - y(v);
    if (h <= 0.5) return null;
    const r = Math.min(bw / 2, 6, h);
    const top = base - h;
    const d = `M${bx.toFixed(1)},${base} L${bx.toFixed(1)},${(top + r).toFixed(1)} Q${bx.toFixed(1)},${top.toFixed(1)} ${(bx + r).toFixed(1)},${top.toFixed(1)} L${(bx + bw - r).toFixed(1)},${top.toFixed(1)} Q${(bx + bw).toFixed(1)},${top.toFixed(1)} ${(bx + bw).toFixed(1)},${(top + r).toFixed(1)} L${(bx + bw).toFixed(1)},${base} Z`;
    return /* @__PURE__ */ React.createElement("path", { key, className: "bar-rise", d, fill, opacity: op, style: { animationDelay: `${delay}s` } });
  };
  return /* @__PURE__ */ React.createElement("div", { ref, style: { width: "100%" } }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height: H, style: { display: "block", overflow: "visible" } }, /* @__PURE__ */ React.createElement("line", { x1: "0", x2: W, y1: base, y2: base, stroke: "var(--border)", strokeWidth: "1" }), data.map((d, i) => {
    const gx = i * groupW + groupW / 2;
    const x1 = gx - bw - gapIn / 2;
    const x2 = gx + gapIn / 2;
    return /* @__PURE__ */ React.createElement("g", { key: i }, bar(x1, d.rec, color, "r" + i, 0.05 + i * 0.06, 1), bar(x2, d.gasto, color2, "g" + i, 0.1 + i * 0.06, 0.92), /* @__PURE__ */ React.createElement("text", { x: gx, y: H - 8, textAnchor: "middle", fontSize: mobile ? 12 : 11.5, fontWeight: "700", fill: "var(--ink-3)" }, d.m));
  })));
}
function Sparkline({ data, w = 92, h = 32, color = "var(--accent)" }) {
  const max = Math.max(...data), min = Math.min(...data);
  const x = (i) => i / (data.length - 1) * w;
  const y = (v) => h - (v - min) / (max - min || 1) * (h - 4) - 2;
  const d = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return /* @__PURE__ */ React.createElement("svg", { width: w, height: h, style: { flex: "none" } }, /* @__PURE__ */ React.createElement("path", { d, fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }));
}
function BarBreakdown({ data, money, labelOf }) {
  const max = Math.max(1, ...data.map((d) => d.valor || 0));
  const tot = data.reduce((s, d) => s + (d.valor || 0), 0) || 1;
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 15 } }, data.map((c) => {
    const pct = Math.round(c.valor / tot * 100);
    const w = Math.max(4, Math.round(c.valor / max * 100));
    return /* @__PURE__ */ React.createElement("div", { key: c.key }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between", marginBottom: 7, alignItems: "baseline" } }, /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 8, fontSize: 13, fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", { className: "dot", style: { background: c.color } }), labelOf ? labelOf(c) : c.nome), /* @__PURE__ */ React.createElement("span", { className: "tnum", style: { fontSize: 12.5, fontWeight: 700 } }, money(c.valor), " ", /* @__PURE__ */ React.createElement("span", { className: "muted", style: { fontWeight: 600 } }, "\xB7 ", pct, "%"))), /* @__PURE__ */ React.createElement("div", { style: { height: 10, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { className: "bb-fill", style: { width: w + "%", height: "100%", borderRadius: 999, background: c.color } })));
  }));
}
function SavingsArea({ data, height = 168 }) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(420);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const nw = Math.round(el.clientWidth || 420);
      setW((p) => p === nw ? p : nw);
    };
    measure();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    } else {
      window.addEventListener("resize", measure);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", measure);
    };
  }, []);
  const W = Math.max(240, w);
  const H = height;
  const pad = { t: 16, r: 14, b: 26, l: 14 };
  const vals = data.map((d) => d.poupAcum || 0);
  const max = (Math.max(...vals) || 1) * 1.12;
  const x = (i) => pad.l + i / (data.length - 1 || 1) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / (max || 1)) * (H - pad.t - pad.b);
  const P = data.map((d, i) => ({ x: x(i), y: y(d.poupAcum || 0) }));
  const smooth = (pts) => {
    if (pts.length < 2) return pts.length ? `M${pts[0].x},${pts[0].y}` : "";
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };
  const line = smooth(P);
  const base = H - pad.b;
  const area = line + ` L${x(data.length - 1).toFixed(1)},${base} L${x(0).toFixed(1)},${base} Z`;
  const last = P[P.length - 1];
  return /* @__PURE__ */ React.createElement("div", { ref, style: { width: "100%" } }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height: H, style: { display: "block", overflow: "visible" } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "sav-grad", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "var(--c-educacao)", stopOpacity: "0.26" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "var(--c-educacao)", stopOpacity: "0" }))), [0, 0.5, 1].map((g, i) => {
    const gy = pad.t + g * (H - pad.t - pad.b);
    return /* @__PURE__ */ React.createElement("line", { key: i, x1: pad.l, x2: W - pad.r, y1: gy, y2: gy, stroke: "var(--border)", strokeWidth: "1", strokeDasharray: g === 1 ? void 0 : "3 6", opacity: g === 1 ? 0.9 : 0.5 });
  }), /* @__PURE__ */ React.createElement("path", { className: "lc-fade", d: area, fill: "url(#sav-grad)" }), /* @__PURE__ */ React.createElement("path", { className: "lc-draw", pathLength: "1", d: line, fill: "none", stroke: "var(--c-educacao)", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }), /* @__PURE__ */ React.createElement("g", { className: "lc-fade" }, P.map((p, i) => /* @__PURE__ */ React.createElement("circle", { key: i, cx: p.x, cy: p.y, r: "3.4", fill: "var(--surface)", stroke: "var(--c-educacao)", strokeWidth: "2.2" })), data.map((d, i) => /* @__PURE__ */ React.createElement("text", { key: i, x: x(i), y: H - 7, textAnchor: "middle", fontSize: "11.5", fontWeight: "700", fill: "var(--ink-3)" }, d.m))), last && /* @__PURE__ */ React.createElement("circle", { cx: last.x, cy: last.y, r: "5", fill: "var(--c-educacao)" })));
}
function MultiLineSavings({ months, series, height = 220 }) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(560);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const nw = Math.round(el.clientWidth || 560);
      setW((p) => p === nw ? p : nw);
    };
    measure();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    } else {
      window.addEventListener("resize", measure);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", measure);
    };
  }, []);
  const W = Math.max(260, w);
  const mobile = W < 430;
  const H = mobile ? 200 : height;
  const pad = { t: 16, r: 14, b: 26, l: 14 };
  const n = months.length;
  const max = Math.max(1, ...series.flatMap((s) => s.points)) * 1.12;
  const x = (i) => pad.l + i / (n - 1 || 1) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / (max || 1)) * (H - pad.t - pad.b);
  const smooth = (pts) => {
    if (pts.length < 2) return pts.length ? `M${pts[0].x},${pts[0].y}` : "";
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };
  return /* @__PURE__ */ React.createElement("div", { ref, style: { width: "100%" } }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height: H, style: { display: "block", overflow: "visible" } }, [0, 0.5, 1].map((g, i) => {
    const gy = pad.t + g * (H - pad.t - pad.b);
    return /* @__PURE__ */ React.createElement("line", { key: i, x1: pad.l, x2: W - pad.r, y1: gy, y2: gy, stroke: "var(--border)", strokeWidth: "1", strokeDasharray: g === 1 ? void 0 : "3 6", opacity: g === 1 ? 0.9 : 0.5 });
  }), series.map((s) => {
    const P = s.points.map((v, i) => ({ x: x(i), y: y(v) }));
    const last = P[P.length - 1];
    return /* @__PURE__ */ React.createElement("g", { key: s.id, className: "lc-fade" }, /* @__PURE__ */ React.createElement("path", { d: smooth(P), fill: "none", stroke: s.cor, strokeWidth: s.fechada ? 2 : 2.8, strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: s.fechada ? "2 6" : void 0, opacity: s.fechada ? 0.65 : 1 }), last && /* @__PURE__ */ React.createElement("circle", { cx: last.x, cy: last.y, r: mobile ? 4 : 3.6, fill: "var(--surface)", stroke: s.cor, strokeWidth: "2.4", opacity: s.fechada ? 0.65 : 1 }));
  }), months.map((m, i) => /* @__PURE__ */ React.createElement("text", { key: i, x: x(i), y: H - 7, textAnchor: "middle", fontSize: mobile ? 12 : 11.5, fontWeight: "700", fill: "var(--ink-3)" }, m))));
}
Object.assign(window, { DonutChart, LineChart, BarPair, Sparkline, BarBreakdown, SavingsArea, MultiLineSavings });
