const PremiumStore = /* @__PURE__ */ function() {
  let email = "anon";
  let state = null;
  const subs = /* @__PURE__ */ new Set();
  const DEF = { premium: true, plano: "month", lembretes: [], recorrentes: [], grupos: [], subscricoes: [], pagosSub: {}, pagosRec: {}, notif: { ativo: true, aviso: 3 }, notifLog: {} };
  const KEY = () => "rende_premium_" + email;
  const migra = (o) => {
    let mudou = false;
    let recs = (o.recorrentes || []).map((r) => {
      if (r.tipo) return r;
      mudou = true;
      return { id: r.id, nome: r.nome || r.titulo || "Recorrente", valor: r.valor, dia: r.dia || 1, tipo: "despesa", categoria: r.categoria || r.cat || "outros", ciclo: r.ciclo || "mensal", estado: r.estado || "ativa", icon: r.icon || (BM.cats[r.cat] ? BM.cats[r.cat].icon : "sync"), color: r.color || (BM.cats[r.cat] ? BM.cats[r.cat].color : "var(--accent)"), desde: r.desde || null, metodo: r.metodo || "" };
    });
    if ((o.subscricoes || []).length) {
      mudou = true;
      const conv = o.subscricoes.map((x) => ({ ...x, tipo: "subscricao" }));
      recs = [...conv, ...recs];
      const pr = { ...o.pagosRec || {} };
      Object.keys(o.pagosSub || {}).forEach((id) => {
        pr[id] = { ...o.pagosSub[id] || {}, ...pr[id] || {} };
      });
      o.pagosRec = pr;
      o.subscricoes = [];
      o.pagosSub = {};
    }
    o.recorrentes = recs;
    return mudou;
  };
  const read = () => {
    let o;
    try {
      o = { ...DEF, ...JSON.parse(localStorage.getItem(KEY()) || "{}") };
    } catch (e) {
      o = { ...DEF };
    }
    try {
      if (migra(o)) localStorage.setItem(KEY(), JSON.stringify(o));
    } catch (e) {
    }
    return o;
  };
  const persist = () => {
    try {
      localStorage.setItem(KEY(), JSON.stringify(state));
    } catch (e) {
    }
  };
  const emit = () => subs.forEach((f) => f(state));
  const get = () => state || (state = read());
  return {
    setUser(e) {
      const ne = e || "anon";
      if (ne !== email) {
        email = ne;
        state = read();
      } else if (!state) {
        state = read();
      }
    },
    get,
    update(patch) {
      state = { ...get(), ...patch };
      persist();
      emit();
    },
    add(kind, item) {
      this.update({ [kind]: [{ id: BM.uid(), ...item }, ...get()[kind] || []] });
    },
    remove(kind, id) {
      this.update({ [kind]: (get()[kind] || []).filter((x) => x.id !== id) });
    },
    edit(kind, id, patch) {
      this.update({ [kind]: (get()[kind] || []).map((x) => x.id === id ? { ...x, ...patch } : x) });
    },
    activate(plano) {
      this.update({ premium: true, plano: plano || "month" });
    },
    deactivate() {
      this.update({ premium: false });
    },
    reset() {
      this.update({ lembretes: [], recorrentes: [], grupos: [], subscricoes: [], pagosSub: {}, pagosRec: {}, notifLog: {} });
    },
    subscribe(f) {
      subs.add(f);
      return () => subs.delete(f);
    }
  };
}();
function usePremium() {
  const fin = useFinance();
  const email = fin.account && fin.account.email;
  PremiumStore.setUser(email);
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    PremiumStore.setUser(email);
  }, [email]);
  React.useEffect(() => PremiumStore.subscribe(() => force()), []);
  return PremiumStore;
}
const daysUntil = (iso) => Math.ceil((new Date(iso) - new Date(BM.todayISO())) / 864e5);
const numOf = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
};
const PREM_FEATS = [
  { icon: "bell", t: "Lembretes de pagamento", d: "Avisamos-te antes de cada conta vencer." },
  { icon: "chart", t: "Previs\xE3o de saldo", d: "V\xEA como termina o m\xEAs antes de ele acabar." },
  { icon: "user", t: "Or\xE7amentos partilhados", d: "Divide contas com quem vive contigo." },
  { icon: "sync", t: "Despesas recorrentes", d: "As que se repetem entram sozinhas." },
  { icon: "report", t: "Exportar dados", d: "Leva tudo em CSV quando quiseres." }
];
function Paywall() {
  const prem = usePremium();
  const fin = useFinance();
  const s = prem.get();
  const [plano, setPlano] = React.useState(s.plano === "year" ? "year" : "month");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const ehPremium = fin.account && fin.account.plano === "premium";
  const irParaPagamento = async () => {
    setBusy(true);
    setErr("");
    try {
      const resp = await API.criarCheckout(plano === "year" ? "anual" : "mensal");
      if (resp && resp.url) window.location.href = resp.url;
      else {
        setErr("N\xE3o foi poss\xEDvel iniciar o pagamento.");
        setBusy(false);
      }
    } catch (e) {
      setErr(e.message || "N\xE3o foi poss\xEDvel iniciar o pagamento.");
      setBusy(false);
    }
  };
  if (ehPremium) {
    return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { className: "card card-pad prem-hero" }, /* @__PURE__ */ React.createElement("div", { className: "prem-crown" }, /* @__PURE__ */ React.createElement(Icon, { name: "spark", size: 26, color: "#fff" })), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 19 } }, "Premium ativo"), /* @__PURE__ */ React.createElement("div", { className: "muted", style: { marginTop: 6, fontSize: 14 } }, "Obrigado por apoiares o Rende+. Tens acesso a todas as funcionalidades."), fin.account.planoExpira && /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { marginTop: 8, fontWeight: 600 } }, "Renova em ", BM.fmtData(String(fin.account.planoExpira).slice(0, 10)), ".")));
  }
  const precos = { month: { v: "2,99 \u20AC", sub: "por m\xEAs" }, year: { v: "29,99 \u20AC", sub: "\u2248 2,50 \u20AC/m\xEAs" } };
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { className: "card card-pad paywall" }, /* @__PURE__ */ React.createElement("div", { className: "prem-crown" }, /* @__PURE__ */ React.createElement(Icon, { name: "spark", size: 26, color: "#fff" })), /* @__PURE__ */ React.createElement("p", { className: "muted", style: { marginTop: 10, fontSize: 14 } }, "Controla o teu dinheiro com superpoderes."), /* @__PURE__ */ React.createElement("div", { className: "prem-feats" }, PREM_FEATS.map((f) => /* @__PURE__ */ React.createElement("div", { className: "prem-feat", key: f.t }, /* @__PURE__ */ React.createElement("span", { className: "pf-ico" }, /* @__PURE__ */ React.createElement(Icon, { name: f.icon, size: 17, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, f.t), /* @__PURE__ */ React.createElement("span", null, f.d))))), /* @__PURE__ */ React.createElement("div", { className: "prem-plans" }, /* @__PURE__ */ React.createElement("button", { className: "prem-plan" + (plano === "month" ? " on" : ""), onClick: () => setPlano("month") }, /* @__PURE__ */ React.createElement("div", { className: "pp-n" }, "MENSAL"), /* @__PURE__ */ React.createElement("div", { className: "pp-v" }, "2,99 \u20AC"), /* @__PURE__ */ React.createElement("div", { className: "pp-s" }, "por m\xEAs")), /* @__PURE__ */ React.createElement("button", { className: "prem-plan" + (plano === "year" ? " on" : ""), onClick: () => setPlano("year") }, /* @__PURE__ */ React.createElement("span", { className: "pp-tag" }, "POUPA 2 MESES"), /* @__PURE__ */ React.createElement("div", { className: "pp-n" }, "ANUAL"), /* @__PURE__ */ React.createElement("div", { className: "pp-v" }, "29,99 \u20AC"), /* @__PURE__ */ React.createElement("div", { className: "pp-s" }, "\u2248 2,50 \u20AC/m\xEAs"))), err && /* @__PURE__ */ React.createElement("div", { className: "alert bad", style: { margin: "0 0 12px", padding: "9px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16, color: "var(--neg)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, err)), /* @__PURE__ */ React.createElement("style", null, `@keyframes rmaisSpin{to{transform:rotate(360deg)}}`), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", disabled: busy, style: { width: "100%", justifyContent: "center", padding: 15, fontSize: 15.5, border: "none", opacity: busy ? 0.8 : 1, cursor: busy ? "wait" : "pointer" }, onClick: irParaPagamento }, busy && /* @__PURE__ */ React.createElement("span", { style: { width: 15, height: 15, border: "2px solid rgba(255,255,255,.45)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", marginRight: 8, animation: "rmaisSpin .6s linear infinite", verticalAlign: "-2px" } }), busy ? "A abrir pagamento\u2026" : "Assinar " + (plano === "year" ? "plano anual" : "plano mensal")), /* @__PURE__ */ React.createElement("p", { className: "tiny muted", style: { textAlign: "center", marginTop: 10, fontWeight: 600 } }, "Pagamento seguro via Stripe \xB7 cancela quando quiseres \xB7 ", precos[plano].sub)));
}
function PremiumGate({ children }) {
  const prem = usePremium();
  if (!prem.get().premium) return /* @__PURE__ */ React.createElement(Paywall, null);
  return children;
}
function PremActions({ label, onAdd }) {
  return /* @__PURE__ */ React.createElement("div", { className: "prem-actions" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: onAdd }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 16, color: "#fff" }), " ", label));
}
function LembreteModal({ item, onClose, onSave }) {
  const catKeys = Object.keys(BM.cats);
  const [f, setF] = React.useState(() => {
    var _a, _b;
    return { titulo: (item == null ? void 0 : item.titulo) || "", valor: (_a = item == null ? void 0 : item.valor) != null ? _a : "", data: (item == null ? void 0 : item.data) || BM.todayISO(), aviso: (_b = item == null ? void 0 : item.aviso) != null ? _b : 3, cat: (item == null ? void 0 : item.cat) || "outros", repete: (item == null ? void 0 : item.repete) || false };
  });
  const [err, setErr] = React.useState("");
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const guardar = () => {
    if (!f.titulo.trim()) return setErr("D\xE1 um nome ao lembrete.");
    if (numOf(f.valor) <= 0) return setErr("Indica um valor v\xE1lido.");
    onSave({ titulo: f.titulo.trim(), valor: numOf(f.valor), data: f.data, aviso: +f.aviso, cat: f.cat, repete: !!f.repete });
  };
  return /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: item ? "Editar lembrete" : "Novo lembrete",
      sub: "Cria um aviso para n\xE3o te esqueceres de pagar.",
      icon: "bell",
      onClose,
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: onClose }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: guardar }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 14, color: "#fff" }), " Guardar"))
    },
    /* @__PURE__ */ React.createElement(Field, { label: "Nome" }, /* @__PURE__ */ React.createElement("input", { className: "input", autoFocus: true, value: f.titulo, onChange: set("titulo"), placeholder: "Ex: Renda, Netflix\u2026" })),
    /* @__PURE__ */ React.createElement("div", { className: "modal-row-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Valor", icon: "coins" }, /* @__PURE__ */ React.createElement("input", { className: "input", inputMode: "decimal", value: f.valor, onChange: set("valor"), placeholder: "0,00" })), /* @__PURE__ */ React.createElement(Field, { label: "Categoria" }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.cat, onChange: set("cat") }, catKeys.map((k) => /* @__PURE__ */ React.createElement("option", { key: k, value: k }, BM.cats[k].nome))))),
    /* @__PURE__ */ React.createElement("div", { className: "modal-row-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Data de vencimento" }, /* @__PURE__ */ React.createElement("input", { className: "input", type: "date", value: f.data, onChange: set("data") })), /* @__PURE__ */ React.createElement(Field, { label: "Avisar antes" }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.aviso, onChange: set("aviso") }, [1, 2, 3, 5, 7].map((d) => /* @__PURE__ */ React.createElement("option", { key: d, value: d }, d, " dia", d > 1 ? "s" : "", " antes"))))),
    /* @__PURE__ */ React.createElement("label", { className: "prem-check" }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: f.repete, onChange: (e) => setF((s) => ({ ...s, repete: e.target.checked })) }), " ", /* @__PURE__ */ React.createElement("span", null, "Repetir todos os meses ", /* @__PURE__ */ React.createElement("span", { className: "muted" }, "(ao pagar, reagenda para o m\xEAs seguinte)"))),
    err && /* @__PURE__ */ React.createElement("div", { className: "alert bad", style: { padding: "9px 12px", marginTop: 14 } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16, color: "var(--neg)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, err))
  );
}
function Lembretes() {
  return /* @__PURE__ */ React.createElement(PremiumGate, null, /* @__PURE__ */ React.createElement(LembretesInner, null));
}
function LembretesInner({ variant }) {
  const prem = usePremium();
  const todos = [...prem.get().lembretes || []].sort((a, b) => (a.data || "").localeCompare(b.data || ""));
  const [modal, setModal] = React.useState(null);
  const [filtro, setFiltro] = React.useState("pendentes");
  const addMonths = (iso, n) => {
    const d = /* @__PURE__ */ new Date(iso + "T00:00:00");
    d.setMonth(d.getMonth() + n);
    return d.toISOString().slice(0, 10);
  };
  const pendentes = todos.filter((l) => !l.pago);
  const atrasados = pendentes.filter((l) => daysUntil(l.data) < 0);
  const pagos = todos.filter((l) => l.pago);
  const totalPendente = pendentes.reduce((s, l) => s + (+l.valor || 0), 0);
  const totalAtrasado = atrasados.reduce((s, l) => s + (+l.valor || 0), 0);
  const totalPago = pagos.reduce((s, l) => s + (+l.valor || 0), 0);
  const variantListas = { hoje: pendentes.filter((l) => daysUntil(l.data) <= 0), proximos: pendentes.filter((l) => daysUntil(l.data) > 0), concluidos: pagos };
  const variantVazio = { hoje: "Sem lembretes para hoje ou em atraso.", proximos: "Sem lembretes futuros.", concluidos: "Ainda n\xE3o h\xE1 lembretes pagos." };
  const lista = variant ? variantListas[variant] : filtro === "pagos" ? pagos : filtro === "atrasados" ? atrasados : filtro === "todos" ? todos : pendentes;
  const marcarPago = (l) => {
    if (l.repete) prem.edit("lembretes", l.id, { data: addMonths(l.data, 1) });
    else prem.edit("lembretes", l.id, { pago: true });
  };
  const tiles = [
    { id: "pendentes", label: "Por pagar", val: BM.eur(totalPendente), sub: pendentes.length + " lembrete" + (pendentes.length === 1 ? "" : "s"), tone: "" },
    { id: "atrasados", label: "Atrasados", val: BM.eur(totalAtrasado), sub: atrasados.length + " em atraso", tone: "danger" },
    { id: "pagos", label: "Pagos", val: BM.eur(totalPago), sub: pagos.length + " conclu\xEDdo" + (pagos.length === 1 ? "" : "s"), tone: "ok" }
  ];
  return /* @__PURE__ */ React.createElement("div", { className: variant ? "" : "content" }, !variant && /* @__PURE__ */ React.createElement(PremActions, { label: "Novo lembrete", onAdd: () => setModal({}) }), variant && /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "flex-end", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => setModal({}) }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 16, color: "#fff" }), " Novo lembrete")), todos.length === 0 ? /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: "bell",
      title: "Sem lembretes",
      msg: "Cria um lembrete e avisamos-te antes de cada conta vencer.",
      action: /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => setModal({}) }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 16, color: "#fff" }), " Criar lembrete")
    }
  ) : /* @__PURE__ */ React.createElement(React.Fragment, null, !variant && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "prem-stats" }, tiles.map((t) => /* @__PURE__ */ React.createElement("button", { key: t.id, className: "prem-stat " + t.tone + (filtro === t.id ? " on" : ""), onClick: () => setFiltro(t.id) }, /* @__PURE__ */ React.createElement("span", { className: "prem-stat-l" }, t.label), /* @__PURE__ */ React.createElement("span", { className: "prem-stat-v tnum" }, t.val), /* @__PURE__ */ React.createElement("span", { className: "prem-stat-s" }, t.sub)))), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 8, flexWrap: "wrap" } }, [["pendentes", "Por pagar"], ["atrasados", "Atrasados"], ["pagos", "Pagos"], ["todos", "Todos"]].map(([id, lbl]) => /* @__PURE__ */ React.createElement("button", { key: id, className: "chip" + (filtro === id ? " sel" : ""), onClick: () => setFiltro(id), style: { cursor: "pointer" } }, lbl)))), lista.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "card card-pad muted", style: { textAlign: "center", fontSize: 13.5, fontWeight: 600 } }, variant ? variantVazio[variant] : "Nada nesta lista.") : /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, lista.map((l) => {
    const d = daysUntil(l.data);
    const pago = l.pago;
    const late = !pago && d < 0;
    const soon = !pago && d >= 0 && d <= (l.aviso || 3);
    const cat = BM.cats[l.cat] || BM.cats.outros;
    return /* @__PURE__ */ React.createElement("div", { className: "prem-row" + (late ? " is-late" : soon ? " is-soon" : ""), key: l.id }, /* @__PURE__ */ React.createElement("span", { className: "prem-rico", style: { background: `color-mix(in srgb, ${cat.color} 14%, transparent)` } }, /* @__PURE__ */ React.createElement(Icon, { name: cat.icon, size: 18, color: cat.color })), /* @__PURE__ */ React.createElement("div", { className: "prem-rtxt" }, /* @__PURE__ */ React.createElement("b", { style: pago ? { textDecoration: "line-through", opacity: 0.55 } : null }, l.titulo, " ", l.repete && /* @__PURE__ */ React.createElement(Icon, { name: "repeat", size: 13, color: "var(--ink-3)" })), pago ? /* @__PURE__ */ React.createElement("span", { className: "pill-day done" }, "pago") : /* @__PURE__ */ React.createElement("span", { className: "pill-day" + (late ? " late" : soon ? " soon" : "") }, d < 0 ? Math.abs(d) + " dia" + (d === -1 ? "" : "s") + " em atraso" : d === 0 ? "vence hoje" : "vence em " + d + " dia" + (d > 1 ? "s" : ""))), /* @__PURE__ */ React.createElement("div", { className: "prem-ramt" }, BM.eur(l.valor)), /* @__PURE__ */ React.createElement("div", { className: "prem-rbtns" }, pago ? /* @__PURE__ */ React.createElement("button", { className: "icon-btn", title: "Marcar por pagar", onClick: () => prem.edit("lembretes", l.id, { pago: false }) }, /* @__PURE__ */ React.createElement(Icon, { name: "refresh", size: 16 })) : /* @__PURE__ */ React.createElement("button", { className: "icon-btn", title: l.repete ? "Pagar e reagendar" : "Marcar como pago", onClick: () => marcarPago(l) }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", title: "Apagar", onClick: () => prem.remove("lembretes", l.id) }, /* @__PURE__ */ React.createElement(Icon, { name: "trash", size: 16, color: "var(--neg)" }))));
  }))), modal && /* @__PURE__ */ React.createElement(LembreteModal, { item: modal.id ? modal : null, onClose: () => setModal(null), onSave: (it) => {
    prem.add("lembretes", it);
    setModal(null);
  } }));
}
function Recorrentes() {
  return /* @__PURE__ */ React.createElement(PremiumGate, null, /* @__PURE__ */ React.createElement(SubscricoesInner, null));
}
function AgendaFinanceira() {
  return /* @__PURE__ */ React.createElement(PremiumGate, null, /* @__PURE__ */ React.createElement(AgendaFinanceiraInner, null));
}
function AgendaFinanceiraInner() {
  const prem = usePremium();
  const [tab, setTab] = React.useState("hoje");
  const recorrentes = prem.get().recorrentes || [];
  const TABS = [["hoje", "Hoje"], ["proximos", "Pr\xF3ximos"], ["recorrentes", "Recorrentes"], ["calendario", "Calend\xE1rio"], ["concluidos", "Conclu\xEDdos"]];
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "content", style: { paddingBottom: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "pg-tabs", style: { width: "fit-content" } }, TABS.map(([id, lbl]) => /* @__PURE__ */ React.createElement("button", { type: "button", key: id, className: "pg-tab" + (tab === id ? " on" : ""), onClick: () => setTab(id) }, lbl)))), tab === "recorrentes" ? /* @__PURE__ */ React.createElement(SubscricoesInner, null) : /* @__PURE__ */ React.createElement("div", { className: "content" }, tab === "hoje" && /* @__PURE__ */ React.createElement(LembretesInner, { variant: "hoje" }), tab === "proximos" && /* @__PURE__ */ React.createElement(LembretesInner, { variant: "proximos" }), tab === "calendario" && /* @__PURE__ */ React.createElement(SubCalendario, { subs: recorrentes }), tab === "concluidos" && /* @__PURE__ */ React.createElement(LembretesInner, { variant: "concluidos" })));
}
const nomeDeEmail = (e) => {
  const p = ((e || "").split("@")[0] || "").replace(/[._-]/g, " ");
  return p.split(" ").map((w) => w ? w[0].toUpperCase() + w.slice(1) : "").join(" ").trim() || e;
};
function GrupoModal({ grupo, onClose, onSave }) {
  const editing = !!grupo;
  const [nome, setNome] = React.useState(editing ? grupo.nome || "" : "");
  const [descricao, setDescricao] = React.useState(editing ? grupo.descricao || "" : "");
  const [email, setEmail] = React.useState("");
  const [convidados, setConvidados] = React.useState([]);
  const [err, setErr] = React.useState("");
  const addConvidado = () => {
    const v = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(v)) return setErr("Escreve um email v\xE1lido.");
    if (convidados.some((c) => c.email === v)) return setErr("Esse email j\xE1 foi adicionado.");
    setConvidados((a) => [...a, { email: v, nome: nomeDeEmail(v) }]);
    setEmail("");
    setErr("");
  };
  const guardar = () => {
    if (!nome.trim()) return setErr("D\xE1 um nome ao grupo.");
    if (editing) {
      onSave({ nome: nome.trim(), descricao: descricao.trim() });
      return;
    }
    const membros = convidados.map((c) => c.nome);
    const convites = convidados.map((c) => ({ email: c.email, nome: c.nome, estado: "pendente" }));
    onSave({ nome: nome.trim(), descricao: descricao.trim(), membros, convites, despesas: [] });
  };
  return /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: editing ? "Editar grupo" : "Novo grupo",
      sub: "Divide despesas com quem partilha contigo.",
      icon: "users",
      onClose,
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: onClose }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: guardar }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 14, color: "#fff" }), " ", editing ? "Guardar" : "Criar grupo"))
    },
    /* @__PURE__ */ React.createElement(Field, { label: "Nome do grupo" }, /* @__PURE__ */ React.createElement("input", { className: "input", autoFocus: true, value: nome, onChange: (e) => setNome(e.target.value), placeholder: "Ex: Casa do Porto, Viagem\u2026" })),
    /* @__PURE__ */ React.createElement(Field, { label: "Descri\xE7\xE3o", hint: "opcional" }, /* @__PURE__ */ React.createElement("input", { className: "input", value: descricao, onChange: (e) => setDescricao(e.target.value), placeholder: "Ex: Renda e contas da casa" })),
    !editing && /* @__PURE__ */ React.createElement(Field, { label: "Convidar por email", hint: "Adiciona um de cada vez. Tu (Eu) j\xE1 est\xE1s inclu\xEDdo." }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("input", { className: "input", type: "email", value: email, onChange: (e) => setEmail(e.target.value), onKeyDown: (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addConvidado();
      }
    }, placeholder: "email@exemplo.com" }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-soft", style: { flex: "none" }, onClick: addConvidado }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 14 }), " Adicionar"))),
    !editing && convidados.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 8, flexWrap: "wrap", marginBottom: 16 } }, convidados.map((c) => /* @__PURE__ */ React.createElement("span", { key: c.email, className: "chip", style: { gap: 7 } }, c.nome, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setConvidados((a) => a.filter((x) => x.email !== c.email)), style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "grid", color: "var(--ink-3)" } }, /* @__PURE__ */ React.createElement("span", { style: { transform: "rotate(45deg)", display: "grid" } }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 13, color: "var(--ink-3)" })))))),
    err && /* @__PURE__ */ React.createElement("div", { className: "alert bad", style: { padding: "9px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16, color: "var(--neg)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, err))
  );
}
const ESTADOS = [{ id: "pendente", label: "Pendente" }, { id: "pago", label: "Pago" }, { id: "confirmado", label: "Confirmado" }];
function estadoPill(estado) {
  const map = { pendente: ["pend", "Pendente"], pago: ["pago", "Pago"], confirmado: ["conf", "Confirmado"] };
  const [cls, lbl] = map[estado || "pendente"] || map.pendente;
  return /* @__PURE__ */ React.createElement("span", { className: "pg-estado " + cls }, lbl);
}
function lerAnexo(file) {
  return new Promise((resolve, reject) => {
    if (file.type === "application/pdf") {
      if (file.size > 2.4 * 1024 * 1024) return reject("PDF demasiado grande (m\xE1x. ~2,4 MB nesta vers\xE3o local).");
      const r = new FileReader();
      r.onload = () => resolve({ nome: file.name, tipo: file.type, dados: r.result });
      r.onerror = () => reject("N\xE3o consegui ler o ficheiro.");
      r.readAsDataURL(file);
    } else if (/^image\//.test(file.type)) {
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 1280;
          let w = img.width, h = img.height;
          if (w > max || h > max) {
            const s = max / Math.max(w, h);
            w = Math.round(w * s);
            h = Math.round(h * s);
          }
          const cv = document.createElement("canvas");
          cv.width = w;
          cv.height = h;
          cv.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve({ nome: file.name, tipo: "image/jpeg", dados: cv.toDataURL("image/jpeg", 0.82) });
        };
        img.onerror = () => reject("Imagem inv\xE1lida.");
        img.src = r.result;
      };
      r.onerror = () => reject("N\xE3o consegui ler a imagem.");
      r.readAsDataURL(file);
    } else {
      reject("S\xF3 imagens ou PDF.");
    }
  });
}
function AnexoViewer({ anexo, onClose }) {
  return /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: anexo.nome || "Anexo",
      sub: "Documento anexado",
      icon: "paperclip",
      onClose,
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("a", { className: "btn btn-ghost", href: anexo.dados, download: anexo.nome || "anexo" }, /* @__PURE__ */ React.createElement(Icon, { name: "download", size: 14 }), " Transferir"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: onClose }, "Fechar"))
    },
    /^image\//.test(anexo.tipo) ? /* @__PURE__ */ React.createElement("img", { src: anexo.dados, alt: anexo.nome, style: { width: "100%", borderRadius: "var(--radius-sm)", display: "block" } }) : /* @__PURE__ */ React.createElement("iframe", { title: anexo.nome, src: anexo.dados, style: { width: "100%", height: "60vh", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" } })
  );
}
function DespesaPartilhadaModal({ grupo, onClose, onSave }) {
  const fin = useFinance();
  const pessoas = ["Eu", ...grupo.membros || []];
  const [f, setF] = React.useState({ titulo: "", categoria: "outros", valor: "", data: BM.todayISO(), vencimento: "", pagador: "Eu", estado: "pendente", obs: "" });
  const [parts, setParts] = React.useState(() => pessoas.slice());
  const [metodo, setMetodo] = React.useState("igual");
  const [pcts, setPcts] = React.useState({});
  const [vals, setVals] = React.useState({});
  const [anexos, setAnexos] = React.useState([]);
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const toggle = (p) => setParts((arr) => arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]);
  const valor = numOf(f.valor);
  const quotas = {};
  if (metodo === "igual") {
    const each = parts.length ? valor / parts.length : 0;
    parts.forEach((p) => quotas[p] = each);
  } else if (metodo === "percentagem") {
    parts.forEach((p) => quotas[p] = valor * (numOf(pcts[p]) / 100));
  } else {
    parts.forEach((p) => quotas[p] = numOf(vals[p]));
  }
  const somaQuotas = parts.reduce((s, p) => s + (quotas[p] || 0), 0);
  const somaPct = parts.reduce((s, p) => s + numOf(pcts[p]), 0);
  const diff = Math.round((somaQuotas - valor) * 100) / 100;
  const addFiles = async (fileList) => {
    setErr("");
    setBusy(true);
    try {
      const novos = [];
      for (const file of Array.from(fileList)) novos.push(await lerAnexo(file));
      setAnexos((a) => [...a, ...novos]);
    } catch (msg) {
      setErr(typeof msg === "string" ? msg : "Falha ao anexar.");
    }
    setBusy(false);
  };
  const guardar = () => {
    if (!f.titulo.trim()) return setErr("D\xE1 um nome \xE0 despesa.");
    if (valor <= 0) return setErr("Indica um valor v\xE1lido.");
    if (parts.length === 0) return setErr("Escolhe com quem partilhar.");
    if (metodo === "percentagem" && Math.abs(somaPct - 100) > 0.5) return setErr("As percentagens t\xEAm de somar 100% (agora " + Math.round(somaPct) + "%).");
    if (metodo === "personalizado" && Math.abs(diff) > 0.02) return setErr("Os valores t\xEAm de somar " + BM.eur(valor) + " (diferen\xE7a de " + BM.eur(Math.abs(diff)) + ").");
    const qz = {};
    parts.forEach((p) => qz[p] = Math.round((quotas[p] || 0) * 100) / 100);
    onSave({ id: BM.uid(), titulo: f.titulo.trim(), categoria: f.categoria, valor, data: f.data, vencimento: f.vencimento || "", pagador: f.pagador, participantes: parts, metodo, quotas: qz, estado: f.estado, obs: f.obs.trim(), anexos, pagamentos: {} });
  };
  const okSplit = metodo === "percentagem" ? Math.abs(somaPct - 100) < 0.5 : metodo === "personalizado" ? Math.abs(diff) < 0.02 : true;
  const aside = valor > 0 && parts.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "modal-info-title" }, "Resumo da divis\xE3o"), /* @__PURE__ */ React.createElement("div", { className: "modal-info-row" }, /* @__PURE__ */ React.createElement("span", null, "Valor total"), /* @__PURE__ */ React.createElement("b", null, BM.eur(valor))), parts.map((p) => /* @__PURE__ */ React.createElement("div", { className: "modal-info-row", key: p }, /* @__PURE__ */ React.createElement("span", null, p), /* @__PURE__ */ React.createElement("b", null, BM.eur(quotas[p] || 0)))), metodo !== "igual" && /* @__PURE__ */ React.createElement("div", { className: "modal-info-row", style: { borderTop: "1px solid var(--border)", paddingTop: 10 } }, /* @__PURE__ */ React.createElement("span", null, metodo === "percentagem" ? "Soma" : "Diferen\xE7a"), /* @__PURE__ */ React.createElement("b", { style: { color: okSplit ? "var(--accent)" : "var(--neg)" } }, metodo === "percentagem" ? Math.round(somaPct) + "%" : BM.eur(Math.abs(diff)))));
  return /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: "Nova despesa",
      sub: grupo.nome,
      icon: "wallet",
      onClose,
      wide: true,
      aside,
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: onClose }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: guardar }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 14, color: "#fff" }), " Adicionar"))
    },
    /* @__PURE__ */ React.createElement(Field, { label: "Descri\xE7\xE3o" }, /* @__PURE__ */ React.createElement("input", { className: "input", autoFocus: true, value: f.titulo, onChange: set("titulo"), placeholder: "Ex: Renda, Compras, Internet\u2026" })),
    /* @__PURE__ */ React.createElement("div", { className: "modal-row-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Categoria" }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.categoria, onChange: set("categoria") }, Object.keys(BM.cats).map((k) => /* @__PURE__ */ React.createElement("option", { key: k, value: k }, BM.cats[k].nome)))), /* @__PURE__ */ React.createElement(Field, { label: "Valor", icon: "coins" }, /* @__PURE__ */ React.createElement("input", { className: "input", inputMode: "decimal", value: f.valor, onChange: set("valor"), placeholder: "0,00" }))),
    /* @__PURE__ */ React.createElement("div", { className: "modal-row-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Data" }, /* @__PURE__ */ React.createElement("input", { className: "input", type: "date", value: f.data, onChange: set("data") })), /* @__PURE__ */ React.createElement(Field, { label: "Vencimento", hint: "opcional" }, /* @__PURE__ */ React.createElement("input", { className: "input", type: "date", value: f.vencimento, onChange: set("vencimento") }))),
    /* @__PURE__ */ React.createElement("div", { className: "modal-row-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Quem pagou" }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.pagador, onChange: set("pagador") }, pessoas.map((p) => /* @__PURE__ */ React.createElement("option", { key: p }, p)))), /* @__PURE__ */ React.createElement(Field, { label: "Estado" }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.estado, onChange: set("estado") }, ESTADOS.map((s) => /* @__PURE__ */ React.createElement("option", { key: s.id, value: s.id }, s.label))))),
    /* @__PURE__ */ React.createElement(Field, { label: "Partilhar com" }, /* @__PURE__ */ React.createElement("div", { className: "prem-parts" }, pessoas.map((p) => /* @__PURE__ */ React.createElement("button", { type: "button", key: p, className: "chip" + (parts.includes(p) ? " sel" : ""), style: { cursor: "pointer" }, onClick: () => toggle(p) }, p)))),
    /* @__PURE__ */ React.createElement(Field, { label: "M\xE9todo de divis\xE3o" }, /* @__PURE__ */ React.createElement("div", { className: "pg-seg" }, [["igual", "Igual"], ["percentagem", "Percentagem"], ["personalizado", "Valor exato"]].map(([id, lbl]) => /* @__PURE__ */ React.createElement("button", { type: "button", key: id, className: "pg-seg-b" + (metodo === id ? " on" : ""), onClick: () => setMetodo(id) }, lbl)))),
    parts.length > 0 && metodo === "igual" && valor > 0 && /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600, marginBottom: 16 } }, "Cada pessoa fica com ", BM.eur(valor / parts.length), "."),
    parts.length > 0 && metodo !== "igual" && /* @__PURE__ */ React.createElement("div", { className: "pg-split", style: { marginBottom: 16 } }, parts.map((p) => /* @__PURE__ */ React.createElement("div", { className: "pg-split-row", key: p }, /* @__PURE__ */ React.createElement("span", { className: "prem-avatar sm" }, inicial(p)), /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontWeight: 600, fontSize: 13 } }, p), metodo === "percentagem" ? /* @__PURE__ */ React.createElement("span", { className: "pg-split-in" }, /* @__PURE__ */ React.createElement("input", { className: "input", inputMode: "decimal", value: pcts[p] || "", onChange: (e) => setPcts((s) => ({ ...s, [p]: e.target.value })), placeholder: "0" }), /* @__PURE__ */ React.createElement("i", null, "%")) : /* @__PURE__ */ React.createElement("span", { className: "pg-split-in" }, /* @__PURE__ */ React.createElement("input", { className: "input", inputMode: "decimal", value: vals[p] || "", onChange: (e) => setVals((s) => ({ ...s, [p]: e.target.value })), placeholder: "0,00" }), /* @__PURE__ */ React.createElement("i", null, fin.curSym)), /* @__PURE__ */ React.createElement("span", { className: "pg-split-q" }, BM.eur(quotas[p] || 0)))), /* @__PURE__ */ React.createElement("div", { className: "pg-split-sum" + (okSplit ? " ok" : " bad") }, metodo === "percentagem" ? "Soma: " + Math.round(somaPct) + "%" + (okSplit ? " \u2713" : " \xB7 tem de dar 100%") : "Soma: " + BM.eur(somaQuotas) + " / " + BM.eur(valor) + (okSplit ? " \u2713" : ""))),
    /* @__PURE__ */ React.createElement(Field, { label: "Observa\xE7\xF5es", hint: "opcional" }, /* @__PURE__ */ React.createElement("textarea", { className: "input", rows: 2, value: f.obs, onChange: set("obs"), placeholder: "Notas sobre a despesa\u2026", style: { resize: "vertical", fontFamily: "inherit" } })),
    /* @__PURE__ */ React.createElement(Field, { label: "Anexar fatura", hint: "imagem ou PDF" }, /* @__PURE__ */ React.createElement("label", { className: "pg-upload" }, /* @__PURE__ */ React.createElement("input", { type: "file", accept: "image/*,application/pdf", multiple: true, style: { display: "none" }, onChange: (e) => {
      addFiles(e.target.files);
      e.target.value = "";
    } }), /* @__PURE__ */ React.createElement(Icon, { name: "paperclip", size: 16, color: "var(--accent)" }), " ", busy ? "A processar\u2026" : "Escolher ficheiro(s)"), anexos.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 6, flexWrap: "wrap", marginTop: 8 } }, anexos.map((a, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "chip", style: { gap: 7 } }, /* @__PURE__ */ React.createElement(Icon, { name: "receipt", size: 12 }), " ", a.nome.length > 18 ? a.nome.slice(0, 16) + "\u2026" : a.nome, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setAnexos((arr) => arr.filter((_, j) => j !== i)), style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "grid", color: "var(--ink-3)" } }, /* @__PURE__ */ React.createElement("span", { style: { transform: "rotate(45deg)", display: "grid" } }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 12, color: "var(--ink-3)" })))))), /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600, marginTop: 6, lineHeight: 1.5 } }, "As imagens s\xE3o reduzidas automaticamente e guardadas localmente. A leitura autom\xE1tica (OCR) chega numa fase futura.")),
    err && /* @__PURE__ */ React.createElement("div", { className: "alert bad", style: { padding: "9px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16, color: "var(--neg)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, err))
  );
}
function quotaDe(e, p, parts) {
  if (e && e.quotas && e.quotas[p] != null) return +e.quotas[p] || 0;
  const n = parts && parts.length ? parts.length : 1;
  return (+(e && e.valor) || 0) / n;
}
function balancos(g) {
  const pessoas = ["Eu", ...g.membros || []];
  const net = {};
  pessoas.forEach((p) => net[p] = 0);
  (g.despesas || []).forEach((e) => {
    const parts = e.participantes && e.participantes.length ? e.participantes : pessoas;
    const pagos = e.pagamentos || {};
    if (net[e.pagador] == null) net[e.pagador] = 0;
    parts.forEach((p) => {
      if (net[p] == null) net[p] = 0;
      if (p === e.pagador) return;
      if (pagos[p]) return;
      const share = quotaDe(e, p, parts);
      net[p] -= share;
      net[e.pagador] += share;
    });
  });
  Object.keys(net).forEach((p) => net[p] = Math.round(net[p] * 100) / 100);
  return net;
}
const inicial = (p) => p === "Eu" ? "Eu" : (p.trim()[0] || "?").toUpperCase();
function balTag(v) {
  if (Math.abs(v) < 0.01) return /* @__PURE__ */ React.createElement("span", { className: "prem-bal-tag zero" }, "saldado");
  return /* @__PURE__ */ React.createElement("span", { className: "prem-bal-tag " + (v > 0 ? "pos" : "neg") }, (v > 0 ? "recebe " : "deve ") + BM.eur(Math.abs(v)));
}
function grupoStats(g) {
  const pessoas = ["Eu", ...g.membros || []];
  const desp = g.despesas || [];
  const total = desp.reduce((s, e) => s + (+e.valor || 0), 0);
  let aReceber = 0, emDivida = 0, emAberto = 0, porLiquidar = 0;
  desp.forEach((e) => {
    const parts = e.participantes && e.participantes.length ? e.participantes : pessoas;
    const pagos = e.pagamentos || {};
    let aberta = false;
    parts.forEach((p) => {
      if (p === e.pagador) return;
      if (pagos[p]) return;
      aberta = true;
      const share = quotaDe(e, p, parts);
      emAberto += share;
      if (e.pagador === "Eu") aReceber += share;
      if (p === "Eu") emDivida += share;
    });
    if (aberta) porLiquidar++;
  });
  const r2 = (n) => Math.round(n * 100) / 100;
  return { pessoas, total, aReceber: r2(aReceber), emDivida: r2(emDivida), emAberto: r2(emAberto), totalPago: r2(total - emAberto), saldo: r2(aReceber - emDivida), porLiquidar };
}
function dividas(g) {
  const pessoas = ["Eu", ...g.membros || []];
  const pares = {};
  (g.despesas || []).forEach((e) => {
    const parts = e.participantes && e.participantes.length ? e.participantes : pessoas;
    const pagos = e.pagamentos || {};
    parts.forEach((p) => {
      if (p === e.pagador) return;
      if (pagos[p]) return;
      const key = p + "|" + e.pagador;
      pares[key] = (pares[key] || 0) + quotaDe(e, p, parts);
    });
  });
  return Object.keys(pares).map((k) => {
    const [de, para] = k.split("|");
    return { de, para, valor: Math.round(pares[k] * 100) / 100 };
  }).filter((x) => x.valor > 5e-3);
}
function sysMsg(texto) {
  return { id: BM.uid(), tipo: "sistema", texto, ts: Date.now() };
}
function ChatGrupo({ grupo, onSend }) {
  const [txt, setTxt] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const endRef = React.useRef(null);
  const msgs = grupo.mensagens || [];
  React.useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ block: "end" });
  }, [msgs.length]);
  const enviar = () => {
    const t = txt.trim();
    if (!t) return;
    onSend({ id: BM.uid(), autor: "Eu", tipo: "texto", texto: t, ts: Date.now() });
    setTxt("");
  };
  const anexar = async (fl) => {
    setErr("");
    setBusy(true);
    try {
      for (const file of Array.from(fl)) {
        const a = await lerAnexo(file);
        onSend({ id: BM.uid(), autor: "Eu", tipo: /^image\//.test(a.tipo) ? "imagem" : "pdf", anexo: a, ts: Date.now() });
      }
    } catch (m) {
      setErr(typeof m === "string" ? m : "Falha ao anexar.");
    }
    setBusy(false);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "card pg-chat" }, /* @__PURE__ */ React.createElement("div", { className: "pg-chat-scroll" }, msgs.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600, textAlign: "center", padding: 24 } }, "Ainda sem mensagens. Diz ol\xE1 ao grupo \u{1F44B}"), msgs.map((m) => {
    if (m.tipo === "sistema") return /* @__PURE__ */ React.createElement("div", { className: "pg-msg-sys", key: m.id }, m.texto);
    const mine = m.autor === "Eu";
    return /* @__PURE__ */ React.createElement("div", { className: "pg-msg" + (mine ? " mine" : ""), key: m.id }, !mine && /* @__PURE__ */ React.createElement("span", { className: "prem-avatar sm" }, inicial(m.autor)), /* @__PURE__ */ React.createElement("div", { className: "pg-bubble" }, !mine && /* @__PURE__ */ React.createElement("div", { className: "pg-msg-a" }, m.autor), m.tipo === "texto" && /* @__PURE__ */ React.createElement("div", { className: "pg-msg-t" }, m.texto), m.tipo === "imagem" && /* @__PURE__ */ React.createElement("img", { src: m.anexo.dados, alt: m.anexo.nome, className: "pg-msg-img" }), m.tipo === "pdf" && /* @__PURE__ */ React.createElement("a", { href: m.anexo.dados, download: m.anexo.nome, className: "pg-msg-pdf" }, /* @__PURE__ */ React.createElement(Icon, { name: "receipt", size: 15 }), " ", m.anexo.nome), /* @__PURE__ */ React.createElement("div", { className: "pg-msg-time" }, new Date(m.ts).toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }))));
  }), /* @__PURE__ */ React.createElement("div", { ref: endRef })), err && /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { color: "var(--neg)", fontWeight: 700, padding: "4px 12px" } }, err), /* @__PURE__ */ React.createElement("div", { className: "pg-chat-bar" }, /* @__PURE__ */ React.createElement("label", { className: "pg-chat-attach", title: "Anexar imagem ou PDF" }, /* @__PURE__ */ React.createElement("input", { type: "file", accept: "image/*,application/pdf", multiple: true, style: { display: "none" }, onChange: (e) => {
    anexar(e.target.files);
    e.target.value = "";
  } }), /* @__PURE__ */ React.createElement(Icon, { name: busy ? "history" : "plus", size: 18, color: "var(--ink-2)" })), /* @__PURE__ */ React.createElement("input", { className: "input", value: txt, onChange: (e) => setTxt(e.target.value), onKeyDown: (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      enviar();
    }
  }, placeholder: "Escreve uma mensagem\u2026" }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", style: { flex: "none", padding: "9px 13px" }, onClick: enviar, title: "Enviar" }, /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 16, color: "#fff" }))));
}
function GrupoCalendario({ despesas }) {
  const hoje = /* @__PURE__ */ new Date();
  const [ref, setRef] = React.useState({ y: hoje.getFullYear(), m: hoje.getMonth() });
  const comVenc = (despesas || []).filter((e) => e.vencimento);
  const first = new Date(ref.y, ref.m, 1);
  const startDow = (first.getDay() + 6) % 7;
  const dias = new Date(ref.y, ref.m + 1, 0).getDate();
  const byDay = {};
  const doMes = [];
  comVenc.forEach((e) => {
    const p = e.vencimento.split("-").map(Number);
    if (p[0] === ref.y && p[1] - 1 === ref.m) {
      (byDay[p[2]] = byDay[p[2]] || []).push(e);
      doMes.push(e);
    }
  });
  doMes.sort((x, y) => x.vencimento.localeCompare(y.vencimento));
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= dias; d++) cells.push(d);
  const shift = (delta) => setRef((r) => {
    let m = r.m + delta, y = r.y;
    if (m < 0) {
      m = 11;
      y--;
    }
    if (m > 11) {
      m = 0;
      y++;
    }
    return { y, m };
  });
  const isHoje = (d) => hoje.getFullYear() === ref.y && hoje.getMonth() === ref.m && hoje.getDate() === d;
  return /* @__PURE__ */ React.createElement("div", { className: "pg-col" }, /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "pg-cal-head" }, /* @__PURE__ */ React.createElement("button", { className: "pg-back", onClick: () => shift(-1), title: "M\xEAs anterior" }, /* @__PURE__ */ React.createElement("span", { style: { display: "grid", transform: "rotate(180deg)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 15 }))), /* @__PURE__ */ React.createElement("b", { style: { fontSize: 15 } }, BM.MESES[ref.m], " ", ref.y), /* @__PURE__ */ React.createElement("button", { className: "pg-back", onClick: () => shift(1), title: "M\xEAs seguinte" }, /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 15 }))), /* @__PURE__ */ React.createElement("div", { className: "pg-cal-grid pg-cal-dow" }, ["Seg", "Ter", "Qua", "Qui", "Sex", "S\xE1b", "Dom"].map((d) => /* @__PURE__ */ React.createElement("span", { key: d }, d))), /* @__PURE__ */ React.createElement("div", { className: "pg-cal-grid" }, cells.map((d, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "pg-cal-cell" + (d ? "" : " empty") + (d && isHoje(d) ? " hoje" : "") + (d && byDay[d] ? " tem" : "") }, d && /* @__PURE__ */ React.createElement("span", { className: "pg-cal-d" }, d), d && byDay[d] && /* @__PURE__ */ React.createElement("span", { className: "pg-cal-dot" }, byDay[d].length))))), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Vencimentos em ", BM.MESES[ref.m]), doMes.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600, marginTop: 4 } }, "Sem vencimentos neste m\xEAs.") : doMes.map((e) => /* @__PURE__ */ React.createElement("div", { className: "pg-up", key: e.id }, /* @__PURE__ */ React.createElement("div", { className: "pg-up-d" }, /* @__PURE__ */ React.createElement("div", { className: "dd" }, e.vencimento.split("-")[2]), /* @__PURE__ */ React.createElement("div", { className: "mm" }, BM.MESES[ref.m])), /* @__PURE__ */ React.createElement("div", { className: "pg-up-main" }, /* @__PURE__ */ React.createElement("div", { className: "pg-up-t" }, e.titulo, " ", estadoPill(e.estado)), /* @__PURE__ */ React.createElement("div", { className: "pg-up-m" }, (BM.cats[e.categoria] || BM.cats.outros).nome, " \xB7 pago por ", e.pagador)), /* @__PURE__ */ React.createElement("div", { className: "pg-up-v" }, BM.eur(e.valor))))));
}
function Partilha() {
  return /* @__PURE__ */ React.createElement(PremiumGate, null, /* @__PURE__ */ React.createElement(PartilhaInner, null));
}
function PartilhaInner() {
  const prem = usePremium();
  const grupos = prem.get().grupos || [];
  const [modal, setModal] = React.useState(false);
  const [despModal, setDespModal] = React.useState(null);
  const [openId, setOpenId] = React.useState(null);
  const [tab, setTab] = React.useState("dashboard");
  const [anexoView, setAnexoView] = React.useState(null);
  const [remMembro, setRemMembro] = React.useState(null);
  const [delId, setDelId] = React.useState(null);
  const [convEmail, setConvEmail] = React.useState("");
  const [q, setQ] = React.useState("");
  const [filtro, setFiltro] = React.useState("ativos");
  const [ordem, setOrdem] = React.useState("recentes");
  const [editId, setEditId] = React.useState(null);
  const [menuId, setMenuId] = React.useState(null);
  React.useEffect(() => {
    if (!menuId) return;
    const h = (e) => {
      if (!e.target.closest || !e.target.closest(".ph-menu-wrap")) setMenuId(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuId]);
  const aberto = grupos.find((g) => g.id === openId);
  if (aberto) {
    const stats = grupoStats(aberto);
    const net = balancos(aberto);
    const pessoas = stats.pessoas;
    const desp = [...aberto.despesas || []].sort((a, b) => (b.data || "").localeCompare(a.data || ""));
    const pend = (aberto.convites || []).filter((c) => c.estado === "pendente").length;
    const pctPago = stats.total > 0 ? Math.round(stats.totalPago / stats.total * 100) : 0;
    const catBreak = (() => {
      const by = {};
      (aberto.despesas || []).forEach((e) => {
        const k = e.categoria || "outros";
        by[k] = (by[k] || 0) + (+e.valor || 0);
      });
      return Object.keys(by).map((k) => ({ key: k, nome: (BM.cats[k] || BM.cats.outros).nome, color: (BM.cats[k] || BM.cats.outros).color, valor: by[k] })).sort((a, b) => b.valor - a.valor);
    })();
    const proximas = (aberto.despesas || []).filter((e) => e.vencimento).sort((a, b) => (a.vencimento || "").localeCompare(b.vencimento || "")).slice(0, 5);
    const convidar = () => {
      const v = convEmail.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(v)) return;
      const nm = nomeDeEmail(v);
      if (!(aberto.membros || []).includes(nm)) prem.edit("grupos", aberto.id, { membros: [...aberto.membros || [], nm], convites: [...aberto.convites || [], { email: v, nome: nm, estado: "pendente" }] });
      setConvEmail("");
    };
    const setPapel = (nome, papel) => prem.edit("grupos", aberto.id, { papeis: { ...aberto.papeis || {}, [nome]: papel } });
    const removerMembro = (nome) => {
      const p = { ...aberto.papeis || {} };
      delete p[nome];
      prem.edit("grupos", aberto.id, { membros: (aberto.membros || []).filter((m) => m !== nome), convites: (aberto.convites || []).filter((c) => c.nome !== nome), papeis: p });
    };
    const kpis = [
      { lbl: "Total de despesas", val: BM.eur(stats.total), sub: "total do grupo", ic: "wallet", c: "#14a06b" },
      { lbl: "Total pago", val: BM.eur(stats.totalPago), sub: pctPago + "% liquidado", ic: "check", c: "#3b82f6" },
      { lbl: "Em d\xEDvida", val: BM.eur(stats.emDivida), sub: "o que deves", ic: "arrowDown", c: "#e5484d", tone: "neg" },
      { lbl: "A receber", val: BM.eur(stats.aReceber), sub: "o que te devem", ic: "arrowUp", c: "#14a06b", tone: "pos" },
      { lbl: "Saldo pessoal", val: (stats.saldo >= 0 ? "+ " : "\u2212 ") + BM.eur(Math.abs(stats.saldo)), sub: stats.saldo >= 0 ? "est\xE1s a receber" : "tens a pagar", ic: "trend", c: "#0e8659", tone: stats.saldo >= 0 ? "pos" : "neg" },
      { lbl: "Membros", val: String(pessoas.length), sub: pend ? pend + " convite(s) pendente(s)" : "todos ativos", ic: "users", c: "#a855f7" },
      { lbl: "Por liquidar", val: String(stats.porLiquidar), sub: "despesas em aberto", ic: "receipt", c: "#d9840a" }
    ];
    const TABS = [
      { id: "dashboard", label: "Dashboard", ic: "grid" },
      { id: "despesas", label: "Despesas", ic: "receipt" },
      { id: "saldos", label: "Saldos", ic: "trend" },
      { id: "membros", label: "Membros", ic: "users" },
      { id: "conversas", label: "Conversas", ic: "bell", soon: "Fase 5" },
      { id: "calendario", label: "Calend\xE1rio", ic: "history", soon: "Fase 6" }
    ];
    return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { className: "card pg-head" }, /* @__PURE__ */ React.createElement("button", { className: "pg-back", onClick: () => setOpenId(null), title: "Voltar aos grupos" }, /* @__PURE__ */ React.createElement("span", { style: { display: "grid", transform: "rotate(180deg)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 16 }))), /* @__PURE__ */ React.createElement("span", { className: "pg-head-ic" }, /* @__PURE__ */ React.createElement(Icon, { name: "users", size: 20, color: "#fff" })), /* @__PURE__ */ React.createElement("div", { className: "pg-head-txt" }, /* @__PURE__ */ React.createElement("b", { className: "pg-head-name" }, aberto.nome), /* @__PURE__ */ React.createElement("div", { className: "tiny muted" }, pessoas.length, " membros", pend ? " \xB7 " + pend + " pendente(s)" : "")), /* @__PURE__ */ React.createElement("div", { className: "pg-avatars" }, pessoas.slice(0, 4).map((p) => /* @__PURE__ */ React.createElement("span", { className: "prem-avatar sm", key: p, title: p }, inicial(p))), pessoas.length > 4 && /* @__PURE__ */ React.createElement("span", { className: "prem-avatar more sm" }, "+", pessoas.length - 4)), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary pg-add", onClick: () => setDespModal(aberto) }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 15, color: "#fff" }), " Nova despesa")), /* @__PURE__ */ React.createElement("div", { className: "pg-tabs" }, TABS.map((t) => /* @__PURE__ */ React.createElement("button", { key: t.id, className: "pg-tab" + (tab === t.id ? " on" : ""), onClick: () => setTab(t.id) }, /* @__PURE__ */ React.createElement(Icon, { name: t.ic, size: 16 }), " ", t.label, t.soon && /* @__PURE__ */ React.createElement("span", { className: "pg-soon-tag" }, t.soon)))), tab === "dashboard" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "pg-kpis" }, kpis.map((k, i) => /* @__PURE__ */ React.createElement("div", { className: "card pg-kpi", key: i }, /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-top" }, /* @__PURE__ */ React.createElement("span", { className: "pg-kpi-lbl" }, k.lbl), /* @__PURE__ */ React.createElement("span", { className: "pg-kpi-ic", style: { background: k.c } }, /* @__PURE__ */ React.createElement(Icon, { name: k.ic, size: 15, color: "#fff" }))), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-val" + (k.tone ? " " + k.tone : "") }, k.val), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-sub" }, k.sub)))), /* @__PURE__ */ React.createElement("div", { className: "pg-grid" }, /* @__PURE__ */ React.createElement("div", { className: "pg-col" }, /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "pg-sec-h" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Despesas recentes"), desp.length > 5 && /* @__PURE__ */ React.createElement("button", { className: "pg-link", onClick: () => setTab("despesas") }, "Ver todas")), desp.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600 } }, "Ainda sem despesas. Adiciona a primeira.") : desp.slice(0, 5).map((e) => {
      const parts = e.participantes && e.participantes.length ? e.participantes : pessoas;
      return /* @__PURE__ */ React.createElement("div", { className: "pg-exp", key: e.id }, /* @__PURE__ */ React.createElement("span", { className: "pg-exp-ic" }, /* @__PURE__ */ React.createElement(Icon, { name: "receipt", size: 17, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("div", { className: "pg-exp-main" }, /* @__PURE__ */ React.createElement("div", { className: "pg-exp-t" }, e.titulo), /* @__PURE__ */ React.createElement("div", { className: "pg-exp-m" }, e.data ? BM.fmtData(e.data) + " \xB7 " : "", "Pagou ", e.pagador, " \xB7 \xF7", parts.length)), /* @__PURE__ */ React.createElement("div", { className: "pg-exp-v" }, BM.eur(e.valor)));
    })), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "pg-sec-h" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Pr\xF3ximas despesas"), proximas.length > 0 && /* @__PURE__ */ React.createElement("button", { className: "pg-link", onClick: () => setTab("calendario") }, "Calend\xE1rio")), proximas.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600 } }, "Sem vencimentos marcados. Ao criar uma despesa, define uma data de vencimento.") : proximas.map((e) => {
      const mm = (e.vencimento || "").split("-");
      const du = daysUntil(e.vencimento);
      return /* @__PURE__ */ React.createElement("div", { className: "pg-up", key: e.id }, /* @__PURE__ */ React.createElement("div", { className: "pg-up-d" }, /* @__PURE__ */ React.createElement("div", { className: "dd" }, mm[2]), /* @__PURE__ */ React.createElement("div", { className: "mm" }, BM.MESES[+mm[1] - 1])), /* @__PURE__ */ React.createElement("div", { className: "pg-up-main" }, /* @__PURE__ */ React.createElement("div", { className: "pg-up-t" }, e.titulo), /* @__PURE__ */ React.createElement("div", { className: "pg-up-m" }, du < 0 ? "vencida" : du === 0 ? "vence hoje" : "em " + du + (du === 1 ? " dia" : " dias"))), /* @__PURE__ */ React.createElement("div", { className: "pg-up-v" }, BM.eur(e.valor)));
    })), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Atividade do grupo"), desp.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600 } }, "Ainda sem atividade.") : /* @__PURE__ */ React.createElement("div", { className: "pg-tl" }, desp.slice(0, 6).map((e) => /* @__PURE__ */ React.createElement("div", { className: "pg-tli", key: e.id }, /* @__PURE__ */ React.createElement("span", { className: "pg-tli-ic" }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 13, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "pg-tli-txt" }, /* @__PURE__ */ React.createElement("b", null, e.pagador), " adicionou ", /* @__PURE__ */ React.createElement("b", null, e.titulo), " (", BM.eur(e.valor), ")"), /* @__PURE__ */ React.createElement("div", { className: "pg-tli-time" }, e.data ? BM.fmtData(e.data) : ""))))))), /* @__PURE__ */ React.createElement("div", { className: "pg-col" }, /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "pg-sec-h" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Saldos entre membros"), /* @__PURE__ */ React.createElement("button", { className: "pg-link", onClick: () => setTab("saldos") }, "Detalhe")), pessoas.map((p) => /* @__PURE__ */ React.createElement("div", { className: "prem-balrow", key: p }, /* @__PURE__ */ React.createElement("span", { className: "prem-avatar" }, inicial(p)), /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontWeight: 700 } }, p), balTag(net[p] || 0)))), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Despesas por categoria"), catBreak.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600, marginTop: 4 } }, "Sem despesas ainda.") : /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 16, alignItems: "center", marginTop: 6 } }, /* @__PURE__ */ React.createElement(DonutChart, { data: catBreak, size: 140, thickness: 22, center: /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "tnum", style: { fontWeight: 800, fontSize: 14 } }, BM.eur0(stats.total)), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 600 } }, "Total")) }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 } }, catBreak.slice(0, 5).map((c) => /* @__PURE__ */ React.createElement("div", { className: "row", key: c.key, style: { gap: 9, fontSize: 12.5 } }, /* @__PURE__ */ React.createElement("span", { className: "dot", style: { background: c.color } }), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "var(--ink-2)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, c.nome), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700 } }, BM.eur(c.valor)))))))))), tab === "despesas" && /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "pg-sec-h" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Despesas"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-soft", style: { padding: "6px 12px" }, onClick: () => setDespModal(aberto) }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 14 }), " Nova")), desp.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600 } }, "Ainda sem despesas. Adiciona a primeira.") : desp.map((e) => {
      const parts = e.participantes && e.participantes.length ? e.participantes : pessoas;
      const pagos = e.pagamentos || {};
      const devedores = parts.filter((p) => p !== e.pagador);
      const ci = BM.cats[e.categoria] || BM.cats.outros;
      return /* @__PURE__ */ React.createElement("div", { key: e.id, style: { borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { className: "prem-row", style: { borderBottom: "none" } }, /* @__PURE__ */ React.createElement("span", { className: "prem-rico sm", style: { background: "color-mix(in srgb, " + ci.color + " 15%, transparent)" } }, /* @__PURE__ */ React.createElement(Icon, { name: ci.icon || "receipt", size: 16, color: ci.color })), /* @__PURE__ */ React.createElement("div", { className: "prem-rtxt" }, /* @__PURE__ */ React.createElement("b", null, e.titulo, " ", estadoPill(e.estado)), /* @__PURE__ */ React.createElement("span", { className: "muted", style: { fontSize: 12 } }, ci.nome, e.data ? " \xB7 " + BM.fmtData(e.data) : "", " \xB7 Pagou ", e.pagador, e.vencimento ? " \xB7 vence " + BM.fmtData(e.vencimento) : "")), /* @__PURE__ */ React.createElement("div", { className: "prem-ramt" }, BM.eur(e.valor)), /* @__PURE__ */ React.createElement("div", { className: "prem-rbtns" }, e.anexos && e.anexos.length > 0 && /* @__PURE__ */ React.createElement("button", { className: "icon-btn", title: "Ver anexo", onClick: () => setAnexoView(e.anexos[0]) }, /* @__PURE__ */ React.createElement(Icon, { name: "receipt", size: 15, color: "var(--ink-2)" })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", title: "Apagar despesa", onClick: () => prem.edit("grupos", aberto.id, { despesas: (aberto.despesas || []).filter((x) => x.id !== e.id) }) }, /* @__PURE__ */ React.createElement(Icon, { name: "trash", size: 15, color: "var(--neg)" })))), e.obs && /* @__PURE__ */ React.createElement("div", { className: "muted", style: { fontSize: 12, padding: "0 14px 6px 52px", lineHeight: 1.5 } }, e.obs), devedores.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 6, flexWrap: "wrap", padding: "0 14px 12px 52px" } }, devedores.map((p) => {
        const pago = !!pagos[p];
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            key: p,
            className: "chip" + (pago ? " sel" : ""),
            style: { cursor: "pointer" },
            title: pago ? "Marcar como em d\xEDvida" : "Marcar como pago",
            onClick: () => {
              const desps = (aberto.despesas || []).map((x) => x.id === e.id ? { ...x, pagamentos: { ...x.pagamentos || {}, [p]: !pago } } : x);
              const patch = { despesas: desps };
              if (!pago) patch.mensagens = [...aberto.mensagens || [], sysMsg(p + " confirmou o pagamento de " + e.titulo)];
              prem.edit("grupos", aberto.id, patch);
            }
          },
          p,
          ": ",
          pago ? "pagou \u2713" : BM.eur(quotaDe(e, p, parts)) + " deve"
        );
      })));
    })), tab === "saldos" && (() => {
      const ds = dividas(aberto);
      const devemTe = ds.filter((d) => d.para === "Eu");
      const deves = ds.filter((d) => d.de === "Eu");
      const outros = ds.filter((d) => d.de !== "Eu" && d.para !== "Eu");
      const acertar = (de, para) => prem.edit("grupos", aberto.id, {
        despesas: (aberto.despesas || []).map((e) => {
          if (e.pagador !== para) return e;
          const parts = e.participantes && e.participantes.length ? e.participantes : pessoas;
          if (!parts.includes(de)) return e;
          return { ...e, pagamentos: { ...e.pagamentos || {}, [de]: true } };
        }),
        mensagens: [...aberto.mensagens || [], sysMsg((de === "Eu" ? "Eu" : de) + " acertou contas com " + (para === "Eu" ? "Eu" : para))]
      });
      return /* @__PURE__ */ React.createElement("div", { className: "pg-col" }, /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "O teu saldo"), /* @__PURE__ */ React.createElement("div", { className: "pg-bal-hero" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "pg-bal-l" }, "A receber"), /* @__PURE__ */ React.createElement("div", { className: "pg-bal-v pos" }, BM.eur(stats.aReceber))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "pg-bal-l" }, "A pagar"), /* @__PURE__ */ React.createElement("div", { className: "pg-bal-v neg" }, BM.eur(stats.emDivida))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "pg-bal-l" }, "Saldo"), /* @__PURE__ */ React.createElement("div", { className: "pg-bal-v " + (stats.saldo >= 0 ? "pos" : "neg") }, (stats.saldo >= 0 ? "+ " : "\u2212 ") + BM.eur(Math.abs(stats.saldo)))))), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Devem-te"), devemTe.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600, marginTop: 4 } }, "Ningu\xE9m te deve nada. \u{1F389}") : devemTe.map((d, i) => /* @__PURE__ */ React.createElement("div", { className: "pg-set", key: i }, /* @__PURE__ */ React.createElement("span", { className: "prem-avatar sm" }, inicial(d.de)), /* @__PURE__ */ React.createElement("div", { className: "pg-set-txt" }, /* @__PURE__ */ React.createElement("b", null, d.de), " ", /* @__PURE__ */ React.createElement("span", null, "deve-te")), /* @__PURE__ */ React.createElement("span", { className: "pg-set-amt pos" }, BM.eur(d.valor)), /* @__PURE__ */ React.createElement("button", { className: "btn btn-soft", style: { padding: "5px 11px" }, onClick: () => acertar(d.de, "Eu") }, "Marcar recebido")))), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Deves"), deves.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600, marginTop: 4 } }, "N\xE3o deves nada. \u{1F389}") : deves.map((d, i) => /* @__PURE__ */ React.createElement("div", { className: "pg-set", key: i }, /* @__PURE__ */ React.createElement("span", { className: "prem-avatar sm" }, inicial(d.para)), /* @__PURE__ */ React.createElement("div", { className: "pg-set-txt" }, /* @__PURE__ */ React.createElement("span", null, "deves a"), " ", /* @__PURE__ */ React.createElement("b", null, d.para)), /* @__PURE__ */ React.createElement("span", { className: "pg-set-amt neg" }, BM.eur(d.valor)), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", style: { padding: "5px 11px" }, onClick: () => acertar("Eu", d.para) }, "Pagar")))), outros.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Entre outros membros"), outros.map((d, i) => /* @__PURE__ */ React.createElement("div", { className: "pg-set", key: i }, /* @__PURE__ */ React.createElement("span", { className: "prem-avatar sm" }, inicial(d.de)), /* @__PURE__ */ React.createElement("div", { className: "pg-set-txt" }, /* @__PURE__ */ React.createElement("b", null, d.de), " ", /* @__PURE__ */ React.createElement("span", null, "deve a"), " ", /* @__PURE__ */ React.createElement("b", null, d.para)), /* @__PURE__ */ React.createElement("span", { className: "pg-set-amt" }, BM.eur(d.valor)), /* @__PURE__ */ React.createElement("button", { className: "btn btn-soft", style: { padding: "5px 11px" }, onClick: () => acertar(d.de, d.para) }, "Acertar")))), /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600, lineHeight: 1.6 } }, '"Acertar" marca as despesas correspondentes como pagas e atualiza os saldos automaticamente.'));
    })(), tab === "membros" && /* @__PURE__ */ React.createElement("div", { className: "pg-col" }, /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "pg-sec-h" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Membros (", pessoas.length, ")")), /* @__PURE__ */ React.createElement("div", { className: "pg-mrow" }, /* @__PURE__ */ React.createElement("span", { className: "prem-avatar" }, "Eu"), /* @__PURE__ */ React.createElement("div", { className: "pg-mrow-txt" }, /* @__PURE__ */ React.createElement("b", null, "Eu ", /* @__PURE__ */ React.createElement("span", { className: "muted tiny", style: { fontWeight: 600 } }, "(tu)")), /* @__PURE__ */ React.createElement("span", { className: "pg-mrow-sub" }, "criador do grupo")), /* @__PURE__ */ React.createElement("span", { className: "pg-role owner" }, "Owner")), (aberto.membros || []).map((m) => {
      const conv = (aberto.convites || []).find((c) => c.nome === m);
      const pendm = conv && conv.estado === "pendente";
      const papel = aberto.papeis && aberto.papeis[m] || "membro";
      return /* @__PURE__ */ React.createElement("div", { className: "pg-mrow", key: m }, /* @__PURE__ */ React.createElement("span", { className: "prem-avatar" }, inicial(m)), /* @__PURE__ */ React.createElement("div", { className: "pg-mrow-txt" }, /* @__PURE__ */ React.createElement("b", null, m), /* @__PURE__ */ React.createElement("span", { className: "pg-mrow-sub" }, conv ? conv.email : "", pendm ? " \xB7 convite pendente" : "")), pendm ? /* @__PURE__ */ React.createElement("button", { className: "btn btn-soft", style: { padding: "5px 11px" }, onClick: () => prem.edit("grupos", aberto.id, { convites: (aberto.convites || []).map((c) => c.nome === m ? { ...c, estado: "ativo" } : c), mensagens: [...aberto.mensagens || [], sysMsg(m + " entrou no grupo")] }) }, "Aceitar") : /* @__PURE__ */ React.createElement("select", { className: "select pg-role-sel", value: papel, onChange: (e) => setPapel(m, e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "admin" }, "Admin"), /* @__PURE__ */ React.createElement("option", { value: "membro" }, "Membro")), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", title: "Remover membro", onClick: () => setRemMembro(m) }, /* @__PURE__ */ React.createElement(Icon, { name: "trash", size: 15, color: "var(--neg)" })));
    }), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 8, marginTop: 12 } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "input",
        type: "email",
        value: convEmail,
        onChange: (e) => setConvEmail(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            convidar();
          }
        },
        placeholder: "convidar por email\u2026"
      }
    ), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", style: { flex: "none" }, onClick: convidar }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 14, color: "#fff" }), " Convidar"))), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Como funcionam as permiss\xF5es"), /* @__PURE__ */ React.createElement("div", { className: "pg-perm" }, /* @__PURE__ */ React.createElement("span", { className: "pg-role owner" }, "Owner"), /* @__PURE__ */ React.createElement("span", null, "Controlo total: gere membros, permiss\xF5es e o grupo.")), /* @__PURE__ */ React.createElement("div", { className: "pg-perm" }, /* @__PURE__ */ React.createElement("span", { className: "pg-role admin" }, "Admin"), /* @__PURE__ */ React.createElement("span", null, "Pode adicionar despesas e convidar membros.")), /* @__PURE__ */ React.createElement("div", { className: "pg-perm" }, /* @__PURE__ */ React.createElement("span", { className: "pg-role membro" }, "Membro"), /* @__PURE__ */ React.createElement("span", null, "Participa nas despesas e v\xEA os saldos.")), /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600, marginTop: 10, lineHeight: 1.6 } }, "\xC9s o Owner deste grupo. As permiss\xF5es aplicam-se de verdade entre v\xE1rios utilizadores quando o backend estiver ligado \u2014 aqui \xE9 simula\xE7\xE3o local. Ao remover um membro, as despesas j\xE1 registadas mant\xEAm-se no hist\xF3rico."))), tab === "conversas" && /* @__PURE__ */ React.createElement(ChatGrupo, { grupo: aberto, onSend: (m) => prem.edit("grupos", aberto.id, { mensagens: [...aberto.mensagens || [], m] }) }), tab === "calendario" && /* @__PURE__ */ React.createElement(GrupoCalendario, { despesas: aberto.despesas }), despModal && /* @__PURE__ */ React.createElement(DespesaPartilhadaModal, { grupo: aberto, onClose: () => setDespModal(null), onSave: (d) => {
      prem.edit("grupos", aberto.id, { despesas: [...aberto.despesas || [], d], mensagens: [...aberto.mensagens || [], sysMsg("Eu adicionou a despesa " + d.titulo + " (" + BM.eur(d.valor) + ")")] });
      setDespModal(null);
    } }), anexoView && /* @__PURE__ */ React.createElement(AnexoViewer, { anexo: anexoView, onClose: () => setAnexoView(null) }), remMembro && /* @__PURE__ */ React.createElement(
      Modal,
      {
        title: "Remover membro",
        sub: "Esta a\xE7\xE3o n\xE3o pode ser revertida.",
        icon: "trash",
        iconNeg: true,
        onClose: () => setRemMembro(null),
        footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => setRemMembro(null) }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { className: "btn", style: { background: "var(--neg)", color: "#fff", border: "none" }, onClick: () => {
          removerMembro(remMembro);
          setRemMembro(null);
        } }, /* @__PURE__ */ React.createElement(Icon, { name: "trash", size: 14, color: "#fff" }), " Remover"))
      },
      /* @__PURE__ */ React.createElement("div", { className: "muted", style: { fontSize: 13.5, fontWeight: 500, lineHeight: 1.6 } }, "Remover ", /* @__PURE__ */ React.createElement("b", null, remMembro), " do grupo? As despesas j\xE1 registadas mant\xEAm-se no hist\xF3rico.")
    ));
  }
  const ultAtual = (g) => {
    const ds = (g.despesas || []).map((e) => e.data).filter(Boolean).sort();
    return ds.length ? ds[ds.length - 1] : "";
  };
  let sTotal = 0, sReceber = 0, sPagar = 0, sConv = 0, sAtivos = 0;
  grupos.forEach((g) => {
    const s = grupoStats(g);
    sTotal += s.total;
    sReceber += s.aReceber;
    sPagar += s.emDivida;
    sConv += (g.convites || []).filter((c) => c.estado === "pendente").length;
    if (!g.arquivado) sAtivos++;
  });
  const kpisTop = [
    { lbl: "Total em grupos", val: BM.eur(sTotal), sub: grupos.length + " grupo(s)", ic: "wallet", c: "#14a06b" },
    { lbl: "A receber", val: BM.eur(sReceber), sub: "no total", ic: "arrowUp", c: "#14a06b", tone: "pos" },
    { lbl: "A pagar", val: BM.eur(sPagar), sub: "no total", ic: "arrowDown", c: "#e5484d", tone: "neg" },
    { lbl: "Grupos ativos", val: String(sAtivos), sub: grupos.length - sAtivos + " arquivado(s)", ic: "users", c: "#3b82f6" },
    { lbl: "Convites pendentes", val: String(sConv), sub: "por aceitar", ic: "bell", c: "#d9840a" }
  ];
  const q2 = q.trim().toLowerCase();
  let lista = grupos.filter((g) => {
    if (filtro === "ativos" && g.arquivado) return false;
    if (filtro === "arquivados" && !g.arquivado) return false;
    if (q2 && !((g.nome || "").toLowerCase().includes(q2) || (g.descricao || "").toLowerCase().includes(q2))) return false;
    return true;
  }).sort((a, b) => {
    if (ordem === "nome") return (a.nome || "").localeCompare(b.nome || "");
    if (ordem === "valor") return grupoStats(b).total - grupoStats(a).total;
    return (ultAtual(b) || "").localeCompare(ultAtual(a) || "");
  });
  const convitesPend = [];
  grupos.forEach((g) => (g.convites || []).forEach((c) => {
    if (c.estado === "pendente") convitesPend.push({ g, c });
  }));
  const atividade = [];
  grupos.forEach((g) => (g.despesas || []).forEach((e) => atividade.push({ g, e })));
  atividade.sort((a, b) => (b.e.data || "").localeCompare(a.e.data || ""));
  const ativRecente = atividade.slice(0, 6);
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { className: "ph-kpis" }, kpisTop.map((k, i) => /* @__PURE__ */ React.createElement("div", { className: "card pg-kpi", key: i }, /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-top" }, /* @__PURE__ */ React.createElement("span", { className: "pg-kpi-lbl" }, k.lbl), /* @__PURE__ */ React.createElement("span", { className: "pg-kpi-ic", style: { background: k.c } }, /* @__PURE__ */ React.createElement(Icon, { name: k.ic, size: 15, color: "#fff" }))), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-val" + (k.tone ? " " + k.tone : "") }, k.val), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-sub" }, k.sub)))), /* @__PURE__ */ React.createElement("div", { className: "ph-layout" }, /* @__PURE__ */ React.createElement("div", { className: "ph-main" }, /* @__PURE__ */ React.createElement("div", { className: "ph-toolbar" }, /* @__PURE__ */ React.createElement("div", { className: "ph-search" }, /* @__PURE__ */ React.createElement(Icon, { name: "search", size: 16, color: "var(--ink-3)" }), /* @__PURE__ */ React.createElement("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Procurar grupo\u2026" })), /* @__PURE__ */ React.createElement("select", { className: "select ph-tool-sel", value: filtro, onChange: (e) => setFiltro(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "ativos" }, "Ativos"), /* @__PURE__ */ React.createElement("option", { value: "arquivados" }, "Arquivados"), /* @__PURE__ */ React.createElement("option", { value: "todos" }, "Todos")), /* @__PURE__ */ React.createElement("select", { className: "select ph-tool-sel", value: ordem, onChange: (e) => setOrdem(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "recentes" }, "Recentes"), /* @__PURE__ */ React.createElement("option", { value: "nome" }, "Nome"), /* @__PURE__ */ React.createElement("option", { value: "valor" }, "Valor")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary ph-tool-add", onClick: () => setModal(true) }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 15, color: "#fff" }), " Novo grupo")), /* @__PURE__ */ React.createElement("div", { className: "pg-sec-h" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Os meus grupos"), /* @__PURE__ */ React.createElement("span", { className: "tiny muted", style: { fontWeight: 600 } }, lista.length, " de ", grupos.length)), lista.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "card card-pad", style: { textAlign: "center", padding: "32px 20px" } }, /* @__PURE__ */ React.createElement("div", { className: "muted", style: { fontWeight: 600, fontSize: 13.5 } }, grupos.length === 0 ? "Ainda n\xE3o tens grupos \u2014 cria o primeiro j\xE1 a seguir." : "Nenhum grupo corresponde \xE0 pesquisa.")) : /* @__PURE__ */ React.createElement("div", { className: "ph-groups" }, lista.map((g) => {
    const s = grupoStats(g);
    const pessoas = ["Eu", ...g.membros || []];
    const ua = ultAtual(g);
    const desc = g.descricao || (pessoas.length > 1 ? "Grupo com " + pessoas.length + " membros" : "Grupo pessoal");
    return /* @__PURE__ */ React.createElement("div", { className: "card ph-gcard", key: g.id }, /* @__PURE__ */ React.createElement("div", { className: "ph-gcard-top" }, /* @__PURE__ */ React.createElement("span", { className: "ph-gico" }, /* @__PURE__ */ React.createElement(Icon, { name: "users", size: 18, color: "#fff" })), /* @__PURE__ */ React.createElement("span", { className: "ph-state " + (g.arquivado ? "arch" : "on") }, g.arquivado ? "Arquivado" : "Ativo"), /* @__PURE__ */ React.createElement("div", { className: "ph-menu-wrap" }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", title: "A\xE7\xF5es", onClick: () => setMenuId(menuId === g.id ? null : g.id) }, /* @__PURE__ */ React.createElement(Icon, { name: "dots", size: 18 })), menuId === g.id && /* @__PURE__ */ React.createElement("div", { className: "ph-menu" }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
      setMenuId(null);
      setEditId(g.id);
    } }, /* @__PURE__ */ React.createElement(Icon, { name: "edit", size: 15 }), " Editar"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      setMenuId(null);
      setTab("membros");
      setOpenId(g.id);
    } }, /* @__PURE__ */ React.createElement(Icon, { name: "users", size: 15 }), " Convidar membros"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      setMenuId(null);
      prem.edit("grupos", g.id, { arquivado: !g.arquivado });
    } }, /* @__PURE__ */ React.createElement(Icon, { name: "archive", size: 15 }), " ", g.arquivado ? "Desarquivar" : "Arquivar"), /* @__PURE__ */ React.createElement("button", { className: "danger", onClick: () => {
      setMenuId(null);
      setDelId(g.id);
    } }, /* @__PURE__ */ React.createElement(Icon, { name: "trash", size: 15 }), " Eliminar")))), /* @__PURE__ */ React.createElement("b", { className: "ph-gname" }, g.nome), /* @__PURE__ */ React.createElement("div", { className: "ph-gdesc" }, desc), /* @__PURE__ */ React.createElement("div", { className: "ph-gav" }, pessoas.slice(0, 5).map((p) => /* @__PURE__ */ React.createElement("span", { className: "prem-avatar sm", key: p, title: p }, inicial(p))), pessoas.length > 5 && /* @__PURE__ */ React.createElement("span", { className: "prem-avatar more sm" }, "+", pessoas.length - 5), /* @__PURE__ */ React.createElement("span", { className: "ph-gmembers" }, pessoas.length, " membros")), /* @__PURE__ */ React.createElement("div", { className: "ph-gstats" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "ph-gs-l" }, "Movimentado"), /* @__PURE__ */ React.createElement("span", { className: "ph-gs-v" }, BM.eur(s.total))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "ph-gs-l" }, "A receber"), /* @__PURE__ */ React.createElement("span", { className: "ph-gs-v pos" }, BM.eur(s.aReceber))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "ph-gs-l" }, "A pagar"), /* @__PURE__ */ React.createElement("span", { className: "ph-gs-v neg" }, BM.eur(s.emDivida)))), /* @__PURE__ */ React.createElement("div", { className: "ph-gfoot" }, /* @__PURE__ */ React.createElement("span", { className: "tiny muted" }, ua ? "Atualizado " + BM.fmtData(ua) : "Sem atividade")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary ph-gopen", onClick: () => {
      setTab("dashboard");
      setOpenId(g.id);
    } }, "Abrir grupo ", /* @__PURE__ */ React.createElement("span", { style: { display: "grid" } }, /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 15, color: "#fff" }))));
  })), /* @__PURE__ */ React.createElement("div", { className: "ph-create", onClick: () => setModal(true) }, /* @__PURE__ */ React.createElement("div", { className: "ph-create-ic" }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 26, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("div", { className: "ph-create-txt" }, /* @__PURE__ */ React.createElement("b", null, "Criar um novo grupo"), /* @__PURE__ */ React.createElement("span", null, "Divide a casa, uma viagem ou o jantar. Convida por email e acompanha tudo num s\xF3 s\xEDtio.")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: (e) => {
    e.stopPropagation();
    setModal(true);
  } }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 15, color: "#fff" }), " Criar novo grupo"))), /* @__PURE__ */ React.createElement("aside", { className: "ph-aside" }, /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Convites recebidos"), convitesPend.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600, marginTop: 4 } }, "Sem convites pendentes.") : convitesPend.map(({ g, c }, i) => /* @__PURE__ */ React.createElement("div", { className: "ph-inv", key: i }, /* @__PURE__ */ React.createElement("span", { className: "prem-avatar sm" }, inicial(c.nome || "?")), /* @__PURE__ */ React.createElement("div", { className: "ph-inv-txt" }, /* @__PURE__ */ React.createElement("b", null, g.nome), /* @__PURE__ */ React.createElement("span", null, c.email || c.nome)), /* @__PURE__ */ React.createElement("div", { className: "ph-inv-btns" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-soft", style: { padding: "5px 10px" }, onClick: () => prem.edit("grupos", g.id, { convites: (g.convites || []).map((x) => x.nome === c.nome ? { ...x, estado: "ativo" } : x) }) }, "Aceitar"), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", title: "Recusar", onClick: () => prem.edit("grupos", g.id, { convites: (g.convites || []).filter((x) => x.nome !== c.nome), membros: (g.membros || []).filter((m) => m !== c.nome) }) }, /* @__PURE__ */ React.createElement("span", { style: { transform: "rotate(45deg)", display: "grid" } }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 15, color: "var(--ink-3)" }))))))), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Atividade recente"), ativRecente.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600, marginTop: 4 } }, "Ainda sem atividade.") : /* @__PURE__ */ React.createElement("div", { className: "pg-tl", style: { marginTop: 4 } }, ativRecente.map(({ g, e }, i) => /* @__PURE__ */ React.createElement("div", { className: "pg-tli", key: i }, /* @__PURE__ */ React.createElement("span", { className: "pg-tli-ic" }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 13, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "pg-tli-txt" }, /* @__PURE__ */ React.createElement("b", null, e.pagador), " adicionou ", /* @__PURE__ */ React.createElement("b", null, e.titulo), " \xB7 ", /* @__PURE__ */ React.createElement("span", { className: "muted" }, g.nome)), /* @__PURE__ */ React.createElement("div", { className: "pg-tli-time" }, e.data ? BM.fmtData(e.data) : "")))))), /* @__PURE__ */ React.createElement("div", { className: "card card-pad ph-priv" }, /* @__PURE__ */ React.createElement("span", { className: "ph-priv-ic" }, /* @__PURE__ */ React.createElement(Icon, { name: "shield", size: 18, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", { style: { fontSize: 13.5 } }, "Privacidade & seguran\xE7a"), /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 500, marginTop: 3, lineHeight: 1.55 } }, "S\xF3 os membros do grupo veem as suas despesas. Podes exigir PIN para a\xE7\xF5es sens\xEDveis nas Defini\xE7\xF5es."))))), modal && /* @__PURE__ */ React.createElement(GrupoModal, { onClose: () => setModal(false), onSave: (it) => {
    prem.add("grupos", it);
    setModal(false);
  } }), editId && grupos.find((g) => g.id === editId) && /* @__PURE__ */ React.createElement(GrupoModal, { grupo: grupos.find((g) => g.id === editId), onClose: () => setEditId(null), onSave: (it) => {
    prem.edit("grupos", editId, it);
    setEditId(null);
  } }), delId && /* @__PURE__ */ React.createElement(RLConfirmPin, { title: "Eliminar grupo", desc: "Vais eliminar este grupo e todas as suas despesas. Esta a\xE7\xE3o \xE9 irrevers\xEDvel.", onConfirm: () => prem.remove("grupos", delId), onClose: () => setDelId(null) }));
}
function Previsao() {
  return /* @__PURE__ */ React.createElement(PremiumGate, null, /* @__PURE__ */ React.createElement(PrevisaoInner, null));
}
function PrevisaoInner() {
  var _a, _b;
  const fin = useFinance();
  const prem = usePremium();
  const hojeDia = (/* @__PURE__ */ new Date()).getDate();
  const recorrentes = prem.get().recorrentes || [];
  const aSair = recorrentes.filter((r) => r.dia >= hojeDia).reduce((s, r) => s + (+r.valor || 0), 0);
  const saldoAtual = fin.saldo || 0;
  const fimMes = saldoAtual - aSair;
  const despesas = ((_a = fin.data) == null ? void 0 : _a.despesas) || [];
  const rendimentos = ((_b = fin.data) == null ? void 0 : _b.rendimentos) || [];
  const code = fin.cur || "EUR";
  const money = (n) => (+n || 0).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + code;
  const meses = React.useMemo(() => {
    const set = /* @__PURE__ */ new Set([BM.monthKey(BM.todayISO())]);
    [...despesas, ...rendimentos].forEach((x) => {
      if (x.data) set.add(BM.monthKey(x.data));
    });
    return [...set].sort().reverse();
  }, [despesas, rendimentos]);
  const [mes, setMes] = React.useState(meses[0]);
  React.useEffect(() => {
    if (!meses.includes(mes)) setMes(meses[0]);
  }, [meses]);
  const rotuloMes = (mk) => {
    const [a, m] = mk.split("-");
    return `${BM.MESES[+m - 1]} de ${a}`;
  };
  const doMes = (arr) => arr.filter((x) => x.data && BM.monthKey(x.data) === mes);
  const dMes = doMes(despesas), rMes = doMes(rendimentos);
  const totR = rMes.reduce((s, r) => s + (+r.valor || 0), 0);
  const totD = dMes.reduce((s, d) => s + (+d.valor || 0), 0);
  const linhas = () => {
    const out = [];
    rMes.forEach((r) => out.push([BM.fmtData ? BM.fmtData(r.data) : r.data, "Rendimento", r.cat || "\u2014", r.fonte || "", money(r.valor)]));
    dMes.forEach((d) => out.push([BM.fmtData ? BM.fmtData(d.data) : d.data, "Despesa", (BM.cats[d.cat] || BM.cats.outros).nome, d.nome || "", "\u2212" + money(d.valor)]));
    return out;
  };
  const baixarPDF = () => {
    const J = window.jspdf && window.jspdf.jsPDF;
    if (!J) return alert("A biblioteca de PDF n\xE3o carregou. Confirma a liga\xE7\xE3o \xE0 internet e tenta de novo.");
    const doc = new J();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(20, 160, 107);
    doc.text("Rende+", 14, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(70, 70, 70);
    doc.text("Relat\xF3rio de " + rotuloMes(mes), 14, 26);
    doc.setTextColor(25, 25, 25);
    doc.setFontSize(12);
    doc.text("Rendimentos:  " + money(totR), 14, 40);
    doc.text("Despesas:  " + money(totD), 14, 47);
    doc.setFont("helvetica", "bold");
    doc.text("Saldo do m\xEAs:  " + money(totR - totD), 14, 54);
    doc.autoTable({
      startY: 62,
      head: [["Data", "Tipo", "Categoria", "Descri\xE7\xE3o", "Valor"]],
      body: linhas(),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [20, 160, 107], textColor: 255 },
      alternateRowStyles: { fillColor: [244, 248, 246] }
    });
    doc.save("rende-" + mes + ".pdf");
  };
  const baixarExcel = () => {
    const X = window.XLSX;
    if (!X) return alert("A biblioteca de Excel n\xE3o carregou. Confirma a liga\xE7\xE3o \xE0 internet e tenta de novo.");
    const aoa = [["Data", "Tipo", "Categoria", "Descri\xE7\xE3o", "Valor (" + code + ")"]];
    rMes.forEach((r) => aoa.push([r.data, "Rendimento", r.cat || "", r.fonte || "", +r.valor || 0]));
    dMes.forEach((d) => aoa.push([d.data, "Despesa", (BM.cats[d.cat] || BM.cats.outros).nome, d.nome || "", -(+d.valor || 0)]));
    aoa.push([], ["", "", "", "Rendimentos", totR], ["", "", "", "Despesas", -totD], ["", "", "", "Saldo do m\xEAs", totR - totD]);
    const ws = X.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 24 }, { wch: 14 }];
    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, ws, rotuloMes(mes).slice(0, 28));
    X.writeFile(wb, "rende-" + mes + ".xlsx");
  };
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "prev-hero-head" }, /* @__PURE__ */ React.createElement("span", { className: "prem-rico", style: { background: "color-mix(in srgb, var(--accent) 14%, transparent)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "chart", size: 19, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15 } }, "Previs\xE3o de saldo"), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 600 } }, "Como deves acabar este m\xEAs, j\xE1 a contar com as recorrentes por pagar."))), /* @__PURE__ */ React.createElement("div", { className: "prev-proj" }, /* @__PURE__ */ React.createElement("div", { className: "prev-proj-l" }, "No fim do m\xEAs"), /* @__PURE__ */ React.createElement("div", { className: "prev-proj-v tnum valor-sensivel", style: { color: fimMes >= 0 ? "var(--accent)" : "var(--neg)" } }, BM.eur(fimMes)), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 600, marginTop: 7 } }, /* @__PURE__ */ React.createElement("span", { className: "valor-sensivel" }, BM.eur(saldoAtual)), " de saldo atual \u2212 ", /* @__PURE__ */ React.createElement("span", { className: "valor-sensivel" }, BM.eur(aSair)), " de recorrentes ainda por pagar"))), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "prev-hero-head", style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("span", { className: "prem-rico", style: { background: "color-mix(in srgb, var(--c-habitacao) 14%, transparent)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "sheet", size: 18, color: "var(--c-habitacao)" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15 } }, "Relat\xF3rio do m\xEAs"), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 600 } }, "Escolhe o m\xEAs e descarrega o resumo em PDF ou Excel."))), /* @__PURE__ */ React.createElement(Field, { label: "M\xEAs" }, /* @__PURE__ */ React.createElement("select", { className: "select", value: mes, onChange: (e) => setMes(e.target.value) }, meses.map((m) => /* @__PURE__ */ React.createElement("option", { key: m, value: m }, rotuloMes(m))))), /* @__PURE__ */ React.createElement("div", { className: "prem-stats", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "prem-stat ok" }, /* @__PURE__ */ React.createElement("span", { className: "prem-stat-l" }, "Rendimentos"), /* @__PURE__ */ React.createElement("span", { className: "prem-stat-v tnum valor-sensivel" }, BM.eur(totR))), /* @__PURE__ */ React.createElement("div", { className: "prem-stat danger" }, /* @__PURE__ */ React.createElement("span", { className: "prem-stat-l" }, "Despesas"), /* @__PURE__ */ React.createElement("span", { className: "prem-stat-v tnum valor-sensivel" }, BM.eur(totD))), /* @__PURE__ */ React.createElement("div", { className: "prem-stat" }, /* @__PURE__ */ React.createElement("span", { className: "prem-stat-l" }, "Saldo do m\xEAs"), /* @__PURE__ */ React.createElement("span", { className: "prem-stat-v tnum valor-sensivel" }, BM.eur(totR - totD)))), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 10, marginTop: 16, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: baixarPDF }, /* @__PURE__ */ React.createElement(Icon, { name: "pdf", size: 16, color: "#fff" }), " Descarregar PDF"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-soft", onClick: baixarExcel }, /* @__PURE__ */ React.createElement(Icon, { name: "sheet", size: 16 }), " Descarregar Excel")), dMes.length + rMes.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "muted", style: { fontSize: 12.5, marginTop: 12 } }, "Ainda n\xE3o h\xE1 movimentos neste m\xEAs. O ficheiro vai sair s\xF3 com o resumo.")));
}
const SUB_CATALOGO = [
  { nome: "Netflix", icon: "film", color: "#e50914", valor: 13.99 },
  { nome: "Disney+", icon: "film", color: "#1f6feb", valor: 9.99 },
  { nome: "HBO Max", icon: "film", color: "#7b4dff", valor: 9.99 },
  { nome: "Prime Video", icon: "film", color: "#00a8e1", valor: 6.99 },
  { nome: "Apple TV+", icon: "tv", color: "#787880", valor: 9.99 },
  { nome: "YouTube Premium", icon: "film", color: "#ff0000", valor: 12.99 },
  { nome: "Spotify", icon: "music", color: "#1db954", valor: 6.99 },
  { nome: "Apple Music", icon: "music", color: "#fa2d48", valor: 10.99 },
  { nome: "YouTube Music", icon: "music", color: "#e53935", valor: 10.99 },
  { nome: "Tidal", icon: "music", color: "#22c1e8", valor: 10.99 },
  { nome: "Deezer", icon: "music", color: "#a238ff", valor: 11.99 },
  { nome: "iCloud+", icon: "wifi", color: "#3693f3", valor: 0.99 },
  { nome: "Google One", icon: "wifi", color: "#4285f4", valor: 1.99 },
  { nome: "Dropbox", icon: "wifi", color: "#0061ff", valor: 11.99 },
  { nome: "Microsoft 365", icon: "briefcase", color: "#d83b01", valor: 7 },
  { nome: "PlayStation Plus", icon: "game", color: "#0070d1", valor: 8.99 },
  { nome: "Xbox Game Pass", icon: "game", color: "#107c10", valor: 12.99 },
  { nome: "Twitch", icon: "tv", color: "#9146ff", valor: 4.99 },
  { nome: "ChatGPT Plus", icon: "spark", color: "#10a37f", valor: 23 },
  { nome: "Notion", icon: "briefcase", color: "#787880", valor: 9.5 },
  { nome: "Amazon Prime", icon: "bag", color: "#00a8e1", valor: 4.99 }
];
const SUB_CATS = {
  entretenimento: { nome: "Entretenimento", color: "#e5484d" },
  musica: { nome: "M\xFAsica", color: "#1db954" },
  cloud: { nome: "Cloud", color: "#3693f3" },
  produtividade: { nome: "Produtividade", color: "#d83b01" },
  jogos: { nome: "Jogos", color: "#0070d1" },
  educacao: { nome: "Educa\xE7\xE3o", color: "#a855f7" },
  compras: { nome: "Compras", color: "#f0913a" },
  outros: { nome: "Outros", color: "#787880" }
};
const ICON_CAT = { film: "entretenimento", tv: "entretenimento", music: "musica", wifi: "cloud", briefcase: "produtividade", spark: "produtividade", game: "jogos", bag: "compras" };
function subCat(s) {
  return s.categoria || ICON_CAT[s.icon] || "outros";
}
function subCatMeta(c) {
  return SUB_CATS[c] || SUB_CATS.outros;
}
function cicloLabel(c) {
  return { mensal: "Mensal", anual: "Anual", semanal: "Semanal" }[c || "mensal"];
}
function mensalDe(s) {
  const v = +s.valor || 0, c = s.ciclo || "mensal";
  return c === "anual" ? v / 12 : c === "semanal" ? v * 52 / 12 : v;
}
function anualDe(s) {
  const v = +s.valor || 0, c = s.ciclo || "mensal";
  return c === "anual" ? v : c === "semanal" ? v * 52 : v * 12;
}
function subEstado(s) {
  return s.estado || "ativa";
}
const SUB_ESTADOS = { ativa: { l: "Ativa", cls: "on" }, trial: { l: "Trial", cls: "trial" }, pausada: { l: "Pausada", cls: "pausa" }, cancelada: { l: "Cancelada", cls: "canc" } };
function proxRenovDate(s) {
  const h = /* @__PURE__ */ new Date();
  const dia = Math.min(28, Math.max(1, +s.dia || 1));
  let d = new Date(h.getFullYear(), h.getMonth(), dia);
  const hj = new Date(h.getFullYear(), h.getMonth(), h.getDate());
  if (d < hj) d = new Date(h.getFullYear(), h.getMonth() + 1, dia);
  return d;
}
function diasAte(d) {
  const h = /* @__PURE__ */ new Date();
  return Math.round((d - new Date(h.getFullYear(), h.getMonth(), h.getDate())) / 864e5);
}
function subEstadoPill(s) {
  const e = SUB_ESTADOS[subEstado(s)] || SUB_ESTADOS.ativa;
  return /* @__PURE__ */ React.createElement("span", { className: "sub-estado " + e.cls }, e.l);
}
function SubCalendario({ subs }) {
  const hoje = /* @__PURE__ */ new Date();
  const [ref, setRef] = React.useState({ y: hoje.getFullYear(), m: hoje.getMonth() });
  const ativos = (subs || []).filter((s) => subEstado(s) === "ativa" || subEstado(s) === "trial");
  const first = new Date(ref.y, ref.m, 1);
  const startDow = (first.getDay() + 6) % 7;
  const dias = new Date(ref.y, ref.m + 1, 0).getDate();
  const byDay = {};
  ativos.forEach((s) => {
    const d = Math.min(dias, Math.min(28, Math.max(1, +s.dia || 1)));
    (byDay[d] = byDay[d] || []).push(s);
  });
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= dias; d++) cells.push(d);
  const shift = (delta) => setRef((r) => {
    let m = r.m + delta, y = r.y;
    if (m < 0) {
      m = 11;
      y--;
    }
    if (m > 11) {
      m = 0;
      y++;
    }
    return { y, m };
  });
  const isHoje = (d) => hoje.getFullYear() === ref.y && hoje.getMonth() === ref.m && hoje.getDate() === d;
  const listaDias = Object.keys(byDay).map(Number).sort((a, b) => a - b);
  return /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "pg-cal-head" }, /* @__PURE__ */ React.createElement("button", { className: "pg-back", onClick: () => shift(-1), title: "M\xEAs anterior" }, /* @__PURE__ */ React.createElement("span", { style: { display: "grid", transform: "rotate(180deg)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 15 }))), /* @__PURE__ */ React.createElement("b", { style: { fontSize: 15 } }, BM.MESES[ref.m], " ", ref.y), /* @__PURE__ */ React.createElement("button", { className: "pg-back", onClick: () => shift(1), title: "M\xEAs seguinte" }, /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 15 }))), /* @__PURE__ */ React.createElement("div", { className: "pg-cal-grid pg-cal-dow" }, ["Seg", "Ter", "Qua", "Qui", "Sex", "S\xE1b", "Dom"].map((d) => /* @__PURE__ */ React.createElement("span", { key: d }, d))), /* @__PURE__ */ React.createElement("div", { className: "pg-cal-grid" }, cells.map((d, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "pg-cal-cell" + (d ? "" : " empty") + (d && isHoje(d) ? " hoje" : "") + (d && byDay[d] ? " tem" : "") }, d && /* @__PURE__ */ React.createElement("span", { className: "pg-cal-d" }, d), d && byDay[d] && /* @__PURE__ */ React.createElement("span", { className: "pg-cal-dot" }, byDay[d].length)))), listaDias.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600, marginTop: 12 } }, "Sem renova\xE7\xF5es neste m\xEAs.") : /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, display: "flex", flexDirection: "column", gap: 2 } }, listaDias.map((d) => byDay[d].map((s) => /* @__PURE__ */ React.createElement("div", { className: "pg-up", key: s.id + "-" + d }, /* @__PURE__ */ React.createElement("div", { className: "pg-up-d" }, /* @__PURE__ */ React.createElement("div", { className: "dd" }, d), /* @__PURE__ */ React.createElement("div", { className: "mm" }, BM.MESES[ref.m].slice(0, 3))), /* @__PURE__ */ React.createElement("span", { className: "prem-rico sm", style: { background: "color-mix(in srgb, " + (s.color || "var(--accent)") + " 14%, transparent)" } }, /* @__PURE__ */ React.createElement(Icon, { name: s.icon || "tv", size: 15, color: s.color || "var(--accent)" })), /* @__PURE__ */ React.createElement("div", { className: "pg-up-main" }, /* @__PURE__ */ React.createElement("div", { className: "pg-up-t" }, s.nome), /* @__PURE__ */ React.createElement("div", { className: "pg-up-m" }, subCatMeta(subCat(s)).nome, " \xB7 ", cicloLabel(s.ciclo))), /* @__PURE__ */ React.createElement("div", { className: "pg-up-v" }, BM.eur(s.valor)))))));
}
const recTipo = (r) => r && r.tipo === "despesa" ? "despesa" : "subscricao";
const recCatMeta = (r) => {
  if (recTipo(r) === "despesa") {
    const c = BM.cats[r.categoria];
    return c ? { nome: c.nome, color: c.color } : { nome: "Outros", color: "var(--c-outros)" };
  }
  return subCatMeta(subCat(r));
};
const SUBCAT_PARA_DESPESA = { entretenimento: "lazer", musica: "lazer", jogos: "lazer", cloud: "internet", produtividade: "outros", educacao: "educacao", compras: "outros", outros: "outros" };
const recCatDespesa = (r) => recTipo(r) === "despesa" ? BM.cats[r.categoria] ? r.categoria : "outros" : SUBCAT_PARA_DESPESA[subCat(r)] || "outros";
async function pagarRecorrente(prem, fin, id, mesRef) {
  const s = prem.get();
  const r = (s.recorrentes || []).find((x) => x.id === id);
  if (!r) return;
  const mes = mesRef || BM.todayISO().slice(0, 7);
  const cur = s.pagosRec || {};
  const ms = { ...cur[id] || {} };
  if (ms[mes]) return;
  const diaN = Math.min(28, Math.max(1, +r.dia || 1));
  let despesaId = null;
  try {
    const d = await fin.despesa.add({ nome: r.nome || "Recorrente", valor: +r.valor || 0, data: mes + "-" + String(diaN).padStart(2, "0"), cat: recCatDespesa(r), tipo: "fixa" });
    despesaId = d && d.id ? d.id : null;
  } catch (e) {
  }
  ms[mes] = despesaId ? { despesaId } : true;
  prem.update({ pagosRec: { ...cur, [id]: ms } });
}
async function desmarcarRecorrente(prem, fin, id, mesRef) {
  const s = prem.get();
  const mes = mesRef || BM.todayISO().slice(0, 7);
  const cur = s.pagosRec || {};
  const marca = cur[id] && cur[id][mes];
  if (!marca) return;
  if (marca && marca.despesaId) {
    try {
      await fin.despesa.remove(marca.despesaId);
    } catch (e) {
    }
  }
  const ms = { ...cur[id] || {} };
  delete ms[mes];
  prem.update({ pagosRec: { ...cur, [id]: ms } });
}
function SubModal({ mesAtual, sub, onClose, onSave }) {
  const editing = !!sub;
  const [base, setBase] = React.useState(editing ? { nome: sub.nome } : null);
  const [f, setF] = React.useState(editing ? { tipo: recTipo(sub), nome: sub.nome || "", valor: String(sub.valor).replace(".", ","), dia: sub.dia || 1, icon: sub.icon || "tv", color: sub.color || "var(--accent)", ciclo: sub.ciclo || "mensal", categoria: recTipo(sub) === "despesa" ? BM.cats[sub.categoria] ? sub.categoria : "outros" : subCat(sub), metodo: sub.metodo || "", estado: sub.estado || "ativa" } : { tipo: "subscricao", nome: "", valor: "", dia: 1, icon: "tv", color: "var(--accent)", ciclo: "mensal", categoria: "outros", metodo: "", estado: "ativa" });
  const [err, setErr] = React.useState("");
  const escolher = (c) => {
    setBase(c);
    setF({ tipo: "subscricao", nome: c.nome, valor: String(c.valor).replace(".", ","), dia: 1, icon: c.icon, color: c.color, ciclo: "mensal", categoria: ICON_CAT[c.icon] || "outros", metodo: "", estado: "ativa" });
    setErr("");
  };
  const outra = () => {
    setBase({ nome: "" });
    setF({ tipo: "subscricao", nome: "", valor: "", dia: 1, icon: "spark", color: "var(--accent)", ciclo: "mensal", categoria: "outros", metodo: "", estado: "ativa" });
    setErr("");
  };
  const novaDespesa = () => {
    setBase({ nome: "" });
    setF({ tipo: "despesa", nome: "", valor: "", dia: 1, icon: "home", color: "var(--c-habitacao)", ciclo: "mensal", categoria: "habitacao", metodo: "", estado: "ativa" });
    setErr("");
  };
  const upd = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const mudarTipo = (e) => {
    const t = e.target.value;
    setF((s) => ({ ...s, tipo: t, categoria: t === "despesa" ? BM.cats[s.categoria] ? s.categoria : "habitacao" : SUB_CATS[s.categoria] ? s.categoria : "outros", icon: t === "despesa" ? BM.cats.habitacao ? "home" : s.icon : s.icon }));
  };
  const guardar = () => {
    if (!f.nome.trim()) return setErr(f.tipo === "despesa" ? "D\xE1 um nome \xE0 despesa." : "D\xE1 um nome \xE0 subscri\xE7\xE3o.");
    if (numOf(f.valor) <= 0) return setErr("Indica um valor v\xE1lido.");
    const iconFinal = f.tipo === "despesa" ? (BM.cats[f.categoria] || {}).icon || "sync" : f.icon;
    const colorFinal = f.tipo === "despesa" ? (BM.cats[f.categoria] || {}).color || "var(--accent)" : f.color;
    onSave({ tipo: f.tipo, nome: f.nome.trim(), valor: numOf(f.valor), dia: Math.min(28, Math.max(1, +f.dia || 1)), icon: iconFinal, color: colorFinal, ciclo: f.ciclo, categoria: f.categoria, metodo: f.metodo.trim(), estado: f.estado, desde: editing ? sub.desde : mesAtual });
  };
  if (base === null) {
    return /* @__PURE__ */ React.createElement(
      Modal,
      {
        title: "Adicionar recorrente",
        sub: "Escolhe um ponto de partida \u2014 ajustas tudo a seguir.",
        icon: "sync",
        onClose,
        wide: true,
        footer: /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: onClose }, "Cancelar")
      },
      /* @__PURE__ */ React.createElement("p", { className: "muted", style: { fontSize: 13, marginBottom: 14, lineHeight: 1.5 } }, "Escolhe um servi\xE7o (ajustas o valor a seguir), cria um \xE0 medida, ou regista uma despesa peri\xF3dica (renda, \xE1gua, seguro\u2026)."),
      /* @__PURE__ */ React.createElement("div", { className: "sub-grid" }, SUB_CATALOGO.map((c) => /* @__PURE__ */ React.createElement("button", { key: c.nome, className: "sub-pick", onClick: () => escolher(c) }, /* @__PURE__ */ React.createElement("span", { className: "sub-pick-ico", style: { background: `color-mix(in srgb, ${c.color} 16%, transparent)` } }, /* @__PURE__ */ React.createElement(Icon, { name: c.icon, size: 18, color: c.color })), /* @__PURE__ */ React.createElement("span", { className: "sub-pick-n" }, c.nome))), /* @__PURE__ */ React.createElement("button", { className: "sub-pick", onClick: outra }, /* @__PURE__ */ React.createElement("span", { className: "sub-pick-ico", style: { background: "var(--surface-2)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 18, color: "var(--ink-2)" })), /* @__PURE__ */ React.createElement("span", { className: "sub-pick-n" }, "Outra\u2026")), /* @__PURE__ */ React.createElement("button", { className: "sub-pick", onClick: novaDespesa }, /* @__PURE__ */ React.createElement("span", { className: "sub-pick-ico", style: { background: "color-mix(in srgb, var(--accent) 14%, transparent)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "home", size: 18, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("span", { className: "sub-pick-n" }, "Despesa (renda, \xE1gua\u2026)")))
    );
  }
  const catOpts = f.tipo === "despesa" ? Object.keys(BM.cats).map((k) => ({ k, nome: BM.cats[k].nome })) : Object.keys(SUB_CATS).map((k) => ({ k, nome: SUB_CATS[k].nome }));
  return /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: editing ? f.tipo === "despesa" ? "Editar despesa recorrente" : "Editar subscri\xE7\xE3o" : base.nome || (f.tipo === "despesa" ? "Nova despesa recorrente" : "Nova subscri\xE7\xE3o"),
      sub: f.tipo === "despesa" ? "Um pagamento que se repete todos os meses." : "Um servi\xE7o cobrado periodicamente.",
      icon: "sync",
      onClose,
      wide: true,
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => editing ? onClose() : setBase(null) }, editing ? "Cancelar" : "Voltar"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: guardar }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 14, color: "#fff" }), " ", editing ? "Guardar" : "Adicionar"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "modal-row-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Tipo" }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.tipo, onChange: mudarTipo }, /* @__PURE__ */ React.createElement("option", { value: "subscricao" }, "Subscri\xE7\xE3o (servi\xE7o)"), /* @__PURE__ */ React.createElement("option", { value: "despesa" }, "Despesa peri\xF3dica"))), /* @__PURE__ */ React.createElement(Field, { label: "Nome" }, /* @__PURE__ */ React.createElement("input", { className: "input", value: f.nome, onChange: upd("nome"), placeholder: f.tipo === "despesa" ? "Ex: Renda" : "Ex: Netflix" }))),
    /* @__PURE__ */ React.createElement("div", { className: "modal-row-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Valor", hint: f.tipo === "despesa" ? "Podes ajustar em cada m\xEAs." : "Ajusta ao teu plano.", icon: "coins" }, /* @__PURE__ */ React.createElement("input", { className: "input", inputMode: "decimal", value: f.valor, onChange: upd("valor"), placeholder: "0,00" })), /* @__PURE__ */ React.createElement(Field, { label: "Ciclo de cobran\xE7a" }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.ciclo, onChange: upd("ciclo") }, /* @__PURE__ */ React.createElement("option", { value: "mensal" }, "Mensal"), /* @__PURE__ */ React.createElement("option", { value: "anual" }, "Anual"), /* @__PURE__ */ React.createElement("option", { value: "semanal" }, "Semanal")))),
    /* @__PURE__ */ React.createElement("div", { className: "modal-row-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Categoria" }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.categoria, onChange: upd("categoria") }, catOpts.map((o) => /* @__PURE__ */ React.createElement("option", { key: o.k, value: o.k }, o.nome)))), /* @__PURE__ */ React.createElement(Field, { label: f.tipo === "despesa" ? "Dia de pagamento" : "Dia de renova\xE7\xE3o" }, /* @__PURE__ */ React.createElement("input", { className: "input", type: "number", min: "1", max: "28", value: f.dia, onChange: upd("dia") }))),
    /* @__PURE__ */ React.createElement("div", { className: "modal-row-2" }, /* @__PURE__ */ React.createElement(Field, { label: "M\xE9todo de pagamento", hint: "opcional" }, /* @__PURE__ */ React.createElement("input", { className: "input", value: f.metodo, onChange: upd("metodo"), placeholder: "Ex: Visa \u2022\u2022 42" })), /* @__PURE__ */ React.createElement(Field, { label: "Estado" }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.estado, onChange: upd("estado") }, /* @__PURE__ */ React.createElement("option", { value: "ativa" }, "Ativa"), f.tipo !== "despesa" && /* @__PURE__ */ React.createElement("option", { value: "trial" }, "Trial (per\xEDodo gratuito)"), /* @__PURE__ */ React.createElement("option", { value: "pausada" }, "Pausada"), /* @__PURE__ */ React.createElement("option", { value: "cancelada" }, "Cancelada")))),
    err && /* @__PURE__ */ React.createElement("div", { className: "alert bad", style: { padding: "9px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16, color: "var(--neg)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, err))
  );
}
function Subscricoes() {
  return /* @__PURE__ */ React.createElement(PremiumGate, null, /* @__PURE__ */ React.createElement(SubscricoesInner, null));
}
function SubSkeleton() {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "ph-kpis sub-kpis" }, [0, 1, 2, 3, 4].map((i) => /* @__PURE__ */ React.createElement("div", { className: "pg-kpi sk", key: i }, /* @__PURE__ */ React.createElement("div", { className: "sk-box", style: { width: 34, height: 34, borderRadius: 10 } }), /* @__PURE__ */ React.createElement("div", { className: "sk-line", style: { width: "60%", height: 20, marginTop: 12 } }), /* @__PURE__ */ React.createElement("div", { className: "sk-line", style: { width: "80%", height: 11, marginTop: 8 } })))), /* @__PURE__ */ React.createElement("div", { className: "ph-layout" }, /* @__PURE__ */ React.createElement("div", { className: "ph-main" }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16 } }, [0, 1, 2, 3, 4].map((i) => /* @__PURE__ */ React.createElement("div", { className: "sk-row", key: i }, /* @__PURE__ */ React.createElement("div", { className: "sk-box", style: { width: 30, height: 30, borderRadius: 9 } }), /* @__PURE__ */ React.createElement("div", { className: "sk-line", style: { flex: 1, height: 13 } }), /* @__PURE__ */ React.createElement("div", { className: "sk-line", style: { width: 60, height: 13 } }))))), /* @__PURE__ */ React.createElement("div", { className: "ph-aside" }, /* @__PURE__ */ React.createElement("div", { className: "card card-pad", style: { display: "grid", placeItems: "center", minHeight: 200 } }, /* @__PURE__ */ React.createElement("div", { className: "sk-box", style: { width: 160, height: 160, borderRadius: "50%" } })))));
}
function SubscricoesInner() {
  const fin = useFinance();
  const prem = usePremium();
  const mes = fin.month;
  const todas = prem.get().recorrentes || [];
  const pagos = prem.get().pagosRec || {};
  const [modal, setModal] = React.useState(false);
  const [editId, setEditId] = React.useState(null);
  const [menuId, setMenuId] = React.useState(null);
  const [menuPos, setMenuPos] = React.useState({ top: 0, right: 0 });
  const [q, setQ] = React.useState("");
  const [filtro, setFiltro] = React.useState("todas");
  const [ordem, setOrdem] = React.useState("nome");
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [aPagar, setAPagar] = React.useState(null);
  const [delRecId, setDelRecId] = React.useState(null);
  const pageSize = 6;
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 340);
    return () => clearTimeout(t);
  }, []);
  React.useEffect(() => {
    if (!menuId) return;
    const h = () => setMenuId(null);
    document.addEventListener("click", h);
    window.addEventListener("scroll", h, true);
    window.addEventListener("resize", h);
    return () => {
      document.removeEventListener("click", h);
      window.removeEventListener("scroll", h, true);
      window.removeEventListener("resize", h);
    };
  }, [menuId]);
  React.useEffect(() => {
    setPage(1);
  }, [q, filtro, ordem]);
  const isPago = (id) => !!(pagos[id] && pagos[id][mes]);
  const togglePago = async (id) => {
    if (aPagar) return;
    setAPagar(id);
    try {
      if (isPago(id)) await desmarcarRecorrente(prem, fin, id, mes);
      else await pagarRecorrente(prem, fin, id, mes);
    } finally {
      setAPagar(null);
    }
  };
  const apagar = (id) => {
    const cur = prem.get().pagosRec || {};
    if (cur[id]) {
      const c2 = { ...cur };
      delete c2[id];
      prem.update({ pagosRec: c2 });
    }
    prem.remove("recorrentes", id);
  };
  const setEstado = (id, estado) => prem.edit("recorrentes", id, { estado });
  const faturaveis = todas.filter((s) => subEstado(s) === "ativa");
  const totalMes = faturaveis.reduce((a, s) => a + mensalDe(s), 0);
  const nAtivas = faturaveis.length;
  const pagoMes = todas.filter((s) => isPago(s.id)).reduce((a, s) => a + (+s.valor || 0), 0);
  const nPagas = todas.filter((s) => isPago(s.id)).length;
  const faltaMes = Math.max(0, faturaveis.filter((s) => !isPago(s.id)).reduce((a, s) => a + mensalDe(s), 0));
  const prox30 = todas.filter((s) => {
    const st = subEstado(s);
    if (st === "cancelada" || st === "pausada") return false;
    return !isPago(s.id) && diasAte(proxRenovDate(s)) >= 0 && diasAte(proxRenovDate(s)) <= 30;
  });
  const porCat = {};
  faturaveis.forEach((s) => {
    const m = recCatMeta(s);
    if (!porCat[m.nome]) porCat[m.nome] = { nome: m.nome, color: m.color, valor: 0 };
    porCat[m.nome].valor += mensalDe(s);
  });
  const donutData = Object.keys(porCat).map((k) => ({ key: k, nome: porCat[k].nome, color: porCat[k].color, valor: porCat[k].valor })).sort((a, b) => b.valor - a.valor);
  const renovacoes = todas.filter((s) => (subEstado(s) === "ativa" || subEstado(s) === "trial") && !isPago(s.id)).map((s) => ({ s, d: proxRenovDate(s), dias: diasAte(proxRenovDate(s)) })).sort((a, b) => a.d - b.d).slice(0, 5);
  const soSubs = faturaveis.filter((s) => recTipo(s) === "subscricao");
  const porCatSub = {};
  soSubs.forEach((s) => {
    const c = subCat(s);
    (porCatSub[c] = porCatSub[c] || []).push(s);
  });
  const sugestoes = [];
  Object.keys(porCatSub).forEach((c) => {
    const doCat = porCatSub[c];
    if (doCat.length > 1) {
      const menor = Math.min.apply(null, doCat.map((s) => mensalDe(s)));
      sugestoes.push({ cat: c, n: doCat.length, poupanca: menor, nomes: doCat.map((s) => s.nome) });
    }
  });
  let lista = todas.slice();
  if (q.trim()) {
    const k = q.trim().toLowerCase();
    lista = lista.filter((s) => (s.nome || "").toLowerCase().includes(k) || recCatMeta(s).nome.toLowerCase().includes(k));
  }
  if (filtro !== "todas") lista = lista.filter((s) => subEstado(s) === filtro);
  lista.sort((a, b) => ordem === "valor" ? mensalDe(b) - mensalDe(a) : ordem === "renov" ? proxRenovDate(a) - proxRenovDate(b) : (a.nome || "").localeCompare(b.nome || ""));
  const totalPags = Math.max(1, Math.ceil(lista.length / pageSize));
  const pag = Math.min(page, totalPags);
  const visiveis = lista.slice((pag - 1) * pageSize, pag * pageSize);
  const abrirNova = () => {
    setEditId(null);
    setModal(true);
  };
  const abrirEdit = (id) => {
    setEditId(id);
    setModal(true);
  };
  const subEdit = editId ? todas.find((s) => s.id === editId) : null;
  const dataCurta = (d) => d.getDate() + " " + BM.MESES[d.getMonth()].slice(0, 3).toLowerCase();
  if (!loading && todas.length === 0) {
    return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement(PremActions, { label: "Adicionar recorrente", onAdd: abrirNova }), /* @__PURE__ */ React.createElement(
      EmptyState,
      {
        icon: "sync",
        title: "Ainda sem recorrentes",
        msg: "Junta aqui subscri\xE7\xF5es (Netflix, Spotify\u2026) e despesas peri\xF3dicas (renda, \xE1gua, seguros). Marca cada m\xEAs como pago \u2014 s\xF3 a\xED o valor entra nas tuas despesas.",
        action: /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: abrirNova }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 16, color: "#fff" }), " Adicionar recorrente")
      }
    ), modal && /* @__PURE__ */ React.createElement(SubModal, { mesAtual: mes, sub: null, onClose: () => setModal(false), onSave: (it) => {
      prem.add("recorrentes", it);
      setModal(false);
    } }));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement(PremActions, { label: "Adicionar recorrente", onAdd: abrirNova }), loading ? /* @__PURE__ */ React.createElement(SubSkeleton, null) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "ph-kpis sub-kpis" }, /* @__PURE__ */ React.createElement("div", { className: "pg-kpi" }, /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-ic", style: { background: "color-mix(in srgb, var(--accent) 14%, transparent)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "wallet", size: 17, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-v tnum" }, BM.eur(totalMes)), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-l" }, "Previsto este m\xEAs")), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi" }, /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-ic", style: { background: "color-mix(in srgb, var(--pos) 15%, transparent)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 17, color: "var(--pos)" })), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-v tnum" }, BM.eur(pagoMes)), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-l" }, "Pago este m\xEAs (", nPagas, ")")), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi" }, /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-ic", style: { background: "color-mix(in srgb, #f0913a 16%, transparent)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "history", size: 17, color: "#f0913a" })), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-v tnum" }, BM.eur(faltaMes)), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-l" }, "Falta pagar")), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi" }, /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-ic", style: { background: "color-mix(in srgb, #6366f1 15%, transparent)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "sync", size: 17, color: "#6366f1" })), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-v tnum" }, nAtivas), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-l" }, "Recorrentes ativas")), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi" }, /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-ic", style: { background: "color-mix(in srgb, #a855f7 15%, transparent)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "spark", size: 17, color: "#a855f7" })), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-v tnum" }, prox30.length), /* @__PURE__ */ React.createElement("div", { className: "pg-kpi-l" }, "Pagamentos (30 dias)"))), /* @__PURE__ */ React.createElement("div", { className: "ph-layout" }, /* @__PURE__ */ React.createElement("div", { className: "ph-main" }, /* @__PURE__ */ React.createElement("div", { className: "ph-toolbar sub-tools" }, /* @__PURE__ */ React.createElement("div", { className: "ph-search" }, /* @__PURE__ */ React.createElement(Icon, { name: "search", size: 15, color: "var(--ink-3)" }), /* @__PURE__ */ React.createElement("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Pesquisar subscri\xE7\xE3o\u2026" }))), /* @__PURE__ */ React.createElement("div", { className: "card sub-tablewrap" }, visiveis.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600, padding: 28, textAlign: "center" } }, "Nenhuma recorrente corresponde aos filtros.") : /* @__PURE__ */ React.createElement("table", { className: "sub-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Nome"), /* @__PURE__ */ React.createElement("th", null, "Categoria"), /* @__PURE__ */ React.createElement("th", null, "Valor"), /* @__PURE__ */ React.createElement("th", null, "Ciclo"), /* @__PURE__ */ React.createElement("th", null, "Pr\xF3ximo pagamento"), /* @__PURE__ */ React.createElement("th", { className: "sub-col-m" }, "M\xE9todo"), /* @__PURE__ */ React.createElement("th", null, "Estado"), /* @__PURE__ */ React.createElement("th", { className: "sub-col-act", "aria-label": "A\xE7\xF5es" }))), /* @__PURE__ */ React.createElement("tbody", null, visiveis.map((s) => {
    const cor = s.color || "var(--accent)";
    const d = proxRenovDate(s);
    const dd = diasAte(d);
    const meta = recCatMeta(s);
    const pago = isPago(s.id);
    return /* @__PURE__ */ React.createElement("tr", { key: s.id, className: subEstado(s) === "cancelada" ? "is-off" : "" }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { className: "sub-serv" }, /* @__PURE__ */ React.createElement("span", { className: "prem-rico sm", style: { background: "color-mix(in srgb, " + cor + " 14%, transparent)" } }, /* @__PURE__ */ React.createElement(Icon, { name: s.icon || (recTipo(s) === "despesa" ? "sync" : "tv"), size: 16, color: cor })), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", null, s.nome), /* @__PURE__ */ React.createElement("span", { className: "rec-tipo" }, recTipo(s) === "despesa" ? "Despesa" : "Subscri\xE7\xE3o")))), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: "sub-cat-tag", style: { "--cc": meta.color } }, meta.nome)), /* @__PURE__ */ React.createElement("td", { className: "tnum", style: { fontWeight: 800 } }, BM.eur(s.valor)), /* @__PURE__ */ React.createElement("td", { className: "muted" }, cicloLabel(s.ciclo)), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { className: "sub-renov" }, pago ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("b", { style: { color: "var(--pos)" } }, "Pago \u2713"), /* @__PURE__ */ React.createElement("span", { className: "muted tiny" }, "este m\xEAs")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("b", null, dataCurta(d)), /* @__PURE__ */ React.createElement("span", { className: "muted tiny" }, dd === 0 ? "hoje" : dd === 1 ? "amanh\xE3" : "em " + dd + " dias")))), /* @__PURE__ */ React.createElement("td", { className: "muted sub-col-m" }, s.metodo || "\u2014"), /* @__PURE__ */ React.createElement("td", null, subEstadoPill(s)), /* @__PURE__ */ React.createElement("td", { className: "sub-col-act" }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", title: "A\xE7\xF5es", onClick: (e) => {
      e.stopPropagation();
      if (menuId === s.id) {
        setMenuId(null);
        return;
      }
      const r = e.currentTarget.getBoundingClientRect();
      setMenuPos({ top: Math.round(r.bottom + 6), right: Math.round(window.innerWidth - r.right) });
      setMenuId(s.id);
    } }, /* @__PURE__ */ React.createElement(Icon, { name: "dots", size: 18, color: "var(--ink-2)" })), menuId === s.id && ReactDOM.createPortal(
      /* @__PURE__ */ React.createElement("div", { className: "ph-menu sub-menu-pop", style: { position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 400 }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("button", { disabled: aPagar === s.id, onClick: () => {
        togglePago(s.id);
        setMenuId(null);
      } }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 15, color: "var(--ink-2)" }), " ", pago ? "Anular pagamento (m\xEAs)" : "Marcar pago (m\xEAs)"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
        abrirEdit(s.id);
        setMenuId(null);
      } }, /* @__PURE__ */ React.createElement(Icon, { name: "edit", size: 15, color: "var(--ink-2)" }), " Editar"), subEstado(s) === "pausada" ? /* @__PURE__ */ React.createElement("button", { onClick: () => {
        setEstado(s.id, "ativa");
        setMenuId(null);
      } }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 15, color: "var(--ink-2)" }), " Retomar") : /* @__PURE__ */ React.createElement("button", { onClick: () => {
        setEstado(s.id, "pausada");
        setMenuId(null);
      } }, /* @__PURE__ */ React.createElement(Icon, { name: "history", size: 15, color: "var(--ink-2)" }), " Pausar"), subEstado(s) === "cancelada" ? /* @__PURE__ */ React.createElement("button", { onClick: () => {
        setEstado(s.id, "ativa");
        setMenuId(null);
      } }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 15, color: "var(--ink-2)" }), " Reativar") : /* @__PURE__ */ React.createElement("button", { onClick: () => {
        setEstado(s.id, "cancelada");
        setMenuId(null);
      } }, /* @__PURE__ */ React.createElement(Icon, { name: "x", size: 15, color: "var(--ink-2)" }), " Cancelar"), /* @__PURE__ */ React.createElement("button", { className: "danger", onClick: () => {
        setDelRecId(s.id);
        setMenuId(null);
      } }, /* @__PURE__ */ React.createElement(Icon, { name: "trash", size: 15, color: "var(--neg)" }), " Eliminar")),
      document.body
    )));
  })))), totalPags > 1 && /* @__PURE__ */ React.createElement("div", { className: "sub-pag" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-soft", disabled: pag <= 1, onClick: () => setPage(pag - 1) }, "Anterior"), /* @__PURE__ */ React.createElement("span", { className: "muted tiny", style: { fontWeight: 700 } }, "P\xE1gina ", pag, " de ", totalPags, " \xB7 ", lista.length, " recorrente", lista.length === 1 ? "" : "s"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-soft", disabled: pag >= totalPags, onClick: () => setPage(pag + 1) }, "Seguinte")), /* @__PURE__ */ React.createElement("div", { className: "sub-cal-block" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t", style: { marginBottom: 4 } }, "Calend\xE1rio de pagamentos"), /* @__PURE__ */ React.createElement("div", { className: "sub-sec-sub" }, "Todas as datas de pagamento do m\xEAs, num relance."), /* @__PURE__ */ React.createElement("div", { className: "sub-cal" }, /* @__PURE__ */ React.createElement(SubCalendario, { subs: todas })))), /* @__PURE__ */ React.createElement("div", { className: "ph-aside" }, /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Gastos por categoria"), /* @__PURE__ */ React.createElement("div", { className: "sub-sec-sub" }, "Distribui\xE7\xE3o do custo mensal por categoria."), donutData.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600, marginTop: 4 } }, "Sem gastos ativos.") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", placeItems: "center", padding: "6px 0 10px" } }, /* @__PURE__ */ React.createElement(DonutChart, { data: donutData, size: 168, thickness: 20, center: /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { className: "tnum", style: { fontSize: 18, fontWeight: 800 } }, BM.eur(totalMes)), /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600 } }, "por m\xEAs")) })), donutData.map((d) => /* @__PURE__ */ React.createElement("div", { className: "sub-leg", key: d.key }, /* @__PURE__ */ React.createElement("span", { className: "sub-leg-dot", style: { background: d.color } }), /* @__PURE__ */ React.createElement("span", { className: "sub-leg-n" }, d.nome), /* @__PURE__ */ React.createElement("span", { className: "tnum sub-leg-v" }, BM.eur(d.valor)))))), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Pr\xF3ximos pagamentos"), /* @__PURE__ */ React.createElement("div", { className: "sub-sec-sub" }, "O que ainda falta pagar, por ordem cronol\xF3gica."), renovacoes.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600, marginTop: 4 } }, "Sem renova\xE7\xF5es pr\xF3ximas.") : renovacoes.map(({ s, d, dias }) => {
    const cor = s.color || "var(--accent)";
    return /* @__PURE__ */ React.createElement("div", { className: "sub-up", key: s.id }, /* @__PURE__ */ React.createElement("span", { className: "prem-rico sm", style: { background: "color-mix(in srgb, " + cor + " 14%, transparent)" } }, /* @__PURE__ */ React.createElement(Icon, { name: s.icon || "tv", size: 15, color: cor })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { style: { fontSize: 13.5 } }, s.nome), /* @__PURE__ */ React.createElement("div", { className: "muted tiny" }, dias === 0 ? "Vence hoje" : dias === 1 ? "Vence amanh\xE3" : dataCurta(d) + " \xB7 em " + dias + " dias")), /* @__PURE__ */ React.createElement("b", { className: "tnum", style: { fontSize: 13.5 } }, BM.eur(s.valor)));
  })), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "prem-sec-t" }, "Sugest\xF5es de poupan\xE7a"), /* @__PURE__ */ React.createElement("div", { className: "sub-sec-sub" }, "Servi\xE7os semelhantes ou duplicados que podes rever."), sugestoes.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600, marginTop: 4, lineHeight: 1.5 } }, "Nada a assinalar \u2014 sem servi\xE7os duplicados. \u{1F44C}") : sugestoes.map((x) => /* @__PURE__ */ React.createElement("div", { className: "sub-sugg", key: x.cat }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 15, color: "var(--accent)" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700 } }, "Tens ", x.n, " servi\xE7os de ", subCatMeta(x.cat).nome, "."), /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { marginTop: 2, lineHeight: 1.45 } }, x.nomes.join(", "), " \xB7 poupa ~", BM.eur(x.poupanca), "/m\xEAs")))))))), modal && /* @__PURE__ */ React.createElement(SubModal, { mesAtual: mes, sub: subEdit, onClose: () => {
    setModal(false);
    setEditId(null);
  }, onSave: (it) => {
    if (editId) prem.edit("recorrentes", editId, it);
    else prem.add("recorrentes", it);
    setModal(false);
    setEditId(null);
  } }), delRecId && /* @__PURE__ */ React.createElement(RLConfirmPin, { title: "Eliminar recorrente", desc: "Vais eliminar esta recorrente e as suas marcas de pagamento. As despesas j\xE1 criadas nos meses pagos mant\xEAm-se no hist\xF3rico. Esta a\xE7\xE3o n\xE3o pode ser revertida.", onConfirm: () => apagar(delRecId), onClose: () => setDelRecId(null) }));
}
function scanAlertas(prem) {
  const s = prem.get();
  const aviso = s.notif && typeof s.notif.aviso === "number" ? s.notif.aviso : 3;
  const out = [];
  (s.lembretes || []).filter((l) => !l.pago).forEach((l) => {
    const d = daysUntil(l.data);
    if (d <= aviso) out.push({ chave: "lem:" + l.id, tipo: "lembrete", id: l.id, titulo: l.titulo, valor: l.valor, d });
  });
  const mes = BM.todayISO().slice(0, 7);
  const pagosR = s.pagosRec || {};
  (s.recorrentes || []).forEach((r) => {
    const st = subEstado(r);
    if (st === "pausada" || st === "cancelada" || st === "trial") return;
    if (r.desde && r.desde > mes) return;
    if (pagosR[r.id] && pagosR[r.id][mes]) return;
    const alvo = mes + "-" + String(Math.min(28, r.dia || 1)).padStart(2, "0");
    const d = daysUntil(alvo);
    if (d <= aviso) out.push({ chave: "rec:" + r.id + ":" + mes, tipo: recTipo(r), id: r.id, titulo: r.nome || r.titulo, valor: r.valor, d });
  });
  return out.sort((a, b) => a.d - b.d);
}
function resolverAlerta(prem, a, fin) {
  if (a.tipo === "lembrete") {
    const l = (prem.get().lembretes || []).find((x) => x.id === a.id);
    if (l && l.repete) {
      const dt = /* @__PURE__ */ new Date(l.data + "T00:00:00");
      dt.setMonth(dt.getMonth() + 1);
      prem.edit("lembretes", a.id, { data: dt.toISOString().slice(0, 10) });
    } else prem.edit("lembretes", a.id, { pago: true });
    return;
  }
  return pagarRecorrente(prem, fin, a.id);
}
function diasDesde(iso) {
  if (!iso) return 0;
  const h = /* @__PURE__ */ new Date();
  const hj = new Date(h.getFullYear(), h.getMonth(), h.getDate());
  const p = String(iso).slice(0, 10).split("-").map(Number);
  const d = new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
  return Math.round((hj - d) / 864e5);
}
function isoWeekKey(d) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const anoInicio = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((dt - anoInicio) / 864e5 + 1) / 7);
  return dt.getUTCFullYear() + "-W" + String(semana).padStart(2, "0");
}
function gerarNotificacoes(prem, dados, account) {
  const s = prem.get();
  const d0 = dados || {};
  const out = [];
  const mes = BM.todayISO().slice(0, 7);
  scanAlertas(prem).forEach((a) => {
    out.push({
      chave: a.chave,
      cat: "pagamento",
      sev: a.d <= 0 ? "urgent" : "warn",
      icon: a.tipo === "subscricao" ? "tv" : a.tipo === "despesa" ? "sync" : "bell",
      titulo: (a.tipo === "despesa" ? "Despesa por pagar: " : a.tipo === "subscricao" ? "Subscri\xE7\xE3o por pagar: " : "") + a.titulo,
      texto: quandoTxt(a.d),
      valor: a.valor,
      d: a.d,
      tipo: a.tipo,
      id: a.id,
      acao: "pagar"
    });
  });
  (s.recorrentes || []).filter((x) => (x.estado || "ativa") === "trial").forEach((x) => {
    const dias = daysUntil(mes + "-" + String(Math.min(28, x.dia || 1)).padStart(2, "0"));
    if (dias <= 5) out.push({
      chave: "trial:" + x.id + ":" + mes,
      cat: "trial",
      sev: dias <= 2 ? "urgent" : "warn",
      icon: "spark",
      titulo: x.nome + " \u2014 per\xEDodo gratuito a terminar",
      texto: (dias <= 0 ? "Termina hoje" : "Termina em " + dias + " dia" + (dias > 1 ? "s" : "")) + " \xB7 depois passa a " + BM.eur(x.valor) + "/m\xEAs",
      rota: "agenda"
    });
  });
  const orc = +d0.orcamento || 0;
  if (orc > 0) {
    const gasto = (d0.despesas || []).filter((e) => BM.monthKey(e.data) === mes).reduce((a, e) => a + (+e.valor || 0), 0);
    const pct = Math.round(gasto / orc * 100);
    if (gasto >= orc) out.push({ chave: "orc:over:" + mes, cat: "orcamento", sev: "urgent", icon: "wallet", titulo: "Or\xE7amento do m\xEAs ultrapassado", texto: "J\xE1 gastaste " + BM.eur(gasto) + " de " + BM.eur(orc) + " (" + pct + "%).", rota: "relatorios" });
    else if (gasto >= orc * 0.8) out.push({ chave: "orc:80:" + mes, cat: "orcamento", sev: "warn", icon: "wallet", titulo: "Perto do limite do or\xE7amento", texto: "J\xE1 usaste " + pct + "% (" + BM.eur(gasto) + " de " + BM.eur(orc) + ").", rota: "relatorios" });
  }
  const despesasMes = (d0.despesas || []).filter((e) => BM.monthKey(e.data) === mes);
  const rendimentosMes = (d0.rendimentos || []).filter((r) => BM.monthKey(r.data) === mes);
  const totalRecMes = rendimentosMes.reduce((a, r) => a + (+r.valor || 0), 0);
  const totalGastoMes = despesasMes.reduce((a, e) => a + (+e.valor || 0), 0);
  const saldoMes = totalRecMes - totalGastoMes;
  const taxaPoupMes = totalRecMes > 0 ? Math.round(saldoMes / totalRecMes * 100) : 0;
  if (saldoMes >= 0 && taxaPoupMes >= 10) {
    out.push({ chave: "poupanca:" + mes, cat: "poupanca", sev: "info", icon: "target", titulo: "Est\xE1s a poupar " + taxaPoupMes + "% do que recebes", texto: "Bom trabalho \u2014 continua assim!", rota: "relatorios" });
  }
  (d0.metas || []).forEach((m) => {
    if (m.fechada) return;
    const alvo = +m.alvo || 0, atual = +m.atual || 0;
    if (alvo <= 0) return;
    const pct = atual / alvo;
    if (atual >= alvo) out.push({ chave: "meta:done:" + m.id, cat: "meta", sev: "info", icon: "target", titulo: "Meta atingida: " + m.nome, texto: "Chegaste a " + BM.eur(atual) + " de " + BM.eur(alvo) + ". J\xE1 podes fechar esta meta.", rota: "objetivos" });
    else if (pct >= 0.5) out.push({ chave: "meta:half:" + m.id + ":" + mes, cat: "meta", sev: "info", icon: "target", titulo: "J\xE1 vais a meio: " + m.nome, texto: Math.round(pct * 100) + "% da meta (" + BM.eur(atual) + " de " + BM.eur(alvo) + ").", rota: "objetivos" });
  });
  const porCat = {};
  (s.recorrentes || []).filter((x) => recTipo(x) === "subscricao" && (x.estado || "ativa") === "ativa").forEach((x) => {
    const c = subCat(x);
    (porCat[c] = porCat[c] || []).push(x);
  });
  Object.keys(porCat).forEach((c) => {
    if (porCat[c].length > 1) {
      const menor = Math.min.apply(null, porCat[c].map((x) => mensalDe(x)));
      out.push({ chave: "dup:" + c, cat: "insight", sev: "info", icon: "spark", titulo: "Tens " + porCat[c].length + " servi\xE7os de " + subCatMeta(c).nome, texto: porCat[c].map((x) => x.nome).join(", ") + " \xB7 podes poupar ~" + BM.eur(menor) + "/m\xEAs.", rota: "agenda" });
    }
  });
  const datas = [].concat(d0.despesas || [], d0.rendimentos || []).map((m) => m.data).filter(Boolean).sort();
  if (datas.length) {
    const dias = diasDesde(datas[datas.length - 1]);
    let lim = 0;
    if (dias >= 30) lim = 30;
    else if (dias >= 7) lim = 7;
    else if (dias >= 3) lim = 3;
    if (lim) {
      const txt = lim === 30 ? "um m\xEAs" : lim === 7 ? "uma semana" : "3 dias";
      out.push({
        chave: "inativo:" + lim,
        cat: "inatividade",
        sev: lim >= 30 ? "warn" : "info",
        icon: "history",
        titulo: "H\xE1 mais de " + txt + " sem registos",
        texto: "O \xFAltimo movimento foi h\xE1 " + dias + " dias. Regista as tuas despesas recentes para manteres as contas em dia.",
        rota: "transacoes"
      });
    }
  }
  if (!account || account.resumoSemanal !== false) {
    const semanaKey = isoWeekKey(/* @__PURE__ */ new Date());
    const desde = /* @__PURE__ */ new Date();
    desde.setDate(desde.getDate() - 7);
    const desdeISO = desde.toISOString().slice(0, 10);
    const despSemana = (d0.despesas || []).filter((e) => (e.data || "") >= desdeISO);
    const recSemana = (d0.rendimentos || []).filter((r) => (r.data || "") >= desdeISO).reduce((a, r) => a + (+r.valor || 0), 0);
    const gastoSemana = despSemana.reduce((a, e) => a + (+e.valor || 0), 0);
    if (recSemana > 0 || gastoSemana > 0) {
      const porCatSemana = {};
      despSemana.forEach((e) => {
        porCatSemana[e.cat] = (porCatSemana[e.cat] || 0) + (+e.valor || 0);
      });
      const catTopoKey = Object.keys(porCatSemana).sort((a, b) => porCatSemana[b] - porCatSemana[a])[0];
      const catTopoNome = catTopoKey ? (BM.cats[catTopoKey] || BM.cats.outros).nome : null;
      const diff = recSemana - gastoSemana;
      const partes = ["Recebido " + BM.eur(recSemana), "gasto " + BM.eur(gastoSemana), (diff >= 0 ? "saldo +" : "saldo ") + BM.eur(diff)];
      if (catTopoNome) partes.push("mais gasto em " + catTopoNome);
      out.push({ chave: "resumo:" + semanaKey, cat: "resumo", sev: "info", icon: "report", titulo: "O seu resumo semanal", texto: partes.join(" \xB7 ") + ".", rota: "relatorios" });
    }
  }
  (s.grupos || []).forEach((g) => {
    const net = balancos(g);
    const meuSaldo = net["Eu"] || 0;
    if (meuSaldo < -0.01) {
      out.push({
        chave: "part:divida:" + g.id + ":" + mes,
        cat: "partilha",
        sev: "warn",
        icon: "users",
        titulo: "Tens d\xEDvidas no grupo " + g.nome,
        texto: "Deves " + BM.eur(-meuSaldo) + " \xE0s despesas partilhadas deste grupo.",
        rota: "partilha"
      });
    }
    (g.despesas || []).filter((e) => e.vencimento).forEach((e) => {
      const d = daysUntil(e.vencimento);
      if (d <= 3) {
        out.push({
          chave: "part:venc:" + g.id + ":" + e.id,
          cat: "partilha",
          sev: d <= 0 ? "urgent" : "warn",
          icon: "users",
          titulo: "Despesa do grupo " + g.nome + " por pagar",
          texto: e.titulo + " \xB7 " + quandoTxt(d),
          valor: e.valor,
          d,
          rota: "partilha"
        });
      }
    });
    const pendentes = (g.convites || []).filter((c) => c.estado === "pendente").length;
    if (pendentes > 0) {
      out.push({
        chave: "part:conv:" + g.id,
        cat: "partilha",
        sev: "info",
        icon: "users",
        titulo: pendentes + (pendentes === 1 ? " convite pendente" : " convites pendentes"),
        texto: "No grupo " + g.nome + ", ainda por aceitar.",
        rota: "partilha"
      });
    }
  });
  const ordSev = { urgent: 0, warn: 1, info: 2 };
  return out.sort((a, b) => ordSev[a.sev] - ordSev[b.sev] || (a.d == null ? 99 : a.d) - (b.d == null ? 99 : b.d));
}
function dispararNotificacoesNativas(prem, dados, account) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const s = prem.get();
  if (!(s.notif && s.notif.ativo)) return;
  const hoje = BM.todayISO();
  const log = s.notifLog || {};
  const jaHoje = new Set(log[hoje] || []);
  const novos = gerarNotificacoes(prem, dados || {}, account).filter((a) => !jaHoje.has(a.chave));
  if (!novos.length) return;
  const titulo = novos.length === 1 ? "Tens uma novidade" : "Tens " + novos.length + " novidades";
  const corpo = novos.slice(0, 3).map((a) => a.titulo).join("\n") + (novos.length > 3 ? "\n+ " + (novos.length - 3) + " mais" : "");
  try {
    new Notification("Rende+ \xB7 " + titulo, { body: corpo, icon: "/assets/img/files/icon-192.png", badge: "/assets/img/files/icon-192.png", tag: "rende-notifs", renotify: true });
  } catch (e) {
  }
  prem.update({ notifLog: { [hoje]: [...jaHoje, ...novos.map((a) => a.chave)] } });
}
const quandoTxt = (d) => d < 0 ? `h\xE1 ${Math.abs(d)} dia${d === -1 ? "" : "s"}` : d === 0 ? "vence hoje" : `vence em ${d} dia${d > 1 ? "s" : ""}`;
function NotifBell({ go }) {
  const prem = usePremium();
  const fin = useFinance();
  const dados = fin.data || {};
  const [open, setOpen] = React.useState(false);
  const [verTodas, setVerTodas] = React.useState(false);
  const [perm, setPerm] = React.useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  const s = prem.get();
  const cfg = s.notif || { ativo: true, aviso: 3 };
  const notifs = gerarNotificacoes(prem, dados, fin.account);
  const count = notifs.length;
  const LIMITE = 5;
  const notifsMostradas = verTodas ? notifs : notifs.slice(0, LIMITE);
  React.useEffect(() => {
    if (!open) setVerTodas(false);
  }, [open]);
  const irPara = (rota) => {
    setOpen(false);
    if (go) go(rota);
  };
  const nMov = (dados.despesas || []).length + (dados.rendimentos || []).length;
  React.useEffect(() => {
    if (!cfg.ativo) return;
    const tick = () => dispararNotificacoesNativas(prem, fin.data || {}, fin.account);
    tick();
    const iv = setInterval(tick, 1e3 * 60 * 30);
    return () => clearInterval(iv);
  }, [cfg.ativo, nMov]);
  const pedirPermissao = () => {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission().then((p) => {
      setPerm(p);
      if (p === "granted") dispararNotificacoesNativas(prem, fin.data || {});
    });
  };
  const setCfg = (patch) => prem.update({ notif: { ...cfg, ...patch } });
  return /* @__PURE__ */ React.createElement("div", { className: "notif-wrap" }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn notif-btn", title: "Notifica\xE7\xF5es", "aria-label": "Abrir notifica\xE7\xF5es", "aria-haspopup": "true", "aria-expanded": open, onClick: () => setOpen((v) => !v) }, /* @__PURE__ */ React.createElement(Icon, { name: "bell", size: 20 }), count > 0 && /* @__PURE__ */ React.createElement("span", { className: "notif-badge" }, count > 9 ? "9+" : count)), open && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "notif-pop-bg", onClick: () => setOpen(false) }), /* @__PURE__ */ React.createElement("div", { className: "notif-pop", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "notif-head" }, /* @__PURE__ */ React.createElement("span", { className: "notif-head-ico" }, /* @__PURE__ */ React.createElement(Icon, { name: "bell", size: 17, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("div", { className: "notif-head-txt" }, /* @__PURE__ */ React.createElement("div", { className: "notif-head-title" }, "Notifica\xE7\xF5es"), /* @__PURE__ */ React.createElement("div", { className: "notif-head-sub" }, count > 0 ? count + (count === 1 ? " por resolver" : " por resolver") : "Est\xE1s em dia"))), perm !== "granted" && perm !== "unsupported" && /* @__PURE__ */ React.createElement("div", { className: "notif-perm" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", { style: { fontSize: 13 } }, "Ativar avisos no dispositivo"), /* @__PURE__ */ React.createElement("span", { style: { display: "block", fontSize: 12, color: "var(--ink-3)", marginTop: 2 } }, perm === "denied" ? "Est\xE3o bloqueados \u2014 ativa-os nas defini\xE7\xF5es do navegador." : "Para receberes avisos mesmo fora desta p\xE1gina.")), perm === "default" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", style: { padding: "8px 12px", fontSize: 12.5 }, onClick: pedirPermissao }, "Ativar")), /* @__PURE__ */ React.createElement("div", { className: "notif-list" }, notifs.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "notif-empty" }, /* @__PURE__ */ React.createElement("span", { className: "li-ico", style: { width: 44, height: 44, background: "var(--accent-soft)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 20, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("span", null, "Est\xE1s em dia. Nada a tratar por agora.")) : notifsMostradas.map((a) => {
    const cor = a.sev === "urgent" ? "var(--neg)" : a.sev === "warn" ? "#e0792b" : "var(--accent)";
    return /* @__PURE__ */ React.createElement("div", { className: "notif-item sev-" + a.sev, key: a.chave }, /* @__PURE__ */ React.createElement("span", { className: "notif-item-ico", style: { background: "color-mix(in srgb, " + cor + " 14%, transparent)" } }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon || "bell", size: 16, color: cor })), /* @__PURE__ */ React.createElement("div", { className: "notif-item-txt" }, /* @__PURE__ */ React.createElement("b", null, a.titulo), /* @__PURE__ */ React.createElement("span", { className: "notif-item-sub" }, a.texto, a.valor != null ? " \xB7 " + BM.eur(a.valor) : "")), a.acao === "pagar" ? /* @__PURE__ */ React.createElement("button", { className: "btn btn-soft", style: { padding: "6px 11px", fontSize: 12, flex: "none" }, onClick: () => resolverAlerta(prem, a, fin) }, "Pagar") : a.rota && go ? /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", style: { padding: "6px 11px", fontSize: 12, flex: "none" }, onClick: () => irPara(a.rota) }, "Ver") : null);
  }), !verTodas && notifs.length > LIMITE && /* @__PURE__ */ React.createElement("button", { type: "button", className: "notif-ver-todas", onClick: () => setVerTodas(true) }, "Ver todas (", notifs.length, ")")), /* @__PURE__ */ React.createElement("div", { className: "notif-foot" }, /* @__PURE__ */ React.createElement("button", { className: "notif-switch" + (cfg.ativo ? " on" : ""), onClick: () => setCfg({ ativo: !cfg.ativo }), title: "Ligar/desligar avisos" }, /* @__PURE__ */ React.createElement("span", { className: "notif-switch-dot" })), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 600, flex: 1 } }, "Avisos ", cfg.ativo ? "ativos" : "desligados"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--ink-3)", fontWeight: 600 } }, "Avisar"), /* @__PURE__ */ React.createElement("select", { className: "select", style: { width: "auto", padding: "5px 8px", fontSize: 12.5 }, value: cfg.aviso, onChange: (e) => setCfg({ aviso: +e.target.value }) }, [1, 3, 5, 7].map((n) => /* @__PURE__ */ React.createElement("option", { key: n, value: n }, n, " dia", n > 1 ? "s" : "", " antes")))))));
}
const horaAtual = () => (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
function gerarInsights(fin, prem) {
  const out = [];
  const despesas = fin.data && fin.data.despesas || [];
  const seriesArr = fin.series || [];
  const mesAnterior = seriesArr.length >= 2 ? seriesArr[seriesArr.length - 2] : null;
  if (mesAnterior && fin.catBreak && fin.catBreak.length > 0) {
    const porCatAnterior = {};
    despesas.filter((d) => BM.monthKey(d.data) === mesAnterior.key).forEach((d) => {
      porCatAnterior[d.cat] = (porCatAnterior[d.cat] || 0) + (+d.valor || 0);
    });
    let maiorAumento = null;
    fin.catBreak.forEach((c) => {
      const anteriorValor = porCatAnterior[c.key] || 0;
      if (anteriorValor > 0 && c.valor >= 20 && c.valor > anteriorValor * 1.15) {
        const pct = Math.round((c.valor - anteriorValor) / anteriorValor * 100);
        if (!maiorAumento || pct > maiorAumento.pct) maiorAumento = { nome: c.nome, valor: c.valor, anteriorValor, pct };
      }
    });
    if (maiorAumento) {
      out.push({ icon: "wallet", estado: "atencao", titulo: "A categoria " + maiorAumento.nome + " aumentou", texto: "Subiu " + maiorAumento.pct + "% face ao m\xEAs anterior (" + BM.eur0(maiorAumento.anteriorValor) + " para " + BM.eur0(maiorAumento.valor) + ")." });
    }
  }
  if (mesAnterior) {
    const atual = seriesArr[seriesArr.length - 1];
    const saldoAtual = atual.rec - atual.gasto;
    const saldoAnterior = mesAnterior.rec - mesAnterior.gasto;
    if (atual.rec > 0 && saldoAnterior >= 0 && saldoAtual > saldoAnterior) {
      out.push({ icon: "target", estado: "positivo", titulo: "Est\xE1 a poupar mais este m\xEAs", texto: "O seu saldo dispon\xEDvel \xE9 " + BM.eur0(saldoAtual - saldoAnterior) + " superior ao do m\xEAs anterior." });
    }
  }
  const metaProxima = (fin.data.metas || []).filter((m) => !m.fechada && m.alvo > 0 && m.atual / m.alvo >= 0.8).sort((a, b) => b.atual / b.alvo - a.atual / a.alvo)[0];
  if (metaProxima) {
    const pct = Math.round(metaProxima.atual / metaProxima.alvo * 100);
    out.push({ icon: "target", estado: "positivo", titulo: "O objetivo " + metaProxima.nome + " est\xE1 pr\xF3ximo da conclus\xE3o", texto: "J\xE1 alcan\xE7ou " + pct + "% do valor definido." });
  }
  if (prem) {
    const s = prem.get();
    const proximos = (s.lembretes || []).filter((l) => !l.pago).map((l) => ({ titulo: l.titulo, d: daysUntil(l.data) })).filter((a) => a.d <= 7 && a.d >= 0);
    if (proximos.length > 0) {
      out.push({
        icon: "calendarCheck",
        estado: "atencao",
        titulo: proximos.length === 1 ? "Existe um pagamento importante esta semana" : "Existem " + proximos.length + " pagamentos importantes esta semana",
        texto: proximos.slice(0, 3).map((a) => a.titulo).join(", ") + "."
      });
    }
  }
  return out;
}
const SECOES_RESPOSTA = [
  { chave: "resumo", labels: ["resumo"] },
  { chave: "indicadores", labels: ["indicadores", "dados"] },
  { chave: "observacao", labels: ["observa\xE7\xE3o", "observacao"] },
  { chave: "sugestao", labels: ["sugest\xE3o", "sugestao"] },
  { chave: "acao", labels: ["a\xE7\xE3o recomendada", "acao recomendada", "a\xE7\xE3o", "acao"] }
];
function parseRespostaAssistente(texto) {
  if (!texto) return null;
  const secoes = {};
  let atual = null;
  let encontrouAlguma = false;
  texto.split("\n").forEach((linhaOriginal) => {
    const linha = linhaOriginal.trim();
    const semDoisPontos = linha.replace(/:\s*$/, "").toLowerCase();
    const match = linha.length < 40 && SECOES_RESPOSTA.find((s) => s.labels.includes(semDoisPontos));
    if (match) {
      atual = match.chave;
      secoes[atual] = secoes[atual] || "";
      encontrouAlguma = true;
      return;
    }
    if (atual) secoes[atual] = (secoes[atual] ? secoes[atual] + "\n" : "") + linhaOriginal;
  });
  if (!encontrouAlguma) return null;
  Object.keys(secoes).forEach((k) => secoes[k] = secoes[k].trim());
  return secoes;
}
function acaoParaBotao(texto, { go, open }) {
  if (!texto) return null;
  const t = texto.toLowerCase();
  if (t.includes("or\xE7amento") || t.includes("orcamento")) return { label: "Criar or\xE7amento", onClick: () => open("orcamento") };
  if (t.includes("objetivo")) return { label: "Abrir objetivos", onClick: () => go("objetivos") };
  if (t.includes("relat\xF3rio") || t.includes("relatorio")) return { label: "Ver relat\xF3rio", onClick: () => go("relatorios") };
  if (t.includes("transa\xE7") || t.includes("transac")) return { label: "Abrir transa\xE7\xF5es", onClick: () => go("transacoes") };
  return null;
}
function RespostaCard({ secoes, hora, go, open }) {
  const botao = acaoParaBotao(secoes.acao, { go, open });
  const bloco = (chave, label) => secoes[chave] && /* @__PURE__ */ React.createElement("div", { className: "assist-resp-section" }, /* @__PURE__ */ React.createElement("div", { className: "assist-resp-label" }, label), /* @__PURE__ */ React.createElement("div", { className: "assist-resp-text" }, secoes[chave]));
  return /* @__PURE__ */ React.createElement("div", { className: "assist-msg assistant assist-resp-card" }, bloco("resumo", "Resumo"), bloco("indicadores", "Indicadores"), bloco("observacao", "Observa\xE7\xE3o"), bloco("sugestao", "Sugest\xE3o"), secoes.acao && /* @__PURE__ */ React.createElement("div", { className: "assist-resp-section" }, /* @__PURE__ */ React.createElement("div", { className: "assist-resp-label" }, "A\xE7\xE3o recomendada"), /* @__PURE__ */ React.createElement("div", { className: "assist-resp-text" }, secoes.acao), botao && /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-soft", style: { marginTop: 10 }, onClick: botao.onClick }, botao.label)), hora && /* @__PURE__ */ React.createElement("span", { className: "assist-msg-hora" }, hora));
}
function AssistenteRendePage({ go, open }) {
  const fin = useFinance();
  const prem = usePremium();
  const [mensagens, setMensagens] = React.useState([]);
  const [input, setInput] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const [erro, setErro] = React.useState("");
  const scrollRef = React.useRef(null);
  const abortRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensagens]);
  React.useEffect(() => () => {
    if (abortRef.current) abortRef.current.abort();
  }, []);
  const enviarTexto = (texto) => {
    texto = (texto || "").trim();
    if (!texto || enviando) return;
    setErro("");
    const historico = [...mensagens, { role: "user", texto, hora: horaAtual() }];
    setMensagens([...historico, { role: "assistant", texto: "", hora: horaAtual() }]);
    setInput("");
    setEnviando(true);
    const controller = new AbortController();
    abortRef.current = controller;
    API.assistenteChat(historico.map((m) => ({ role: m.role, texto: m.texto })), {
      signal: controller.signal,
      onDelta: (delta) => {
        setMensagens((ms) => {
          const copia = [...ms];
          const ultima = copia[copia.length - 1];
          copia[copia.length - 1] = { ...ultima, texto: ultima.texto + delta };
          return copia;
        });
      },
      onDone: () => setEnviando(false),
      onError: (e) => {
        setErro(e && e.message || "N\xE3o foi poss\xEDvel obter resposta do assistente.");
        setEnviando(false);
      }
    });
  };
  const enviar = () => enviarTexto(input);
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };
  const limpar = () => {
    if (abortRef.current) abortRef.current.abort();
    setMensagens([]);
    setErro("");
    setEnviando(false);
  };
  const insights = gerarInsights(fin, prem);
  const ACOES_RAPIDAS = [
    { icon: "report", titulo: "Resumo financeiro", desc: "Uma vis\xE3o geral da sua situa\xE7\xE3o atual.", pergunta: "Como est\xE3o as minhas finan\xE7as este m\xEAs?" },
    { icon: "wallet", titulo: "Analisar despesas", desc: "Onde est\xE1 a gastar mais dinheiro.", pergunta: "Onde gastei mais este m\xEAs?" },
    { icon: "target", titulo: "Ver objetivos", desc: "Progresso dos seus objetivos de poupan\xE7a.", pergunta: "Qual \xE9 o progresso dos meus objetivos?" },
    { icon: "bolt", titulo: "Prever fim do m\xEAs", desc: "Quanto ainda pode gastar com seguran\xE7a.", pergunta: "Quanto ainda posso gastar at\xE9 ao fim do m\xEAs?" },
    { icon: "chart", titulo: "Rever or\xE7amento", desc: "Se est\xE1 dentro do limite definido.", pergunta: "Estou dentro do or\xE7amento definido?" },
    { icon: "calendarCheck", titulo: "Agenda financeira", desc: "Os seus pr\xF3ximos pagamentos.", pergunta: "Quais s\xE3o os meus pr\xF3ximos pagamentos?" }
  ];
  const SUGESTOES = [
    "Onde gastei mais este m\xEAs?",
    "Quanto ainda posso gastar este m\xEAs?",
    "Como posso atingir o meu objetivo mais rapidamente?",
    "Qual foi a minha maior despesa?",
    "Como posso melhorar o meu or\xE7amento?"
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "content assist-page" }, /* @__PURE__ */ React.createElement("div", { className: "assist-col-left" }, /* @__PURE__ */ React.createElement("div", { className: "assist-left-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "assist-left-title" }, "Assistente Rende+"), /* @__PURE__ */ React.createElement("p", { className: "assist-left-sub" }, "O seu assistente inteligente para compreender e organizar melhor as suas finan\xE7as.")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost", disabled: true, title: "Hist\xF3rico de conversas \u2014 em breve" }, /* @__PURE__ */ React.createElement(Icon, { name: "history", size: 14 }), " Hist\xF3rico")), /* @__PURE__ */ React.createElement("div", { className: "assist-section" }, /* @__PURE__ */ React.createElement("div", { className: "assist-section-title" }, "A\xE7\xF5es r\xE1pidas"), /* @__PURE__ */ React.createElement("div", { className: "assist-cards-grid" }, ACOES_RAPIDAS.map((a) => /* @__PURE__ */ React.createElement("button", { type: "button", key: a.titulo, className: "assist-action-card", onClick: () => enviarTexto(a.pergunta) }, /* @__PURE__ */ React.createElement("span", { className: "assist-action-ico" }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 18, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("span", { className: "assist-action-txt" }, /* @__PURE__ */ React.createElement("b", null, a.titulo), /* @__PURE__ */ React.createElement("span", null, a.desc)))))), /* @__PURE__ */ React.createElement("div", { className: "assist-section" }, /* @__PURE__ */ React.createElement("div", { className: "assist-section-title" }, "Insights para si"), insights.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "assist-insight-empty" }, "Ainda n\xE3o h\xE1 dados suficientes para gerar insights. Continue a registar as suas receitas e despesas.") : /* @__PURE__ */ React.createElement("div", { className: "assist-insights-list" }, insights.map((ins, i) => /* @__PURE__ */ React.createElement("div", { className: "assist-insight " + ins.estado, key: i }, /* @__PURE__ */ React.createElement("span", { className: "assist-insight-ico" }, /* @__PURE__ */ React.createElement(Icon, { name: ins.icon, size: 16 })), /* @__PURE__ */ React.createElement("div", { className: "assist-insight-txt" }, /* @__PURE__ */ React.createElement("b", null, ins.titulo), /* @__PURE__ */ React.createElement("span", null, ins.texto)))))), /* @__PURE__ */ React.createElement("div", { className: "assist-section" }, /* @__PURE__ */ React.createElement("div", { className: "assist-section-title" }, "Fa\xE7a uma pergunta"), /* @__PURE__ */ React.createElement("div", { className: "assist-suggest-list" }, SUGESTOES.map((s) => /* @__PURE__ */ React.createElement("button", { type: "button", key: s, className: "assist-suggest-chip", onClick: () => enviarTexto(s) }, s))))), /* @__PURE__ */ React.createElement("div", { className: "assist-col-right" }, /* @__PURE__ */ React.createElement("div", { className: "assist-chat-head" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "assist-head-ico" }, /* @__PURE__ */ React.createElement(Icon, { name: "bot", size: 18, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14.5 } }, "Assistente Rende+"), /* @__PURE__ */ React.createElement("span", { className: "assist-online" }, /* @__PURE__ */ React.createElement("span", { className: "assist-online-dot" }), " Online"))), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost", onClick: limpar, disabled: mensagens.length === 0 }, /* @__PURE__ */ React.createElement(Icon, { name: "trash", size: 14 }), " Limpar conversa")), /* @__PURE__ */ React.createElement("div", { className: "assist-chat-body", ref: scrollRef }, mensagens.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "assist-empty" }, /* @__PURE__ */ React.createElement(Icon, { name: "bot", size: 28, color: "var(--ink-3)" }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, fontWeight: 700, fontSize: 13.5 } }, "Como posso ajudar hoje?"), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { marginTop: 4, fontWeight: 600, lineHeight: 1.5 } }, "Escolha uma a\xE7\xE3o r\xE1pida, uma sugest\xE3o, ou escreva a sua pergunta.")) : mensagens.map((m, i) => {
    const isLast = i === mensagens.length - 1;
    const podeEstruturar = m.role === "assistant" && !(isLast && enviando);
    const estruturada = podeEstruturar ? parseRespostaAssistente(m.texto) : null;
    if (estruturada) return /* @__PURE__ */ React.createElement(RespostaCard, { key: i, secoes: estruturada, hora: m.hora, go, open });
    return /* @__PURE__ */ React.createElement("div", { key: i, className: "assist-msg " + m.role }, /* @__PURE__ */ React.createElement("div", null, m.texto ? m.texto : m.role === "assistant" && isLast && enviando ? /* @__PURE__ */ React.createElement("span", { className: "assist-typing" }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)) : ""), m.hora && /* @__PURE__ */ React.createElement("span", { className: "assist-msg-hora" }, m.hora));
  }), erro && /* @__PURE__ */ React.createElement("div", { className: "alert bad", style: { padding: "9px 12px", margin: "4px 0" } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16, color: "var(--neg)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, erro))), /* @__PURE__ */ React.createElement("div", { className: "assist-foot" }, /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "assist-input",
      rows: 1,
      placeholder: "Escreva a sua pergunta\u2026",
      value: input,
      disabled: enviando,
      onChange: (e) => setInput(e.target.value),
      onKeyDown
    }
  ), /* @__PURE__ */ React.createElement("button", { type: "button", className: "icon-btn assist-send", onClick: enviar, disabled: enviando || !input.trim(), "aria-label": "Enviar mensagem" }, /* @__PURE__ */ React.createElement(Icon, { name: "send", size: 17, color: "#fff" })))));
}
function PremiumBadge() {
  const prem = usePremium();
  if (!prem.get().premium) return null;
  return /* @__PURE__ */ React.createElement("span", { className: "prem-tag" }, /* @__PURE__ */ React.createElement(Icon, { name: "spark", size: 11, color: "#fff" }), " Premium");
}
Object.assign(window, { PremiumStore, usePremium, Paywall, PremiumGate, Lembretes, Recorrentes, AgendaFinanceira, Partilha, Previsao, PremiumBadge, AssistenteRendePage });
