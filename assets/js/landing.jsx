/* ===== Landing page (antes de criar conta / entrar) ===== */
function Landing({ onCreate, onLogin, theme, setTheme }) {
  const donut = [
    { nome: "Habitação", color: "var(--c-habitacao)", valor: 270 },
    { nome: "Alimentação", color: "var(--c-alimentacao)", valor: 185 },
    { nome: "Transporte", color: "var(--c-transporte)", valor: 60 },
    { nome: "Lazer", color: "var(--c-lazer)", valor: 48 },
  ];
  const feats = [
    ["wallet", "var(--c-habitacao)", "Regista despesas", "Organiza gastos fixos e variáveis por categoria e vê exatamente para onde vai o teu dinheiro, mês a mês."],
    ["target", "var(--accent)", "Poupa com objetivos", "Define uma percentagem de poupança sobre o que sobra e acompanha as tuas metas com barras de progresso."],
    ["coins", "var(--c-educacao)", "Multi-moeda", "Euro, dólar, kwanza, escudo, metical ou real — escolhes a tua moeda e toda a app passa a usá-la."],
  ];

  // Scroll suave até à secção, sem deixar o "#" colado no endereço.
  const goSection = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", window.location.pathname + window.location.search);
  };
  // Logo clicável: volta ao topo.
  const goTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    history.replaceState(null, "", window.location.pathname + window.location.search);
  };

  return (
    <div className="lp">
      <header className="lp-header">
        <a href="#" onClick={goTop} style={{ textDecoration: "none", cursor: "pointer" }} aria-label="Ir para o topo"><Brand /></a>
        <nav className="lp-nav">
          <a href="#funcionalidades" onClick={(e) => goSection(e, "funcionalidades")}>Funcionalidades</a>
          <a href="#como-funciona" onClick={(e) => goSection(e, "como-funciona")}>Como funciona</a>
          <a href="#moedas" onClick={(e) => goSection(e, "moedas")}>Moedas</a>
        </nav>
        <div className="lp-header-actions">
          <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Tema"><Icon name={theme === "dark" ? "sun" : "moon"} size={18} /></button>
          <button className="btn btn-ghost" onClick={onLogin}>Entrar</button>
          <button className="btn btn-primary" onClick={onCreate}>Criar conta</button>
        </div>
      </header>

      <div className="lp-main">
        {/* HERO */}
        <section className="lp-hero">
          <div>
            <span className="lp-eyebrow"><Icon name="spark" size={14} /> Finanças pessoais, sem complicações</span>
            <h1 className="lp-h1">Controla o teu dinheiro <span className="accent">de forma simples.</span></h1>
            <p className="lp-sub">Regista a tua receita, subtrai as despesas e define quanto queres poupar. O Rende+ mostra-te, num instante, quanto tens disponível até ao fim do mês.</p>
            <div className="lp-cta">
              <button className="btn btn-primary" style={{ padding: "13px 22px", fontSize: 15 }} onClick={onCreate}><Icon name="arrowsDown" size={16} color="#fff" /> Criar conta gratuita</button>
              <button className="btn btn-ghost" style={{ padding: "13px 22px", fontSize: 15 }} onClick={onLogin}>Entrar</button>
            </div>
            <div className="lp-trust">
              <span className="lp-trust-item"><Icon name="check" size={16} color="var(--accent)" /> Sem custos</span>
              <span className="lp-trust-item"><Icon name="check" size={16} color="var(--accent)" /> Dados no teu dispositivo</span>
              <span className="lp-trust-item"><Icon name="check" size={16} color="var(--accent)" /> 5 moedas</span>
            </div>
          </div>

          {/* preview mock */}
          <div className="lp-preview">
            <div className="lp-card">
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div className="tiny muted" style={{ fontWeight: 700 }}>Saldo disponível</div>
                  <div className="tnum" style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-.03em", marginTop: 2 }}>{BM.eur0(317)}</div>
                </div>
                <span className="delta up"><Icon name="arrowUp" size={13} /> +12%</span>
              </div>
              <div className="row" style={{ gap: 18, alignItems: "center" }}>
                <DonutChart data={donut} size={132} thickness={20} center={<div><div className="tnum" style={{ fontSize: 16, fontWeight: 800 }}>{BM.eur0(563)}</div><div className="tiny muted" style={{ fontWeight: 600 }}>gasto</div></div>} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  {donut.map((c) => (
                    <div key={c.nome} className="row" style={{ justifyContent: "space-between" }}>
                      <span className="row" style={{ gap: 7, fontSize: 12.5, fontWeight: 600 }}><span className="dot" style={{ background: c.color }} />{c.nome}</span>
                      <span className="tnum tiny" style={{ fontWeight: 700 }}>{BM.eur0(c.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lp-float" style={{ top: -18, right: 6 }}>
              <div className="row" style={{ gap: 10 }}>
                <span className="li-ico" style={{ width: 34, height: 34, background: "var(--accent-soft)" }}><Icon name="target" size={16} color="var(--accent)" sw={2} /></span>
                <div><div className="tiny muted" style={{ fontWeight: 700 }}>Poupança</div><div className="tnum" style={{ fontWeight: 800, fontSize: 15 }}>{BM.eur0(95)}</div></div>
              </div>
            </div>
            <div className="lp-float" style={{ bottom: -20, left: -10 }}>
              <div className="tiny muted" style={{ fontWeight: 700, marginBottom: 6 }}>Poupar 20% do restante</div>
              <input type="range" min="10" max="50" value="20" readOnly className="range" style={{ width: 150, pointerEvents: "none" }} />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="lp-feats" id="funcionalidades">
          <div className="lp-feats-head" id="vantagens">
            <h2>Tudo o que precisas para gerir o mês</h2>
            <p>Pensado para quem tem rendimentos limitados e quer clareza, não complicação.</p>
          </div>
          <div className="lp-feat-grid">
            {feats.map(([ic, col, t, d]) => (
              <div className="lp-feat" key={t}>
                <div className="lp-feat-ico" style={{ background: `color-mix(in srgb, ${col} 15%, transparent)` }}><Icon name={ic} size={23} color={col} sw={1.9} /></div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="lp-feats" id="como-funciona">
          <div className="lp-feats-head">
            <h2>Como funciona</h2>
            <p>Quatro passos simples para teres o teu mês debaixo de olho.</p>
          </div>
          <div className="lp-feat-grid sobre-steps">
            <div className="lp-feat">
              <div className="lp-feat-ico" style={{ background: "var(--accent-soft)", fontSize: 24 }}>💰</div>
              <h3>1 · Regista o que recebes</h3>
              <p>Salário, bolsa, ajuda dos pais, subsídios — tudo o que entra no teu mês.</p>
            </div>
            <div className="lp-feat">
              <div className="lp-feat-ico" style={{ background: "var(--accent-soft)", fontSize: 24 }}>🧾</div>
              <h3>2 · Adiciona as despesas</h3>
              <p>Organiza os teus gastos por categoria e marca-os como fixos ou variáveis.</p>
            </div>
            <div className="lp-feat">
              <div className="lp-feat-ico" style={{ background: "var(--accent-soft)", fontSize: 24 }}>🎯</div>
              <h3>3 · Define a tua poupança</h3>
              <p>Escolhe uma percentagem do que sobra para guardares todos os meses.</p>
            </div>
            <div className="lp-feat">
              <div className="lp-feat-ico" style={{ background: "var(--accent-soft)", fontSize: 24 }}>📊</div>
              <h3>4 · Vê o que tens disponível</h3>
              <p>O Rende+ faz as contas e mostra-te o saldo, os gráficos e as tuas metas.</p>
            </div>
          </div>
        </section>

        {/* CURRENCIES */}
        <section className="lp-curr" id="moedas">
          <div>
            <h3>Funciona na tua moeda</h3>
            <p>Escolhes ao criar a conta. Todos os valores aparecem no formato certo.</p>
          </div>
          <div className="lp-curr-chips">
            {Object.values(BM.currencies).map((c) => (
              <span className="lp-curr-chip" key={c.code}><span className="lp-curr-sym">{c.sym}</span> {c.code}</span>
            ))}
          </div>
        </section>

        {/* SOBRE */}
        <section id="sobre" style={{ marginBottom: 24 }}>
          <div className="sobre-objetivo">
            <h2>Sobre o Rende+</h2>
            <p>O Rende+ é um gestor de finanças pessoais simples, pensado para estudantes e jovens trabalhadores. O objetivo é dar-te <strong>clareza e controlo</strong>: saberes exatamente quanto tens, evitares surpresas ao fim do mês e construíres, aos poucos, o hábito de poupar.</p>
          </div>
          <div className="sobre-note">
            <span className="sobre-note-tag">🔒 Importante</span>
            <h2>O Rende+ não mexe no teu dinheiro</h2>
            <p>O Rende+ é uma ferramenta de <strong>organização e acompanhamento</strong> — não está ligado ao teu banco, não tem acesso às tuas contas e <strong>nunca move nem guarda dinheiro nenhum</strong>. Os teus fundos ficam sempre, 100%, no teu banco e sob o teu controlo.</p>
            <p>Pensa no Rende+ como um <strong>mapa</strong>: mostra-te o caminho e quanto deves separar, mas quem conduz és tu. Se disser "guarda 95 € para a poupança", cabe-te a ti mover esse valor para a tua conta-poupança e seguir o plano.</p>
            <ul className="sobre-points">
              <li><span className="sobre-point-ic">🗺️</span><span>O Rende+ <strong>planeia e regista</strong>; tu <strong>executas</strong> no teu banco real.</span></li>
              <li><span className="sobre-point-ic">🛡️</span><span>Como não toca no teu dinheiro, não há risco financeiro — só ganhas clareza.</span></li>
              <li><span className="sobre-point-ic">✍️</span><span>A separação real do dinheiro é da tua responsabilidade — o Rende+ guia-te.</span></li>
            </ul>
          </div>
        </section>
      </div>

      <footer className="lp-footer">
        <div className="lp-footer-in">
          <a href="#" onClick={goTop} style={{ textDecoration: "none", cursor: "pointer" }} aria-label="Ir para o topo"><Brand size={30} /></a>
          <span className="muted">© 2026 · Gestão de finanças pessoais, simples e privada</span>
          <div className="row" style={{ marginLeft: "auto", gap: 8 }}>
            <button className="btn btn-ghost" onClick={onLogin}>Entrar</button>
            <button className="btn btn-primary" onClick={onCreate}>Criar conta</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

window.Landing = Landing;