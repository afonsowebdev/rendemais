/* ===== Screens (parte 1): Auth, Dashboard, Despesas, Rendimentos ===== */

/* ---------- força da palavra-passe ---------- */
function pwChecks(p) {
  p = p || "";
  return { len: p.length >= 8, upper: /[A-Z]/.test(p), lower: /[a-z]/.test(p), num: /[0-9]/.test(p), special: /[^A-Za-z0-9]/.test(p) };
}
function pwScore(p) { return Object.values(pwChecks(p)).filter(Boolean).length; }
function pwStrong(p) { return pwScore(p) === 5; }

/* input de palavra-passe com botão de mostrar/ocultar (olho) */
function PwInput({ value, onChange, placeholder, show, toggle, autoComplete, disabled }) {
  const tr = useT();
  return (
    <div style={{ position: "relative", opacity: disabled ? 0.5 : 1 }}>
      <input className="input" type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} disabled={disabled} style={{ paddingRight: 44 }} />
      <button type="button" onClick={toggle} tabIndex={-1} disabled={disabled} aria-label={show ? tr("pw_hide") : tr("pw_show")}
        style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 7, display: "grid", placeItems: "center", color: "var(--ink-3)", borderRadius: 8 }}>
        <Icon name={show ? "eyeOff" : "eye"} size={18} />
      </button>
    </div>
  );
}

/* medidor de força: barras + critérios (fraca → forte) */
function Strength({ value }) {
  const tr = useT();
  if (!value) return null;
  const c = pwChecks(value), s = pwScore(value);
  const level = s <= 2 ? 0 : s <= 4 ? 1 : 2;
  const meta = [{ t: tr("pw_weak"), col: "var(--neg)" }, { t: tr("pw_medium"), col: "var(--c-transporte)" }, { t: tr("pw_strong"), col: "var(--accent)" }][level];
  const reqs = [["len", tr("pw_len")], ["upper", tr("pw_upper")], ["lower", tr("pw_lower")], ["num", tr("pw_num")], ["special", tr("pw_special")]];
  return (
    <div style={{ marginTop: -4, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 7 }}>
        {[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i < s ? meta.col : "var(--border)", transition: "background .2s" }} />)}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: meta.col, marginBottom: 6 }}>{tr("pw_strength")}: {meta.t}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
        {reqs.map(([k, lbl]) => (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: c[k] ? "var(--accent)" : "var(--ink-3)" }}>
            <Icon name={c[k] ? "check" : "dots"} size={12} color={c[k] ? "var(--accent)" : "var(--ink-3)"} /> {lbl}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Câmbio ao vivo (taxas reais via open.er-api.com, sem chave) ---------- */
function Cambio({ base }) {
  const codes = Object.keys(BM.currencies);
  const [de, setDe] = React.useState(base || "EUR");
  const [para, setPara] = React.useState(base === "AOA" ? "EUR" : "AOA");
  const [valor, setValor] = React.useState("100");
  const [rate, setRate] = React.useState(null);
  const [estado, setEstado] = React.useState("load");
  const [updated, setUpdated] = React.useState("");
  React.useEffect(() => { setDe(base || "EUR"); }, [base]);
  React.useEffect(() => {
    if (de === para) { setRate(1); setEstado("ok"); return; }
    let alive = true; setEstado("load"); setRate(null);
    fetch("https://open.er-api.com/v6/latest/" + de)
      .then((r) => r.json())
      .then((d) => { if (!alive) return; if (d && d.result === "success" && d.rates && d.rates[para] != null) { setRate(d.rates[para]); setUpdated((d.time_last_update_utc || "").slice(0, 16)); setEstado("ok"); } else setEstado("err"); })
      .catch(() => { if (alive) setEstado("err"); });
    return () => { alive = false; };
  }, [de, para]);
  const n = parseFloat(String(valor).replace(",", ".")) || 0;
  const conv = rate != null ? n * rate : null;
  const fmt = (v, code) => { const c = BM.currencies[code]; const dec = c && c.dec != null ? c.dec : 2; return v.toLocaleString((c && c.locale) || "pt-PT", { minimumFractionDigits: dec, maximumFractionDigits: dec }); };
  const swap = () => { const a = de, b = para; setDe(b); setPara(a); };
  return (
    <div className="card card-pad" style={{ marginTop: 4 }}>
      <div className="row" style={{ gap: 8, alignItems: "center", marginBottom: 10 }}>
        <Icon name="coins" size={16} color="var(--accent)" /><b style={{ fontSize: 14 }}>Câmbio ao vivo</b>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "end" }}>
        <div>
          <input className="input" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="100" />
          <select className="select" style={{ marginTop: 6 }} value={de} onChange={(e) => setDe(e.target.value)}>{codes.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        </div>
        <button type="button" className="icon-btn" title="Trocar" onClick={swap} style={{ marginBottom: 1 }}><Icon name="sync" size={16} /></button>
        <div>
          <div className="input tnum" style={{ display: "flex", alignItems: "center", fontWeight: 700, background: "var(--surface-2)" }}>{estado === "load" ? "…" : estado === "err" ? "—" : conv != null ? fmt(conv, para) : "—"}</div>
          <select className="select" style={{ marginTop: 6 }} value={para} onChange={(e) => setPara(e.target.value)}>{codes.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        </div>
      </div>
      <div className="muted tiny" style={{ marginTop: 9, fontWeight: 600 }}>
        {estado === "err" ? "Sem ligação às taxas. Verifica a internet." : estado === "ok" && rate != null ? `1 ${de} = ${fmt(rate, para)} ${para}${updated ? " · " + updated : ""}` : "A obter taxas…"}
      </div>
    </div>
  );
}

/* calcula a idade (em anos completos) a partir da data de nascimento (YYYY-MM-DD) */
function calcIdade(iso) {
  if (!iso) return null;
  const n = new Date(iso + "T00:00:00");
  if (isNaN(n.getTime())) return null;
  const h = new Date();
  let idade = h.getFullYear() - n.getFullYear();
  const m = h.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && h.getDate() < n.getDate())) idade--;
  return idade;
}

/* ---------- AUTH: criar conta / iniciar sessão ---------- */
function Auth({ initialMode, onBack, onSignup }) {
  const fin = useFinance();
  const tr = useT();
  const [remember, setRemember] = React.useState(true);
  const [mode, setMode] = React.useState(initialMode || (fin.account ? "login" : "signup"));
  const [f, setF] = React.useState(() => { const pais = BM.detectCountry(); const m = BM.currencyForCountry(pais); return { nome: "", email: "", password: "", password2: "", code: "", nascimento: "", cidade: "", pais, perfil: "Estudante", estado: "Solteiro(a)", habitacao: "Vive com colegas", moeda: m, multi: false, moedas: [m] }; });
  const [cidadeOutra, setCidadeOutra] = React.useState(false);
  const setCountry = (code) => { const m = BM.currencyForCountry(code); setCidadeOutra(false); setF((s) => ({ ...s, pais: code, cidade: "", moeda: m, moedas: [m] })); };
  const [err, setErr] = React.useState("");
  const [okMsg, setOkMsg] = React.useState("");
  const [setupToken, setSetupToken] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);
  const [showPw2, setShowPw2] = React.useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  // nome: só letras (com acentos) e espaços; primeira letra de cada palavra em maiúscula
  const onNome = (e) => { let v = e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, "").replace(/\s{2,}/g, " ").replace(/(^|\s)([a-zà-öø-ÿ])/g, (m, sp, ch) => sp + ch.toUpperCase()); setF((s) => ({ ...s, nome: v })); };
  const toggleMoeda = (code) => setF((s) => { if (code === s.moeda) return s; const has = (s.moedas || []).includes(code); const next = has ? (s.moedas || []).filter((x) => x !== code) : [...(s.moedas || []), code]; return { ...s, moedas: Array.from(new Set([s.moeda, ...next])) }; });
  const goMode = (m) => { setErr(""); setOkMsg(""); setMode(m); };

  const doRegister = async () => {
    if (!f.nome.trim() || !f.email.trim()) { setErr(tr("auth_err_fill")); return; }
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]+(?: [A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(f.nome.trim())) { setErr("O nome só pode conter letras."); return; }
    const idade = calcIdade(f.nascimento);
    if (idade == null) { setErr("Indica a tua data de nascimento."); return; }
    if (idade < 16) { setErr("Tens de ter pelo menos 16 anos para criar conta."); return; }
    if (!f.cidade) { setErr("Seleciona a tua província ou região."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) { setErr("Indica um email válido."); return; }
    setErr("");
    try {
      await fin.iniciarRegisto({ email: f.email, nome: f.nome, moeda: f.moeda, idade });
      setF((s) => ({ ...s, code: "" })); setOkMsg(""); setMode("verify");
    } catch (e) { setErr(e.message || tr("auth_err_signup")); }
  };
  const doVerify = async () => {
    if (!/^\d{6}$/.test((f.code || "").trim())) { setErr("Introduz o código de 6 dígitos."); return; }
    setErr("");
    try {
      const tok = await fin.verificarEmail(f.email, f.code);
      setSetupToken(tok); setF((s) => ({ ...s, password: "", password2: "" })); setOkMsg(""); setMode("setpw");
    } catch (e) { setErr(e.message || "Não foi possível confirmar o código."); }
  };
  const doResend = async () => {
    setErr("");
    try { await fin.reenviarCodigo(f.email); setOkMsg("Enviámos um novo código para o teu email."); }
    catch (e) { setErr(e.message || "Não foi possível reenviar o código."); }
  };
  const doSetPw = async () => {
    if (!pwStrong(f.password)) { setErr(tr("auth_err_weak")); return; }
    if (f.password !== f.password2) { setErr(tr("auth_err_mismatch")); return; }
    setErr("");
    try {
      await fin.definirPassword(setupToken, f.password, { idade: calcIdade(f.nascimento), nascimento: f.nascimento, cidade: f.cidade, pais: f.pais, perfil: f.perfil, estado: f.estado, habitacao: f.habitacao, moeda: f.moeda, moedas: f.moedas });
    } catch (e) { setErr(e.message || "Não foi possível definir a palavra-passe."); }
  };
  const doLogin = async () => {
    if (!f.email.trim() || !f.password) { setErr(tr("auth_err_fill")); return; }
    setErr("");
    try { await fin.login(f.email, f.password); }
    catch (e) { setErr(e.message || tr("auth_err_login")); }
  };
  const doForgot = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return setErr("Indica um email válido.");
    setErr("");
    try {
      await fin.esqueciPassword(f.email);
      setF((s) => ({ ...s, code: "", password: "", password2: "" }));
      setOkMsg("Se existir uma conta com esse email, enviámos um código de 6 dígitos. Verifica o teu email.");
      setMode("reset");
    } catch (e) { setErr(e.message || "Não foi possível enviar o código."); }
  };
  const doReset = async () => {
    if (!/^\d{6}$/.test((f.code || "").trim())) return setErr("Introduz o código de 6 dígitos.");
    if (!pwStrong(f.password)) return setErr(tr("auth_err_weak2"));
    if (f.password !== f.password2) return setErr(tr("auth_err_mismatch"));
    setErr("");
    try {
      await fin.redefinirPassword(f.email, f.code, f.password);
      // sucesso: a sessão já fica iniciada e a app navega sozinha para o painel
    } catch (e) { setErr(e.message || "Não foi possível alterar a palavra-passe."); }
  };
  const primaryAction = mode === "signup" ? doRegister : mode === "verify" ? doVerify : mode === "setpw" ? doSetPw : mode === "login" ? doLogin : mode === "forgot" ? doForgot : doReset;
  const titles = {
    signup: [tr("auth_title_signup"), tr("auth_sub_signup")],
    verify: ["Confirma o teu email", "Enviámos um código de 6 dígitos para " + (f.email || "o teu email") + "."],
    setpw: ["Define a tua palavra-passe", "Quase lá. Escolhe uma palavra-passe segura para entrar."],
    login: [tr("auth_title_login"), tr("auth_sub_login")],
    forgot: [tr("auth_title_forgot"), tr("auth_sub_forgot")],
    reset: [tr("auth_title_reset"), tr("auth_sub_reset").split("{email}").join(f.email || tr("auth_your_email"))],
  };
  const primaryLabel = { signup: "Continuar", verify: "Confirmar email", setpw: "Definir e entrar", login: tr("auth_btn_login"), forgot: tr("auth_btn_forgot"), reset: tr("auth_btn_reset") }[mode];
  const loadingLabel = { signup: "A enviar código…", verify: "A confirmar…", setpw: "A criar conta…", login: tr("auth_load_login"), forgot: tr("auth_load_forgot"), reset: tr("auth_load_reset") }[mode];
  const runPrimary = async () => {
    if (busy) return;
    setBusy(true);
    try { await primaryAction(); }
    finally { setBusy(false); }
  };

  const loginTitle = mode === "login" ? "Bem-vindo de volta" : titles[mode][0];
  const loginSub = mode === "login" ? "Inicie sessão para continuar a gerir a sua vida financeira." : titles[mode][1];

  return (
    <div className="login-wrap login-wrap-v2">
      <div className="login-form">
        <form className="login-card" onSubmit={(e) => { e.preventDefault(); runPrimary(); }}>
          <div className="login-form-brand"><Brand /></div>
          <div className="login-brand-top"><Brand /></div>
          {onBack && <button type="button" onClick={onBack} className="auth-back auth-back-strong"><i className="bx bx-chevron-left" aria-hidden="true"></i> Voltar</button>}
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-.02em", margin: "0 0 6px" }}>{loginTitle}</h2>
          <p className="muted" style={{ margin: "0 0 24px", fontSize: 14, fontWeight: 500, lineHeight: 1.55 }}>{loginSub}</p>

          {okMsg && <div className="alert ok" style={{ marginBottom: 16, padding: "10px 12px" }}><Icon name="check" size={16} color="var(--accent)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{okMsg}</span></div>}

          {mode === "signup" && (
            <>
              <Field label={tr("auth_name")}><input className="input" value={f.nome} onChange={onNome} placeholder={tr("auth_name_ph")} autoComplete="name" /></Field>
              <Field label={tr("auth_country")}>
                <select className="select" value={f.pais} onChange={(e) => setCountry(e.target.value)}>
                  {BM.countries.map((c) => <option key={c.code} value={c.code}>{tr("country_" + c.code)}</option>)}
                </select>
              </Field>
              <Field label="Data de nascimento" hint="Calculamos a tua idade a partir desta data.">
                <input className="input" type="date" value={f.nascimento} max={BM.todayISO()} onChange={(e) => setF((s) => ({ ...s, nascimento: e.target.value }))} />
                {calcIdade(f.nascimento) != null && (
                  <div className="tiny" style={{ marginTop: 7, fontWeight: 700, color: calcIdade(f.nascimento) < 16 ? "var(--neg)" : "var(--accent)" }}>
                    {calcIdade(f.nascimento) < 16 ? `Tens ${calcIdade(f.nascimento)} anos — a idade mínima é 16.` : `Tens ${calcIdade(f.nascimento)} anos.`}
                  </div>
                )}
              </Field>
              <Field label="Província / Região">
                <select className="select" value={cidadeOutra ? "__other__" : f.cidade}
                  onChange={(e) => { if (e.target.value === "__other__") { setCidadeOutra(true); setF((s) => ({ ...s, cidade: "" })); } else { setCidadeOutra(false); setF((s) => ({ ...s, cidade: e.target.value })); } }}>
                  <option value="" disabled>Seleciona a tua província</option>
                  {BM.countryProvinces(f.pais).map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="__other__">Outra…</option>
                </select>
                {cidadeOutra && <input className="input" style={{ marginTop: 8 }} value={f.cidade} onChange={set("cidade")} placeholder="A tua região" />}
              </Field>
              <Field label={tr("auth_situation")}><select className="select" value={f.perfil} onChange={set("perfil")}>{[["Estudante", tr("auth_opt_student")], ["Trabalhador", tr("auth_opt_worker")], ["Estudante e Trabalhador", tr("auth_opt_both")], ["Autonomo", "Autónomo/a (apoio familiar)"]].map(([v, lbl]) => <option key={v} value={v}>{lbl}</option>)}</select></Field>
              <Field label={tr("auth_currency")} hint="Definida pelo teu país. Não pode ser alterada.">
                <div className="input" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-2)", cursor: "not-allowed", fontWeight: 700 }}>
                  <span>{(BM.currencies[f.moeda] || {}).sym} ({f.moeda})</span>
                  <Icon name="check" size={15} color="var(--accent)" />
                </div>
              </Field>
              <Field label="Queres gerir mais do que uma moeda?">
                <div className="row" style={{ gap: 8 }}>
                  <button type="button" className={"chip" + (!f.multi ? " sel" : "")} style={{ cursor: "pointer" }} onClick={() => setF((s) => ({ ...s, multi: false, moedas: [s.moeda] }))}>Não</button>
                  <button type="button" className={"chip" + (f.multi ? " sel" : "")} style={{ cursor: "pointer" }} onClick={() => setF((s) => ({ ...s, multi: true }))}>Sim</button>
                </div>
              </Field>
              {f.multi && (
                <>
                  <Field label="Moedas que queres gerir" hint="A do teu país está sempre incluída.">
                    <div className="row" style={{ flexWrap: "wrap", gap: 7 }}>
                      {Object.values(BM.currencies).map((c) => {
                        const on = c.code === f.moeda || (f.moedas || []).includes(c.code);
                        return <button type="button" key={c.code} className={"chip" + (on ? " sel" : "")} disabled={c.code === f.moeda} style={{ cursor: c.code === f.moeda ? "default" : "pointer", opacity: c.code === f.moeda ? .7 : 1 }} onClick={() => toggleMoeda(c.code)}>{c.sym} {c.code}</button>;
                      })}
                    </div>
                  </Field>
                  <Cambio base={f.moeda} />
                </>
              )}
            </>
          )}

          {(mode === "signup" || mode === "login" || mode === "forgot") && (
            <Field label={tr("email")}><input className="input" value={f.email} onChange={set("email")} placeholder={tr("auth_email_ph")} /></Field>
          )}

          {mode === "login" && (
            <Field label={tr("auth_password")}><PwInput value={f.password} onChange={set("password")} placeholder="••••••••" show={showPw} toggle={() => setShowPw((v) => !v)} autoComplete="current-password" disabled={!f.email.trim()} /></Field>
          )}

          {mode === "verify" && (
            <>
              <Field label="Código de verificação">
                <input className="input tnum" value={f.code} onChange={(e) => setF((s) => ({ ...s, code: e.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="000000" inputMode="numeric" maxLength={6} autoFocus style={{ letterSpacing: ".3em", fontSize: 18, textAlign: "center" }} />
              </Field>
              <div style={{ textAlign: "center", marginTop: -4, marginBottom: 8 }}>
                <button type="button" onClick={doResend} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", fontSize: 12.5, cursor: "pointer", padding: 0 }}>Não recebeste? Reenviar código</button>
              </div>
            </>
          )}

          {mode === "setpw" && (
            <>
              <Field label={tr("auth_password")}><PwInput value={f.password} onChange={set("password")} placeholder="••••••••" show={showPw} toggle={() => setShowPw((v) => !v)} autoComplete="new-password" /></Field>
              <Strength value={f.password} />
              <Field label={tr("auth_confirm_password")}><PwInput value={f.password2} onChange={set("password2")} placeholder="••••••••" show={showPw2} toggle={() => setShowPw2((v) => !v)} autoComplete="new-password" disabled={!pwStrong(f.password)} /></Field>
            </>
          )}

          {mode === "login" && (
            <div className="login-row-remember">
              <button type="button" className={"login-remember" + (remember ? " on" : "")} onClick={() => setRemember((v) => !v)}>
                <span className="login-remember-box" aria-hidden="true">{remember && <Icon name="check" size={13} color="#fff" />}</span>
                <span>Manter sessão iniciada</span>
              </button>
              <button type="button" onClick={() => goMode("forgot")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", fontSize: 12.5, cursor: "pointer", padding: 0 }}>{tr("auth_forgot_link")}</button>
            </div>
          )}

          {mode === "reset" && (
            <>
              <div className="alert ok" style={{ marginBottom: 14, padding: "10px 12px" }}>
                <Icon name="info" size={16} color="var(--accent)" />
                <span style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.5 }}>Enviámos um código de 6 dígitos para <strong>{f.email || "o teu email"}</strong>. Escreve-o aqui em baixo com a nova palavra-passe. Válido durante 15 minutos.</span>
              </div>
              <Field label={tr("auth_reset_code_label")}><input className="input tnum" value={f.code} onChange={(e) => setF((s) => ({ ...s, code: e.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="123456" inputMode="numeric" maxLength={6} /></Field>
              <Field label={tr("auth_new_password")}><PwInput value={f.password} onChange={set("password")} placeholder="••••••••" show={showPw} toggle={() => setShowPw((v) => !v)} autoComplete="new-password" /></Field>
              <Strength value={f.password} />
              <Field label={tr("auth_confirm_password")}><PwInput value={f.password2} onChange={set("password2")} placeholder="••••••••" show={showPw2} toggle={() => setShowPw2((v) => !v)} autoComplete="new-password" /></Field>
            </>
          )}

          {err && <div className="alert bad" style={{ marginBottom: 12, padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}

          <style>{`@keyframes rmaisSpin{to{transform:rotate(360deg)}}`}</style>
          <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: 15, marginTop: 4, border: "none", opacity: busy ? 0.8 : 1, cursor: busy ? "wait" : "pointer" }}>
            {busy && <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.45)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", marginRight: 8, animation: "rmaisSpin .6s linear infinite", verticalAlign: "-2px" }} />}
            {busy ? loadingLabel : primaryLabel}
          </button>

          {mode === "login" && (
            <>
              <div className="login-sep"><span>ou continue com</span></div>
              <div className="login-social">
                <button type="button" className="login-social-btn" onClick={() => setErr("O início de sessão com Google chega em breve. Por agora, entra com o teu email.")}>
                  <Icon name="google" size={18} /> Continuar com Google
                </button>
                <button type="button" className="login-social-btn" onClick={() => setErr("O início de sessão com Apple chega em breve. Por agora, entra com o teu email.")}>
                  <i className="bx bxl-apple" style={{ fontSize: 20 }}></i> Continuar com Apple
                </button>
              </div>
            </>
          )}

          <p className="muted tiny" style={{ textAlign: "center", marginTop: 20, fontWeight: 600 }}>
            {mode === "signup" && <>{tr("auth_have_account")} <button type="button" onClick={() => goMode("login")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", cursor: "pointer", padding: 0 }}>{tr("auth_signin_link")}</button></>}
            {mode === "login" && <>{tr("auth_no_account")} <button type="button" onClick={() => (onSignup ? onSignup() : goMode("signup"))} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", cursor: "pointer", padding: 0 }}>Criar Conta</button></>}
            {mode === "verify" && <button type="button" onClick={() => goMode("signup")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", cursor: "pointer", padding: 0 }}>Voltar e corrigir o email</button>}
            {(mode === "forgot" || mode === "reset") && <button type="button" onClick={() => goMode("login")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", cursor: "pointer", padding: 0 }}>{tr("auth_back_login")}</button>}
          </p>
        </form>
      </div>

      <aside className="login-aside">
        <div className="login-aside-body">
          <span className="lp2-tag">Aplicação de Gestão Financeira</span>
          <h2 className="login-aside-h1">O seu dinheiro. Os seus objetivos. O seu futuro.</h2>
          <p className="login-aside-sub">O Rende+ ajuda-o a organizar receitas, despesas, objetivos financeiros e o orçamento mensal num único lugar.</p>
          <ul className="lp2-checks">
            {["Organize receitas e despesas.", "Acompanhe os seus objetivos financeiros.", "Planeie o orçamento mensal.", "Partilhe despesas com outras pessoas."].map((t) => (
              <li key={t}><Icon name="check" size={17} color="var(--accent)" sw={2.4} /> {t}</li>
            ))}
          </ul>
          <img className="login-aside-img login-aside-img-compact" src="assets/img/login-devices.png" alt="Rende+ no computador e no telemóvel" />
        </div>
      </aside>
    </div>
  );
}

/* ---------- DASHBOARD ---------- */
function Dashboard({ go, open }) {
  const fin = useFinance();
  const tr = useT();
  const tt = (k, v) => { let s = tr(k); if (v) Object.keys(v).forEach((kk) => { s = s.split("{" + kk + "}").join(v[kk]); }); return s; };
  const tcat = (key) => {
    if (BM.cats[key]) { const kk = "cat_" + key, vv = tr(kk); return vv === kk ? BM.cats[key].nome : vv; }
    const cc = (fin.data.customCats || []).find((c) => c.key === key);
    return cc ? cc.nome : tr("cat_outros");
  };
  const hasData = fin.despMes.length > 0 || fin.rendMes.length > 0;
  // Atalhos do painel personalizados pelas prioridades escolhidas no onboarding
  // (Etapa 3 · "Como pretende utilizar o Rende+?") — nunca inventa dados, só aponta caminhos.
  const prefs = Array.isArray(fin.account?.preferencia) ? fin.account.preferencia : (fin.account?.preferencia ? [fin.account.preferencia] : []);
  const atalhosPersonalizados = [
    prefs.includes("objetivos") && { icon: "target", t: "Crie o seu primeiro objetivo", d: "Defina uma meta e acompanhe o progresso.", onClick: () => go("objetivos") },
    prefs.includes("orcamento") && !fin.data.orcamento && { icon: "wallet", t: "Crie o seu orçamento mensal", d: "Defina um limite de gastos para o mês.", onClick: () => open("orcamento") },
    prefs.includes("partilhadas") && { icon: "users", t: "Crie o primeiro grupo", d: "Divida despesas com quem partilha consigo.", onClick: () => go("partilha") },
    prefs.includes("pagamentos") && { icon: "cal", t: "Acompanhe pagamentos futuros", d: "Adicione lembretes e nunca perca uma data.", onClick: () => go("agenda") },
  ].filter(Boolean);
  const orc = fin.data.orcamento;
  const pctGasto = orc ? Math.round((fin.totalGasto / orc) * 100) : null;
  const recent = [...fin.despMes].sort((a, b) => (b.data || "").localeCompare(a.data || "")).slice(0, 6);
  const recSpark = fin.series.map((m) => m.rec);
  const gastoSpark = fin.series.map((m) => m.gasto);
  // Duas formas de ver a mesma evolução: linha (tendência mês a mês) ou círculo
  // (peso total de recebido vs. gasto na janela de 6 meses) — o utilizador escolhe.
  const [evoView, setEvoView] = React.useState("line");
  const evoTotais = {
    rec: fin.series.reduce((s, m) => s + m.rec, 0),
    gasto: fin.series.reduce((s, m) => s + m.gasto, 0),
  };

  // Percentagem face ao mês anterior, para os 4 cartões principais do painel.
  // fin.series já tem uma janela de 6 meses (o atual é sempre o último); sem
  // baseline (mês anterior a 0) não há percentagem que faça sentido mostrar.
  // No início de um mês novo (ainda sem nenhuma despesa/receita registada nele),
  // o total desse mês está genuinamente a 0 — comparar isso ao mês anterior
  // dava sempre "-100%", o que parece um colapso nas finanças e não é: é só o
  // mês a começar. Por isso, quando o valor atual é 0 mas o anterior não era,
  // não mostramos percentagem nenhuma (em vez de um "-100%" enganador).
  const curS = fin.series[fin.series.length - 1];
  const prevS = fin.series[fin.series.length - 2];
  const pctChange = (curr, prev) => {
    if (!prev) return null;
    if (curr === 0) return null;
    return ((curr - prev) / Math.abs(prev)) * 100;
  };
  const recDeltaPct = pctChange(curS.rec, prevS.rec);
  const gastoDeltaPct = pctChange(curS.gasto, prevS.gasto);
  // "Disponível" do mês anterior: mesma fórmula do atual (saldo − poupança
  // separada), aplicada aos valores desse mês — não há histórico guardado de
  // poupancaSeparada, por isso reaplica-se a % de poupança atual ao saldo de
  // então (mesma lógica usada para calcular o plano do mês corrente).
  const prevSaldo = prevS.rec - prevS.gasto;
  const prevPlano = prevSaldo > 0 ? Math.round((fin.poupancaPct / 100) * prevSaldo * 100) / 100 : 0;
  const prevDisponivel = prevSaldo - Math.max(prevS.pou, prevPlano);
  const dispDeltaPct = pctChange(fin.disponivel, prevDisponivel);
  const poupadoDeltaPct = pctChange(curS.poupAcum, prevS.poupAcum);

  if (!hasData) {
    return (
      <div className="content">
        <EmptyState icon="bolt" title={tt("dash_empty_title", { nome: (fin.account?.nome || "").split(" ")[0] || "olá" })}
          msg={tt("dash_empty_msg", { month: fin.monthLabel })}
          action={
            <div className="row" style={{ gap: 10 }}>
              <button className="btn btn-primary" onClick={() => open("rendimento")}><Icon name="arrowsDown" size={16} color="#fff" /> {tr("add_income")}</button>
              <button className="btn btn-ghost" onClick={() => open("despesa")}><Icon name="wallet" size={16} /> {tr("add_expense")}</button>
            </div>
          } />
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[["arrowsDown", tr("dash_step1_t"), tr("dash_step1_d")],
            ["wallet", tr("dash_step2_t"), tr("dash_step2_d")],
            ["chart", tr("dash_step3_t"), tr("dash_step3_d")]].map(([ic, ti, d]) => (
            <div className="card card-pad" key={ti}>
              <div className="kpi-ico" style={{ background: "var(--accent-soft)", marginBottom: 12 }}><Icon name={ic} size={19} color="var(--accent)" /></div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{ti}</div>
              <div className="tiny muted" style={{ marginTop: 5, fontWeight: 600, lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>
        {atalhosPersonalizados.length > 0 && (
          <div className="grid" style={{ gridTemplateColumns: `repeat(${atalhosPersonalizados.length}, 1fr)`, marginTop: 4 }}>
            {atalhosPersonalizados.map((a) => (
              <button type="button" className="card card-pad" key={a.t} onClick={a.onClick} style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--border)" }}>
                <div className="kpi-ico" style={{ background: "var(--accent-soft)", marginBottom: 12 }}><Icon name={a.icon} size={19} color="var(--accent)" /></div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{a.t}</div>
                <div className="tiny muted" style={{ marginTop: 5, fontWeight: 600, lineHeight: 1.5 }}>{a.d}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // As informações de "estás a poupar X%" e de metas quase concluídas passaram para
  // as notificações (ver gerarNotificacoes em premium.jsx) — o Dashboard mantém só os
  // alertas realmente acionáveis (orçamento perto do limite, saldo negativo).
  const alerts = [];
  if (pctGasto != null && pctGasto >= 80) alerts.push(["warn", "bell", tt("dash_alert_budget_t", { pct: pctGasto }), tt("dash_alert_budget_d", { x: BM.eur(Math.max(0, orc - fin.totalGasto)), y: BM.eur0(orc) })]);
  if (fin.saldo < 0) alerts.push(["bad", "info", tr("dash_alert_neg_t"), tt("dash_alert_neg_d", { x: BM.eur(-fin.saldo) })]);

  // Objetivo em destaque: a meta aberta mais próxima da conclusão (maior progresso).
  const metasAbertas = fin.data.metas.filter((m) => !m.fechada);
  const metaDestaque = [...metasAbertas].sort((a, b) => {
    const pa = a.alvo > 0 ? a.atual / a.alvo : -1;
    const pb = b.alvo > 0 ? b.atual / b.alvo : -1;
    return pb - pa;
  })[0] || null;

  // Próximos pagamentos: reaproveita o motor de alertas já existente (lembretes + recorrentes a vencer).
  const prem = usePremium();
  const proximosPagamentos = scanAlertas(prem).slice(0, 5);
  const diaLabel = (d) => d < 0 ? "Atrasado" : d === 0 ? "Vence hoje" : d === 1 ? "Vence amanhã" : `Em ${d} dias`;

  const ehPremium = fin.account?.plano === "premium";
  const [qaOpen, setQaOpen, qaRef] = useDropdownClose();
  const [novoEvento, setNovoEvento] = React.useState(false);

  return (
    <div className="content">
      {alerts.length > 0 && (
        <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(3, alerts.length)},1fr)` }}>
          {alerts.slice(0, 3).map((a, i) => <Alert key={i} kind={a[0]} icon={a[1]} title={a[2]}>{a[3]}</Alert>)}
        </div>
      )}

      <div className="row dash-actions" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div className="qa-menu" ref={qaRef}>
          <button type="button" className="btn btn-primary" onClick={() => setQaOpen((v) => !v)} aria-haspopup="menu" aria-expanded={qaOpen}>
            <Icon name="plus" size={16} color="#fff" /> Nova transação <i className="bx bx-chevron-down" aria-hidden="true" style={{ fontSize: 15 }}></i>
          </button>
          {qaOpen && (
            <div className="qa-menu-pop" role="menu" aria-label="Nova transação">
              <button type="button" role="menuitem" onClick={() => { setQaOpen(false); open("rendimento"); }}><Icon name="arrowsDown" size={16} /> {tr("add_income")}</button>
              <button type="button" role="menuitem" onClick={() => { setQaOpen(false); open("despesa"); }}><Icon name="wallet" size={16} /> {tr("add_expense")}</button>
            </div>
          )}
        </div>
        <div className="row dash-actions-secondary" style={{ gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-soft" onClick={() => open("meta")}><Icon name="target" size={15} /> Novo objetivo</button>
          <button type="button" className="btn btn-soft" onClick={() => setNovoEvento(true)}><Icon name="cal" size={15} /> Novo evento</button>
          {ehPremium && <button type="button" className="btn btn-soft" onClick={() => go("partilha")}><Icon name="users" size={15} /> Novo grupo</button>}
        </div>
      </div>

      <div className="grid kpi-row">
        <Kpi label={tr("kpi_received")} rawValue={fin.totalRec} format={BM.eur0} value={BM.eur0(fin.totalRec)} icon="arrowsDown" color="var(--accent)" spark={recSpark} deltaPct={recDeltaPct} />
        <Kpi label={tr("kpi_spent")} rawValue={fin.totalGasto} format={BM.eur0} value={BM.eur0(fin.totalGasto)} icon="wallet" color="var(--c-transporte)" spark={gastoSpark} deltaPct={gastoDeltaPct} />
        <Kpi label={tr("kpi_available")} rawValue={fin.disponivel} format={BM.eur0} value={BM.eur0(fin.disponivel)} icon="bolt" color={fin.disponivel < 0 ? "var(--neg)" : "var(--c-habitacao)"} deltaPct={dispDeltaPct} sub={fin.poupancaSeparada > 0 ? tt("kpi_after_savings", { x: BM.eur0(fin.poupancaSeparada) }) : tr("kpi_until_eom")} />
        <Kpi label={tr("kpi_saved")} rawValue={fin.poupado} format={BM.eur0} value={BM.eur0(fin.poupado)} icon="target" color="var(--c-educacao)" deltaPct={poupadoDeltaPct} sub={tt(fin.data.metas.length === 1 ? "kpi_meta_one" : "kpi_meta_many", { n: fin.data.metas.length })} />
        <Kpi label="Objetivos ativos" value={String(metasAbertas.length)} icon="target" color="var(--c-lazer)" sub={metasAbertas.length === 0 ? "Nenhum em curso" : undefined} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <div className="card card-pad evo-card">
          <div className="evo-head">
            <div className="evo-head-txt">
              <div className="section-title">{tr("dash_evolution")}</div>
              <div className="tiny muted evo-sub">{tr("dash_evolution_sub")}</div>
            </div>
            <button type="button" className="btn btn-soft evo-history-btn" onClick={() => go("relatorios")}><Icon name="chart" size={14} /> Ver histórico</button>
          </div>
          <div className="evo-toolbar">
            <div className="row tiny evo-legend" style={{ fontWeight: 700 }}>
              <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: "var(--accent)" }} /> {tr("legend_received")}</span>
              <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: "var(--c-transporte)" }} /> {tr("legend_spent")}</span>
            </div>
            <div className="seg evo-view-seg" role="group" aria-label="Formato do gráfico">
              <button type="button" className={evoView === "line" ? "on" : ""} title="Ver em linha" aria-label="Ver em linha" onClick={() => setEvoView("line")}><Icon name="chart" size={14} /></button>
              <button type="button" className={evoView === "donut" ? "on" : ""} title="Ver em círculo" aria-label="Ver em círculo" onClick={() => setEvoView("donut")}><Icon name="target" size={14} /></button>
            </div>
          </div>
          {evoView === "line" ? <LineChart data={fin.series} height={216} /> : (
            <div className="evo-donut-view">
              <DonutChart data={[{ valor: evoTotais.rec, color: "var(--accent)" }, { valor: evoTotais.gasto, color: "var(--c-transporte)" }]}
                center={<div><div className="tnum" style={{ fontSize: 15, fontWeight: 800 }}>{BM.eur0(evoTotais.rec + evoTotais.gasto)}</div><div className="tiny muted" style={{ fontWeight: 600 }}>6 meses</div></div>} />
              <div className="evo-donut-legend">
                <div className="evo-donut-leg-item"><span className="dot" style={{ background: "var(--accent)" }} />{tr("legend_received")}<b className="tnum">{BM.eur0(evoTotais.rec)}</b></div>
                <div className="evo-donut-leg-item"><span className="dot" style={{ background: "var(--c-transporte)" }} />{tr("legend_spent")}<b className="tnum">{BM.eur0(evoTotais.gasto)}</b></div>
              </div>
            </div>
          )}
        </div>
        <div className="card card-pad">
          <div className="section-head" style={{ marginBottom: 16 }}>
            <div className="section-title">{tr("dash_by_category")}</div>
            <span className="tnum" style={{ fontWeight: 700, fontSize: 15 }}>{BM.eur0(fin.totalGasto)}</span>
          </div>
          {fin.catBreak.length === 0 ? (
            <div style={{ display: "grid", placeItems: "center", height: 200, textAlign: "center" }} className="muted tiny">
              <div><Icon name="cart" size={26} color="var(--ink-3)" /><div style={{ marginTop: 8, fontWeight: 600 }}>{tr("dash_no_expenses")}</div></div>
            </div>
          ) : (
            <BarBreakdown data={fin.catBreak.slice(0, 7)} money={BM.eur0} labelOf={(c) => tcat(c.key)} />
          )}
        </div>
      </div>

      <div className="card card-pad">
        <div className="section-head" style={{ marginBottom: 10 }}>
          <div><div className="section-title">{tr("dash_savings_evo")}</div><div className="tiny muted" style={{ fontWeight: 600, marginTop: 2 }}>{tr("dash_savings_evo_sub")}</div></div>
          <div style={{ textAlign: "right" }}>
            <div className="tnum" style={{ fontWeight: 700, fontSize: 18, color: "var(--c-educacao)" }}>{BM.eur0(fin.poupado)}</div>
            <div className="tiny muted" style={{ fontWeight: 700 }}>{tr("kpi_saved")}</div>
          </div>
        </div>
        {(fin.poupado === 0 && fin.series.every((s) => !s.poupAcum)) ? (
          <div style={{ display: "grid", placeItems: "center", height: 150, textAlign: "center" }} className="muted tiny">
            <div><Icon name="target" size={26} color="var(--ink-3)" /><div style={{ marginTop: 8, fontWeight: 600 }}>{tr("dash_no_savings")}</div></div>
          </div>
        ) : (
          <SavingsArea data={fin.series} />
        )}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <div className="card card-pad">
          <div className="section-head" style={{ marginBottom: 6 }}>
            <div className="section-title">{tr("dash_recent")}</div>
            <button className="btn btn-soft" style={{ padding: "7px 12px" }} onClick={() => go("transacoes")}>{tr("see_all")} <Icon name="chevR" size={14} /></button>
          </div>
          {recent.length === 0 ? <div className="muted tiny" style={{ padding: "24px 0", fontWeight: 600 }}>{tr("dash_no_expenses")}.</div> : (
            <div className="list">
              {recent.map((d) => (
                <div className="li" key={d.id}>
                  <CatBadge catKey={d.cat} />
                  <div className="li-main">
                    <div className="li-title">{d.nome}</div>
                    <div className="li-sub">{tcat(d.cat)} · {BM.fmtData(d.data)} · {d.tipo === "fixa" ? tr("fixed") : tr("variable")}</div>
                  </div>
                  <div className="li-amt tnum" style={{ color: "var(--neg)" }}>−{BM.eur(d.valor)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="section-head"><div className="section-title">{tr("dash_budget")}</div>
            <button className="btn btn-soft" style={{ padding: "5px 10px" }} onClick={() => open("orcamento")}><Icon name="edit" size={13} /> {tr("define")}</button>
          </div>
          {orc ? (
            <div>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 9 }}>
                <span className="tnum" style={{ fontWeight: 700, fontSize: 18 }}>{BM.eur0(fin.totalGasto)}</span>
                <span className="muted tiny" style={{ fontWeight: 700 }}>{tt("of_amount", { x: BM.eur0(orc) })}</span>
              </div>
              <Progress value={fin.totalGasto} max={orc} color={pctGasto > 80 ? "var(--warn)" : "var(--accent)"} />
              <div className="tiny muted" style={{ marginTop: 9, fontWeight: 600 }}>{tt("budget_left", { x: BM.eur(Math.max(0, orc - fin.totalGasto)), pct: pctGasto })}</div>
            </div>
          ) : <div className="muted tiny" style={{ fontWeight: 600 }}>{tr("budget_empty")}</div>}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 13 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="tiny" style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink-3)" }}>Objetivo em destaque</div>
              {metaDestaque && <button onClick={() => go("objetivos")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, cursor: "pointer", padding: 0, font: "inherit", fontSize: 12 }}>{tr("see_all")}</button>}
            </div>
            {!metaDestaque ? <div className="muted tiny" style={{ fontWeight: 600 }}>{tr("goals_empty")} <button onClick={() => go("objetivos")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, cursor: "pointer", padding: 0, font: "inherit" }}>{tr("goals_create_first")}</button></div> : (
              <div>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{metaDestaque.nome}</span>
                  <span className="tnum tiny muted" style={{ fontWeight: 700 }}>{BM.eur0(metaDestaque.atual)} / {BM.eur0(metaDestaque.alvo)}</span>
                </div>
                <Progress value={metaDestaque.atual} max={metaDestaque.alvo} color={metaDestaque.cor} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="section-head" style={{ marginBottom: 10 }}>
          <div className="section-title">Próximos pagamentos</div>
          <button className="btn btn-soft" style={{ padding: "7px 12px" }} onClick={() => go("agenda")}>{tr("see_all")} <Icon name="chevR" size={14} /></button>
        </div>
        {proximosPagamentos.length === 0 ? (
          <div className="muted tiny" style={{ padding: "20px 0", fontWeight: 600 }}>Sem pagamentos a vencer nos próximos dias.</div>
        ) : (
          <div className="list">
            {proximosPagamentos.map((a) => (
              <div className="li" key={a.chave}>
                <div className="kpi-ico" style={{ background: "var(--accent-soft)" }}><Icon name="cal" size={17} color="var(--accent)" /></div>
                <div className="li-main">
                  <div className="li-title">{a.titulo}</div>
                  <div className="li-sub">{diaLabel(a.d)}</div>
                </div>
                <div className="li-amt tnum">{BM.eur(a.valor)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {novoEvento && <LembreteModal item={null} onClose={() => setNovoEvento(false)} onSave={(it) => { prem.add("lembretes", it); setNovoEvento(false); }} />}
    </div>
  );
}

/* ---------- TRANSAÇÕES (Despesas + Rendimentos, reorganizados num único ecrã) ---------- */
function Transacoes({ open }) {
  const [tab, setTab] = React.useState("despesas");
  return (
    <>
      <div className="content" style={{ paddingBottom: 0 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="pg-tabs" style={{ width: "fit-content" }}>
            <button type="button" className={"pg-tab" + (tab === "despesas" ? " on" : "")} onClick={() => setTab("despesas")}><Icon name="wallet" size={15} /> Despesas</button>
            <button type="button" className={"pg-tab" + (tab === "rendimentos" ? " on" : "")} onClick={() => setTab("rendimentos")}><Icon name="arrowsDown" size={15} /> Receitas</button>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => open(tab === "despesas" ? "despesa" : "rendimento")}>
            <Icon name="plus" size={16} color="#fff" /> <span className="hide-mobile">{tab === "despesas" ? "Nova despesa" : "Novo rendimento"}</span>
          </button>
        </div>
      </div>
      {tab === "despesas" ? <Despesas open={open} /> : <Rendimentos open={open} />}
    </>
  );
}

/* ---------- DESPESAS ---------- */
function Despesas({ open }) {
  const fin = useFinance();
  const tr = useT();
  const tt = (k, v) => tfmt(tr(k), v);
  const tcat = (key) => {
    if (BM.cats[key]) { const kk = "cat_" + key, vv = tr(kk); return vv === kk ? BM.cats[key].nome : vv; }
    const cc = (fin.data.customCats || []).find((c) => c.key === key);
    return cc ? cc.nome : tr("cat_outros");
  };
  const [tipo, setTipo] = React.useState("todas");
  const [cat, setCat] = React.useState("todas");
  const catKeys = Object.keys(BM.cats);
  let rows = fin.despMes.filter((d) => (tipo === "todas" || d.tipo === tipo) && (cat === "todas" || d.cat === cat));
  rows = [...rows].sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const total = rows.reduce((s, d) => s + (+d.valor || 0), 0);

  return (
    <div className="content">
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Kpi label={tr("exp_total")} value={BM.eur0(fin.totalGasto)} icon="wallet" color="var(--c-transporte)" sub={tt(fin.despMes.length === 1 ? "exp_moves_one" : "exp_moves_many", { n: fin.despMes.length })} />
        <Kpi label={tr("exp_fixed")} value={BM.eur0(fin.fixas)} icon="home" color="var(--c-habitacao)" sub={tr("exp_fixed_sub")} />
        <Kpi label={tr("exp_variable")} value={BM.eur0(fin.variaveis)} icon="cart" color="var(--c-alimentacao)" sub={tr("exp_variable_sub")} />
      </div>

      {fin.despMes.length === 0 ? (
        <EmptyState icon="wallet" title={tr("exp_empty_t")}
          msg={tr("exp_empty_msg")}
          action={<button className="btn btn-primary" onClick={() => open("despesa")}><Icon name="plus" size={16} color="#fff" /> {tr("add_expense")}</button>} />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
          <div className="card">
            <div className="section-title" style={{ padding: "18px 18px 0" }}>{tr("exp_this_month")}</div>
            <div className="exp-filters card-pad">
              <div className="seg exp-tipo-seg">
                {["todas", "fixa", "variavel"].map((t) => (
                  <button key={t} className={tipo === t ? "on" : ""} onClick={() => setTipo(t)}>{t === "todas" ? tr("filter_all") : t === "fixa" ? tr("filter_fixed") : tr("filter_variable")}</button>
                ))}
              </div>
              <div className="exp-cat-scroll">
                <button className={"chip" + (cat === "todas" ? " sel" : "")} onClick={() => setCat("todas")}>{tr("filter_all")}</button>
                {catKeys.filter((k) => fin.despMes.some((d) => d.cat === k)).map((k) => (
                  <button key={k} className={"chip" + (cat === k ? " sel" : "")} onClick={() => setCat(k)}>
                    <span className="dot" style={{ background: cat === k ? "#fff" : BM.cats[k].color }} />{tcat(k)}
                  </button>
                ))}
              </div>
            </div>
            <div className="tbl-desktop-wrap" style={{ overflowX: "auto" }}>
              <table className="t">
                <thead><tr><th>{tr("th_expense")}</th><th>{tr("th_category")}</th><th>{tr("th_type")}</th><th>{tr("th_date")}</th><th style={{ textAlign: "right" }}>{tr("th_value")}</th><th></th></tr></thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.id}>
                      <td><div className="row" style={{ gap: 12 }}><CatBadge catKey={d.cat} size={36} r={10} /><span style={{ fontWeight: 700 }}>{d.nome}</span></div></td>
                      <td><span className="row" style={{ gap: 7, fontWeight: 600 }}><span className="dot" style={{ background: (BM.cats[d.cat] || BM.cats.outros).color }} />{tcat(d.cat)}</span></td>
                      <td><span className="chip" style={{ padding: "3px 9px" }}>{d.tipo === "fixa" ? tr("fixed") : tr("variable")}</span></td>
                      <td className="muted">{BM.fmtData(d.data)}</td>
                      <td className="tnum" style={{ textAlign: "right", fontWeight: 700, color: "var(--neg)" }}>−{BM.eur(d.valor)}</td>
                      <td><div className="row" style={{ gap: 4, justifyContent: "flex-end" }}>
                        <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => open("despesa", d)}><Icon name="edit" size={15} /></button>
                        <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => fin.despesa.remove(d.id)}><Icon name="trash" size={15} /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Versão mobile: mesma lista de linhas (.li) já usada em Rendimentos, ao
                lado — sem tabela nem scroll horizontal, tudo legível numa coluna só. */}
            <div className="list tbl-mobile-list">
              {rows.map((d) => (
                <div className="li" key={d.id}>
                  <CatBadge catKey={d.cat} size={40} r={12} />
                  <div className="li-main">
                    <div className="li-title">{d.nome}</div>
                    <div className="li-sub">{tcat(d.cat)} · {d.tipo === "fixa" ? tr("fixed") : tr("variable")} · {BM.fmtData(d.data)}</div>
                  </div>
                  <div style={{ textAlign: "right", flex: "none" }}>
                    <div className="tnum" style={{ fontWeight: 700, color: "var(--neg)" }}>−{BM.eur(d.valor)}</div>
                    <div className="row" style={{ gap: 4, justifyContent: "flex-end", marginTop: 6 }}>
                      <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => open("despesa", d)}><Icon name="edit" size={13} /></button>
                      <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => fin.despesa.remove(d.id)}><Icon name="trash" size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card-pad row" style={{ justifyContent: "space-between", borderTop: "1px solid var(--border)" }}>
              <span className="muted" style={{ fontWeight: 700, fontSize: 13 }}>{tt(rows.length === 1 ? "results_one" : "results_many", { n: rows.length })}</span>
              <span style={{ fontWeight: 700 }}>{tr("total_label")}: <span className="tnum">{BM.eur(total)}</span></span>
            </div>
          </div>

          {/* Por categoria: mesmo padrão já usado em "Origem dos rendimentos" (Rendimentos,
              ao lado) e no Painel — reaproveita fin.catBreak (já calculado), nunca inventa
              dados. Reflete sempre o mês inteiro, não a lista filtrada acima. */}
          <div className="card card-pad">
            <div className="section-title" style={{ marginBottom: 14 }}>{tr("dash_by_category")}</div>
            <div className="row donut-legend-row" style={{ gap: 20 }}>
              <DonutChart data={fin.catBreak} center={<div><div className="tnum" style={{ fontSize: 20, fontWeight: 700 }}>{BM.eur0(fin.totalGasto)}</div><div className="tiny muted" style={{ fontWeight: 600 }}>{tr("per_month")}</div></div>} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {fin.catBreak.map((c) => (
                  <div key={c.key} className="row" style={{ justifyContent: "space-between" }}>
                    <span className="row" style={{ gap: 8, fontSize: 13, fontWeight: 600 }}><span className="dot" style={{ background: c.color }} />{tcat(c.key)}</span>
                    <span className="tnum" style={{ fontWeight: 700, fontSize: 13 }}>{BM.eur0(c.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- PLANO DE POUPANÇA (calculadora com slider 10–50%) ---------- */
function SavingsPlanner({ open }) {
  const fin = useFinance();
  const tr = useT();
  const tt = (k, v) => tfmt(tr(k), v);
  const pct = fin.poupancaPct;
  const receita = fin.totalRec;
  const despesas = fin.totalGasto;
  const restante = fin.saldo;
  const planoTotal = fin.poupancaPlano;
  const jaGuardado = fin.poupadoMes;
  const disponivel = fin.disponivel;
  const semSobra = restante <= 0;
  const falta = Math.max(0, Math.round((planoTotal - jaGuardado) * 100) / 100);

  const Linha = ({ label, valor, sinal, cor, forte, big }) => (
    <div className="row" style={{ justifyContent: "space-between", padding: forte ? "12px 0 0" : "7px 0", borderTop: forte ? "1px solid var(--border)" : "none" }}>
      <span style={{ fontSize: forte ? 14 : 13.5, fontWeight: forte ? 800 : 600, color: forte ? "var(--ink)" : "var(--ink-2)" }}>{label}</span>
      <span className="tnum" style={{ fontWeight: 700, fontSize: big ? 22 : forte ? 16 : 14.5, color: cor || "var(--ink)" }}>{sinal}{BM.eur(Math.abs(valor))}</span>
    </div>
  );

  return (
    <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="section-head" style={{ marginBottom: 6 }}>
        <div>
          <div className="section-title">{tr("sp_title")}</div>
          <div className="tiny muted" style={{ fontWeight: 600, marginTop: 2 }}>{tt("sp_sub", { month: fin.monthLabel })}</div>
        </div>
        <span className="li-ico" style={{ width: 40, height: 40, background: "var(--accent-soft)" }}><Icon name="target" size={19} color="var(--accent)" sw={2} /></span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "stretch" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Linha label={tr("sp_total_income")} valor={receita} sinal="+" cor="var(--accent)" />
          <Linha label={tr("exp_total")} valor={despesas} sinal="−" cor="var(--neg)" />
          <Linha label={tr("sp_remaining")} valor={restante} sinal={restante < 0 ? "−" : ""} cor={restante < 0 ? "var(--neg)" : "var(--ink)"} forte />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: 18 }}>
          {semSobra ? (
            <div className="muted" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.55, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Icon name="info" size={18} color="var(--warn)" />
              <span>{tr("sp_nosurplus")}</span>
            </div>
          ) : (
            <>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)" }}>{tr("sp_pct_label")}</span>
                <span className="tnum" style={{ fontSize: 26, fontWeight: 700, color: "var(--accent)" }}>{pct}%</span>
              </div>
              <input type="range" min="10" max="50" step="5" value={pct} onChange={(e) => fin.setPoupancaPct(+e.target.value)} className="range" />
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="tiny muted" style={{ fontWeight: 700 }}>10%</span>
                <span className="tiny muted" style={{ fontWeight: 700 }}>50%</span>
              </div>
              <Linha label={tt("sp_savings_line", { pct })} valor={planoTotal} sinal="−" cor="var(--c-educacao)" forte />
              {jaGuardado > 0 && <Linha label={tr("sp_saved_month")} valor={jaGuardado} sinal="✓ " cor="var(--accent)" />}
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginTop: 2, padding: "12px 14px", background: "var(--accent-soft)", borderRadius: "var(--radius-sm)" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{tr("sp_available")}</div>
                  <div className="tiny muted" style={{ fontWeight: 600 }}>{tr("sp_available_sub")}</div>
                </div>
                <span className="tnum" style={{ fontWeight: 700, fontSize: 24, color: "var(--accent-ink)" }}>{BM.eur(disponivel)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {!semSobra && (
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 8, gap: 10, alignItems: "center" }}>
          {falta > 0
            ? <button className="btn btn-primary" onClick={() => open("reservar", { amount: falta })}><Icon name="target" size={15} color="#fff" /> {tt("sp_save_btn", { x: BM.eur0(falta) })}</button>
            : <span className="row tiny" style={{ fontWeight: 700, color: "var(--accent)", gap: 6 }}><Icon name="check" size={15} color="var(--accent)" /> {tr("sp_already_saved")}</span>}
        </div>
      )}
    </div>
  );
}

/* ---------- RENDIMENTOS ---------- */
function Rendimentos({ open }) {
  const fin = useFinance();
  const tr = useT();
  const tt = (k, v) => tfmt(tr(k), v);
  const INC_KEY = { "Salário": "ic_salario", "Bolsa": "ic_bolsa", "Ajuda Familiar": "ic_ajuda", "Subsídios": "ic_subsidios", "Apoios do Estado": "ic_apoios", "Freelance": "ic_freelance", "Outros": "ic_outros" };
  const ticat = (label) => { const k = INC_KEY[label]; return k ? tr(k) : label; };
  const rec = fin.rendMes.filter((r) => r.rec).reduce((s, r) => s + (+r.valor || 0), 0);
  const extra = fin.totalRec - rec;
  const rows = [...fin.rendMes].sort((a, b) => (b.data || "").localeCompare(a.data || ""));

  return (
    <div className="content">
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Kpi label={tr("inc_total")} value={BM.eur0(fin.totalRec)} icon="arrowsDown" color="var(--accent)" sub={tt(fin.rendMes.length === 1 ? "inc_source_one" : "inc_source_many", { n: fin.rendMes.length })} />
        <Kpi label={tr("inc_recurring")} value={BM.eur0(rec)} icon="cal" color="var(--c-habitacao)" sub={tr("inc_every_month")} />
        <Kpi label={tr("inc_extra")} value={BM.eur0(extra)} icon="spark" color="var(--c-educacao)" sub={tr("inc_extra_sub")} />
      </div>

      {fin.rendMes.length === 0 ? (
        <EmptyState icon="arrowsDown" title={tr("inc_empty_t")}
          msg={tr("inc_empty_msg")}
          action={<button className="btn btn-primary" onClick={() => open("rendimento")}><Icon name="plus" size={16} color="#fff" /> {tr("add_income")}</button>} />
      ) : (
        <>
        <SavingsPlanner open={open} />
        <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
          <div className="card card-pad">
            <div className="section-title" style={{ marginBottom: 6 }}>{tr("inc_this_month")}</div>
            <div className="list">
              {rows.map((r) => (
                <div className="li" key={r.id}>
                  <div className="li-ico" style={{ background: "var(--accent-soft)" }}><Icon name="arrowsDown" size={18} color="var(--accent)" sw={2} /></div>
                  <div className="li-main">
                    <div className="li-title">{r.fonte}</div>
                    <div className="li-sub">{ticat(r.cat)} · {BM.fmtData(r.data)} · {r.rec ? tr("inc_recurring_low") : tr("inc_oneoff")}</div>
                  </div>
                  <div className="li-amt tnum" style={{ color: "var(--accent)" }}>+{BM.eur(r.valor)}</div>
                  <div className="row" style={{ gap: 4 }}>
                    <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => open("rendimento", r)}><Icon name="edit" size={15} /></button>
                    <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => fin.rendimento.remove(r.id)}><Icon name="trash" size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card card-pad">
            <div className="section-title" style={{ marginBottom: 14 }}>{tr("inc_origin")}</div>
            <div className="row donut-legend-row" style={{ gap: 20 }}>
              <DonutChart data={fin.incBreak} center={<div><div className="tnum" style={{ fontSize: 20, fontWeight: 700 }}>{BM.eur0(fin.totalRec)}</div><div className="tiny muted" style={{ fontWeight: 600 }}>{tr("per_month")}</div></div>} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {fin.incBreak.map((c) => (
                  <div key={c.key} className="row" style={{ justifyContent: "space-between" }}>
                    <span className="row" style={{ gap: 8, fontSize: 13, fontWeight: 600 }}><span className="dot" style={{ background: c.color }} />{ticat(c.nome)}</span>
                    <span className="tnum" style={{ fontWeight: 700, fontSize: 13 }}>{BM.eur0(c.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { Auth, Dashboard, Despesas, Rendimentos, SavingsPlanner });