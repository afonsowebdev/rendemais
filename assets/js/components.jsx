/* ===== Shared UI components ===== */
const BM = window.BM;

function initials(name) {
  return (name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
}

function Avatar({ account, size = 34, fontSize }) {
  const foto = account?.foto;
  if (foto) return <img src={foto} alt="" draggable={false} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flex: "none" }} />;
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
      <div className="sidebar-brand">
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

/* Navegação de mês em formato "carrossel": só o mês e uma dica de gesto, ladeados
   por duas setas circulares soltas (não fazem parte de nenhum campo). A troca de
   mês passo a passo continua a usar onPrev/onNext (mesma lógica de shiftMonth já
   existente) e arrastar/swipe via pointer events. Para saltar diretamente para
   qualquer mês/ano (sem ter de clicar dezenas de vezes numa seta), clicar no
   próprio mês abre um seletor com grelha de 12 meses + navegação por ano — e,
   sempre que não se está no mês atual, aparece um atalho "Hoje" para voltar já. */
function MonthNav({ label, onPrev, onNext, canNext = true, month, realMonth, onSelect, onToday }) {
  const tr = useT();
  const [dir, setDir] = React.useState(null);
  const dragRef = React.useRef({ x: 0, active: false });
  const SWIPE_THRESHOLD = 40;
  const [pickerOpen, setPickerOpen, pickerRef] = useDropdownClose();
  const [pickerYear, setPickerYear] = React.useState(() => Number((month || realMonth || "0-0").slice(0, 4)));

  React.useEffect(() => {
    if (pickerOpen) setPickerYear(Number((month || realMonth || "0-0").slice(0, 4)));
  }, [pickerOpen]);

  const step = (delta, fn) => { setPickerOpen(false); setDir(delta < 0 ? "prev" : "next"); fn(); };

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

  const realYear = Number((realMonth || "0-0").slice(0, 4));
  const isToday = !!realMonth && month === realMonth;
  const selectMonth = (mi) => {
    const key = pickerYear + "-" + String(mi + 1).padStart(2, "0");
    if (realMonth && key > realMonth) return; // não deixa saltar para o futuro
    onSelect && onSelect(key);
    setPickerOpen(false);
  };

  return (
    <div className="month-carousel" ref={pickerRef}>
      <button type="button" className="month-carousel-arrow" onClick={() => step(-1, onPrev)} aria-label="Mês anterior">
        <span style={{ transform: "rotate(180deg)", display: "grid" }}><Icon name="chevR" size={16} /></span>
      </button>
      <div className="month-carousel-track" onPointerDown={onPointerDown} onPointerUp={endDrag} onPointerCancel={endDrag} style={{ touchAction: "pan-y" }}>
        <div key={label} className={"month-carousel-content" + (dir ? " dir-" + dir : "")}>
          <button type="button" className="month-carousel-label-btn" onPointerDown={(e) => e.stopPropagation()} onClick={() => setPickerOpen((v) => !v)} aria-haspopup="dialog" aria-expanded={pickerOpen}>
            <span className="month-carousel-label">{label}</span>
            <span style={{ transform: "rotate(90deg)", display: "grid" }}><Icon name="chevR" size={13} color="var(--ink-3)" /></span>
          </button>
          {onSelect && !isToday
            ? <button type="button" className="month-carousel-today" onPointerDown={(e) => e.stopPropagation()} onClick={() => { setPickerOpen(false); onToday && onToday(); }}>Voltar a hoje</button>
            : <div className="month-carousel-hint">Deslize para os lados para mudar de mês</div>}
        </div>
      </div>
      <button type="button" className="month-carousel-arrow" onClick={canNext ? () => step(1, onNext) : undefined} disabled={!canNext} aria-label="Mês seguinte" title={canNext ? "" : tr("month_at_current")}>
        <Icon name="chevR" size={16} />
      </button>

      {pickerOpen && (
        <div className="month-picker" role="dialog" aria-label="Escolher mês">
          <div className="month-picker-year">
            <button type="button" onClick={() => setPickerYear((y) => y - 1)} aria-label="Ano anterior">
              <span style={{ transform: "rotate(180deg)", display: "grid" }}><Icon name="chevR" size={14} /></span>
            </button>
            <span>{pickerYear}</span>
            <button type="button" onClick={() => setPickerYear((y) => y + 1)} disabled={pickerYear >= realYear} aria-label="Ano seguinte">
              <Icon name="chevR" size={14} />
            </button>
          </div>
          <div className="month-picker-grid">
            {BM.MESES.map((m, i) => {
              const key = pickerYear + "-" + String(i + 1).padStart(2, "0");
              const disabled = !!realMonth && key > realMonth;
              const selected = key === month;
              return (
                <button key={m} type="button" disabled={disabled}
                  className={"month-picker-cell" + (selected ? " on" : "")}
                  onClick={() => selectMonth(i)}>
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
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
function Topbar({ title, sub, theme, setTheme, onLogout, go, mobileMenuOpen, onOpenMobileMenu }) {
  const fin = useFinance();
  const notificacoesOn = !fin.account || fin.account.notificacoes !== false;
  const themeLabel = theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro";
  return (
    <div className="topbar">
      <button type="button" className="icon-btn topbar-brand-btn" onClick={() => go("dashboard")} aria-label="Ir para o Painel" title="Rende+">
        <Brand size={34} />
      </button>
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
        <button type="button" className="icon-btn topbar-hamburger" onClick={onOpenMobileMenu} aria-haspopup="true" aria-expanded={!!mobileMenuOpen} aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu de navegação"} title="Menu">
          <Icon name={mobileMenuOpen ? "close" : "menu"} size={22} />
        </button>
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
      <div className="mobilenav-row">
        {Tab({ id: "dashboard", label: tr("lbl_home"), icon: "home" })}
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

  // Fecho animado: espera a transição terminar antes de desmontar (onClose real),
  // para fechar sempre com a mesma suavidade da abertura — quer seja pelo fundo,
  // por Escape, ou por arrastar para baixo.
  const [closing, setClosing] = React.useState(false);
  const close = React.useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 220);
  }, [onClose]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  // Arrastar para baixo para fechar — só a partir da pega/cabeçalho (não da lista
  // de opções, para nunca disputar o toque com os cliques nos itens). Segue o
  // dedo em tempo real (sem transição); ao largar, acima do limite continua a
  // animação até sair do ecrã, abaixo volta suavemente à posição (transição liga
  // assim que `dragging` passa a false).
  const [dragY, setDragY] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const dragRef = React.useRef({ startY: 0, active: false });
  const DRAG_THRESHOLD = 90;

  // setPointerCapture garante que continuamos a receber pointermove/pointerup
  // mesmo que o dedo/rato saia da pequena zona da pega durante o arrasto — sem
  // isto, os eventos param assim que se sai do elemento onde começou o gesto.
  const onDragStart = (e) => {
    dragRef.current = { startY: e.clientY, active: true, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onDragMove = (e) => {
    if (!dragRef.current.active) return;
    const dy = e.clientY - dragRef.current.startY;
    if (dy > 0) { dragRef.current.dy = dy; setDragY(dy); }
  };
  const onDragEnd = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setDragging(false);
    // usa a ref (sempre síncrona), não o estado `dragY` — o último setDragY do
    // onDragMove pode ainda não ter sido processado neste exato momento.
    if (dragRef.current.dy > DRAG_THRESHOLD) {
      setDragY(700); // acima do limite: continua a deslizar para fora do ecrã
      setTimeout(onClose, 220);
    } else {
      setDragY(0); // abaixo do limite: volta suavemente à posição aberta
    }
  };

  const principais = [
    { id: "perfil", label: tr("lbl_profile"), icon: "user" },
    { id: "config", label: tr("lbl_settings"), icon: "gear" },
    { id: "premium", label: "Premium", icon: "spark" },
  ];
  const suporte = [
    { id: "relatorios", label: tr("lbl_reports"), icon: "report" },
  ];
  const premItems = [
    { id: "assistente", label: "Assistente Rende+", icon: "bot" },
    { id: "agenda", label: "Agenda Financeira", icon: "calendarCheck" },
    { id: "partilha", label: "Partilha", icon: "users" },
    { id: "previsao", label: "Previsão", icon: "chart" },
  ];
  const Item = (it) => (
    <button key={it.id} className={"sheet-item" + (route === it.id ? " on" : "")} onClick={() => { go(it.id); close(); }}>
      <span className="si-ico"><Icon name={it.icon} size={18} /></span>{it.label}
    </button>
  );
  const Section = ({ title, children }) => (
    <div className="card sheet-card">
      <div className="sheet-section-label">{title}</div>
      {children}
    </div>
  );

  return (
    <div className={"sheet-bg" + (closing ? " closing" : "")} onClick={close}>
      <div
        className={"sheet" + (closing ? " closing" : "")}
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: dragging ? "none" : undefined } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sheet-drag-handle"
          onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}
        >
          <div className="sheet-grip" />
          <div className="sheet-head">
            <Avatar account={account} size={40} />
            <div className="sheet-head-txt">
              <div className="sheet-head-name">{account?.nome || tr("lbl_my_account")}</div>
              {account?.email && <div className="sheet-head-email">{account.email}</div>}
            </div>
          </div>
        </div>

        <div className="sheet-body">
          <Section title="Conta">{principais.map(Item)}</Section>

          <Section title="Preferências">
            <button className="sheet-item" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <span className="si-ico"><Icon name={theme === "dark" ? "sun" : "moon"} size={18} /></span>{theme === "dark" ? tr("theme_light") : tr("theme_dark")}
            </button>
          </Section>

          <Section title="Suporte">
            {suporte.map(Item)}
            {ehPremium && premItems.map(Item)}
            <a className="sheet-item" href="mailto:contacto@rendemais.pt">
              <span className="si-ico"><Icon name="info" size={18} /></span>Ajuda
            </a>
          </Section>

          <button className="card sheet-card sheet-item sheet-logout" onClick={() => { close(); onLogout(); }}>
            <span className="si-ico"><Icon name="logout" size={18} color="var(--neg)" /></span>{tr("logout_full")}
          </button>
        </div>
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

/* Anima um número entre o valor anterior e o novo (ease-out, ~320ms) — usado
   pelo valor principal e pela percentagem dos cartões de KPI. Sem libraries:
   só requestAnimationFrame. Se o alvo não for um número válido, não anima. */
function useCountUp(target, duration = 320) {
  const [display, setDisplay] = React.useState(target);
  const fromRef = React.useRef(target);
  React.useEffect(() => {
    const from = fromRef.current;
    const to = target;
    if (typeof to !== "number" || isNaN(to) || from === to) { setDisplay(to); fromRef.current = to; return; }
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return display;
}

/* `rawValue`+`format` são opcionais: só quando presentes o valor principal
   anima (count-up); caso contrário mostra `value` tal como antes — mantém
   todos os outros usos do Kpi na app inalterados.
   `deltaPct` (número, % face ao mês anterior) mostra a seta/cor/texto logo
   abaixo do valor, sem mexer no resto do layout do cartão. */
function Kpi({ label, value, sub, icon, color, spark, deltaPct, rawValue, format }) {
  const animatedRaw = useCountUp(rawValue != null ? rawValue : null, 320);
  const displayValue = (rawValue != null && format) ? format(animatedRaw) : value;
  // A percentagem mostrada nunca passa de 100% (só limita a apresentação — o
  // sentido/cor sobem e descem continuam a refletir a variação real, por maior
  // que seja; só o número exibido fica preso a [-100, 100]).
  const deltaPctClamped = deltaPct != null ? Math.max(-100, Math.min(100, deltaPct)) : null;
  const animatedPct = useCountUp(deltaPctClamped != null ? deltaPctClamped : null, 320);

  let deltaNode = null;
  if (deltaPct != null) {
    const flat = Math.abs(deltaPct) < 0.05;
    const up = deltaPct > 0;
    const cls = flat ? "flat" : (up ? "up" : "down");
    const iconName = flat ? "minus" : (up ? "arrowUp" : "arrowDown");
    const pctTxt = Math.abs(animatedPct).toFixed(1).replace(".", ",");
    deltaNode = (
      <div className={"kpi-delta-row " + cls}>
        <Icon name={iconName} size={12} />
        <span>{flat ? "Sem alterações face ao mês anterior" : `${up ? "+" : "-"}${pctTxt}% em relação ao mês anterior`}</span>
      </div>
    );
  }

  return (
    <div className="card card-pad kpi">
      <div className="kpi-top">
        <div className="kpi-ico" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
          <Icon name={icon} size={19} color={color} sw={1.9} />
        </div>
        {spark && <Sparkline data={spark} color={color} />}
      </div>
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-val tnum valor-sensivel" style={{ marginTop: 6 }}>{displayValue}</div>
        {deltaNode}
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
  // Bloqueia o scroll da página por trás do modal — sem isto, em mobile o
  // fundo continua a fazer scroll por trás do overlay fixo, dando a
  // sensação de que o modal "trava" enquanto o conteúdo por trás se mexe.
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
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