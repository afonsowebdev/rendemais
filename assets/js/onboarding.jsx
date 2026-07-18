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

function ObOptionCard({ icon, label, sel, onClick, sub, disabled }) {
  return (
    <button type="button" className={"ob-opt" + (sel ? " sel" : "") + (disabled ? " disabled" : "")} onClick={onClick} disabled={disabled} aria-disabled={disabled}>
      <span className="ob-opt-ico"><i className={"bx " + icon} aria-hidden="true"></i></span>
      <span className="ob-opt-lbl">{label}</span>
      {sub && <span className="ob-opt-sub">{sub}</span>}
      <span className="ob-opt-radio" aria-hidden="true" />
    </button>
  );
}

function ObCheck({ label, on, onClick, disabled }) {
  return (
    <button type="button" className={"ob-check" + (on ? " on" : "") + (disabled ? " disabled" : "")} onClick={onClick} disabled={disabled} aria-disabled={disabled}>
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

const MESES_NOME = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/* Seletor de data de nascimento (Dia / Mês / Ano) — guarda sempre ISO (YYYY-MM-DD).
   Os próprios seletores impedem datas futuras (em vez de validar depois): o ano nunca
   passa do atual, o mês fica limitado ao mês atual quando o ano escolhido é o atual, e o
   dia segue o mesmo raciocínio — o que também resolve bissextos automaticamente, porque
   o número de dias vem sempre de new Date(ano, mes, 0). */
function DateOfBirthPicker({ value, onChange }) {
  const parse = (iso) => { const p = String(iso || "").split("-").map((v) => parseInt(v, 10)); return { d: p[2] || "", m: p[1] || "", y: p[0] || "" }; };
  const [sel, setSel] = React.useState(() => parse(value));
  const hoje = new Date();
  const anoMax = hoje.getFullYear();
  const anos = Array.from({ length: 101 }, (_, i) => anoMax - i);
  const diasNoMes = (y, m) => (y && m) ? new Date(y, m, 0).getDate() : 31;

  const isAnoAtual = sel.y && +sel.y === anoMax;
  const mesMax = isAnoAtual ? hoje.getMonth() + 1 : 12;
  const meses = MESES_NOME.slice(0, mesMax);
  const isMesAtual = isAnoAtual && sel.m && +sel.m === mesMax;
  const diaMax = isMesAtual ? hoje.getDate() : diasNoMes(sel.y || anoMax, sel.m || 1);
  const dias = Array.from({ length: diaMax }, (_, i) => i + 1);

  const update = (patch) => {
    const next = { ...sel, ...patch };
    const nAnoAtual = next.y && +next.y === anoMax;
    const nMesMax = nAnoAtual ? hoje.getMonth() + 1 : 12;
    if (next.m && next.m > nMesMax) next.m = nMesMax;
    const nMesAtual = nAnoAtual && next.m && +next.m === nMesMax;
    const nDiaMax = nMesAtual ? hoje.getDate() : diasNoMes(next.y || anoMax, next.m || 1);
    if (next.d && next.d > nDiaMax) next.d = nDiaMax;
    setSel(next);
    onChange(next.d && next.m && next.y ? `${next.y}-${String(next.m).padStart(2, "0")}-${String(next.d).padStart(2, "0")}` : "");
  };

  return (
    <div className="ob-dob-grid">
      <select className="select" aria-label="Dia de nascimento" value={sel.d} onChange={(e) => update({ d: +e.target.value })}>
        <option value="" disabled>Dia</option>
        {dias.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <select className="select" aria-label="Mês de nascimento" value={sel.m} onChange={(e) => update({ m: +e.target.value })}>
        <option value="" disabled>Mês</option>
        {meses.map((nome, i) => <option key={nome} value={i + 1}>{nome}</option>)}
      </select>
      <select className="select" aria-label="Ano de nascimento" value={sel.y} onChange={(e) => update({ y: +e.target.value })}>
        <option value="" disabled>Ano</option>
        {anos.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  );
}

/* `mode="profile"` reaproveita os mesmos ecrãs 2/3 fora do registo — como um
   convite opcional, pós-login, para completar o perfil que o registo rápido
   (só nome+email+código+password) deixou por preencher. Não cria conta nem
   sessão nova; grava com fin.updateAccount e fecha com onDone. */
function Onboarding({ onBack, onLogin, mode = "signup", onDone }) {
  const fin = useFinance();
  const isProfileMode = mode === "profile";

  const SITUACOES = [
    ["estudante", "Estudante", "bx-graduation"],
    ["trabalhador", "Trabalhador", "bx-briefcase"],
    ["freelancer", "Freelancer", "bx-laptop"],
    ["empresario", "Empresário", "bx-buildings"],
    ["casado", "Casado", "bx-heart"],
    ["vive-sozinho", "Vive sozinho", "bx-user"],
    ["casa-partilhada", "Vive numa casa partilhada", "bx-group"],
    ["outro", "Outro", "bx-dots-horizontal-rounded"],
  ];
  // As mesmas chaves que assets/js/data.js usa em BM.incomeCats — para que a escolha
  // no onboarding seja diretamente a opção mostrada no modal "Novo rendimento" (sem tradução).
  const RENDIMENTOS = Object.keys(BM.incomeCats);
  const DESPESAS = ["Renda", "Água", "Eletricidade", "Gás", "Internet", "Alimentação", "Transporte", "Educação", "Saúde", "Seguros", "Subscrições", "Lazer", "Telecomunicações", "Outro"];
  const OBJETIVOS = [
    ["fundo", "Fundo de emergência", "bx-shield-quarter"],
    ["casa", "Comprar casa", "bx-home"],
    ["carro", "Comprar carro", "bx-car"],
    ["viagem", "Viagem", "bx-plane"],
    ["educacao", "Educação", "bx-book"],
    ["tecnologia", "Tecnologia", "bx-laptop"],
    ["familia", "Família", "bx-group"],
    ["saude", "Saúde", "bx-heart"],
    ["investimento", "Investimento", "bx-line-chart"],
    ["outro", "Outro", "bx-dots-horizontal-rounded"],
  ];
  // "Como pretende utilizar o Rende+?" — até 3 prioridades, usadas para personalizar o painel.
  const PREFERENCIAS = [
    ["controlar", "Controlar despesas", "bx-wallet"],
    ["orcamento", "Organizar o orçamento mensal", "bx-receipt"],
    ["objetivos", "Criar objetivos financeiros", "bx-target-lock"],
    ["partilhadas", "Gerir despesas partilhadas", "bx-group"],
    ["pagamentos", "Acompanhar pagamentos futuros", "bx-calendar"],
    ["habitos", "Melhorar hábitos financeiros", "bx-line-chart"],
  ];
  // nomes de país (o mesmo texto que o sistema usa no i18n: country_PT = "Portugal", etc.)
  const PAIS_NOME = { PT: "Portugal", ES: "Espanha", FR: "França", DE: "Alemanha", LU: "Luxemburgo", CH: "Suíça", GB: "Reino Unido", US: "Estados Unidos", CA: "Canadá", AO: "Angola" };
  const nomePais = (code) => PAIS_NOME[code] || code;

  const defPais = React.useMemo(() => BM.detectCountry(), []);
  // Rascunho local: permite continuar o registo depois de recarregar a página.
  // Nunca guarda password/código. Não se aplica ao modo "profile" (a conta já existe).
  const DRAFT_KEY = "rende_onboarding_draft";
  const draft = React.useMemo(() => { if (isProfileMode) return null; try { const s = localStorage.getItem(DRAFT_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }, []);
  const limparRascunho = () => { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} };

  // O registo passou a ser só o Passo 1 (nome+email+nascimento) — os passos 2/3
  // só existem hoje dentro do modo "profile" (convite pós-login). Por isso o registo
  // começa sempre no Passo 1, mesmo que exista um rascunho antigo de um passo 2/3
  // (de antes desta simplificação) — só o nome/email desse rascunho são reaproveitados.
  const [step, setStep] = React.useState(() => (isProfileMode ? 2 : 1));
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [okMsg, setOkMsg] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [showPw2, setShowPw2] = React.useState(false);
  const [moedaAberta, setMoedaAberta] = React.useState(false);
  const [addingCatOb, setAddingCatOb] = React.useState(false);
  const [setupToken, setSetupToken] = React.useState("");
  const SEL_MAX = 3;
  const [f, setF] = React.useState(() => {
    const base = {
      nome: (isProfileMode && fin.account && fin.account.nome) || "",
      email: (isProfileMode && fin.account && fin.account.email) || "",
      password: "", password2: "", termos: false,
      moeda: BM.currencyForCountry(defPais), pais: defPais, nascimento: "",
      preferencia: [], situacao: ["estudante"], rendimentos: [], despesas: [], objetivo: ["fundo"],
      planeamento: "mais-tarde", partilha: "nao", orcamento: "",
      notificacoes: true, resumoSemanal: true, code: "",
    };
    return draft && draft.f ? { ...base, ...draft.f, password: "", password2: "", code: "" } : base;
  });
  // grava o rascunho sempre que muda (só até à conta ficar criada — ver criarPassword;
  // não se aplica ao modo "profile", que não tem rascunho)
  React.useEffect(() => {
    if (isProfileMode || typeof step !== "number" || step > 3) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, f: { ...f, password: "", password2: "", code: "" } })); } catch (e) {}
  }, [step, f]);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const onNome = (e) => { let v = e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, "").replace(/\s{2,}/g, " ").replace(/(^|\s)([a-zà-öø-ÿ])/g, (m, sp, ch) => sp + ch.toUpperCase()); setF((s) => ({ ...s, nome: v })); };
  const setPais = (code) => setF((s) => ({ ...s, pais: code, moeda: BM.currencyForCountry(code) }));
  const toggleArr = (k, v, max) => setF((s) => {
    const a = s[k] || [];
    if (a.includes(v)) return { ...s, [k]: a.filter((x) => x !== v) };
    if (max && a.length >= max) return s;
    return { ...s, [k]: [...a, v] };
  });

  const idade = calcIdade(f.nascimento);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((f.email || "").trim());
  const nomeOk = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?: [A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test((f.nome || "").trim());

  const cur = BM.currencies[f.moeda] || BM.currencies.EUR;
  const labelsOf = (lista, ids) => ids.map((id) => (lista.find((o) => o[0] === id) || [null, id])[1]);
  const objetivoLabel = f.objetivo.length ? labelsOf(OBJETIVOS, f.objetivo).join(", ") : "—";
  const situacaoLabel = f.situacao.length ? labelsOf(SITUACOES, f.situacao).join(", ") : "—";
  const preferenciaLabel = f.preferencia.length ? labelsOf(PREFERENCIAS, f.preferencia).join(", ") : "—";
  const partilhaLabel = { nao: "Não", parceiro: "Com parceiro ou parceira", familia: "Com família", casa: "Numa casa partilhada", grupo: "Em grupos ocasionais" }[f.partilha];
  const paisLabel = nomePais(f.pais);

  const validaPasso1 = () => {
    if (!f.nome.trim() || !f.email.trim()) return "Preenche o nome e o email.";
    if (!nomeOk) return "O nome só pode conter letras.";
    if (!emailOk) return "Introduza um endereço de email válido.";
    if (idade == null) return "Indica a tua data de nascimento.";
    if (idade < 16) return "Tens de ter pelo menos 16 anos para criar conta.";
    if (!f.termos) return "Tens de aceitar os Termos de Serviço e a Política de Privacidade.";
    return "";
  };
  const validaPasso2 = () => {
    if (!f.moeda) return "Escolhe a tua moeda principal.";
    if (!f.pais) return "Escolhe o teu país de residência.";
    return "";
  };

  const next = () => {
    const e = step === 1 ? validaPasso1() : step === 2 ? validaPasso2() : "";
    if (e) { setErr(e); return; }
    setErr(""); setOkMsg(""); setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => {
    setErr(""); setOkMsg("");
    if (isProfileMode && step === 2) return onDone && onDone(); // "Agora não" — fecha sem guardar
    if (step === 1) return onBack && onBack();
    setStep((s) => s - 1);
    window.scrollTo({ top: 0 });
  };

  // Passo 1 (registo rápido): nome + email + data de nascimento só. Dispara o registo
  // e vai para a verificação de email — o resto do perfil fica para depois (ver
  // guardarPerfil, chamado a partir do modo "profile").
  const criarConta = async () => {
    if (busy) return;
    const e = validaPasso1();
    if (e) { setErr(e); return; }
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
      // Email confirmado. SÓ AGORA pedimos a palavra-passe (passo seguinte).
      setOkMsg(""); setStep("password");
    } catch (e) { setErr(e.message || "Não foi possível confirmar o código."); }
    finally { setBusy(false); }
  };
  // Cria a palavra-passe (depois do email confirmado) e a conta em si.
  const criarPassword = async () => {
    if (busy) return;
    if (!pwStrong(f.password)) { setErr("A palavra-passe ainda é fraca. Cumpre todos os requisitos."); return; }
    if (f.password !== f.password2) { setErr("As palavras-passe não coincidem."); return; }
    if (!setupToken) { setErr("A sessão de configuração expirou. Confirma o email de novo."); setStep("verify"); return; }
    setBusy(true); setErr("");
    // Marca, ANTES de criar a sessão, que esta conta ainda não passou pelo convite
    // opcional de completar o perfil — tem de existir antes do fin.definirPassword
    // resolver, porque essa chamada já atualiza fin.account e pode disparar a
    // verificação no Shell antes do resto desta função continuar.
    try { localStorage.setItem("rende_perfil_pendente_" + f.email.trim().toLowerCase(), "1"); } catch (e) {}
    try {
      // cria a conta + sessão e guarda o perfil (o backend recebe tudo de uma vez)
      await fin.definirPassword(setupToken, f.password, {
        idade, nascimento: f.nascimento, pais: f.pais, moeda: f.moeda, moedas: [f.moeda],
        perfil: situacaoLabel, preferencia: f.preferencia,
        situacao: f.situacao, fontesRendimento: f.rendimentos, principaisDespesas: f.despesas, objetivo: f.objetivo,
        planeamento: f.planeamento, partilha: f.partilha,
        notificacoes: f.notificacoes, resumoSemanal: f.resumoSemanal,
      });
      // Cria já os objetivos escolhidos (reais, com 0 guardado / 0% de progresso — nunca inventa valores).
      if (f.objetivo.length) {
        await Promise.all(f.objetivo.map((id) => {
          const nome = (OBJETIVOS.find((o) => o[0] === id) || [null, id])[1];
          return fin.meta.add({ nome, alvo: 0, atual: 0 });
        }));
      }
      // O perfil já foi gravado pelo definir-password. Só falta o orçamento inicial, se o utilizador o definiu.
      const orc = parseFloat(String(f.orcamento).replace(",", "."));
      if (!isNaN(orc) && orc > 0) fin.updateAccount({ orcamento: orc });
      limparRascunho();
      // a partir daqui fin.session passa a existir e a app abre o painel sozinha
    } catch (e) { setErr(e.message || "Não foi possível criar a palavra-passe."); }
    finally { setBusy(false); }
  };
  // Modo "profile": grava o perfil (passos 2/3) numa conta já existente, sem criar
  // sessão nova nem passar por verificação de email/password.
  const guardarPerfil = async () => {
    if (busy) return;
    setErr(""); setBusy(true);
    try {
      await fin.updateAccount({
        pais: f.pais, moeda: f.moeda, moedas: [f.moeda],
        perfil: situacaoLabel, preferencia: f.preferencia,
        situacao: f.situacao, fontesRendimento: f.rendimentos, principaisDespesas: f.despesas, objetivo: f.objetivo,
        planeamento: f.planeamento, partilha: f.partilha,
        notificacoes: f.notificacoes, resumoSemanal: f.resumoSemanal,
      });
      if (f.objetivo.length) {
        await Promise.all(f.objetivo.map((id) => {
          const nome = (OBJETIVOS.find((o) => o[0] === id) || [null, id])[1];
          return fin.meta.add({ nome, alvo: 0, atual: 0 });
        }));
      }
      const orc = parseFloat(String(f.orcamento).replace(",", "."));
      if (!isNaN(orc) && orc > 0) fin.updateAccount({ orcamento: orc });
      try { localStorage.removeItem("rende_perfil_pendente_" + (f.email || "").trim().toLowerCase()); } catch (e) {}
      onDone && onDone();
    } catch (e) { setErr(e.message || "Não foi possível guardar o perfil."); }
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
            <div className="ob1-brand ob1-brand-center"><Brand /></div>
            {onBack && <button className="auth-back auth-back-strong" onClick={onBack}><i className="bx bx-chevron-left" aria-hidden="true"></i> Voltar</button>}
            <h1 className="ob1-h1">Crie a sua conta</h1>
            <p className="ob1-sub">Comece a organizar a sua vida financeira com o Rende+.</p>
            <p className="ob1-sub-note">Registe-se em menos de um minuto — o resto do perfil configura-se depois, com calma.</p>

            <Field label="Nome completo"><input className="input" value={f.nome} onChange={onNome} placeholder="Ex.: Francisco Afonso" autoComplete="name" /></Field>
            <Field label="Email"><input className="input" value={f.email} onChange={set("email")} placeholder="exemplo@dominio.pt" autoComplete="email" /></Field>
            <Field label="Data de nascimento" hint="Idade mínima: 16 anos.">
              <DateOfBirthPicker value={f.nascimento} onChange={(iso) => setF((s) => ({ ...s, nascimento: iso }))} />
              {idade != null && <div className="tiny" style={{ marginTop: 6, fontWeight: 700, color: idade < 16 ? "var(--neg)" : "var(--accent)" }}>{idade < 16 ? `Tens ${idade} anos — a idade mínima é 16.` : `Tens ${idade} anos.`}</div>}
            </Field>

            <button type="button" className={"ob1-terms" + (f.termos ? " on" : "")} onClick={() => setF((s) => ({ ...s, termos: !s.termos }))}>
              <span className="ob-check-box" aria-hidden="true">{f.termos && <i className="bx bx-check"></i>}</span>
              <span>Ao criar uma conta, confirma que leu e aceita os <a href="termos.html" target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>Termos de Serviço</a> e a <a href="privacidade.html" target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>Política de Privacidade</a>.</span>
            </button>

            {err && <div className="alert bad" style={{ margin: "4px 0 12px", padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}

            <button className="btn btn-primary ob1-cta" disabled={busy} onClick={criarConta}>{busy ? "A criar…" : "Criar Conta"}</button>

            <div className="ob1-sep"><span>Também pode continuar com</span></div>

            <div className="ob1-social">
              <button type="button" className="ob1-social-btn" title="Brevemente disponível" onClick={() => setErr("O início de sessão com Google chega em breve. Por agora, cria a tua conta com email.")}>
                <Icon name="google" size={18} /> Continuar com Google
              </button>
              <button type="button" className="ob1-social-btn" title="Brevemente disponível" onClick={() => setErr("O início de sessão com Apple chega em breve. Por agora, cria a tua conta com email.")}>
                <i className="bx bxl-apple" style={{ fontSize: 20 }}></i> Continuar com Apple
              </button>
            </div>

            <p className="ob1-have">Já tem conta? <button onClick={onLogin}>Iniciar sessão</button></p>
          </div>
        </div>

        <aside className="ob1-aside">
          <div className="ob1-aside-in">
            <span className="lp2-tag">Comece gratuitamente</span>
            <h2 className="login-aside-h1">Organize hoje a sua vida financeira.</h2>
            <p className="login-aside-sub">Crie a sua conta e tenha acesso a ferramentas para acompanhar transações, objetivos, orçamento e despesas partilhadas.</p>
            <ul className="lp2-checks">
              {["Configuração simples.", "Sem cartão de crédito.", "Dados protegidos.", "Acesso em desktop e mobile."].map((t) => (
                <li key={t}><Icon name="check" size={17} color="var(--accent)" sw={2.4} /> {t}</li>
              ))}
            </ul>
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
          <p className="ob1-sub">Enviámos um código de 6 dígitos para <strong>{f.email}</strong>. Escreve-o aqui para confirmares o teu email.</p>
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
            {busy ? "A confirmar…" : "Confirmar email"}
          </button>
          <p className="ob1-have"><button onClick={() => { setStep(1); setErr(""); }}>Corrigir o email</button></p>
        </div>
      </div>
    );
  }

  /* ---------------- CRIAR PALAVRA-PASSE (só depois de confirmar o email) ---------------- */
  if (step === "password") {
    return (
      <div className="ob-verify-wrap">
        <div className="ob-verify-card">
          <div className="ob1-brand" style={{ marginBottom: 18 }}><Brand /></div>
          <div className="alert ok" style={{ margin: "0 0 14px", padding: "10px 12px" }}><Icon name="check" size={16} color="var(--accent)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>Email confirmado.</span></div>
          <h1 className="ob1-h1" style={{ fontSize: 26 }}>Cria a tua palavra-passe</h1>
          <p className="ob1-sub">Último passo: define uma palavra-passe segura para proteger a tua conta.</p>
          <Field label="Palavra-passe"><PwInput value={f.password} onChange={set("password")} placeholder="Crie uma senha segura" show={showPw} toggle={() => setShowPw((v) => !v)} autoComplete="new-password" autoFocus /></Field>
          <Strength value={f.password} />
          <Field label="Confirmar palavra-passe"><PwInput value={f.password2} onChange={set("password2")} placeholder="Repita a senha" show={showPw2} toggle={() => setShowPw2((v) => !v)} autoComplete="new-password" disabled={!pwStrong(f.password)} /></Field>
          {err && <div className="alert bad" style={{ margin: "6px 0 12px", padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
          <style>{`@keyframes rmaisSpin{to{transform:rotate(360deg)}}`}</style>
          <button className="btn btn-primary" disabled={busy} style={{ width: "100%", justifyContent: "center", padding: 13, fontSize: 15, border: "none" }} onClick={criarPassword}>
            {busy && <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.45)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", marginRight: 8, animation: "rmaisSpin .6s linear infinite", verticalAlign: "-2px" }} />}
            {busy ? "A criar conta…" : "Criar conta e entrar"}
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- CHROME comum aos passos 2 e 3 ---------------- */
  // Fora do registo (mode="profile"), estes dois ecrãs são o convite opcional inteiro
  // (2 passos, não 3) — a etiqueta e a barra de progresso refletem isso.
  const stepLabel = isProfileMode ? step - 1 : step;
  const totalLabel = isProfileMode ? 2 : 3;
  const pct = Math.round((stepLabel / totalLabel) * 100);
  const chrome = (main, aside) => (
    <div className="ob">
      <header className="ob-top">
        <div className="ob-top-brand"><Brand /></div>
        <div className="ob-top-prog">
          <div className="ob-top-prog-lbl"><b>Passo {stepLabel} de {totalLabel}</b><span>{pct}%</span></div>
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
            <Field label="Email">
              <div className="ob-locked-input">
                <input className="input" value={f.email} disabled readOnly />
                <Icon name="lock" size={14} color="var(--ink-3)" />
              </div>
            </Field>
          </div>
          <div className="ob-note tiny"><Icon name="lock" size={13} color="var(--ink-3)" /> Este email está associado à sua conta. A palavra-passe já foi definida no passo anterior.</div>
        </section>

        <section className="ob-sec">
          <h3 className="ob-sec-t">Informações adicionais</h3>
          <div className="ob-grid2">
            <Field label="País de residência">
              <select className="select" value={f.pais} onChange={(e) => { setPais(e.target.value); setMoedaAberta(false); }}>
                {BM.countries.map((c) => <option key={c.code} value={c.code}>{nomePais(c.code)}</option>)}
              </select>
            </Field>
            <Field label="Moeda principal" hint={moedaAberta ? "Escolha a moeda que quer usar na sua conta." : "Sugerida a partir do país. Pode alterar."}>
              {moedaAberta ? (
                <select className="select" value={f.moeda} onChange={(e) => setF((s) => ({ ...s, moeda: e.target.value }))}>
                  {Object.values(BM.currencies).map((c) => <option key={c.code} value={c.code}>{c.nome} ({c.sym})</option>)}
                </select>
              ) : (
                <div className="ob-locked-input">
                  <input className="input" value={`${cur.nome} (${cur.sym})`} disabled readOnly />
                  <Icon name="lock" size={14} color="var(--ink-3)" />
                </div>
              )}
              <button type="button" className="ob-inline-link" onClick={() => setMoedaAberta((v) => !v)}>{moedaAberta ? "Usar a moeda sugerida" : "Alterar moeda"}</button>
            </Field>
          </div>
        </section>

        <section className="ob-sec">
          <h3 className="ob-sec-t">Como pretende utilizar o Rende+?</h3>
          <p className="ob-sec-d">Selecione até {SEL_MAX} prioridades. <span className="ob-sel-count">({f.preferencia.length}/{SEL_MAX})</span></p>
          <div className="ob-opt-grid">
            {PREFERENCIAS.map(([id, lbl, ic]) => (
              <ObOptionCard key={id} icon={ic} label={lbl} sel={f.preferencia.includes(id)} disabled={!f.preferencia.includes(id) && f.preferencia.length >= SEL_MAX} onClick={() => toggleArr("preferencia", id, SEL_MAX)} />
            ))}
          </div>
        </section>

        {err && <div className="alert bad" style={{ margin: "4px 0 0", padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}

        <div className="ob-actions">
          <button className="btn btn-ghost" onClick={back}>{isProfileMode ? "Agora não" : <><Icon name="chevR" size={15} style={{ transform: "rotate(180deg)" }} /> Voltar</>}</button>
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
          <ObSummaryRow icon="bx-target-lock" label="Como pretende usar" value={preferenciaLabel} />
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
      <h1 className="ob-title">Configure a sua experiência financeira</h1>
      <p className="ob-lead">Estas informações ajudam o Rende+ a preparar categorias, objetivos e atalhos de acordo com a sua realidade.</p>

      <div className="ob-grid2 ob-grid2-cards">
        <section className="ob-block">
          <h3 className="ob-block-t"><span className="ob-num">1</span> Situação atual</h3>
          <p className="ob-block-d">Selecione até {SEL_MAX} opções que descrevam a sua situação. <span className="ob-sel-count">({f.situacao.length}/{SEL_MAX})</span></p>
          <div className="ob-opt-grid">
            {SITUACOES.map(([id, lbl, ic]) => <ObOptionCard key={id} icon={ic} label={lbl} sel={f.situacao.includes(id)} disabled={!f.situacao.includes(id) && f.situacao.length >= SEL_MAX} onClick={() => toggleArr("situacao", id, SEL_MAX)} />)}
          </div>
        </section>

        <section className="ob-block">
          <h3 className="ob-block-t"><span className="ob-num">2</span> Fontes de rendimento</h3>
          <p className="ob-block-d">Selecione uma ou mais fontes de rendimento. <span className="ob-sel-count">({f.rendimentos.length})</span></p>
          <div className="ob-check-grid">
            {RENDIMENTOS.map((r) => <ObCheck key={r} label={r} on={f.rendimentos.includes(r)} onClick={() => toggleArr("rendimentos", r)} />)}
          </div>
        </section>

        <section className="ob-block">
          <h3 className="ob-block-t"><span className="ob-num">3</span> Principais despesas</h3>
          <p className="ob-block-d">Selecione as despesas do seu dia a dia. <span className="ob-sel-count">({f.despesas.length})</span></p>
          <div className="ob-check-grid">
            {DESPESAS.map((d) => <ObCheck key={d} label={d} on={f.despesas.includes(d)} onClick={() => toggleArr("despesas", d)} />)}
          </div>
          {addingCatOb
            ? <NewCategoryInline onCreate={(key) => { toggleArr("despesas", key); setAddingCatOb(false); }} onCancel={() => setAddingCatOb(false)} />
            : <button type="button" className="ob-inline-link" style={{ marginTop: 10 }} onClick={() => setAddingCatOb(true)}><Icon name="plus" size={13} /> Adicionar categoria personalizada</button>}
        </section>

        <section className="ob-block">
          <h3 className="ob-block-t"><span className="ob-num">4</span> Objetivo financeiro principal</h3>
          <p className="ob-block-d">Selecione até {SEL_MAX} objetivos. <span className="ob-sel-count">({f.objetivo.length}/{SEL_MAX})</span></p>
          <div className="ob-goal-grid">
            {OBJETIVOS.map(([id, lbl, ic]) => {
              const sel = f.objetivo.includes(id);
              const disabled = !sel && f.objetivo.length >= SEL_MAX;
              return (
                <button type="button" key={id} className={"ob-goal" + (sel ? " sel" : "") + (disabled ? " disabled" : "")} disabled={disabled} aria-disabled={disabled} onClick={() => toggleArr("objetivo", id, SEL_MAX)}>
                  <i className={"bx " + ic}></i><span>{lbl}</span><span className="ob-opt-radio" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="ob-grid3">
        <section className="ob-block">
          <h3 className="ob-block-t"><span className="ob-num">5</span> Como pretende planear o seu orçamento?</h3>
          {[["criar-agora", "Quero criar um orçamento mensal agora"], ["sugestao", "Quero receber uma sugestão inicial"], ["mais-tarde", "Prefiro configurar mais tarde"]].map(([id, lbl]) => <ObRadio key={id} label={lbl} on={f.planeamento === id} onClick={() => setF((s) => ({ ...s, planeamento: id }))} />)}
          {f.planeamento === "criar-agora" && (
            <Field label={`Limite mensal (${cur.sym})`} hint="Pode ajustar por categoria mais tarde, nas Definições.">
              <div style={{ position: "relative" }}>
                <input className="input tnum" value={f.orcamento} onChange={(e) => setF((s) => ({ ...s, orcamento: e.target.value.replace(/[^\d.,]/g, "") }))} placeholder="1.000,00" inputMode="decimal" style={{ paddingRight: 42 }} />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "var(--ink-3)" }}>{cur.sym}</span>
              </div>
            </Field>
          )}
          {f.planeamento === "sugestao" && <div className="ob-inline-note"><Icon name="info" size={14} color="var(--accent)" /> Preparamos um rascunho com base nas categorias escolhidas — completa os valores depois de entrar.</div>}
        </section>
        <section className="ob-block">
          <h3 className="ob-block-t"><span className="ob-num">6</span> Partilha despesas com outras pessoas?</h3>
          {[["nao", "Não"], ["parceiro", "Com parceiro ou parceira"], ["familia", "Com família"], ["casa", "Numa casa partilhada"], ["grupo", "Em grupos ocasionais"]].map(([id, lbl]) => <ObRadio key={id} label={lbl} on={f.partilha === id} onClick={() => setF((s) => ({ ...s, partilha: id }))} />)}
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
        <h4 className="ob-card-t">Está quase lá</h4>
        <p className="ob-card-d">Com estas informações o Rende+ poderá oferecer uma experiência personalizada para si.</p>
        <style>{`@keyframes rmaisSpin{to{transform:rotate(360deg)}}`}</style>
        <button className="btn btn-primary" disabled={busy} style={{ width: "100%", justifyContent: "center", padding: 13, fontSize: 15, marginTop: 4 }} onClick={guardarPerfil}>
          {busy && <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.45)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", marginRight: 8, animation: "rmaisSpin .6s linear infinite", verticalAlign: "-2px" }} />}
          {busy ? "A guardar…" : <>Guardar e concluir <Icon name="chevR" size={16} color="#fff" /></>}
        </button>
        <button className="ob-back-link" onClick={back}><Icon name="chevR" size={14} style={{ transform: "rotate(180deg)" }} /> Voltar</button>
      </div>
    </>
  );
  return chrome(main, aside);
}

window.Onboarding = Onboarding;