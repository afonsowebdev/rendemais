/* ===== Rende+ Premium: paywall + funcionalidades (lembretes, recorrentes, partilha, previsão) ===== */
/* Segue os padrões da app: usa useFinance, Icon, Modal, Field, EmptyState, BM.* e as classes/variáveis CSS existentes.
   Persistência local (localStorage) por utilizador. Quando o backend tiver endpoints, troca-se PremiumStore.* por API.*  */

const PremiumStore = (function () {
  let email = "anon";
  let state = null;
  const subs = new Set();
  const DEF = { premium: true, plano: "month", lembretes: [], recorrentes: [], grupos: [], subscricoes: [], pagosSub: {}, pagosRec: {}, notif: { ativo: true, aviso: 3 }, notifLog: {} };
  const KEY = () => "rende_premium_" + email;
  /* migração: junta subscrições + recorrentes antigos num modelo único
     recorrente = { id, nome, valor, dia, tipo: "subscricao"|"despesa", categoria, ciclo, estado, icon, color, desde, metodo } */
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
      const pr = { ...(o.pagosRec || {}) };
      Object.keys(o.pagosSub || {}).forEach((id) => { pr[id] = { ...(o.pagosSub[id] || {}), ...(pr[id] || {}) }; });
      o.pagosRec = pr; o.subscricoes = []; o.pagosSub = {};
    }
    o.recorrentes = recs;
    return mudou;
  };
  const read = () => {
    let o;
    try { o = { ...DEF, ...(JSON.parse(localStorage.getItem(KEY()) || "{}")) }; } catch (e) { o = { ...DEF }; }
    try { if (migra(o)) localStorage.setItem(KEY(), JSON.stringify(o)); } catch (e) {}
    return o;
  };
  const persist = () => { try { localStorage.setItem(KEY(), JSON.stringify(state)); } catch (e) {} };
  const emit = () => subs.forEach((f) => f(state));
  const get = () => state || (state = read());
  return {
    setUser(e) { const ne = e || "anon"; if (ne !== email) { email = ne; state = read(); } else if (!state) { state = read(); } },
    get,
    update(patch) { state = { ...get(), ...patch }; persist(); emit(); },
    add(kind, item) { this.update({ [kind]: [{ id: BM.uid(), ...item }, ...(get()[kind] || [])] }); },
    remove(kind, id) { this.update({ [kind]: (get()[kind] || []).filter((x) => x.id !== id) }); },
    edit(kind, id, patch) { this.update({ [kind]: (get()[kind] || []).map((x) => x.id === id ? { ...x, ...patch } : x) }); },
    activate(plano) { this.update({ premium: true, plano: plano || "month" }); },
    deactivate() { this.update({ premium: false }); },
    reset() { this.update({ lembretes: [], recorrentes: [], grupos: [], subscricoes: [], pagosSub: {}, pagosRec: {}, notifLog: {} }); },
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
  };
})();

function usePremium() {
  const fin = useFinance();
  const email = fin.account && fin.account.email;
  PremiumStore.setUser(email);
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => { PremiumStore.setUser(email); }, [email]);
  React.useEffect(() => PremiumStore.subscribe(() => force()), []);
  return PremiumStore;
}

const daysUntil = (iso) => Math.ceil((new Date(iso) - new Date(BM.todayISO())) / 86400000);
const numOf = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; };

/* ---------------- Paywall / planos ---------------- */
const PREM_FEATS = [
  { icon: "bell", t: "Lembretes de pagamento", d: "Avisamos-te antes de cada conta vencer." },
  { icon: "chart", t: "Previsão de saldo", d: "Vê como termina o mês antes de ele acabar." },
  { icon: "user", t: "Orçamentos partilhados", d: "Divide contas com quem vive contigo." },
  { icon: "sync", t: "Despesas recorrentes", d: "As que se repetem entram sozinhas." },
  { icon: "report", t: "Exportar dados", d: "Leva tudo em CSV quando quiseres." },
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
    setBusy(true); setErr("");
    try {
      // "month"/"year" (visual) -> "mensal"/"anual" (o que o backend espera)
      const resp = await API.criarCheckout(plano === "year" ? "anual" : "mensal");
      if (resp && resp.url) window.location.href = resp.url; // vai para a página do Stripe
      else { setErr("Não foi possível iniciar o pagamento."); setBusy(false); }
    } catch (e) { setErr(e.message || "Não foi possível iniciar o pagamento."); setBusy(false); }
  };

  if (ehPremium) {
    return (
      <div className="content">
        <div className="card card-pad prem-hero">
          <div className="prem-crown"><Icon name="spark" size={26} color="#fff" /></div>
          <div style={{ fontWeight: 700, fontSize: 19 }}>Premium ativo</div>
          <div className="muted" style={{ marginTop: 6, fontSize: 14 }}>Obrigado por apoiares o Rende+. Tens acesso a todas as funcionalidades.</div>
          {fin.account.planoExpira && <div className="tiny muted" style={{ marginTop: 8, fontWeight: 600 }}>Renova em {BM.fmtData(String(fin.account.planoExpira).slice(0, 10))}.</div>}
        </div>
      </div>
    );
  }

  const precos = { month: { v: "2,99 €", sub: "por mês" }, year: { v: "29,99 €", sub: "≈ 2,50 €/mês" } };
  return (
    <div className="content">
      <div className="card card-pad paywall">
        <div className="prem-crown"><Icon name="spark" size={26} color="#fff" /></div>
        <p className="muted" style={{ marginTop: 10, fontSize: 14 }}>Controla o teu dinheiro com superpoderes.</p>

        <div className="prem-feats">
          {PREM_FEATS.map((f) => (
            <div className="prem-feat" key={f.t}>
              <span className="pf-ico"><Icon name={f.icon} size={17} color="var(--accent)" /></span>
              <div><b>{f.t}</b><span>{f.d}</span></div>
            </div>
          ))}
        </div>

        <div className="prem-plans">
          <button className={"prem-plan" + (plano === "month" ? " on" : "")} onClick={() => setPlano("month")}>
            <div className="pp-n">MENSAL</div><div className="pp-v">2,99 €</div><div className="pp-s">por mês</div>
          </button>
          <button className={"prem-plan" + (plano === "year" ? " on" : "")} onClick={() => setPlano("year")}>
            <span className="pp-tag">POUPA 2 MESES</span>
            <div className="pp-n">ANUAL</div><div className="pp-v">29,99 €</div><div className="pp-s">≈ 2,50 €/mês</div>
          </button>
        </div>

        {err && <div className="alert bad" style={{ margin: "0 0 12px", padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
        <style>{`@keyframes rmaisSpin{to{transform:rotate(360deg)}}`}</style>
        <button className="btn btn-primary" disabled={busy} style={{ width: "100%", justifyContent: "center", padding: 15, fontSize: 15.5, border: "none", opacity: busy ? .8 : 1, cursor: busy ? "wait" : "pointer" }} onClick={irParaPagamento}>
          {busy && <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.45)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", marginRight: 8, animation: "rmaisSpin .6s linear infinite", verticalAlign: "-2px" }} />}
          {busy ? "A abrir pagamento…" : "Assinar " + (plano === "year" ? "plano anual" : "plano mensal")}
        </button>
        <p className="tiny muted" style={{ textAlign: "center", marginTop: 10, fontWeight: 600 }}>Pagamento seguro via Stripe · cancela quando quiseres · {precos[plano].sub}</p>
      </div>
    </div>
  );
}

/* Envolve um ecrã premium: mostra o paywall se ainda não for premium. */
function PremiumGate({ children }) {
  const prem = usePremium();
  if (!prem.get().premium) return <Paywall />;
  return children;
}

function PremActions({ label, onAdd }) {
  return (
    <div className="prem-actions">
      <button className="btn btn-primary" onClick={onAdd}><Icon name="plus" size={16} color="#fff" /> {label}</button>
    </div>
  );
}

/* ---------------- Lembretes ---------------- */
function LembreteModal({ item, onClose, onSave }) {
  const catKeys = Object.keys(BM.cats);
  const [f, setF] = React.useState(() => ({ titulo: item?.titulo || "", valor: item?.valor ?? "", data: item?.data || BM.todayISO(), aviso: item?.aviso ?? 3, cat: item?.cat || "outros", repete: item?.repete || false }));
  const [err, setErr] = React.useState("");
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const guardar = () => {
    if (!f.titulo.trim()) return setErr("Dá um nome ao lembrete.");
    if (numOf(f.valor) <= 0) return setErr("Indica um valor válido.");
    onSave({ titulo: f.titulo.trim(), valor: numOf(f.valor), data: f.data, aviso: +f.aviso, cat: f.cat, repete: !!f.repete });
  };
  return (
    <Modal title={item ? "Editar lembrete" : "Novo lembrete"} sub="Cria um aviso para não te esqueceres de pagar." icon="bell" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={guardar}><Icon name="check" size={14} color="#fff" /> Guardar</button></>}>
      <Field label="Nome"><input className="input" autoFocus value={f.titulo} onChange={set("titulo")} placeholder="Ex: Renda, Netflix…" /></Field>
      <div className="modal-row-2">
        <Field label="Valor" icon="coins"><input className="input" inputMode="decimal" value={f.valor} onChange={set("valor")} placeholder="0,00" /></Field>
        <Field label="Categoria"><select className="select" value={f.cat} onChange={set("cat")}>{catKeys.map((k) => <option key={k} value={k}>{BM.cats[k].nome}</option>)}</select></Field>
      </div>
      <div className="modal-row-2">
        <Field label="Data de vencimento"><input className="input" type="date" value={f.data} onChange={set("data")} /></Field>
        <Field label="Avisar antes">
          <select className="select" value={f.aviso} onChange={set("aviso")}>
            {[1, 2, 3, 5, 7].map((d) => <option key={d} value={d}>{d} dia{d > 1 ? "s" : ""} antes</option>)}
          </select>
        </Field>
      </div>
      <label className="prem-check"><input type="checkbox" checked={f.repete} onChange={(e) => setF((s) => ({ ...s, repete: e.target.checked }))} /> <span>Repetir todos os meses <span className="muted">(ao pagar, reagenda para o mês seguinte)</span></span></label>
      {err && <div className="alert bad" style={{ padding: "9px 12px", marginTop: 14 }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
    </Modal>
  );
}

function Lembretes() {
  return <PremiumGate><LembretesInner /></PremiumGate>;
}
function LembretesInner() {
  const prem = usePremium();
  const todos = [...(prem.get().lembretes || [])].sort((a, b) => (a.data || "").localeCompare(b.data || ""));
  const [modal, setModal] = React.useState(null);
  const [filtro, setFiltro] = React.useState("pendentes");
  const addMonths = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10); };

  const pendentes = todos.filter((l) => !l.pago);
  const atrasados = pendentes.filter((l) => daysUntil(l.data) < 0);
  const pagos = todos.filter((l) => l.pago);
  const totalPendente = pendentes.reduce((s, l) => s + (+l.valor || 0), 0);
  const totalAtrasado = atrasados.reduce((s, l) => s + (+l.valor || 0), 0);
  const totalPago = pagos.reduce((s, l) => s + (+l.valor || 0), 0);

  const lista = filtro === "pagos" ? pagos : filtro === "atrasados" ? atrasados : filtro === "todos" ? todos : pendentes;
  const marcarPago = (l) => { if (l.repete) prem.edit("lembretes", l.id, { data: addMonths(l.data, 1) }); else prem.edit("lembretes", l.id, { pago: true }); };

  // Uma faixa só de números (informação) + chips por baixo para filtrar — antes
  // havia dois controlos diferentes a mexer no mesmo filtro (cartões clicáveis
  // e chips), o que confundia mais do que ajudava.
  const stats = [
    { lbl: "Por pagar", val: BM.eur(totalPendente), sub: pendentes.length + " lembrete" + (pendentes.length === 1 ? "" : "s") },
    { lbl: "Atrasados", val: BM.eur(totalAtrasado), sub: atrasados.length + " em atraso", tone: atrasados.length > 0 ? "neg" : undefined },
    { lbl: "Pagos", val: BM.eur(totalPago), sub: pagos.length + " concluído" + (pagos.length === 1 ? "" : "s"), tone: "pos" },
  ];

  return (
    <div className="content">
      <PremActions label="Novo lembrete" onAdd={() => setModal({})} />
      {todos.length === 0 ? (
        <EmptyState icon="bell" title="Sem lembretes" msg="Cria um lembrete e avisamos-te antes de cada conta vencer."
          action={<button className="btn btn-primary" onClick={() => setModal({})}><Icon name="plus" size={16} color="#fff" /> Criar lembrete</button>} />
      ) : (
        <>
          <div className="card ph-statsbar">
            {stats.map((s, i) => (
              <div className="ph-stat" key={i}>
                <div className="ph-stat-lbl">{s.lbl}</div>
                <div className={"ph-stat-val" + (s.tone ? " " + s.tone : "")}>{s.val}</div>
                <div className="ph-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {[["pendentes", "Por pagar"], ["atrasados", "Atrasados"], ["pagos", "Pagos"], ["todos", "Todos"]].map(([id, lbl]) => (
              <button key={id} className={"chip" + (filtro === id ? " sel" : "")} onClick={() => setFiltro(id)} style={{ cursor: "pointer" }}>{lbl}</button>
            ))}
          </div>

          {lista.length === 0 ? (
            <div className="card card-pad muted" style={{ textAlign: "center", fontSize: 13.5, fontWeight: 600 }}>Nada nesta lista.</div>
          ) : (
            <div className="card card-pad">
              {lista.map((l) => {
                const d = daysUntil(l.data);
                const pago = l.pago;
                const late = !pago && d < 0;
                const soon = !pago && d >= 0 && d <= (l.aviso || 3);
                const cat = BM.cats[l.cat] || BM.cats.outros;
                return (
                  <div className={"prem-row" + (late ? " is-late" : soon ? " is-soon" : "")} key={l.id}>
                    <span className="prem-rico" style={{ background: `color-mix(in srgb, ${cat.color} 14%, transparent)` }}><Icon name={cat.icon} size={18} color={cat.color} /></span>
                    <div className="prem-rtxt">
                      <b style={pago ? { textDecoration: "line-through", opacity: .55 } : null}>{l.titulo} {l.repete && <Icon name="repeat" size={13} color="var(--ink-3)" />}</b>
                      {pago ? <span className="pill-day done">pago</span> : <span className={"pill-day" + (late ? " late" : soon ? " soon" : "")}>{d < 0 ? Math.abs(d) + " dia" + (d === -1 ? "" : "s") + " em atraso" : d === 0 ? "vence hoje" : "vence em " + d + " dia" + (d > 1 ? "s" : "")}</span>}
                    </div>
                    <div className="prem-ramt">{BM.eur(l.valor)}</div>
                    <div className="prem-rbtns">
                      {pago
                        ? <button className="icon-btn" title="Marcar por pagar" onClick={() => prem.edit("lembretes", l.id, { pago: false })}><Icon name="refresh" size={16} /></button>
                        : <button className="icon-btn" title={l.repete ? "Pagar e reagendar" : "Marcar como pago"} onClick={() => marcarPago(l)}><Icon name="check" size={16} color="var(--accent)" /></button>}
                      <button className="icon-btn" title="Apagar" onClick={() => prem.remove("lembretes", l.id)}><Icon name="trash" size={16} color="var(--neg)" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {modal && <LembreteModal item={modal.id ? modal : null} onClose={() => setModal(null)} onSave={(it) => { prem.add("lembretes", it); setModal(null); }} />}
    </div>
  );
}

/* ---------------- Recorrentes (gestor unificado: subscrições + despesas periódicas) ---------------- */
function Recorrentes() { return <PremiumGate><SubscricoesInner /></PremiumGate>; }

/* ---------------- Agenda Financeira (Lembretes + Recorrentes + Calendário, num só ecrã) ----------------
   Reaproveita LembretesInner (com "variant" para pré-filtrar sem duplicar a lógica),
   SubscricoesInner e SubCalendario tal como já existem — não recria nada. */
function AgendaFinanceira() { return <PremiumGate><AgendaFinanceiraInner /></PremiumGate>; }
// De 5 para 3 separadores: "Hoje"/"Próximos"/"Concluídos" eram 3 vistas do mesmo
// LembretesInner, que já tem os seus próprios chips de filtro (Por pagar/Atrasados/
// Pagos/Todos) — juntá-los num só "Lembretes" tira um nível de navegação sem perder
// nenhum filtro (é só um clique num chip em vez de um separador).
function AgendaFinanceiraInner() {
  const prem = usePremium();
  const [tab, setTab] = React.useState("lembretes");
  const recorrentes = prem.get().recorrentes || [];
  const TABS = [["lembretes", "Lembretes"], ["recorrentes", "Recorrentes"], ["calendario", "Calendário"]];
  return (
    <>
      <div className="content" style={{ paddingBottom: 0 }}>
        <div className="pg-tabs" style={{ width: "fit-content" }}>
          {TABS.map(([id, lbl]) => (
            <button type="button" key={id} className={"pg-tab" + (tab === id ? " on" : "")} onClick={() => setTab(id)}>{lbl}</button>
          ))}
        </div>
      </div>
      {tab === "recorrentes" ? (
        <SubscricoesInner />
      ) : tab === "calendario" ? (
        <div className="content"><SubCalendario subs={recorrentes} /></div>
      ) : (
        <LembretesInner />
      )}
    </>
  );
}

/* ---------------- Partilha (orçamentos partilhados) ---------------- */
const nomeDeEmail = (e) => { const p = ((e || "").split("@")[0] || "").replace(/[._-]/g, " "); return p.split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : "")).join(" ").trim() || e; };
function GrupoModal({ grupo, onClose, onSave }) {
  const editing = !!grupo;
  const [nome, setNome] = React.useState(editing ? (grupo.nome || "") : "");
  const [descricao, setDescricao] = React.useState(editing ? (grupo.descricao || "") : "");
  const [email, setEmail] = React.useState("");
  const [convidados, setConvidados] = React.useState([]); // [{ email, nome }]
  const [err, setErr] = React.useState("");
  const addConvidado = () => {
    const v = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(v)) return setErr("Escreve um email válido.");
    if (convidados.some((c) => c.email === v)) return setErr("Esse email já foi adicionado.");
    setConvidados((a) => [...a, { email: v, nome: nomeDeEmail(v) }]); setEmail(""); setErr("");
  };
  const guardar = () => {
    if (!nome.trim()) return setErr("Dá um nome ao grupo.");
    if (editing) { onSave({ nome: nome.trim(), descricao: descricao.trim() }); return; }
    const membros = convidados.map((c) => c.nome);
    const convites = convidados.map((c) => ({ email: c.email, nome: c.nome, estado: "pendente" }));
    onSave({ nome: nome.trim(), descricao: descricao.trim(), membros, convites, despesas: [] });
  };
  return (
    <Modal title={editing ? "Editar grupo" : "Novo grupo"} sub="Divide despesas com quem partilha contigo." icon="users" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={guardar}><Icon name="check" size={14} color="#fff" /> {editing ? "Guardar" : "Criar grupo"}</button></>}>
      <Field label="Nome do grupo"><input className="input" autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Casa do Porto, Viagem…" /></Field>
      <Field label="Descrição" hint="opcional"><input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Renda e contas da casa" /></Field>
      {!editing && (
        <Field label="Convidar por email" hint="Adiciona um de cada vez. Tu (Eu) já estás incluído.">
          <div className="row" style={{ gap: 8 }}>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addConvidado(); } }} placeholder="email@exemplo.com" />
            <button type="button" className="btn btn-soft" style={{ flex: "none" }} onClick={addConvidado}><Icon name="plus" size={14} /> Adicionar</button>
          </div>
        </Field>
      )}
      {!editing && convidados.length > 0 && (
        <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {convidados.map((c) => (
            <span key={c.email} className="chip" style={{ gap: 7 }}>{c.nome}
              <button type="button" onClick={() => setConvidados((a) => a.filter((x) => x.email !== c.email))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "grid", color: "var(--ink-3)" }}><span style={{ transform: "rotate(45deg)", display: "grid" }}><Icon name="plus" size={13} color="var(--ink-3)" /></span></button>
            </span>
          ))}
        </div>
      )}
      {err && <div className="alert bad" style={{ padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
    </Modal>
  );
}
const ESTADOS = [{ id: "pendente", label: "Pendente" }, { id: "pago", label: "Pago" }, { id: "confirmado", label: "Confirmado" }];
function estadoPill(estado) {
  const map = { pendente: ["pend", "Pendente"], pago: ["pago", "Pago"], confirmado: ["conf", "Confirmado"] };
  const [cls, lbl] = map[estado || "pendente"] || map.pendente;
  return <span className={"pg-estado " + cls}>{lbl}</span>;
}
function lerAnexo(file) {
  return new Promise((resolve, reject) => {
    if (file.type === "application/pdf") {
      if (file.size > 2.4 * 1024 * 1024) return reject("PDF demasiado grande (máx. ~2,4 MB nesta versão local).");
      const r = new FileReader();
      r.onload = () => resolve({ nome: file.name, tipo: file.type, dados: r.result });
      r.onerror = () => reject("Não consegui ler o ficheiro.");
      r.readAsDataURL(file);
    } else if (/^image\//.test(file.type)) {
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 1280; let w = img.width, h = img.height;
          if (w > max || h > max) { const s = max / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
          const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
          cv.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve({ nome: file.name, tipo: "image/jpeg", dados: cv.toDataURL("image/jpeg", 0.82) });
        };
        img.onerror = () => reject("Imagem inválida.");
        img.src = r.result;
      };
      r.onerror = () => reject("Não consegui ler a imagem.");
      r.readAsDataURL(file);
    } else { reject("Só imagens ou PDF."); }
  });
}
function AnexoViewer({ anexo, onClose }) {
  return (
    <Modal title={anexo.nome || "Anexo"} sub="Documento anexado" icon="paperclip" onClose={onClose}
      footer={<><a className="btn btn-ghost" href={anexo.dados} download={anexo.nome || "anexo"}><Icon name="download" size={14} /> Transferir</a><button className="btn btn-primary" onClick={onClose}>Fechar</button></>}>
      {/^image\//.test(anexo.tipo)
        ? <img src={anexo.dados} alt={anexo.nome} style={{ width: "100%", borderRadius: "var(--radius-sm)", display: "block" }} />
        : <iframe title={anexo.nome} src={anexo.dados} style={{ width: "100%", height: "60vh", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }} />}
    </Modal>
  );
}
function DespesaPartilhadaModal({ grupo, onClose, onSave }) {
  const fin = useFinance();
  const pessoas = ["Eu", ...(grupo.membros || [])];
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
  if (metodo === "igual") { const each = parts.length ? valor / parts.length : 0; parts.forEach((p) => (quotas[p] = each)); }
  else if (metodo === "percentagem") { parts.forEach((p) => (quotas[p] = valor * (numOf(pcts[p]) / 100))); }
  else { parts.forEach((p) => (quotas[p] = numOf(vals[p]))); }
  const somaQuotas = parts.reduce((s, p) => s + (quotas[p] || 0), 0);
  const somaPct = parts.reduce((s, p) => s + numOf(pcts[p]), 0);
  const diff = Math.round((somaQuotas - valor) * 100) / 100;
  const addFiles = async (fileList) => {
    setErr(""); setBusy(true);
    try { const novos = []; for (const file of Array.from(fileList)) novos.push(await lerAnexo(file)); setAnexos((a) => [...a, ...novos]); }
    catch (msg) { setErr(typeof msg === "string" ? msg : "Falha ao anexar."); }
    setBusy(false);
  };
  const guardar = () => {
    if (!f.titulo.trim()) return setErr("Dá um nome à despesa.");
    if (valor <= 0) return setErr("Indica um valor válido.");
    if (parts.length === 0) return setErr("Escolhe com quem partilhar.");
    if (metodo === "percentagem" && Math.abs(somaPct - 100) > 0.5) return setErr("As percentagens têm de somar 100% (agora " + Math.round(somaPct) + "%).");
    if (metodo === "personalizado" && Math.abs(diff) > 0.02) return setErr("Os valores têm de somar " + BM.eur(valor) + " (diferença de " + BM.eur(Math.abs(diff)) + ").");
    const qz = {}; parts.forEach((p) => (qz[p] = Math.round((quotas[p] || 0) * 100) / 100));
    onSave({ id: BM.uid(), titulo: f.titulo.trim(), categoria: f.categoria, valor, data: f.data, vencimento: f.vencimento || "", pagador: f.pagador, participantes: parts, metodo, quotas: qz, estado: f.estado, obs: f.obs.trim(), anexos, pagamentos: {} });
  };
  const okSplit = metodo === "percentagem" ? Math.abs(somaPct - 100) < 0.5 : metodo === "personalizado" ? Math.abs(diff) < 0.02 : true;
  const aside = valor > 0 && parts.length > 0 && (
    <>
      <div className="modal-info-title">Resumo da divisão</div>
      <div className="modal-info-row"><span>Valor total</span><b>{BM.eur(valor)}</b></div>
      {parts.map((p) => <div className="modal-info-row" key={p}><span>{p}</span><b>{BM.eur(quotas[p] || 0)}</b></div>)}
      {metodo !== "igual" && (
        <div className="modal-info-row" style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
          <span>{metodo === "percentagem" ? "Soma" : "Diferença"}</span>
          <b style={{ color: okSplit ? "var(--accent)" : "var(--neg)" }}>{metodo === "percentagem" ? Math.round(somaPct) + "%" : BM.eur(Math.abs(diff))}</b>
        </div>
      )}
    </>
  );
  return (
    <Modal title="Nova despesa" sub={grupo.nome} icon="wallet" onClose={onClose} wide aside={aside}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={guardar}><Icon name="check" size={14} color="#fff" /> Adicionar</button></>}>
      <Field label="Descrição"><input className="input" autoFocus value={f.titulo} onChange={set("titulo")} placeholder="Ex: Renda, Compras, Internet…" /></Field>
      <div className="modal-row-2">
        <Field label="Categoria"><select className="select" value={f.categoria} onChange={set("categoria")}>{Object.keys(BM.cats).map((k) => <option key={k} value={k}>{BM.cats[k].nome}</option>)}</select></Field>
        <Field label="Valor" icon="coins"><input className="input" inputMode="decimal" value={f.valor} onChange={set("valor")} placeholder="0,00" /></Field>
      </div>
      <div className="modal-row-2">
        <Field label="Data"><input className="input" type="date" value={f.data} onChange={set("data")} /></Field>
        <Field label="Vencimento" hint="opcional"><input className="input" type="date" value={f.vencimento} onChange={set("vencimento")} /></Field>
      </div>
      <div className="modal-row-2">
        <Field label="Quem pagou"><select className="select" value={f.pagador} onChange={set("pagador")}>{pessoas.map((p) => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Estado"><select className="select" value={f.estado} onChange={set("estado")}>{ESTADOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></Field>
      </div>
      <Field label="Partilhar com">
        <div className="prem-parts">
          {pessoas.map((p) => <button type="button" key={p} className={"chip" + (parts.includes(p) ? " sel" : "")} style={{ cursor: "pointer" }} onClick={() => toggle(p)}>{p}</button>)}
        </div>
      </Field>
      <Field label="Método de divisão">
        <div className="pg-seg">
          {[["igual", "Igual"], ["percentagem", "Percentagem"], ["personalizado", "Valor exato"]].map(([id, lbl]) => (
            <button type="button" key={id} className={"pg-seg-b" + (metodo === id ? " on" : "")} onClick={() => setMetodo(id)}>{lbl}</button>
          ))}
        </div>
      </Field>
      {parts.length > 0 && metodo === "igual" && valor > 0 && (
        <div className="muted tiny" style={{ fontWeight: 600, marginBottom: 16 }}>Cada pessoa fica com {BM.eur(valor / parts.length)}.</div>
      )}
      {parts.length > 0 && metodo !== "igual" && (
        <div className="pg-split" style={{ marginBottom: 16 }}>
          {parts.map((p) => (
            <div className="pg-split-row" key={p}>
              <span className="prem-avatar sm">{inicial(p)}</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{p}</span>
              {metodo === "percentagem"
                ? <span className="pg-split-in"><input className="input" inputMode="decimal" value={pcts[p] || ""} onChange={(e) => setPcts((s) => ({ ...s, [p]: e.target.value }))} placeholder="0" /><i>%</i></span>
                : <span className="pg-split-in"><input className="input" inputMode="decimal" value={vals[p] || ""} onChange={(e) => setVals((s) => ({ ...s, [p]: e.target.value }))} placeholder="0,00" /><i>{fin.curSym}</i></span>}
              <span className="pg-split-q">{BM.eur(quotas[p] || 0)}</span>
            </div>
          ))}
          <div className={"pg-split-sum" + (okSplit ? " ok" : " bad")}>
            {metodo === "percentagem"
              ? "Soma: " + Math.round(somaPct) + "%" + (okSplit ? " ✓" : " · tem de dar 100%")
              : "Soma: " + BM.eur(somaQuotas) + " / " + BM.eur(valor) + (okSplit ? " ✓" : "")}
          </div>
        </div>
      )}
      <Field label="Observações" hint="opcional"><textarea className="input" rows={2} value={f.obs} onChange={set("obs")} placeholder="Notas sobre a despesa…" style={{ resize: "vertical", fontFamily: "inherit" }} /></Field>
      <Field label="Anexar fatura" hint="imagem ou PDF">
        <label className="pg-upload">
          <input type="file" accept="image/*,application/pdf" multiple style={{ display: "none" }} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          <Icon name="paperclip" size={16} color="var(--accent)" /> {busy ? "A processar…" : "Escolher ficheiro(s)"}
        </label>
        {anexos.length > 0 && (
          <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {anexos.map((a, i) => (
              <span key={i} className="chip" style={{ gap: 7 }}><Icon name="receipt" size={12} /> {a.nome.length > 18 ? a.nome.slice(0, 16) + "…" : a.nome}
                <button type="button" onClick={() => setAnexos((arr) => arr.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "grid", color: "var(--ink-3)" }}><span style={{ transform: "rotate(45deg)", display: "grid" }}><Icon name="plus" size={12} color="var(--ink-3)" /></span></button>
              </span>
            ))}
          </div>
        )}
        <div className="muted tiny" style={{ fontWeight: 600, marginTop: 6, lineHeight: 1.5 }}>As imagens são reduzidas automaticamente e guardadas localmente. A leitura automática (OCR) chega numa fase futura.</div>
      </Field>
      {err && <div className="alert bad" style={{ padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
    </Modal>
  );
}
function quotaDe(e, p, parts) {
  if (e && e.quotas && e.quotas[p] != null) return +e.quotas[p] || 0;
  const n = (parts && parts.length) ? parts.length : 1;
  return (+((e && e.valor)) || 0) / n;
}
function balancos(g) {
  const pessoas = ["Eu", ...(g.membros || [])];
  const net = {}; pessoas.forEach((p) => (net[p] = 0));
  (g.despesas || []).forEach((e) => {
    const parts = (e.participantes && e.participantes.length) ? e.participantes : pessoas;
    const pagos = e.pagamentos || {};
    if (net[e.pagador] == null) net[e.pagador] = 0;
    parts.forEach((p) => {
      if (net[p] == null) net[p] = 0;
      if (p === e.pagador) return;   // o pagador não deve a si próprio
      if (pagos[p]) return;          // já acertou esta despesa — sai do saldo
      const share = quotaDe(e, p, parts);
      net[p] -= share;               // deve a sua parte
      net[e.pagador] += share;       // o pagador tem essa parte a receber
    });
  });
  Object.keys(net).forEach((p) => (net[p] = Math.round(net[p] * 100) / 100));
  return net;
}
const inicial = (p) => (p === "Eu" ? "Eu" : (p.trim()[0] || "?").toUpperCase());
function balTag(v) {
  if (Math.abs(v) < 0.01) return <span className="prem-bal-tag zero">saldado</span>;
  return <span className={"prem-bal-tag " + (v > 0 ? "pos" : "neg")}>{(v > 0 ? "recebe " : "deve ") + BM.eur(Math.abs(v))}</span>;
}

function grupoStats(g) {
  const pessoas = ["Eu", ...(g.membros || [])];
  const desp = g.despesas || [];
  const total = desp.reduce((s, e) => s + (+e.valor || 0), 0);
  let aReceber = 0, emDivida = 0, emAberto = 0, porLiquidar = 0;
  desp.forEach((e) => {
    const parts = (e.participantes && e.participantes.length) ? e.participantes : pessoas;
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
  const pessoas = ["Eu", ...(g.membros || [])];
  const pares = {};
  (g.despesas || []).forEach((e) => {
    const parts = (e.participantes && e.participantes.length) ? e.participantes : pessoas;
    const pagos = e.pagamentos || {};
    parts.forEach((p) => {
      if (p === e.pagador) return;
      if (pagos[p]) return;
      const key = p + "|" + e.pagador;
      pares[key] = (pares[key] || 0) + quotaDe(e, p, parts);
    });
  });
  return Object.keys(pares).map((k) => { const [de, para] = k.split("|"); return { de, para, valor: Math.round(pares[k] * 100) / 100 }; }).filter((x) => x.valor > 0.005);
}
function sysMsg(texto) { return { id: BM.uid(), tipo: "sistema", texto, ts: Date.now() }; }

function ChatGrupo({ grupo, onSend }) {
  const [txt, setTxt] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const endRef = React.useRef(null);
  const msgs = grupo.mensagens || [];
  React.useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ block: "end" }); }, [msgs.length]);
  const enviar = () => { const t = txt.trim(); if (!t) return; onSend({ id: BM.uid(), autor: "Eu", tipo: "texto", texto: t, ts: Date.now() }); setTxt(""); };
  const anexar = async (fl) => { setErr(""); setBusy(true); try { for (const file of Array.from(fl)) { const a = await lerAnexo(file); onSend({ id: BM.uid(), autor: "Eu", tipo: /^image\//.test(a.tipo) ? "imagem" : "pdf", anexo: a, ts: Date.now() }); } } catch (m) { setErr(typeof m === "string" ? m : "Falha ao anexar."); } setBusy(false); };
  return (
    <div className="card pg-chat">
      <div className="pg-chat-scroll">
        {msgs.length === 0 && <div className="muted tiny" style={{ fontWeight: 600, textAlign: "center", padding: 24 }}>Ainda sem mensagens. Diz olá ao grupo 👋</div>}
        {msgs.map((m) => {
          if (m.tipo === "sistema") return <div className="pg-msg-sys" key={m.id}>{m.texto}</div>;
          const mine = m.autor === "Eu";
          return (
            <div className={"pg-msg" + (mine ? " mine" : "")} key={m.id}>
              {!mine && <span className="prem-avatar sm">{inicial(m.autor)}</span>}
              <div className="pg-bubble">
                {!mine && <div className="pg-msg-a">{m.autor}</div>}
                {m.tipo === "texto" && <div className="pg-msg-t">{m.texto}</div>}
                {m.tipo === "imagem" && <img src={m.anexo.dados} alt={m.anexo.nome} className="pg-msg-img" />}
                {m.tipo === "pdf" && <a href={m.anexo.dados} download={m.anexo.nome} className="pg-msg-pdf"><Icon name="receipt" size={15} /> {m.anexo.nome}</a>}
                <div className="pg-msg-time">{new Date(m.ts).toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {err && <div className="muted tiny" style={{ color: "var(--neg)", fontWeight: 700, padding: "4px 12px" }}>{err}</div>}
      <div className="pg-chat-bar">
        <label className="pg-chat-attach" title="Anexar imagem ou PDF">
          <input type="file" accept="image/*,application/pdf" multiple style={{ display: "none" }} onChange={(e) => { anexar(e.target.files); e.target.value = ""; }} />
          <Icon name={busy ? "history" : "plus"} size={18} color="var(--ink-2)" />
        </label>
        <input className="input" value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); enviar(); } }} placeholder="Escreve uma mensagem…" />
        <button className="btn btn-primary" style={{ flex: "none", padding: "9px 13px" }} onClick={enviar} title="Enviar"><Icon name="chevR" size={16} color="#fff" /></button>
      </div>
    </div>
  );
}

function GrupoCalendario({ despesas }) {
  const hoje = new Date();
  const [ref, setRef] = React.useState({ y: hoje.getFullYear(), m: hoje.getMonth() });
  const comVenc = (despesas || []).filter((e) => e.vencimento);
  const first = new Date(ref.y, ref.m, 1);
  const startDow = (first.getDay() + 6) % 7;
  const dias = new Date(ref.y, ref.m + 1, 0).getDate();
  const byDay = {};
  const doMes = [];
  comVenc.forEach((e) => { const p = e.vencimento.split("-").map(Number); if (p[0] === ref.y && p[1] - 1 === ref.m) { (byDay[p[2]] = byDay[p[2]] || []).push(e); doMes.push(e); } });
  doMes.sort((x, y) => x.vencimento.localeCompare(y.vencimento));
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= dias; d++) cells.push(d);
  const shift = (delta) => setRef((r) => { let m = r.m + delta, y = r.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } return { y, m }; });
  const isHoje = (d) => hoje.getFullYear() === ref.y && hoje.getMonth() === ref.m && hoje.getDate() === d;
  return (
    <div className="pg-col">
      <div className="card card-pad">
        <div className="pg-cal-head">
          <button className="pg-back" onClick={() => shift(-1)} title="Mês anterior"><span style={{ display: "grid", transform: "rotate(180deg)" }}><Icon name="chevR" size={15} /></span></button>
          <b style={{ fontSize: 15 }}>{BM.MESES[ref.m]} {ref.y}</b>
          <button className="pg-back" onClick={() => shift(1)} title="Mês seguinte"><Icon name="chevR" size={15} /></button>
        </div>
        <div className="pg-cal-grid pg-cal-dow">{["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => <span key={d}>{d}</span>)}</div>
        <div className="pg-cal-grid">
          {cells.map((d, i) => (
            <div key={i} className={"pg-cal-cell" + (d ? "" : " empty") + (d && isHoje(d) ? " hoje" : "") + (d && byDay[d] ? " tem" : "")}>
              {d && <span className="pg-cal-d">{d}</span>}
              {d && byDay[d] && <span className="pg-cal-dot">{byDay[d].length}</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="card card-pad">
        <div className="prem-sec-t">Vencimentos em {BM.MESES[ref.m]}</div>
        {doMes.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4 }}>Sem vencimentos neste mês.</div> :
          doMes.map((e) => (
            <div className="pg-up" key={e.id}>
              <div className="pg-up-d"><div className="dd">{e.vencimento.split("-")[2]}</div><div className="mm">{BM.MESES[ref.m]}</div></div>
              <div className="pg-up-main"><div className="pg-up-t">{e.titulo} {estadoPill(e.estado)}</div><div className="pg-up-m">{(BM.cats[e.categoria] || BM.cats.outros).nome} · pago por {e.pagador}</div></div>
              <div className="pg-up-v">{BM.eur(e.valor)}</div>
            </div>
          ))}
      </div>
    </div>
  );
}

function Partilha() { return <PremiumGate><PartilhaInner /></PremiumGate>; }
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
    const h = (e) => { if (!e.target.closest || !e.target.closest(".ph-menu-wrap")) setMenuId(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuId]);
  const aberto = grupos.find((g) => g.id === openId);

  if (aberto) {
    const stats = grupoStats(aberto);
    const net = balancos(aberto);
    const pessoas = stats.pessoas;
    const desp = [...(aberto.despesas || [])].sort((a, b) => (b.data || "").localeCompare(a.data || ""));
    const pend = (aberto.convites || []).filter((c) => c.estado === "pendente").length;
    const pctPago = stats.total > 0 ? Math.round((stats.totalPago / stats.total) * 100) : 0;
    const catBreak = (() => {
      const by = {};
      (aberto.despesas || []).forEach((e) => { const k = e.categoria || "outros"; by[k] = (by[k] || 0) + (+e.valor || 0); });
      return Object.keys(by).map((k) => ({ key: k, nome: (BM.cats[k] || BM.cats.outros).nome, color: (BM.cats[k] || BM.cats.outros).color, valor: by[k] })).sort((a, b) => b.valor - a.valor);
    })();
    const proximas = (aberto.despesas || []).filter((e) => e.vencimento).sort((a, b) => (a.vencimento || "").localeCompare(b.vencimento || "")).slice(0, 5);
    const convidar = () => { const v = convEmail.trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(v)) return; const nm = nomeDeEmail(v); if (!(aberto.membros || []).includes(nm)) prem.edit("grupos", aberto.id, { membros: [...(aberto.membros || []), nm], convites: [...(aberto.convites || []), { email: v, nome: nm, estado: "pendente" }] }); setConvEmail(""); };
    const setPapel = (nome, papel) => prem.edit("grupos", aberto.id, { papeis: { ...(aberto.papeis || {}), [nome]: papel } });
    const removerMembro = (nome) => { const p = { ...(aberto.papeis || {}) }; delete p[nome]; prem.edit("grupos", aberto.id, { membros: (aberto.membros || []).filter((m) => m !== nome), convites: (aberto.convites || []).filter((c) => c.nome !== nome), papeis: p }); };
    // Reduzido de 7 para 5 cartões: "Em dívida" e "A receber" ficavam redundantes
    // com "Saldo pessoal" (que já é a diferença entre os dois) — os valores não
    // se perdem, passam para a legenda do próprio cartão de saldo.
    const kpis = [
      { lbl: "Total de despesas", val: BM.eur(stats.total), sub: "total do grupo" },
      { lbl: "Total pago", val: BM.eur(stats.totalPago), sub: pctPago + "% liquidado" },
      { lbl: "Saldo pessoal", val: (stats.saldo >= 0 ? "+ " : "− ") + BM.eur(Math.abs(stats.saldo)), sub: "A receber " + BM.eur(stats.aReceber) + " · A pagar " + BM.eur(stats.emDivida), tone: stats.saldo >= 0 ? "pos" : "neg" },
      { lbl: "Membros", val: String(pessoas.length), sub: pend ? pend + " convite(s) pendente(s)" : "todos ativos" },
      { lbl: "Por liquidar", val: String(stats.porLiquidar), sub: "despesas em aberto" },
    ];
    const TABS = [
      { id: "dashboard", label: "Dashboard", ic: "grid" },
      { id: "despesas", label: "Despesas", ic: "receipt" },
      { id: "saldos", label: "Saldos", ic: "chart" },
      { id: "membros", label: "Membros", ic: "users" },
      { id: "conversas", label: "Conversas", ic: "bell", soon: "Fase 5" },
      { id: "calendario", label: "Calendário", ic: "history", soon: "Fase 6" },
    ];
    return (
      <div className="content">
        <div className="card pg-head">
          <button className="pg-back" onClick={() => setOpenId(null)} title="Voltar aos grupos"><span style={{ display: "grid", transform: "rotate(180deg)" }}><Icon name="chevR" size={16} /></span></button>
          <span className="pg-head-ic"><Icon name="users" size={20} color="#fff" /></span>
          <div className="pg-head-txt"><b className="pg-head-name">{aberto.nome}</b><div className="tiny muted">{pessoas.length} membros{pend ? " · " + pend + " pendente(s)" : ""}</div></div>
          <div className="pg-avatars">
            {pessoas.slice(0, 4).map((p) => <span className="prem-avatar sm" key={p} title={p}>{inicial(p)}</span>)}
            {pessoas.length > 4 && <span className="prem-avatar more sm">+{pessoas.length - 4}</span>}
          </div>
          <button className="btn btn-primary pg-add" onClick={() => setDespModal(aberto)}><Icon name="plus" size={15} color="#fff" /> Nova despesa</button>
        </div>

        <div className="pg-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={"pg-tab" + (tab === t.id ? " on" : "")} onClick={() => setTab(t.id)}>
              <Icon name={t.ic} size={16} /> {t.label}{t.soon && <span className="pg-soon-tag">{t.soon}</span>}
            </button>
          ))}
        </div>

        {tab === "dashboard" && (<>
          <div className="card ph-statsbar">
            {kpis.map((k, i) => (
              <div className="ph-stat" key={i}>
                <div className="ph-stat-lbl">{k.lbl}</div>
                <div className={"ph-stat-val" + (k.tone ? " " + k.tone : "")}>{k.val}</div>
                <div className="ph-stat-sub">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="pg-grid">
            <div className="pg-col">
              <div className="card card-pad">
                <div className="pg-sec-h"><div className="prem-sec-t">Despesas recentes</div>{desp.length > 5 && <button className="pg-link" onClick={() => setTab("despesas")}>Ver todas</button>}</div>
                {desp.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600 }}>Ainda sem despesas. Adiciona a primeira.</div> :
                  desp.slice(0, 5).map((e) => {
                    const parts = (e.participantes && e.participantes.length) ? e.participantes : pessoas;
                    return (
                      <div className="pg-exp" key={e.id}>
                        <span className="pg-exp-ic"><Icon name="receipt" size={17} color="var(--accent)" /></span>
                        <div className="pg-exp-main"><div className="pg-exp-t">{e.titulo}</div><div className="pg-exp-m">{e.data ? BM.fmtData(e.data) + " · " : ""}Pagou {e.pagador} · ÷{parts.length}</div></div>
                        <div className="pg-exp-v">{BM.eur(e.valor)}</div>
                      </div>
                    );
                  })}
              </div>
              <div className="card card-pad">
                <div className="pg-sec-h"><div className="prem-sec-t">Próximas despesas</div>{proximas.length > 0 && <button className="pg-link" onClick={() => setTab("calendario")}>Calendário</button>}</div>
                {proximas.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600 }}>Sem vencimentos marcados. Ao criar uma despesa, define uma data de vencimento.</div> :
                  proximas.map((e) => {
                    const mm = (e.vencimento || "").split("-"); const du = daysUntil(e.vencimento);
                    return (
                      <div className="pg-up" key={e.id}>
                        <div className="pg-up-d"><div className="dd">{mm[2]}</div><div className="mm">{BM.MESES[+mm[1] - 1]}</div></div>
                        <div className="pg-up-main"><div className="pg-up-t">{e.titulo}</div><div className="pg-up-m">{du < 0 ? "vencida" : du === 0 ? "vence hoje" : "em " + du + (du === 1 ? " dia" : " dias")}</div></div>
                        <div className="pg-up-v">{BM.eur(e.valor)}</div>
                      </div>
                    );
                  })}
              </div>
              <div className="card card-pad">
                <div className="prem-sec-t">Atividade do grupo</div>
                {desp.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600 }}>Ainda sem atividade.</div> :
                  <div className="pg-tl">
                    {desp.slice(0, 6).map((e) => (
                      <div className="pg-tli" key={e.id}>
                        <span className="pg-tli-ic"><Icon name="plus" size={13} color="var(--accent)" /></span>
                        <div><div className="pg-tli-txt"><b>{e.pagador}</b> adicionou <b>{e.titulo}</b> ({BM.eur(e.valor)})</div><div className="pg-tli-time">{e.data ? BM.fmtData(e.data) : ""}</div></div>
                      </div>
                    ))}
                  </div>}
              </div>
            </div>
            <div className="pg-col">
              <div className="card card-pad">
                <div className="pg-sec-h"><div className="prem-sec-t">Saldos entre membros</div><button className="pg-link" onClick={() => setTab("saldos")}>Detalhe</button></div>
                {pessoas.map((p) => (
                  <div className="prem-balrow" key={p}><span className="prem-avatar">{inicial(p)}</span><span style={{ flex: 1, fontWeight: 700 }}>{p}</span>{balTag(net[p] || 0)}</div>
                ))}
              </div>
              <div className="card card-pad">
                <div className="prem-sec-t">Despesas por categoria</div>
                {catBreak.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4 }}>Sem despesas ainda.</div> :
                  <div className="row" style={{ gap: 16, alignItems: "center", marginTop: 6 }}>
                    <DonutChart data={catBreak} size={140} thickness={22} center={<div><div className="tnum" style={{ fontWeight: 800, fontSize: 14 }}>{BM.eur0(stats.total)}</div><div className="tiny muted" style={{ fontWeight: 600 }}>Total</div></div>} />
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                      {catBreak.slice(0, 5).map((c) => (
                        <div className="row" key={c.key} style={{ gap: 9, fontSize: 12.5 }}>
                          <span className="dot" style={{ background: c.color }} />
                          <span style={{ fontWeight: 600, color: "var(--ink-2)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nome}</span>
                          <span style={{ fontWeight: 700 }}>{BM.eur(c.valor)}</span>
                        </div>
                      ))}
                    </div>
                  </div>}
              </div>
            </div>
          </div>
        </>)}

        {tab === "despesas" && (
          <div className="card card-pad">
            <div className="pg-sec-h"><div className="prem-sec-t">Despesas</div><button className="btn btn-soft" style={{ padding: "6px 12px" }} onClick={() => setDespModal(aberto)}><Icon name="plus" size={14} /> Nova</button></div>
            {desp.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600 }}>Ainda sem despesas. Adiciona a primeira.</div> :
              desp.map((e) => {
                const parts = (e.participantes && e.participantes.length) ? e.participantes : pessoas;
                const pagos = e.pagamentos || {};
                const devedores = parts.filter((p) => p !== e.pagador);
                const ci = BM.cats[e.categoria] || BM.cats.outros;
                return (
                  <div key={e.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="prem-row" style={{ borderBottom: "none" }}>
                      <span className="prem-rico sm" style={{ background: "color-mix(in srgb, " + ci.color + " 15%, transparent)" }}><Icon name={ci.icon || "receipt"} size={16} color={ci.color} /></span>
                      <div className="prem-rtxt">
                        <b>{e.titulo} {estadoPill(e.estado)}</b>
                        <span className="muted" style={{ fontSize: 12 }}>{ci.nome}{e.data ? " · " + BM.fmtData(e.data) : ""} · Pagou {e.pagador}{e.vencimento ? " · vence " + BM.fmtData(e.vencimento) : ""}</span>
                      </div>
                      <div className="prem-ramt">{BM.eur(e.valor)}</div>
                      <div className="prem-rbtns">
                        {(e.anexos && e.anexos.length > 0) && <button className="icon-btn" title="Ver anexo" onClick={() => setAnexoView(e.anexos[0])}><Icon name="receipt" size={15} color="var(--ink-2)" /></button>}
                        <button className="icon-btn" title="Apagar despesa" onClick={() => prem.edit("grupos", aberto.id, { despesas: (aberto.despesas || []).filter((x) => x.id !== e.id) })}><Icon name="trash" size={15} color="var(--neg)" /></button>
                      </div>
                    </div>
                    {e.obs && <div className="muted" style={{ fontSize: 12, padding: "0 14px 6px 52px", lineHeight: 1.5 }}>{e.obs}</div>}
                    {devedores.length > 0 && (
                      <div className="row" style={{ gap: 6, flexWrap: "wrap", padding: "0 14px 12px 52px" }}>
                        {devedores.map((p) => {
                          const pago = !!pagos[p];
                          return <button type="button" key={p} className={"chip" + (pago ? " sel" : "")} style={{ cursor: "pointer" }} title={pago ? "Marcar como em dívida" : "Marcar como pago"}
                            onClick={() => { const desps = (aberto.despesas || []).map((x) => (x.id === e.id ? { ...x, pagamentos: { ...(x.pagamentos || {}), [p]: !pago } } : x)); const patch = { despesas: desps }; if (!pago) patch.mensagens = [...(aberto.mensagens || []), sysMsg(p + " confirmou o pagamento de " + e.titulo)]; prem.edit("grupos", aberto.id, patch); }}>{p}: {pago ? "pagou ✓" : BM.eur(quotaDe(e, p, parts)) + " deve"}</button>;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {tab === "saldos" && (() => {
          const ds = dividas(aberto);
          const devemTe = ds.filter((d) => d.para === "Eu");
          const deves = ds.filter((d) => d.de === "Eu");
          const outros = ds.filter((d) => d.de !== "Eu" && d.para !== "Eu");
          const acertar = (de, para) => prem.edit("grupos", aberto.id, {
            despesas: (aberto.despesas || []).map((e) => { if (e.pagador !== para) return e; const parts = (e.participantes && e.participantes.length) ? e.participantes : pessoas; if (!parts.includes(de)) return e; return { ...e, pagamentos: { ...(e.pagamentos || {}), [de]: true } }; }),
            mensagens: [...(aberto.mensagens || []), sysMsg((de === "Eu" ? "Eu" : de) + " acertou contas com " + (para === "Eu" ? "Eu" : para))],
          });
          return (
            <div className="pg-col">
              <div className="card card-pad">
                <div className="prem-sec-t">O teu saldo</div>
                <div className="pg-bal-hero">
                  <div><div className="pg-bal-l">A receber</div><div className="pg-bal-v pos">{BM.eur(stats.aReceber)}</div></div>
                  <div><div className="pg-bal-l">A pagar</div><div className="pg-bal-v neg">{BM.eur(stats.emDivida)}</div></div>
                  <div><div className="pg-bal-l">Saldo</div><div className={"pg-bal-v " + (stats.saldo >= 0 ? "pos" : "neg")}>{(stats.saldo >= 0 ? "+ " : "− ") + BM.eur(Math.abs(stats.saldo))}</div></div>
                </div>
              </div>
              <div className="card card-pad">
                <div className="prem-sec-t">Devem-te</div>
                {devemTe.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4 }}>Ninguém te deve nada. 🎉</div> :
                  devemTe.map((d, i) => (
                    <div className="pg-set" key={i}>
                      <span className="prem-avatar sm">{inicial(d.de)}</span>
                      <div className="pg-set-txt"><b>{d.de}</b> <span>deve-te</span></div>
                      <span className="pg-set-amt pos">{BM.eur(d.valor)}</span>
                      <button className="btn btn-soft" style={{ padding: "5px 11px" }} onClick={() => acertar(d.de, "Eu")}>Marcar recebido</button>
                    </div>
                  ))}
              </div>
              <div className="card card-pad">
                <div className="prem-sec-t">Deves</div>
                {deves.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4 }}>Não deves nada. 🎉</div> :
                  deves.map((d, i) => (
                    <div className="pg-set" key={i}>
                      <span className="prem-avatar sm">{inicial(d.para)}</span>
                      <div className="pg-set-txt"><span>deves a</span> <b>{d.para}</b></div>
                      <span className="pg-set-amt neg">{BM.eur(d.valor)}</span>
                      <button className="btn btn-primary" style={{ padding: "5px 11px" }} onClick={() => acertar("Eu", d.para)}>Pagar</button>
                    </div>
                  ))}
              </div>
              {outros.length > 0 && (
                <div className="card card-pad">
                  <div className="prem-sec-t">Entre outros membros</div>
                  {outros.map((d, i) => (
                    <div className="pg-set" key={i}>
                      <span className="prem-avatar sm">{inicial(d.de)}</span>
                      <div className="pg-set-txt"><b>{d.de}</b> <span>deve a</span> <b>{d.para}</b></div>
                      <span className="pg-set-amt">{BM.eur(d.valor)}</span>
                      <button className="btn btn-soft" style={{ padding: "5px 11px" }} onClick={() => acertar(d.de, d.para)}>Acertar</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="muted tiny" style={{ fontWeight: 600, lineHeight: 1.6 }}>"Acertar" marca as despesas correspondentes como pagas e atualiza os saldos automaticamente.</div>
            </div>
          );
        })()}

        {tab === "membros" && (
          <div className="pg-col">
            <div className="card card-pad">
              <div className="pg-sec-h"><div className="prem-sec-t">Membros ({pessoas.length})</div></div>
              <div className="pg-mrow">
                <span className="prem-avatar">Eu</span>
                <div className="pg-mrow-txt"><b>Eu <span className="muted tiny" style={{ fontWeight: 600 }}>(tu)</span></b><span className="pg-mrow-sub">criador do grupo</span></div>
                <span className="pg-role owner">Owner</span>
              </div>
              {(aberto.membros || []).map((m) => {
                const conv = (aberto.convites || []).find((c) => c.nome === m);
                const pendm = conv && conv.estado === "pendente";
                const papel = (aberto.papeis && aberto.papeis[m]) || "membro";
                return (
                  <div className="pg-mrow" key={m}>
                    <span className="prem-avatar">{inicial(m)}</span>
                    <div className="pg-mrow-txt"><b>{m}</b><span className="pg-mrow-sub">{conv ? conv.email : ""}{pendm ? " · convite pendente" : ""}</span></div>
                    {pendm
                      ? <button className="btn btn-soft" style={{ padding: "5px 11px" }} onClick={() => prem.edit("grupos", aberto.id, { convites: (aberto.convites || []).map((c) => (c.nome === m ? { ...c, estado: "ativo" } : c)), mensagens: [...(aberto.mensagens || []), sysMsg(m + " entrou no grupo")] })}>Aceitar</button>
                      : <select className="select pg-role-sel" value={papel} onChange={(e) => setPapel(m, e.target.value)}><option value="admin">Admin</option><option value="membro">Membro</option></select>}
                    <button className="icon-btn" title="Remover membro" onClick={() => setRemMembro(m)}><Icon name="trash" size={15} color="var(--neg)" /></button>
                  </div>
                );
              })}
              <div className="row" style={{ gap: 8, marginTop: 12 }}>
                <input className="input" type="email" value={convEmail} onChange={(e) => setConvEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); convidar(); } }}
                  placeholder="convidar por email…" />
                <button className="btn btn-primary" style={{ flex: "none" }} onClick={convidar}><Icon name="plus" size={14} color="#fff" /> Convidar</button>
              </div>
            </div>
            <div className="card card-pad">
              <div className="prem-sec-t">Como funcionam as permissões</div>
              <div className="pg-perm"><span className="pg-role owner">Owner</span><span>Controlo total: gere membros, permissões e o grupo.</span></div>
              <div className="pg-perm"><span className="pg-role admin">Admin</span><span>Pode adicionar despesas e convidar membros.</span></div>
              <div className="pg-perm"><span className="pg-role membro">Membro</span><span>Participa nas despesas e vê os saldos.</span></div>
              <div className="muted tiny" style={{ fontWeight: 600, marginTop: 10, lineHeight: 1.6 }}>És o Owner deste grupo. As permissões aplicam-se de verdade entre vários utilizadores quando o backend estiver ligado — aqui é simulação local. Ao remover um membro, as despesas já registadas mantêm-se no histórico.</div>
            </div>
          </div>
        )}

        {tab === "conversas" && <ChatGrupo grupo={aberto} onSend={(m) => prem.edit("grupos", aberto.id, { mensagens: [...(aberto.mensagens || []), m] })} />}
        {tab === "calendario" && <GrupoCalendario despesas={aberto.despesas} />}

        {despModal && <DespesaPartilhadaModal grupo={aberto} onClose={() => setDespModal(null)} onSave={(d) => { prem.edit("grupos", aberto.id, { despesas: [...(aberto.despesas || []), d], mensagens: [...(aberto.mensagens || []), sysMsg("Eu adicionou a despesa " + d.titulo + " (" + BM.eur(d.valor) + ")")] }); setDespModal(null); }} />}
        {anexoView && <AnexoViewer anexo={anexoView} onClose={() => setAnexoView(null)} />}
        {remMembro && (
          <Modal title="Remover membro" sub="Esta ação não pode ser revertida." icon="trash" iconNeg onClose={() => setRemMembro(null)}
            footer={<><button className="btn btn-ghost" onClick={() => setRemMembro(null)}>Cancelar</button><button className="btn" style={{ background: "var(--neg)", color: "#fff", border: "none" }} onClick={() => { removerMembro(remMembro); setRemMembro(null); }}><Icon name="trash" size={14} color="#fff" /> Remover</button></>}>
            <div className="muted" style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.6 }}>Remover <b>{remMembro}</b> do grupo? As despesas já registadas mantêm-se no histórico.</div>
          </Modal>
        )}
      </div>
    );
  }

  const ultAtual = (g) => { const ds = (g.despesas || []).map((e) => e.data).filter(Boolean).sort(); return ds.length ? ds[ds.length - 1] : ""; };
  let sTotal = 0, sReceber = 0, sPagar = 0, sConv = 0, sAtivos = 0;
  grupos.forEach((g) => { const s = grupoStats(g); sTotal += s.total; sReceber += s.aReceber; sPagar += s.emDivida; sConv += (g.convites || []).filter((c) => c.estado === "pendente").length; if (!g.arquivado) sAtivos++; });
  // "A receber"/"A pagar" juntam-se num único "O teu saldo" (a diferença entre os
  // dois) — menos cartões para ler, sem perder os valores (ficam na legenda).
  const sSaldo = sReceber - sPagar;
  const kpisTop = [
    { lbl: "Total em grupos", val: BM.eur(sTotal), sub: grupos.length + " grupo(s)" },
    { lbl: "O teu saldo", val: (sSaldo >= 0 ? "+ " : "− ") + BM.eur(Math.abs(sSaldo)), sub: "A receber " + BM.eur(sReceber) + " · A pagar " + BM.eur(sPagar), tone: sSaldo >= 0 ? "pos" : "neg" },
    { lbl: "Grupos ativos", val: String(sAtivos), sub: (grupos.length - sAtivos) + " arquivado(s)" },
    { lbl: "Convites pendentes", val: String(sConv), sub: "por aceitar" },
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
  grupos.forEach((g) => (g.convites || []).forEach((c) => { if (c.estado === "pendente") convitesPend.push({ g, c }); }));
  const atividade = [];
  grupos.forEach((g) => (g.despesas || []).forEach((e) => atividade.push({ g, e })));
  atividade.sort((a, b) => (b.e.data || "").localeCompare(a.e.data || ""));
  const ativRecente = atividade.slice(0, 6);

  return (
    <div className="content">
      {/* Uma única barra, não 4 cartões separados — os números pedem só um relance,
          não atenção individual; menos caixas/sombras/ícones para ler. */}
      <div className="card ph-statsbar">
        {kpisTop.map((k, i) => (
          <div className="ph-stat" key={i}>
            <div className="ph-stat-lbl">{k.lbl}</div>
            <div className={"ph-stat-val" + (k.tone ? " " + k.tone : "")}>{k.val}</div>
            <div className="ph-stat-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="ph-layout">
        <div className="ph-main">
          <div className="ph-toolbar">
            <div className="ph-search"><Icon name="search" size={16} color="var(--ink-3)" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar grupo…" /></div>
            <select className="select ph-tool-sel" value={filtro} onChange={(e) => setFiltro(e.target.value)}><option value="ativos">Ativos</option><option value="arquivados">Arquivados</option><option value="todos">Todos</option></select>
            <select className="select ph-tool-sel" value={ordem} onChange={(e) => setOrdem(e.target.value)}><option value="recentes">Recentes</option><option value="nome">Nome</option><option value="valor">Valor</option></select>
            <button className="btn btn-primary ph-tool-add" onClick={() => setModal(true)}><Icon name="plus" size={15} color="#fff" /> Novo grupo</button>
          </div>

          <div className="pg-sec-h"><div className="prem-sec-t">Os meus grupos</div><span className="tiny muted" style={{ fontWeight: 600 }}>{lista.length} de {grupos.length}</span></div>

          {lista.length === 0 ? (
            <div className="card card-pad" style={{ textAlign: "center", padding: "32px 20px" }}>
              <div className="muted" style={{ fontWeight: 600, fontSize: 13.5 }}>{grupos.length === 0 ? "Ainda não tens grupos — cria o primeiro já a seguir." : "Nenhum grupo corresponde à pesquisa."}</div>
            </div>
          ) : (
            <div className="ph-groups">
              {lista.map((g) => {
                const s = grupoStats(g);
                const pessoas = ["Eu", ...(g.membros || [])];
                const abrir = () => { setTab("dashboard"); setOpenId(g.id); };
                return (
                  // Cartão inteiro clicável (padrão de lista, não um botão isolado a competir
                  // por atenção) — o menu de ações trava a propagação para não abrir o grupo
                  // sem querer. Só mostra o estado quando é "Arquivado": ativo é o normal,
                  // não precisa de o dizer sempre.
                  <div className="card ph-gcard" key={g.id} onClick={abrir}>
                    <div className="ph-gcard-head">
                      <span className="ph-gico"><Icon name="users" size={17} color="#fff" /></span>
                      <div className="ph-gcard-headtxt">
                        <b className="ph-gname">{g.nome}</b>
                        <span className="ph-gmeta">{pessoas.length} membro{pessoas.length !== 1 ? "s" : ""}{g.arquivado ? " · Arquivado" : ""}</span>
                      </div>
                      <div className="ph-menu-wrap" onClick={(e) => e.stopPropagation()}>
                        <button className="icon-btn" title="Ações" onClick={() => setMenuId(menuId === g.id ? null : g.id)}><Icon name="dots" size={17} /></button>
                        {menuId === g.id && (
                          <div className="ph-menu">
                            <button onClick={() => { setMenuId(null); setEditId(g.id); }}><Icon name="edit" size={15} /> Editar</button>
                            <button onClick={() => { setMenuId(null); setTab("membros"); setOpenId(g.id); }}><Icon name="users" size={15} /> Convidar membros</button>
                            <button onClick={() => { setMenuId(null); prem.edit("grupos", g.id, { arquivado: !g.arquivado }); }}><Icon name="archive" size={15} /> {g.arquivado ? "Desarquivar" : "Arquivar"}</button>
                            <button className="danger" onClick={() => { setMenuId(null); setDelId(g.id); }}><Icon name="trash" size={15} /> Eliminar</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {g.descricao && <div className="ph-gdesc">{g.descricao}</div>}

                    <div className="ph-gcard-body">
                      <div className="ph-gcard-figure">
                        <span className="ph-gs-l">Movimentado</span>
                        <span className="ph-gs-v">{BM.eur(s.total)}</span>
                      </div>
                      <div className={"ph-gcard-figure ph-gcard-saldo " + (s.saldo >= 0 ? "pos" : "neg")}>
                        <span className="ph-gs-l">Saldo</span>
                        <span className="ph-gs-v">{(s.saldo >= 0 ? "+ " : "− ") + BM.eur(Math.abs(s.saldo))}</span>
                      </div>
                    </div>

                    <div className="ph-gcard-foot">
                      <div className="ph-gav">
                        {pessoas.slice(0, 4).map((p) => <span className="prem-avatar sm" key={p} title={p}>{inicial(p)}</span>)}
                        {pessoas.length > 4 && <span className="prem-avatar more sm">+{pessoas.length - 4}</span>}
                      </div>
                      <button className="ph-gopen" onClick={abrir}>Abrir <Icon name="chevR" size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="ph-create" onClick={() => setModal(true)}>
            <div className="ph-create-ic"><Icon name="plus" size={26} color="var(--accent)" /></div>
            <div className="ph-create-txt"><b>Criar um novo grupo</b><span>Divide a casa, uma viagem ou o jantar. Convida por email e acompanha tudo num só sítio.</span></div>
            <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); setModal(true); }}><Icon name="plus" size={15} color="#fff" /> Criar novo grupo</button>
          </div>
        </div>

        <aside className="ph-aside">
          <div className="card card-pad">
            <div className="prem-sec-t">Convites recebidos</div>
            {convitesPend.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4 }}>Sem convites pendentes.</div> :
              convitesPend.map(({ g, c }, i) => (
                <div className="ph-inv" key={i}>
                  <span className="prem-avatar sm">{inicial(c.nome || "?")}</span>
                  <div className="ph-inv-txt"><b>{g.nome}</b><span>{c.email || c.nome}</span></div>
                  <div className="ph-inv-btns">
                    <button className="btn btn-soft" style={{ padding: "5px 10px" }} onClick={() => prem.edit("grupos", g.id, { convites: (g.convites || []).map((x) => (x.nome === c.nome ? { ...x, estado: "ativo" } : x)) })}>Aceitar</button>
                    <button className="icon-btn" title="Recusar" onClick={() => prem.edit("grupos", g.id, { convites: (g.convites || []).filter((x) => x.nome !== c.nome), membros: (g.membros || []).filter((m) => m !== c.nome) })}><span style={{ transform: "rotate(45deg)", display: "grid" }}><Icon name="plus" size={15} color="var(--ink-3)" /></span></button>
                  </div>
                </div>
              ))}
          </div>

          <div className="card card-pad">
            <div className="prem-sec-t">Atividade recente</div>
            {ativRecente.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4 }}>Ainda sem atividade.</div> :
              <div className="pg-tl" style={{ marginTop: 4 }}>
                {ativRecente.map(({ g, e }, i) => (
                  <div className="pg-tli" key={i}>
                    <span className="pg-tli-ic"><Icon name="plus" size={13} color="var(--accent)" /></span>
                    <div><div className="pg-tli-txt"><b>{e.pagador}</b> adicionou <b>{e.titulo}</b> · <span className="muted">{g.nome}</span></div><div className="pg-tli-time">{e.data ? BM.fmtData(e.data) : ""}</div></div>
                  </div>
                ))}
              </div>}
          </div>

          <div className="card card-pad ph-priv">
            <span className="ph-priv-ic"><Icon name="shield" size={18} color="var(--accent)" /></span>
            <div><b style={{ fontSize: 13.5 }}>Privacidade & segurança</b><div className="muted tiny" style={{ fontWeight: 500, marginTop: 3, lineHeight: 1.55 }}>Só os membros do grupo veem as suas despesas. Podes exigir PIN para ações sensíveis nas Definições.</div></div>
          </div>
        </aside>
      </div>

      {modal && <GrupoModal onClose={() => setModal(false)} onSave={(it) => { prem.add("grupos", it); setModal(false); }} />}
      {editId && grupos.find((g) => g.id === editId) && <GrupoModal grupo={grupos.find((g) => g.id === editId)} onClose={() => setEditId(null)} onSave={(it) => { prem.edit("grupos", editId, it); setEditId(null); }} />}
      {delId && <RLConfirmPin title="Eliminar grupo" desc="Vais eliminar este grupo e todas as suas despesas. Esta ação é irreversível." onConfirm={() => prem.remove("grupos", delId)} onClose={() => setDelId(null)} />}
    </div>
  );
}

/* ---------------- Previsão + exportar ---------------- */
function Previsao() { return <PremiumGate><PrevisaoInner /></PremiumGate>; }
function PrevisaoInner() {
  const fin = useFinance();
  const prem = usePremium();
  const hojeDia = new Date().getDate();
  const recorrentes = prem.get().recorrentes || [];
  const aSair = recorrentes.filter((r) => r.dia >= hojeDia).reduce((s, r) => s + (+r.valor || 0), 0);
  const saldoAtual = fin.saldo || 0;
  const fimMes = saldoAtual - aSair;

  const despesas = fin.data?.despesas || [];
  const rendimentos = fin.data?.rendimentos || [];
  const code = fin.cur || "EUR";
  const money = (n) => (+n || 0).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + code;

  // meses disponíveis (dos dados) + mês atual, mais recente primeiro
  const meses = React.useMemo(() => {
    const set = new Set([BM.monthKey(BM.todayISO())]);
    [...despesas, ...rendimentos].forEach((x) => { if (x.data) set.add(BM.monthKey(x.data)); });
    return [...set].sort().reverse();
  }, [despesas, rendimentos]);
  const [mes, setMes] = React.useState(meses[0]);
  React.useEffect(() => { if (!meses.includes(mes)) setMes(meses[0]); }, [meses]);

  const rotuloMes = (mk) => { const [a, m] = mk.split("-"); return `${BM.MESES[+m - 1]} de ${a}`; };
  const doMes = (arr) => arr.filter((x) => x.data && BM.monthKey(x.data) === mes);
  const dMes = doMes(despesas), rMes = doMes(rendimentos);
  const totR = rMes.reduce((s, r) => s + (+r.valor || 0), 0);
  const totD = dMes.reduce((s, d) => s + (+d.valor || 0), 0);

  const linhas = () => {
    const out = [];
    rMes.forEach((r) => out.push([BM.fmtData ? BM.fmtData(r.data) : r.data, "Rendimento", r.cat || "—", r.fonte || "", money(r.valor)]));
    dMes.forEach((d) => out.push([BM.fmtData ? BM.fmtData(d.data) : d.data, "Despesa", (BM.cats[d.cat] || BM.cats.outros).nome, d.nome || "", "−" + money(d.valor)]));
    return out;
  };

  const baixarPDF = () => {
    const J = window.jspdf && window.jspdf.jsPDF;
    if (!J) return alert("A biblioteca de PDF não carregou. Confirma a ligação à internet e tenta de novo.");
    const doc = new J();
    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(20, 160, 107);
    doc.text("Rende+", 14, 18);
    doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.setTextColor(70, 70, 70);
    doc.text("Relatório de " + rotuloMes(mes), 14, 26);
    doc.setTextColor(25, 25, 25); doc.setFontSize(12);
    doc.text("Rendimentos:  " + money(totR), 14, 40);
    doc.text("Despesas:  " + money(totD), 14, 47);
    doc.setFont("helvetica", "bold");
    doc.text("Saldo do mês:  " + money(totR - totD), 14, 54);
    doc.autoTable({
      startY: 62,
      head: [["Data", "Tipo", "Categoria", "Descrição", "Valor"]],
      body: linhas(),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [20, 160, 107], textColor: 255 },
      alternateRowStyles: { fillColor: [244, 248, 246] },
    });
    doc.save("rende-" + mes + ".pdf");
  };

  const baixarExcel = () => {
    const X = window.XLSX;
    if (!X) return alert("A biblioteca de Excel não carregou. Confirma a ligação à internet e tenta de novo.");
    const aoa = [["Data", "Tipo", "Categoria", "Descrição", "Valor (" + code + ")"]];
    rMes.forEach((r) => aoa.push([r.data, "Rendimento", r.cat || "", r.fonte || "", +r.valor || 0]));
    dMes.forEach((d) => aoa.push([d.data, "Despesa", (BM.cats[d.cat] || BM.cats.outros).nome, d.nome || "", -(+d.valor || 0)]));
    aoa.push([], ["", "", "", "Rendimentos", totR], ["", "", "", "Despesas", -totD], ["", "", "", "Saldo do mês", totR - totD]);
    const ws = X.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 24 }, { wch: 14 }];
    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, ws, rotuloMes(mes).slice(0, 28));
    X.writeFile(wb, "rende-" + mes + ".xlsx");
  };

  return (
    <div className="content">
      <div className="card card-pad">
        <div className="prev-hero-head">
          <span className="prem-rico" style={{ background: "color-mix(in srgb, var(--accent) 14%, transparent)" }}><Icon name="chart" size={19} color="var(--accent)" /></span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Previsão de saldo</div>
            <div className="tiny muted" style={{ fontWeight: 600 }}>Como deves acabar este mês, já a contar com as recorrentes por pagar.</div>
          </div>
        </div>
        <div className="prev-proj">
          <div className="prev-proj-l">No fim do mês</div>
          <div className="prev-proj-v tnum valor-sensivel" style={{ color: fimMes >= 0 ? "var(--accent)" : "var(--neg)" }}>{BM.eur(fimMes)}</div>
          <div className="tiny muted" style={{ fontWeight: 600, marginTop: 7 }}>
            <span className="valor-sensivel">{BM.eur(saldoAtual)}</span> de saldo atual − <span className="valor-sensivel">{BM.eur(aSair)}</span> de recorrentes ainda por pagar
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="prev-hero-head" style={{ marginBottom: 14 }}>
          <span className="prem-rico" style={{ background: "color-mix(in srgb, var(--c-habitacao) 14%, transparent)" }}><Icon name="sheet" size={18} color="var(--c-habitacao)" /></span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Relatório do mês</div>
            <div className="tiny muted" style={{ fontWeight: 600 }}>Escolhe o mês e descarrega o resumo em PDF ou Excel.</div>
          </div>
        </div>

        <Field label="Mês">
          <select className="select" value={mes} onChange={(e) => setMes(e.target.value)}>
            {meses.map((m) => <option key={m} value={m}>{rotuloMes(m)}</option>)}
          </select>
        </Field>

        <div className="prem-stats" style={{ marginTop: 14 }}>
          <div className="prem-stat ok"><span className="prem-stat-l">Rendimentos</span><span className="prem-stat-v tnum valor-sensivel">{BM.eur(totR)}</span></div>
          <div className="prem-stat danger"><span className="prem-stat-l">Despesas</span><span className="prem-stat-v tnum valor-sensivel">{BM.eur(totD)}</span></div>
          <div className="prem-stat"><span className="prem-stat-l">Saldo do mês</span><span className="prem-stat-v tnum valor-sensivel">{BM.eur(totR - totD)}</span></div>
        </div>

        <div className="row" style={{ gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={baixarPDF}><Icon name="pdf" size={16} color="#fff" /> Descarregar PDF</button>
          <button className="btn btn-soft" onClick={baixarExcel}><Icon name="sheet" size={16} /> Descarregar Excel</button>
        </div>
        {(dMes.length + rMes.length) === 0 && <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>Ainda não há movimentos neste mês. O ficheiro vai sair só com o resumo.</p>}
      </div>
    </div>
  );
}

/* pequeno selo Premium para a navegação */
/* ---------------- Subscrições (streaming & contas mensais) ---------------- */
/* Catálogo de serviços comuns. Os valores são apenas sugestões iniciais —
   o utilizador ajusta ao seu plano. Usamos ícones genéricos (não logótipos). */
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
  { nome: "Microsoft 365", icon: "briefcase", color: "#d83b01", valor: 7.00 },
  { nome: "PlayStation Plus", icon: "game", color: "#0070d1", valor: 8.99 },
  { nome: "Xbox Game Pass", icon: "game", color: "#107c10", valor: 12.99 },
  { nome: "Twitch", icon: "tv", color: "#9146ff", valor: 4.99 },
  { nome: "ChatGPT Plus", icon: "spark", color: "#10a37f", valor: 23.00 },
  { nome: "Notion", icon: "briefcase", color: "#787880", valor: 9.50 },
  { nome: "Amazon Prime", icon: "bag", color: "#00a8e1", valor: 4.99 },
];

/* Categorias de subscrição (nome + cor para o donut e etiquetas) */
const SUB_CATS = {
  entretenimento: { nome: "Entretenimento", color: "#e5484d" },
  musica: { nome: "Música", color: "#1db954" },
  cloud: { nome: "Cloud", color: "#3693f3" },
  produtividade: { nome: "Produtividade", color: "#d83b01" },
  jogos: { nome: "Jogos", color: "#0070d1" },
  educacao: { nome: "Educação", color: "#a855f7" },
  compras: { nome: "Compras", color: "#f0913a" },
  outros: { nome: "Outros", color: "#787880" },
};
const ICON_CAT = { film: "entretenimento", tv: "entretenimento", music: "musica", wifi: "cloud", briefcase: "produtividade", spark: "produtividade", game: "jogos", bag: "compras" };
function subCat(s) { return s.categoria || ICON_CAT[s.icon] || "outros"; }
function subCatMeta(c) { return SUB_CATS[c] || SUB_CATS.outros; }
function cicloLabel(c) { return { mensal: "Mensal", anual: "Anual", semanal: "Semanal" }[c || "mensal"]; }
function mensalDe(s) { const v = +s.valor || 0, c = s.ciclo || "mensal"; return c === "anual" ? v / 12 : c === "semanal" ? v * 52 / 12 : v; }
function anualDe(s) { const v = +s.valor || 0, c = s.ciclo || "mensal"; return c === "anual" ? v : c === "semanal" ? v * 52 : v * 12; }
function subEstado(s) { return s.estado || "ativa"; }
const SUB_ESTADOS = { ativa: { l: "Ativa", cls: "on" }, trial: { l: "Trial", cls: "trial" }, pausada: { l: "Pausada", cls: "pausa" }, cancelada: { l: "Cancelada", cls: "canc" } };
function proxRenovDate(s) { const h = new Date(); const dia = Math.min(28, Math.max(1, +s.dia || 1)); let d = new Date(h.getFullYear(), h.getMonth(), dia); const hj = new Date(h.getFullYear(), h.getMonth(), h.getDate()); if (d < hj) d = new Date(h.getFullYear(), h.getMonth() + 1, dia); return d; }
function diasAte(d) { const h = new Date(); return Math.round((d - new Date(h.getFullYear(), h.getMonth(), h.getDate())) / 86400000); }
function subEstadoPill(s) { const e = SUB_ESTADOS[subEstado(s)] || SUB_ESTADOS.ativa; return <span className={"sub-estado " + e.cls}>{e.l}</span>; }

function SubCalendario({ subs }) {
  const hoje = new Date();
  const [ref, setRef] = React.useState({ y: hoje.getFullYear(), m: hoje.getMonth() });
  const ativos = (subs || []).filter((s) => subEstado(s) === "ativa" || subEstado(s) === "trial");
  const first = new Date(ref.y, ref.m, 1);
  const startDow = (first.getDay() + 6) % 7;
  const dias = new Date(ref.y, ref.m + 1, 0).getDate();
  const byDay = {};
  ativos.forEach((s) => { const d = Math.min(dias, Math.min(28, Math.max(1, +s.dia || 1))); (byDay[d] = byDay[d] || []).push(s); });
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= dias; d++) cells.push(d);
  const shift = (delta) => setRef((r) => { let m = r.m + delta, y = r.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } return { y, m }; });
  const isHoje = (d) => hoje.getFullYear() === ref.y && hoje.getMonth() === ref.m && hoje.getDate() === d;
  const listaDias = Object.keys(byDay).map(Number).sort((a, b) => a - b);
  return (
    <div className="card card-pad">
      <div className="pg-cal-head">
        <button className="pg-back" onClick={() => shift(-1)} title="Mês anterior"><span style={{ display: "grid", transform: "rotate(180deg)" }}><Icon name="chevR" size={15} /></span></button>
        <b style={{ fontSize: 15 }}>{BM.MESES[ref.m]} {ref.y}</b>
        <button className="pg-back" onClick={() => shift(1)} title="Mês seguinte"><Icon name="chevR" size={15} /></button>
      </div>
      <div className="pg-cal-grid pg-cal-dow">{["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => <span key={d}>{d}</span>)}</div>
      <div className="pg-cal-grid">
        {cells.map((d, i) => (
          <div key={i} className={"pg-cal-cell" + (d ? "" : " empty") + (d && isHoje(d) ? " hoje" : "") + (d && byDay[d] ? " tem" : "")}>
            {d && <span className="pg-cal-d">{d}</span>}
            {d && byDay[d] && <span className="pg-cal-dot">{byDay[d].length}</span>}
          </div>
        ))}
      </div>
      {listaDias.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 12 }}>Sem renovações neste mês.</div> :
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 2 }}>
          {listaDias.map((d) => byDay[d].map((s) => (
            <div className="pg-up" key={s.id + "-" + d}>
              <div className="pg-up-d"><div className="dd">{d}</div><div className="mm">{BM.MESES[ref.m].slice(0, 3)}</div></div>
              <span className="prem-rico sm" style={{ background: "color-mix(in srgb, " + (s.color || "var(--accent)") + " 14%, transparent)" }}><Icon name={s.icon || "tv"} size={15} color={s.color || "var(--accent)"} /></span>
              <div className="pg-up-main"><div className="pg-up-t">{s.nome}</div><div className="pg-up-m">{subCatMeta(subCat(s)).nome} · {cicloLabel(s.ciclo)}</div></div>
              <div className="pg-up-v">{BM.eur(s.valor)}</div>
            </div>
          )))}
        </div>}
    </div>
  );
}

/* ---- modelo unificado de recorrentes: tipo "subscricao" | "despesa" ---- */
const recTipo = (r) => (r && r.tipo === "despesa" ? "despesa" : "subscricao");
const recCatMeta = (r) => {
  if (recTipo(r) === "despesa") {
    const c = BM.cats[r.categoria];
    return c ? { nome: c.nome, color: c.color } : { nome: "Outros", color: "var(--c-outros)" };
  }
  return subCatMeta(subCat(r));
};
/* categoria (chave BM.cats) usada ao criar a despesa real quando se marca como pago */
const SUBCAT_PARA_DESPESA = { entretenimento: "lazer", musica: "lazer", jogos: "lazer", cloud: "internet", produtividade: "outros", educacao: "educacao", compras: "outros", outros: "outros" };
const recCatDespesa = (r) => recTipo(r) === "despesa"
  ? (BM.cats[r.categoria] ? r.categoria : "outros")
  : (SUBCAT_PARA_DESPESA[subCat(r)] || "outros");

/* Marca um recorrente como pago no mês: cria uma despesa REAL (entra no saldo
   e no histórico) e guarda a ligação { despesaId } para poder anular. */
async function pagarRecorrente(prem, fin, id, mesRef) {
  const s = prem.get();
  const r = (s.recorrentes || []).find((x) => x.id === id);
  if (!r) return;
  const mes = mesRef || BM.todayISO().slice(0, 7);
  const cur = s.pagosRec || {};
  const ms = { ...(cur[id] || {}) };
  if (ms[mes]) return; // já pago nesse mês
  const diaN = Math.min(28, Math.max(1, +r.dia || 1));
  let despesaId = null;
  try {
    const d = await fin.despesa.add({ nome: r.nome || "Recorrente", valor: +r.valor || 0, data: mes + "-" + String(diaN).padStart(2, "0"), cat: recCatDespesa(r), tipo: "fixa" });
    despesaId = d && d.id ? d.id : null;
  } catch (e) {}
  ms[mes] = despesaId ? { despesaId: despesaId } : true;
  prem.update({ pagosRec: { ...cur, [id]: ms } });
}

/* Desmarca o pagamento do mês: remove a despesa real associada (se existir). */
async function desmarcarRecorrente(prem, fin, id, mesRef) {
  const s = prem.get();
  const mes = mesRef || BM.todayISO().slice(0, 7);
  const cur = s.pagosRec || {};
  const marca = cur[id] && cur[id][mes];
  if (!marca) return;
  if (marca && marca.despesaId) { try { await fin.despesa.remove(marca.despesaId); } catch (e) {} }
  const ms = { ...(cur[id] || {}) };
  delete ms[mes];
  prem.update({ pagosRec: { ...cur, [id]: ms } });
}

/* Seletor visual de dia do mês — em vez de um <input type="number"> às cegas,
   mostra os dias como uma grelha clicável (como um mini-calendário). Limitado a
   28 por omissão, o mesmo limite já usado no resto do módulo (proxRenovDate,
   SubCalendario) para nunca cair num dia que não existe em fevereiro. */
function DayPicker({ value, onChange, max = 28 }) {
  const dias = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className="day-picker" role="group" aria-label="Dia do mês">
      {dias.map((d) => (
        <button type="button" key={d} className={"day-picker-btn" + (value === d ? " on" : "")} onClick={() => onChange(d)}>{d}</button>
      ))}
    </div>
  );
}

function SubModal({ mesAtual, sub, onClose, onSave }) {
  const editing = !!sub;
  const [base, setBase] = React.useState(editing ? { nome: sub.nome } : null); // null = ainda a escolher do catálogo
  const [f, setF] = React.useState(editing
    ? { tipo: recTipo(sub), nome: sub.nome || "", valor: String(sub.valor).replace(".", ","), dia: sub.dia || 1, icon: sub.icon || "tv", color: sub.color || "var(--accent)", ciclo: sub.ciclo || "mensal", categoria: recTipo(sub) === "despesa" ? (BM.cats[sub.categoria] ? sub.categoria : "outros") : subCat(sub), metodo: sub.metodo || "", estado: sub.estado || "ativa" }
    : { tipo: "subscricao", nome: "", valor: "", dia: 1, icon: "tv", color: "var(--accent)", ciclo: "mensal", categoria: "outros", metodo: "", estado: "ativa" });
  const [err, setErr] = React.useState("");
  // Aberto por omissão ao editar (aí já interessam estes campos); fechado ao
  // criar, para o fluxo rápido de "só o essencial" ficar mesmo rápido.
  const [avancado, setAvancado] = React.useState(editing);
  const escolher = (c) => { setBase(c); setF({ tipo: "subscricao", nome: c.nome, valor: String(c.valor).replace(".", ","), dia: 1, icon: c.icon, color: c.color, ciclo: "mensal", categoria: ICON_CAT[c.icon] || "outros", metodo: "", estado: "ativa" }); setErr(""); };
  const outra = () => { setBase({ nome: "" }); setF({ tipo: "subscricao", nome: "", valor: "", dia: 1, icon: "spark", color: "var(--accent)", ciclo: "mensal", categoria: "outros", metodo: "", estado: "ativa" }); setErr(""); };
  const novaDespesa = () => { setBase({ nome: "" }); setF({ tipo: "despesa", nome: "", valor: "", dia: 1, icon: "home", color: "var(--c-habitacao)", ciclo: "mensal", categoria: "habitacao", metodo: "", estado: "ativa" }); setErr(""); };
  const upd = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const mudarTipo = (e) => {
    const t = e.target.value;
    setF((s) => ({ ...s, tipo: t, categoria: t === "despesa" ? (BM.cats[s.categoria] ? s.categoria : "habitacao") : (SUB_CATS[s.categoria] ? s.categoria : "outros"), icon: t === "despesa" ? (BM.cats.habitacao ? "home" : s.icon) : s.icon }));
  };
  const guardar = () => {
    if (!f.nome.trim()) return setErr(f.tipo === "despesa" ? "Dá um nome à despesa." : "Dá um nome à subscrição.");
    if (numOf(f.valor) <= 0) return setErr("Indica um valor válido.");
    const iconFinal = f.tipo === "despesa" ? ((BM.cats[f.categoria] || {}).icon || "sync") : f.icon;
    const colorFinal = f.tipo === "despesa" ? ((BM.cats[f.categoria] || {}).color || "var(--accent)") : f.color;
    onSave({ tipo: f.tipo, nome: f.nome.trim(), valor: numOf(f.valor), dia: Math.min(28, Math.max(1, +f.dia || 1)), icon: iconFinal, color: colorFinal, ciclo: f.ciclo, categoria: f.categoria, metodo: f.metodo.trim(), estado: f.estado, desde: editing ? sub.desde : mesAtual });
  };

  if (base === null) {
    return (
      <Modal title="Adicionar recorrente" sub="Escolhe um ponto de partida — ajustas tudo a seguir." icon="sync" onClose={onClose} wide
        footer={<button className="btn btn-ghost" onClick={onClose}>Cancelar</button>}>
        <p className="muted" style={{ fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>Escolhe um serviço (ajustas o valor a seguir), cria um à medida, ou regista uma despesa periódica (renda, água, seguro…).</p>
        <div className="sub-grid">
          {SUB_CATALOGO.map((c) => (
            <button key={c.nome} className="sub-pick" onClick={() => escolher(c)}>
              <span className="sub-pick-ico" style={{ background: `color-mix(in srgb, ${c.color} 16%, transparent)` }}><Icon name={c.icon} size={18} color={c.color} /></span>
              <span className="sub-pick-n">{c.nome}</span>
            </button>
          ))}
          <button className="sub-pick" onClick={outra}>
            <span className="sub-pick-ico" style={{ background: "var(--surface-2)" }}><Icon name="plus" size={18} color="var(--ink-2)" /></span>
            <span className="sub-pick-n">Outra…</span>
          </button>
          <button className="sub-pick" onClick={novaDespesa}>
            <span className="sub-pick-ico" style={{ background: "color-mix(in srgb, var(--accent) 14%, transparent)" }}><Icon name="home" size={18} color="var(--accent)" /></span>
            <span className="sub-pick-n">Despesa (renda, água…)</span>
          </button>
        </div>
      </Modal>
    );
  }

  const catOpts = f.tipo === "despesa" ? Object.keys(BM.cats).map((k) => ({ k, nome: BM.cats[k].nome })) : Object.keys(SUB_CATS).map((k) => ({ k, nome: SUB_CATS[k].nome }));
  return (
    <Modal title={editing ? (f.tipo === "despesa" ? "Editar despesa recorrente" : "Editar subscrição") : (base.nome || (f.tipo === "despesa" ? "Nova despesa recorrente" : "Nova subscrição"))}
      sub={f.tipo === "despesa" ? "Um pagamento que se repete todos os meses." : "Um serviço cobrado periodicamente."} icon="sync" onClose={onClose} wide
      footer={<><button className="btn btn-ghost" onClick={() => (editing ? onClose() : setBase(null))}>{editing ? "Cancelar" : "Voltar"}</button><button className="btn btn-primary" onClick={guardar}><Icon name="check" size={14} color="#fff" /> {editing ? "Guardar" : "Adicionar"}</button></>}>
      {/* Só o essencial à vista: nome, valor e o dia (visual, não um número às
          cegas). Tipo/ciclo/categoria/método/estado já têm valores sensatos por
          omissão — ficam atrás de "Mais opções", aberto logo ao editar (aí já
          interessam) e fechado ao criar (o fluxo rápido de "adicionar"). */}
      <Field label="Nome"><input className="input" autoFocus value={f.nome} onChange={upd("nome")} placeholder={f.tipo === "despesa" ? "Ex: Renda" : "Ex: Netflix"} /></Field>
      <Field label="Valor" hint={f.tipo === "despesa" ? "Podes ajustar em cada mês." : "Ajusta ao teu plano."} icon="coins"><input className="input" inputMode="decimal" value={f.valor} onChange={upd("valor")} placeholder="0,00" /></Field>
      <Field label={f.tipo === "despesa" ? "Dia de pagamento" : "Dia de renovação"} hint="Todos os meses, neste dia.">
        <DayPicker value={+f.dia || 1} onChange={(d) => setF((s) => ({ ...s, dia: d }))} />
      </Field>

      <button type="button" className="sub-adv-toggle" onClick={() => setAvancado((v) => !v)}>
        <span style={{ display: "grid", transform: avancado ? "rotate(90deg)" : "none", transition: "transform .14s ease" }}><Icon name="chevR" size={13} /></span>
        Mais opções
      </button>

      {avancado && (
        <div className="sub-adv">
          <div className="modal-row-2">
            <Field label="Tipo"><select className="select" value={f.tipo} onChange={mudarTipo}><option value="subscricao">Subscrição (serviço)</option><option value="despesa">Despesa periódica</option></select></Field>
            <Field label="Ciclo de cobrança"><select className="select" value={f.ciclo} onChange={upd("ciclo")}><option value="mensal">Mensal</option><option value="anual">Anual</option><option value="semanal">Semanal</option></select></Field>
          </div>
          <div className="modal-row-2">
            <Field label="Categoria"><select className="select" value={f.categoria} onChange={upd("categoria")}>{catOpts.map((o) => <option key={o.k} value={o.k}>{o.nome}</option>)}</select></Field>
            <Field label="Estado"><select className="select" value={f.estado} onChange={upd("estado")}><option value="ativa">Ativa</option>{f.tipo !== "despesa" && <option value="trial">Trial (período gratuito)</option>}<option value="pausada">Pausada</option><option value="cancelada">Cancelada</option></select></Field>
          </div>
          <Field label="Método de pagamento" hint="opcional"><input className="input" value={f.metodo} onChange={upd("metodo")} placeholder="Ex: Visa •• 42" /></Field>
        </div>
      )}
      {err && <div className="alert bad" style={{ padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
    </Modal>
  );
}

function Subscricoes() { return <PremiumGate><SubscricoesInner /></PremiumGate>; }

function SubSkeleton() {
  return (
    <>
      <div className="card ph-statsbar">{[0, 1, 2, 3, 4].map((i) => <div className="ph-stat" key={i}><div className="sk-line" style={{ width: "70%", height: 11 }} /><div className="sk-line" style={{ width: "60%", height: 20, marginTop: 8 }} /></div>)}</div>
      <div className="ph-layout">
        <div className="ph-main"><div className="card" style={{ padding: 16 }}>{[0, 1, 2, 3, 4].map((i) => <div className="sk-row" key={i}><div className="sk-box" style={{ width: 30, height: 30, borderRadius: 9 }} /><div className="sk-line" style={{ flex: 1, height: 13 }} /><div className="sk-line" style={{ width: 60, height: 13 }} /></div>)}</div></div>
        <div className="ph-aside"><div className="card card-pad" style={{ display: "grid", placeItems: "center", minHeight: 200 }}><div className="sk-box" style={{ width: 160, height: 160, borderRadius: "50%" }} /></div></div>
      </div>
    </>
  );
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
  const [aPagar, setAPagar] = React.useState(null); // id em processamento
  const [delRecId, setDelRecId] = React.useState(null);
  const pageSize = 6;

  React.useEffect(() => { const t = setTimeout(() => setLoading(false), 340); return () => clearTimeout(t); }, []);
  React.useEffect(() => { if (!menuId) return; const h = () => setMenuId(null); document.addEventListener("click", h); window.addEventListener("scroll", h, true); window.addEventListener("resize", h); return () => { document.removeEventListener("click", h); window.removeEventListener("scroll", h, true); window.removeEventListener("resize", h); }; }, [menuId]);
  React.useEffect(() => { setPage(1); }, [q, filtro, ordem]);

  const isPago = (id) => !!(pagos[id] && pagos[id][mes]);
  const togglePago = async (id) => {
    if (aPagar) return;
    setAPagar(id);
    try { if (isPago(id)) await desmarcarRecorrente(prem, fin, id, mes); else await pagarRecorrente(prem, fin, id, mes); }
    finally { setAPagar(null); }
  };
  const apagar = (id) => { const cur = prem.get().pagosRec || {}; if (cur[id]) { const c2 = { ...cur }; delete c2[id]; prem.update({ pagosRec: c2 }); } prem.remove("recorrentes", id); };
  const setEstado = (id, estado) => prem.edit("recorrentes", id, { estado });

  const faturaveis = todas.filter((s) => subEstado(s) === "ativa");
  const totalMes = faturaveis.reduce((a, s) => a + mensalDe(s), 0);
  const nAtivas = faturaveis.length;
  const pagoMes = todas.filter((s) => isPago(s.id)).reduce((a, s) => a + (+s.valor || 0), 0);
  const nPagas = todas.filter((s) => isPago(s.id)).length;
  const faltaMes = Math.max(0, faturaveis.filter((s) => !isPago(s.id)).reduce((a, s) => a + mensalDe(s), 0));
  const prox30 = todas.filter((s) => { const st = subEstado(s); if (st === "cancelada" || st === "pausada") return false; return !isPago(s.id) && diasAte(proxRenovDate(s)) >= 0 && diasAte(proxRenovDate(s)) <= 30; });

  const porCat = {};
  faturaveis.forEach((s) => { const m = recCatMeta(s); if (!porCat[m.nome]) porCat[m.nome] = { nome: m.nome, color: m.color, valor: 0 }; porCat[m.nome].valor += mensalDe(s); });
  const donutData = Object.keys(porCat).map((k) => ({ key: k, nome: porCat[k].nome, color: porCat[k].color, valor: porCat[k].valor })).sort((a, b) => b.valor - a.valor);

  const renovacoes = todas.filter((s) => (subEstado(s) === "ativa" || subEstado(s) === "trial") && !isPago(s.id))
    .map((s) => ({ s, d: proxRenovDate(s), dias: diasAte(proxRenovDate(s)) })).sort((a, b) => a.d - b.d).slice(0, 5);

  const soSubs = faturaveis.filter((s) => recTipo(s) === "subscricao");
  const porCatSub = {};
  soSubs.forEach((s) => { const c = subCat(s); (porCatSub[c] = porCatSub[c] || []).push(s); });
  const sugestoes = [];
  Object.keys(porCatSub).forEach((c) => { const doCat = porCatSub[c]; if (doCat.length > 1) { const menor = Math.min.apply(null, doCat.map((s) => mensalDe(s))); sugestoes.push({ cat: c, n: doCat.length, poupanca: menor, nomes: doCat.map((s) => s.nome) }); } });

  let lista = todas.slice();
  if (q.trim()) { const k = q.trim().toLowerCase(); lista = lista.filter((s) => (s.nome || "").toLowerCase().includes(k) || recCatMeta(s).nome.toLowerCase().includes(k)); }
  if (filtro !== "todas") lista = lista.filter((s) => subEstado(s) === filtro);
  lista.sort((a, b) => ordem === "valor" ? mensalDe(b) - mensalDe(a) : ordem === "renov" ? proxRenovDate(a) - proxRenovDate(b) : (a.nome || "").localeCompare(b.nome || ""));
  const totalPags = Math.max(1, Math.ceil(lista.length / pageSize));
  const pag = Math.min(page, totalPags);
  const visiveis = lista.slice((pag - 1) * pageSize, pag * pageSize);

  const abrirNova = () => { setEditId(null); setModal(true); };
  const abrirEdit = (id) => { setEditId(id); setModal(true); };
  const subEdit = editId ? todas.find((s) => s.id === editId) : null;
  const dataCurta = (d) => d.getDate() + " " + BM.MESES[d.getMonth()].slice(0, 3).toLowerCase();

  if (!loading && todas.length === 0) {
    return (
      <div className="content">
        <PremActions label="Adicionar recorrente" onAdd={abrirNova} />
        <EmptyState icon="sync" title="Ainda sem recorrentes" msg="Junta aqui subscrições (Netflix, Spotify…) e despesas periódicas (renda, água, seguros). Marca cada mês como pago — só aí o valor entra nas tuas despesas."
          action={<button className="btn btn-primary" onClick={abrirNova}><Icon name="plus" size={16} color="#fff" /> Adicionar recorrente</button>} />
        {modal && <SubModal mesAtual={mes} sub={null} onClose={() => setModal(false)} onSave={(it) => { prem.add("recorrentes", it); setModal(false); }} />}
      </div>
    );
  }

  return (
    <div className="content">
      <PremActions label="Adicionar recorrente" onAdd={abrirNova} />

      {loading ? <SubSkeleton /> : <>
      {/* Mesma barra usada na Partilha, em vez de 5 cartões com ícone cada um —
          consistência visual e menos "caixas" para ler antes de chegar à lista. */}
      <div className="card ph-statsbar">
        <div className="ph-stat"><div className="ph-stat-lbl">Previsto este mês</div><div className="ph-stat-val">{BM.eur(totalMes)}</div></div>
        <div className="ph-stat"><div className="ph-stat-lbl">Pago este mês</div><div className="ph-stat-val pos">{BM.eur(pagoMes)}</div><div className="ph-stat-sub">{nPagas} liquidado{nPagas === 1 ? "" : "s"}</div></div>
        <div className="ph-stat"><div className="ph-stat-lbl">Falta pagar</div><div className={"ph-stat-val" + (faltaMes > 0 ? " neg" : "")}>{BM.eur(faltaMes)}</div></div>
        <div className="ph-stat"><div className="ph-stat-lbl">Ativas</div><div className="ph-stat-val">{nAtivas}</div></div>
        <div className="ph-stat"><div className="ph-stat-lbl">Próx. 30 dias</div><div className="ph-stat-val">{prox30.length}</div></div>
      </div>

      <div className="ph-layout">
        <div className="ph-main">
          <div className="ph-toolbar sub-tools">
            <div className="ph-search"><Icon name="search" size={15} color="var(--ink-3)" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar subscrição…" /></div>
          </div>

          <div className="card sub-tablewrap">
            {visiveis.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, padding: 28, textAlign: "center" }}>Nenhuma recorrente corresponde aos filtros.</div> :
            <table className="sub-table">
              <thead><tr><th>Nome</th><th>Categoria</th><th>Valor</th><th>Ciclo</th><th>Próximo pagamento</th><th className="sub-col-m">Método</th><th>Estado</th><th className="sub-col-act" aria-label="Ações"></th></tr></thead>
              <tbody>
                {visiveis.map((s) => {
                  const cor = s.color || "var(--accent)";
                  const d = proxRenovDate(s); const dd = diasAte(d);
                  const meta = recCatMeta(s);
                  const pago = isPago(s.id);
                  return (
                    <tr key={s.id} className={subEstado(s) === "cancelada" ? "is-off" : ""}>
                      <td><div className="sub-serv"><span className="prem-rico sm" style={{ background: "color-mix(in srgb, " + cor + " 14%, transparent)" }}><Icon name={s.icon || (recTipo(s) === "despesa" ? "sync" : "tv")} size={16} color={cor} /></span><div style={{ minWidth: 0 }}><b>{s.nome}</b><span className="rec-tipo">{recTipo(s) === "despesa" ? "Despesa" : "Subscrição"}</span></div></div></td>
                      <td><span className="sub-cat-tag" style={{ "--cc": meta.color }}>{meta.nome}</span></td>
                      <td className="tnum" style={{ fontWeight: 800 }}>{BM.eur(s.valor)}</td>
                      <td className="muted">{cicloLabel(s.ciclo)}</td>
                      <td><div className="sub-renov">{pago ? <><b style={{ color: "var(--pos)" }}>Pago ✓</b><span className="muted tiny">este mês</span></> : <><b>{dataCurta(d)}</b><span className="muted tiny">{dd === 0 ? "hoje" : dd === 1 ? "amanhã" : "em " + dd + " dias"}</span></>}</div></td>
                      <td className="muted sub-col-m">{s.metodo || "—"}</td>
                      <td>{subEstadoPill(s)}</td>
                      <td className="sub-col-act">
                        <button className="icon-btn" title="Ações" onClick={(e) => { e.stopPropagation(); if (menuId === s.id) { setMenuId(null); return; } const r = e.currentTarget.getBoundingClientRect(); setMenuPos({ top: Math.round(r.bottom + 6), right: Math.round(window.innerWidth - r.right) }); setMenuId(s.id); }}><Icon name="dots" size={18} color="var(--ink-2)" /></button>
                        {menuId === s.id && ReactDOM.createPortal(
                          <div className="ph-menu sub-menu-pop" style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 400 }} onClick={(e) => e.stopPropagation()}>
                            <button disabled={aPagar === s.id} onClick={() => { togglePago(s.id); setMenuId(null); }}><Icon name="check" size={15} color="var(--ink-2)" /> {pago ? "Anular pagamento (mês)" : "Marcar pago (mês)"}</button>
                            <button onClick={() => { abrirEdit(s.id); setMenuId(null); }}><Icon name="edit" size={15} color="var(--ink-2)" /> Editar</button>
                            {subEstado(s) === "pausada"
                              ? <button onClick={() => { setEstado(s.id, "ativa"); setMenuId(null); }}><Icon name="check" size={15} color="var(--ink-2)" /> Retomar</button>
                              : <button onClick={() => { setEstado(s.id, "pausada"); setMenuId(null); }}><Icon name="history" size={15} color="var(--ink-2)" /> Pausar</button>}
                            {subEstado(s) === "cancelada"
                              ? <button onClick={() => { setEstado(s.id, "ativa"); setMenuId(null); }}><Icon name="check" size={15} color="var(--ink-2)" /> Reativar</button>
                              : <button onClick={() => { setEstado(s.id, "cancelada"); setMenuId(null); }}><Icon name="x" size={15} color="var(--ink-2)" /> Cancelar</button>}
                            <button className="danger" onClick={() => { setDelRecId(s.id); setMenuId(null); }}><Icon name="trash" size={15} color="var(--neg)" /> Eliminar</button>
                          </div>, document.body)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>}
          </div>

          {totalPags > 1 && (
            <div className="sub-pag">
              <button className="btn btn-soft" disabled={pag <= 1} onClick={() => setPage(pag - 1)}>Anterior</button>
              <span className="muted tiny" style={{ fontWeight: 700 }}>Página {pag} de {totalPags} · {lista.length} recorrente{lista.length === 1 ? "" : "s"}</span>
              <button className="btn btn-soft" disabled={pag >= totalPags} onClick={() => setPage(pag + 1)}>Seguinte</button>
            </div>
          )}

          <div className="sub-cal-block">
            <div className="prem-sec-t" style={{ marginBottom: 4 }}>Calendário de pagamentos</div>
            <div className="sub-sec-sub">Todas as datas de pagamento do mês, num relance.</div>
            <div className="sub-cal"><SubCalendario subs={todas} /></div>
          </div>
        </div>

        <div className="ph-aside">
          <div className="card card-pad">
            <div className="prem-sec-t">Gastos por categoria</div>
            <div className="sub-sec-sub">Distribuição do custo mensal por categoria.</div>
            {donutData.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4 }}>Sem gastos ativos.</div> :
              <>
                <div style={{ display: "grid", placeItems: "center", padding: "6px 0 10px" }}>
                  <DonutChart data={donutData} size={168} thickness={20} center={<div style={{ textAlign: "center" }}><div className="tnum" style={{ fontSize: 18, fontWeight: 800 }}>{BM.eur(totalMes)}</div><div className="muted tiny" style={{ fontWeight: 600 }}>por mês</div></div>} />
                </div>
                {donutData.map((d) => (<div className="sub-leg" key={d.key}><span className="sub-leg-dot" style={{ background: d.color }} /><span className="sub-leg-n">{d.nome}</span><span className="tnum sub-leg-v">{BM.eur(d.valor)}</span></div>))}
              </>}
          </div>

          <div className="card card-pad">
            <div className="prem-sec-t">Próximos pagamentos</div>
            <div className="sub-sec-sub">O que ainda falta pagar, por ordem cronológica.</div>
            {renovacoes.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4 }}>Sem renovações próximas.</div> :
              renovacoes.map(({ s, d, dias }) => {
                const cor = s.color || "var(--accent)";
                return (
                  <div className="sub-up" key={s.id}>
                    <span className="prem-rico sm" style={{ background: "color-mix(in srgb, " + cor + " 14%, transparent)" }}><Icon name={s.icon || "tv"} size={15} color={cor} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 13.5 }}>{s.nome}</b><div className="muted tiny">{dias === 0 ? "Vence hoje" : dias === 1 ? "Vence amanhã" : dataCurta(d) + " · em " + dias + " dias"}</div></div>
                    <b className="tnum" style={{ fontSize: 13.5 }}>{BM.eur(s.valor)}</b>
                  </div>
                );
              })}
          </div>

          <div className="card card-pad">
            <div className="prem-sec-t">Sugestões de poupança</div>
            <div className="sub-sec-sub">Serviços semelhantes ou duplicados que podes rever.</div>
            {sugestoes.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4, lineHeight: 1.5 }}>Nada a assinalar — sem serviços duplicados. 👌</div> :
              sugestoes.map((x) => (
                <div className="sub-sugg" key={x.cat}>
                  <Icon name="info" size={15} color="var(--accent)" />
                  <div><div style={{ fontSize: 13, fontWeight: 700 }}>Tens {x.n} serviços de {subCatMeta(x.cat).nome}.</div><div className="muted tiny" style={{ marginTop: 2, lineHeight: 1.45 }}>{x.nomes.join(", ")} · poupa ~{BM.eur(x.poupanca)}/mês</div></div>
                </div>
              ))}
          </div>
        </div>
      </div>
      </>}

      {modal && <SubModal mesAtual={mes} sub={subEdit} onClose={() => { setModal(false); setEditId(null); }} onSave={(it) => { if (editId) prem.edit("recorrentes", editId, it); else prem.add("recorrentes", it); setModal(false); setEditId(null); }} />}
      {delRecId && <RLConfirmPin title="Eliminar recorrente" desc="Vais eliminar esta recorrente e as suas marcas de pagamento. As despesas já criadas nos meses pagos mantêm-se no histórico. Esta ação não pode ser revertida." onConfirm={() => apagar(delRecId)} onClose={() => setDelRecId(null)} />}
    </div>
  );
}

/* ---------------- Notificações (avisos de pagamento) ---------------- */
/* Varre lembretes (por pagar) e subscrições (por pagar no mês atual) e
   devolve os que vencem dentro de X dias (cfg.aviso) ou já estão atrasados.
   Baseia-se SEMPRE na data real de hoje, não no mês que estás a ver. */
function scanAlertas(prem) {
  const s = prem.get();
  const aviso = (s.notif && typeof s.notif.aviso === "number") ? s.notif.aviso : 3;
  const out = [];
  (s.lembretes || []).filter((l) => !l.pago).forEach((l) => {
    const d = daysUntil(l.data);
    if (d <= aviso) out.push({ chave: "lem:" + l.id, tipo: "lembrete", id: l.id, titulo: l.titulo, valor: l.valor, d });
  });
  const mes = BM.todayISO().slice(0, 7);
  const pagosR = s.pagosRec || {};
  (s.recorrentes || []).forEach((r) => {
    const st = subEstado(r);
    if (st === "pausada" || st === "cancelada" || st === "trial") return; // trials tratados à parte
    if (r.desde && r.desde > mes) return; // ainda não começou
    if (pagosR[r.id] && pagosR[r.id][mes]) return; // já paga este mês
    const alvo = mes + "-" + String(Math.min(28, r.dia || 1)).padStart(2, "0");
    const d = daysUntil(alvo);
    if (d <= aviso) out.push({ chave: "rec:" + r.id + ":" + mes, tipo: recTipo(r), id: r.id, titulo: r.nome || r.titulo, valor: r.valor, d });
  });
  return out.sort((a, b) => a.d - b.d);
}

/* Resolve um alerta (marca como pago — cria a despesa real via pagarRecorrente). */
function resolverAlerta(prem, a, fin) {
  if (a.tipo === "lembrete") {
    const l = (prem.get().lembretes || []).find((x) => x.id === a.id);
    if (l && l.repete) { const dt = new Date(l.data + "T00:00:00"); dt.setMonth(dt.getMonth() + 1); prem.edit("lembretes", a.id, { data: dt.toISOString().slice(0, 10) }); }
    else prem.edit("lembretes", a.id, { pago: true });
    return;
  }
  return pagarRecorrente(prem, fin, a.id);
}

/* Dias decorridos desde uma data ISO (positivo se no passado). */
function diasDesde(iso) {
  if (!iso) return 0;
  const h = new Date(); const hj = new Date(h.getFullYear(), h.getMonth(), h.getDate());
  const p = String(iso).slice(0, 10).split("-").map(Number);
  const d = new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
  return Math.round((hj - d) / 86400000);
}

/* Semana ISO (ex.: "2026-W28") — usada para o resumo semanal aparecer uma vez por semana. */
function isoWeekKey(d) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const anoInicio = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const semana = Math.ceil((((dt - anoInicio) / 86400000) + 1) / 7);
  return dt.getUTCFullYear() + "-W" + String(semana).padStart(2, "0");
}

/* MOTOR DE NOTIFICAÇÕES — função pura: recebe o estado, devolve a lista.
   Hoje corre no browser; amanhã, com backend, corre igual num cron job.
   Categorias: pagamento · trial · orcamento · meta · insight · inatividade · resumo
   "account" é opcional (só é preciso para o resumo semanal, que depende de account.resumoSemanal). */
function gerarNotificacoes(prem, dados, account) {
  const s = prem.get();
  const d0 = dados || {};
  const out = [];
  const mes = BM.todayISO().slice(0, 7);

  // 1) Pagamentos a vencer (lembretes, subscrições, recorrentes) — reutiliza scanAlertas
  scanAlertas(prem).forEach((a) => {
    out.push({
      chave: a.chave, cat: "pagamento", sev: a.d <= 0 ? "urgent" : "warn",
      icon: a.tipo === "subscricao" ? "tv" : a.tipo === "despesa" ? "sync" : "bell",
      titulo: (a.tipo === "despesa" ? "Despesa por pagar: " : a.tipo === "subscricao" ? "Subscrição por pagar: " : "") + a.titulo, texto: quandoTxt(a.d), valor: a.valor, d: a.d,
      tipo: a.tipo, id: a.id, acao: "pagar",
    });
  });

  // 2) Períodos gratuitos (trials) a terminar
  (s.recorrentes || []).filter((x) => (x.estado || "ativa") === "trial").forEach((x) => {
    const dias = daysUntil(mes + "-" + String(Math.min(28, x.dia || 1)).padStart(2, "0"));
    if (dias <= 5) out.push({
      chave: "trial:" + x.id + ":" + mes, cat: "trial", sev: dias <= 2 ? "urgent" : "warn", icon: "spark",
      titulo: x.nome + " — período gratuito a terminar",
      texto: (dias <= 0 ? "Termina hoje" : "Termina em " + dias + " dia" + (dias > 1 ? "s" : "")) + " · depois passa a " + BM.eur(x.valor) + "/mês",
      rota: "agenda",
    });
  });

  // 3) Orçamento mensal (80% / ultrapassado)
  const orc = +d0.orcamento || 0;
  if (orc > 0) {
    const gasto = (d0.despesas || []).filter((e) => BM.monthKey(e.data) === mes).reduce((a, e) => a + (+e.valor || 0), 0);
    const pct = Math.round((gasto / orc) * 100);
    if (gasto >= orc) out.push({ chave: "orc:over:" + mes, cat: "orcamento", sev: "urgent", icon: "wallet", titulo: "Orçamento do mês ultrapassado", texto: "Já gastaste " + BM.eur(gasto) + " de " + BM.eur(orc) + " (" + pct + "%).", rota: "relatorios" });
    else if (gasto >= orc * 0.8) out.push({ chave: "orc:80:" + mes, cat: "orcamento", sev: "warn", icon: "wallet", titulo: "Perto do limite do orçamento", texto: "Já usaste " + pct + "% (" + BM.eur(gasto) + " de " + BM.eur(orc) + ").", rota: "relatorios" });
  }

  // 3b) Taxa de poupança do mês (mudou-se do Dashboard para aqui — mesma fórmula/limiar
  // que lá estava: saldo/recebido, a partir de 10%).
  const despesasMes = (d0.despesas || []).filter((e) => BM.monthKey(e.data) === mes);
  const rendimentosMes = (d0.rendimentos || []).filter((r) => BM.monthKey(r.data) === mes);
  const totalRecMes = rendimentosMes.reduce((a, r) => a + (+r.valor || 0), 0);
  const totalGastoMes = despesasMes.reduce((a, e) => a + (+e.valor || 0), 0);
  const saldoMes = totalRecMes - totalGastoMes;
  const taxaPoupMes = totalRecMes > 0 ? Math.round((saldoMes / totalRecMes) * 100) : 0;
  if (saldoMes >= 0 && taxaPoupMes >= 10) {
    out.push({ chave: "poupanca:" + mes, cat: "poupanca", sev: "info", icon: "target", titulo: "Estás a poupar " + taxaPoupMes + "% do que recebes", texto: "Bom trabalho — continua assim!", rota: "relatorios" });
  }

  // 4) Metas de poupança (50% / concluída)
  (d0.metas || []).forEach((m) => {
    if (m.fechada) return;
    const alvo = +m.alvo || 0, atual = +m.atual || 0;
    if (alvo <= 0) return;
    const pct = atual / alvo;
    if (atual >= alvo) out.push({ chave: "meta:done:" + m.id, cat: "meta", sev: "info", icon: "target", titulo: "Meta atingida: " + m.nome, texto: "Chegaste a " + BM.eur(atual) + " de " + BM.eur(alvo) + ". Já podes fechar esta meta.", rota: "objetivos" });
    else if (pct >= 0.5) out.push({ chave: "meta:half:" + m.id + ":" + mes, cat: "meta", sev: "info", icon: "target", titulo: "Já vais a meio: " + m.nome, texto: Math.round(pct * 100) + "% da meta (" + BM.eur(atual) + " de " + BM.eur(alvo) + ").", rota: "objetivos" });
  });

  // 5) Insights — subscrições semelhantes/duplicadas
  const porCat = {};
  (s.recorrentes || []).filter((x) => recTipo(x) === "subscricao" && (x.estado || "ativa") === "ativa").forEach((x) => { const c = subCat(x); (porCat[c] = porCat[c] || []).push(x); });
  Object.keys(porCat).forEach((c) => {
    if (porCat[c].length > 1) {
      const menor = Math.min.apply(null, porCat[c].map((x) => mensalDe(x)));
      out.push({ chave: "dup:" + c, cat: "insight", sev: "info", icon: "spark", titulo: "Tens " + porCat[c].length + " serviços de " + subCatMeta(c).nome, texto: porCat[c].map((x) => x.nome).join(", ") + " · podes poupar ~" + BM.eur(menor) + "/mês.", rota: "agenda" });
    }
  });

  // 6) Inatividade — sem registar despesas/rendimentos há 3 dias / 1 semana / 1 mês
  const datas = [].concat(d0.despesas || [], d0.rendimentos || []).map((m) => m.data).filter(Boolean).sort();
  if (datas.length) {
    const dias = diasDesde(datas[datas.length - 1]);
    let lim = 0; if (dias >= 30) lim = 30; else if (dias >= 7) lim = 7; else if (dias >= 3) lim = 3;
    if (lim) {
      const txt = lim === 30 ? "um mês" : lim === 7 ? "uma semana" : "3 dias";
      out.push({ chave: "inativo:" + lim, cat: "inatividade", sev: lim >= 30 ? "warn" : "info", icon: "history",
        titulo: "Há mais de " + txt + " sem registos", texto: "O último movimento foi há " + dias + " dias. Regista as tuas despesas recentes para manteres as contas em dia.", rota: "transacoes" });
    }
  }

  // 7) Resumo semanal — uma entrada por semana ISO, só com dados reais dos últimos 7 dias.
  // Fica como notificação interna (sem envio de email: não há infraestrutura de backend para isso).
  if (!account || account.resumoSemanal !== false) {
    const semanaKey = isoWeekKey(new Date());
    const desde = new Date(); desde.setDate(desde.getDate() - 7);
    const desdeISO = desde.toISOString().slice(0, 10);
    const despSemana = (d0.despesas || []).filter((e) => (e.data || "") >= desdeISO);
    const recSemana = (d0.rendimentos || []).filter((r) => (r.data || "") >= desdeISO).reduce((a, r) => a + (+r.valor || 0), 0);
    const gastoSemana = despSemana.reduce((a, e) => a + (+e.valor || 0), 0);
    if (recSemana > 0 || gastoSemana > 0) {
      const porCatSemana = {};
      despSemana.forEach((e) => { porCatSemana[e.cat] = (porCatSemana[e.cat] || 0) + (+e.valor || 0); });
      const catTopoKey = Object.keys(porCatSemana).sort((a, b) => porCatSemana[b] - porCatSemana[a])[0];
      const catTopoNome = catTopoKey ? (BM.cats[catTopoKey] || BM.cats.outros).nome : null;
      const diff = recSemana - gastoSemana;
      const partes = ["Recebido " + BM.eur(recSemana), "gasto " + BM.eur(gastoSemana), (diff >= 0 ? "saldo +" : "saldo ") + BM.eur(diff)];
      if (catTopoNome) partes.push("mais gasto em " + catTopoNome);
      out.push({ chave: "resumo:" + semanaKey, cat: "resumo", sev: "info", icon: "report", titulo: "O seu resumo semanal", texto: partes.join(" · ") + ".", rota: "relatorios" });
    }
  }

  // 8) Partilha — dívidas em grupo, despesas de grupo a vencer e convites por aceitar.
  // Tudo calculado a partir dos grupos já guardados localmente (prem.get().grupos),
  // sem inventar valores: só entra aqui o que já existe no grupo.
  (s.grupos || []).forEach((g) => {
    const net = balancos(g);
    const meuSaldo = net["Eu"] || 0;
    if (meuSaldo < -0.01) {
      out.push({ chave: "part:divida:" + g.id + ":" + mes, cat: "partilha", sev: "warn", icon: "users",
        titulo: "Tens dívidas no grupo " + g.nome, texto: "Deves " + BM.eur(-meuSaldo) + " às despesas partilhadas deste grupo.", rota: "partilha" });
    }
    (g.despesas || []).filter((e) => e.vencimento).forEach((e) => {
      const d = daysUntil(e.vencimento);
      if (d <= 3) {
        out.push({ chave: "part:venc:" + g.id + ":" + e.id, cat: "partilha", sev: d <= 0 ? "urgent" : "warn", icon: "users",
          titulo: "Despesa do grupo " + g.nome + " por pagar", texto: e.titulo + " · " + quandoTxt(d), valor: e.valor, d, rota: "partilha" });
      }
    });
    const pendentes = (g.convites || []).filter((c) => c.estado === "pendente").length;
    if (pendentes > 0) {
      out.push({ chave: "part:conv:" + g.id, cat: "partilha", sev: "info", icon: "users",
        titulo: pendentes + (pendentes === 1 ? " convite pendente" : " convites pendentes"), texto: "No grupo " + g.nome + ", ainda por aceitar.", rota: "partilha" });
    }
  });

  const ordSev = { urgent: 0, warn: 1, info: 2 };
  return out.sort((a, b) => (ordSev[a.sev] - ordSev[b.sev]) || ((a.d == null ? 99 : a.d) - (b.d == null ? 99 : b.d)));
}

/* Dispara notificações nativas do dispositivo (só enquanto a app está aberta).
   Junta tudo numa só notificação-resumo e não repete o mesmo aviso no mesmo dia. */
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
  try { new Notification("Rende+ · " + titulo, { body: corpo, icon: "/assets/img/files/icon-192.png", badge: "/assets/img/files/icon-192.png", tag: "rende-notifs", renotify: true }); } catch (e) {}
  prem.update({ notifLog: { [hoje]: [...jaHoje, ...novos.map((a) => a.chave)] } }); // guarda só o dia de hoje (auto-limpa o passado)
}

const quandoTxt = (d) => d < 0 ? `há ${Math.abs(d)} dia${d === -1 ? "" : "s"}` : d === 0 ? "vence hoje" : `vence em ${d} dia${d > 1 ? "s" : ""}`;

// Notificações dispensadas manualmente (guardadas por "chave" — a mesma que identifica
// cada notificação gerada). Persistido localmente: se a condição que gerou o aviso deixar
// de se verificar e voltar a surgir mais tarde, a chave muda (ex.: leva o mês) e o aviso
// volta a aparecer — dispensar só esconde aquele aviso específico, não a categoria toda.
const NOTIF_DISPENSADAS_KEY = "rende_notifs_dispensadas";
const lerNotifsDispensadas = () => { try { return JSON.parse(localStorage.getItem(NOTIF_DISPENSADAS_KEY) || "[]"); } catch (e) { return []; } };
const gravarNotifsDispensadas = (arr) => { try { localStorage.setItem(NOTIF_DISPENSADAS_KEY, JSON.stringify(arr)); } catch (e) {} };

// Notificações já vistas (abertas pelo menos uma vez no sino) — separado das
// dispensadas: ver uma notificação não a esconde sozinho, só marca-a como "vista"
// para se poder limpar tudo o que já foi visto de uma vez (botão "Limpar vistas").
const NOTIF_VISTAS_KEY = "rende_notifs_vistas";
const lerNotifsVistas = () => { try { return JSON.parse(localStorage.getItem(NOTIF_VISTAS_KEY) || "[]"); } catch (e) { return []; } };
const gravarNotifsVistas = (arr) => { try { localStorage.setItem(NOTIF_VISTAS_KEY, JSON.stringify(arr)); } catch (e) {} };

function NotifBell({ go }) {
  const prem = usePremium();
  const fin = useFinance();
  const dados = fin.data || {};
  const [open, setOpen] = React.useState(false);
  const [verTodas, setVerTodas] = React.useState(false);
  const [perm, setPerm] = React.useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  const [dispensadas, setDispensadas] = React.useState(() => new Set(lerNotifsDispensadas()));
  const [vistas, setVistas] = React.useState(() => new Set(lerNotifsVistas()));
  const dispensar = (chave) => {
    setDispensadas((prev) => {
      const next = new Set(prev);
      next.add(chave);
      gravarNotifsDispensadas([...next]);
      return next;
    });
  };
  const s = prem.get();
  const cfg = s.notif || { ativo: true, aviso: 3 };
  const notifs = gerarNotificacoes(prem, dados, fin.account).filter((a) => !dispensadas.has(a.chave));
  const count = notifs.length;
  const vistasCount = notifs.filter((a) => vistas.has(a.chave)).length;
  const LIMITE = 5;
  const notifsMostradas = verTodas ? notifs : notifs.slice(0, LIMITE);
  React.useEffect(() => { if (!open) setVerTodas(false); }, [open]);
  // ao abrir o sino, tudo o que está visível agora passa a "visto" (fica disponível
  // para "Limpar vistas" a partir da próxima abertura).
  React.useEffect(() => {
    if (!open || notifs.length === 0) return;
    setVistas((prev) => {
      const next = new Set(prev);
      let mudou = false;
      notifs.forEach((a) => { if (!next.has(a.chave)) { next.add(a.chave); mudou = true; } });
      if (mudou) gravarNotifsVistas([...next]);
      return mudou ? next : prev;
    });
    // eslint: só quando o sino abre — não a cada alteração de `notifs`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const limparVistas = () => {
    const chaves = notifs.filter((a) => vistas.has(a.chave)).map((a) => a.chave);
    if (!chaves.length) return;
    setDispensadas((prev) => {
      const next = new Set(prev);
      chaves.forEach((c) => next.add(c));
      gravarNotifsDispensadas([...next]);
      return next;
    });
  };
  const irPara = (rota) => { setOpen(false); if (go) go(rota); };

  // dispara ao abrir a app e a cada 30 min enquanto está aberta
  const nMov = (dados.despesas || []).length + (dados.rendimentos || []).length;
  React.useEffect(() => {
    if (!cfg.ativo) return;
    const tick = () => dispararNotificacoesNativas(prem, fin.data || {}, fin.account);
    tick();
    const iv = setInterval(tick, 1000 * 60 * 30);
    return () => clearInterval(iv);
  }, [cfg.ativo, nMov]);

  const pedirPermissao = () => {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission().then((p) => { setPerm(p); if (p === "granted") dispararNotificacoesNativas(prem, fin.data || {}); });
  };
  const setCfg = (patch) => prem.update({ notif: { ...cfg, ...patch } });

  return (
    <div className="notif-wrap">
      <button className="icon-btn notif-btn" title="Notificações" aria-label="Abrir notificações" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Icon name="bell" size={20} />
        {count > 0 && <span className="notif-badge">{count > 9 ? "9+" : count}</span>}
      </button>
      {open && (
        <>
          <div className="notif-pop-bg" onClick={() => setOpen(false)} />
          <div className="notif-pop" onClick={(e) => e.stopPropagation()}>
            <div className="notif-head">
              <span className="notif-head-ico"><Icon name="bell" size={17} color="var(--accent)" /></span>
              <div className="notif-head-txt">
                <div className="notif-head-title">Notificações</div>
                <div className="notif-head-sub">{count > 0 ? count + (count === 1 ? " por resolver" : " por resolver") : "Estás em dia"}</div>
              </div>
              {vistasCount > 0 && (
                <button type="button" className="notif-clear-vistas" onClick={limparVistas} title="Elimina as notificações já vistas">
                  Limpar vistas
                </button>
              )}
            </div>

            {perm !== "granted" && perm !== "unsupported" && (
              <div className="notif-perm">
                <div>
                  <b style={{ fontSize: 13 }}>Ativar avisos no dispositivo</b>
                  <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                    {perm === "denied" ? "Estão bloqueados — ativa-os nas definições do navegador." : "Para receberes avisos mesmo fora desta página."}
                  </span>
                </div>
                {perm === "default" && <button className="btn btn-primary" style={{ padding: "8px 12px", fontSize: 12.5 }} onClick={pedirPermissao}>Ativar</button>}
              </div>
            )}

            <div className="notif-list">
              {notifs.length === 0 ? (
                <div className="notif-empty">
                  <span className="li-ico" style={{ width: 44, height: 44, background: "var(--accent-soft)" }}><Icon name="check" size={20} color="var(--accent)" /></span>
                  <span>Estás em dia. Nada a tratar por agora.</span>
                </div>
              ) : (
                notifsMostradas.map((a) => {
                  const cor = a.sev === "urgent" ? "var(--neg)" : a.sev === "warn" ? "#e0792b" : "var(--accent)";
                  return (
                    <div className={"notif-item sev-" + a.sev} key={a.chave}>
                      <span className="notif-item-ico" style={{ background: "color-mix(in srgb, " + cor + " 14%, transparent)" }}><Icon name={a.icon || "bell"} size={16} color={cor} /></span>
                      <div className="notif-item-txt">
                        <b>{a.titulo}</b>
                        <span className="notif-item-sub">{a.texto}{a.valor != null ? " · " + BM.eur(a.valor) : ""}</span>
                      </div>
                      {a.acao === "pagar" ? (
                        <button className="btn btn-soft" style={{ padding: "6px 11px", fontSize: 12, flex: "none" }} onClick={() => resolverAlerta(prem, a, fin)}>Pagar</button>
                      ) : a.rota && go ? (
                        <button className="btn btn-ghost" style={{ padding: "6px 11px", fontSize: 12, flex: "none" }} onClick={() => irPara(a.rota)}>Ver</button>
                      ) : null}
                      <button type="button" className="notif-item-dismiss" aria-label="Dispensar notificação" title="Dispensar" onClick={() => dispensar(a.chave)}>
                        <Icon name="close" size={13} />
                      </button>
                    </div>
                  );
                })
              )}
              {!verTodas && notifs.length > LIMITE && (
                <button type="button" className="notif-ver-todas" onClick={() => setVerTodas(true)}>Ver todas ({notifs.length})</button>
              )}
            </div>

            <div className="notif-foot">
              <button className={"notif-switch" + (cfg.ativo ? " on" : "")} onClick={() => setCfg({ ativo: !cfg.ativo })} title="Ligar/desligar avisos">
                <span className="notif-switch-dot" />
              </button>
              <span style={{ fontSize: 12.5, fontWeight: 600, flex: 1 }}>Avisos {cfg.ativo ? "ativos" : "desligados"}</span>
              <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>Avisar</span>
              <select className="select" style={{ width: "auto", padding: "5px 8px", fontSize: 12.5 }} value={cfg.aviso} onChange={(e) => setCfg({ aviso: +e.target.value })}>
                {[1, 3, 5, 7].map((n) => <option key={n} value={n}>{n} dia{n > 1 ? "s" : ""} antes</option>)}
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Rita — Assistente IA do Rende+ (página dedicada, Premium) ----------------
   O backend aplica o system prompt da Rita e cruza os dados reais da conta autenticada — o
   frontend envia apenas o histórico da conversa (API.assistenteChat, em streaming, inalterado)
   e mostra o texto que vai chegando. Nunca inventa dados: qualquer número mostrado vem sempre
   da resposta da Rita ou de cálculos reais já existentes (gerarInsights), nunca simulado. */
const horaAtual = () => new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

// Imagem da Rita — por agora só há um ficheiro (avatar redondo), reutilizado
// no cabeçalho, nas bolhas de resposta e no estado vazio do chat.
const RITA_AVATAR = "assets/img/rita.png";
const RITA_BUSTO = "assets/img/rita.png";

// Perguntas de arranque, mostradas como chips no estado vazio do chat — distintas
// das sugestões da coluna esquerda (SUGESTOES), pensadas para o primeiro contacto.
const RITA_CHIPS_INICIAIS = [
  "Para onde foi o meu dinheiro este mês?",
  "Consigo poupar mais 10%?",
  "Como estão os meus objetivos?",
];

/* Insights reais, calculados a partir dos dados já existentes (fin/prem) — só entra na lista
   o que for verdadeiro para a conta em causa; sem tendência real, sem insight. */
function gerarInsights(fin, prem) {
  const out = [];
  const despesas = (fin.data && fin.data.despesas) || [];
  const seriesArr = fin.series || [];
  const mesAnterior = seriesArr.length >= 2 ? seriesArr[seriesArr.length - 2] : null;

  if (mesAnterior && fin.catBreak && fin.catBreak.length > 0) {
    // Categoria com o maior aumento percentual face ao mês anterior (não é sempre a
    // categoria com mais gasto no total — é a que mais subiu).
    const porCatAnterior = {};
    despesas.filter((d) => BM.monthKey(d.data) === mesAnterior.key).forEach((d) => { porCatAnterior[d.cat] = (porCatAnterior[d.cat] || 0) + (+d.valor || 0); });
    let maiorAumento = null;
    fin.catBreak.forEach((c) => {
      const anteriorValor = porCatAnterior[c.key] || 0;
      if (anteriorValor > 0 && c.valor >= 20 && c.valor > anteriorValor * 1.15) {
        const pct = Math.round(((c.valor - anteriorValor) / anteriorValor) * 100);
        if (!maiorAumento || pct > maiorAumento.pct) maiorAumento = { nome: c.nome, valor: c.valor, anteriorValor, pct };
      }
    });
    if (maiorAumento) {
      out.push({ icon: "wallet", estado: "atencao", titulo: "A categoria " + maiorAumento.nome + " aumentou", texto: "Subiu " + maiorAumento.pct + "% face ao mês anterior (" + BM.eur0(maiorAumento.anteriorValor) + " para " + BM.eur0(maiorAumento.valor) + ")." });
    }
  }

  if (mesAnterior) {
    const atual = seriesArr[seriesArr.length - 1];
    const saldoAtual = atual.rec - atual.gasto;
    const saldoAnterior = mesAnterior.rec - mesAnterior.gasto;
    if (atual.rec > 0 && saldoAnterior >= 0 && saldoAtual > saldoAnterior) {
      out.push({ icon: "target", estado: "positivo", titulo: "Está a poupar mais este mês", texto: "O seu saldo disponível é " + BM.eur0(saldoAtual - saldoAnterior) + " superior ao do mês anterior." });
    }
  }

  const metaProxima = (fin.data.metas || []).filter((m) => !m.fechada && m.alvo > 0 && m.atual / m.alvo >= 0.8)
    .sort((a, b) => (b.atual / b.alvo) - (a.atual / a.alvo))[0];
  if (metaProxima) {
    const pct = Math.round((metaProxima.atual / metaProxima.alvo) * 100);
    out.push({ icon: "target", estado: "positivo", titulo: "O objetivo " + metaProxima.nome + " está próximo da conclusão", texto: "Já alcançou " + pct + "% do valor definido." });
  }

  if (prem) {
    // Janela fixa de 7 dias, independente da preferência de aviso das notificações
    // (essa é sobre quando notificar; este insight é sempre "esta semana").
    const s = prem.get();
    const proximos = (s.lembretes || []).filter((l) => !l.pago).map((l) => ({ titulo: l.titulo, d: daysUntil(l.data) })).filter((a) => a.d <= 7 && a.d >= 0);
    if (proximos.length > 0) {
      out.push({
        icon: "calendarCheck", estado: "atencao",
        titulo: proximos.length === 1 ? "Existe um pagamento importante esta semana" : "Existem " + proximos.length + " pagamentos importantes esta semana",
        texto: proximos.slice(0, 3).map((a) => a.titulo).join(", ") + ".",
      });
    }
  }

  return out;
}

/* Reconhece secções em texto simples (sem markdown) para organizar a resposta em cartão:
   Resumo / Indicadores (ou Dados) / Observação / Sugestão / Ação recomendada. Se o texto não
   tiver esta estrutura (ex.: uma resposta curta), devolve null e mostra-se como texto simples. */
const SECOES_RESPOSTA = [
  { chave: "resumo", labels: ["resumo"] },
  { chave: "indicadores", labels: ["indicadores", "dados"] },
  { chave: "observacao", labels: ["observação", "observacao"] },
  { chave: "sugestao", labels: ["sugestão", "sugestao"] },
  { chave: "acao", labels: ["ação recomendada", "acao recomendada", "ação", "acao"] },
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
    if (match) { atual = match.chave; secoes[atual] = secoes[atual] || ""; encontrouAlguma = true; return; }
    if (atual) secoes[atual] = (secoes[atual] ? secoes[atual] + "\n" : "") + linhaOriginal;
  });
  if (!encontrouAlguma) return null;
  Object.keys(secoes).forEach((k) => (secoes[k] = secoes[k].trim()));
  return secoes;
}
/* Botão de atalho por baixo de "Ação recomendada" — nunca aplica nada sozinho, só navega para
   o sítio certo; a confirmação da ação em si continua a ser sempre manual do utilizador. */
function acaoParaBotao(texto, { go, open }) {
  if (!texto) return null;
  const t = texto.toLowerCase();
  if (t.includes("orçamento") || t.includes("orcamento")) return { label: "Criar orçamento", onClick: () => open("orcamento") };
  if (t.includes("objetivo")) return { label: "Abrir objetivos", onClick: () => go("objetivos") };
  if (t.includes("relatório") || t.includes("relatorio")) return { label: "Ver relatório", onClick: () => go("relatorios") };
  if (t.includes("transaç") || t.includes("transac")) return { label: "Abrir transações", onClick: () => go("transacoes") };
  return null;
}

function RespostaCard({ secoes, hora, go, open }) {
  const botao = acaoParaBotao(secoes.acao, { go, open });
  const bloco = (chave, label) => secoes[chave] && (
    <div className="assist-resp-section">
      <div className="assist-resp-label">{label}</div>
      <div className="assist-resp-text">{secoes[chave]}</div>
    </div>
  );
  return (
    <div className="assist-msg assistant assist-resp-card">
      {bloco("resumo", "Resumo")}
      {bloco("indicadores", "Indicadores")}
      {bloco("observacao", "Observação")}
      {bloco("sugestao", "Sugestão")}
      {secoes.acao && (
        <div className="assist-resp-section">
          <div className="assist-resp-label">Ação recomendada</div>
          <div className="assist-resp-text">{secoes.acao}</div>
          {botao && <button type="button" className="btn btn-soft" style={{ marginTop: 10 }} onClick={botao.onClick}>{botao.label}</button>}
        </div>
      )}
      {hora && <span className="assist-msg-hora">{hora}</span>}
    </div>
  );
}

function AssistenteRendePage({ go, open }) {
  const fin = useFinance();
  const prem = usePremium();
  const [mensagens, setMensagens] = React.useState([]); // [{ role, texto, hora }]
  const [input, setInput] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const [erro, setErro] = React.useState("");
  const scrollRef = React.useRef(null);
  const abortRef = React.useRef(null);

  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [mensagens]);
  React.useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

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
      onError: (e) => { setErro((e && e.message) || "Perdi-me a meio da resposta — tenta outra vez?"); setEnviando(false); },
    });
  };
  const enviar = () => enviarTexto(input);
  const onKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } };
  const limpar = () => { if (abortRef.current) abortRef.current.abort(); setMensagens([]); setErro(""); setEnviando(false); };

  const insights = gerarInsights(fin, prem);

  const ACOES_RAPIDAS = [
    { icon: "report", titulo: "Resumo financeiro", desc: "Uma visão geral da sua situação atual.", pergunta: "Como estão as minhas finanças este mês?" },
    { icon: "wallet", titulo: "Analisar despesas", desc: "Onde está a gastar mais dinheiro.", pergunta: "Onde gastei mais este mês?" },
    { icon: "target", titulo: "Ver objetivos", desc: "Progresso dos seus objetivos de poupança.", pergunta: "Qual é o progresso dos meus objetivos?" },
    { icon: "bolt", titulo: "Prever fim do mês", desc: "Quanto ainda pode gastar com segurança.", pergunta: "Quanto ainda posso gastar até ao fim do mês?" },
    { icon: "chart", titulo: "Rever orçamento", desc: "Se está dentro do limite definido.", pergunta: "Estou dentro do orçamento definido?" },
    { icon: "calendarCheck", titulo: "Agenda financeira", desc: "Os seus próximos pagamentos.", pergunta: "Quais são os meus próximos pagamentos?" },
  ];
  const SUGESTOES = [
    "Onde gastei mais este mês?",
    "Quanto ainda posso gastar este mês?",
    "Como posso atingir o meu objetivo mais rapidamente?",
    "Qual foi a minha maior despesa?",
    "Como posso melhorar o meu orçamento?",
  ];

  return (
    <div className="content assist-page">
      <div className="assist-col-left">
        <div className="assist-left-head">
          {/* Em desktop este título já vive no Topbar (ver app.jsx, topbarTitle) —
              escondido aqui por CSS para não duplicar; reaparece em mobile, onde
              o Topbar não mostra título nenhum. */}
          <div className="assist-left-title-wrap">
            <h1 className="assist-left-title">Rita · Assistente Rende+</h1>
            <p className="assist-left-sub">A sua assistente de IA para compreender e organizar melhor as suas finanças.</p>
          </div>
          <button type="button" className="btn btn-ghost" disabled title="Histórico de conversas — em breve"><Icon name="history" size={14} /> Histórico</button>
        </div>

        <div className="assist-section">
          <div className="assist-section-title">Ações rápidas</div>
          <div className="assist-cards-grid">
            {ACOES_RAPIDAS.map((a) => (
              <button type="button" key={a.titulo} className="assist-action-card" onClick={() => enviarTexto(a.pergunta)}>
                <span className="assist-action-ico"><Icon name={a.icon} size={18} color="var(--accent)" /></span>
                <span className="assist-action-txt"><b>{a.titulo}</b><span>{a.desc}</span></span>
              </button>
            ))}
          </div>
        </div>

        <div className="assist-section">
          <div className="assist-section-title">Insights para si</div>
          {insights.length === 0 ? (
            <div className="assist-insight-empty">Ainda não há dados suficientes para gerar insights. Continue a registar as suas receitas e despesas.</div>
          ) : (
            <div className="assist-insights-list">
              {insights.map((ins, i) => (
                <div className={"assist-insight " + ins.estado} key={i}>
                  <span className="assist-insight-ico"><Icon name={ins.icon} size={16} /></span>
                  <div className="assist-insight-txt"><b>{ins.titulo}</b><span>{ins.texto}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="assist-section">
          <div className="assist-section-title">Faça uma pergunta</div>
          <div className="assist-suggest-list">
            {SUGESTOES.map((s) => <button type="button" key={s} className="assist-suggest-chip" onClick={() => enviarTexto(s)}>{s}</button>)}
          </div>
        </div>
      </div>

      <div className="assist-col-right">
        <div className="assist-chat-head">
          <div className="row" style={{ gap: 10 }}>
            <img className="rita-avatar rita-avatar-head" src={RITA_AVATAR} alt="" />
            <div>
              <div className="row" style={{ gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>Rita</span>
                <span className="assist-online"><span className="assist-online-dot" /> Online</span>
              </div>
              <div className="tiny muted" style={{ fontWeight: 600, marginTop: 1 }}>Assistente IA · Rende+</div>
            </div>
          </div>
          <button type="button" className="btn btn-ghost" onClick={limpar} disabled={mensagens.length === 0}><Icon name="trash" size={14} /> Limpar conversa</button>
        </div>

        <div className="assist-chat-body" ref={scrollRef}>
          {mensagens.length === 0 ? (
            <div className="assist-empty">
              <img className="rita-bust" src={RITA_BUSTO} alt="" />
              <div style={{ marginTop: 10, fontWeight: 700, fontSize: 14.5 }}>Olá! Sou a Rita.</div>
              <div className="tiny muted" style={{ marginTop: 4, fontWeight: 600, lineHeight: 1.5 }}>Pergunta-me qualquer coisa sobre as tuas finanças.</div>
              <div className="rita-empty-chips">
                {RITA_CHIPS_INICIAIS.map((p) => (
                  <button type="button" key={p} className="assist-suggest-chip" onClick={() => enviarTexto(p)}>{p}</button>
                ))}
              </div>
            </div>
          ) : (
            mensagens.map((m, i) => {
              const isLast = i === mensagens.length - 1;
              const podeEstruturar = m.role === "assistant" && !(isLast && enviando);
              const estruturada = podeEstruturar ? parseRespostaAssistente(m.texto) : null;
              const aPensar = m.role === "assistant" && isLast && enviando && !m.texto;
              const corpo = estruturada
                ? <RespostaCard secoes={estruturada} hora={m.hora} go={go} open={open} />
                : (
                  <div className={"assist-msg " + m.role}>
                    <div>{m.texto ? m.texto : (aPensar ? <span className="assist-typing"><i /><i /><i /></span> : "")}</div>
                    {m.hora && <span className="assist-msg-hora">{m.hora}</span>}
                  </div>
                );
              // Avatar da Rita junto às suas próprias mensagens (incluindo enquanto
              // "pensa"/faz streaming) — nunca junto às mensagens do utilizador.
              if (m.role !== "assistant") return <React.Fragment key={i}>{corpo}</React.Fragment>;
              return (
                <div key={i} className="assist-msg-row">
                  <img className={"rita-avatar rita-avatar-msg" + (aPensar ? " rita-avatar-pensar" : "")} src={RITA_AVATAR} alt="" />
                  {corpo}
                </div>
              );
            })
          )}
          {erro && <div className="alert bad" style={{ padding: "9px 12px", margin: "4px 0" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{erro}</span></div>}
        </div>

        <div className="assist-foot">
          <textarea className="assist-input" rows={1} placeholder="Pergunta à Rita…" value={input} disabled={enviando}
            onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} />
          <button type="button" className="icon-btn assist-send" onClick={enviar} disabled={enviando || !input.trim()} aria-label="Enviar mensagem">
            <Icon name="send" size={17} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PremiumBadge() {
  const prem = usePremium();
  if (!prem.get().premium) return null;
  return <span className="prem-tag"><Icon name="spark" size={11} color="#fff" /> Premium</span>;
}

Object.assign(window, { PremiumStore, usePremium, Paywall, PremiumGate, Lembretes, Recorrentes, AgendaFinanceira, Partilha, Previsao, PremiumBadge, AssistenteRendePage });