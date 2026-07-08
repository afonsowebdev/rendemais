/* ===== Landing page (antes de criar conta / entrar) ===== */
function Landing({ onCreate, onLogin, theme, setTheme, lang, setLang, tr }) {
  // Scroll suave até à secção, sem deixar o "#" colado no endereço.
  const goSection = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", window.location.pathname + window.location.search);
  };
  const goTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    history.replaceState(null, "", window.location.pathname + window.location.search);
  };

  // Ativa a sombra por baixo do cabeçalho assim que se faz scroll.
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Menu suspenso do cabeçalho mobile (aberto pelo botão junto ao logótipo).
  const [menuOpen, setMenuOpen] = React.useState(false);
  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const cycleLang = () => {
    const order = I18N.SUP;
    setLang(order[(order.indexOf(lang) + 1) % order.length]);
  };

  /* Badges oficiais das lojas — atualizar os href quando a app for publicada */
  const StoreBadges = ({ compact }) => (
    <div className={"lp2-stores lp2-stores-badges" + (compact ? " compact" : "")}>
      <a className="lp2-store-badge" href="https://apps.apple.com/app/rende" target="_blank" rel="noopener noreferrer" aria-label="Descarregar na App Store" onClick={(e) => e.preventDefault()} title="Brevemente disponível">
        <img src="assets/img/badges/apple-appstore-pt-preto.svg" alt="Descarregar na App Store" />
      </a>
      <a className="lp2-store-badge" href="https://play.google.com/store/apps/details?id=pt.rendemais.app" target="_blank" rel="noopener noreferrer" aria-label="Disponível no Google Play" onClick={(e) => e.preventDefault()} title="Brevemente disponível">
        <img src="assets/img/badges/google-play-pt.png" alt="Disponível no Google Play" />
      </a>
    </div>
  );

  /* Avatar de pessoa: usa a imagem real se existir; se não existir (ainda não foi carregada), mostra a inicial */
  const PersonAvatar = ({ src, fallback, zIndex, solo }) => {
    const [failed, setFailed] = React.useState(false);
    const cls = "lp2-avatar" + (solo ? " solo" : "");
    if (!src || failed) {
      return <span className={cls} style={zIndex ? { zIndex } : undefined}>{fallback}</span>;
    }
    return <img className={cls + " lp2-avatar-img"} style={zIndex ? { zIndex } : undefined} src={src} alt="" onError={() => setFailed(true)} />;
  };

  /* Redes sociais do Rende+ — cole aqui os links quando os tiver */
  const SOCIAL_LINKS = {
    facebook: "",
    instagram: "",
    linkedin: "",
    x: "",
    tiktok: "",
  };

  const SocialIcons = () => (
    <div className="lp2-footer-social" aria-label="Redes sociais do Rende+">
      <a className="lp2-social-link" href={SOCIAL_LINKS.facebook || "#"} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="bx bxl-facebook" aria-hidden="true"></i></a>
      <a className="lp2-social-link" href={SOCIAL_LINKS.instagram || "#"} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i className="bx bxl-instagram" aria-hidden="true"></i></a>
      <a className="lp2-social-link" href={SOCIAL_LINKS.linkedin || "#"} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i className="bx bxl-linkedin-square" aria-hidden="true"></i></a>
      <a className="lp2-social-link" href={SOCIAL_LINKS.x || "#"} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)"><i className="bx bxl-twitter" aria-hidden="true"></i></a>
      <a className="lp2-social-link" href={SOCIAL_LINKS.tiktok || "#"} target="_blank" rel="noopener noreferrer" aria-label="TikTok"><i className="bx bxl-tiktok" aria-hidden="true"></i></a>
    </div>
  );

  /* Pessoas da prova social — troque "img" pelo caminho real assim que carregar as fotos */
  const SOCIAL_PROOF_PEOPLE = [
    { initial: "F", img: "assets/img/social-proof/pessoa-1.jpg" },
    { initial: "M", img: "assets/img/social-proof/pessoa-2.jpg" },
    { initial: "J", img: "assets/img/social-proof/pessoa-3.jpg" },
    { initial: "B", img: "assets/img/social-proof/pessoa-4.jpg" },
  ];

  const NAV = [["funcionalidades", "Funcionalidades"], ["vantagens", "Vantagens"], ["como-funciona", "Como funciona"], ["precos", "Preços"], ["depoimentos", "Depoimentos"], ["faq", "FAQ"]];

  const FEATS = [
    ["sync", "Transações inteligentes", "Registe receitas e despesas em segundos e categorize automaticamente."],
    ["target", "Objetivos financeiros", "Crie metas, acompanhe o progresso e realize os seus sonhos."],
    ["cal", "Agenda financeira", "Nunca mais esqueça pagamentos com lembretes e recorrências."],
    ["users", "Partilha de despesas", "Organize gastos em grupo de forma transparente e sem complicações."],
    ["chart", "Relatórios completos", "Visualize gráficos e insights para tomar melhores decisões."],
    ["bank", "Multi-contas", "Gerencie todas as suas contas num único ecrã de forma segura."],
  ];

  const PASSOS = [
    ["user", "1. Crie a sua conta", "Registe-se gratuitamente e configure o seu perfil em menos de 1 minuto."],
    ["wallet", "2. Adicione as suas finanças", "Registe as suas receitas, despesas e contas de forma rápida e fácil."],
    ["chart", "3. Alcance os seus objetivos", "Acompanhe o progresso, receba insights e conquiste a sua liberdade financeira."],
  ];

  const VANTAGENS = [
    "Gratuito para começar — sem cartão de crédito",
    "Os seus dados protegidos e privados",
    "Suporte a " + Object.keys(BM.currencies).length + " moedas — ideal para emigrantes",
    "Funciona no telemóvel, tablet e computador",
    "Bloqueio por PIN e confirmação de ações sensíveis",
    "Interface em português de Portugal",
  ];

  const DEPOIMENTOS = [
    ["M", "Mariana S.", "Lisboa", "Finalmente percebo para onde vai o meu dinheiro. Em dois meses consegui poupar para o fundo de emergência.", "assets/img/depoimentos/mariana.jpg"],
    ["J", "João P.", "Emigrante em França", "Uso em euros e envio dinheiro para casa — o suporte multi-moeda faz toda a diferença para quem vive fora.", "assets/img/depoimentos/joao.jpg"],
    ["B", "Beatriz R.", "Porto", "A partilha de despesas acabou com as confusões da casa. Cada um sabe exatamente quanto deve.", "assets/img/depoimentos/beatriz.jpg"],
  ];

  const FAQS = [
    ["O Rende+ é mesmo gratuito?", "Sim. A versão base é gratuita para sempre: transações, objetivos, orçamento, relatórios e multi-moeda. O plano Premium acrescenta funcionalidades avançadas, mas nunca precisa dele para gerir o essencial."],
    ["Os meus dados estão seguros?", "Sim. Os seus dados são seus: a conta é protegida por palavra-passe, pode ativar o bloqueio por PIN, e as ações sensíveis (como eliminar dados) exigem confirmação com as suas credenciais."],
    ["Funciona fora de Portugal?", "Sim. O Rende+ suporta " + Object.keys(BM.currencies).length + " moedas (EUR, CHF, GBP, USD, CAD e AOA) com foco na Europa, e foi desenhado a pensar em quem vive, trabalha ou envia dinheiro entre países."],
    ["Posso usar no telemóvel?", "Sim. O Rende+ funciona em qualquer navegador, pode ser instalado como aplicação (PWA) e está a chegar à App Store e ao Google Play."],
    ["O que ganho com o Premium?", "Recorrentes e subscrições com pagamentos inteligentes, partilha de despesas em grupo, notificações automáticas, bloqueio por inatividade e relatórios avançados."],
  ];

  return (
    <div className="lp">
      <header className={"lp-header" + (scrolled ? " scrolled" : "")}>
        <div className="lp-header-brand">
          <a href="#" onClick={goTop} style={{ textDecoration: "none", cursor: "pointer" }} aria-label="Ir para o topo"><Brand /></a>
        </div>
        <nav className="lp-nav">
          {NAV.map(([id, label]) => <a key={id} href={"#" + id} onClick={(e) => goSection(e, id)}>{label}</a>)}
        </nav>
        <div className="lp-header-actions">
          <button type="button" className="icon-btn lp-theme-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Mudar tema" aria-label="Mudar tema">
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>
          <button type="button" className="icon-btn lp-lang-btn" onClick={cycleLang} title="Mudar idioma" aria-label="Mudar idioma">
            <Icon name="globe" size={17} /><span>{I18N.LABELS[lang]}</span>
          </button>
          <button className="btn btn-ghost lp-header-login lp-desktop-only" onClick={onLogin}>Entrar</button>
          <button className="btn btn-primary lp-header-cta lp-desktop-only" onClick={onCreate}>Criar conta</button>
          <button type="button" className="lp-menu-btn" onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen}>
            <Icon name={menuOpen ? "close" : "menu"} size={19} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="lp-menu-bg" onClick={() => setMenuOpen(false)}>
          <div className="lp-menu" onClick={(e) => e.stopPropagation()}>
            <nav className="lp-menu-nav">
              {NAV.map(([id, label]) => (
                <a key={id} href={"#" + id} onClick={(e) => { goSection(e, id); setMenuOpen(false); }}>{label}</a>
              ))}
            </nav>
            <div className="lp-menu-sep" />
            <div className="lp-menu-auth">
              <button className="btn btn-ghost" onClick={() => { setMenuOpen(false); onLogin(); }}>Entrar</button>
              <button className="btn btn-primary" onClick={() => { setMenuOpen(false); onCreate(); }}>Criar conta</button>
            </div>
            <a className="lp-menu-upgrade" href="#precos" onClick={(e) => { goSection(e, "precos"); setMenuOpen(false); }}>
              <span className="lp-menu-upgrade-ico"><Icon name="spark" size={17} color="var(--accent)" /></span>
              <span>
                <b>Conheça o Rende+ Premium</b>
                <small>Recorrentes, partilha em grupo e relatórios avançados a partir de 4,99 €/mês.</small>
              </span>
              <Icon name="chevR" size={16} color="var(--ink-3)" />
            </a>
          </div>
        </div>
      )}

      <div className="lp-main">
        {/* ============ HERO ============ */}
        <section className="lp2-hero">
          <div className="lp2-hero-txt">
            <span className="lp-eyebrow"><Icon name="spark" size={14} /> Controlo financeiro inteligente</span>
            <h1 className="lp2-h1">O seu futuro financeiro <span className="accent">começa aqui.</span></h1>
            <p className="lp-sub">O Rende+ ajuda-o a gerir o seu dinheiro de forma simples, inteligente e segura.</p>
            <div className="lp-cta">
              <button className="btn btn-primary" style={{ padding: "13px 22px", fontSize: 15 }} onClick={onCreate}>Criar conta gratuita <Icon name="chevR" size={16} color="#fff" /></button>
              <button className="btn lp2-demo" style={{ padding: "13px 22px", fontSize: 15 }} onClick={(e) => goSection(e, "como-funciona")}><i className="bx bx-play-circle" aria-hidden="true" style={{ fontSize: 19 }}></i> Ver como funciona</button>
            </div>
            <div className="lp-trust">
              <span className="lp-trust-item"><Icon name="shield" size={16} color="var(--accent)" /> 100% Seguro</span>
              <span className="lp-trust-item"><Icon name="sync" size={16} color="var(--accent)" /> Sincronização em tempo real</span>
              <span className="lp-trust-item"><Icon name="heart" size={16} color="var(--accent)" /> Suporte dedicado</span>
            </div>
          </div>
          <div className="lp2-hero-img">
            <picture>
              <source srcSet="assets/img/hero.webp" type="image/webp" />
              <img className="lp2-hero-single" src="assets/img/hero.png" alt="Rende+ no computador e no telemóvel" width="1536" height="1024" loading="eager" />
            </picture>
            <div className="lp2-hero-growth" aria-hidden="true">
              <svg className="lp2-hero-growth-svg" viewBox="0 0 120 46" width="120" height="46">
                <path className="lp2-hero-growth-line" d="M3 40 L26 28 L45 34 L67 16 L88 22 L117 4" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle className="lp2-hero-growth-dot" cx="117" cy="4" r="4" fill="var(--accent)" />
              </svg>
              <span className="lp2-hero-growth-tag"><Icon name="arrowUp" size={12} color="var(--accent)" /> Em crescimento</span>
            </div>
          </div>
        </section>

        {/* ============ PROVA SOCIAL ============ */}
        <section className="lp2-social card">
          <div className="lp2-social-item lp2-social-people">
            <div className="lp2-avatars" aria-hidden="true">
              {SOCIAL_PROOF_PEOPLE.map((p, i) => <PersonAvatar key={i} src={p.img} fallback={p.initial} zIndex={4 - i} />)}
            </div>
            <div><b>Junte-se a mais de 5.000 pessoas</b><span>que já transformaram a sua vida financeira.</span></div>
          </div>
          <div className="lp2-social-item"><i className="bx bxs-star" aria-hidden="true" style={{ color: "var(--accent)" }}></i><div><b>4,9/5</b><span>na App Store</span></div></div>
          <div className="lp2-social-item"><i className="bx bxl-play-store" aria-hidden="true" style={{ color: "var(--accent)" }}></i><div><b>4,8/5</b><span>no Google Play</span></div></div>
          <div className="lp2-social-item"><i className="bx bx-shield-quarter" aria-hidden="true" style={{ color: "var(--accent)" }}></i><div><b>Seguro</b><span>e confiável</span></div></div>
        </section>

        {/* ============ FUNCIONALIDADES ============ */}
        <section className="lp2-sec" id="funcionalidades">
          <div className="lp2-sec-grid">
            <div className="lp2-sec-side">
              <span className="lp2-tag">Funcionalidades</span>
              <h2 className="lp2-h2">Tudo o que precisa para gerir o seu dinheiro <span className="accent">num só lugar.</span></h2>
              <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={onCreate}>Explorar todas as funcionalidades <Icon name="chevR" size={15} color="#fff" /></button>
            </div>
            <div className="lp2-feat-grid">
              {FEATS.map(([ic, t, d]) => (
                <div className="lp2-feat" key={t}>
                  <div className="lp2-feat-ico"><Icon name={ic} size={21} color="var(--accent)" sw={1.9} /></div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ VANTAGENS ============ */}
        <section className="lp2-sec" id="vantagens">
          <div className="lp2-vant lp2-vant-solo">
            <div>
              <span className="lp2-tag">Vantagens</span>
              <h2 className="lp2-h2">Feito para a sua vida real — <span className="accent">onde quer que esteja.</span></h2>
              <ul className="lp2-checks">
                {VANTAGENS.map((v) => <li key={v}><Icon name="check" size={17} color="var(--accent)" sw={2.4} /> {v}</li>)}
              </ul>
              <StoreBadges compact />
            </div>
          </div>
        </section>

        {/* ============ COMO FUNCIONA ============ */}
        <section className="lp2-sec" id="como-funciona">
          <div className="lp2-sec-head">
            <span className="lp2-tag">Como funciona</span>
            <h2 className="lp2-h2">Comece em <span className="accent">3 passos simples</span></h2>
          </div>
          <div className="lp2-steps">
            {PASSOS.map(([ic, t, d], i) => (
              <React.Fragment key={t}>
                <div className="lp2-step">
                  <div className="lp2-step-ico"><Icon name={ic} size={24} color="var(--accent)" sw={1.9} /></div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
                {i < PASSOS.length - 1 && <div className="lp2-step-line" aria-hidden="true" />}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ============ PREÇOS ============ */}
        <section className="lp2-sec" id="precos">
          <div className="lp2-sec-head">
            <span className="lp2-tag">Preços</span>
            <h2 className="lp2-h2">Comece <span className="accent">grátis.</span> Evolua quando quiser.</h2>
          </div>
          <div className="lp2-precos">
            <div className="lp2-plano card">
              <div className="lp2-plano-nome">Rende+ Free</div>
              <div className="lp2-plano-preco">0 € <small>/ para sempre</small></div>
              <ul className="lp2-checks sm">
                <li><Icon name="check" size={16} color="var(--accent)" sw={2.4} /> Transações ilimitadas</li>
                <li><Icon name="check" size={16} color="var(--accent)" sw={2.4} /> Objetivos financeiros</li>
                <li><Icon name="check" size={16} color="var(--accent)" sw={2.4} /> Orçamento mensal e relatórios</li>
                <li><Icon name="check" size={16} color="var(--accent)" sw={2.4} /> Multi-moeda ({Object.keys(BM.currencies).length} moedas)</li>
                <li><Icon name="check" size={16} color="var(--accent)" sw={2.4} /> Contas ligadas</li>
              </ul>
              <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: "auto" }} onClick={onCreate}>Criar conta gratuita</button>
            </div>
            <div className="lp2-plano card destaque">
              <span className="lp2-plano-badge">Recomendado</span>
              <div className="lp2-plano-nome">Rende+ Premium</div>
              <div className="lp2-plano-preco">4,99 € <small>/ mês</small></div>
              <ul className="lp2-checks sm">
                <li><Icon name="check" size={16} color="var(--accent)" sw={2.4} /> Tudo do Free, e ainda:</li>
                <li><Icon name="check" size={16} color="var(--accent)" sw={2.4} /> Recorrentes e subscrições inteligentes</li>
                <li><Icon name="check" size={16} color="var(--accent)" sw={2.4} /> Partilha de despesas em grupo</li>
                <li><Icon name="check" size={16} color="var(--accent)" sw={2.4} /> Notificações automáticas</li>
                <li><Icon name="check" size={16} color="var(--accent)" sw={2.4} /> Bloqueio por PIN e inatividade</li>
              </ul>
              <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "auto" }} onClick={onCreate}>Experimentar o Premium</button>
            </div>
          </div>
        </section>

        {/* ============ DEPOIMENTOS ============ */}
        <section className="lp2-sec" id="depoimentos">
          <div className="lp2-sec-head">
            <span className="lp2-tag">Depoimentos</span>
            <h2 className="lp2-h2">Quem usa, <span className="accent">recomenda.</span></h2>
          </div>
          <div className="lp2-depo-grid">
            {DEPOIMENTOS.map(([ini, nome, local, txt, img]) => (
              <figure className="lp2-depo card" key={nome}>
                <div className="lp2-depo-stars" aria-label="5 estrelas">{[0, 1, 2, 3, 4].map((i) => <i key={i} className="bx bxs-star" aria-hidden="true"></i>)}</div>
                <blockquote>“{txt}”</blockquote>
                <figcaption><PersonAvatar src={img} fallback={ini} solo /><div><b>{nome}</b><span>{local}</span></div></figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section className="lp2-sec" id="faq">
          <div className="lp2-sec-head">
            <span className="lp2-tag">FAQ</span>
            <h2 className="lp2-h2">Perguntas <span className="accent">frequentes</span></h2>
          </div>
          <div className="lp2-faq">
            {FAQS.map(([q, a]) => (
              <details className="lp2-faq-item card" key={q}>
                <summary>{q}<i className="bx bx-chevron-down" aria-hidden="true"></i></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ============ CTA FINAL ============ */}
        <section className="lp2-final card">
          <div className="lp2-final-txt">
            <h2 className="lp2-h2">Pronto para transformar a sua <span className="accent">vida financeira?</span></h2>
            <p className="lp-sub" style={{ margin: "10px 0 18px" }}>Comece gratuitamente e descubra como é fácil ter controlo do seu dinheiro.</p>
            <div className="lp-cta">
              <button className="btn btn-primary" style={{ padding: "13px 22px", fontSize: 15 }} onClick={onCreate}>Criar conta gratuita <Icon name="chevR" size={16} color="#fff" /></button>
              <button className="btn btn-ghost" style={{ padding: "13px 22px", fontSize: 15 }} onClick={(e) => goSection(e, "precos")}>Ver planos <Icon name="chevR" size={15} /></button>
            </div>
            <StoreBadges />
          </div>
          <div className="lp2-final-logo" aria-hidden="true"><span>R+</span></div>
        </section>
      </div>

      <footer className="lp-footer">
        <div className="lp-footer-in lp2-footer">
          <div className="lp2-footer-brand">
            <a href="#" onClick={goTop} style={{ textDecoration: "none", cursor: "pointer" }} aria-label="Ir para o topo"><Brand size={30} /></a>
            <p className="muted tiny" style={{ fontWeight: 600, maxWidth: 260, lineHeight: 1.5 }}>Gestão de finanças pessoais, simples e em português. Poupe mais, gaste melhor.</p>
          </div>
          <div className="lp2-footer-col">
            <b>Produto</b>
            {NAV.slice(0, 4).map(([id, label]) => <a key={id} href={"#" + id} onClick={(e) => goSection(e, id)}>{label}</a>)}
          </div>
          <div className="lp2-footer-col">
            <b>Suporte</b>
            <a href="#faq" onClick={(e) => goSection(e, "faq")}>FAQ</a>
            <a href="#depoimentos" onClick={(e) => goSection(e, "depoimentos")}>Depoimentos</a>
            <a href="mailto:contacto@rendemais.pt">contacto@rendemais.pt</a>
          </div>
          <div className="lp2-footer-col">
            <b>Obter a app</b>
            <StoreBadges compact />
          </div>
        </div>

        <SocialIcons />

        <div className="lp2-footer-base lp2-footer-base-center">
          <a href="#" onClick={goTop} style={{ textDecoration: "none", cursor: "pointer" }} aria-label="Ir para o topo"><Brand size={26} /></a>
          <span className="muted tiny" style={{ fontWeight: 600 }}>© {new Date().getFullYear()} Rende+  Todos os direitos reservados.
          </span>
        </div>
      </footer>
    </div>
  );
}

window.Landing = Landing;