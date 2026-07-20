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
      <img className="brand-mark" src="assets/img/files/v2-symbol.svg" alt="" width={size} height={size} style={{ width: size, height: size }} />
      <div>
        <div className="brand-name" style={{ color: nameColor, fontSize: size * 0.45 }}>Rende<span className="brand-plus">+</span></div>
        {sub && <div className="brand-sub" style={{ color: nameColor === "#fff" ? "rgba(255,255,255,.6)" : "var(--ink-3)" }}>{sub}</div>}
      </div>
    </div>
  );
}

// Navegação principal, agrupada em secções — nomes diretos em PT (ver nota em
// app.jsx/TITULOS). Os grupos servem só para dar respiro visual; não mudam rotas.
const NAV_GROUPS = [
  {
    label: "Geral",
    items: [
      { id: "dashboard", label: "Painel", icon: "grid" },
      { id: "assistente", label: "Assistente Rende+", icon: "bot" },
      { id: "transacoes", label: "Transações", icon: "transfer" },
      { id: "objetivos", label: "Objetivos", icon: "target" },
      { id: "agenda", label: "Agenda Financeira", icon: "calendarCheck" },
    ],
  },
  {
    label: "Outros",
    items: [
      { id: "partilha", label: "Partilha", icon: "users" },
      { id: "relatorios", label: "Relatórios", icon: "report" },
      { id: "config", label: "Definições", icon: "gear" },
    ],
  },
];

/* Lista de navegação partilhada pela sidebar fixa (desktop) e pelo menu hambúrguer em
   offcanvas (mobile) — um único sítio para os itens do menu, para nunca desalinharem.
   `onNavigate`, quando passado, corre a seguir ao `go` (usado para fechar o offcanvas). */
function SidebarNavList({ route, go, onNavigate }) {
  const Item = (n) => {
    const active = route === n.id;
    return (
      <button key={n.id} className={"nav-item" + (active ? " active" : "")}
        onClick={() => { go(n.id); onNavigate && onNavigate(); }} title={n.label} aria-current={active ? "page" : undefined}>
        <Icon name={n.icon} size={19} />
        <span>{n.label}</span>
      </button>
    );
  };
  return (
    <>
      {NAV_GROUPS.map((g) => (
        <React.Fragment key={g.label}>
          <div className="nav-label">{g.label}</div>
          {g.items.map(Item)}
        </React.Fragment>
      ))}
    </>
  );
}

function Sidebar({ route, go, account, collapsed, onToggle }) {
  const tr = useT();
  const ehPremium = !!(account && account.plano === "premium");
  return (
    <aside className="sidebar">
      <div style={{ padding: "4px 8px 22px" }}>
        <button onClick={() => go("dashboard")} style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }} title={tr("go_dashboard")}>
          <Brand />
        </button>
      </div>
      <SidebarNavList route={route} go={go} />
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

/* Menu hambúrguer em mobile: offcanvas que desliza da esquerda, com fundo semi-transparente.
   Fecha ao clicar num item (via onNavigate), ao clicar fora (backdrop) ou com Escape — nunca
   fica um estado "aberto" preso. Reaproveita 100% do visual/itens da sidebar (SidebarNavList). */
function MobileSidebarDrawer({ open, onClose, route, go, account }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  const ehPremium = !!(account && account.plano === "premium");
  return (
    <>
      <div className={"mobile-drawer-backdrop" + (open ? " open" : "")} onClick={onClose} aria-hidden={!open} />
      <aside className={"sidebar mobile-drawer" + (open ? " open" : "")} role="dialog" aria-modal="true" aria-label="Menu de navegação" aria-hidden={!open}>
        <div className="mobile-drawer-head">
          <Brand />
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar menu">
            <Icon name="close" size={18} />
          </button>
        </div>
        <SidebarNavList route={route} go={go} onNavigate={onClose} />
        {!ehPremium && (
          <div className="sidebar-foot">
            <button className="sb-plan-pill" onClick={() => { go("premium"); onClose(); }} title="Desbloqueia o Rende+ Premium">
              <Icon name="spark" size={14} color="var(--accent)" /> <span>Free — Upgrade</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

/* Navegação de mês em formato "carrossel": nada de input/caixa — só o mês, uma
   dica de gesto e um indicador de página decorativo, ladeados por duas setas
   circulares soltas (não fazem parte de nenhum campo). A troca de mês continua a
   passar sempre por onPrev/onNext (mesma lógica de shiftMonth já existente) — isto
   é só a apresentação nova; arrastar/swipe já funcionam via pointer events, prontos
   para gestos em ecrãs táteis e trackpad. */
function MonthNav({ label, onPrev, onNext, canNext = true }) {
  const tr = useT();
  const [dir, setDir] = React.useState(null);
  const dragRef = React.useRef({ x: 0, active: false });
  const SWIPE_THRESHOLD = 40;

  const step = (delta, fn) => { setDir(delta < 0 ? "prev" : "next"); fn(); };

  const onPointerDown = (e) => {
    dragRef.current = { x: e.clientX, active: true };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const endDrag = (e) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const dx = e.clientX - dragRef.current.x;
    if (dx > SWIPE_THRESHOLD) step(-1, onPrev);
    else if (dx < -SWIPE_THRESHOLD && canNext) step(1, onNext);
  };

  return (
    <div className="month-carousel">
      <button type="button" className="month-carousel-arrow" onClick={() => step(-1, onPrev)} aria-label="Mês anterior">
        <span style={{ transform: "rotate(180deg)", display: "grid" }}><Icon name="chevR" size={16} /></span>
      </button>
      <div className="month-carousel-track" onPointerDown={onPointerDown} onPointerUp={endDrag} onPointerCancel={endDrag} style={{ touchAction: "pan-y" }}>
        <div key={label} className={"month-carousel-content" + (dir ? " dir-" + dir : "")}>
          <div className="month-carousel-label">{label}</div>
          <div className="month-carousel-hint">Deslize para os lados para mudar de mês</div>
          <div className="month-carousel-dots" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => <span key={i} className={"month-carousel-dot" + (i === 2 ? " on" : "")} />)}
          </div>
        </div>
      </div>
      <button type="button" className="month-carousel-arrow" onClick={canNext ? () => step(1, onNext) : undefined} disabled={!canNext} aria-label="Mês seguinte" title={canNext ? "" : tr("month_at_current")}>
        <Icon name="chevR" size={16} />
      </button>
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
  return (
    <div className="profile-menu" ref={ref}>
      <button type="button" className="profile-menu-btn" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label="Abrir menu do perfil" title="Perfil">
        <Avatar account={account} size={30} />
        <i className="bx bx-chevron-down profile-menu-chev" aria-hidden="true"></i>
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

/* Header interno: saudação (no Painel) ou título da página à esquerda — sempre no mesmo
   local do cabeçalho, nunca separado do conteúdo — e notificações/tema/perfil à direita.
   O seletor de mês vive à parte, na PageIntro logo abaixo, quando a rota o usa.
   Em mobile (CSS), reflui para 2 linhas: hambúrguer+logo+ações em cima, título por baixo
   — o botão hambúrguer e o logo central só existem/aparecem abaixo de 860px (ver styles.css). */
/* Header global, único para todas as páginas autenticadas — em mobile só mostra
   navegação/conta (hambúrguer, marca centrada, notificações, perfil): nunca título,
   subtítulo, saudação ou informação específica da página (isso vive em PageIntro,
   dentro do conteúdo). Em desktop o título continua aqui, como sempre. */
function Topbar({ title, sub, theme, setTheme, onLogout, go, onOpenMobileMenu }) {
  const fin = useFinance();
  const notificacoesOn = !fin.account || fin.account.notificacoes !== false;
  const themeLabel = theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro";
  return (
    <div className="topbar">
      <button type="button" className="icon-btn topbar-hamburger" onClick={onOpenMobileMenu} aria-label="Abrir menu de navegação" title="Menu">
        <Icon name="menu" size={22} />
      </button>
      <div className="mobile-brand">
        <Brand size={30} />
      </div>
      {title && (
        <div className="topbar-title" style={{ minWidth: 0 }}>
          <h1 className="page-title">{title}</h1>
          {sub && <p className="page-sub">{sub}</p>}
        </div>
      )}
      <div className="topbar-actions">
        {notificacoesOn && <NotifBell go={go} />}
        <button className="icon-btn topbar-theme-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title={themeLabel} aria-label={themeLabel}>
          <Icon name={theme === "dark" ? "sun" : "moon"} size={20} />
        </button>
        <ProfileMenu account={fin.account} go={go} onLogout={onLogout} />
      </div>
    </div>
  );
}

/* Logo abaixo do header. Em desktop, título/saudação já vivem no Topbar — aqui só
   passa o seletor de mês (quando existe), alinhado à direita, como sempre.
   Em mobile, o Topbar esconde o título (ver CSS), por isso é aqui que ele reaparece:
   título/subtítulo/saudação da página, seguidos do seletor de mês, ambos dentro do
   conteúdo — nunca dentro do cabeçalho fixo. */
function PageIntro({ title, sub, monthNav }) {
  if (!title && !monthNav) return null;
  return (
    <div className="page-intro">
      {title && (
        <div className="page-intro-title">
          <h1 className="page-title">{title}</h1>
          {sub && <p className="page-sub">{sub}</p>}
        </div>
      )}
      {monthNav && <div className="page-intro-month">{monthNav}</div>}
    </div>
  );
}

/* Barra inferior mobile: fundo desenhado em SVG com um entalhe (notch) central onde o
   botão "+" encaixa, elevado por cima da barra — o botão em si é posicionado fora do
   fluxo (absolute), a barra reserva-lhe o espaço com .mtab-fab-slot para os 4 itens
   ficarem sempre bem distribuídos dos dois lados. Rotas/ícones/lógica de navegação
   inalterados — só o desenho da barra e do botão central. */
function MobileNav({ route, go, onAdd, onMore }) {
  const tr = useT();
  const Tab = (t) => (
    <button key={t.id} className={"mtab" + (route === t.id ? " on" : "")} onClick={() => go(t.id)}>
      <Icon name={t.icon} size={22} sw={route === t.id ? 2.1 : 1.8} />
      <span>{t.label}</span>
      <i className="mtab-dot" aria-hidden="true" />
    </button>
  );
  const moreRoutes = ["agenda", "relatorios", "perfil", "config", "partilha", "previsao", "premium"];
  return (
    <nav className="mobilenav">
      <svg className="mobilenav-bg" viewBox="0 0 375 80" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 24 Q0 0 24 0 L118 0 C144 0 136 74 187.5 74 C239 74 231 0 257 0 L351 0 Q375 0 375 24 L375 80 L0 80 Z" />
      </svg>
      <div className="mobilenav-row">
        {Tab({ id: "dashboard", label: tr("lbl_home"), icon: "grid" })}
        {Tab({ id: "transacoes", label: "Transações", icon: "transfer" })}
        <span className="mtab-fab-slot" aria-hidden="true" />
        {Tab({ id: "objetivos", label: "Objetivos", icon: "target" })}
        <button className={"mtab" + (moreRoutes.includes(route) ? " on" : "")} onClick={onMore}>
          <Icon name="dots" size={22} sw={2.2} /><span>{tr("lbl_more")}</span>
          <i className="mtab-dot" aria-hidden="true" />
        </button>
      </div>
      <button type="button" className="mtab-fab" onClick={onAdd} aria-label="Adicionar">
        <Icon name="plus" size={25} color="#fff" sw={2.3} />
      </button>
    </nav>
  );
}

/* "Mais": Definições/Tema/Ajuda/Premium/Terminar sessão em destaque — mantêm-se também
   os restantes destinos reais já existentes (Relatórios e as páginas Premium),
   para nenhuma rota deixar de ser alcançável a partir do mobile. Só o visual (linhas com
   ícone circular) e a organização mudaram. */
function MoreSheet({ route, go, onClose, theme, setTheme, onLogout, account }) {
  const tr = useT();
  const ehPremium = !!(account && account.plano === "premium");
  const principais = [
    { id: "config", label: tr("lbl_settings"), icon: "gear" },
  ];
  const outros = [
    { id: "relatorios", label: tr("lbl_reports"), icon: "report" },
  ];
  const premItems = [
    { id: "assistente", label: "Assistente Rende+", icon: "bot" },
    { id: "agenda", label: "Agenda Financeira", icon: "calendarCheck" },
    { id: "partilha", label: "Partilha", icon: "users" },
    { id: "previsao", label: "Previsão", icon: "chart" },
  ];
  const Item = (it) => (
    <button key={it.id} className={"sheet-item" + (route === it.id ? " on" : "")} onClick={() => { go(it.id); onClose(); }}>
      <span className="si-ico"><Icon name={it.icon} size={18} /></span>{it.label}
    </button>
  );
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        {principais.map(Item)}
        <button className={"sheet-item" + (route === "premium" ? " on" : "")} onClick={() => { go("premium"); onClose(); }}>
          <span className="si-ico"><Icon name="spark" size={18} /></span>Premium
        </button>
        <button className="sheet-item" onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); }}>
          <span className="si-ico"><Icon name={theme === "dark" ? "sun" : "moon"} size={18} /></span>{theme === "dark" ? tr("theme_light") : tr("theme_dark")}
        </button>
        <a className="sheet-item" href="mailto:contacto@rendemais.pt">
          <span className="si-ico"><Icon name="info" size={18} /></span>Ajuda
        </a>

        <div style={{ height: 1, background: "var(--border)", margin: "8px 12px" }} />
        {outros.map(Item)}
        {ehPremium && premItems.map(Item)}

        <div style={{ height: 1, background: "var(--border)", margin: "8px 12px" }} />
        <button className="sheet-item" style={{ color: "var(--neg)" }} onClick={() => { onClose(); onLogout(); }}>
          <span className="si-ico"><Icon name="logout" size={18} color="var(--neg)" /></span>{tr("logout_full")}
        </button>
      </div>
    </div>
  );
}

/* Bottom Sheet do botão "+" central: 6 ações rápidas, cada uma com ícone + nome +
   descrição — mesmo Design System dos restantes sheets/modais. `itens` vem de fora
   (Shell, em app.jsx) já com a ação de cada opção, para este componente ficar só
   com a apresentação. */
function AddSheet({ onClose, itens }) {
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <div className="add-sheet-title">Adicionar</div>
        {itens.map((it) => (
          <button key={it.id} type="button" className={"add-sheet-item" + (it.disabled ? " disabled" : "")} disabled={it.disabled}
            onClick={() => { if (it.disabled) return; it.onClick(); onClose(); }}>
            <span className="add-sheet-ico"><Icon name={it.icon} size={19} color="var(--accent)" /></span>
            <span className="add-sheet-txt">
              <b>{it.label}{it.disabled && <span className="add-sheet-soon">Em breve</span>}</b>
              <span>{it.desc}</span>
            </span>
            <Icon name="chevR" size={15} color="var(--ink-3)" />
          </button>
        ))}
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

/* `err`/`ok` aceitam `true` (só estiliza a borda) ou uma string (mostra também uma
   mensagem). `icon` mostra um ícone dentro do campo — só usar quando fizer sentido
   (ex.: valor, pesquisa). Nada disto altera a lógica de validação já existente,
   é só a forma como o resultado (válido/inválido) é apresentado. */
function Field({ label, children, hint, err, ok, icon }) {
  const errMsg = typeof err === "string" ? err : null;
  return (
    <div className={"field" + (err ? " err" : ok ? " ok" : "")}>
      {label && <label>{label}</label>}
      {icon ? <div className="field-ico-wrap"><span className="field-ico"><Icon name={icon} size={15} /></span>{children}</div> : children}
      {errMsg ? <span className="field-hint" style={{ color: "var(--neg)" }}>{errMsg}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}

/* Cabeçalho com ícone+título+subtítulo+fechar, corpo com scroll próprio, rodapé com
   no máximo 2 ações — o mesmo molde para todos os modais da app (ver styles.css,
   secção "MODAIS — Design System Rende+"). `aside` é opcional: quando passado, o
   corpo ganha uma segunda coluna com um painel de resumo (ex.: divisão de despesa). */
function Modal({ title, sub, icon, iconNeg, onClose, children, footer, wide, aside, "aria-label": ariaLabel }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className={"modal" + (wide ? " modal-wide" : "")} role="dialog" aria-modal="true" aria-label={ariaLabel || title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          {icon && <span className={"modal-head-ico" + (iconNeg ? " neg" : "")}><Icon name={icon} size={20} /></span>}
          <div className="modal-head-txt">
            <div className="modal-title">{title}</div>
            {sub && <div className="modal-sub">{sub}</div>}
          </div>
          <button type="button" className="icon-btn modal-close" style={{ width: 32, height: 32 }} onClick={onClose} aria-label="Fechar">
            <span style={{ transform: "rotate(45deg)", display: "grid" }}><Icon name="plus" size={17} sw={2} color="var(--ink-2)" /></span>
          </button>
        </div>
        <div className={"modal-body" + (aside ? " modal-with-aside" : "")}>
          <div>{children}</div>
          {aside && <div className="modal-info">{aside}</div>}
        </div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

Object.assign(window, { initials, Avatar, Brand, CatBadge, Sidebar, SidebarNavList, MobileSidebarDrawer, MobileNav, MoreSheet, AddSheet, MonthNav, Topbar, Kpi, Alert, Progress, EmptyState, Field, Modal });