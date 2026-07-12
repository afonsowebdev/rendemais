/* ===== Shared UI components ===== */
const BM = window.BM;

function initials(name) {
  return (name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
}

function Avatar({ account, size = 34, fontSize }) {
  const foto = account?.foto;
  if (foto) return <img src={foto} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flex: "none" }} />;
  return <div className="user-av" style={{ width: size, height: size, fontSize: fontSize || size * 0.4 }}>{initials(account?.nome)}</div>;
}

function CatBadge({ catKey, size = 40, r = 12 }) {
  const c = BM.cats[catKey] || BM.cats.outros;
  return (
    <div style={{ width: size, height: size, borderRadius: r, flex: "none",
      display: "grid", placeItems: "center",
      background: `color-mix(in srgb, ${c.color} 16%, transparent)` }}>
      <Icon name={c.icon} size={size * 0.45} color={c.color} sw={1.9} />
    </div>
  );
}

function Brand({ nameColor = "var(--ink)", size = 38, sub = null, onClick }) {
  return (
    <div className="brand" style={{ padding: 0, cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div className="brand-mark" style={{ width: size, height: size }}><span className="brand-mark-txt" style={{ fontSize: size * 0.5 }}>R</span></div>
      <div>
        <div className="brand-name" style={{ color: nameColor, fontSize: size * 0.45 }}>Rende<span className="brand-plus">+</span></div>
        {sub && <div className="brand-sub" style={{ color: nameColor === "#fff" ? "rgba(255,255,255,.6)" : "var(--ink-3)" }}>{sub}</div>}
      </div>
    </div>
  );
}

function Sidebar({ route, go, account, collapsed, onToggle }) {
  const tr = useT();
  // Navegação principal única — nomes diretos em PT (ver nota em app.jsx/TITULOS).
  const nav = [
    { id: "dashboard", label: "Painel", icon: "grid" },
    { id: "transacoes", label: "Transações", icon: "transfer" },
    { id: "objetivos", label: "Objetivos", icon: "target" },
    { id: "agenda", label: "Agenda Financeira", icon: "calendarCheck" },
    { id: "partilha", label: "Partilha", icon: "users" },
    { id: "contas", label: "Contas", icon: "wallet" },
    { id: "relatorios", label: "Relatórios", icon: "report" },
    { id: "config", label: "Definições", icon: "gear" },
  ];
  const ehPremium = !!(account && account.plano === "premium");
  const Item = (n) => {
    const active = route === n.id;
    return (
      <button key={n.id} className={"nav-item" + (active ? " active" : "")} onClick={() => go(n.id)} title={n.label} aria-current={active ? "page" : undefined}>
        <Icon name={n.icon} size={19} />
        <span>{n.label}</span>
      </button>
    );
  };
  return (
    <aside className="sidebar">
      <div style={{ padding: "4px 8px 22px" }}>
        <button onClick={() => go("dashboard")} style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }} title={tr("go_dashboard")}>
          <Brand nameColor="#fff" />
        </button>
      </div>
      {nav.map(Item)}
      <div className="sidebar-foot">
        {!ehPremium && (
          <button className="sb-plan-pill" onClick={() => go("premium")} title="Desbloqueia o Rende+ Premium">
            <Icon name="spark" size={14} color="var(--accent)" /> <span>Free — Upgrade</span>
          </button>
        )}
        <button className="nav-item sb-toggle" onClick={onToggle} title={collapsed ? tr("sb_expand") : tr("sb_collapse")}>
          <span style={{ display: "grid", transform: collapsed ? "none" : "rotate(180deg)" }}><Icon name="chevR" size={18} /></span>
          <span>{collapsed ? tr("sb_expand") : tr("sb_collapse")}</span>
        </button>
      </div>
    </aside>
  );
}

function MonthNav({ label, onPrev, onNext, canNext = true, isCurrent, onToday }) {
  const tr = useT();
  return (
    <div className="row" style={{ gap: 8 }}>
      {!isCurrent && onToday && (
        <button className="btn btn-soft" style={{ padding: "7px 12px" }} onClick={onToday}>{tr("month_current")}</button>
      )}
      <div className="seg" style={{ padding: 2 }}>
        <button onClick={onPrev} style={{ padding: "6px 9px" }}><span style={{ transform: "rotate(180deg)", display: "grid" }}><Icon name="chevR" size={15} /></span></button>
        <span style={{ display: "grid", placeItems: "center", padding: "0 12px", fontSize: 13, fontWeight: 700, minWidth: 96 }}>{label}</span>
        <button onClick={canNext ? onNext : undefined} disabled={!canNext} title={canNext ? "" : tr("month_at_current")}
          style={{ padding: "6px 9px", opacity: canNext ? 1 : 0.35, cursor: canNext ? "pointer" : "not-allowed" }}><Icon name="chevR" size={15} /></button>
      </div>
    </div>
  );
}

/* Fecha um dropdown com Escape ou clique fora — reutilizado pelo menu de conta do header. */
function useDropdownClose() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return [open, setOpen, ref];
}

/* Botão de perfil do header interno — avatar + dropdown (ver perfil/definições/segurança/plano/sair). */
function ProfileMenu({ account, go, onLogout }) {
  const tr = useT();
  const [open, setOpen, ref] = useDropdownClose();
  const primeiroNome = (account?.nome || "").split(" ")[0] || tr("lbl_my_account");
  return (
    <div className="profile-menu" ref={ref}>
      <button type="button" className="profile-menu-btn" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label="Abrir menu de conta">
        <Avatar account={account} size={30} />
        <span className="profile-menu-name hide-mobile">{primeiroNome}</span>
        <i className="bx bx-chevron-down hide-mobile" aria-hidden="true"></i>
      </button>
      {open && (
        <div className="profile-menu-pop" role="menu" aria-label="Conta">
          <div className="profile-menu-head">
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{account?.nome || tr("lbl_my_account")}</div>
            {account?.email && <div className="tiny muted" style={{ fontWeight: 600, marginTop: 1 }}>{account.email}</div>}
          </div>
          <div className="profile-menu-sep" />
          <button type="button" role="menuitem" onClick={() => { setOpen(false); go("perfil"); }}><Icon name="user" size={16} /> Ver perfil</button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); go("config"); }}><Icon name="gear" size={16} /> Definições</button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); go("config"); }}><Icon name="shield" size={16} /> Segurança</button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); go("premium"); }}><Icon name="spark" size={16} /> Plano atual</button>
          <div className="profile-menu-sep" />
          <button type="button" role="menuitem" className="profile-menu-danger" onClick={() => { setOpen(false); onLogout(); }}><Icon name="logout" size={16} /> {tr("logout_full")}</button>
        </div>
      )}
    </div>
  );
}

function Topbar({ title, sub, theme, setTheme, onLogout, onAdd, addLabel, monthNav, ocultar, onToggleOcultar, go }) {
  const tr = useT();
  const fin = useFinance();
  const notificacoesOn = !fin.account || fin.account.notificacoes !== false;
  const themeLabel = theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro";
  return (
    <div className="topbar">
      <div className="row" style={{ gap: 11, minWidth: 0 }}>
        <div className="mobile-brand brand-mark" style={{ width: 34, height: 34, borderRadius: 10 }}><span className="brand-mark-txt" style={{ fontSize: 17 }}>R</span></div>
        <div style={{ minWidth: 0 }}>
          <h1 className="page-title">{title}</h1>
          {sub && <p className="page-sub">{sub}</p>}
        </div>
      </div>
      <div className="topbar-actions">
        {monthNav}
        {onAdd && (
          <button className="btn btn-primary" onClick={onAdd}>
            <Icon name="plus" size={16} color="#fff" /> <span className="hide-mobile">{addLabel || tr("add_generic")}</span>
          </button>
        )}
        {onToggleOcultar && (
          <button className="icon-btn" onClick={onToggleOcultar} title={ocultar ? "Mostrar valores" : "Ocultar valores"} aria-pressed={ocultar}>
            <Icon name={ocultar ? "eyeOff" : "eye"} size={18} />
          </button>
        )}
        {notificacoesOn && <NotifBell />}
        <button className="icon-btn hide-mobile" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title={themeLabel} aria-label={themeLabel}>
          <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
        </button>
        <ProfileMenu account={fin.account} go={go} onLogout={onLogout} />
      </div>
    </div>
  );
}

function MobileNav({ route, go, onAdd, onMore }) {
  const tr = useT();
  const Tab = (t) => (
    <button key={t.id} className={"mtab" + (route === t.id ? " on" : "")} onClick={() => go(t.id)}>
      <Icon name={t.icon} size={23} sw={route === t.id ? 2.1 : 1.8} />
      <span>{t.label}</span>
    </button>
  );
  const moreRoutes = ["agenda", "contas", "relatorios", "perfil", "config", "partilha", "previsao", "premium"];
  return (
    <nav className="mobilenav">
      {Tab({ id: "dashboard", label: tr("lbl_home"), icon: "grid" })}
      {Tab({ id: "transacoes", label: "Transações", icon: "transfer" })}
      <button className="mtab-fab" onClick={onAdd} aria-label="Adicionar"><Icon name="plus" size={27} color="#fff" sw={2.4} /></button>
      {Tab({ id: "objetivos", label: "Objetivos", icon: "target" })}
      <button className={"mtab" + (moreRoutes.includes(route) ? " on" : "")} onClick={onMore}>
        <Icon name="dots" size={23} sw={2.4} /><span>{tr("lbl_more")}</span>
      </button>
    </nav>
  );
}

function MoreSheet({ route, go, onClose, theme, setTheme, onLogout, account }) {
  const tr = useT();
  const ehPremium = !!(account && account.plano === "premium");
  const items = [
    { id: "relatorios", label: tr("lbl_reports"), icon: "report" },
    { id: "contas", label: tr("lbl_accounts"), icon: "wallet" },
    { id: "perfil", label: tr("lbl_profile"), icon: "user" },
    { id: "config", label: tr("lbl_settings"), icon: "gear" },
  ];
  const premItems = [
    { id: "agenda", label: "Agenda Financeira", icon: "calendarCheck" },
    { id: "partilha", label: "Partilha", icon: "users" },
    { id: "previsao", label: "Previsão", icon: "chart" },
  ];
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        {items.map((it) => (
          <button key={it.id} className={"sheet-item" + (route === it.id ? " on" : "")} onClick={() => { go(it.id); onClose(); }}>
            <span className="si-ico"><Icon name={it.icon} size={18} /></span>{it.label}
          </button>
        ))}
        <div style={{ height: 1, background: "var(--border)", margin: "8px 12px" }} />
        {ehPremium ? (
          premItems.map((it) => (
            <button key={it.id} className={"sheet-item" + (route === it.id ? " on" : "")} onClick={() => { go(it.id); onClose(); }}>
              <span className="si-ico"><Icon name={it.icon} size={18} color="var(--accent)" /></span>{it.label}
            </button>
          ))
        ) : (
          <button className={"sheet-item" + (route === "premium" ? " on" : "")} onClick={() => { go("premium"); onClose(); }}>
            <span className="si-ico"><Icon name="spark" size={18} color="var(--accent)" /></span>Rende+ Premium
          </button>
        )}
        <div style={{ height: 1, background: "var(--border)", margin: "8px 12px" }} />
        <button className="sheet-item" onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); }}>
          <span className="si-ico"><Icon name={theme === "dark" ? "sun" : "moon"} size={18} /></span>{theme === "dark" ? tr("theme_light") : tr("theme_dark")}
        </button>
        <button className="sheet-item" style={{ color: "var(--neg)" }} onClick={() => { onClose(); onLogout(); }}>
          <span className="si-ico"><Icon name="logout" size={18} color="var(--neg)" /></span>{tr("logout_full")}
        </button>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, delta, deltaDir, icon, color, spark }) {
  return (
    <div className="card card-pad kpi">
      <div className="kpi-top">
        <div className="kpi-ico" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
          <Icon name={icon} size={19} color={color} sw={1.9} />
        </div>
        {spark && <Sparkline data={spark} color={color} />}
        {!spark && delta != null && (
          <span className={"delta " + (deltaDir === "down" ? "down" : "up")}>
            <Icon name={deltaDir === "down" ? "arrowDown" : "arrowUp"} size={13} /> {delta}
          </span>
        )}
      </div>
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-val tnum valor-sensivel" style={{ marginTop: 6 }}>{value}</div>
        {sub && <div className="tiny muted" style={{ marginTop: 7, fontWeight: 600 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Alert({ kind, icon, title, children }) {
  return (
    <div className={"alert " + kind}>
      <span className="alert-ico"><Icon name={icon} size={18}
        color={kind === "warn" ? "var(--warn)" : kind === "bad" ? "var(--neg)" : "var(--accent)"} /></span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.35 }}>{title}</div>
        {children && <div className="tiny muted" style={{ marginTop: 3, fontWeight: 600, lineHeight: 1.5 }}>{children}</div>}
      </div>
    </div>
  );
}

function Progress({ value, max, color }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return <div className="bar"><i style={{ width: pct + "%", background: color || "var(--accent)" }} /></div>;
}

function EmptyState({ icon, title, msg, action }) {
  return (
    <div className="card empty-card" style={{ display: "grid", placeItems: "center", padding: "56px 24px", textAlign: "center", width: "100%", boxSizing: "border-box" }}>
      <div className="li-ico" style={{ width: 60, height: 60, marginBottom: 18, background: "var(--accent-soft)" }}>
        <Icon name={icon} size={26} color="var(--accent)" sw={1.8} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-.01em" }}>{title}</div>
      <div className="muted" style={{ marginTop: 7, fontSize: 14, fontWeight: 500, maxWidth: 380, lineHeight: 1.55 }}>{msg}</div>
      {action && <div className="empty-action" style={{ marginTop: 20, width: "100%" }}>{action}</div>}
    </div>
  );
}

function Field({ label, children, hint }) {
  return <div className="field"><label>{label}</label>{children}{hint && <span className="tiny muted" style={{ fontWeight: 600 }}>{hint}</span>}</div>;
}

function Modal({ title, sub, onClose, children, footer, wide }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={wide ? { maxWidth: 560 } : null} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
            {sub && <div className="tiny muted" style={{ fontWeight: 600, marginTop: 2 }}>{sub}</div>}
          </div>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onClose}><span style={{ transform: "rotate(45deg)", display: "grid" }}><Icon name="plus" size={17} sw={2} color="var(--ink-2)" /></span></button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", flex: "1 1 auto", minHeight: 0 }}>{children}</div>
        {footer && <div style={{ padding: "14px 20px 20px", display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0, borderTop: "1px solid var(--border)" }}>{footer}</div>}
      </div>
    </div>
  );
}

Object.assign(window, { initials, Avatar, Brand, CatBadge, Sidebar, MobileNav, MoreSheet, MonthNav, Topbar, Kpi, Alert, Progress, EmptyState, Field, Modal });