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
const NAV_GROUPS = [
  {
    label: "Geral",
    items: [
      { id: "dashboard", label: "Painel", icon: "grid" },
      { id: "assistente", label: "Assistente Rende+", icon: "bot" },
      { id: "transacoes", label: "Transa\xE7\xF5es", icon: "transfer" },
      { id: "objetivos", label: "Objetivos", icon: "target" },
      { id: "agenda", label: "Agenda Financeira", icon: "calendarCheck" }
    ]
  },
  {
    label: "Outros",
    items: [
      { id: "partilha", label: "Partilha", icon: "users" },
      { id: "contas", label: "Contas", icon: "wallet" },
      { id: "relatorios", label: "Relat\xF3rios", icon: "report" },
      { id: "config", label: "Defini\xE7\xF5es", icon: "gear" }
    ]
  }
];
function SidebarNavList({ route, go, onNavigate }) {
  const Item = (n) => {
    const active = route === n.id;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: n.id,
        className: "nav-item" + (active ? " active" : ""),
        onClick: () => {
          go(n.id);
          onNavigate && onNavigate();
        },
        title: n.label,
        "aria-current": active ? "page" : void 0
      },
      /* @__PURE__ */ React.createElement(Icon, { name: n.icon, size: 19 }),
      /* @__PURE__ */ React.createElement("span", null, n.label)
    );
  };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, NAV_GROUPS.map((g) => /* @__PURE__ */ React.createElement(React.Fragment, { key: g.label }, /* @__PURE__ */ React.createElement("div", { className: "nav-label" }, g.label), g.items.map(Item))));
}
function Sidebar({ route, go, account, collapsed, onToggle }) {
  const tr = useT();
  const ehPremium = !!(account && account.plano === "premium");
  return /* @__PURE__ */ React.createElement("aside", { className: "sidebar" }, /* @__PURE__ */ React.createElement("div", { style: { padding: "4px 8px 22px" } }, /* @__PURE__ */ React.createElement("button", { onClick: () => go("dashboard"), style: { border: "none", background: "none", padding: 0, cursor: "pointer" }, title: tr("go_dashboard") }, /* @__PURE__ */ React.createElement(Brand, null))), /* @__PURE__ */ React.createElement(SidebarNavList, { route, go }), /* @__PURE__ */ React.createElement("div", { className: "sidebar-foot" }, !ehPremium && /* @__PURE__ */ React.createElement("button", { className: "sb-plan-pill", onClick: () => go("premium"), title: "Desbloqueia o Rende+ Premium" }, /* @__PURE__ */ React.createElement(Icon, { name: "spark", size: 14, color: "var(--accent)" }), " ", /* @__PURE__ */ React.createElement("span", null, "Free \u2014 Upgrade")), /* @__PURE__ */ React.createElement("button", { className: "nav-item sb-toggle", onClick: onToggle, title: collapsed ? tr("sb_expand") : tr("sb_collapse") }, /* @__PURE__ */ React.createElement("span", { style: { display: "grid", transform: collapsed ? "none" : "rotate(180deg)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 18 })), /* @__PURE__ */ React.createElement("span", null, collapsed ? tr("sb_expand") : tr("sb_collapse")))));
}
function MobileSidebarDrawer({ open, onClose, route, go, account }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  const ehPremium = !!(account && account.plano === "premium");
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "mobile-drawer-backdrop" + (open ? " open" : ""), onClick: onClose, "aria-hidden": !open }), /* @__PURE__ */ React.createElement("aside", { className: "sidebar mobile-drawer" + (open ? " open" : ""), role: "dialog", "aria-modal": "true", "aria-label": "Menu de navega\xE7\xE3o", "aria-hidden": !open }, /* @__PURE__ */ React.createElement("div", { className: "mobile-drawer-head" }, /* @__PURE__ */ React.createElement(Brand, null), /* @__PURE__ */ React.createElement("button", { type: "button", className: "icon-btn", onClick: onClose, "aria-label": "Fechar menu" }, /* @__PURE__ */ React.createElement(Icon, { name: "close", size: 18 }))), /* @__PURE__ */ React.createElement(SidebarNavList, { route, go, onNavigate: onClose }), !ehPremium && /* @__PURE__ */ React.createElement("div", { className: "sidebar-foot" }, /* @__PURE__ */ React.createElement("button", { className: "sb-plan-pill", onClick: () => {
    go("premium");
    onClose();
  }, title: "Desbloqueia o Rende+ Premium" }, /* @__PURE__ */ React.createElement(Icon, { name: "spark", size: 14, color: "var(--accent)" }), " ", /* @__PURE__ */ React.createElement("span", null, "Free \u2014 Upgrade")))));
}
function MonthNav({ label, onPrev, onNext, canNext = true }) {
  const tr = useT();
  return /* @__PURE__ */ React.createElement("div", { className: "seg month-seg" }, /* @__PURE__ */ React.createElement("button", { onClick: onPrev, "aria-label": "M\xEAs anterior" }, /* @__PURE__ */ React.createElement("span", { style: { transform: "rotate(180deg)", display: "grid" } }, /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 15 }))), /* @__PURE__ */ React.createElement("span", { className: "row month-seg-label" }, /* @__PURE__ */ React.createElement(Icon, { name: "cal", size: 14, color: "var(--ink-3)" }), label), /* @__PURE__ */ React.createElement("button", { onClick: canNext ? onNext : void 0, disabled: !canNext, "aria-label": "M\xEAs seguinte", title: canNext ? "" : tr("month_at_current") }, /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 15 })));
}
function useDropdownClose() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return [open, setOpen, ref];
}
function ProfileMenu({ account, go, onLogout }) {
  const tr = useT();
  const [open, setOpen, ref] = useDropdownClose();
  return /* @__PURE__ */ React.createElement("div", { className: "profile-menu", ref }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "profile-menu-btn", onClick: () => setOpen((v) => !v), "aria-haspopup": "menu", "aria-expanded": open, "aria-label": "Abrir menu do perfil", title: "Perfil" }, /* @__PURE__ */ React.createElement(Avatar, { account, size: 30 }), /* @__PURE__ */ React.createElement("i", { className: "bx bx-chevron-down profile-menu-chev", "aria-hidden": "true" })), open && /* @__PURE__ */ React.createElement("div", { className: "profile-menu-pop", role: "menu", "aria-label": "Conta" }, /* @__PURE__ */ React.createElement("div", { className: "profile-menu-head" }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13.5 } }, (account == null ? void 0 : account.nome) || tr("lbl_my_account")), (account == null ? void 0 : account.email) && /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 600, marginTop: 1 } }, account.email)), /* @__PURE__ */ React.createElement("div", { className: "profile-menu-sep" }), /* @__PURE__ */ React.createElement("button", { type: "button", role: "menuitem", onClick: () => {
    setOpen(false);
    go("perfil");
  } }, /* @__PURE__ */ React.createElement(Icon, { name: "user", size: 16 }), " Ver perfil"), /* @__PURE__ */ React.createElement("button", { type: "button", role: "menuitem", onClick: () => {
    setOpen(false);
    go("config");
  } }, /* @__PURE__ */ React.createElement(Icon, { name: "gear", size: 16 }), " Defini\xE7\xF5es"), /* @__PURE__ */ React.createElement("button", { type: "button", role: "menuitem", onClick: () => {
    setOpen(false);
    go("config");
  } }, /* @__PURE__ */ React.createElement(Icon, { name: "shield", size: 16 }), " Seguran\xE7a"), /* @__PURE__ */ React.createElement("button", { type: "button", role: "menuitem", onClick: () => {
    setOpen(false);
    go("premium");
  } }, /* @__PURE__ */ React.createElement(Icon, { name: "spark", size: 16 }), " Plano atual"), /* @__PURE__ */ React.createElement("div", { className: "profile-menu-sep" }), /* @__PURE__ */ React.createElement("button", { type: "button", role: "menuitem", className: "profile-menu-danger", onClick: () => {
    setOpen(false);
    onLogout();
  } }, /* @__PURE__ */ React.createElement(Icon, { name: "logout", size: 16 }), " ", tr("logout_full"))));
}
function Topbar({ route, account, title, sub, theme, setTheme, onLogout, go, onOpenMobileMenu }) {
  const fin = useFinance();
  const notificacoesOn = !fin.account || fin.account.notificacoes !== false;
  const themeLabel = theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro";
  const isDashboard = route === "dashboard";
  const primeiroNome = ((account == null ? void 0 : account.nome) || "").trim().split(" ")[0];
  const saudacao = primeiroNome ? `Ol\xE1, ${primeiroNome}` : "Ol\xE1";
  const tituloMostrado = isDashboard ? saudacao : title;
  return /* @__PURE__ */ React.createElement("div", { className: "topbar" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "icon-btn topbar-hamburger", onClick: onOpenMobileMenu, "aria-label": "Abrir menu de navega\xE7\xE3o", title: "Menu" }, /* @__PURE__ */ React.createElement(Icon, { name: "menu", size: 22 })), /* @__PURE__ */ React.createElement("div", { className: "mobile-brand" }, /* @__PURE__ */ React.createElement(Brand, { size: 30 })), tituloMostrado && /* @__PURE__ */ React.createElement("div", { className: "topbar-title", style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("h1", { className: "page-title" }, tituloMostrado), sub && /* @__PURE__ */ React.createElement("p", { className: "page-sub" }, sub)), /* @__PURE__ */ React.createElement("div", { className: "topbar-actions" }, notificacoesOn && /* @__PURE__ */ React.createElement(NotifBell, { go }), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => setTheme(theme === "dark" ? "light" : "dark"), title: themeLabel, "aria-label": themeLabel }, /* @__PURE__ */ React.createElement(Icon, { name: theme === "dark" ? "sun" : "moon", size: 20 })), /* @__PURE__ */ React.createElement(ProfileMenu, { account: fin.account, go, onLogout })));
}
function PageIntro({ monthNav }) {
  if (!monthNav) return null;
  return /* @__PURE__ */ React.createElement("div", { className: "page-intro" }, /* @__PURE__ */ React.createElement("div", { className: "page-intro-month" }, monthNav));
}
function MobileNav({ route, go, onAdd, onMore }) {
  const tr = useT();
  const Tab = (t) => /* @__PURE__ */ React.createElement("button", { key: t.id, className: "mtab" + (route === t.id ? " on" : ""), onClick: () => go(t.id) }, /* @__PURE__ */ React.createElement(Icon, { name: t.icon, size: 22, sw: route === t.id ? 2.1 : 1.8 }), /* @__PURE__ */ React.createElement("span", null, t.label), /* @__PURE__ */ React.createElement("i", { className: "mtab-dot", "aria-hidden": "true" }));
  const moreRoutes = ["agenda", "contas", "relatorios", "perfil", "config", "partilha", "previsao", "premium"];
  return /* @__PURE__ */ React.createElement("nav", { className: "mobilenav" }, /* @__PURE__ */ React.createElement("svg", { className: "mobilenav-bg", viewBox: "0 0 375 80", preserveAspectRatio: "none", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("path", { d: "M0 24 Q0 0 24 0 L139.5 0 C156 0 152 28 187.5 28 C223 28 219 0 235.5 0 L351 0 Q375 0 375 24 L375 80 L0 80 Z" })), /* @__PURE__ */ React.createElement("div", { className: "mobilenav-row" }, Tab({ id: "dashboard", label: tr("lbl_home"), icon: "grid" }), Tab({ id: "transacoes", label: "Transa\xE7\xF5es", icon: "transfer" }), /* @__PURE__ */ React.createElement("span", { className: "mtab-fab-slot", "aria-hidden": "true" }), Tab({ id: "objetivos", label: "Objetivos", icon: "target" }), /* @__PURE__ */ React.createElement("button", { className: "mtab" + (moreRoutes.includes(route) ? " on" : ""), onClick: onMore }, /* @__PURE__ */ React.createElement(Icon, { name: "dots", size: 22, sw: 2.2 }), /* @__PURE__ */ React.createElement("span", null, tr("lbl_more")), /* @__PURE__ */ React.createElement("i", { className: "mtab-dot", "aria-hidden": "true" }))), /* @__PURE__ */ React.createElement("button", { type: "button", className: "mtab-fab", onClick: onAdd, "aria-label": "Adicionar" }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 25, color: "#fff", sw: 2.3 })));
}
function MoreSheet({ route, go, onClose, theme, setTheme, onLogout, account }) {
  const tr = useT();
  const ehPremium = !!(account && account.plano === "premium");
  const principais = [
    { id: "perfil", label: "Conta", icon: "user" },
    { id: "config", label: tr("lbl_settings"), icon: "gear" }
  ];
  const outros = [
    { id: "relatorios", label: tr("lbl_reports"), icon: "report" },
    { id: "contas", label: tr("lbl_accounts"), icon: "wallet" }
  ];
  const premItems = [
    { id: "assistente", label: "Assistente Rende+", icon: "bot" },
    { id: "agenda", label: "Agenda Financeira", icon: "calendarCheck" },
    { id: "partilha", label: "Partilha", icon: "users" },
    { id: "previsao", label: "Previs\xE3o", icon: "chart" }
  ];
  const Item = (it) => /* @__PURE__ */ React.createElement("button", { key: it.id, className: "sheet-item" + (route === it.id ? " on" : ""), onClick: () => {
    go(it.id);
    onClose();
  } }, /* @__PURE__ */ React.createElement("span", { className: "si-ico" }, /* @__PURE__ */ React.createElement(Icon, { name: it.icon, size: 18 })), it.label);
  return /* @__PURE__ */ React.createElement("div", { className: "sheet-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "sheet", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "sheet-grip" }), principais.map(Item), /* @__PURE__ */ React.createElement("button", { className: "sheet-item" + (route === "premium" ? " on" : ""), onClick: () => {
    go("premium");
    onClose();
  } }, /* @__PURE__ */ React.createElement("span", { className: "si-ico" }, /* @__PURE__ */ React.createElement(Icon, { name: "spark", size: 18 })), "Premium"), /* @__PURE__ */ React.createElement("button", { className: "sheet-item", onClick: () => {
    setTheme(theme === "dark" ? "light" : "dark");
  } }, /* @__PURE__ */ React.createElement("span", { className: "si-ico" }, /* @__PURE__ */ React.createElement(Icon, { name: theme === "dark" ? "sun" : "moon", size: 18 })), theme === "dark" ? tr("theme_light") : tr("theme_dark")), /* @__PURE__ */ React.createElement("a", { className: "sheet-item", href: "mailto:contacto@rendemais.pt" }, /* @__PURE__ */ React.createElement("span", { className: "si-ico" }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 18 })), "Ajuda"), /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "var(--border)", margin: "8px 12px" } }), outros.map(Item), ehPremium && premItems.map(Item), /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "var(--border)", margin: "8px 12px" } }), /* @__PURE__ */ React.createElement("button", { className: "sheet-item", style: { color: "var(--neg)" }, onClick: () => {
    onClose();
    onLogout();
  } }, /* @__PURE__ */ React.createElement("span", { className: "si-ico" }, /* @__PURE__ */ React.createElement(Icon, { name: "logout", size: 18, color: "var(--neg)" })), tr("logout_full"))));
}
function AddSheet({ onClose, itens }) {
  return /* @__PURE__ */ React.createElement("div", { className: "sheet-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "sheet", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "sheet-grip" }), /* @__PURE__ */ React.createElement("div", { className: "add-sheet-title" }, "Adicionar"), itens.map((it) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: it.id,
      type: "button",
      className: "add-sheet-item" + (it.disabled ? " disabled" : ""),
      disabled: it.disabled,
      onClick: () => {
        if (it.disabled) return;
        it.onClick();
        onClose();
      }
    },
    /* @__PURE__ */ React.createElement("span", { className: "add-sheet-ico" }, /* @__PURE__ */ React.createElement(Icon, { name: it.icon, size: 19, color: "var(--accent)" })),
    /* @__PURE__ */ React.createElement("span", { className: "add-sheet-txt" }, /* @__PURE__ */ React.createElement("b", null, it.label, it.disabled && /* @__PURE__ */ React.createElement("span", { className: "add-sheet-soon" }, "Em breve")), /* @__PURE__ */ React.createElement("span", null, it.desc)),
    /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 15, color: "var(--ink-3)" })
  ))));
}
function Kpi({ label, value, sub, delta, deltaDir, icon, color, spark }) {
  return /* @__PURE__ */ React.createElement("div", { className: "card card-pad kpi" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-top" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-ico", style: { background: `color-mix(in srgb, ${color} 15%, transparent)` } }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 19, color, sw: 1.9 })), spark && /* @__PURE__ */ React.createElement(Sparkline, { data: spark, color }), !spark && delta != null && /* @__PURE__ */ React.createElement("span", { className: "delta " + (deltaDir === "down" ? "down" : "up") }, /* @__PURE__ */ React.createElement(Icon, { name: deltaDir === "down" ? "arrowDown" : "arrowUp", size: 13 }), " ", delta)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "kpi-label" }, label), /* @__PURE__ */ React.createElement("div", { className: "kpi-val tnum valor-sensivel", style: { marginTop: 6 } }, value), sub && /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { marginTop: 7, fontWeight: 600 } }, sub)));
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
  return /* @__PURE__ */ React.createElement("div", { className: "card empty-card", style: { display: "grid", placeItems: "center", padding: "56px 24px", textAlign: "center", width: "100%", boxSizing: "border-box" } }, /* @__PURE__ */ React.createElement("div", { className: "li-ico", style: { width: 60, height: 60, marginBottom: 18, background: "var(--accent-soft)" } }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 26, color: "var(--accent)", sw: 1.8 })), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 18, letterSpacing: "-.01em" } }, title), /* @__PURE__ */ React.createElement("div", { className: "muted", style: { marginTop: 7, fontSize: 14, fontWeight: 500, maxWidth: 380, lineHeight: 1.55 } }, msg), action && /* @__PURE__ */ React.createElement("div", { className: "empty-action", style: { marginTop: 20, width: "100%" } }, action));
}
function Field({ label, children, hint, err, ok, icon }) {
  const errMsg = typeof err === "string" ? err : null;
  return /* @__PURE__ */ React.createElement("div", { className: "field" + (err ? " err" : ok ? " ok" : "") }, label && /* @__PURE__ */ React.createElement("label", null, label), icon ? /* @__PURE__ */ React.createElement("div", { className: "field-ico-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "field-ico" }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 15 })), children) : children, errMsg ? /* @__PURE__ */ React.createElement("span", { className: "field-hint", style: { color: "var(--neg)" } }, errMsg) : hint ? /* @__PURE__ */ React.createElement("span", { className: "field-hint" }, hint) : null);
}
function Modal({ title, sub, icon, iconNeg, onClose, children, footer, wide, aside, "aria-label": ariaLabel }) {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return /* @__PURE__ */ React.createElement("div", { className: "modal-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal" + (wide ? " modal-wide" : ""), role: "dialog", "aria-modal": "true", "aria-label": ariaLabel || title, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, icon && /* @__PURE__ */ React.createElement("span", { className: "modal-head-ico" + (iconNeg ? " neg" : "") }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 20 })), /* @__PURE__ */ React.createElement("div", { className: "modal-head-txt" }, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, title), sub && /* @__PURE__ */ React.createElement("div", { className: "modal-sub" }, sub)), /* @__PURE__ */ React.createElement("button", { type: "button", className: "icon-btn modal-close", style: { width: 32, height: 32 }, onClick: onClose, "aria-label": "Fechar" }, /* @__PURE__ */ React.createElement("span", { style: { transform: "rotate(45deg)", display: "grid" } }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 17, sw: 2, color: "var(--ink-2)" })))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" + (aside ? " modal-with-aside" : "") }, /* @__PURE__ */ React.createElement("div", null, children), aside && /* @__PURE__ */ React.createElement("div", { className: "modal-info" }, aside)), footer && /* @__PURE__ */ React.createElement("div", { className: "modal-foot" }, footer)));
}
Object.assign(window, { initials, Avatar, Brand, CatBadge, Sidebar, SidebarNavList, MobileSidebarDrawer, MobileNav, MoreSheet, AddSheet, MonthNav, Topbar, Kpi, Alert, Progress, EmptyState, Field, Modal });
