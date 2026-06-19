/* ===== Landing page (antes de criar conta / entrar) ===== */
function Landing({ onCreate, onLogin, theme, setTheme, lang, setLang, tr }) {
  const donut = [
    { nome: tr("m_habitacao"), color: "var(--c-habitacao)", valor: 270 },
    { nome: tr("m_alimentacao"), color: "var(--c-alimentacao)", valor: 185 },
    { nome: tr("m_transporte"), color: "var(--c-transporte)", valor: 60 },
    { nome: tr("m_lazer"), color: "var(--c-lazer)", valor: 48 },
  ];
  // Hero: alterna entre as 8 moedas (valores ~realistas via câmbio aproximado)
  const PREVIEW_ORDER = ["EUR", "BRL", "USD", "AOA", "GBP", "CVE", "MZN", "CAD"];
  const PREVIEW_FX = { EUR: 1, USD: 1.08, GBP: 0.85, CAD: 1.48, BRL: 6.2, AOA: 950, CVE: 110.27, MZN: 69 };
  const [pcur, setPcur] = React.useState("EUR");
  React.useEffect(() => {
    let i = 0;
    const id = setInterval(() => { i = (i + 1) % PREVIEW_ORDER.length; setPcur(PREVIEW_ORDER[i]); }, 2800);
    return () => clearInterval(id);
  }, []);
  const fmtP = (n) => {
    const c = (BM.currencies && BM.currencies[pcur]) || { sym: "€", pos: "before", space: true, locale: "pt-PT", dec: 2 };
    const places = c.dec != null ? c.dec : 2;
    const v = (n * (PREVIEW_FX[pcur] || 1)).toLocaleString(c.locale || "pt-PT", { minimumFractionDigits: places, maximumFractionDigits: places });
    return c.pos === "after" ? `${v}\u00A0${c.sym}` : `${c.sym}${c.space ? "\u00A0" : ""}${v}`;
  };
  const feats = [
    ["wallet", "var(--c-habitacao)", tr("feat1_title"), tr("feat1_desc")],
    ["target", "var(--accent)", tr("feat2_title"), tr("feat2_desc")],
    ["coins", "var(--c-educacao)", tr("feat3_title"), tr("feat3_desc")],
  ];
  const steps = [
    ["💰", tr("step1_title"), tr("step1_desc")],
    ["🧾", tr("step2_title"), tr("step2_desc")],
    ["🎯", tr("step3_title"), tr("step3_desc")],
    ["📊", tr("step4_title"), tr("step4_desc")],
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

  const LangPicker = () => (
    <div role="group" aria-label={tr("lang_title")} style={{ display: "inline-flex", gap: 2, padding: 3, background: "var(--surface-2)", borderRadius: 999, border: "1px solid var(--border)" }}>
      {I18N.SUP.map((l) => (
        <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} title={tr("lang_title")}
          style={{ border: "none", cursor: "pointer", fontSize: 12, fontWeight: 800, lineHeight: 1, padding: "6px 9px", borderRadius: 999, transition: "background .15s, color .15s", background: lang === l ? "var(--accent)" : "transparent", color: lang === l ? "#fff" : "var(--ink-3)" }}>
          {I18N.LABELS[l]}
        </button>
      ))}
    </div>
  );

  return (
    <div className="lp">
      <header className="lp-header">
        <a href="#" onClick={goTop} style={{ textDecoration: "none", cursor: "pointer" }} aria-label="Ir para o topo"><Brand /></a>
        <nav className="lp-nav">
          <a href="#funcionalidades" onClick={(e) => goSection(e, "funcionalidades")}>{tr("nav_features")}</a>
          <a href="#como-funciona" onClick={(e) => goSection(e, "como-funciona")}>{tr("nav_how")}</a>
          <a href="#moedas" onClick={(e) => goSection(e, "moedas")}>{tr("nav_currencies")}</a>
        </nav>
        <div className="lp-header-actions" style={{ flexWrap: "wrap", justifyContent: "flex-end", gap: 8 }}>
          <LangPicker />
          <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title={tr("theme_title")}><Icon name={theme === "dark" ? "sun" : "moon"} size={18} /></button>
          <span aria-hidden="true" style={{ width: 1, height: 22, background: "var(--border)", margin: "0 2px", alignSelf: "center" }} />
          <button className="btn btn-ghost" onClick={onLogin}>{tr("login")}</button>
          <button className="btn btn-primary" onClick={onCreate}>{tr("signup")}</button>
        </div>
      </header>

      <div className="lp-main">
        {/* HERO */}
        <section className="lp-hero">
          <div>
            <span className="lp-eyebrow"><Icon name="spark" size={14} /> {tr("hero_eyebrow")}</span>
            <h1 className="lp-h1">{tr("hero_h1_a")}<span className="accent">{tr("hero_h1_b")}</span></h1>
            <p className="lp-sub">{tr("hero_sub")}</p>
            <div className="lp-cta">
              <button className="btn btn-primary" style={{ padding: "13px 22px", fontSize: 15 }} onClick={onCreate}><Icon name="arrowsDown" size={16} color="#fff" /> {tr("hero_cta_create")}</button>
              <button className="btn btn-ghost" style={{ padding: "13px 22px", fontSize: 15 }} onClick={onLogin}>{tr("login")}</button>
            </div>
            <div className="lp-trust">
              <span className="lp-trust-item"><Icon name="check" size={16} color="var(--accent)" /> {tr("trust_free")}</span>
              <span className="lp-trust-item"><Icon name="check" size={16} color="var(--accent)" /> {tr("trust_data")}</span>
              <span className="lp-trust-item"><Icon name="check" size={16} color="var(--accent)" /> {Object.keys(BM.currencies).length} {tr("trust_currencies")}</span>
            </div>
          </div>

          {/* preview mock */}
          <div className="lp-preview">
            <div className="lp-card">
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div className="tiny muted" style={{ fontWeight: 700 }}>{tr("prev_balance")}</div>
                  <div key={pcur} className="tnum cur-fade" style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-.03em", marginTop: 2 }}>{fmtP(317)}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <span key={pcur} className="cur-pill cur-fade">{pcur}</span>
                  <span className="delta up"><Icon name="arrowUp" size={13} /> +12%</span>
                </div>
              </div>
              <div className="row" style={{ gap: 18, alignItems: "center" }}>
                <DonutChart data={donut} size={132} thickness={20} center={<div key={pcur} className="cur-fade"><div className="tnum" style={{ fontSize: 16, fontWeight: 800 }}>{fmtP(563)}</div><div className="tiny muted" style={{ fontWeight: 600 }}>{tr("prev_spent")}</div></div>} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  {donut.map((c) => (
                    <div key={c.nome} className="row" style={{ justifyContent: "space-between" }}>
                      <span className="row" style={{ gap: 7, fontSize: 12.5, fontWeight: 600 }}><span className="dot" style={{ background: c.color }} />{c.nome}</span>
                      <span key={pcur} className="tnum tiny cur-fade" style={{ fontWeight: 700 }}>{fmtP(c.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lp-float" style={{ top: -18, right: 6 }}>
              <div className="row" style={{ gap: 10 }}>
                <span className="li-ico" style={{ width: 34, height: 34, background: "var(--accent-soft)" }}><Icon name="target" size={16} color="var(--accent)" sw={2} /></span>
                <div><div className="tiny muted" style={{ fontWeight: 700 }}>{tr("prev_savings")}</div><div key={pcur} className="tnum cur-fade" style={{ fontWeight: 800, fontSize: 15 }}>{fmtP(95)}</div></div>
              </div>
            </div>
            <div className="lp-float" style={{ bottom: -20, left: -10 }}>
              <div className="tiny muted" style={{ fontWeight: 700, marginBottom: 6 }}>{tr("prev_save_pct")}</div>
              <input type="range" min="10" max="50" value="20" readOnly className="range" style={{ width: 150, pointerEvents: "none" }} />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="lp-feats" id="funcionalidades">
          <div className="lp-feats-head" id="vantagens">
            <h2>{tr("feats_h2")}</h2>
            <p>{tr("feats_sub")}</p>
          </div>
          <div className="lp-feat-grid">
            {feats.map(([ic, col, title, d]) => (
              <div className="lp-feat" key={title}>
                <div className="lp-feat-ico" style={{ background: `color-mix(in srgb, ${col} 15%, transparent)` }}><Icon name={ic} size={23} color={col} sw={1.9} /></div>
                <h3>{title}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="lp-feats" id="como-funciona">
          <div className="lp-feats-head">
            <h2>{tr("how_h2")}</h2>
            <p>{tr("how_sub")}</p>
          </div>
          <div className="lp-feat-grid sobre-steps">
            {steps.map(([emoji, title, d]) => (
              <div className="lp-feat" key={title}>
                <div className="lp-feat-ico" style={{ background: "var(--accent-soft)", fontSize: 24 }}>{emoji}</div>
                <h3>{title}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CURRENCIES */}
        <section className="lp-curr" id="moedas">
          <div>
            <h3>{tr("curr_h3")}</h3>
            <p>{tr("curr_sub")}</p>
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
            <h2>{tr("about_h2")}</h2>
            <p dangerouslySetInnerHTML={{ __html: tr("about_p") }} />
          </div>
          <div className="sobre-note">
            <span className="sobre-note-tag">{tr("note_tag")}</span>
            <h2>{tr("note_h2")}</h2>
            <p dangerouslySetInnerHTML={{ __html: tr("note_p1") }} />
            <p dangerouslySetInnerHTML={{ __html: tr("note_p2") }} />
            <ul className="sobre-points">
              <li><span className="sobre-point-ic">🗺️</span><span dangerouslySetInnerHTML={{ __html: tr("point1") }} /></li>
              <li><span className="sobre-point-ic">🛡️</span><span dangerouslySetInnerHTML={{ __html: tr("point2") }} /></li>
              <li><span className="sobre-point-ic">✍️</span><span dangerouslySetInnerHTML={{ __html: tr("point3") }} /></li>
            </ul>
          </div>
        </section>
      </div>

      <footer className="lp-footer">
        <div className="lp-footer-in">
          <a href="#" onClick={goTop} style={{ textDecoration: "none", cursor: "pointer" }} aria-label="Ir para o topo"><Brand size={30} /></a>
          <span className="muted">{tr("footer_copy")}</span>
          <div className="row" style={{ marginLeft: "auto", gap: 8 }}>
            <button className="btn btn-ghost" onClick={onLogin}>{tr("login")}</button>
            <button className="btn btn-primary" onClick={onCreate}>{tr("signup")}</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

window.Landing = Landing;