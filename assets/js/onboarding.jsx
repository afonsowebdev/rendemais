/* ===== Onboarding em 3 passos (Criar conta -> Perfil -> Finanças) =====
   Fiel aos mockups. Liga-se ao backend real:
   - iniciarRegisto (envia código) -> verificarEmail -> definirPassword.
   A verificação de email (6 dígitos) acontece no FIM, ao "Entrar no painel",
   porque o backend só cria a conta nessa altura e, assim, os 3 passos do
   mockup não são saltados.
   NOTA: "Continuar com Google/Apple" fica como "Brevemente" (o backend ainda
   não tem OAuth). Campos extra (telefone, objetivo, etc.) ficam guardados no
   perfil local — quando criares colunas no backend, é só ligá-los. */

/* Ícones dos blocos de confiança (criar conta): SVG próprio em vez de BoxIcons —
   glifos de fontes de ícones têm caixas óticas inconsistentes entre si (o bx-cloud
   por ex. fica maior/desalinhado ao lado do bx-lock-alt no mesmo tamanho), o que
   partia o alinhamento vertical destes cartões. */
function TrustIcon({ name, size = 17, color = "var(--accent)" }) {
  if (name === "shield") return <Icon name="shield" size={size} color={color} />;
  const PATHS = {
    lock: "M6 10V8a6 6 0 1 1 12 0v2M5 10h14a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a1 1 0 0 1 1-1z",
    sync: "M21 12a9 9 0 1 1-3-6.7M21 4v4h-4",
    cloud: "M7 18a4.5 4.5 0 0 1-.4-9 6 6 0 0 1 11.4.5A4.5 4.5 0 0 1 17 18H7z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

function ObOptionCard({ icon, label, sel, onClick, sub }) {
  return (
    <button type="button" className={"ob-opt" + (sel ? " sel" : "")} onClick={onClick}>
      <span className="ob-opt-ico"><i className={"bx " + icon} aria-hidden="true"></i></span>
      <span className="ob-opt-lbl">{label}</span>
      {sub && <span className="ob-opt-sub">{sub}</span>}
      <span className="ob-opt-radio" aria-hidden="true" />
    </button>
  );
}

function ObCheck({ label, on, onClick }) {
  return (
    <button type="button" className={"ob-check" + (on ? " on" : "")} onClick={onClick}>
      <span className="ob-check-box" aria-hidden="true">{on && <i className="bx bx-check"></i>}</span>
      <span>{label}</span>
    </button>
  );
}

function ObRadio({ label, on, onClick }) {
  return (
    <button type="button" className={"ob-radio" + (on ? " on" : "")} onClick={onClick}>
      <span className="ob-radio-dot" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function ObSummaryRow({ icon, label, value }) {
  return (
    <div className="ob-sum-row">
      <span className="ob-sum-ico"><i className={"bx " + icon} aria-hidden="true"></i></span>
      <span className="ob-sum-lbl">{label}</span>
      <span className="ob-sum-val">{value}</span>
    </div>
  );
}

function Onboarding({ onBack, onLogin }) {
  const fin = useFinance();

  const SITUACOES = [
    ["estudante", "Estudante", "bx-graduation"],
    ["trabalhador", "Trabalhador", "bx-briefcase"],
    ["freelancer", "Freelancer", "bx-laptop"],
    ["empresario", "Empresário", "bx-buildings"],
    ["casado", "Casado", "bx-heart"],
    ["solteiro", "Solteiro", "bx-user"],
    ["outro", "Outro", "bx-dots-horizontal-rounded"],
  ];
  const RENDIMENTOS = ["Salário", "Apoio familiar", "Bolsa", "Investimentos", "Freelancer", "Rendimentos extras", "Negócio próprio", "Outro"];
  const DESPESAS = ["Renda", "Alimentação", "Streaming", "Água", "Universidade", "Lazer", "Luz", "Ginásio", "Empréstimos", "Internet", "Saúde", "Animais", "Transportes", "Seguro", "Outro"];
  const OBJETIVOS = [
    ["casa", "Comprar casa", "bx-home"],
    ["viajar", "Viajar", "bx-plane"],
    ["carro", "Comprar carro", "bx-car"],
    ["computador", "Novo computador", "bx-laptop"],
    ["familia", "Família", "bx-group"],
    ["fundo", "Fundo de emergência", "bx-shield-quarter"],
    ["investir", "Investir", "bx-line-chart"],
    ["estudos", "Estudos", "bx-book"],
  ];
  const PREFERENCIAS = [
    ["controlar", "Controlar gastos", "Acompanhe os seus gastos e mantenha o controlo do seu dinheiro.", "bx-wallet"],
    ["poupar", "Poupança e objetivos", "Defina metas e construa o seu futuro com planeamento.", "bx-target-lock"],
    ["investir", "Investir melhor", "Organize e analise para tomar melhores decisões de investimento.", "bx-line-chart"],
  ];
  // nomes de país (o mesmo texto que o sistema usa no i18n: country_PT = "Portugal", etc.)
  const PAIS_NOME = { PT: "Portugal", ES: "Espanha", FR: "França", DE: "Alemanha", LU: "Luxemburgo", CH: "Suíça", GB: "Reino Unido", US: "Estados Unidos", CA: "Canadá", AO: "Angola" };
  const nomePais = (code) => PAIS_NOME[code] || code;

  const defPais = React.useMemo(() => BM.detectCountry(), []);
  const [step, setStep] = React.useState(1);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [okMsg, setOkMsg] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [showPw2, setShowPw2] = React.useState(false);
  const [setupToken, setSetupToken] = React.useState("");
  const [f, setF] = React.useState({
    nome: "", email: "", password: "", password2: "", termos: false,
    moeda: BM.currencyForCountry(defPais), pais: defPais, nascimento: "", telefone: "",
    preferencia: "controlar", sobre: "",
    situacao: "estudante", rendimentos: [], despesas: [], objetivo: "fundo",
    planeamento: "ainda-nao", partilha: "nao", orcamento: "",
    notificacoes: true, resumoSemanal: true, code: "",
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const onNome = (e) => { let v = e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, "").replace(/\s{2,}/g, " ").replace(/(^|\s)([a-zà-öø-ÿ])/g, (m, sp, ch) => sp + ch.toUpperCase()); setF((s) => ({ ...s, nome: v })); };
  const setPais = (code) => setF((s) => ({ ...s, pais: code, moeda: BM.currencyForCountry(code) }));
  const toggleArr = (k, v) => setF((s) => { const a = s[k] || []; return { ...s, [k]: a.includes(v) ? a.filter((x) => x !== v) : [...a, v] }; });

  const idade = calcIdade(f.nascimento);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((f.email || "").trim());
  const nomeOk = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?: [A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test((f.nome || "").trim());

  const cur = BM.currencies[f.moeda] || BM.currencies.EUR;
  const objetivoLabel = (OBJETIVOS.find((o) => o[0] === f.objetivo) || [null, "—"])[1];
  const situacaoLabel = (SITUACOES.find((o) => o[0] === f.situacao) || [null, "—"])[1];
  const preferenciaLabel = (PREFERENCIAS.find((o) => o[0] === f.preferencia) || [null, "—"])[1];
  const partilhaLabel = { nao: "Não", parceiro: "Parceiro(a)", casa: "Casa partilhada", familia: "Família" }[f.partilha];
  const paisLabel = nomePais(f.pais);

  const validaPasso1 = () => {
    if (!f.nome.trim() || !f.email.trim() || !f.password) return "Preenche o nome, o email e a palavra-passe.";
    if (!nomeOk) return "O nome só pode conter letras.";
    if (!emailOk) return "Indica um email válido.";
    if (!pwStrong(f.password)) return "A palavra-passe ainda é fraca. Cumpre todos os requisitos.";
    if (f.password !== f.password2) return "As palavras-passe não coincidem.";
    if (!f.termos) return "Tens de aceitar os Termos de Serviço e a Política de Privacidade.";
    return "";
  };
  const validaPasso2 = () => {
    if (!f.moeda) return "Escolhe a tua moeda principal.";
    if (!f.pais) return "Escolhe o teu país de residência.";
    if (idade == null) return "Indica a tua data de nascimento.";
    if (idade < 16) return "Tens de ter pelo menos 16 anos para criar conta.";
    return "";
  };

  const next = () => {
    const e = step === 1 ? validaPasso1() : step === 2 ? validaPasso2() : "";
    if (e) { setErr(e); return; }
    setErr(""); setOkMsg(""); setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => { setErr(""); setOkMsg(""); if (step === 1) return onBack && onBack(); setStep((s) => s - 1); window.scrollTo({ top: 0 }); };

  // Fim do Passo 3: dispara o registo e vai para a verificação de email.
  const finalizar = async () => {
    if (busy) return;
    setErr("");
    setBusy(true);
    try {
      await fin.iniciarRegisto({ email: f.email, nome: f.nome, moeda: f.moeda, idade });
      setOkMsg(""); setF((s) => ({ ...s, code: "" })); setStep("verify");
    } catch (e) { setErr(e.message || "Não foi possível iniciar o registo."); }
    finally { setBusy(false); }
  };
  const doVerify = async () => {
    if (busy) return;
    if (!/^\d{6}$/.test((f.code || "").trim())) { setErr("Introduz o código de 6 dígitos."); return; }
    setBusy(true); setErr("");
    try {
      const tok = await fin.verificarEmail(f.email, f.code);
      setSetupToken(tok);
      // cria a conta + sessão e guarda o perfil (os campos extra ficam no perfil local)
      await fin.definirPassword(tok, f.password, {
        idade, nascimento: f.nascimento, pais: f.pais, moeda: f.moeda, moedas: [f.moeda],
        perfil: situacaoLabel, telefone: f.telefone, preferencia: f.preferencia, sobre: f.sobre,
        situacao: f.situacao, rendimentos: f.rendimentos, despesas: f.despesas, objetivo: f.objetivo,
        planeamento: f.planeamento, partilha: f.partilha,
        notificacoes: f.notificacoes, resumoSemanal: f.resumoSemanal,
      });
      // orçamento inicial + campos ricos do perfil (guardados no estado local da sessão;
      // updateAccount só envia ao servidor os campos que ele já conhece)
      const orc = parseFloat(String(f.orcamento).replace(",", "."));
      const patch = {
        telefone: f.telefone, preferencia: f.preferencia, sobre: f.sobre,
        situacao: f.situacao, rendimentos: f.rendimentos, despesas: f.despesas, objetivo: f.objetivo,
        planeamento: f.planeamento, partilha: f.partilha,
        notificacoes: f.notificacoes, resumoSemanal: f.resumoSemanal,
      };
      if (!isNaN(orc) && orc > 0) patch.orcamento = orc;
      fin.updateAccount(patch);
      // a partir daqui fin.session passa a existir e a app abre o painel sozinha
    } catch (e) { setErr(e.message || "Não foi possível confirmar o código."); }
    finally { setBusy(false); }
  };
  const doResend = async () => {
    setErr("");
    try { await fin.reenviarCodigo(f.email); setOkMsg("Enviámos um novo código para o teu email."); }
    catch (e) { setErr(e.message || "Não foi possível reenviar o código."); }
  };

  /* ---------------- PASSO 1 — Criar conta (split marketing) ---------------- */
  if (step === 1) {
    return (
      <div className="ob1">
        <div className="ob1-form">
          <div className="ob1-form-in">
            <div className="ob1-brand"><Brand /></div>
            {onBack && <button className="ob1-back" onClick={onBack}><i className="bx bx-chevron-left"></i> Voltar ao início</button>}
            <h1 className="ob1-h1">Criar conta</h1>
            <p className="ob1-sub">Comece agora a organizar as suas finanças de forma simples e inteligente.</p>

            <div className="ob1-social">
              <button type="button" className="ob1-social-btn" title="Brevemente disponível" onClick={() => setErr("O início de sessão com Google chega em breve. Por agora, cria a tua conta com email.")}>
                <Icon name="google" size={18} /> Continuar com Google
              </button>
              <button type="button" className="ob1-social-btn" title="Brevemente disponível" onClick={() => setErr("O início de sessão com Apple chega em breve. Por agora, cria a tua conta com email.")}>
                <i className="bx bxl-apple" style={{ fontSize: 20 }}></i> Continuar com Apple
              </button>
            </div>

            <div className="ob1-sep"><span>ou</span></div>

            <Field label="Nome completo"><input className="input" value={f.nome} onChange={onNome} placeholder="Ex.: Francisco Afonso" autoComplete="name" /></Field>
            <Field label="Email"><input className="input" value={f.email} onChange={set("email")} placeholder="exemplo@dominio.pt" autoComplete="email" /></Field>
            <Field label="Senha"><PwInput value={f.password} onChange={set("password")} placeholder="Crie uma senha segura" show={showPw} toggle={() => setShowPw((v) => !v)} autoComplete="new-password" /></Field>
            <Strength value={f.password} />
            <Field label="Confirmar senha"><PwInput value={f.password2} onChange={set("password2")} placeholder="Confirme a sua senha" show={showPw2} toggle={() => setShowPw2((v) => !v)} autoComplete="new-password" disabled={!pwStrong(f.password)} /></Field>

            <button type="button" className={"ob1-terms" + (f.termos ? " on" : "")} onClick={() => setF((s) => ({ ...s, termos: !s.termos }))}>
              <span className="ob-check-box" aria-hidden="true">{f.termos && <i className="bx bx-check"></i>}</span>
              <span>Li e aceito os <a href="termos.html" target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>Termos de Serviço</a> e a <a href="privacidade.html" target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>Política de Privacidade</a></span>
            </button>

            {err && <div className="alert bad" style={{ margin: "4px 0 12px", padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}

            <button className="btn btn-primary ob1-cta" onClick={next}>Criar conta gratuita</button>

            <div className="ob1-secure"><span className="ob1-secure-ico"><Icon name="shield" size={16} color="var(--accent)" /></span><div><b>Os seus dados estão protegidos connosco.</b><span>Nunca partilhamos as suas informações.</span></div></div>

            <p className="ob1-have">Já tem conta? <button onClick={onLogin}>Iniciar sessão</button></p>

            <div className="ob1-trust">
              {[["lock", "100% Seguro", "Os seus dados estão sempre protegidos"], ["sync", "Sincronização", "Aceda às suas finanças em qualquer dispositivo"], ["cloud", "Backup automático", "Os seus dados são sempre guardados"], ["shield", "Privacidade garantida", "Nunca partilhamos as suas informações"]].map(([ic, t, d]) => (
                <div className="ob1-trust-item" key={t}><span><TrustIcon name={ic} /></span><div><b>{t}</b><small>{d}</small></div></div>
              ))}
            </div>
          </div>
        </div>

        <aside className="ob1-aside">
          <div className="ob1-aside-in">
            <div className="ob1-feat-head">
              <h2>Funcionalidades</h2>
              <p>Tudo o que precisa para ter controlo total das suas finanças pessoais.</p>
            </div>
            <div className="ob1-feat-grid">
              {[["bx-wallet", "Registo de despesas e receitas", "Adicione e categorize todas as suas movimentações de forma rápida e fácil."],
                ["bx-target-lock", "Objetivos financeiros", "Defina metas, acompanhe o progresso e conquiste os seus sonhos."],
                ["bx-calendar", "Agenda financeira", "Nunca mais perca um pagamento. Receba lembretes e mantenha-se em dia."],
                ["bx-pie-chart-alt-2", "Relatórios e gráficos", "Visualize os seus gastos e receitas com relatórios intuitivos e poderosos."],
                ["bx-credit-card", "Contas e cartões", "Gerencie todas as suas contas, cartões e saldos num só lugar."],
                ["bx-share-alt", "Partilha familiar", "Partilhe objetivos e despesas com a sua família de forma segura."]].map(([ic, t, d]) => (
                <div className="ob1-feat" key={t}><span className="ob1-feat-ico"><i className={"bx " + ic}></i></span><div><b>{t}</b><p>{d}</p></div></div>
              ))}
            </div>
            <div className="ob1-avail">
              <h3>Disponível em qualquer lugar</h3>
              <p>Aceda ao Rende+ onde estiver, quando precisar.</p>
              <div className="ob1-badges">
                <a href="#" onClick={(e) => e.preventDefault()} className="ob1-badge"><img src="assets/img/badges/apple-appstore-pt-preto.svg" alt="App Store" /></a>
                <a href="#" onClick={(e) => e.preventDefault()} className="ob1-badge"><img src="assets/img/badges/google-play-pt.png" alt="Google Play" /></a>
              </div>
            </div>
            <div className="ob1-aside-foot"><Brand size={26} /><span>O seu dinheiro. Os seus objetivos. O seu futuro.</span></div>
          </div>
        </aside>
      </div>
    );
  }

  /* ---------------- VERIFICAÇÃO DE EMAIL (fim) ---------------- */
  if (step === "verify") {
    return (
      <div className="ob-verify-wrap">
        <div className="ob-verify-card">
          <div className="ob1-brand" style={{ marginBottom: 18 }}><Brand /></div>
          <h1 className="ob1-h1" style={{ fontSize: 26 }}>Confirma o teu email</h1>
          <p className="ob1-sub">Enviámos um código de 6 dígitos para <strong>{f.email}</strong>. Escreve-o aqui para concluir a criação da conta.</p>
          {okMsg && <div className="alert ok" style={{ margin: "0 0 14px", padding: "10px 12px" }}><Icon name="check" size={16} color="var(--accent)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{okMsg}</span></div>}
          <Field label="Código de verificação">
            <input className="input tnum" value={f.code} onChange={(e) => setF((s) => ({ ...s, code: e.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="000000" inputMode="numeric" maxLength={6} autoFocus style={{ letterSpacing: ".3em", fontSize: 18, textAlign: "center" }} />
          </Field>
          <div style={{ textAlign: "center", margin: "-2px 0 10px" }}>
            <button type="button" onClick={doResend} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", fontSize: 12.5, cursor: "pointer", padding: 0 }}>Não recebeste? Reenviar código</button>
          </div>
          {err && <div className="alert bad" style={{ marginBottom: 12, padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
          <style>{`@keyframes rmaisSpin{to{transform:rotate(360deg)}}`}</style>
          <button className="btn btn-primary" disabled={busy} style={{ width: "100%", justifyContent: "center", padding: 13, fontSize: 15 }} onClick={doVerify}>
            {busy && <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.45)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", marginRight: 8, animation: "rmaisSpin .6s linear infinite", verticalAlign: "-2px" }} />}
            {busy ? "A criar conta…" : "Confirmar e entrar"}
          </button>
          <p className="ob1-have"><button onClick={() => { setStep(3); setErr(""); }}>Voltar e rever os dados</button></p>
        </div>
      </div>
    );
  }

  /* ---------------- CHROME comum aos passos 2 e 3 ---------------- */
  const pct = step === 2 ? 67 : 100;
  const chrome = (main, aside) => (
    <div className="ob">
      <header className="ob-top">
        <div className="ob-top-brand"><Brand /></div>
        <div className="ob-top-prog">
          <div className="ob-top-prog-lbl"><b>Passo {step} de 3</b><span>{pct}%</span></div>
          <div className="ob-prog-bar"><i style={{ width: pct + "%" }} /></div>
        </div>
        <div className="ob-top-user"><span className="ob-avatar">{(f.nome || "?").trim().slice(0, 2).toUpperCase() || "FA"}</span></div>
      </header>
      <div className="ob-body">
        <main className="ob-main">{main}</main>
        <aside className="ob-aside">{aside}</aside>
      </div>
    </div>
  );

  /* ---------------- PASSO 2 — Configurar o perfil ---------------- */
  if (step === 2) {
    const main = (
      <>
        <h1 className="ob-title">Configurar o seu perfil</h1>
        <p className="ob-lead">Quase lá! Complete as informações abaixo para personalizar a sua experiência no Rende+.</p>

        <section className="ob-sec">
          <h3 className="ob-sec-t">Informações pessoais</h3>
          <div className="ob-grid2">
            <Field label="Nome completo"><input className="input" value={f.nome} onChange={onNome} placeholder="Ex.: Francisco Afonso" /></Field>
            <Field label="Email"><input className="input" value={f.email} onChange={set("email")} placeholder="exemplo@dominio.pt" /></Field>
          </div>
          <div className="ob-note tiny"><Icon name="lock" size={13} color="var(--ink-3)" /> A palavra-passe já foi definida no passo anterior.</div>
        </section>

        <section className="ob-sec">
          <h3 className="ob-sec-t">Informações adicionais</h3>
          <div className="ob-grid2">
            <Field label="Moeda principal">
              <select className="select" value={f.moeda} onChange={set("moeda")}>
                {Object.values(BM.currencies).map((c) => <option key={c.code} value={c.code}>{c.nome} ({c.sym})</option>)}
              </select>
            </Field>
            <Field label="País de residência">
              <select className="select" value={f.pais} onChange={(e) => setPais(e.target.value)}>
                {BM.countries.map((c) => <option key={c.code} value={c.code}>{nomePais(c.code)}</option>)}
              </select>
            </Field>
            <Field label="Data de nascimento" hint="Calculamos a tua idade a partir desta data (mínimo 16 anos).">
              <input className="input" type="date" value={f.nascimento} max={BM.todayISO()} onChange={(e) => setF((s) => ({ ...s, nascimento: e.target.value }))} />
              {idade != null && <div className="tiny" style={{ marginTop: 6, fontWeight: 700, color: idade < 16 ? "var(--neg)" : "var(--accent)" }}>{idade < 16 ? `Tens ${idade} anos — a idade mínima é 16.` : `Tens ${idade} anos.`}</div>}
            </Field>
            <Field label="Telefone (opcional)"><input className="input" value={f.telefone} onChange={set("telefone")} placeholder="+351 912 345 678" inputMode="tel" /></Field>
          </div>
        </section>

        <section className="ob-sec">
          <h3 className="ob-sec-t">Preferências financeiras</h3>
          <div className="ob-pref-grid">
            {PREFERENCIAS.map(([id, t, d, ic]) => (
              <button type="button" key={id} className={"ob-pref" + (f.preferencia === id ? " sel" : "")} onClick={() => setF((s) => ({ ...s, preferencia: id }))}>
                <span className="ob-pref-ico"><i className={"bx " + ic}></i></span>
                <b>{t}</b><span>{d}</span>
                <span className="ob-opt-radio" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section className="ob-sec">
          <h3 className="ob-sec-t">Sobre si <span className="ob-opt-tag">opcional</span></h3>
          <p className="ob-sec-d">Conte-nos um pouco sobre os seus objetivos financeiros.</p>
          <div style={{ position: "relative" }}>
            <textarea className="input" rows={3} maxLength={250} value={f.sobre} onChange={set("sobre")} placeholder="Ex.: Quero juntar dinheiro para viajar, comprar uma casa, aposentar-me…" style={{ resize: "vertical", minHeight: 92 }} />
            <span className="ob-count">{(f.sobre || "").length}/250</span>
          </div>
        </section>

        {err && <div className="alert bad" style={{ margin: "4px 0 0", padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}

        <div className="ob-actions">
          <button className="btn btn-ghost" onClick={back}><Icon name="chevR" size={15} style={{ transform: "rotate(180deg)" }} /> Voltar</button>
          <button className="btn btn-primary" onClick={next}>Continuar <Icon name="chevR" size={15} color="#fff" /></button>
        </div>
      </>
    );
    const aside = (
      <>
        <div className="ob-card">
          <h4 className="ob-card-t">As suas preferências</h4>
          <p className="ob-card-d">Personalize o Rende+ ao seu estilo.</p>
          <div className="ob-pref-row"><span className="ob-pref-row-ico"><i className="bx bx-bell"></i></span><div><b>Notificações</b><span>Receba alertas e lembretes</span></div><button type="button" className={"ob-switch" + (f.notificacoes ? " on" : "")} onClick={() => setF((s) => ({ ...s, notificacoes: !s.notificacoes }))} aria-label="Notificações"><i /></button></div>
          <div className="ob-pref-row"><span className="ob-pref-row-ico"><i className="bx bx-calendar"></i></span><div><b>Resumo semanal</b><span>Receba um resumo por email</span></div><button type="button" className={"ob-switch" + (f.resumoSemanal ? " on" : "")} onClick={() => setF((s) => ({ ...s, resumoSemanal: !s.resumoSemanal }))} aria-label="Resumo semanal"><i /></button></div>
        </div>
        <div className="ob-card ob-card-soft">
          <div className="ob-card-lock"><Icon name="lock" size={16} color="var(--accent)" /></div>
          <h4 className="ob-card-t">Por que estas informações?</h4>
          <p className="ob-card-d">Estas informações ajudam-nos a personalizar a sua experiência e oferecer sugestões mais relevantes para si.</p>
        </div>
        <div className="ob-card">
          <h4 className="ob-card-t">Resumo da sua conta</h4>
          <ObSummaryRow icon="bx-dollar-circle" label="Moeda" value={`${cur.nome} (${cur.sym})`} />
          <ObSummaryRow icon="bx-world" label="País" value={paisLabel} />
          <ObSummaryRow icon="bx-target-lock" label="Objetivo principal" value={preferenciaLabel} />
          <ObSummaryRow icon="bx-bell" label="Notificações" value={f.notificacoes ? "Ativadas" : "Desativadas"} />
          <ObSummaryRow icon="bx-calendar" label="Resumo semanal" value={f.resumoSemanal ? "Ativado" : "Desativado"} />
        </div>
        <div className="ob-tip"><span className="ob-tip-ico"><i className="bx bx-bulb"></i></span><div><b>Dica</b><span>Pode alterar todas estas informações mais tarde nas definições da sua conta.</span></div></div>
      </>
    );
    return chrome(main, aside);
  }

  /* ---------------- PASSO 3 — Configurar as finanças ---------------- */
  const main = (
    <>
      <h1 className="ob-title">Vamos configurar as suas finanças 🎉</h1>
      <p className="ob-lead">Dedique apenas 2 minutos para personalizar a sua experiência. Quanto mais informação fornecer, melhores serão os relatórios e sugestões.</p>

      <div className="ob-grid2 ob-grid2-cards">
        <section className="ob-block">
          <h3 className="ob-block-t"><span className="ob-num">1</span> Situação atual</h3>
          <p className="ob-block-d">Selecione a opção que melhor descreve a sua situação.</p>
          <div className="ob-opt-grid">
            {SITUACOES.map(([id, lbl, ic]) => <ObOptionCard key={id} icon={ic} label={lbl} sel={f.situacao === id} onClick={() => setF((s) => ({ ...s, situacao: id }))} />)}
          </div>
        </section>

        <section className="ob-block">
          <h3 className="ob-block-t"><span className="ob-num">2</span> Fontes de rendimento</h3>
          <p className="ob-block-d">Selecione todas as suas fontes de rendimento.</p>
          <div className="ob-check-grid">
            {RENDIMENTOS.map((r) => <ObCheck key={r} label={r} on={f.rendimentos.includes(r)} onClick={() => toggleArr("rendimentos", r)} />)}
          </div>
        </section>

        <section className="ob-block">
          <h3 className="ob-block-t"><span className="ob-num">3</span> Principais despesas</h3>
          <p className="ob-block-d">Selecione as despesas que fazem parte do seu dia a dia.</p>
          <div className="ob-check-grid">
            {DESPESAS.map((d) => <ObCheck key={d} label={d} on={f.despesas.includes(d)} onClick={() => toggleArr("despesas", d)} />)}
          </div>
        </section>

        <section className="ob-block">
          <h3 className="ob-block-t"><span className="ob-num">4</span> Objetivo financeiro principal</h3>
          <p className="ob-block-d">Qual é o seu maior objetivo neste momento?</p>
          <div className="ob-goal-grid">
            {OBJETIVOS.map(([id, lbl, ic]) => (
              <button type="button" key={id} className={"ob-goal" + (f.objetivo === id ? " sel" : "")} onClick={() => setF((s) => ({ ...s, objetivo: id }))}>
                <i className={"bx " + ic}></i><span>{lbl}</span><span className="ob-opt-radio" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="ob-grid3">
        <section className="ob-block">
          <h3 className="ob-block-t"><span className="ob-num">5</span> Planeamento</h3>
          <p className="ob-block-d">Costuma fazer orçamento mensal?</p>
          {[["sim", "Sim, todos os meses"], ["ainda-nao", "Ainda não"], ["comecar", "Quero começar"]].map(([id, lbl]) => <ObRadio key={id} label={lbl} on={f.planeamento === id} onClick={() => setF((s) => ({ ...s, planeamento: id }))} />)}
        </section>
        <section className="ob-block">
          <h3 className="ob-block-t"><span className="ob-num">6</span> Partilha de despesas</h3>
          <p className="ob-block-d">Partilha despesas com alguém?</p>
          {[["nao", "Não"], ["parceiro", "Parceiro(a)"], ["casa", "Casa partilhada"], ["familia", "Família"]].map(([id, lbl]) => <ObRadio key={id} label={lbl} on={f.partilha === id} onClick={() => setF((s) => ({ ...s, partilha: id }))} />)}
        </section>
        <section className="ob-block">
          <h3 className="ob-block-t"><span className="ob-num">7</span> Moeda e orçamento inicial <span className="ob-opt-tag">opcional</span></h3>
          <p className="ob-block-d">Defina a moeda e o valor aproximado disponível por mês.</p>
          <Field label="Moeda principal">
            <select className="select" value={f.moeda} onChange={set("moeda")}>
              {Object.values(BM.currencies).map((c) => <option key={c.code} value={c.code}>{c.nome} ({c.sym})</option>)}
            </select>
          </Field>
          <Field label="Orçamento mensal disponível">
            <div style={{ position: "relative" }}>
              <input className="input tnum" value={f.orcamento} onChange={(e) => setF((s) => ({ ...s, orcamento: e.target.value.replace(/[^\d.,]/g, "") }))} placeholder="1.000,00" inputMode="decimal" style={{ paddingRight: 42 }} />
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "var(--ink-3)" }}>{cur.sym}</span>
            </div>
          </Field>
          <div className="ob-inline-note"><Icon name="info" size={14} color="var(--accent)" /> Pode editar estas informações mais tarde nas definições.</div>
        </section>
      </div>

      {err && <div className="alert bad" style={{ margin: "16px 0 0", padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}

      <div className="ob-trust-strip">
        {[["lock", "Os seus dados estão protegidos", "Utilizamos encriptação de ponta a ponta."], ["shield", "Privacidade garantida", "Nunca partilhamos os seus dados."], ["shield", "100% Seguro", "Os seus dados estão sempre protegidos."], ["sync", "Pode alterar depois", "Todas as configurações podem ser alteradas."]].map(([ic, t, d]) => (
          <div className="ob-trust-strip-item" key={t}><span><TrustIcon name={ic} size={18} /></span><div><b>{t}</b><small>{d}</small></div></div>
        ))}
      </div>
    </>
  );
  const aside = (
    <>
      <div className="ob-card">
        <h4 className="ob-card-t">Resumo da sua configuração</h4>
        <p className="ob-card-d">Revise as suas informações antes de entrar no Rende+.</p>
        <ObSummaryRow icon="bx-user" label="Situação atual" value={situacaoLabel} />
        <ObSummaryRow icon="bx-wallet" label="Fontes de rendimento" value={`${f.rendimentos.length} selecionada(s)`} />
        <ObSummaryRow icon="bx-receipt" label="Principais despesas" value={`${f.despesas.length} selecionada(s)`} />
        <ObSummaryRow icon="bx-target-lock" label="Objetivo principal" value={objetivoLabel} />
        <ObSummaryRow icon="bx-dollar-circle" label="Orçamento mensal" value={f.orcamento ? `${f.orcamento} ${cur.sym}` : "—"} />
        <ObSummaryRow icon="bx-world" label="Moeda" value={`${cur.nome} (${cur.sym})`} />
        <ObSummaryRow icon="bx-group" label="Partilha de despesas" value={partilhaLabel} />
      </div>
      <div className="ob-card ob-card-soft ob-final">
        <h4 className="ob-card-t">Está quase lá! 🎉</h4>
        <p className="ob-card-d">Com estas informações o Rende+ poderá oferecer uma experiência personalizada para si.</p>
        <style>{`@keyframes rmaisSpin{to{transform:rotate(360deg)}}`}</style>
        <button className="btn btn-primary" disabled={busy} style={{ width: "100%", justifyContent: "center", padding: 13, fontSize: 15, marginTop: 4 }} onClick={finalizar}>
          {busy && <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.45)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", marginRight: 8, animation: "rmaisSpin .6s linear infinite", verticalAlign: "-2px" }} />}
          {busy ? "A preparar…" : <>Entrar no painel <Icon name="chevR" size={16} color="#fff" /></>}
        </button>
        <button className="ob-back-link" onClick={back}><Icon name="chevR" size={14} style={{ transform: "rotate(180deg)" }} /> Voltar</button>
      </div>
    </>
  );
  return chrome(main, aside);
}

window.Onboarding = Onboarding;