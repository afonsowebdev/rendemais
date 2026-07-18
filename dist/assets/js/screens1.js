function pwChecks(p) {
  p = p || "";
  return { len: p.length >= 8, upper: /[A-Z]/.test(p), lower: /[a-z]/.test(p), num: /[0-9]/.test(p), special: /[^A-Za-z0-9]/.test(p) };
}
function pwScore(p) {
  return Object.values(pwChecks(p)).filter(Boolean).length;
}
function pwStrong(p) {
  return pwScore(p) === 5;
}
function PwInput({ value, onChange, placeholder, show, toggle, autoComplete, disabled }) {
  const tr = useT();
  return /* @__PURE__ */ React.createElement("div", { style: { position: "relative", opacity: disabled ? 0.5 : 1 } }, /* @__PURE__ */ React.createElement("input", { className: "input", type: show ? "text" : "password", value, onChange, placeholder, autoComplete, disabled, style: { paddingRight: 44 } }), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: toggle,
      tabIndex: -1,
      disabled,
      "aria-label": show ? tr("pw_hide") : tr("pw_show"),
      style: { position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 7, display: "grid", placeItems: "center", color: "var(--ink-3)", borderRadius: 8 }
    },
    /* @__PURE__ */ React.createElement(Icon, { name: show ? "eyeOff" : "eye", size: 18 })
  ));
}
function Strength({ value }) {
  const tr = useT();
  if (!value) return null;
  const c = pwChecks(value), s = pwScore(value);
  const level = s <= 2 ? 0 : s <= 4 ? 1 : 2;
  const meta = [{ t: tr("pw_weak"), col: "var(--neg)" }, { t: tr("pw_medium"), col: "var(--c-transporte)" }, { t: tr("pw_strong"), col: "var(--accent)" }][level];
  const reqs = [["len", tr("pw_len")], ["upper", tr("pw_upper")], ["lower", tr("pw_lower")], ["num", tr("pw_num")], ["special", tr("pw_special")]];
  return /* @__PURE__ */ React.createElement("div", { style: { marginTop: -4, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 7 } }, [0, 1, 2, 3, 4].map((i) => /* @__PURE__ */ React.createElement("span", { key: i, style: { flex: 1, height: 4, borderRadius: 99, background: i < s ? meta.col : "var(--border)", transition: "background .2s" } }))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: meta.col, marginBottom: 6 } }, tr("pw_strength"), ": ", meta.t), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "4px 10px" } }, reqs.map(([k, lbl]) => /* @__PURE__ */ React.createElement("span", { key: k, style: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: c[k] ? "var(--accent)" : "var(--ink-3)" } }, /* @__PURE__ */ React.createElement(Icon, { name: c[k] ? "check" : "dots", size: 12, color: c[k] ? "var(--accent)" : "var(--ink-3)" }), " ", lbl))));
}
function Cambio({ base }) {
  const codes = Object.keys(BM.currencies);
  const [de, setDe] = React.useState(base || "EUR");
  const [para, setPara] = React.useState(base === "AOA" ? "EUR" : "AOA");
  const [valor, setValor] = React.useState("100");
  const [rate, setRate] = React.useState(null);
  const [estado, setEstado] = React.useState("load");
  const [updated, setUpdated] = React.useState("");
  React.useEffect(() => {
    setDe(base || "EUR");
  }, [base]);
  React.useEffect(() => {
    if (de === para) {
      setRate(1);
      setEstado("ok");
      return;
    }
    let alive = true;
    setEstado("load");
    setRate(null);
    fetch("https://open.er-api.com/v6/latest/" + de).then((r) => r.json()).then((d) => {
      if (!alive) return;
      if (d && d.result === "success" && d.rates && d.rates[para] != null) {
        setRate(d.rates[para]);
        setUpdated((d.time_last_update_utc || "").slice(0, 16));
        setEstado("ok");
      } else setEstado("err");
    }).catch(() => {
      if (alive) setEstado("err");
    });
    return () => {
      alive = false;
    };
  }, [de, para]);
  const n = parseFloat(String(valor).replace(",", ".")) || 0;
  const conv = rate != null ? n * rate : null;
  const fmt = (v, code) => {
    const c = BM.currencies[code];
    const dec = c && c.dec != null ? c.dec : 2;
    return v.toLocaleString(c && c.locale || "pt-PT", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  };
  const swap = () => {
    const a = de, b = para;
    setDe(b);
    setPara(a);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "card card-pad", style: { marginTop: 4 } }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 8, alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Icon, { name: "coins", size: 16, color: "var(--accent)" }), /* @__PURE__ */ React.createElement("b", { style: { fontSize: 14 } }, "C\xE2mbio ao vivo")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "end" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("input", { className: "input", inputMode: "decimal", value: valor, onChange: (e) => setValor(e.target.value), placeholder: "100" }), /* @__PURE__ */ React.createElement("select", { className: "select", style: { marginTop: 6 }, value: de, onChange: (e) => setDe(e.target.value) }, codes.map((c) => /* @__PURE__ */ React.createElement("option", { key: c, value: c }, c)))), /* @__PURE__ */ React.createElement("button", { type: "button", className: "icon-btn", title: "Trocar", onClick: swap, style: { marginBottom: 1 } }, /* @__PURE__ */ React.createElement(Icon, { name: "sync", size: 16 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "input tnum", style: { display: "flex", alignItems: "center", fontWeight: 700, background: "var(--surface-2)" } }, estado === "load" ? "\u2026" : estado === "err" ? "\u2014" : conv != null ? fmt(conv, para) : "\u2014"), /* @__PURE__ */ React.createElement("select", { className: "select", style: { marginTop: 6 }, value: para, onChange: (e) => setPara(e.target.value) }, codes.map((c) => /* @__PURE__ */ React.createElement("option", { key: c, value: c }, c))))), /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { marginTop: 9, fontWeight: 600 } }, estado === "err" ? "Sem liga\xE7\xE3o \xE0s taxas. Verifica a internet." : estado === "ok" && rate != null ? `1 ${de} = ${fmt(rate, para)} ${para}${updated ? " \xB7 " + updated : ""}` : "A obter taxas\u2026"));
}
function calcIdade(iso) {
  if (!iso) return null;
  const n = /* @__PURE__ */ new Date(iso + "T00:00:00");
  if (isNaN(n.getTime())) return null;
  const h = /* @__PURE__ */ new Date();
  let idade = h.getFullYear() - n.getFullYear();
  const m = h.getMonth() - n.getMonth();
  if (m < 0 || m === 0 && h.getDate() < n.getDate()) idade--;
  return idade;
}
function Auth({ initialMode, onBack, onSignup }) {
  const fin = useFinance();
  const tr = useT();
  const [remember, setRemember] = React.useState(true);
  const [mode, setMode] = React.useState(initialMode || (fin.account ? "login" : "signup"));
  const [f, setF] = React.useState(() => {
    const pais = BM.detectCountry();
    const m = BM.currencyForCountry(pais);
    return { nome: "", email: "", password: "", password2: "", code: "", nascimento: "", cidade: "", pais, perfil: "Estudante", estado: "Solteiro(a)", habitacao: "Vive com colegas", moeda: m, multi: false, moedas: [m] };
  });
  const [cidadeOutra, setCidadeOutra] = React.useState(false);
  const setCountry = (code) => {
    const m = BM.currencyForCountry(code);
    setCidadeOutra(false);
    setF((s) => ({ ...s, pais: code, cidade: "", moeda: m, moedas: [m] }));
  };
  const [err, setErr] = React.useState("");
  const [okMsg, setOkMsg] = React.useState("");
  const [setupToken, setSetupToken] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);
  const [showPw2, setShowPw2] = React.useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const onNome = (e) => {
    let v = e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, "").replace(/\s{2,}/g, " ").replace(/(^|\s)([a-zà-öø-ÿ])/g, (m, sp, ch) => sp + ch.toUpperCase());
    setF((s) => ({ ...s, nome: v }));
  };
  const toggleMoeda = (code) => setF((s) => {
    if (code === s.moeda) return s;
    const has = (s.moedas || []).includes(code);
    const next = has ? (s.moedas || []).filter((x) => x !== code) : [...s.moedas || [], code];
    return { ...s, moedas: Array.from(/* @__PURE__ */ new Set([s.moeda, ...next])) };
  });
  const goMode = (m) => {
    setErr("");
    setOkMsg("");
    setMode(m);
  };
  const doRegister = async () => {
    if (!f.nome.trim() || !f.email.trim()) {
      setErr(tr("auth_err_fill"));
      return;
    }
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]+(?: [A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(f.nome.trim())) {
      setErr("O nome s\xF3 pode conter letras.");
      return;
    }
    const idade = calcIdade(f.nascimento);
    if (idade == null) {
      setErr("Indica a tua data de nascimento.");
      return;
    }
    if (idade < 16) {
      setErr("Tens de ter pelo menos 16 anos para criar conta.");
      return;
    }
    if (!f.cidade) {
      setErr("Seleciona a tua prov\xEDncia ou regi\xE3o.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
      setErr("Indica um email v\xE1lido.");
      return;
    }
    setErr("");
    try {
      await fin.iniciarRegisto({ email: f.email, nome: f.nome, moeda: f.moeda, idade });
      setF((s) => ({ ...s, code: "" }));
      setOkMsg("");
      setMode("verify");
    } catch (e) {
      setErr(e.message || tr("auth_err_signup"));
    }
  };
  const doVerify = async () => {
    if (!/^\d{6}$/.test((f.code || "").trim())) {
      setErr("Introduz o c\xF3digo de 6 d\xEDgitos.");
      return;
    }
    setErr("");
    try {
      const tok = await fin.verificarEmail(f.email, f.code);
      setSetupToken(tok);
      setF((s) => ({ ...s, password: "", password2: "" }));
      setOkMsg("");
      setMode("setpw");
    } catch (e) {
      setErr(e.message || "N\xE3o foi poss\xEDvel confirmar o c\xF3digo.");
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
  const doSetPw = async () => {
    if (!pwStrong(f.password)) {
      setErr(tr("auth_err_weak"));
      return;
    }
    if (f.password !== f.password2) {
      setErr(tr("auth_err_mismatch"));
      return;
    }
    setErr("");
    try {
      await fin.definirPassword(setupToken, f.password, { idade: calcIdade(f.nascimento), nascimento: f.nascimento, cidade: f.cidade, pais: f.pais, perfil: f.perfil, estado: f.estado, habitacao: f.habitacao, moeda: f.moeda, moedas: f.moedas });
    } catch (e) {
      setErr(e.message || "N\xE3o foi poss\xEDvel definir a palavra-passe.");
    }
  };
  const doLogin = async () => {
    if (!f.email.trim() || !f.password) {
      setErr(tr("auth_err_fill"));
      return;
    }
    setErr("");
    try {
      await fin.login(f.email, f.password);
    } catch (e) {
      setErr(e.message || tr("auth_err_login"));
    }
  };
  const doForgot = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return setErr("Indica um email v\xE1lido.");
    setErr("");
    try {
      await fin.esqueciPassword(f.email);
      setF((s) => ({ ...s, code: "", password: "", password2: "" }));
      setOkMsg("Se existir uma conta com esse email, envi\xE1mos um c\xF3digo de 6 d\xEDgitos. Verifica o teu email.");
      setMode("reset");
    } catch (e) {
      setErr(e.message || "N\xE3o foi poss\xEDvel enviar o c\xF3digo.");
    }
  };
  const doReset = async () => {
    if (!/^\d{6}$/.test((f.code || "").trim())) return setErr("Introduz o c\xF3digo de 6 d\xEDgitos.");
    if (!pwStrong(f.password)) return setErr(tr("auth_err_weak2"));
    if (f.password !== f.password2) return setErr(tr("auth_err_mismatch"));
    setErr("");
    try {
      await fin.redefinirPassword(f.email, f.code, f.password);
    } catch (e) {
      setErr(e.message || "N\xE3o foi poss\xEDvel alterar a palavra-passe.");
    }
  };
  const primaryAction = mode === "signup" ? doRegister : mode === "verify" ? doVerify : mode === "setpw" ? doSetPw : mode === "login" ? doLogin : mode === "forgot" ? doForgot : doReset;
  const titles = {
    signup: [tr("auth_title_signup"), tr("auth_sub_signup")],
    verify: ["Confirma o teu email", "Envi\xE1mos um c\xF3digo de 6 d\xEDgitos para " + (f.email || "o teu email") + "."],
    setpw: ["Define a tua palavra-passe", "Quase l\xE1. Escolhe uma palavra-passe segura para entrar."],
    login: [tr("auth_title_login"), tr("auth_sub_login")],
    forgot: [tr("auth_title_forgot"), tr("auth_sub_forgot")],
    reset: [tr("auth_title_reset"), tr("auth_sub_reset").split("{email}").join(f.email || tr("auth_your_email"))]
  };
  const primaryLabel = { signup: "Continuar", verify: "Confirmar email", setpw: "Definir e entrar", login: tr("auth_btn_login"), forgot: tr("auth_btn_forgot"), reset: tr("auth_btn_reset") }[mode];
  const loadingLabel = { signup: "A enviar c\xF3digo\u2026", verify: "A confirmar\u2026", setpw: "A criar conta\u2026", login: tr("auth_load_login"), forgot: tr("auth_load_forgot"), reset: tr("auth_load_reset") }[mode];
  const runPrimary = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await primaryAction();
    } finally {
      setBusy(false);
    }
  };
  const loginTitle = mode === "login" ? "Bem-vindo de volta" : titles[mode][0];
  const loginSub = mode === "login" ? "Inicie sess\xE3o para continuar a gerir a sua vida financeira." : titles[mode][1];
  return /* @__PURE__ */ React.createElement("div", { className: "login-wrap login-wrap-v2" }, /* @__PURE__ */ React.createElement("div", { className: "login-form" }, /* @__PURE__ */ React.createElement("form", { className: "login-card", onSubmit: (e) => {
    e.preventDefault();
    runPrimary();
  } }, /* @__PURE__ */ React.createElement("div", { className: "login-form-brand" }, /* @__PURE__ */ React.createElement(Brand, null)), /* @__PURE__ */ React.createElement("div", { className: "login-brand-top" }, /* @__PURE__ */ React.createElement(Brand, null)), onBack && /* @__PURE__ */ React.createElement("button", { type: "button", onClick: onBack, className: "auth-back auth-back-strong" }, /* @__PURE__ */ React.createElement("i", { className: "bx bx-chevron-left", "aria-hidden": "true" }), " Voltar"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 28, fontWeight: 700, letterSpacing: "-.02em", margin: "0 0 6px" } }, loginTitle), /* @__PURE__ */ React.createElement("p", { className: "muted", style: { margin: "0 0 24px", fontSize: 14, fontWeight: 500, lineHeight: 1.55 } }, loginSub), okMsg && /* @__PURE__ */ React.createElement("div", { className: "alert ok", style: { marginBottom: 16, padding: "10px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16, color: "var(--accent)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, okMsg)), mode === "signup" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: tr("auth_name") }, /* @__PURE__ */ React.createElement("input", { className: "input", value: f.nome, onChange: onNome, placeholder: tr("auth_name_ph"), autoComplete: "name" })), /* @__PURE__ */ React.createElement(Field, { label: tr("auth_country") }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.pais, onChange: (e) => setCountry(e.target.value) }, BM.countries.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.code, value: c.code }, tr("country_" + c.code))))), /* @__PURE__ */ React.createElement(Field, { label: "Data de nascimento", hint: "Calculamos a tua idade a partir desta data." }, /* @__PURE__ */ React.createElement("input", { className: "input", type: "date", value: f.nascimento, max: BM.todayISO(), onChange: (e) => setF((s) => ({ ...s, nascimento: e.target.value })) }), calcIdade(f.nascimento) != null && /* @__PURE__ */ React.createElement("div", { className: "tiny", style: { marginTop: 7, fontWeight: 700, color: calcIdade(f.nascimento) < 16 ? "var(--neg)" : "var(--accent)" } }, calcIdade(f.nascimento) < 16 ? `Tens ${calcIdade(f.nascimento)} anos \u2014 a idade m\xEDnima \xE9 16.` : `Tens ${calcIdade(f.nascimento)} anos.`)), /* @__PURE__ */ React.createElement(Field, { label: "Prov\xEDncia / Regi\xE3o" }, /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "select",
      value: cidadeOutra ? "__other__" : f.cidade,
      onChange: (e) => {
        if (e.target.value === "__other__") {
          setCidadeOutra(true);
          setF((s) => ({ ...s, cidade: "" }));
        } else {
          setCidadeOutra(false);
          setF((s) => ({ ...s, cidade: e.target.value }));
        }
      }
    },
    /* @__PURE__ */ React.createElement("option", { value: "", disabled: true }, "Seleciona a tua prov\xEDncia"),
    BM.countryProvinces(f.pais).map((c) => /* @__PURE__ */ React.createElement("option", { key: c, value: c }, c)),
    /* @__PURE__ */ React.createElement("option", { value: "__other__" }, "Outra\u2026")
  ), cidadeOutra && /* @__PURE__ */ React.createElement("input", { className: "input", style: { marginTop: 8 }, value: f.cidade, onChange: set("cidade"), placeholder: "A tua regi\xE3o" })), /* @__PURE__ */ React.createElement(Field, { label: tr("auth_situation") }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.perfil, onChange: set("perfil") }, [["Estudante", tr("auth_opt_student")], ["Trabalhador", tr("auth_opt_worker")], ["Estudante e Trabalhador", tr("auth_opt_both")], ["Autonomo", "Aut\xF3nomo/a (apoio familiar)"]].map(([v, lbl]) => /* @__PURE__ */ React.createElement("option", { key: v, value: v }, lbl)))), /* @__PURE__ */ React.createElement(Field, { label: tr("auth_currency"), hint: "Definida pelo teu pa\xEDs. N\xE3o pode ser alterada." }, /* @__PURE__ */ React.createElement("div", { className: "input", style: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-2)", cursor: "not-allowed", fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", null, (BM.currencies[f.moeda] || {}).sym, " (", f.moeda, ")"), /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 15, color: "var(--accent)" }))), /* @__PURE__ */ React.createElement(Field, { label: "Queres gerir mais do que uma moeda?" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "chip" + (!f.multi ? " sel" : ""), style: { cursor: "pointer" }, onClick: () => setF((s) => ({ ...s, multi: false, moedas: [s.moeda] })) }, "N\xE3o"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "chip" + (f.multi ? " sel" : ""), style: { cursor: "pointer" }, onClick: () => setF((s) => ({ ...s, multi: true })) }, "Sim"))), f.multi && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: "Moedas que queres gerir", hint: "A do teu pa\xEDs est\xE1 sempre inclu\xEDda." }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { flexWrap: "wrap", gap: 7 } }, Object.values(BM.currencies).map((c) => {
    const on = c.code === f.moeda || (f.moedas || []).includes(c.code);
    return /* @__PURE__ */ React.createElement("button", { type: "button", key: c.code, className: "chip" + (on ? " sel" : ""), disabled: c.code === f.moeda, style: { cursor: c.code === f.moeda ? "default" : "pointer", opacity: c.code === f.moeda ? 0.7 : 1 }, onClick: () => toggleMoeda(c.code) }, c.sym, " ", c.code);
  }))), /* @__PURE__ */ React.createElement(Cambio, { base: f.moeda }))), (mode === "signup" || mode === "login" || mode === "forgot") && /* @__PURE__ */ React.createElement(Field, { label: tr("email") }, /* @__PURE__ */ React.createElement("input", { className: "input", value: f.email, onChange: set("email"), placeholder: tr("auth_email_ph") })), mode === "login" && /* @__PURE__ */ React.createElement(Field, { label: tr("auth_password") }, /* @__PURE__ */ React.createElement(PwInput, { value: f.password, onChange: set("password"), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", show: showPw, toggle: () => setShowPw((v) => !v), autoComplete: "current-password", disabled: !f.email.trim() })), mode === "verify" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: "C\xF3digo de verifica\xE7\xE3o" }, /* @__PURE__ */ React.createElement("input", { className: "input tnum", value: f.code, onChange: (e) => setF((s) => ({ ...s, code: e.target.value.replace(/\D/g, "").slice(0, 6) })), placeholder: "000000", inputMode: "numeric", maxLength: 6, autoFocus: true, style: { letterSpacing: ".3em", fontSize: 18, textAlign: "center" } })), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginTop: -4, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: doResend, style: { background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", fontSize: 12.5, cursor: "pointer", padding: 0 } }, "N\xE3o recebeste? Reenviar c\xF3digo"))), mode === "setpw" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: tr("auth_password") }, /* @__PURE__ */ React.createElement(PwInput, { value: f.password, onChange: set("password"), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", show: showPw, toggle: () => setShowPw((v) => !v), autoComplete: "new-password" })), /* @__PURE__ */ React.createElement(Strength, { value: f.password }), /* @__PURE__ */ React.createElement(Field, { label: tr("auth_confirm_password") }, /* @__PURE__ */ React.createElement(PwInput, { value: f.password2, onChange: set("password2"), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", show: showPw2, toggle: () => setShowPw2((v) => !v), autoComplete: "new-password", disabled: !pwStrong(f.password) }))), mode === "login" && /* @__PURE__ */ React.createElement("div", { className: "login-row-remember" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "login-remember" + (remember ? " on" : ""), onClick: () => setRemember((v) => !v) }, /* @__PURE__ */ React.createElement("span", { className: "login-remember-box", "aria-hidden": "true" }, remember && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 13, color: "#fff" })), /* @__PURE__ */ React.createElement("span", null, "Manter sess\xE3o iniciada")), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => goMode("forgot"), style: { background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", fontSize: 12.5, cursor: "pointer", padding: 0 } }, tr("auth_forgot_link"))), mode === "reset" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "alert ok", style: { marginBottom: 14, padding: "10px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16, color: "var(--accent)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700, lineHeight: 1.5 } }, "Envi\xE1mos um c\xF3digo de 6 d\xEDgitos para ", /* @__PURE__ */ React.createElement("strong", null, f.email || "o teu email"), ". Escreve-o aqui em baixo com a nova palavra-passe. V\xE1lido durante 15 minutos.")), /* @__PURE__ */ React.createElement(Field, { label: tr("auth_reset_code_label") }, /* @__PURE__ */ React.createElement("input", { className: "input tnum", value: f.code, onChange: (e) => setF((s) => ({ ...s, code: e.target.value.replace(/\D/g, "").slice(0, 6) })), placeholder: "123456", inputMode: "numeric", maxLength: 6 })), /* @__PURE__ */ React.createElement(Field, { label: tr("auth_new_password") }, /* @__PURE__ */ React.createElement(PwInput, { value: f.password, onChange: set("password"), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", show: showPw, toggle: () => setShowPw((v) => !v), autoComplete: "new-password" })), /* @__PURE__ */ React.createElement(Strength, { value: f.password }), /* @__PURE__ */ React.createElement(Field, { label: tr("auth_confirm_password") }, /* @__PURE__ */ React.createElement(PwInput, { value: f.password2, onChange: set("password2"), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", show: showPw2, toggle: () => setShowPw2((v) => !v), autoComplete: "new-password" }))), err && /* @__PURE__ */ React.createElement("div", { className: "alert bad", style: { marginBottom: 12, padding: "9px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16, color: "var(--neg)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, err)), /* @__PURE__ */ React.createElement("style", null, `@keyframes rmaisSpin{to{transform:rotate(360deg)}}`), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary", disabled: busy, style: { width: "100%", justifyContent: "center", padding: "13px", fontSize: 15, marginTop: 4, border: "none", opacity: busy ? 0.8 : 1, cursor: busy ? "wait" : "pointer" } }, busy && /* @__PURE__ */ React.createElement("span", { style: { width: 15, height: 15, border: "2px solid rgba(255,255,255,.45)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", marginRight: 8, animation: "rmaisSpin .6s linear infinite", verticalAlign: "-2px" } }), busy ? loadingLabel : primaryLabel), mode === "login" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "login-sep" }, /* @__PURE__ */ React.createElement("span", null, "ou continue com")), /* @__PURE__ */ React.createElement("div", { className: "login-social" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "login-social-btn", onClick: () => setErr("O in\xEDcio de sess\xE3o com Google chega em breve. Por agora, entra com o teu email.") }, /* @__PURE__ */ React.createElement(Icon, { name: "google", size: 18 }), " Continuar com Google"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "login-social-btn", onClick: () => setErr("O in\xEDcio de sess\xE3o com Apple chega em breve. Por agora, entra com o teu email.") }, /* @__PURE__ */ React.createElement("i", { className: "bx bxl-apple", style: { fontSize: 20 } }), " Continuar com Apple"))), /* @__PURE__ */ React.createElement("p", { className: "muted tiny", style: { textAlign: "center", marginTop: 20, fontWeight: 600 } }, mode === "signup" && /* @__PURE__ */ React.createElement(React.Fragment, null, tr("auth_have_account"), " ", /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => goMode("login"), style: { background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", cursor: "pointer", padding: 0 } }, tr("auth_signin_link"))), mode === "login" && /* @__PURE__ */ React.createElement(React.Fragment, null, tr("auth_no_account"), " ", /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => onSignup ? onSignup() : goMode("signup"), style: { background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", cursor: "pointer", padding: 0 } }, "Criar Conta")), mode === "verify" && /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => goMode("signup"), style: { background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", cursor: "pointer", padding: 0 } }, "Voltar e corrigir o email"), (mode === "forgot" || mode === "reset") && /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => goMode("login"), style: { background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", cursor: "pointer", padding: 0 } }, tr("auth_back_login"))))), /* @__PURE__ */ React.createElement("aside", { className: "login-aside" }, /* @__PURE__ */ React.createElement("div", { className: "login-aside-body" }, /* @__PURE__ */ React.createElement("span", { className: "lp2-tag" }, "Aplica\xE7\xE3o de Gest\xE3o Financeira"), /* @__PURE__ */ React.createElement("h2", { className: "login-aside-h1" }, "O seu dinheiro. Os seus objetivos. O seu futuro."), /* @__PURE__ */ React.createElement("p", { className: "login-aside-sub" }, "O Rende+ ajuda-o a organizar receitas, despesas, objetivos financeiros e o or\xE7amento mensal num \xFAnico lugar."), /* @__PURE__ */ React.createElement("ul", { className: "lp2-checks" }, ["Organize receitas e despesas.", "Acompanhe os seus objetivos financeiros.", "Planeie o or\xE7amento mensal.", "Partilhe despesas com outras pessoas."].map((t) => /* @__PURE__ */ React.createElement("li", { key: t }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 17, color: "var(--accent)", sw: 2.4 }), " ", t))), /* @__PURE__ */ React.createElement("img", { className: "login-aside-img login-aside-img-compact", src: "assets/img/login-devices.png", alt: "Rende+ no computador e no telem\xF3vel" }))));
}
function Dashboard({ go, open }) {
  var _a, _b, _c, _d;
  const fin = useFinance();
  const tr = useT();
  const tt = (k, v) => {
    let s = tr(k);
    if (v) Object.keys(v).forEach((kk) => {
      s = s.split("{" + kk + "}").join(v[kk]);
    });
    return s;
  };
  const tcat = (key) => {
    if (BM.cats[key]) {
      const kk = "cat_" + key, vv = tr(kk);
      return vv === kk ? BM.cats[key].nome : vv;
    }
    const cc = (fin.data.customCats || []).find((c) => c.key === key);
    return cc ? cc.nome : tr("cat_outros");
  };
  const hasData = fin.despMes.length > 0 || fin.rendMes.length > 0;
  const prefs = Array.isArray((_a = fin.account) == null ? void 0 : _a.preferencia) ? fin.account.preferencia : ((_b = fin.account) == null ? void 0 : _b.preferencia) ? [fin.account.preferencia] : [];
  const atalhosPersonalizados = [
    prefs.includes("objetivos") && { icon: "target", t: "Crie o seu primeiro objetivo", d: "Defina uma meta e acompanhe o progresso.", onClick: () => go("objetivos") },
    prefs.includes("orcamento") && !fin.data.orcamento && { icon: "wallet", t: "Crie o seu or\xE7amento mensal", d: "Defina um limite de gastos para o m\xEAs.", onClick: () => open("orcamento") },
    prefs.includes("partilhadas") && { icon: "users", t: "Crie o primeiro grupo", d: "Divida despesas com quem partilha consigo.", onClick: () => go("partilha") },
    prefs.includes("pagamentos") && { icon: "cal", t: "Acompanhe pagamentos futuros", d: "Adicione lembretes e nunca perca uma data.", onClick: () => go("agenda") }
  ].filter(Boolean);
  const orc = fin.data.orcamento;
  const pctGasto = orc ? Math.round(fin.totalGasto / orc * 100) : null;
  const recent = [...fin.despMes].sort((a, b) => (b.data || "").localeCompare(a.data || "")).slice(0, 6);
  const recSpark = fin.series.map((m) => m.rec);
  const gastoSpark = fin.series.map((m) => m.gasto);
  if (!hasData) {
    return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement(
      EmptyState,
      {
        icon: "bolt",
        title: tt("dash_empty_title", { nome: (((_c = fin.account) == null ? void 0 : _c.nome) || "").split(" ")[0] || "ol\xE1" }),
        msg: tt("dash_empty_msg", { month: fin.monthLabel }),
        action: /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => open("rendimento") }, /* @__PURE__ */ React.createElement(Icon, { name: "arrowsDown", size: 16, color: "#fff" }), " ", tr("add_income")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => open("despesa") }, /* @__PURE__ */ React.createElement(Icon, { name: "wallet", size: 16 }), " ", tr("add_expense")))
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: "1fr 1fr 1fr" } }, [
      ["arrowsDown", tr("dash_step1_t"), tr("dash_step1_d")],
      ["wallet", tr("dash_step2_t"), tr("dash_step2_d")],
      ["chart", tr("dash_step3_t"), tr("dash_step3_d")]
    ].map(([ic, ti, d]) => /* @__PURE__ */ React.createElement("div", { className: "card card-pad", key: ti }, /* @__PURE__ */ React.createElement("div", { className: "kpi-ico", style: { background: "var(--accent-soft)", marginBottom: 12 } }, /* @__PURE__ */ React.createElement(Icon, { name: ic, size: 19, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15 } }, ti), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { marginTop: 5, fontWeight: 600, lineHeight: 1.5 } }, d)))), atalhosPersonalizados.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: `repeat(${atalhosPersonalizados.length}, 1fr)`, marginTop: 4 } }, atalhosPersonalizados.map((a) => /* @__PURE__ */ React.createElement("button", { type: "button", className: "card card-pad", key: a.t, onClick: a.onClick, style: { textAlign: "left", cursor: "pointer", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { className: "kpi-ico", style: { background: "var(--accent-soft)", marginBottom: 12 } }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 19, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15 } }, a.t), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { marginTop: 5, fontWeight: 600, lineHeight: 1.5 } }, a.d)))));
  }
  const alerts = [];
  if (pctGasto != null && pctGasto >= 80) alerts.push(["warn", "bell", tt("dash_alert_budget_t", { pct: pctGasto }), tt("dash_alert_budget_d", { x: BM.eur(Math.max(0, orc - fin.totalGasto)), y: BM.eur0(orc) })]);
  if (fin.saldo < 0) alerts.push(["bad", "info", tr("dash_alert_neg_t"), tt("dash_alert_neg_d", { x: BM.eur(-fin.saldo) })]);
  const metasAbertas = fin.data.metas.filter((m) => !m.fechada);
  const metaDestaque = [...metasAbertas].sort((a, b) => {
    const pa = a.alvo > 0 ? a.atual / a.alvo : -1;
    const pb = b.alvo > 0 ? b.atual / b.alvo : -1;
    return pb - pa;
  })[0] || null;
  const prem = usePremium();
  const proximosPagamentos = scanAlertas(prem).slice(0, 5);
  const diaLabel = (d) => d < 0 ? "Atrasado" : d === 0 ? "Vence hoje" : d === 1 ? "Vence amanh\xE3" : `Em ${d} dias`;
  const ehPremium = ((_d = fin.account) == null ? void 0 : _d.plano) === "premium";
  const [qaOpen, setQaOpen, qaRef] = useDropdownClose();
  const [novoEvento, setNovoEvento] = React.useState(false);
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, alerts.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: `repeat(${Math.min(3, alerts.length)},1fr)` } }, alerts.slice(0, 3).map((a, i) => /* @__PURE__ */ React.createElement(Alert, { key: i, kind: a[0], icon: a[1], title: a[2] }, a[3]))), /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between", flexWrap: "wrap", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "qa-menu", ref: qaRef }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => setQaOpen((v) => !v), "aria-haspopup": "menu", "aria-expanded": qaOpen }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 16, color: "#fff" }), " Nova transa\xE7\xE3o ", /* @__PURE__ */ React.createElement("i", { className: "bx bx-chevron-down", "aria-hidden": "true", style: { fontSize: 15 } })), qaOpen && /* @__PURE__ */ React.createElement("div", { className: "qa-menu-pop", role: "menu", "aria-label": "Nova transa\xE7\xE3o" }, /* @__PURE__ */ React.createElement("button", { type: "button", role: "menuitem", onClick: () => {
    setQaOpen(false);
    open("rendimento");
  } }, /* @__PURE__ */ React.createElement(Icon, { name: "arrowsDown", size: 16 }), " ", tr("add_income")), /* @__PURE__ */ React.createElement("button", { type: "button", role: "menuitem", onClick: () => {
    setQaOpen(false);
    open("despesa");
  } }, /* @__PURE__ */ React.createElement(Icon, { name: "wallet", size: 16 }), " ", tr("add_expense")))), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-soft", onClick: () => open("meta") }, /* @__PURE__ */ React.createElement(Icon, { name: "target", size: 15 }), " Novo objetivo"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-soft", onClick: () => setNovoEvento(true) }, /* @__PURE__ */ React.createElement(Icon, { name: "cal", size: 15 }), " Novo evento"), ehPremium && /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-soft", onClick: () => go("partilha") }, /* @__PURE__ */ React.createElement(Icon, { name: "users", size: 15 }), " Novo grupo"))), /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))" } }, /* @__PURE__ */ React.createElement(Kpi, { label: tr("kpi_received"), value: BM.eur0(fin.totalRec), icon: "arrowsDown", color: "var(--accent)", spark: recSpark }), /* @__PURE__ */ React.createElement(Kpi, { label: tr("kpi_spent"), value: BM.eur0(fin.totalGasto), icon: "wallet", color: "var(--c-transporte)", spark: gastoSpark }), /* @__PURE__ */ React.createElement(Kpi, { label: tr("kpi_available"), value: BM.eur0(fin.disponivel), icon: "bolt", color: fin.disponivel < 0 ? "var(--neg)" : "var(--c-habitacao)", sub: fin.poupancaSeparada > 0 ? tt("kpi_after_savings", { x: BM.eur0(fin.poupancaSeparada) }) : tr("kpi_until_eom") }), /* @__PURE__ */ React.createElement(Kpi, { label: tr("kpi_saved"), value: BM.eur0(fin.poupado), icon: "target", color: "var(--c-educacao)", sub: tt(fin.data.metas.length === 1 ? "kpi_meta_one" : "kpi_meta_many", { n: fin.data.metas.length }) }), /* @__PURE__ */ React.createElement(Kpi, { label: "Objetivos ativos", value: String(metasAbertas.length), icon: "target", color: "var(--c-lazer)", sub: metasAbertas.length === 0 ? "Nenhum em curso" : void 0 })), /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: "1.5fr 1fr" } }, /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "section-head", style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, tr("dash_evolution")), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 600, marginTop: 2 } }, tr("dash_evolution_sub"))), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 14, alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { className: "row tiny", style: { fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "dot", style: { background: "var(--accent)" } }), " ", tr("legend_received")), /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "dot", style: { background: "var(--c-transporte)" } }), " ", tr("legend_spent"))), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-soft", style: { padding: "7px 12px" }, onClick: () => go("relatorios") }, /* @__PURE__ */ React.createElement(Icon, { name: "chart", size: 14 }), " Ver hist\xF3rico"))), /* @__PURE__ */ React.createElement(LineChart, { data: fin.series, height: 216 })), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "section-head", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, tr("dash_by_category")), /* @__PURE__ */ React.createElement("span", { className: "tnum", style: { fontWeight: 700, fontSize: 15 } }, BM.eur0(fin.totalGasto))), fin.catBreak.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { display: "grid", placeItems: "center", height: 200, textAlign: "center" }, className: "muted tiny" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Icon, { name: "cart", size: 26, color: "var(--ink-3)" }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontWeight: 600 } }, tr("dash_no_expenses")))) : /* @__PURE__ */ React.createElement(BarBreakdown, { data: fin.catBreak.slice(0, 7), money: BM.eur0, labelOf: (c) => tcat(c.key) }))), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "section-head", style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, tr("dash_savings_evo")), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 600, marginTop: 2 } }, tr("dash_savings_evo_sub"))), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, /* @__PURE__ */ React.createElement("div", { className: "tnum", style: { fontWeight: 700, fontSize: 18, color: "var(--c-educacao)" } }, BM.eur0(fin.poupado)), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 700 } }, tr("kpi_saved")))), fin.poupado === 0 && fin.series.every((s) => !s.poupAcum) ? /* @__PURE__ */ React.createElement("div", { style: { display: "grid", placeItems: "center", height: 150, textAlign: "center" }, className: "muted tiny" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Icon, { name: "target", size: 26, color: "var(--ink-3)" }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontWeight: 600 } }, tr("dash_no_savings")))) : /* @__PURE__ */ React.createElement(SavingsArea, { data: fin.series })), /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: "1.5fr 1fr" } }, /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "section-head", style: { marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, tr("dash_recent")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-soft", style: { padding: "7px 12px" }, onClick: () => go("transacoes") }, tr("see_all"), " ", /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 14 }))), recent.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { padding: "24px 0", fontWeight: 600 } }, tr("dash_no_expenses"), ".") : /* @__PURE__ */ React.createElement("div", { className: "list" }, recent.map((d) => /* @__PURE__ */ React.createElement("div", { className: "li", key: d.id }, /* @__PURE__ */ React.createElement(CatBadge, { catKey: d.cat }), /* @__PURE__ */ React.createElement("div", { className: "li-main" }, /* @__PURE__ */ React.createElement("div", { className: "li-title" }, d.nome), /* @__PURE__ */ React.createElement("div", { className: "li-sub" }, tcat(d.cat), " \xB7 ", BM.fmtData(d.data), " \xB7 ", d.tipo === "fixa" ? tr("fixed") : tr("variable"))), /* @__PURE__ */ React.createElement("div", { className: "li-amt tnum", style: { color: "var(--neg)" } }, "\u2212", BM.eur(d.valor)))))), /* @__PURE__ */ React.createElement("div", { className: "card card-pad", style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "section-head" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, tr("dash_budget")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-soft", style: { padding: "5px 10px" }, onClick: () => open("orcamento") }, /* @__PURE__ */ React.createElement(Icon, { name: "edit", size: 13 }), " ", tr("define"))), orc ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between", marginBottom: 9 } }, /* @__PURE__ */ React.createElement("span", { className: "tnum", style: { fontWeight: 700, fontSize: 18 } }, BM.eur0(fin.totalGasto)), /* @__PURE__ */ React.createElement("span", { className: "muted tiny", style: { fontWeight: 700 } }, tt("of_amount", { x: BM.eur0(orc) }))), /* @__PURE__ */ React.createElement(Progress, { value: fin.totalGasto, max: orc, color: pctGasto > 80 ? "var(--warn)" : "var(--accent)" }), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { marginTop: 9, fontWeight: 600 } }, tt("budget_left", { x: BM.eur(Math.max(0, orc - fin.totalGasto)), pct: pctGasto }))) : /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600 } }, tr("budget_empty")), /* @__PURE__ */ React.createElement("div", { style: { borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 13 } }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", { className: "tiny", style: { fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink-3)" } }, "Objetivo em destaque"), metaDestaque && /* @__PURE__ */ React.createElement("button", { onClick: () => go("objetivos"), style: { background: "none", border: "none", color: "var(--accent)", fontWeight: 700, cursor: "pointer", padding: 0, font: "inherit", fontSize: 12 } }, tr("see_all"))), !metaDestaque ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600 } }, tr("goals_empty"), " ", /* @__PURE__ */ React.createElement("button", { onClick: () => go("objetivos"), style: { background: "none", border: "none", color: "var(--accent)", fontWeight: 700, cursor: "pointer", padding: 0, font: "inherit" } }, tr("goals_create_first"))) : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between", marginBottom: 7 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700 } }, metaDestaque.nome), /* @__PURE__ */ React.createElement("span", { className: "tnum tiny muted", style: { fontWeight: 700 } }, BM.eur0(metaDestaque.atual), " / ", BM.eur0(metaDestaque.alvo))), /* @__PURE__ */ React.createElement(Progress, { value: metaDestaque.atual, max: metaDestaque.alvo, color: metaDestaque.cor }))))), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "section-head", style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Pr\xF3ximos pagamentos"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-soft", style: { padding: "7px 12px" }, onClick: () => go("agenda") }, tr("see_all"), " ", /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 14 }))), proximosPagamentos.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { padding: "20px 0", fontWeight: 600 } }, "Sem pagamentos a vencer nos pr\xF3ximos dias.") : /* @__PURE__ */ React.createElement("div", { className: "list" }, proximosPagamentos.map((a) => /* @__PURE__ */ React.createElement("div", { className: "li", key: a.chave }, /* @__PURE__ */ React.createElement("div", { className: "kpi-ico", style: { background: "var(--accent-soft)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "cal", size: 17, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("div", { className: "li-main" }, /* @__PURE__ */ React.createElement("div", { className: "li-title" }, a.titulo), /* @__PURE__ */ React.createElement("div", { className: "li-sub" }, diaLabel(a.d))), /* @__PURE__ */ React.createElement("div", { className: "li-amt tnum" }, BM.eur(a.valor)))))), novoEvento && /* @__PURE__ */ React.createElement(LembreteModal, { item: null, onClose: () => setNovoEvento(false), onSave: (it) => {
    prem.add("lembretes", it);
    setNovoEvento(false);
  } }));
}
function Transacoes({ open }) {
  const [tab, setTab] = React.useState("despesas");
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "content", style: { paddingBottom: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", { className: "pg-tabs", style: { width: "fit-content" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "pg-tab" + (tab === "despesas" ? " on" : ""), onClick: () => setTab("despesas") }, /* @__PURE__ */ React.createElement(Icon, { name: "wallet", size: 15 }), " Despesas"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "pg-tab" + (tab === "rendimentos" ? " on" : ""), onClick: () => setTab("rendimentos") }, /* @__PURE__ */ React.createElement(Icon, { name: "arrowsDown", size: 15 }), " Receitas")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-primary", onClick: () => open(tab === "despesas" ? "despesa" : "rendimento") }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 16, color: "#fff" }), " ", /* @__PURE__ */ React.createElement("span", { className: "hide-mobile" }, tab === "despesas" ? "Nova despesa" : "Novo rendimento")))), tab === "despesas" ? /* @__PURE__ */ React.createElement(Despesas, { open }) : /* @__PURE__ */ React.createElement(Rendimentos, { open }));
}
function Despesas({ open }) {
  const fin = useFinance();
  const tr = useT();
  const tt = (k, v) => tfmt(tr(k), v);
  const tcat = (key) => {
    if (BM.cats[key]) {
      const kk = "cat_" + key, vv = tr(kk);
      return vv === kk ? BM.cats[key].nome : vv;
    }
    const cc = (fin.data.customCats || []).find((c) => c.key === key);
    return cc ? cc.nome : tr("cat_outros");
  };
  const [tipo, setTipo] = React.useState("todas");
  const [cat, setCat] = React.useState("todas");
  const catKeys = Object.keys(BM.cats);
  let rows = fin.despMes.filter((d) => (tipo === "todas" || d.tipo === tipo) && (cat === "todas" || d.cat === cat));
  rows = [...rows].sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const total = rows.reduce((s, d) => s + (+d.valor || 0), 0);
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: "repeat(3,1fr)" } }, /* @__PURE__ */ React.createElement(Kpi, { label: tr("exp_total"), value: BM.eur0(fin.totalGasto), icon: "wallet", color: "var(--c-transporte)", sub: tt(fin.despMes.length === 1 ? "exp_moves_one" : "exp_moves_many", { n: fin.despMes.length }) }), /* @__PURE__ */ React.createElement(Kpi, { label: tr("exp_fixed"), value: BM.eur0(fin.fixas), icon: "home", color: "var(--c-habitacao)", sub: tr("exp_fixed_sub") }), /* @__PURE__ */ React.createElement(Kpi, { label: tr("exp_variable"), value: BM.eur0(fin.variaveis), icon: "cart", color: "var(--c-alimentacao)", sub: tr("exp_variable_sub") })), fin.despMes.length === 0 ? /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: "wallet",
      title: tr("exp_empty_t"),
      msg: tr("exp_empty_msg"),
      action: /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => open("despesa") }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 16, color: "#fff" }), " ", tr("add_expense"))
    }
  ) : /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-pad", style: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { className: "seg" }, ["todas", "fixa", "variavel"].map((t) => /* @__PURE__ */ React.createElement("button", { key: t, className: tipo === t ? "on" : "", onClick: () => setTipo(t) }, t === "todas" ? tr("filter_all") : t === "fixa" ? tr("filter_fixed") : tr("filter_variable")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 7, flexWrap: "wrap", marginLeft: 4 } }, /* @__PURE__ */ React.createElement("button", { className: "chip" + (cat === "todas" ? " sel" : ""), onClick: () => setCat("todas") }, tr("filter_all")), catKeys.filter((k) => fin.despMes.some((d) => d.cat === k)).map((k) => /* @__PURE__ */ React.createElement("button", { key: k, className: "chip" + (cat === k ? " sel" : ""), onClick: () => setCat(k) }, /* @__PURE__ */ React.createElement("span", { className: "dot", style: { background: cat === k ? "#fff" : BM.cats[k].color } }), tcat(k))))), /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", { className: "t" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, tr("th_expense")), /* @__PURE__ */ React.createElement("th", null, tr("th_category")), /* @__PURE__ */ React.createElement("th", null, tr("th_type")), /* @__PURE__ */ React.createElement("th", null, tr("th_date")), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, tr("th_value")), /* @__PURE__ */ React.createElement("th", null))), /* @__PURE__ */ React.createElement("tbody", null, rows.map((d) => /* @__PURE__ */ React.createElement("tr", { key: d.id }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(CatBadge, { catKey: d.cat, size: 36, r: 10 }), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700 } }, d.nome))), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 7, fontWeight: 600 } }, /* @__PURE__ */ React.createElement("span", { className: "dot", style: { background: (BM.cats[d.cat] || BM.cats.outros).color } }), tcat(d.cat))), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: "chip", style: { padding: "3px 9px" } }, d.tipo === "fixa" ? tr("fixed") : tr("variable"))), /* @__PURE__ */ React.createElement("td", { className: "muted" }, BM.fmtData(d.data)), /* @__PURE__ */ React.createElement("td", { className: "tnum", style: { textAlign: "right", fontWeight: 700, color: "var(--neg)" } }, "\u2212", BM.eur(d.valor)), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 4, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", style: { width: 32, height: 32 }, onClick: () => open("despesa", d) }, /* @__PURE__ */ React.createElement(Icon, { name: "edit", size: 15 })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", style: { width: 32, height: 32 }, onClick: () => fin.despesa.remove(d.id) }, /* @__PURE__ */ React.createElement(Icon, { name: "trash", size: 15 }))))))))), /* @__PURE__ */ React.createElement("div", { className: "card-pad row", style: { justifyContent: "space-between", borderTop: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("span", { className: "muted", style: { fontWeight: 700, fontSize: 13 } }, tt(rows.length === 1 ? "results_one" : "results_many", { n: rows.length })), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700 } }, tr("total_label"), ": ", /* @__PURE__ */ React.createElement("span", { className: "tnum" }, BM.eur(total))))));
}
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
  const Linha = ({ label, valor, sinal, cor, forte, big }) => /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between", padding: forte ? "12px 0 0" : "7px 0", borderTop: forte ? "1px solid var(--border)" : "none" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: forte ? 14 : 13.5, fontWeight: forte ? 800 : 600, color: forte ? "var(--ink)" : "var(--ink-2)" } }, label), /* @__PURE__ */ React.createElement("span", { className: "tnum", style: { fontWeight: 700, fontSize: big ? 22 : forte ? 16 : 14.5, color: cor || "var(--ink)" } }, sinal, BM.eur(Math.abs(valor))));
  return /* @__PURE__ */ React.createElement("div", { className: "card card-pad", style: { display: "flex", flexDirection: "column", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { className: "section-head", style: { marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, tr("sp_title")), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 600, marginTop: 2 } }, tt("sp_sub", { month: fin.monthLabel }))), /* @__PURE__ */ React.createElement("span", { className: "li-ico", style: { width: 40, height: 40, background: "var(--accent-soft)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "target", size: 19, color: "var(--accent)", sw: 2 }))), /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "stretch" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(Linha, { label: tr("sp_total_income"), valor: receita, sinal: "+", cor: "var(--accent)" }), /* @__PURE__ */ React.createElement(Linha, { label: tr("exp_total"), valor: despesas, sinal: "\u2212", cor: "var(--neg)" }), /* @__PURE__ */ React.createElement(Linha, { label: tr("sp_remaining"), valor: restante, sinal: restante < 0 ? "\u2212" : "", cor: restante < 0 ? "var(--neg)" : "var(--ink)", forte: true })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14, background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: 18 } }, semSobra ? /* @__PURE__ */ React.createElement("div", { className: "muted", style: { fontSize: 13, fontWeight: 600, lineHeight: 1.55, display: "flex", gap: 10, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 18, color: "var(--warn)" }), /* @__PURE__ */ React.createElement("span", null, tr("sp_nosurplus"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between", alignItems: "baseline" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "var(--ink-2)" } }, tr("sp_pct_label")), /* @__PURE__ */ React.createElement("span", { className: "tnum", style: { fontSize: 26, fontWeight: 700, color: "var(--accent)" } }, pct, "%")), /* @__PURE__ */ React.createElement("input", { type: "range", min: "10", max: "50", step: "5", value: pct, onChange: (e) => fin.setPoupancaPct(+e.target.value), className: "range" }), /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { className: "tiny muted", style: { fontWeight: 700 } }, "10%"), /* @__PURE__ */ React.createElement("span", { className: "tiny muted", style: { fontWeight: 700 } }, "50%")), /* @__PURE__ */ React.createElement(Linha, { label: tt("sp_savings_line", { pct }), valor: planoTotal, sinal: "\u2212", cor: "var(--c-educacao)", forte: true }), jaGuardado > 0 && /* @__PURE__ */ React.createElement(Linha, { label: tr("sp_saved_month"), valor: jaGuardado, sinal: "\u2713 ", cor: "var(--accent)" }), /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between", alignItems: "center", marginTop: 2, padding: "12px 14px", background: "var(--accent-soft)", borderRadius: "var(--radius-sm)" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, tr("sp_available")), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 600 } }, tr("sp_available_sub"))), /* @__PURE__ */ React.createElement("span", { className: "tnum", style: { fontWeight: 700, fontSize: 24, color: "var(--accent-ink)" } }, BM.eur(disponivel)))))), !semSobra && /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "flex-end", marginTop: 8, gap: 10, alignItems: "center" } }, falta > 0 ? /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => open("reservar", { amount: falta }) }, /* @__PURE__ */ React.createElement(Icon, { name: "target", size: 15, color: "#fff" }), " ", tt("sp_save_btn", { x: BM.eur0(falta) })) : /* @__PURE__ */ React.createElement("span", { className: "row tiny", style: { fontWeight: 700, color: "var(--accent)", gap: 6 } }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 15, color: "var(--accent)" }), " ", tr("sp_already_saved"))));
}
function Rendimentos({ open }) {
  const fin = useFinance();
  const tr = useT();
  const tt = (k, v) => tfmt(tr(k), v);
  const INC_KEY = { "Sal\xE1rio": "ic_salario", "Bolsa": "ic_bolsa", "Ajuda Familiar": "ic_ajuda", "Subs\xEDdios": "ic_subsidios", "Apoios do Estado": "ic_apoios", "Freelance": "ic_freelance", "Outros": "ic_outros" };
  const ticat = (label) => {
    const k = INC_KEY[label];
    return k ? tr(k) : label;
  };
  const rec = fin.rendMes.filter((r) => r.rec).reduce((s, r) => s + (+r.valor || 0), 0);
  const extra = fin.totalRec - rec;
  const rows = [...fin.rendMes].sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: "repeat(3,1fr)" } }, /* @__PURE__ */ React.createElement(Kpi, { label: tr("inc_total"), value: BM.eur0(fin.totalRec), icon: "arrowsDown", color: "var(--accent)", sub: tt(fin.rendMes.length === 1 ? "inc_source_one" : "inc_source_many", { n: fin.rendMes.length }) }), /* @__PURE__ */ React.createElement(Kpi, { label: tr("inc_recurring"), value: BM.eur0(rec), icon: "cal", color: "var(--c-habitacao)", sub: tr("inc_every_month") }), /* @__PURE__ */ React.createElement(Kpi, { label: tr("inc_extra"), value: BM.eur0(extra), icon: "spark", color: "var(--c-educacao)", sub: tr("inc_extra_sub") })), fin.rendMes.length === 0 ? /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: "arrowsDown",
      title: tr("inc_empty_t"),
      msg: tr("inc_empty_msg"),
      action: /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => open("rendimento") }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 16, color: "#fff" }), " ", tr("add_income"))
    }
  ) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SavingsPlanner, { open }), /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: "1.5fr 1fr" } }, /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 6 } }, tr("inc_this_month")), /* @__PURE__ */ React.createElement("div", { className: "list" }, rows.map((r) => /* @__PURE__ */ React.createElement("div", { className: "li", key: r.id }, /* @__PURE__ */ React.createElement("div", { className: "li-ico", style: { background: "var(--accent-soft)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "arrowsDown", size: 18, color: "var(--accent)", sw: 2 })), /* @__PURE__ */ React.createElement("div", { className: "li-main" }, /* @__PURE__ */ React.createElement("div", { className: "li-title" }, r.fonte), /* @__PURE__ */ React.createElement("div", { className: "li-sub" }, ticat(r.cat), " \xB7 ", BM.fmtData(r.data), " \xB7 ", r.rec ? tr("inc_recurring_low") : tr("inc_oneoff"))), /* @__PURE__ */ React.createElement("div", { className: "li-amt tnum", style: { color: "var(--accent)" } }, "+", BM.eur(r.valor)), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 4 } }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", style: { width: 32, height: 32 }, onClick: () => open("rendimento", r) }, /* @__PURE__ */ React.createElement(Icon, { name: "edit", size: 15 })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", style: { width: 32, height: 32 }, onClick: () => fin.rendimento.remove(r.id) }, /* @__PURE__ */ React.createElement(Icon, { name: "trash", size: 15 }))))))), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 14 } }, tr("inc_origin")), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 20 } }, /* @__PURE__ */ React.createElement(DonutChart, { data: fin.incBreak, center: /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "tnum", style: { fontSize: 20, fontWeight: 700 } }, BM.eur0(fin.totalRec)), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 600 } }, tr("per_month"))) }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 10 } }, fin.incBreak.map((c) => /* @__PURE__ */ React.createElement("div", { key: c.key, className: "row", style: { justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 8, fontSize: 13, fontWeight: 600 } }, /* @__PURE__ */ React.createElement("span", { className: "dot", style: { background: c.color } }), ticat(c.nome)), /* @__PURE__ */ React.createElement("span", { className: "tnum", style: { fontWeight: 700, fontSize: 13 } }, BM.eur0(c.valor))))))))));
}
Object.assign(window, { Auth, Dashboard, Despesas, Rendimentos, SavingsPlanner });
