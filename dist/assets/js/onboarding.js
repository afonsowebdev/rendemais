function TrustIcon({ name, size = 17, color = "var(--accent)" }) {
  if (name === "shield") return /* @__PURE__ */ React.createElement(Icon, { name: "shield", size, color });
  const PATHS = {
    lock: "M6 10V8a6 6 0 1 1 12 0v2M5 10h14a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a1 1 0 0 1 1-1z",
    sync: "M21 12a9 9 0 1 1-3-6.7M21 4v4h-4",
    cloud: "M7 18a4.5 4.5 0 0 1-.4-9 6 6 0 0 1 11.4.5A4.5 4.5 0 0 1 17 18H7z"
  };
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: PATHS[name] }));
}
function ObOptionCard({ icon, label, sel, onClick, sub, disabled }) {
  return /* @__PURE__ */ React.createElement("button", { type: "button", className: "ob-opt" + (sel ? " sel" : "") + (disabled ? " disabled" : ""), onClick, disabled, "aria-disabled": disabled }, /* @__PURE__ */ React.createElement("span", { className: "ob-opt-ico" }, /* @__PURE__ */ React.createElement("i", { className: "bx " + icon, "aria-hidden": "true" })), /* @__PURE__ */ React.createElement("span", { className: "ob-opt-lbl" }, label), sub && /* @__PURE__ */ React.createElement("span", { className: "ob-opt-sub" }, sub), /* @__PURE__ */ React.createElement("span", { className: "ob-opt-radio", "aria-hidden": "true" }));
}
function ObCheck({ label, on, onClick, disabled }) {
  return /* @__PURE__ */ React.createElement("button", { type: "button", className: "ob-check" + (on ? " on" : "") + (disabled ? " disabled" : ""), onClick, disabled, "aria-disabled": disabled }, /* @__PURE__ */ React.createElement("span", { className: "ob-check-box", "aria-hidden": "true" }, on && /* @__PURE__ */ React.createElement("i", { className: "bx bx-check" })), /* @__PURE__ */ React.createElement("span", null, label));
}
function ObRadio({ label, on, onClick }) {
  return /* @__PURE__ */ React.createElement("button", { type: "button", className: "ob-radio" + (on ? " on" : ""), onClick }, /* @__PURE__ */ React.createElement("span", { className: "ob-radio-dot", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("span", null, label));
}
function ObSummaryRow({ icon, label, value }) {
  return /* @__PURE__ */ React.createElement("div", { className: "ob-sum-row" }, /* @__PURE__ */ React.createElement("span", { className: "ob-sum-ico" }, /* @__PURE__ */ React.createElement("i", { className: "bx " + icon, "aria-hidden": "true" })), /* @__PURE__ */ React.createElement("span", { className: "ob-sum-lbl" }, label), /* @__PURE__ */ React.createElement("span", { className: "ob-sum-val" }, value));
}
const MESES_NOME = ["Janeiro", "Fevereiro", "Mar\xE7o", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
function DateOfBirthPicker({ value, onChange }) {
  const parse = (iso) => {
    const p = String(iso || "").split("-").map((v) => parseInt(v, 10));
    return { d: p[2] || "", m: p[1] || "", y: p[0] || "" };
  };
  const [sel, setSel] = React.useState(() => parse(value));
  const hoje = /* @__PURE__ */ new Date();
  const anoMax = hoje.getFullYear();
  const anos = Array.from({ length: 101 }, (_, i) => anoMax - i);
  const diasNoMes = (y, m) => y && m ? new Date(y, m, 0).getDate() : 31;
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
  return /* @__PURE__ */ React.createElement("div", { className: "ob-dob-grid" }, /* @__PURE__ */ React.createElement("select", { className: "select", "aria-label": "Dia de nascimento", value: sel.d, onChange: (e) => update({ d: +e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "", disabled: true }, "Dia"), dias.map((n) => /* @__PURE__ */ React.createElement("option", { key: n, value: n }, n))), /* @__PURE__ */ React.createElement("select", { className: "select", "aria-label": "M\xEAs de nascimento", value: sel.m, onChange: (e) => update({ m: +e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "", disabled: true }, "M\xEAs"), meses.map((nome, i) => /* @__PURE__ */ React.createElement("option", { key: nome, value: i + 1 }, nome))), /* @__PURE__ */ React.createElement("select", { className: "select", "aria-label": "Ano de nascimento", value: sel.y, onChange: (e) => update({ y: +e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "", disabled: true }, "Ano"), anos.map((n) => /* @__PURE__ */ React.createElement("option", { key: n, value: n }, n))));
}
function Onboarding({ onBack, onLogin, mode = "signup", onDone }) {
  const fin = useFinance();
  const isProfileMode = mode === "profile";
  const SITUACOES = [
    ["estudante", "Estudante", "bx-graduation"],
    ["trabalhador", "Trabalhador", "bx-briefcase"],
    ["freelancer", "Freelancer", "bx-laptop"],
    ["empresario", "Empres\xE1rio", "bx-buildings"],
    ["casado", "Casado", "bx-heart"],
    ["vive-sozinho", "Vive sozinho", "bx-user"],
    ["casa-partilhada", "Vive numa casa partilhada", "bx-group"],
    ["outro", "Outro", "bx-dots-horizontal-rounded"]
  ];
  const RENDIMENTOS = Object.keys(BM.incomeCats);
  const DESPESAS = ["Renda", "\xC1gua", "Eletricidade", "G\xE1s", "Internet", "Alimenta\xE7\xE3o", "Transporte", "Educa\xE7\xE3o", "Sa\xFAde", "Seguros", "Subscri\xE7\xF5es", "Lazer", "Telecomunica\xE7\xF5es", "Outro"];
  const OBJETIVOS = [
    ["fundo", "Fundo de emerg\xEAncia", "bx-shield-quarter"],
    ["casa", "Comprar casa", "bx-home"],
    ["carro", "Comprar carro", "bx-car"],
    ["viagem", "Viagem", "bx-plane"],
    ["educacao", "Educa\xE7\xE3o", "bx-book"],
    ["tecnologia", "Tecnologia", "bx-laptop"],
    ["familia", "Fam\xEDlia", "bx-group"],
    ["saude", "Sa\xFAde", "bx-heart"],
    ["investimento", "Investimento", "bx-line-chart"],
    ["outro", "Outro", "bx-dots-horizontal-rounded"]
  ];
  const PREFERENCIAS = [
    ["controlar", "Controlar despesas", "bx-wallet"],
    ["orcamento", "Organizar o or\xE7amento mensal", "bx-receipt"],
    ["objetivos", "Criar objetivos financeiros", "bx-target-lock"],
    ["partilhadas", "Gerir despesas partilhadas", "bx-group"],
    ["pagamentos", "Acompanhar pagamentos futuros", "bx-calendar"],
    ["habitos", "Melhorar h\xE1bitos financeiros", "bx-line-chart"]
  ];
  const PAIS_NOME = { PT: "Portugal", ES: "Espanha", FR: "Fran\xE7a", DE: "Alemanha", LU: "Luxemburgo", CH: "Su\xED\xE7a", GB: "Reino Unido", US: "Estados Unidos", CA: "Canad\xE1", AO: "Angola" };
  const nomePais = (code) => PAIS_NOME[code] || code;
  const defPais = React.useMemo(() => BM.detectCountry(), []);
  const DRAFT_KEY = "rende_onboarding_draft";
  const draft = React.useMemo(() => {
    if (isProfileMode) return null;
    try {
      const s = localStorage.getItem(DRAFT_KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  }, []);
  const limparRascunho = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
    }
  };
  const [step, setStep] = React.useState(() => isProfileMode ? 2 : 1);
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
      nome: isProfileMode && fin.account && fin.account.nome || "",
      email: isProfileMode && fin.account && fin.account.email || "",
      password: "",
      password2: "",
      termos: false,
      moeda: BM.currencyForCountry(defPais),
      pais: defPais,
      nascimento: "",
      preferencia: [],
      situacao: ["estudante"],
      rendimentos: [],
      despesas: [],
      objetivo: ["fundo"],
      planeamento: "mais-tarde",
      partilha: "nao",
      orcamento: "",
      notificacoes: true,
      resumoSemanal: true,
      code: ""
    };
    return draft && draft.f ? { ...base, ...draft.f, password: "", password2: "", code: "" } : base;
  });
  React.useEffect(() => {
    if (isProfileMode || typeof step !== "number" || step > 3) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, f: { ...f, password: "", password2: "", code: "" } }));
    } catch (e) {
    }
  }, [step, f]);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const onNome = (e) => {
    let v = e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, "").replace(/\s{2,}/g, " ").replace(/(^|\s)([a-zà-öø-ÿ])/g, (m, sp, ch) => sp + ch.toUpperCase());
    setF((s) => ({ ...s, nome: v }));
  };
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
  const objetivoLabel = f.objetivo.length ? labelsOf(OBJETIVOS, f.objetivo).join(", ") : "\u2014";
  const situacaoLabel = f.situacao.length ? labelsOf(SITUACOES, f.situacao).join(", ") : "\u2014";
  const preferenciaLabel = f.preferencia.length ? labelsOf(PREFERENCIAS, f.preferencia).join(", ") : "\u2014";
  const partilhaLabel = { nao: "N\xE3o", parceiro: "Com parceiro ou parceira", familia: "Com fam\xEDlia", casa: "Numa casa partilhada", grupo: "Em grupos ocasionais" }[f.partilha];
  const paisLabel = nomePais(f.pais);
  const validaPasso1 = () => {
    if (!f.nome.trim() || !f.email.trim()) return "Preenche o nome e o email.";
    if (!nomeOk) return "O nome s\xF3 pode conter letras.";
    if (!emailOk) return "Introduza um endere\xE7o de email v\xE1lido.";
    if (idade == null) return "Indica a tua data de nascimento.";
    if (idade < 16) return "Tens de ter pelo menos 16 anos para criar conta.";
    if (!f.termos) return "Tens de aceitar os Termos de Servi\xE7o e a Pol\xEDtica de Privacidade.";
    return "";
  };
  const validaPasso2 = () => {
    if (!f.moeda) return "Escolhe a tua moeda principal.";
    if (!f.pais) return "Escolhe o teu pa\xEDs de resid\xEAncia.";
    return "";
  };
  const next = () => {
    const e = step === 1 ? validaPasso1() : step === 2 ? validaPasso2() : "";
    if (e) {
      setErr(e);
      return;
    }
    setErr("");
    setOkMsg("");
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => {
    setErr("");
    setOkMsg("");
    if (isProfileMode && step === 2) return onDone && onDone();
    if (step === 1) return onBack && onBack();
    setStep((s) => s - 1);
    window.scrollTo({ top: 0 });
  };
  const criarConta = async () => {
    if (busy) return;
    const e = validaPasso1();
    if (e) {
      setErr(e);
      return;
    }
    setErr("");
    setBusy(true);
    try {
      await fin.iniciarRegisto({ email: f.email, nome: f.nome, moeda: f.moeda, idade });
      setOkMsg("");
      setF((s) => ({ ...s, code: "" }));
      setStep("verify");
    } catch (e2) {
      setErr(e2.message || "N\xE3o foi poss\xEDvel iniciar o registo.");
    } finally {
      setBusy(false);
    }
  };
  const doVerify = async () => {
    if (busy) return;
    if (!/^\d{6}$/.test((f.code || "").trim())) {
      setErr("Introduz o c\xF3digo de 6 d\xEDgitos.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const tok = await fin.verificarEmail(f.email, f.code);
      setSetupToken(tok);
      setOkMsg("");
      setStep("password");
    } catch (e) {
      setErr(e.message || "N\xE3o foi poss\xEDvel confirmar o c\xF3digo.");
    } finally {
      setBusy(false);
    }
  };
  const criarPassword = async () => {
    if (busy) return;
    if (!pwStrong(f.password)) {
      setErr("A palavra-passe ainda \xE9 fraca. Cumpre todos os requisitos.");
      return;
    }
    if (f.password !== f.password2) {
      setErr("As palavras-passe n\xE3o coincidem.");
      return;
    }
    if (!setupToken) {
      setErr("A sess\xE3o de configura\xE7\xE3o expirou. Confirma o email de novo.");
      setStep("verify");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      localStorage.setItem("rende_perfil_pendente_" + f.email.trim().toLowerCase(), "1");
    } catch (e) {
    }
    try {
      await fin.definirPassword(setupToken, f.password, {
        idade,
        nascimento: f.nascimento,
        pais: f.pais,
        moeda: f.moeda,
        moedas: [f.moeda],
        perfil: situacaoLabel,
        preferencia: f.preferencia,
        situacao: f.situacao,
        fontesRendimento: f.rendimentos,
        principaisDespesas: f.despesas,
        objetivo: f.objetivo,
        planeamento: f.planeamento,
        partilha: f.partilha,
        notificacoes: f.notificacoes,
        resumoSemanal: f.resumoSemanal
      });
      if (f.objetivo.length) {
        await Promise.all(f.objetivo.map((id) => {
          const nome = (OBJETIVOS.find((o) => o[0] === id) || [null, id])[1];
          return fin.meta.add({ nome, alvo: 0, atual: 0 });
        }));
      }
      const orc = parseFloat(String(f.orcamento).replace(",", "."));
      if (!isNaN(orc) && orc > 0) fin.updateAccount({ orcamento: orc });
      limparRascunho();
    } catch (e) {
      setErr(e.message || "N\xE3o foi poss\xEDvel criar a palavra-passe.");
    } finally {
      setBusy(false);
    }
  };
  const guardarPerfil = async () => {
    if (busy) return;
    setErr("");
    setBusy(true);
    try {
      await fin.updateAccount({
        pais: f.pais,
        moeda: f.moeda,
        moedas: [f.moeda],
        perfil: situacaoLabel,
        preferencia: f.preferencia,
        situacao: f.situacao,
        fontesRendimento: f.rendimentos,
        principaisDespesas: f.despesas,
        objetivo: f.objetivo,
        planeamento: f.planeamento,
        partilha: f.partilha,
        notificacoes: f.notificacoes,
        resumoSemanal: f.resumoSemanal
      });
      if (f.objetivo.length) {
        await Promise.all(f.objetivo.map((id) => {
          const nome = (OBJETIVOS.find((o) => o[0] === id) || [null, id])[1];
          return fin.meta.add({ nome, alvo: 0, atual: 0 });
        }));
      }
      const orc = parseFloat(String(f.orcamento).replace(",", "."));
      if (!isNaN(orc) && orc > 0) fin.updateAccount({ orcamento: orc });
      try {
        localStorage.removeItem("rende_perfil_pendente_" + (f.email || "").trim().toLowerCase());
      } catch (e) {
      }
      onDone && onDone();
    } catch (e) {
      setErr(e.message || "N\xE3o foi poss\xEDvel guardar o perfil.");
    } finally {
      setBusy(false);
    }
  };
  const doResend = async () => {
    setErr("");
    try {
      await fin.reenviarCodigo(f.email);
      setOkMsg("Envi\xE1mos um novo c\xF3digo para o teu email.");
    } catch (e) {
      setErr(e.message || "N\xE3o foi poss\xEDvel reenviar o c\xF3digo.");
    }
  };
  if (step === 1) {
    return /* @__PURE__ */ React.createElement("div", { className: "ob1" }, /* @__PURE__ */ React.createElement("div", { className: "ob1-form" }, /* @__PURE__ */ React.createElement("div", { className: "ob1-form-in" }, /* @__PURE__ */ React.createElement("div", { className: "ob1-brand ob1-brand-center" }, /* @__PURE__ */ React.createElement(Brand, null)), onBack && /* @__PURE__ */ React.createElement("button", { className: "auth-back auth-back-strong", onClick: onBack }, /* @__PURE__ */ React.createElement("i", { className: "bx bx-chevron-left", "aria-hidden": "true" }), " Voltar"), /* @__PURE__ */ React.createElement("h1", { className: "ob1-h1" }, "Crie a sua conta"), /* @__PURE__ */ React.createElement("p", { className: "ob1-sub" }, "Comece a organizar a sua vida financeira com o Rende+."), /* @__PURE__ */ React.createElement(Field, { label: "Nome completo" }, /* @__PURE__ */ React.createElement("input", { className: "input", value: f.nome, onChange: onNome, placeholder: "Ex.: Francisco Afonso", autoComplete: "name" })), /* @__PURE__ */ React.createElement(Field, { label: "Email" }, /* @__PURE__ */ React.createElement("input", { className: "input", value: f.email, onChange: set("email"), placeholder: "exemplo@dominio.pt", autoComplete: "email" })), /* @__PURE__ */ React.createElement(Field, { label: "Data de nascimento", hint: "Idade m\xEDnima: 16 anos." }, /* @__PURE__ */ React.createElement(DateOfBirthPicker, { value: f.nascimento, onChange: (iso) => setF((s) => ({ ...s, nascimento: iso })) }), idade != null && /* @__PURE__ */ React.createElement("div", { className: "tiny", style: { marginTop: 6, fontWeight: 700, color: idade < 16 ? "var(--neg)" : "var(--accent)" } }, idade < 16 ? `Tens ${idade} anos \u2014 a idade m\xEDnima \xE9 16.` : `Tens ${idade} anos.`)), /* @__PURE__ */ React.createElement("button", { type: "button", className: "ob1-terms" + (f.termos ? " on" : ""), onClick: () => setF((s) => ({ ...s, termos: !s.termos })) }, /* @__PURE__ */ React.createElement("span", { className: "ob-check-box", "aria-hidden": "true" }, f.termos && /* @__PURE__ */ React.createElement("i", { className: "bx bx-check" })), /* @__PURE__ */ React.createElement("span", null, "Ao criar uma conta, confirma que leu e aceita os ", /* @__PURE__ */ React.createElement("a", { href: "termos.html", target: "_blank", rel: "noopener", onClick: (e) => e.stopPropagation() }, "Termos de Servi\xE7o"), " e a ", /* @__PURE__ */ React.createElement("a", { href: "privacidade.html", target: "_blank", rel: "noopener", onClick: (e) => e.stopPropagation() }, "Pol\xEDtica de Privacidade"), ".")), err && /* @__PURE__ */ React.createElement("div", { className: "alert bad", style: { margin: "4px 0 12px", padding: "9px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16, color: "var(--neg)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, err)), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary ob1-cta", disabled: busy, onClick: criarConta }, busy ? "A criar\u2026" : "Criar Conta"), /* @__PURE__ */ React.createElement("div", { className: "ob1-sep" }, /* @__PURE__ */ React.createElement("span", null, "Tamb\xE9m pode continuar com")), /* @__PURE__ */ React.createElement("div", { className: "ob1-social" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "ob1-social-btn", title: "Brevemente dispon\xEDvel", onClick: () => setErr("O in\xEDcio de sess\xE3o com Google chega em breve. Por agora, cria a tua conta com email.") }, /* @__PURE__ */ React.createElement(Icon, { name: "google", size: 18 }), " Continuar com Google"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "ob1-social-btn", title: "Brevemente dispon\xEDvel", onClick: () => setErr("O in\xEDcio de sess\xE3o com Apple chega em breve. Por agora, cria a tua conta com email.") }, /* @__PURE__ */ React.createElement("i", { className: "bx bxl-apple", style: { fontSize: 20 } }), " Continuar com Apple")), /* @__PURE__ */ React.createElement("p", { className: "ob1-have" }, "J\xE1 tem conta? ", /* @__PURE__ */ React.createElement("button", { onClick: onLogin }, "Iniciar sess\xE3o")))), /* @__PURE__ */ React.createElement("aside", { className: "ob1-aside" }, /* @__PURE__ */ React.createElement("div", { className: "ob1-aside-in" }, /* @__PURE__ */ React.createElement("span", { className: "lp2-tag" }, "Comece gratuitamente"), /* @__PURE__ */ React.createElement("h2", { className: "login-aside-h1" }, "Organize hoje a sua vida financeira."), /* @__PURE__ */ React.createElement("p", { className: "login-aside-sub" }, "Crie a sua conta e tenha acesso a ferramentas para acompanhar transa\xE7\xF5es, objetivos, or\xE7amento e despesas partilhadas."), /* @__PURE__ */ React.createElement("ul", { className: "lp2-checks" }, ["Configura\xE7\xE3o simples.", "Sem cart\xE3o de cr\xE9dito.", "Dados protegidos.", "Acesso em desktop e mobile."].map((t) => /* @__PURE__ */ React.createElement("li", { key: t }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 17, color: "var(--accent)", sw: 2.4 }), " ", t))))));
  }
  if (step === "verify") {
    return /* @__PURE__ */ React.createElement("div", { className: "ob-verify-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "ob-verify-card" }, /* @__PURE__ */ React.createElement("div", { className: "ob1-brand", style: { marginBottom: 18 } }, /* @__PURE__ */ React.createElement(Brand, null)), /* @__PURE__ */ React.createElement("h1", { className: "ob1-h1", style: { fontSize: 26 } }, "Confirma o teu email"), /* @__PURE__ */ React.createElement("p", { className: "ob1-sub" }, "Envi\xE1mos um c\xF3digo de 6 d\xEDgitos para ", /* @__PURE__ */ React.createElement("strong", null, f.email), ". Escreve-o aqui para confirmares o teu email."), okMsg && /* @__PURE__ */ React.createElement("div", { className: "alert ok", style: { margin: "0 0 14px", padding: "10px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16, color: "var(--accent)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, okMsg)), /* @__PURE__ */ React.createElement(Field, { label: "C\xF3digo de verifica\xE7\xE3o" }, /* @__PURE__ */ React.createElement("input", { className: "input tnum", value: f.code, onChange: (e) => setF((s) => ({ ...s, code: e.target.value.replace(/\D/g, "").slice(0, 6) })), placeholder: "000000", inputMode: "numeric", maxLength: 6, autoFocus: true, style: { letterSpacing: ".3em", fontSize: 18, textAlign: "center" } })), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", margin: "-2px 0 10px" } }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: doResend, style: { background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", fontSize: 12.5, cursor: "pointer", padding: 0 } }, "N\xE3o recebeste? Reenviar c\xF3digo")), err && /* @__PURE__ */ React.createElement("div", { className: "alert bad", style: { marginBottom: 12, padding: "9px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16, color: "var(--neg)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, err)), /* @__PURE__ */ React.createElement("style", null, `@keyframes rmaisSpin{to{transform:rotate(360deg)}}`), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", disabled: busy, style: { width: "100%", justifyContent: "center", padding: 13, fontSize: 15 }, onClick: doVerify }, busy && /* @__PURE__ */ React.createElement("span", { style: { width: 15, height: 15, border: "2px solid rgba(255,255,255,.45)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", marginRight: 8, animation: "rmaisSpin .6s linear infinite", verticalAlign: "-2px" } }), busy ? "A confirmar\u2026" : "Confirmar email"), /* @__PURE__ */ React.createElement("p", { className: "ob1-have" }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
      setStep(1);
      setErr("");
    } }, "Corrigir o email"))));
  }
  if (step === "password") {
    return /* @__PURE__ */ React.createElement("div", { className: "ob-verify-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "ob-verify-card" }, /* @__PURE__ */ React.createElement("div", { className: "ob1-brand", style: { marginBottom: 18 } }, /* @__PURE__ */ React.createElement(Brand, null)), /* @__PURE__ */ React.createElement("div", { className: "alert ok", style: { margin: "0 0 14px", padding: "10px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16, color: "var(--accent)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, "Email confirmado.")), /* @__PURE__ */ React.createElement("h1", { className: "ob1-h1", style: { fontSize: 26 } }, "Cria a tua palavra-passe"), /* @__PURE__ */ React.createElement("p", { className: "ob1-sub" }, "\xDAltimo passo: define uma palavra-passe segura para proteger a tua conta."), /* @__PURE__ */ React.createElement(Field, { label: "Palavra-passe" }, /* @__PURE__ */ React.createElement(PwInput, { value: f.password, onChange: set("password"), placeholder: "Crie uma senha segura", show: showPw, toggle: () => setShowPw((v) => !v), autoComplete: "new-password", autoFocus: true })), /* @__PURE__ */ React.createElement(Strength, { value: f.password }), /* @__PURE__ */ React.createElement(Field, { label: "Confirmar palavra-passe" }, /* @__PURE__ */ React.createElement(PwInput, { value: f.password2, onChange: set("password2"), placeholder: "Repita a senha", show: showPw2, toggle: () => setShowPw2((v) => !v), autoComplete: "new-password", disabled: !pwStrong(f.password) })), err && /* @__PURE__ */ React.createElement("div", { className: "alert bad", style: { margin: "6px 0 12px", padding: "9px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16, color: "var(--neg)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, err)), /* @__PURE__ */ React.createElement("style", null, `@keyframes rmaisSpin{to{transform:rotate(360deg)}}`), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", disabled: busy, style: { width: "100%", justifyContent: "center", padding: 13, fontSize: 15, border: "none" }, onClick: criarPassword }, busy && /* @__PURE__ */ React.createElement("span", { style: { width: 15, height: 15, border: "2px solid rgba(255,255,255,.45)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", marginRight: 8, animation: "rmaisSpin .6s linear infinite", verticalAlign: "-2px" } }), busy ? "A criar conta\u2026" : "Criar conta e entrar")));
  }
  const stepLabel = isProfileMode ? step - 1 : step;
  const totalLabel = isProfileMode ? 2 : 3;
  const pct = Math.round(stepLabel / totalLabel * 100);
  const chrome = (main2, aside2) => /* @__PURE__ */ React.createElement("div", { className: "ob" }, /* @__PURE__ */ React.createElement("header", { className: "ob-top" }, /* @__PURE__ */ React.createElement("div", { className: "ob-top-brand" }, /* @__PURE__ */ React.createElement(Brand, null)), /* @__PURE__ */ React.createElement("div", { className: "ob-top-prog" }, /* @__PURE__ */ React.createElement("div", { className: "ob-top-prog-lbl" }, /* @__PURE__ */ React.createElement("b", null, "Passo ", stepLabel, " de ", totalLabel), /* @__PURE__ */ React.createElement("span", null, pct, "%")), /* @__PURE__ */ React.createElement("div", { className: "ob-prog-bar" }, /* @__PURE__ */ React.createElement("i", { style: { width: pct + "%" } }))), /* @__PURE__ */ React.createElement("div", { className: "ob-top-user" }, /* @__PURE__ */ React.createElement("span", { className: "ob-avatar" }, (f.nome || "?").trim().slice(0, 2).toUpperCase() || "FA"))), /* @__PURE__ */ React.createElement("div", { className: "ob-body" }, /* @__PURE__ */ React.createElement("main", { className: "ob-main" }, main2), /* @__PURE__ */ React.createElement("aside", { className: "ob-aside" }, aside2)));
  if (step === 2) {
    const main2 = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h1", { className: "ob-title" }, "Configurar o seu perfil"), /* @__PURE__ */ React.createElement("p", { className: "ob-lead" }, "Quase l\xE1! Complete as informa\xE7\xF5es abaixo para personalizar a sua experi\xEAncia no Rende+."), /* @__PURE__ */ React.createElement("section", { className: "ob-sec" }, /* @__PURE__ */ React.createElement("h3", { className: "ob-sec-t" }, "Informa\xE7\xF5es pessoais"), /* @__PURE__ */ React.createElement("div", { className: "ob-grid2" }, /* @__PURE__ */ React.createElement(Field, { label: "Nome completo" }, /* @__PURE__ */ React.createElement("input", { className: "input", value: f.nome, onChange: onNome, placeholder: "Ex.: Francisco Afonso" })), /* @__PURE__ */ React.createElement(Field, { label: "Email" }, /* @__PURE__ */ React.createElement("div", { className: "ob-locked-input" }, /* @__PURE__ */ React.createElement("input", { className: "input", value: f.email, disabled: true, readOnly: true }), /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 14, color: "var(--ink-3)" })))), /* @__PURE__ */ React.createElement("div", { className: "ob-note tiny" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 13, color: "var(--ink-3)" }), " Este email est\xE1 associado \xE0 sua conta. A palavra-passe j\xE1 foi definida no passo anterior.")), /* @__PURE__ */ React.createElement("section", { className: "ob-sec" }, /* @__PURE__ */ React.createElement("h3", { className: "ob-sec-t" }, "Informa\xE7\xF5es adicionais"), /* @__PURE__ */ React.createElement("div", { className: "ob-grid2" }, /* @__PURE__ */ React.createElement(Field, { label: "Pa\xEDs de resid\xEAncia" }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.pais, onChange: (e) => {
      setPais(e.target.value);
      setMoedaAberta(false);
    } }, BM.countries.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.code, value: c.code }, nomePais(c.code))))), /* @__PURE__ */ React.createElement(Field, { label: "Moeda principal", hint: moedaAberta ? "Escolha a moeda que quer usar na sua conta." : "Sugerida a partir do pa\xEDs. Pode alterar." }, moedaAberta ? /* @__PURE__ */ React.createElement("select", { className: "select", value: f.moeda, onChange: (e) => setF((s) => ({ ...s, moeda: e.target.value })) }, Object.values(BM.currencies).map((c) => /* @__PURE__ */ React.createElement("option", { key: c.code, value: c.code }, c.nome, " (", c.sym, ")"))) : /* @__PURE__ */ React.createElement("div", { className: "ob-locked-input" }, /* @__PURE__ */ React.createElement("input", { className: "input", value: `${cur.nome} (${cur.sym})`, disabled: true, readOnly: true }), /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 14, color: "var(--ink-3)" })), /* @__PURE__ */ React.createElement("button", { type: "button", className: "ob-inline-link", onClick: () => setMoedaAberta((v) => !v) }, moedaAberta ? "Usar a moeda sugerida" : "Alterar moeda")))), /* @__PURE__ */ React.createElement("section", { className: "ob-sec" }, /* @__PURE__ */ React.createElement("h3", { className: "ob-sec-t" }, "Como pretende utilizar o Rende+?"), /* @__PURE__ */ React.createElement("p", { className: "ob-sec-d" }, "Selecione at\xE9 ", SEL_MAX, " prioridades. ", /* @__PURE__ */ React.createElement("span", { className: "ob-sel-count" }, "(", f.preferencia.length, "/", SEL_MAX, ")")), /* @__PURE__ */ React.createElement("div", { className: "ob-opt-grid" }, PREFERENCIAS.map(([id, lbl, ic]) => /* @__PURE__ */ React.createElement(ObOptionCard, { key: id, icon: ic, label: lbl, sel: f.preferencia.includes(id), disabled: !f.preferencia.includes(id) && f.preferencia.length >= SEL_MAX, onClick: () => toggleArr("preferencia", id, SEL_MAX) })))), err && /* @__PURE__ */ React.createElement("div", { className: "alert bad", style: { margin: "4px 0 0", padding: "9px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16, color: "var(--neg)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, err)), /* @__PURE__ */ React.createElement("div", { className: "ob-actions" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: back }, isProfileMode ? "Agora n\xE3o" : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 15, style: { transform: "rotate(180deg)" } }), " Voltar")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: next }, "Continuar ", /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 15, color: "#fff" }))));
    const aside2 = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "ob-card" }, /* @__PURE__ */ React.createElement("h4", { className: "ob-card-t" }, "As suas prefer\xEAncias"), /* @__PURE__ */ React.createElement("p", { className: "ob-card-d" }, "Personalize o Rende+ ao seu estilo."), /* @__PURE__ */ React.createElement("div", { className: "ob-pref-row" }, /* @__PURE__ */ React.createElement("span", { className: "ob-pref-row-ico" }, /* @__PURE__ */ React.createElement("i", { className: "bx bx-bell" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "Notifica\xE7\xF5es"), /* @__PURE__ */ React.createElement("span", null, "Receba alertas e lembretes")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "ob-switch" + (f.notificacoes ? " on" : ""), onClick: () => setF((s) => ({ ...s, notificacoes: !s.notificacoes })), "aria-label": "Notifica\xE7\xF5es" }, /* @__PURE__ */ React.createElement("i", null))), /* @__PURE__ */ React.createElement("div", { className: "ob-pref-row" }, /* @__PURE__ */ React.createElement("span", { className: "ob-pref-row-ico" }, /* @__PURE__ */ React.createElement("i", { className: "bx bx-calendar" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "Resumo semanal"), /* @__PURE__ */ React.createElement("span", null, "Receba um resumo por email")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "ob-switch" + (f.resumoSemanal ? " on" : ""), onClick: () => setF((s) => ({ ...s, resumoSemanal: !s.resumoSemanal })), "aria-label": "Resumo semanal" }, /* @__PURE__ */ React.createElement("i", null)))), /* @__PURE__ */ React.createElement("div", { className: "ob-card ob-card-soft" }, /* @__PURE__ */ React.createElement("div", { className: "ob-card-lock" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 16, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("h4", { className: "ob-card-t" }, "Por que estas informa\xE7\xF5es?"), /* @__PURE__ */ React.createElement("p", { className: "ob-card-d" }, "Estas informa\xE7\xF5es ajudam-nos a personalizar a sua experi\xEAncia e oferecer sugest\xF5es mais relevantes para si.")), /* @__PURE__ */ React.createElement("div", { className: "ob-card" }, /* @__PURE__ */ React.createElement("h4", { className: "ob-card-t" }, "Resumo da sua conta"), /* @__PURE__ */ React.createElement(ObSummaryRow, { icon: "bx-dollar-circle", label: "Moeda", value: `${cur.nome} (${cur.sym})` }), /* @__PURE__ */ React.createElement(ObSummaryRow, { icon: "bx-world", label: "Pa\xEDs", value: paisLabel }), /* @__PURE__ */ React.createElement(ObSummaryRow, { icon: "bx-target-lock", label: "Como pretende usar", value: preferenciaLabel }), /* @__PURE__ */ React.createElement(ObSummaryRow, { icon: "bx-bell", label: "Notifica\xE7\xF5es", value: f.notificacoes ? "Ativadas" : "Desativadas" }), /* @__PURE__ */ React.createElement(ObSummaryRow, { icon: "bx-calendar", label: "Resumo semanal", value: f.resumoSemanal ? "Ativado" : "Desativado" })), /* @__PURE__ */ React.createElement("div", { className: "ob-tip" }, /* @__PURE__ */ React.createElement("span", { className: "ob-tip-ico" }, /* @__PURE__ */ React.createElement("i", { className: "bx bx-bulb" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "Dica"), /* @__PURE__ */ React.createElement("span", null, "Pode alterar todas estas informa\xE7\xF5es mais tarde nas defini\xE7\xF5es da sua conta."))));
    return chrome(main2, aside2);
  }
  const main = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h1", { className: "ob-title" }, "Configure a sua experi\xEAncia financeira"), /* @__PURE__ */ React.createElement("p", { className: "ob-lead" }, "Estas informa\xE7\xF5es ajudam o Rende+ a preparar categorias, objetivos e atalhos de acordo com a sua realidade."), /* @__PURE__ */ React.createElement("div", { className: "ob-grid2 ob-grid2-cards" }, /* @__PURE__ */ React.createElement("section", { className: "ob-block" }, /* @__PURE__ */ React.createElement("h3", { className: "ob-block-t" }, /* @__PURE__ */ React.createElement("span", { className: "ob-num" }, "1"), " Situa\xE7\xE3o atual"), /* @__PURE__ */ React.createElement("p", { className: "ob-block-d" }, "Selecione at\xE9 ", SEL_MAX, " op\xE7\xF5es que descrevam a sua situa\xE7\xE3o. ", /* @__PURE__ */ React.createElement("span", { className: "ob-sel-count" }, "(", f.situacao.length, "/", SEL_MAX, ")")), /* @__PURE__ */ React.createElement("div", { className: "ob-opt-grid" }, SITUACOES.map(([id, lbl, ic]) => /* @__PURE__ */ React.createElement(ObOptionCard, { key: id, icon: ic, label: lbl, sel: f.situacao.includes(id), disabled: !f.situacao.includes(id) && f.situacao.length >= SEL_MAX, onClick: () => toggleArr("situacao", id, SEL_MAX) })))), /* @__PURE__ */ React.createElement("section", { className: "ob-block" }, /* @__PURE__ */ React.createElement("h3", { className: "ob-block-t" }, /* @__PURE__ */ React.createElement("span", { className: "ob-num" }, "2"), " Fontes de rendimento"), /* @__PURE__ */ React.createElement("p", { className: "ob-block-d" }, "Selecione uma ou mais fontes de rendimento. ", /* @__PURE__ */ React.createElement("span", { className: "ob-sel-count" }, "(", f.rendimentos.length, ")")), /* @__PURE__ */ React.createElement("div", { className: "ob-check-grid" }, RENDIMENTOS.map((r) => /* @__PURE__ */ React.createElement(ObCheck, { key: r, label: r, on: f.rendimentos.includes(r), onClick: () => toggleArr("rendimentos", r) })))), /* @__PURE__ */ React.createElement("section", { className: "ob-block" }, /* @__PURE__ */ React.createElement("h3", { className: "ob-block-t" }, /* @__PURE__ */ React.createElement("span", { className: "ob-num" }, "3"), " Principais despesas"), /* @__PURE__ */ React.createElement("p", { className: "ob-block-d" }, "Selecione as despesas do seu dia a dia. ", /* @__PURE__ */ React.createElement("span", { className: "ob-sel-count" }, "(", f.despesas.length, ")")), /* @__PURE__ */ React.createElement("div", { className: "ob-check-grid" }, DESPESAS.map((d) => /* @__PURE__ */ React.createElement(ObCheck, { key: d, label: d, on: f.despesas.includes(d), onClick: () => toggleArr("despesas", d) }))), addingCatOb ? /* @__PURE__ */ React.createElement(NewCategoryInline, { onCreate: (key) => {
    toggleArr("despesas", key);
    setAddingCatOb(false);
  }, onCancel: () => setAddingCatOb(false) }) : /* @__PURE__ */ React.createElement("button", { type: "button", className: "ob-inline-link", style: { marginTop: 10 }, onClick: () => setAddingCatOb(true) }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 13 }), " Adicionar categoria personalizada")), /* @__PURE__ */ React.createElement("section", { className: "ob-block" }, /* @__PURE__ */ React.createElement("h3", { className: "ob-block-t" }, /* @__PURE__ */ React.createElement("span", { className: "ob-num" }, "4"), " Objetivo financeiro principal"), /* @__PURE__ */ React.createElement("p", { className: "ob-block-d" }, "Selecione at\xE9 ", SEL_MAX, " objetivos. ", /* @__PURE__ */ React.createElement("span", { className: "ob-sel-count" }, "(", f.objetivo.length, "/", SEL_MAX, ")")), /* @__PURE__ */ React.createElement("div", { className: "ob-goal-grid" }, OBJETIVOS.map(([id, lbl, ic]) => {
    const sel = f.objetivo.includes(id);
    const disabled = !sel && f.objetivo.length >= SEL_MAX;
    return /* @__PURE__ */ React.createElement("button", { type: "button", key: id, className: "ob-goal" + (sel ? " sel" : "") + (disabled ? " disabled" : ""), disabled, "aria-disabled": disabled, onClick: () => toggleArr("objetivo", id, SEL_MAX) }, /* @__PURE__ */ React.createElement("i", { className: "bx " + ic }), /* @__PURE__ */ React.createElement("span", null, lbl), /* @__PURE__ */ React.createElement("span", { className: "ob-opt-radio", "aria-hidden": "true" }));
  })))), /* @__PURE__ */ React.createElement("div", { className: "ob-grid3" }, /* @__PURE__ */ React.createElement("section", { className: "ob-block" }, /* @__PURE__ */ React.createElement("h3", { className: "ob-block-t" }, /* @__PURE__ */ React.createElement("span", { className: "ob-num" }, "5"), " Como pretende planear o seu or\xE7amento?"), [["criar-agora", "Quero criar um or\xE7amento mensal agora"], ["sugestao", "Quero receber uma sugest\xE3o inicial"], ["mais-tarde", "Prefiro configurar mais tarde"]].map(([id, lbl]) => /* @__PURE__ */ React.createElement(ObRadio, { key: id, label: lbl, on: f.planeamento === id, onClick: () => setF((s) => ({ ...s, planeamento: id })) })), f.planeamento === "criar-agora" && /* @__PURE__ */ React.createElement(Field, { label: `Limite mensal (${cur.sym})`, hint: "Pode ajustar por categoria mais tarde, nas Defini\xE7\xF5es." }, /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement("input", { className: "input tnum", value: f.orcamento, onChange: (e) => setF((s) => ({ ...s, orcamento: e.target.value.replace(/[^\d.,]/g, "") })), placeholder: "1.000,00", inputMode: "decimal", style: { paddingRight: 42 } }), /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "var(--ink-3)" } }, cur.sym))), f.planeamento === "sugestao" && /* @__PURE__ */ React.createElement("div", { className: "ob-inline-note" }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 14, color: "var(--accent)" }), " Preparamos um rascunho com base nas categorias escolhidas \u2014 completa os valores depois de entrar.")), /* @__PURE__ */ React.createElement("section", { className: "ob-block" }, /* @__PURE__ */ React.createElement("h3", { className: "ob-block-t" }, /* @__PURE__ */ React.createElement("span", { className: "ob-num" }, "6"), " Partilha despesas com outras pessoas?"), [["nao", "N\xE3o"], ["parceiro", "Com parceiro ou parceira"], ["familia", "Com fam\xEDlia"], ["casa", "Numa casa partilhada"], ["grupo", "Em grupos ocasionais"]].map(([id, lbl]) => /* @__PURE__ */ React.createElement(ObRadio, { key: id, label: lbl, on: f.partilha === id, onClick: () => setF((s) => ({ ...s, partilha: id })) })))), err && /* @__PURE__ */ React.createElement("div", { className: "alert bad", style: { margin: "16px 0 0", padding: "9px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16, color: "var(--neg)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, err)), /* @__PURE__ */ React.createElement("div", { className: "ob-trust-strip" }, [["lock", "Os seus dados est\xE3o protegidos", "Utilizamos encripta\xE7\xE3o de ponta a ponta."], ["shield", "Privacidade garantida", "Nunca partilhamos os seus dados."], ["shield", "100% Seguro", "Os seus dados est\xE3o sempre protegidos."], ["sync", "Pode alterar depois", "Todas as configura\xE7\xF5es podem ser alteradas."]].map(([ic, t, d]) => /* @__PURE__ */ React.createElement("div", { className: "ob-trust-strip-item", key: t }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(TrustIcon, { name: ic, size: 18 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, t), /* @__PURE__ */ React.createElement("small", null, d))))));
  const aside = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "ob-card" }, /* @__PURE__ */ React.createElement("h4", { className: "ob-card-t" }, "Resumo da sua configura\xE7\xE3o"), /* @__PURE__ */ React.createElement("p", { className: "ob-card-d" }, "Revise as suas informa\xE7\xF5es antes de entrar no Rende+."), /* @__PURE__ */ React.createElement(ObSummaryRow, { icon: "bx-user", label: "Situa\xE7\xE3o atual", value: situacaoLabel }), /* @__PURE__ */ React.createElement(ObSummaryRow, { icon: "bx-wallet", label: "Fontes de rendimento", value: `${f.rendimentos.length} selecionada(s)` }), /* @__PURE__ */ React.createElement(ObSummaryRow, { icon: "bx-receipt", label: "Principais despesas", value: `${f.despesas.length} selecionada(s)` }), /* @__PURE__ */ React.createElement(ObSummaryRow, { icon: "bx-target-lock", label: "Objetivo principal", value: objetivoLabel }), /* @__PURE__ */ React.createElement(ObSummaryRow, { icon: "bx-dollar-circle", label: "Or\xE7amento mensal", value: f.orcamento ? `${f.orcamento} ${cur.sym}` : "\u2014" }), /* @__PURE__ */ React.createElement(ObSummaryRow, { icon: "bx-world", label: "Moeda", value: `${cur.nome} (${cur.sym})` }), /* @__PURE__ */ React.createElement(ObSummaryRow, { icon: "bx-group", label: "Partilha de despesas", value: partilhaLabel })), /* @__PURE__ */ React.createElement("div", { className: "ob-card ob-card-soft ob-final" }, /* @__PURE__ */ React.createElement("h4", { className: "ob-card-t" }, "Est\xE1 quase l\xE1"), /* @__PURE__ */ React.createElement("p", { className: "ob-card-d" }, "Com estas informa\xE7\xF5es o Rende+ poder\xE1 oferecer uma experi\xEAncia personalizada para si."), /* @__PURE__ */ React.createElement("style", null, `@keyframes rmaisSpin{to{transform:rotate(360deg)}}`), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", disabled: busy, style: { width: "100%", justifyContent: "center", padding: 13, fontSize: 15, marginTop: 4 }, onClick: guardarPerfil }, busy && /* @__PURE__ */ React.createElement("span", { style: { width: 15, height: 15, border: "2px solid rgba(255,255,255,.45)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", marginRight: 8, animation: "rmaisSpin .6s linear infinite", verticalAlign: "-2px" } }), busy ? "A guardar\u2026" : /* @__PURE__ */ React.createElement(React.Fragment, null, "Guardar e concluir ", /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 16, color: "#fff" }))), /* @__PURE__ */ React.createElement("button", { className: "ob-back-link", onClick: back }, /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 14, style: { transform: "rotate(180deg)" } }), " Voltar")));
  return chrome(main, aside);
}
window.Onboarding = Onboarding;
