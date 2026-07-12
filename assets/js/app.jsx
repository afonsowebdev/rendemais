/* ===== App shell: routing, tema, tweaks, modais funcionais ===== */

// Versão atual da app. Ao lançar uma versão nova, sobe este número E o version.json.
const APP_VERSION = "1.0.0";
window.APP_VERSION = APP_VERSION;

// Hooks de idioma — fonte única no store global I18N. Qualquer ecrã chama useT().
function useLang() {
  const [lang, setLang] = React.useState(I18N.getLang());
  React.useEffect(() => I18N.subscribe(setLang), []);
  return [lang, I18N.setLangGlobal];
}
function useT() {
  const [lang] = useLang();
  return I18N.make(lang);
}
function tfmt(s, vars) { if (vars) Object.keys(vars).forEach((k) => { s = s.split("{" + k + "}").join(vars[k]); }); return s; }
window.useLang = useLang;
window.useT = useT;
window.tfmt = tfmt;
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#14a06b",
  "dark": false,
  "font": "Inter",
  "radius": 16,
  "density": "regular"
}/*EDITMODE-END*/;

const PAGES = {
  dashboard: { title: "Dashboard", add: "despesa" },
  despesas: { title: "Despesas", add: "despesa" },
  rendimentos: { title: "Rendimentos", add: "rendimento" },
  poupanca: { title: "Poupança", add: "meta" },
  perfil: { title: "Perfil", add: null },
  contas: { title: "Contas", add: null },
  relatorios: { title: "Relatórios", add: null },
  historico: { title: "Histórico", add: null },
  config: { title: "Definições", add: null },
};
const ADD_LABEL = { despesa: "Nova despesa", rendimento: "Novo rendimento", meta: "Nova meta" };
const META_CORES = ["var(--c-educacao)", "var(--c-alimentacao)", "var(--c-habitacao)", "var(--c-transporte)", "var(--c-lazer)", "var(--c-internet)"];
const CAT_ICONS = ["cart", "bag", "coffee", "food", "car", "fuel", "bus", "train", "plane", "bike", "home", "key", "bulb", "droplet", "flame", "wifi", "cross", "pill", "heart", "cap", "book", "briefcase", "film", "music", "game", "tv", "dumbbell", "shirt", "scissors", "gift", "tag", "paw", "phone", "tools", "umbrella", "leaf", "bank", "wallet", "card", "coins", "sack", "receipt", "chart", "target", "flag", "spark", "bolt", "cal", "bell"];
const CAT_EMOJIS = ["🛒", "🍔", "🍕", "☕", "🍺", "🥖", "🥗", "🍣", "🍜", "🥤", "🧋", "🍦", "🧀", "🥩", "🍳", "🥫", "🍫", "🥦", "🍓", "🥚", "🍌", "🍎", "🎂", "🍷", "🏠", "🚿", "🛋️", "🛏️", "🧹", "🧼", "🔌", "🪑", "💡", "💧", "⚡", "🚰", "🔧", "🛠️", "🌱", "🚗", "⛽", "🚌", "✈️", "🚆", "🚇", "🚕", "🚲", "🛵", "🛴", "🅿️", "🎫", "🏥", "💊", "🩺", "💉", "🩹", "🦷", "👓", "🪥", "🧠", "🎓", "📚", "💻", "📱", "📞", "🌐", "💼", "📝", "📅", "🖥️", "🎮", "🎬", "🎵", "🎨", "🎟️", "📷", "⚽", "🎲", "🎸", "🎧", "🏋️", "🧘", "🏖️", "🏕️", "🎉", "💇", "✂️", "💅", "🧖", "👕", "🎁", "🐕", "🐈", "🐾", "🐠", "👶", "🍼", "🧸", "💳", "🏦", "📈", "💰", "🧾", "💶", "💵", "🪙", "💸", "🏧", "🤑", "🎯", "❤️", "☂️", "🔑", "📦", "♻️", "🧳", "🌷"];
const CAT_COLORS = ["var(--c-habitacao)", "var(--c-alimentacao)", "var(--c-transporte)", "var(--c-educacao)", "var(--c-lazer)", "var(--c-internet)", "var(--c-saude)", "var(--c-outros)"];

/* ---------- Criador inline de categoria personalizada ---------- */
function NewCategoryInline({ onCreate, onCancel }) {
  const fin = useFinance();
  const [nome, setNome] = useState("");
  const [icon, setIcon] = useState("cart");
  const [color, setColor] = useState(CAT_COLORS[0]);
  const [err, setErr] = useState("");
  const create = async () => {
    if (!nome.trim()) return setErr("Dá um nome à categoria.");
    const key = await fin.addCategory({ nome: nome.trim(), icon, color });
    if (key) onCreate(key);
  };
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 14, background: "var(--surface-2)", display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="row" style={{ gap: 8, fontWeight: 700, fontSize: 13.5 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: `color-mix(in srgb, ${color} 16%, transparent)` }}><Icon name={icon} size={15} color={color} sw={1.9} /></span>
          Nova categoria
        </span>
        <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={onCancel}><span style={{ transform: "rotate(45deg)", display: "grid" }}><Icon name="plus" size={15} color="var(--ink-2)" /></span></button>
      </div>
      <input className="input" autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da categoria (ex: Ginásio)" />
      <div>
        <div className="tiny muted" style={{ fontWeight: 700, marginBottom: 6 }}>Ícone</div>
        <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
          {CAT_ICONS.map((ic) => (
            <button key={ic} onClick={() => setIcon(ic)} style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", border: icon === ic ? `2px solid ${color}` : "1px solid var(--border-strong)", background: icon === ic ? `color-mix(in srgb, ${color} 14%, transparent)` : "var(--surface)", cursor: "pointer" }}>
              <Icon name={ic} size={17} color={icon === ic ? color : "var(--ink-2)"} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="tiny muted" style={{ fontWeight: 700, marginBottom: 6 }}>Ou escolhe um emoji</div>
        <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
          {CAT_EMOJIS.map((em) => (
            <button key={em} onClick={() => setIcon(em)} style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", fontSize: 18, lineHeight: 1, border: icon === em ? `2px solid ${color}` : "1px solid var(--border-strong)", background: icon === em ? `color-mix(in srgb, ${color} 14%, transparent)` : "var(--surface)", cursor: "pointer" }}>
              {em}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="tiny muted" style={{ fontWeight: 700, marginBottom: 6 }}>Cor</div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {CAT_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: 8, background: c, border: color === c ? "2.5px solid var(--ink)" : "2.5px solid transparent", cursor: "pointer" }} />
          ))}
        </div>
      </div>
      {err && <div className="tiny" style={{ color: "var(--neg)", fontWeight: 700 }}>{err}</div>}
      <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={create}><Icon name="check" size={14} color="#fff" /> Adicionar categoria</button>
      </div>
    </div>
  );
}

/* ---------- Modal de entrada (despesa / rendimento / meta / depósito / orçamento / perfil) ---------- */
function EntryModal({ type, item, onClose }) {
  const fin = useFinance();
  const catKeys = Object.keys(BM.cats);
  const incKeys = Object.keys(BM.incomeCats);
  const editing = !!item;

  const seed = () => {
    if (type === "despesa") return { nome: item?.nome || "", valor: item?.valor ?? "", data: item?.data || BM.todayISO(), cat: item?.cat || "alimentacao", tipo: item?.tipo || "variavel" };
    if (type === "rendimento") return { fonte: item?.fonte || "", valor: item?.valor ?? "", data: item?.data || BM.todayISO(), cat: item?.cat || "Salário", rec: item?.rec ?? true };
    if (type === "meta") return { nome: item?.nome || "", alvo: item?.alvo ?? "", atual: item?.atual ?? 0, cor: item?.cor || META_CORES[0] };
    if (type === "deposit") return { valor: "", inicial: false };
    if (type === "orcamento") return { valor: fin.data.orcamento ?? "" };
    if (type === "sync") { const movs = (BM.bancos[item?.banco] || {}).importar || []; return { sel: movs.map(() => true) }; }
    if (type === "reservar") return { modo: fin.data.metas.length ? "existente" : "nova", metaId: fin.data.metas[0]?.id || "", nome: "" };
    if (type === "perfil") { const a = fin.account || {}; return { nome: a.nome || "", nascimento: a.dataNascimento || a.nascimento || "", cidade: a.cidade || "", perfil: a.perfil || "Estudante", estado: a.estado || "Solteiro(a)", habitacao: a.habitacao || "Vive com colegas", foto: a.foto || null }; }
    return {};
  };
  const [f, setF] = useState(seed);
  const [err, setErr] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const num = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; };
  // idade em anos completos a partir de AAAA-MM-DD (ou null)
  const calcIdade = (iso) => { if (!iso) return null; const n = new Date(iso + "T00:00:00"); if (isNaN(n.getTime())) return null; const h = new Date(); let i = h.getFullYear() - n.getFullYear(); const m = h.getMonth() - n.getMonth(); if (m < 0 || (m === 0 && h.getDate() < n.getDate())) i--; return i; };
  // data de nascimento bloqueada (o servidor é a fonte de verdade)
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
      const amount = item?.amount || 0;
      if (f.modo === "existente") {
        if (!f.metaId) return setErr("Escolhe uma poupança.");
        fin.deposit(f.metaId, amount);
      } else {
        if (!f.nome.trim()) return setErr("Dá um nome à nova poupança.");
        fin.meta.add({ nome: f.nome.trim(), alvo: 0, atual: amount, cor: META_CORES[fin.data.metas.length % META_CORES.length] });
      }
    } else if (type === "perfil") {
      if (!f.nome.trim()) return setErr("O nome não pode ficar vazio.");
      if (!nascBloqueado && f.nascimento) {
        const idade = calcIdade(f.nascimento);
        if (idade == null) return setErr("Data de nascimento inválida.");
        if (idade < 16) return setErr("Tens de ter pelo menos 16 anos.");
      }
      const payload = { ...f };
      delete payload.nascimento;
      // só enviamos a data de nascimento se NÃO estiver bloqueada e tiver valor
      if (!nascBloqueado && f.nascimento) payload.dataNascimento = f.nascimento;
      fin.updateAccount(payload);
    }
    onClose();
  };

  const titles = {
    despesa: editing ? "Editar despesa" : "Nova despesa",
    rendimento: editing ? "Editar rendimento" : "Novo rendimento",
    meta: editing ? "Editar meta" : "Nova meta de poupança",
    deposit: "Depositar na meta",
    orcamento: "Orçamento mensal",
    sync: `Sincronizar ${item?.nome || "conta"}`,
    reservar: "Guardar na poupança",
    perfil: "Editar perfil",
  };

  return (
    <Modal title={titles[type]} sub={type === "deposit" ? item?.nome : type === "sync" ? "Sincronização verificada" : null} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}><Icon name="check" size={15} color="#fff" /> {type === "sync" ? "Importar" : type === "reservar" ? "Guardar" : "Guardar"}</button>
      </>}>

      {type === "despesa" && <>
        <Field label="Nome da despesa"><input className="input" autoFocus value={f.nome} onChange={set("nome")} placeholder="Ex: Compras supermercado" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={`Valor (${fin.curSym})`}><input className="input" type="number" step="0.01" value={f.valor} onChange={set("valor")} placeholder="0,00" /></Field>
          <Field label="Data de pagamento" hint="Quando a despesa é (ou foi) paga."><input className="input" type="date" value={f.data} onChange={set("data")} /></Field>
        </div>
        <Field label="Categoria"><select className="select" value={f.cat} onChange={set("cat")}>{catKeys.map((k) => <option key={k} value={k}>{BM.cats[k].nome}</option>)}</select></Field>
        {addingCat
          ? <NewCategoryInline onCreate={(key) => { setF((s) => ({ ...s, cat: key })); setAddingCat(false); }} onCancel={() => setAddingCat(false)} />
          : <button className="btn btn-soft" style={{ marginBottom: 14 }} onClick={() => setAddingCat(true)}><Icon name="plus" size={14} /> Adicionar nova categoria</button>}
        <Field label="Tipo de despesa" hint={f.tipo === "fixa" ? "Repete-se todos os meses (renda, propina…)." : "Gasto pontual (compras, lazer…)."}>
          <div className="seg" style={{ width: "fit-content" }}>
            <button className={f.tipo === "fixa" ? "on" : ""} onClick={() => setF((s) => ({ ...s, tipo: "fixa" }))}>Fixa</button>
            <button className={f.tipo === "variavel" ? "on" : ""} onClick={() => setF((s) => ({ ...s, tipo: "variavel" }))}>Variável</button>
          </div>
        </Field>
      </>}

      {type === "rendimento" && <>
        <Field label="Fonte"><input className="input" autoFocus value={f.fonte} onChange={set("fonte")} placeholder="Ex: Bolsa de estudo" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={`Valor (${fin.curSym})`}><input className="input" type="number" step="0.01" value={f.valor} onChange={set("valor")} placeholder="0,00" /></Field>
          <Field label="Data"><input className="input" type="date" value={f.data} onChange={set("data")} /></Field>
        </div>
        <Field label="Categoria"><select className="select" value={f.cat} onChange={set("cat")}>{incKeys.map((k) => <option key={k} value={k}>{k}</option>)}</select></Field>
        <Field label="Frequência" hint={f.rec ? "Recebes este valor todos os meses." : "Recebimento pontual."}>
          <div className="seg" style={{ width: "fit-content" }}>
            <button className={f.rec ? "on" : ""} onClick={() => setF((s) => ({ ...s, rec: true }))}>Recorrente</button>
            <button className={!f.rec ? "on" : ""} onClick={() => setF((s) => ({ ...s, rec: false }))}>Pontual</button>
          </div>
        </Field>
      </>}

      {type === "meta" && <>
        <Field label="Nome da meta"><input className="input" autoFocus value={f.nome} onChange={set("nome")} placeholder="Ex: Fundo de emergência" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={`Objetivo (${fin.curSym})`}><input className="input" type="number" step="1" value={f.alvo} onChange={set("alvo")} placeholder="1000" /></Field>
          <Field label={`Já poupado (${fin.curSym})`} hint="O que já tinhas — não desconta da receita."><input className="input" type="number" step="1" value={f.atual} onChange={set("atual")} placeholder="0" /></Field>
        </div>
        <Field label="Cor">
          <div className="row" style={{ gap: 8 }}>
            {META_CORES.map((c) => (
              <button key={c} onClick={() => setF((s) => ({ ...s, cor: c }))}
                style={{ width: 30, height: 30, borderRadius: 9, background: c, border: f.cor === c ? "2.5px solid var(--ink)" : "2.5px solid transparent", cursor: "pointer" }} />
            ))}
          </div>
        </Field>
      </>}

      {type === "deposit" && <>
        <Field label={`Valor a depositar (${fin.curSym})`} hint={(item?.alvo || 0) > 0 ? `Em falta: ${BM.eur0((item?.alvo || 0) - (item?.atual || 0))}` : `Acumulado: ${BM.eur0(item?.atual || 0)}`}>
          <input className="input" autoFocus type="number" step="0.01" value={f.valor} onChange={set("valor")} placeholder="0,00" />
        </Field>
        <label className="row" style={{ gap: 10, cursor: "pointer", fontSize: 12.5, fontWeight: 600, lineHeight: 1.4, marginTop: 2, color: "var(--ink-2)" }}>
          <input type="checkbox" checked={!!f.inicial} onChange={(e) => setF((s) => ({ ...s, inicial: e.target.checked }))} style={{ width: 17, height: 17, accentColor: "var(--accent)", flex: "none", marginTop: 1 }} />
          <span>Já tinha este valor poupado — adicionar à minha poupança <b>sem descontar</b> da receita deste mês.</span>
        </label>
      </>}

      {type === "orcamento" && <>
        <Field label={`Limite de gastos por mês (${fin.curSym})`} hint="Deixa a 0 para remover o limite.">
          <input className="input" autoFocus type="number" step="1" value={f.valor} onChange={set("valor")} placeholder="850" />
        </Field>
      </>}

      {type === "sync" && (() => {
        const movs = (BM.bancos[item.banco] || {}).importar || [];
        const toggle = (i) => setF((s) => ({ ...s, sel: s.sel.map((v, idx) => (idx === i ? !v : v)) }));
        const chosen = movs.filter((_, i) => f.sel[i]);
        const desp = chosen.filter((m) => m.kind === "despesa").reduce((s, m) => s + m.valor, 0);
        const rend = chosen.filter((m) => m.kind === "rendimento").reduce((s, m) => s + m.valor, 0);
        return (
          <>
            <div className="alert ok" style={{ marginBottom: 14, padding: "10px 12px", alignItems: "center" }}>
              <Icon name="check" size={16} color="var(--accent)" />
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>Detetámos {movs.length} {movs.length === 1 ? "movimento novo" : "movimentos novos"}. Confirma o que queres importar.</span>
            </div>
            <div className="list" style={{ marginBottom: 6 }}>
              {movs.map((m, i) => {
                const isDesp = m.kind === "despesa";
                return (
                  <label key={i} className="li" style={{ cursor: "pointer", gap: 12 }}>
                    <input type="checkbox" checked={!!f.sel[i]} onChange={() => toggle(i)}
                      style={{ width: 18, height: 18, accentColor: "var(--accent)", flex: "none" }} />
                    {isDesp ? <CatBadge catKey={m.cat} size={36} r={10} />
                      : <div className="li-ico" style={{ width: 36, height: 36, background: "var(--accent-soft)" }}><Icon name="arrowsDown" size={16} color="var(--accent)" sw={2} /></div>}
                    <div className="li-main">
                      <div className="li-title">{m.nome}</div>
                      <div className="li-sub">{isDesp ? `${(BM.cats[m.cat] || BM.cats.outros).nome} · ${m.tipo === "fixa" ? "Fixa" : "Variável"}` : m.cat}</div>
                    </div>
                    <div className="li-amt tnum" style={{ color: isDesp ? "var(--neg)" : "var(--accent)" }}>{isDesp ? "−" : "+"}{BM.eur(m.valor)}</div>
                  </label>
                );
              })}
            </div>
            <div className="card-pad" style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
              <span className="muted">A importar: {chosen.length} de {movs.length}</span>
              <span>{rend > 0 && <span style={{ color: "var(--accent)" }}>+{BM.eur(rend)} </span>}{desp > 0 && <span style={{ color: "var(--neg)" }}>−{BM.eur(desp)}</span>}</span>
            </div>
          </>
        );
      })()}

      {type === "reservar" && <>
        <div className="alert ok" style={{ marginBottom: 16, padding: "12px 14px", alignItems: "center" }}>
          <Icon name="target" size={18} color="var(--accent)" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Vais guardar <span className="tnum">{BM.eur(item?.amount || 0)}</span> da poupança deste mês.</span>
        </div>
        {fin.data.metas.length > 0 && (
          <div className="seg" style={{ width: "100%", marginBottom: 14 }}>
            <button style={{ flex: 1 }} className={f.modo === "existente" ? "on" : ""} onClick={() => setF((s) => ({ ...s, modo: "existente" }))}>Adicionar a existente</button>
            <button style={{ flex: 1 }} className={f.modo === "nova" ? "on" : ""} onClick={() => setF((s) => ({ ...s, modo: "nova" }))}>Criar nova</button>
          </div>
        )}
        {f.modo === "existente" && fin.data.metas.length > 0 ? (
          <Field label="Escolhe a poupança" hint="O valor é somado ao que já tens guardado.">
            <select className="select" value={f.metaId} onChange={set("metaId")}>
              {fin.data.metas.map((m) => <option key={m.id} value={m.id}>{m.nome} — {BM.eur0(m.atual)} acumulado</option>)}
            </select>
          </Field>
        ) : (
          <Field label="Nome da nova poupança" hint="Cria poupanças separadas para objetivos diferentes.">
            <input className="input" autoFocus value={f.nome} onChange={set("nome")} placeholder="Ex: Emergência, Viagem…" />
          </Field>
        )}
      </>}

      {type === "perfil" && <>
        <div className="row" style={{ gap: 16, marginBottom: 16 }}>
          {f.foto
            ? <img src={f.foto} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flex: "none" }} />
            : <div className="user-av" style={{ width: 64, height: 64, fontSize: 22, background: "var(--accent)" }}>{initials(f.nome)}</div>}
          <div className="row" style={{ gap: 8 }}>
            <label className="btn btn-ghost" style={{ cursor: "pointer" }}>
              <Icon name="camera" size={15} /> {f.foto ? "Mudar foto" : "Adicionar foto"}
              <input type="file" accept="image/*" onChange={onFoto} style={{ display: "none" }} />
            </label>
            {f.foto && <button className="btn btn-ghost" style={{ color: "var(--neg)" }} onClick={() => setF((s) => ({ ...s, foto: null }))}>Remover</button>}
          </div>
        </div>
        <Field label="Nome"><input className="input" value={f.nome} onChange={set("nome")} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Data de nascimento" hint={nascBloqueado ? "Já não pode ser alterada." : "Podes corrigi-la até 7 dias depois de a definires."}>
            {nascBloqueado ? (
              <div className="input" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-2)", cursor: "not-allowed", fontWeight: 700 }}>
                <span>{f.nascimento ? BM.fmtData(f.nascimento) : "—"}</span>
                <Icon name="lock" size={15} color="var(--muted)" />
              </div>
            ) : (
              <>
                <input className="input" type="date" value={f.nascimento} max={BM.todayISO()} onChange={(e) => setF((s) => ({ ...s, nascimento: e.target.value }))} />
                {calcIdade(f.nascimento) != null && (
                  <div className="tiny" style={{ marginTop: 7, fontWeight: 700, color: calcIdade(f.nascimento) < 16 ? "var(--neg)" : "var(--accent)" }}>
                    {calcIdade(f.nascimento) < 16 ? `Tens ${calcIdade(f.nascimento)} anos — a idade mínima é 16.` : `Tens ${calcIdade(f.nascimento)} anos.`}
                  </div>
                )}
              </>
            )}
          </Field>
          <Field label="Cidade"><input className="input" value={f.cidade} onChange={set("cidade")} /></Field>
        </div>
        <Field label="Situação"><select className="select" value={f.perfil} onChange={set("perfil")}>{["Estudante", "Trabalhador", "Estudante e Trabalhador"].map((o) => <option key={o}>{o}</option>)}</select></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Estado civil"><select className="select" value={f.estado} onChange={set("estado")}>{["Solteiro(a)", "Casado(a)"].map((o) => <option key={o}>{o}</option>)}</select></Field>
          <Field label="Habitação"><select className="select" value={f.habitacao} onChange={set("habitacao")}>{["Vive sozinho(a)", "Vive com colegas", "Vive com familiares", "Vive com cônjuge"].map((o) => <option key={o}>{o}</option>)}</select></Field>
        </div>
      </>}

      {err && <div className="alert bad" style={{ marginTop: 4, padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
    </Modal>
  );
}

/* ---------- App ---------- */
function Shell() {
  const fin = useFinance();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState("dashboard");
  const [authView, setAuthView] = useState(() => {
    const h = (window.location.hash || "").replace("#", "");
    if (h === "criar-conta") return "signup";
    if (h === "entrar") return "login";
    return null;
  }); // null = landing | "signup" | "login" — abre direto via /#criar-conta ou /#entrar
  const [modal, setModal] = useState(null); // { type, item }
  const [moreOpen, setMoreOpen] = useState(false);
  const [sbCollapsed, setSbCollapsed] = useState(() => { try { return localStorage.getItem("rende_sb") === "1"; } catch (e) { return false; } });
  const toggleSidebar = () => setSbCollapsed((v) => { const n = !v; try { localStorage.setItem("rende_sb", n ? "1" : "0"); } catch (e) {} return n; });
  const [lang, setLang] = useLang();
  const tr = I18N.make(lang);
  useEffect(() => { document.documentElement.setAttribute("lang", lang); }, [lang]);

  // Regresso do Stripe: se o URL trouxer ?pagamento=sucesso&session_id=..., confirmamos
  // o pagamento no backend (que pergunta ao Stripe) e ativamos o premium localmente.
  const [pagamentoMsg, setPagamentoMsg] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const estado = params.get("pagamento");
    const sessionId = params.get("session_id");
    const limparUrl = () => window.history.replaceState({}, "", window.location.pathname);
    if (estado === "sucesso" && sessionId && fin.session) {
      API.confirmarPagamento(sessionId)
        .then((r) => {
          if (r && r.premium) {
            fin.updateAccount({ plano: "premium", planoExpira: r.planoExpira || null });
            setPagamentoMsg("🎉 Bem-vindo ao Rende+ Premium! As funcionalidades estão desbloqueadas.");
            setRoute("premium");
          }
        })
        .catch(() => setPagamentoMsg("Recebemos o teu regresso, mas ainda não confirmámos o pagamento. Se já pagaste, atualiza daqui a instantes."))
        .finally(limparUrl);
    } else if (estado === "cancelado") {
      setPagamentoMsg("Pagamento cancelado. Podes tentar de novo quando quiseres.");
      limparUrl();
    }
  }, [fin.session]);

  // Verifica se há uma versão nova publicada (compara com o version.json do servidor).
  const [novaVersao, setNovaVersao] = useState(null);
  useEffect(() => {
    let vivo = true;
    const verificar = () => {
      fetch("/version.json?t=" + Date.now(), { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (vivo && d && d.version && d.version !== APP_VERSION) setNovaVersao(d.version); })
        .catch(() => {});
    };
    verificar();
    const iv = setInterval(verificar, 5 * 60 * 1000); // volta a verificar a cada 5 min
    return () => { vivo = false; clearInterval(iv); };
  }, []);

  const theme = t.dark ? "dark" : "light";
  const setTheme = (v) => setTweak("dark", v === "dark");
  const ocultar = !!t.ocultar;
  const toggleOcultar = () => setTweak("ocultar", !ocultar);

  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", theme);
    r.setAttribute("data-density", t.density);
    r.setAttribute("data-ocultar", ocultar ? "true" : "false");
    r.style.setProperty("--accent", t.accent);
    const stack = `"${t.font}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    r.style.setProperty("--font-ui", stack);
    document.body.style.fontFamily = stack;
    r.style.setProperty("--radius", t.radius + "px");
    r.style.setProperty("--radius-sm", Math.max(6, t.radius - 6) + "px");
  }, [theme, t.accent, t.font, t.radius, t.density, ocultar]);

  // Chegada com uma âncora de secção (ex.: /#funcionalidades, /#sobre):
  // faz scroll suave até à secção e limpa o "#" do endereço (URL fica limpo).
  useEffect(() => {
    const h = (window.location.hash || "").replace("#", "");
    if (!h) return;
    if (["funcionalidades", "como-funciona", "moedas", "sobre", "vantagens"].includes(h)) {
      let tries = 0;
      const tryScroll = () => {
        const el = document.getElementById(h);
        if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
        if (tries++ < 12) setTimeout(tryScroll, 80);
      };
      tryScroll();
    }
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  const go = (id) => { setRoute(id); document.querySelector(".main")?.scrollTo(0, 0); };
  const open = (type, item) => setModal({ type, item });

  const panel = (
    <TweaksPanel>
      <TweakSection label="Tema" />
      <TweakToggle label="Modo escuro" value={t.dark} onChange={(v) => setTweak("dark", v)} />
      <TweakColor label="Cor de acento" value={t.accent} options={["#14a06b", "#0f6fff", "#7a5ae0", "#0f2540", "#e0792b"]} onChange={(v) => setTweak("accent", v)} />
      <TweakSection label="Tipografia" />
      <TweakSelect label="Tipo de letra" value={t.font} options={["Inter", "Manrope", "Poppins", "Plus Jakarta Sans", "Montserrat", "Comfortaa", "Quicksand"]} onChange={(v) => setTweak("font", v)} />
      <TweakSection label="Layout" />
      <TweakRadio label="Densidade" value={t.density} options={["compact", "regular", "comfy"]} onChange={(v) => setTweak("density", v)} />
      <TweakSlider label="Cantos" value={t.radius} min={4} max={24} step={2} unit="px" onChange={(v) => setTweak("radius", v)} />
    </TweaksPanel>
  );

  if (!fin.session) {
    if (authView === "signup") return (<><Onboarding onBack={() => setAuthView(null)} onLogin={() => setAuthView("login")} />{panel}</>);
    if (authView) return (<><Auth initialMode={authView} onBack={() => setAuthView(null)} onSignup={() => setAuthView("signup")} />{panel}</>);
    return (<><Landing onCreate={() => setAuthView("signup")} onLogin={() => setAuthView("login")} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} tr={tr} />{panel}</>);
  }

  const P = PAGES[route] || {};
  const titleByRoute = { dashboard: "lbl_dashboard", despesas: "lbl_expenses", rendimentos: "lbl_income", poupanca: "lbl_savings", perfil: "lbl_profile", contas: "lbl_accounts", relatorios: "lbl_reports", historico: "lbl_history", config: "lbl_settings" };
  const PREM_TITULOS = { lembretes: "Lembretes", recorrentes: "Recorrentes", subscricoes: "Subscrições", partilha: "Partilha", previsao: "Previsão", premium: "Rende+ Premium" };
  const pageTitle = PREM_TITULOS[route] || tr(titleByRoute[route] || "lbl_dashboard");
  // portão de plano: quem tem premium ativo usa as funcionalidades; os outros veem o Paywall
  const ehPremium = !!(fin.account && fin.account.plano === "premium");
  const subByRoute = {
    dashboard: tfmt(tr("sub_dashboard"), { month: fin.monthLabel }),
    despesas: tfmt(tr("sub_despesas"), { month: fin.monthLabel }),
    rendimentos: tfmt(tr("sub_rendimentos"), { month: fin.monthLabel }),
    poupanca: tr("sub_poupanca"),
    perfil: tr("sub_perfil"),
    contas: tr("sub_contas"),
    relatorios: tr("sub_relatorios"),
    historico: tr("sub_historico"),
    config: tr("sub_config"),
  };
  const showMonthNav = ["dashboard", "despesas", "rendimentos", "relatorios"].includes(route);

  return (
    <div className={"app" + (sbCollapsed ? " sb-collapsed" : "")}>
      {pagamentoMsg && (
        <div onClick={() => setPagamentoMsg("")} style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999, maxWidth: 460, width: "calc(100% - 32px)", background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", boxShadow: "0 12px 40px rgba(0,0,0,.18)", padding: "13px 16px", display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
          <Icon name="spark" size={18} color="var(--accent)" />
          <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5 }}>{pagamentoMsg}</span>
        </div>
      )}
      <Sidebar route={route} go={go} account={fin.account} collapsed={sbCollapsed} onToggle={toggleSidebar} />
      <div className="main">
        <Topbar title={pageTitle} sub={subByRoute[route]} theme={theme} setTheme={setTheme} onLogout={fin.logout}
          ocultar={ocultar} onToggleOcultar={toggleOcultar}
          onAdd={P.add ? () => open(P.add) : null} addLabel={P.add ? tr("add_" + P.add) : null}
          monthNav={showMonthNav ? <MonthNav label={fin.monthLabel} onPrev={() => fin.shiftMonth(-1)} onNext={() => fin.shiftMonth(1)}
            canNext={!fin.isCurrentMonth} isCurrent={fin.isCurrentMonth} onToday={fin.goToday} /> : null} />
        {route === "dashboard" && <Dashboard go={go} open={open} />}
        {route === "despesas" && <Despesas open={open} />}
        {route === "rendimentos" && <Rendimentos open={open} />}
        {route === "poupanca" && <Poupanca open={open} />}
        {route === "contas" && <Contas open={open} />}
        {route === "relatorios" && <Relatorios />}
        {route === "historico" && <Historico />}
        {route === "perfil" && <Perfil open={open} />}
        {route === "config" && <Definicoes theme={theme} setTheme={setTheme} open={open} />}
        {route === "lembretes" && (ehPremium ? <Lembretes /> : <Paywall />)}
        {route === "recorrentes" && (ehPremium ? <Recorrentes /> : <Paywall />)}
        {route === "subscricoes" && (ehPremium ? <Subscricoes /> : <Paywall />)}
        {route === "partilha" && (ehPremium ? <Partilha /> : <Paywall />)}
        {route === "previsao" && (ehPremium ? <Previsao /> : <Paywall />)}
        {route === "premium" && <Paywall />}
      </div>
      <MobileNav route={route} go={go} onAdd={() => open(P.add || "despesa")} onMore={() => setMoreOpen(true)} />
      {moreOpen && <MoreSheet route={route} go={go} account={fin.account} onClose={() => setMoreOpen(false)} theme={theme} setTheme={setTheme} onLogout={fin.logout} />}
      {modal && <EntryModal type={modal.type} item={modal.item} onClose={() => setModal(null)} />}
      <LockGate active={!!fin.session} />
      {novaVersao && (
        <div style={{ position: "fixed", left: "50%", bottom: 20, transform: "translateX(-50%)", zIndex: 9999, maxWidth: 440, width: "calc(100% - 32px)", background: "var(--navy)", color: "#fff", borderRadius: "var(--radius-sm)", boxShadow: "0 12px 40px rgba(0,0,0,.28)", padding: "13px 16px", display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13.5, fontWeight: 600 }}>
            <Icon name="spark" size={18} color="var(--accent)" />
            Nova versão disponível ({novaVersao}).
          </span>
          <button className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 13, border: "none", flex: "none" }} onClick={() => window.location.reload()}>Atualizar</button>
        </div>
      )}
      {panel}
    </div>
  );
}

function App() {
  return <FinanceProvider><Shell /></FinanceProvider>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);