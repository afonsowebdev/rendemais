const BM = window.BM;
function initials(name) {
  return (name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
}
function Avatar({ account, size = 34, fontSize }) {
  const foto = account == null ? void 0 : account.foto;
  if (foto) return /* @__PURE__ */ React.createElement("img", { src: foto, alt: "", style: { width: size, height: size, borderRadius: "50%", objectFit: "cover", flex: "none" } });
  return /* @__PURE__ */ React.createElement("div", { className: "user-av", style: { width: size, height: size, fontSize: fontSize || size * 0.4 } }, initials(account == null ? void 0 : account.nome));
}
function CatBadge({ catKey, size = 40, r = 12 }) {
  const c = BM.cats[catKey] || BM.cats.outros;
  return /* @__PURE__ */ React.createElement("div", { style: {
    width: size,
    height: size,
    borderRadius: r,
    flex: "none",
    display: "grid",
    placeItems: "center",
    background: `color-mix(in srgb, ${c.color} 16%, transparent)`
  } }, /* @__PURE__ */ React.createElement(Icon, { name: c.icon, size: size * 0.45, color: c.color, sw: 1.9 }));
}
function Brand({ nameColor = "var(--ink)", size = 38, sub = null, onClick }) {
  return /* @__PURE__ */ React.createElement("div", { className: "brand", style: { padding: 0, cursor: onClick ? "pointer" : "default" }, onClick }, /* @__PURE__ */ React.createElement("div", { className: "brand-mark", style: { width: size, height: size } }, /* @__PURE__ */ React.createElement("span", { className: "brand-mark-txt", style: { fontSize: size * 0.5 } }, "R")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "brand-name", style: { color: nameColor, fontSize: size * 0.45 } }, "Rende", /* @__PURE__ */ React.createElement("span", { className: "brand-plus" }, "+")), sub && /* @__PURE__ */ React.createElement("div", { className: "brand-sub", style: { color: nameColor === "#fff" ? "rgba(255,255,255,.6)" : "var(--ink-3)" } }, sub)));
}
function Sidebar({ route, go, account, collapsed, onToggle }) {
  const tr = useT();
  const nav = [
    { id: "dashboard", label: tr("lbl_dashboard"), icon: "grid" },
    { id: "despesas", label: tr("lbl_expenses"), icon: "wallet" },
    { id: "rendimentos", label: tr("lbl_income"), icon: "arrowsDown" },
    { id: "poupanca", label: tr("lbl_savings"), icon: "target" }
  ];
  const nav2 = [
    { id: "relatorios", label: tr("lbl_reports"), icon: "report" },
    { id: "historico", label: tr("lbl_history"), icon: "history" },
    { id: "config", label: tr("lbl_settings"), icon: "gear" }
  ];
  const Item = (n) => /* @__PURE__ */ React.createElement("button", { key: n.id, className: "nav-item" + (route === n.id ? " active" : ""), onClick: () => go(n.id), title: n.label }, /* @__PURE__ */ React.createElement(Icon, { name: n.icon, size: 19 }), /* @__PURE__ */ React.createElement("span", null, n.label));
  return /* @__PURE__ */ React.createElement("aside", { className: "sidebar" }, /* @__PURE__ */ React.createElement("div", { style: { padding: "4px 8px 22px" } }, /* @__PURE__ */ React.createElement("button", { onClick: () => go("dashboard"), style: { border: "none", background: "none", padding: 0, cursor: "pointer" }, title: tr("go_dashboard") }, /* @__PURE__ */ React.createElement(Brand, { nameColor: "#fff" }))), /* @__PURE__ */ React.createElement("div", { className: "nav-label" }, tr("lbl_general")), nav.map(Item), /* @__PURE__ */ React.createElement("div", { className: "nav-label" }, tr("lbl_analysis")), nav2.map(Item), /* @__PURE__ */ React.createElement("div", { className: "sidebar-foot" }, /* @__PURE__ */ React.createElement("button", { className: "nav-item sb-toggle", onClick: onToggle, title: collapsed ? tr("sb_expand") : tr("sb_collapse") }, /* @__PURE__ */ React.createElement("span", { style: { display: "grid", transform: collapsed ? "none" : "rotate(180deg)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 18 })), /* @__PURE__ */ React.createElement("span", null, collapsed ? tr("sb_expand") : tr("sb_collapse"))), /* @__PURE__ */ React.createElement("button", { className: "user-chip", style: { border: "none", width: "100%", textAlign: "left" }, onClick: () => go("perfil"), title: (account == null ? void 0 : account.nome) || tr("lbl_my_account") }, /* @__PURE__ */ React.createElement(Avatar, { account, size: 34 }), /* @__PURE__ */ React.createElement("div", { className: "uc-text", style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, (account == null ? void 0 : account.nome) || tr("lbl_my_account")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, opacity: 0.6 } }, [account == null ? void 0 : account.perfil, account == null ? void 0 : account.cidade].filter(Boolean).join(" \xB7 ") || tr("lbl_profile"))))));
}
function MonthNav({ label, onPrev, onNext, canNext = true, isCurrent, onToday }) {
  const tr = useT();
  return /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 8 } }, !isCurrent && onToday && /* @__PURE__ */ React.createElement("button", { className: "btn btn-soft", style: { padding: "7px 12px" }, onClick: onToday }, tr("month_current")), /* @__PURE__ */ React.createElement("div", { className: "seg", style: { padding: 2 } }, /* @__PURE__ */ React.createElement("button", { onClick: onPrev, style: { padding: "6px 9px" } }, /* @__PURE__ */ React.createElement("span", { style: { transform: "rotate(180deg)", display: "grid" } }, /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 15 }))), /* @__PURE__ */ React.createElement("span", { style: { display: "grid", placeItems: "center", padding: "0 12px", fontSize: 13, fontWeight: 700, minWidth: 96 } }, label), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: canNext ? onNext : void 0,
      disabled: !canNext,
      title: canNext ? "" : tr("month_at_current"),
      style: { padding: "6px 9px", opacity: canNext ? 1 : 0.35, cursor: canNext ? "pointer" : "not-allowed" }
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 15 })
  )));
}
function Topbar({ title, sub, theme, setTheme, onLogout, onAdd, addLabel, monthNav }) {
  const tr = useT();
  return /* @__PURE__ */ React.createElement("div", { className: "topbar" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 11, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "mobile-brand brand-mark", style: { width: 34, height: 34, borderRadius: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "brand-mark-txt", style: { fontSize: 17 } }, "R")), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("h1", { className: "page-title" }, title), sub && /* @__PURE__ */ React.createElement("p", { className: "page-sub" }, sub))), /* @__PURE__ */ React.createElement("div", { className: "topbar-actions" }, monthNav, onAdd && /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: onAdd }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 16, color: "#fff" }), " ", /* @__PURE__ */ React.createElement("span", { className: "hide-mobile" }, addLabel || tr("add_generic"))), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => setTheme(theme === "dark" ? "light" : "dark"), title: tr("theme_title") }, /* @__PURE__ */ React.createElement(Icon, { name: theme === "dark" ? "sun" : "moon", size: 18 })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn hide-mobile", onClick: onLogout, title: tr("logout_short") }, /* @__PURE__ */ React.createElement(Icon, { name: "logout", size: 18 }))));
}
function MobileNav({ route, go, onMore }) {
  const tr = useT();
  const tabs = [
    { id: "dashboard", label: tr("lbl_home"), icon: "grid" },
    { id: "despesas", label: tr("lbl_expenses"), icon: "wallet" },
    { id: "rendimentos", label: tr("lbl_income_m"), icon: "arrowsDown" },
    { id: "poupanca", label: tr("lbl_savings"), icon: "target" }
  ];
  const moreRoutes = ["relatorios", "historico", "perfil", "config"];
  return /* @__PURE__ */ React.createElement("nav", { className: "mobilenav" }, tabs.map((t) => /* @__PURE__ */ React.createElement("button", { key: t.id, className: "mtab" + (route === t.id ? " on" : ""), onClick: () => go(t.id) }, /* @__PURE__ */ React.createElement(Icon, { name: t.icon, size: 21, sw: route === t.id ? 2.1 : 1.8 }), /* @__PURE__ */ React.createElement("span", null, t.label))), /* @__PURE__ */ React.createElement("button", { className: "mtab" + (moreRoutes.includes(route) ? " on" : ""), onClick: onMore }, /* @__PURE__ */ React.createElement(Icon, { name: "dots", size: 21, sw: 2.4 }), /* @__PURE__ */ React.createElement("span", null, tr("lbl_more"))));
}
function MoreSheet({ route, go, onClose, theme, setTheme, onLogout }) {
  const tr = useT();
  const items = [
    { id: "relatorios", label: tr("lbl_reports"), icon: "report" },
    { id: "historico", label: tr("lbl_history"), icon: "history" },
    { id: "perfil", label: tr("lbl_profile"), icon: "user" },
    { id: "config", label: tr("lbl_settings"), icon: "gear" }
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "sheet-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "sheet", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "sheet-grip" }), items.map((it) => /* @__PURE__ */ React.createElement("button", { key: it.id, className: "sheet-item" + (route === it.id ? " on" : ""), onClick: () => {
    go(it.id);
    onClose();
  } }, /* @__PURE__ */ React.createElement("span", { className: "si-ico" }, /* @__PURE__ */ React.createElement(Icon, { name: it.icon, size: 18 })), it.label)), /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "var(--border)", margin: "8px 12px" } }), /* @__PURE__ */ React.createElement("button", { className: "sheet-item", onClick: () => {
    setTheme(theme === "dark" ? "light" : "dark");
  } }, /* @__PURE__ */ React.createElement("span", { className: "si-ico" }, /* @__PURE__ */ React.createElement(Icon, { name: theme === "dark" ? "sun" : "moon", size: 18 })), theme === "dark" ? tr("theme_light") : tr("theme_dark")), /* @__PURE__ */ React.createElement("button", { className: "sheet-item", style: { color: "var(--neg)" }, onClick: () => {
    onClose();
    onLogout();
  } }, /* @__PURE__ */ React.createElement("span", { className: "si-ico" }, /* @__PURE__ */ React.createElement(Icon, { name: "logout", size: 18, color: "var(--neg)" })), tr("logout_full"))));
}
function Kpi({ label, value, sub, delta, deltaDir, icon, color, spark }) {
  return /* @__PURE__ */ React.createElement("div", { className: "card card-pad kpi" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-top" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-ico", style: { background: `color-mix(in srgb, ${color} 15%, transparent)` } }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 19, color, sw: 1.9 })), spark && /* @__PURE__ */ React.createElement(Sparkline, { data: spark, color }), !spark && delta != null && /* @__PURE__ */ React.createElement("span", { className: "delta " + (deltaDir === "down" ? "down" : "up") }, /* @__PURE__ */ React.createElement(Icon, { name: deltaDir === "down" ? "arrowDown" : "arrowUp", size: 13 }), " ", delta)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "kpi-label" }, label), /* @__PURE__ */ React.createElement("div", { className: "kpi-val tnum", style: { marginTop: 6 } }, value), sub && /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { marginTop: 7, fontWeight: 600 } }, sub)));
}
function Alert({ kind, icon, title, children }) {
  return /* @__PURE__ */ React.createElement("div", { className: "alert " + kind }, /* @__PURE__ */ React.createElement("span", { className: "alert-ico" }, /* @__PURE__ */ React.createElement(
    Icon,
    {
      name: icon,
      size: 18,
      color: kind === "warn" ? "var(--warn)" : kind === "bad" ? "var(--neg)" : "var(--accent)"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13.5, lineHeight: 1.35 } }, title), children && /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { marginTop: 3, fontWeight: 600, lineHeight: 1.5 } }, children)));
}
function Progress({ value, max, color }) {
  const pct = Math.min(100, max > 0 ? value / max * 100 : 0);
  return /* @__PURE__ */ React.createElement("div", { className: "bar" }, /* @__PURE__ */ React.createElement("i", { style: { width: pct + "%", background: color || "var(--accent)" } }));
}
function EmptyState({ icon, title, msg, action }) {
  return /* @__PURE__ */ React.createElement("div", { className: "card empty-card", style: { display: "grid", placeItems: "center", padding: "56px 24px", textAlign: "center", width: "100%", boxSizing: "border-box" } }, /* @__PURE__ */ React.createElement("div", { className: "li-ico", style: { width: 60, height: 60, marginBottom: 18, background: "var(--accent-soft)" } }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 26, color: "var(--accent)", sw: 1.8 })), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 18, letterSpacing: "-.01em" } }, title), /* @__PURE__ */ React.createElement("div", { className: "muted", style: { marginTop: 7, fontSize: 14, fontWeight: 500, maxWidth: 380, lineHeight: 1.55 } }, msg), action && /* @__PURE__ */ React.createElement("div", { className: "empty-action", style: { marginTop: 20, width: "100%" } }, action));
}
function Field({ label, children, hint }) {
  return /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, label), children, hint && /* @__PURE__ */ React.createElement("span", { className: "tiny muted", style: { fontWeight: 600 } }, hint));
}
function Modal({ title, sub, onClose, children, footer, wide }) {
  return /* @__PURE__ */ React.createElement("div", { className: "modal-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal", style: wide ? { maxWidth: 560 } : null, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 16 } }, title), sub && /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 600, marginTop: 2 } }, sub)), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", style: { width: 32, height: 32 }, onClick: onClose }, /* @__PURE__ */ React.createElement("span", { style: { transform: "rotate(45deg)", display: "grid" } }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 17, sw: 2, color: "var(--ink-2)" })))), /* @__PURE__ */ React.createElement("div", { style: { padding: 20, overflowY: "auto", flex: "1 1 auto", minHeight: 0 } }, children), footer && /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 20px 20px", display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0, borderTop: "1px solid var(--border)" } }, footer)));
}
Object.assign(window, { initials, Avatar, Brand, CatBadge, Sidebar, MobileNav, MoreSheet, MonthNav, Topbar, Kpi, Alert, Progress, EmptyState, Field, Modal });
