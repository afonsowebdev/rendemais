const APP_VERSION = "1.0.0";
window.APP_VERSION = APP_VERSION;
function useLang() {
  const [lang, setLang] = React.useState(I18N.getLang());
  React.useEffect(() => I18N.subscribe(setLang), []);
  return [lang, I18N.setLangGlobal];
}
function useT() {
  const [lang] = useLang();
  return I18N.make(lang);
}
function tfmt(s, vars) {
  if (vars) Object.keys(vars).forEach((k) => {
    s = s.split("{" + k + "}").join(vars[k]);
  });
  return s;
}
window.useLang = useLang;
window.useT = useT;
window.tfmt = tfmt;
const { useState, useEffect } = React;
const TWEAK_DEFAULTS = (
  /*EDITMODE-BEGIN*/
  {
    "accent": "#14a06b",
    "dark": false,
    "font": "Inter",
    "radius": 16,
    "density": "regular"
  }
);
const PAGES = {
  dashboard: { title: "Painel", add: "despesa" },
  transacoes: { title: "Transa\xE7\xF5es", add: "despesa" },
  objetivos: { title: "Objetivos", add: "meta" },
  agenda: { title: "Agenda Financeira", add: null },
  partilha: { title: "Partilha", add: null },
  contas: { title: "Contas", add: null },
  relatorios: { title: "Relat\xF3rios", add: null },
  perfil: { title: "Perfil", add: null },
  config: { title: "Defini\xE7\xF5es", add: null }
};
const ROUTE_ALIASES = {
  despesas: "transacoes",
  rendimentos: "transacoes",
  poupanca: "objetivos",
  lembretes: "agenda",
  recorrentes: "agenda",
  subscricoes: "agenda",
  historico: "relatorios"
};
const ADD_LABEL = { despesa: "Nova despesa", rendimento: "Novo rendimento", meta: "Nova meta" };
const META_CORES = ["var(--c-educacao)", "var(--c-alimentacao)", "var(--c-habitacao)", "var(--c-transporte)", "var(--c-lazer)", "var(--c-internet)"];
const CAT_ICONS = ["cart", "bag", "coffee", "food", "car", "fuel", "bus", "train", "plane", "bike", "home", "key", "bulb", "droplet", "flame", "wifi", "cross", "pill", "heart", "cap", "book", "briefcase", "film", "music", "game", "tv", "dumbbell", "shirt", "scissors", "gift", "tag", "paw", "phone", "tools", "umbrella", "leaf", "bank", "wallet", "card", "coins", "sack", "receipt", "chart", "target", "flag", "spark", "bolt", "cal", "bell"];
const CAT_EMOJIS = ["\u{1F6D2}", "\u{1F354}", "\u{1F355}", "\u2615", "\u{1F37A}", "\u{1F956}", "\u{1F957}", "\u{1F363}", "\u{1F35C}", "\u{1F964}", "\u{1F9CB}", "\u{1F366}", "\u{1F9C0}", "\u{1F969}", "\u{1F373}", "\u{1F96B}", "\u{1F36B}", "\u{1F966}", "\u{1F353}", "\u{1F95A}", "\u{1F34C}", "\u{1F34E}", "\u{1F382}", "\u{1F377}", "\u{1F3E0}", "\u{1F6BF}", "\u{1F6CB}\uFE0F", "\u{1F6CF}\uFE0F", "\u{1F9F9}", "\u{1F9FC}", "\u{1F50C}", "\u{1FA91}", "\u{1F4A1}", "\u{1F4A7}", "\u26A1", "\u{1F6B0}", "\u{1F527}", "\u{1F6E0}\uFE0F", "\u{1F331}", "\u{1F697}", "\u26FD", "\u{1F68C}", "\u2708\uFE0F", "\u{1F686}", "\u{1F687}", "\u{1F695}", "\u{1F6B2}", "\u{1F6F5}", "\u{1F6F4}", "\u{1F17F}\uFE0F", "\u{1F3AB}", "\u{1F3E5}", "\u{1F48A}", "\u{1FA7A}", "\u{1F489}", "\u{1FA79}", "\u{1F9B7}", "\u{1F453}", "\u{1FAA5}", "\u{1F9E0}", "\u{1F393}", "\u{1F4DA}", "\u{1F4BB}", "\u{1F4F1}", "\u{1F4DE}", "\u{1F310}", "\u{1F4BC}", "\u{1F4DD}", "\u{1F4C5}", "\u{1F5A5}\uFE0F", "\u{1F3AE}", "\u{1F3AC}", "\u{1F3B5}", "\u{1F3A8}", "\u{1F39F}\uFE0F", "\u{1F4F7}", "\u26BD", "\u{1F3B2}", "\u{1F3B8}", "\u{1F3A7}", "\u{1F3CB}\uFE0F", "\u{1F9D8}", "\u{1F3D6}\uFE0F", "\u{1F3D5}\uFE0F", "\u{1F389}", "\u{1F487}", "\u2702\uFE0F", "\u{1F485}", "\u{1F9D6}", "\u{1F455}", "\u{1F381}", "\u{1F415}", "\u{1F408}", "\u{1F43E}", "\u{1F420}", "\u{1F476}", "\u{1F37C}", "\u{1F9F8}", "\u{1F4B3}", "\u{1F3E6}", "\u{1F4C8}", "\u{1F4B0}", "\u{1F9FE}", "\u{1F4B6}", "\u{1F4B5}", "\u{1FA99}", "\u{1F4B8}", "\u{1F3E7}", "\u{1F911}", "\u{1F3AF}", "\u2764\uFE0F", "\u2602\uFE0F", "\u{1F511}", "\u{1F4E6}", "\u267B\uFE0F", "\u{1F9F3}", "\u{1F337}"];
const CAT_COLORS = ["var(--c-habitacao)", "var(--c-alimentacao)", "var(--c-transporte)", "var(--c-educacao)", "var(--c-lazer)", "var(--c-internet)", "var(--c-saude)", "var(--c-outros)"];
const DESPESA_LABEL_TO_CAT = {
  "Renda": "habitacao",
  "\xC1gua": "habitacao",
  "Eletricidade": "habitacao",
  "G\xE1s": "habitacao",
  "Internet": "internet",
  "Telecomunica\xE7\xF5es": "internet",
  "Alimenta\xE7\xE3o": "alimentacao",
  "Transporte": "transporte",
  "Educa\xE7\xE3o": "educacao",
  "Sa\xFAde": "saude",
  "Lazer": "lazer",
  "Subscri\xE7\xF5es": "lazer",
  "Seguros": "outros",
  "Outro": "outros"
};
function NewCategoryInline({ onCreate, onCancel }) {
  const fin = useFinance();
  const [nome, setNome] = useState("");
  const [icon, setIcon] = useState("cart");
  const [color, setColor] = useState(CAT_COLORS[0]);
  const [err, setErr] = useState("");
  const create = async () => {
    if (!nome.trim()) return setErr("D\xE1 um nome \xE0 categoria.");
    const key = await fin.addCategory({ nome: nome.trim(), icon, color });
    if (key) onCreate(key);
  };
  return /* @__PURE__ */ React.createElement("div", { style: { border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 14, background: "var(--surface-2)", display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 8, fontWeight: 700, fontSize: 13.5 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: `color-mix(in srgb, ${color} 16%, transparent)` } }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 15, color, sw: 1.9 })), "Nova categoria"), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", style: { width: 28, height: 28 }, onClick: onCancel }, /* @__PURE__ */ React.createElement("span", { style: { transform: "rotate(45deg)", display: "grid" } }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 15, color: "var(--ink-2)" })))), /* @__PURE__ */ React.createElement("input", { className: "input", autoFocus: true, value: nome, onChange: (e) => setNome(e.target.value), placeholder: "Nome da categoria (ex: Gin\xE1sio)" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 700, marginBottom: 6 } }, "\xCDcone"), /* @__PURE__ */ React.createElement("div", { className: "row", style: { flexWrap: "wrap", gap: 6 } }, CAT_ICONS.map((ic) => /* @__PURE__ */ React.createElement("button", { key: ic, onClick: () => setIcon(ic), style: { width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", border: icon === ic ? `2px solid ${color}` : "1px solid var(--border-strong)", background: icon === ic ? `color-mix(in srgb, ${color} 14%, transparent)` : "var(--surface)", cursor: "pointer" } }, /* @__PURE__ */ React.createElement(Icon, { name: ic, size: 17, color: icon === ic ? color : "var(--ink-2)" }))))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 700, marginBottom: 6 } }, "Ou escolhe um emoji"), /* @__PURE__ */ React.createElement("div", { className: "row", style: { flexWrap: "wrap", gap: 6 } }, CAT_EMOJIS.map((em) => /* @__PURE__ */ React.createElement("button", { key: em, onClick: () => setIcon(em), style: { width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", fontSize: 18, lineHeight: 1, border: icon === em ? `2px solid ${color}` : "1px solid var(--border-strong)", background: icon === em ? `color-mix(in srgb, ${color} 14%, transparent)` : "var(--surface)", cursor: "pointer" } }, em)))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 700, marginBottom: 6 } }, "Cor"), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 8, flexWrap: "wrap" } }, CAT_COLORS.map((c) => /* @__PURE__ */ React.createElement("button", { key: c, onClick: () => setColor(c), style: { width: 28, height: 28, borderRadius: 8, background: c, border: color === c ? "2.5px solid var(--ink)" : "2.5px solid transparent", cursor: "pointer" } })))), err && /* @__PURE__ */ React.createElement("div", { className: "tiny", style: { color: "var(--neg)", fontWeight: 700 } }, err), /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "flex-end", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: onCancel }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: create }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 14, color: "#fff" }), " Adicionar categoria")));
}
function EntryModal({ type, item, onClose }) {
  const fin = useFinance();
  const account = fin.account || {};
  const favDespesaKeys = (Array.isArray(account.principaisDespesas) ? account.principaisDespesas : []).map((label) => BM.cats[label] ? label : DESPESA_LABEL_TO_CAT[label]).filter((k, i, arr) => k && arr.indexOf(k) === i);
  const catKeys = [...favDespesaKeys, ...Object.keys(BM.cats).filter((k) => !favDespesaKeys.includes(k))];
  const favIncKeys = (Array.isArray(account.fontesRendimento) ? account.fontesRendimento : []).filter((label) => BM.incomeCats[label] != null);
  const incKeys = [...favIncKeys, ...Object.keys(BM.incomeCats).filter((k) => !favIncKeys.includes(k))];
  const editing = !!item;
  const seed = () => {
    var _a, _b, _c, _d, _e, _f, _g;
    if (type === "despesa") return { nome: (item == null ? void 0 : item.nome) || "", valor: (_a = item == null ? void 0 : item.valor) != null ? _a : "", data: (item == null ? void 0 : item.data) || BM.todayISO(), cat: (item == null ? void 0 : item.cat) || catKeys[0] || "alimentacao", tipo: (item == null ? void 0 : item.tipo) || "variavel" };
    if (type === "rendimento") return { fonte: (item == null ? void 0 : item.fonte) || "", valor: (_b = item == null ? void 0 : item.valor) != null ? _b : "", data: (item == null ? void 0 : item.data) || BM.todayISO(), cat: (item == null ? void 0 : item.cat) || incKeys[0] || "Sal\xE1rio", rec: (_c = item == null ? void 0 : item.rec) != null ? _c : true };
    if (type === "meta") return { nome: (item == null ? void 0 : item.nome) || "", alvo: (_d = item == null ? void 0 : item.alvo) != null ? _d : "", atual: (_e = item == null ? void 0 : item.atual) != null ? _e : 0, cor: (item == null ? void 0 : item.cor) || META_CORES[0] };
    if (type === "deposit") return { valor: "", inicial: false };
    if (type === "orcamento") return { valor: (_f = fin.data.orcamento) != null ? _f : "" };
    if (type === "sync") {
      const movs = (BM.bancos[item == null ? void 0 : item.banco] || {}).importar || [];
      return { sel: movs.map(() => true) };
    }
    if (type === "reservar") return { modo: fin.data.metas.length ? "existente" : "nova", metaId: ((_g = fin.data.metas[0]) == null ? void 0 : _g.id) || "", nome: "" };
    if (type === "perfil") {
      const a = fin.account || {};
      return { nome: a.nome || "", nascimento: a.dataNascimento || a.nascimento || "", cidade: a.cidade || "", perfil: a.perfil || "Estudante", estado: a.estado || "Solteiro(a)", habitacao: a.habitacao || "Vive com colegas", foto: a.foto || null };
    }
    return {};
  };
  const [f, setF] = useState(seed);
  const [err, setErr] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const num = (v) => {
    const n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? 0 : n;
  };
  const calcIdade = (iso) => {
    if (!iso) return null;
    const n = /* @__PURE__ */ new Date(iso + "T00:00:00");
    if (isNaN(n.getTime())) return null;
    const h = /* @__PURE__ */ new Date();
    let i = h.getFullYear() - n.getFullYear();
    const m = h.getMonth() - n.getMonth();
    if (m < 0 || m === 0 && h.getDate() < n.getDate()) i--;
    return i;
  };
  const nascBloqueado = !!(fin.account && fin.account.nascimentoBloqueado);
  const onFoto = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setF((s) => ({ ...s, foto: reader.result }));
    reader.readAsDataURL(file);
  };
  const save = () => {
    if (type === "despesa") {
      if (!f.nome.trim() || num(f.valor) <= 0) return setErr("Indica um nome e um valor maior que zero.");
      const payload = { nome: f.nome.trim(), valor: num(f.valor), data: f.data, cat: f.cat, tipo: f.tipo };
      editing ? fin.despesa.edit(item.id, payload) : fin.despesa.add(payload);
    } else if (type === "rendimento") {
      if (!f.fonte.trim() || num(f.valor) <= 0) return setErr("Indica uma fonte e um valor maior que zero.");
      const payload = { fonte: f.fonte.trim(), valor: num(f.valor), data: f.data, cat: f.cat, rec: f.rec };
      editing ? fin.rendimento.edit(item.id, payload) : fin.rendimento.add(payload);
    } else if (type === "meta") {
      if (!f.nome.trim() || num(f.alvo) <= 0) return setErr("Indica um nome e um objetivo maior que zero.");
      const payload = { nome: f.nome.trim(), alvo: num(f.alvo), atual: num(f.atual), cor: f.cor };
      editing ? fin.meta.edit(item.id, payload) : fin.meta.add({ ...payload, inicial: true });
    } else if (type === "deposit") {
      if (num(f.valor) <= 0) return setErr("Indica um valor a depositar.");
      fin.deposit(item.id, num(f.valor), !!f.inicial);
    } else if (type === "orcamento") {
      fin.setOrcamento(num(f.valor) > 0 ? num(f.valor) : null);
    } else if (type === "sync") {
      const movs = (BM.bancos[item.banco] || {}).importar || [];
      const chosen = movs.filter((_, i) => f.sel[i]);
      if (chosen.length === 0) return setErr("Seleciona pelo menos um movimento para importar.");
      fin.importMovs(item.id, chosen);
    } else if (type === "reservar") {
      const amount = (item == null ? void 0 : item.amount) || 0;
      if (f.modo === "existente") {
        if (!f.metaId) return setErr("Escolhe uma poupan\xE7a.");
        fin.deposit(f.metaId, amount);
      } else {
        if (!f.nome.trim()) return setErr("D\xE1 um nome \xE0 nova poupan\xE7a.");
        fin.meta.add({ nome: f.nome.trim(), alvo: 0, atual: amount, cor: META_CORES[fin.data.metas.length % META_CORES.length] });
      }
    } else if (type === "perfil") {
      if (!f.nome.trim()) return setErr("O nome n\xE3o pode ficar vazio.");
      if (!nascBloqueado && f.nascimento) {
        const idade = calcIdade(f.nascimento);
        if (idade == null) return setErr("Data de nascimento inv\xE1lida.");
        if (idade < 16) return setErr("Tens de ter pelo menos 16 anos.");
      }
      const payload = { ...f };
      delete payload.nascimento;
      if (!nascBloqueado && f.nascimento) payload.dataNascimento = f.nascimento;
      fin.updateAccount(payload);
    }
    onClose();
  };
  const titles = {
    despesa: editing ? "Editar despesa" : "Nova despesa",
    rendimento: editing ? "Editar rendimento" : "Novo rendimento",
    meta: editing ? "Editar meta" : "Nova meta de poupan\xE7a",
    deposit: "Depositar na meta",
    orcamento: "Or\xE7amento mensal",
    sync: `Sincronizar ${(item == null ? void 0 : item.nome) || "conta"}`,
    reservar: "Guardar na poupan\xE7a",
    perfil: "Editar perfil"
  };
  return /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: titles[type],
      sub: type === "deposit" ? item == null ? void 0 : item.nome : type === "sync" ? "Sincroniza\xE7\xE3o verificada" : null,
      onClose,
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: onClose }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: save }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 15, color: "#fff" }), " ", type === "sync" ? "Importar" : type === "reservar" ? "Guardar" : "Guardar"))
    },
    type === "despesa" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: "Nome da despesa" }, /* @__PURE__ */ React.createElement("input", { className: "input", autoFocus: true, value: f.nome, onChange: set("nome"), placeholder: "Ex: Compras supermercado" })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement(Field, { label: `Valor (${fin.curSym})` }, /* @__PURE__ */ React.createElement("input", { className: "input", type: "number", step: "0.01", value: f.valor, onChange: set("valor"), placeholder: "0,00" })), /* @__PURE__ */ React.createElement(Field, { label: "Data de pagamento", hint: "Quando a despesa \xE9 (ou foi) paga." }, /* @__PURE__ */ React.createElement("input", { className: "input", type: "date", value: f.data, onChange: set("data") }))), /* @__PURE__ */ React.createElement(Field, { label: "Categoria" }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.cat, onChange: set("cat") }, catKeys.map((k) => /* @__PURE__ */ React.createElement("option", { key: k, value: k }, BM.cats[k].nome)))), addingCat ? /* @__PURE__ */ React.createElement(NewCategoryInline, { onCreate: (key) => {
      setF((s) => ({ ...s, cat: key }));
      setAddingCat(false);
    }, onCancel: () => setAddingCat(false) }) : /* @__PURE__ */ React.createElement("button", { className: "btn btn-soft", style: { marginBottom: 14 }, onClick: () => setAddingCat(true) }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 14 }), " Adicionar nova categoria"), /* @__PURE__ */ React.createElement(Field, { label: "Tipo de despesa", hint: f.tipo === "fixa" ? "Repete-se todos os meses (renda, propina\u2026)." : "Gasto pontual (compras, lazer\u2026)." }, /* @__PURE__ */ React.createElement("div", { className: "seg", style: { width: "fit-content" } }, /* @__PURE__ */ React.createElement("button", { className: f.tipo === "fixa" ? "on" : "", onClick: () => setF((s) => ({ ...s, tipo: "fixa" })) }, "Fixa"), /* @__PURE__ */ React.createElement("button", { className: f.tipo === "variavel" ? "on" : "", onClick: () => setF((s) => ({ ...s, tipo: "variavel" })) }, "Vari\xE1vel")))),
    type === "rendimento" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: "Fonte" }, /* @__PURE__ */ React.createElement("input", { className: "input", autoFocus: true, value: f.fonte, onChange: set("fonte"), placeholder: "Ex: Bolsa de estudo" })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement(Field, { label: `Valor (${fin.curSym})` }, /* @__PURE__ */ React.createElement("input", { className: "input", type: "number", step: "0.01", value: f.valor, onChange: set("valor"), placeholder: "0,00" })), /* @__PURE__ */ React.createElement(Field, { label: "Data" }, /* @__PURE__ */ React.createElement("input", { className: "input", type: "date", value: f.data, onChange: set("data") }))), /* @__PURE__ */ React.createElement(Field, { label: "Categoria" }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.cat, onChange: set("cat") }, incKeys.map((k) => /* @__PURE__ */ React.createElement("option", { key: k, value: k }, k)))), /* @__PURE__ */ React.createElement(Field, { label: "Frequ\xEAncia", hint: f.rec ? "Recebes este valor todos os meses." : "Recebimento pontual." }, /* @__PURE__ */ React.createElement("div", { className: "seg", style: { width: "fit-content" } }, /* @__PURE__ */ React.createElement("button", { className: f.rec ? "on" : "", onClick: () => setF((s) => ({ ...s, rec: true })) }, "Recorrente"), /* @__PURE__ */ React.createElement("button", { className: !f.rec ? "on" : "", onClick: () => setF((s) => ({ ...s, rec: false })) }, "Pontual")))),
    type === "meta" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: "Nome da meta" }, /* @__PURE__ */ React.createElement("input", { className: "input", autoFocus: true, value: f.nome, onChange: set("nome"), placeholder: "Ex: Fundo de emerg\xEAncia" })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement(Field, { label: `Objetivo (${fin.curSym})` }, /* @__PURE__ */ React.createElement("input", { className: "input", type: "number", step: "1", value: f.alvo, onChange: set("alvo"), placeholder: "1000" })), /* @__PURE__ */ React.createElement(Field, { label: `J\xE1 poupado (${fin.curSym})`, hint: "O que j\xE1 tinhas \u2014 n\xE3o desconta da receita." }, /* @__PURE__ */ React.createElement("input", { className: "input", type: "number", step: "1", value: f.atual, onChange: set("atual"), placeholder: "0" }))), /* @__PURE__ */ React.createElement(Field, { label: "Cor" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 8 } }, META_CORES.map((c) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: c,
        onClick: () => setF((s) => ({ ...s, cor: c })),
        style: { width: 30, height: 30, borderRadius: 9, background: c, border: f.cor === c ? "2.5px solid var(--ink)" : "2.5px solid transparent", cursor: "pointer" }
      }
    ))))),
    type === "deposit" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: `Valor a depositar (${fin.curSym})`, hint: ((item == null ? void 0 : item.alvo) || 0) > 0 ? `Em falta: ${BM.eur0(((item == null ? void 0 : item.alvo) || 0) - ((item == null ? void 0 : item.atual) || 0))}` : `Acumulado: ${BM.eur0((item == null ? void 0 : item.atual) || 0)}` }, /* @__PURE__ */ React.createElement("input", { className: "input", autoFocus: true, type: "number", step: "0.01", value: f.valor, onChange: set("valor"), placeholder: "0,00" })), /* @__PURE__ */ React.createElement("label", { className: "row", style: { gap: 10, cursor: "pointer", fontSize: 12.5, fontWeight: 600, lineHeight: 1.4, marginTop: 2, color: "var(--ink-2)" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: !!f.inicial, onChange: (e) => setF((s) => ({ ...s, inicial: e.target.checked })), style: { width: 17, height: 17, accentColor: "var(--accent)", flex: "none", marginTop: 1 } }), /* @__PURE__ */ React.createElement("span", null, "J\xE1 tinha este valor poupado \u2014 adicionar \xE0 minha poupan\xE7a ", /* @__PURE__ */ React.createElement("b", null, "sem descontar"), " da receita deste m\xEAs."))),
    type === "orcamento" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: `Limite de gastos por m\xEAs (${fin.curSym})`, hint: "Deixa a 0 para remover o limite." }, /* @__PURE__ */ React.createElement("input", { className: "input", autoFocus: true, type: "number", step: "1", value: f.valor, onChange: set("valor"), placeholder: "850" }))),
    type === "sync" && (() => {
      const movs = (BM.bancos[item.banco] || {}).importar || [];
      const toggle = (i) => setF((s) => ({ ...s, sel: s.sel.map((v, idx) => idx === i ? !v : v) }));
      const chosen = movs.filter((_, i) => f.sel[i]);
      const desp = chosen.filter((m) => m.kind === "despesa").reduce((s, m) => s + m.valor, 0);
      const rend = chosen.filter((m) => m.kind === "rendimento").reduce((s, m) => s + m.valor, 0);
      return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "alert ok", style: { marginBottom: 14, padding: "10px 12px", alignItems: "center" } }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16, color: "var(--accent)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, "Detet\xE1mos ", movs.length, " ", movs.length === 1 ? "movimento novo" : "movimentos novos", ". Confirma o que queres importar.")), /* @__PURE__ */ React.createElement("div", { className: "list", style: { marginBottom: 6 } }, movs.map((m, i) => {
        const isDesp = m.kind === "despesa";
        return /* @__PURE__ */ React.createElement("label", { key: i, className: "li", style: { cursor: "pointer", gap: 12 } }, /* @__PURE__ */ React.createElement(
          "input",
          {
            type: "checkbox",
            checked: !!f.sel[i],
            onChange: () => toggle(i),
            style: { width: 18, height: 18, accentColor: "var(--accent)", flex: "none" }
          }
        ), isDesp ? /* @__PURE__ */ React.createElement(CatBadge, { catKey: m.cat, size: 36, r: 10 }) : /* @__PURE__ */ React.createElement("div", { className: "li-ico", style: { width: 36, height: 36, background: "var(--accent-soft)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "arrowsDown", size: 16, color: "var(--accent)", sw: 2 })), /* @__PURE__ */ React.createElement("div", { className: "li-main" }, /* @__PURE__ */ React.createElement("div", { className: "li-title" }, m.nome), /* @__PURE__ */ React.createElement("div", { className: "li-sub" }, isDesp ? `${(BM.cats[m.cat] || BM.cats.outros).nome} \xB7 ${m.tipo === "fixa" ? "Fixa" : "Vari\xE1vel"}` : m.cat)), /* @__PURE__ */ React.createElement("div", { className: "li-amt tnum", style: { color: isDesp ? "var(--neg)" : "var(--accent)" } }, isDesp ? "\u2212" : "+", BM.eur(m.valor)));
      })), /* @__PURE__ */ React.createElement("div", { className: "card-pad", style: { background: "var(--surface-2)", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", { className: "muted" }, "A importar: ", chosen.length, " de ", movs.length), /* @__PURE__ */ React.createElement("span", null, rend > 0 && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--accent)" } }, "+", BM.eur(rend), " "), desp > 0 && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--neg)" } }, "\u2212", BM.eur(desp)))));
    })(),
    type === "reservar" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "alert ok", style: { marginBottom: 16, padding: "12px 14px", alignItems: "center" } }, /* @__PURE__ */ React.createElement(Icon, { name: "target", size: 18, color: "var(--accent)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700 } }, "Vais guardar ", /* @__PURE__ */ React.createElement("span", { className: "tnum" }, BM.eur((item == null ? void 0 : item.amount) || 0)), " da poupan\xE7a deste m\xEAs.")), fin.data.metas.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "seg", style: { width: "100%", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("button", { style: { flex: 1 }, className: f.modo === "existente" ? "on" : "", onClick: () => setF((s) => ({ ...s, modo: "existente" })) }, "Adicionar a existente"), /* @__PURE__ */ React.createElement("button", { style: { flex: 1 }, className: f.modo === "nova" ? "on" : "", onClick: () => setF((s) => ({ ...s, modo: "nova" })) }, "Criar nova")), f.modo === "existente" && fin.data.metas.length > 0 ? /* @__PURE__ */ React.createElement(Field, { label: "Escolhe a poupan\xE7a", hint: "O valor \xE9 somado ao que j\xE1 tens guardado." }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.metaId, onChange: set("metaId") }, fin.data.metas.map((m) => /* @__PURE__ */ React.createElement("option", { key: m.id, value: m.id }, m.nome, " \u2014 ", BM.eur0(m.atual), " acumulado")))) : /* @__PURE__ */ React.createElement(Field, { label: "Nome da nova poupan\xE7a", hint: "Cria poupan\xE7as separadas para objetivos diferentes." }, /* @__PURE__ */ React.createElement("input", { className: "input", autoFocus: true, value: f.nome, onChange: set("nome"), placeholder: "Ex: Emerg\xEAncia, Viagem\u2026" }))),
    type === "perfil" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 16, marginBottom: 16 } }, f.foto ? /* @__PURE__ */ React.createElement("img", { src: f.foto, alt: "", style: { width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flex: "none" } }) : /* @__PURE__ */ React.createElement("div", { className: "user-av", style: { width: 64, height: 64, fontSize: 22, background: "var(--accent)" } }, initials(f.nome)), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("label", { className: "btn btn-ghost", style: { cursor: "pointer" } }, /* @__PURE__ */ React.createElement(Icon, { name: "camera", size: 15 }), " ", f.foto ? "Mudar foto" : "Adicionar foto", /* @__PURE__ */ React.createElement("input", { type: "file", accept: "image/*", onChange: onFoto, style: { display: "none" } })), f.foto && /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", style: { color: "var(--neg)" }, onClick: () => setF((s) => ({ ...s, foto: null })) }, "Remover"))), /* @__PURE__ */ React.createElement(Field, { label: "Nome" }, /* @__PURE__ */ React.createElement("input", { className: "input", value: f.nome, onChange: set("nome") })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement(Field, { label: "Data de nascimento", hint: nascBloqueado ? "J\xE1 n\xE3o pode ser alterada." : "Podes corrigi-la at\xE9 7 dias depois de a definires." }, nascBloqueado ? /* @__PURE__ */ React.createElement("div", { className: "input", style: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-2)", cursor: "not-allowed", fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", null, f.nascimento ? BM.fmtData(f.nascimento) : "\u2014"), /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 15, color: "var(--muted)" })) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("input", { className: "input", type: "date", value: f.nascimento, max: BM.todayISO(), onChange: (e) => setF((s) => ({ ...s, nascimento: e.target.value })) }), calcIdade(f.nascimento) != null && /* @__PURE__ */ React.createElement("div", { className: "tiny", style: { marginTop: 7, fontWeight: 700, color: calcIdade(f.nascimento) < 16 ? "var(--neg)" : "var(--accent)" } }, calcIdade(f.nascimento) < 16 ? `Tens ${calcIdade(f.nascimento)} anos \u2014 a idade m\xEDnima \xE9 16.` : `Tens ${calcIdade(f.nascimento)} anos.`))), /* @__PURE__ */ React.createElement(Field, { label: "Cidade" }, /* @__PURE__ */ React.createElement("input", { className: "input", value: f.cidade, onChange: set("cidade") }))), /* @__PURE__ */ React.createElement(Field, { label: "Situa\xE7\xE3o" }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.perfil, onChange: set("perfil") }, ["Estudante", "Trabalhador", "Estudante e Trabalhador"].map((o) => /* @__PURE__ */ React.createElement("option", { key: o }, o)))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement(Field, { label: "Estado civil" }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.estado, onChange: set("estado") }, ["Solteiro(a)", "Casado(a)"].map((o) => /* @__PURE__ */ React.createElement("option", { key: o }, o)))), /* @__PURE__ */ React.createElement(Field, { label: "Habita\xE7\xE3o" }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f.habitacao, onChange: set("habitacao") }, ["Vive sozinho(a)", "Vive com colegas", "Vive com familiares", "Vive com c\xF4njuge"].map((o) => /* @__PURE__ */ React.createElement("option", { key: o }, o)))))),
    err && /* @__PURE__ */ React.createElement("div", { className: "alert bad", style: { marginTop: 4, padding: "9px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16, color: "var(--neg)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, err))
  );
}
function Shell() {
  const fin = useFinance();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState("dashboard");
  const [authView, setAuthView] = useState(() => {
    const h = (window.location.hash || "").replace("#", "");
    if (h === "criar-conta") return "signup";
    if (h === "entrar") return "login";
    return null;
  });
  const [modal, setModal] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [sbCollapsed, setSbCollapsed] = useState(() => {
    try {
      return localStorage.getItem("rende_sb") === "1";
    } catch (e) {
      return false;
    }
  });
  const toggleSidebar = () => setSbCollapsed((v) => {
    const n = !v;
    try {
      localStorage.setItem("rende_sb", n ? "1" : "0");
    } catch (e) {
    }
    return n;
  });
  const [lang, setLang] = useLang();
  const tr = I18N.make(lang);
  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);
  const [pagamentoMsg, setPagamentoMsg] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const estado = params.get("pagamento");
    const sessionId = params.get("session_id");
    const limparUrl = () => window.history.replaceState({}, "", window.location.pathname);
    if (estado === "sucesso" && sessionId && fin.session) {
      API.confirmarPagamento(sessionId).then((r) => {
        if (r && r.premium) {
          fin.updateAccount({ plano: "premium", planoExpira: r.planoExpira || null });
          setPagamentoMsg("\u{1F389} Bem-vindo ao Rende+ Premium! As funcionalidades est\xE3o desbloqueadas.");
          setRoute("premium");
        }
      }).catch(() => setPagamentoMsg("Recebemos o teu regresso, mas ainda n\xE3o confirm\xE1mos o pagamento. Se j\xE1 pagaste, atualiza daqui a instantes.")).finally(limparUrl);
    } else if (estado === "cancelado") {
      setPagamentoMsg("Pagamento cancelado. Podes tentar de novo quando quiseres.");
      limparUrl();
    }
  }, [fin.session]);
  const [novaVersao, setNovaVersao] = useState(null);
  useEffect(() => {
    let vivo = true;
    const verificar = () => {
      fetch("/version.json?t=" + Date.now(), { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then((d) => {
        if (vivo && d && d.version && d.version !== APP_VERSION) setNovaVersao(d.version);
      }).catch(() => {
      });
    };
    verificar();
    const iv = setInterval(verificar, 5 * 60 * 1e3);
    return () => {
      vivo = false;
      clearInterval(iv);
    };
  }, []);
  const theme = t.dark ? "dark" : "light";
  const setTheme = (v) => setTweak("dark", v === "dark");
  const ocultar = !!t.ocultar;
  const contraste = !!t.contraste;
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", theme);
    r.setAttribute("data-density", t.density);
    r.setAttribute("data-ocultar", ocultar ? "true" : "false");
    r.setAttribute("data-contraste", contraste ? "true" : "false");
    r.style.setProperty("--accent", t.accent);
    const stack = `"${t.font}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    r.style.setProperty("--font-ui", stack);
    document.body.style.fontFamily = stack;
    r.style.setProperty("--radius", t.radius + "px");
    r.style.setProperty("--radius-sm", Math.max(6, t.radius - 6) + "px");
  }, [theme, t.accent, t.font, t.radius, t.density, ocultar, contraste]);
  useEffect(() => {
    const h = (window.location.hash || "").replace("#", "");
    if (!h) return;
    if (["funcionalidades", "como-funciona", "moedas", "sobre", "vantagens"].includes(h)) {
      let tries = 0;
      const tryScroll = () => {
        const el = document.getElementById(h);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        if (tries++ < 12) setTimeout(tryScroll, 80);
      };
      tryScroll();
    }
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);
  const go = (id) => {
    var _a;
    setRoute(ROUTE_ALIASES[id] || id);
    (_a = document.querySelector(".main")) == null ? void 0 : _a.scrollTo(0, 0);
  };
  const open = (type, item) => setModal({ type, item });
  const panel = /* @__PURE__ */ React.createElement(TweaksPanel, { open: tweaksOpen, onOpenChange: setTweaksOpen }, /* @__PURE__ */ React.createElement(TweakSection, { label: "Tema" }), /* @__PURE__ */ React.createElement(TweakToggle, { label: "Modo escuro", value: t.dark, onChange: (v) => setTweak("dark", v) }), /* @__PURE__ */ React.createElement(TweakColor, { label: "Cor de acento", value: t.accent, options: ["#14a06b", "#0f6fff", "#7a5ae0", "#0f2540", "#e0792b"], onChange: (v) => setTweak("accent", v) }), /* @__PURE__ */ React.createElement(TweakSection, { label: "Tipografia" }), /* @__PURE__ */ React.createElement(TweakSelect, { label: "Tipo de letra", value: t.font, options: ["Inter", "Manrope", "Poppins", "Plus Jakarta Sans", "Montserrat", "Comfortaa", "Quicksand"], onChange: (v) => setTweak("font", v) }), /* @__PURE__ */ React.createElement(TweakSection, { label: "Layout" }), /* @__PURE__ */ React.createElement(TweakRadio, { label: "Densidade", value: t.density, options: ["compact", "regular", "comfy"], onChange: (v) => setTweak("density", v) }), /* @__PURE__ */ React.createElement(TweakSlider, { label: "Cantos", value: t.radius, min: 4, max: 24, step: 2, unit: "px", onChange: (v) => setTweak("radius", v) }), /* @__PURE__ */ React.createElement(TweakToggle, { label: "Contraste alto", value: contraste, onChange: (v) => setTweak("contraste", v) }), /* @__PURE__ */ React.createElement(TweakSection, { label: "Privacidade" }), /* @__PURE__ */ React.createElement(TweakToggle, { label: "Ocultar valores", value: ocultar, onChange: (v) => setTweak("ocultar", v) }));
  if (!fin.session) {
    if (authView === "signup") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Onboarding, { onBack: () => setAuthView(null), onLogin: () => setAuthView("login") }), panel);
    if (authView) return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Auth, { initialMode: authView, onBack: () => setAuthView(null), onSignup: () => setAuthView("signup") }), panel);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Landing, { onCreate: () => setAuthView("signup"), onLogin: () => setAuthView("login"), theme, setTheme, lang, setLang, tr }), panel);
  }
  const P = PAGES[route] || {};
  const TITULOS = {
    dashboard: "Vis\xE3o geral financeira",
    transacoes: "Transa\xE7\xF5es",
    objetivos: "Objetivos",
    agenda: "Agenda Financeira",
    partilha: "Partilha",
    previsao: "Previs\xE3o",
    premium: "Rende+ Premium",
    contas: tr("lbl_accounts"),
    relatorios: tr("lbl_reports"),
    config: tr("lbl_settings"),
    perfil: tr("lbl_profile")
  };
  const pageTitle = TITULOS[route] || "Painel";
  const ehPremium = !!(fin.account && fin.account.plano === "premium");
  const subByRoute = {
    dashboard: "Acompanhe a sua vida financeira em tempo real.",
    transacoes: "Receitas, despesas e movimentos \xB7 " + fin.monthLabel,
    objetivos: tr("sub_poupanca"),
    agenda: "Lembretes, recorrentes e pagamentos futuros.",
    partilha: "Divida despesas e acompanhe os seus grupos.",
    contas: tr("sub_contas"),
    relatorios: tr("sub_relatorios"),
    config: tr("sub_config"),
    perfil: tr("sub_perfil")
  };
  const showMonthNav = ["dashboard", "transacoes", "relatorios"].includes(route);
  return /* @__PURE__ */ React.createElement("div", { className: "app" + (sbCollapsed ? " sb-collapsed" : "") }, pagamentoMsg && /* @__PURE__ */ React.createElement("div", { onClick: () => setPagamentoMsg(""), style: { position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999, maxWidth: 460, width: "calc(100% - 32px)", background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", boxShadow: "0 12px 40px rgba(0,0,0,.18)", padding: "13px 16px", display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" } }, /* @__PURE__ */ React.createElement(Icon, { name: "spark", size: 18, color: "var(--accent)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13.5, fontWeight: 600, lineHeight: 1.5 } }, pagamentoMsg)), /* @__PURE__ */ React.createElement(Sidebar, { route, go, account: fin.account, collapsed: sbCollapsed, onToggle: toggleSidebar }), /* @__PURE__ */ React.createElement("div", { className: "main" }, /* @__PURE__ */ React.createElement(Topbar, { theme, setTheme, onLogout: fin.logout, go }), /* @__PURE__ */ React.createElement(
    PageIntro,
    {
      route,
      account: fin.account,
      title: pageTitle,
      sub: subByRoute[route],
      monthNav: showMonthNav ? /* @__PURE__ */ React.createElement(
        MonthNav,
        {
          label: fin.monthLabel,
          onPrev: () => fin.shiftMonth(-1),
          onNext: () => fin.shiftMonth(1),
          canNext: !fin.isCurrentMonth,
          isCurrent: fin.isCurrentMonth,
          onToday: fin.goToday
        }
      ) : null
    }
  ), route === "dashboard" && /* @__PURE__ */ React.createElement(Dashboard, { go, open }), route === "transacoes" && /* @__PURE__ */ React.createElement(Transacoes, { open }), route === "objetivos" && /* @__PURE__ */ React.createElement(Poupanca, { open }), route === "agenda" && (ehPremium ? /* @__PURE__ */ React.createElement(AgendaFinanceira, null) : /* @__PURE__ */ React.createElement(Paywall, null)), route === "partilha" && (ehPremium ? /* @__PURE__ */ React.createElement(Partilha, null) : /* @__PURE__ */ React.createElement(Paywall, null)), route === "contas" && /* @__PURE__ */ React.createElement(Contas, { open }), route === "relatorios" && /* @__PURE__ */ React.createElement(Relatorios, { open }), route === "perfil" && /* @__PURE__ */ React.createElement(Perfil, { open, go }), route === "config" && /* @__PURE__ */ React.createElement(Definicoes, { theme, setTheme, open, go, onOpenTweaks: () => setTweaksOpen(true), contraste, setContraste: (v) => setTweak("contraste", v) }), route === "previsao" && (ehPremium ? /* @__PURE__ */ React.createElement(Previsao, null) : /* @__PURE__ */ React.createElement(Paywall, null)), route === "premium" && /* @__PURE__ */ React.createElement(Paywall, null)), /* @__PURE__ */ React.createElement(MobileNav, { route, go, onAdd: () => open(P.add || "despesa"), onMore: () => setMoreOpen(true) }), moreOpen && /* @__PURE__ */ React.createElement(MoreSheet, { route, go, account: fin.account, onClose: () => setMoreOpen(false), theme, setTheme, onLogout: fin.logout }), modal && /* @__PURE__ */ React.createElement(EntryModal, { type: modal.type, item: modal.item, onClose: () => setModal(null) }), /* @__PURE__ */ React.createElement(LockGate, { active: !!fin.session }), /* @__PURE__ */ React.createElement(AssistenteFinanceiro, { go }), novaVersao && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", left: "50%", bottom: 20, transform: "translateX(-50%)", zIndex: 9999, maxWidth: 440, width: "calc(100% - 32px)", background: "var(--navy)", color: "#fff", borderRadius: "var(--radius-sm)", boxShadow: "0 12px 40px rgba(0,0,0,.28)", padding: "13px 16px", display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { style: { display: "flex", gap: 10, alignItems: "center", fontSize: 13.5, fontWeight: 600 } }, /* @__PURE__ */ React.createElement(Icon, { name: "spark", size: 18, color: "var(--accent)" }), "Nova vers\xE3o dispon\xEDvel (", novaVersao, ")."), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", style: { padding: "8px 14px", fontSize: 13, border: "none", flex: "none" }, onClick: () => window.location.reload() }, "Atualizar")), panel);
}
function App() {
  return /* @__PURE__ */ React.createElement(FinanceProvider, null, /* @__PURE__ */ React.createElement(Shell, null));
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
