/* ===== Screens (parte 2): Poupança, Relatórios, Histórico, Definições ===== */

/* ---------- POUPANÇA ---------- */
function Poupanca({ open }) {
  const fin = useFinance();
  const metas = fin.data.metas;
  const totalAlvo = metas.reduce((s, m) => s + (+m.alvo || 0), 0);
  const totalAtual = metas.reduce((s, m) => s + (+m.atual || 0), 0);
  const pct = totalAlvo > 0 ? Math.round((totalAtual / totalAlvo) * 100) : 0;
  const mesLabel = (key) => { const [y, mo] = (key || "").split("-").map(Number); return mo ? BM.MESES[mo - 1] + " " + y : ""; };

  return (
    <div className="content">
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <Kpi label="Total poupado" value={BM.eur0(totalAtual)} icon="target" color="var(--accent)" sub={`Em ${metas.length} ${metas.length === 1 ? "meta" : "metas"}`} />
        <Kpi label="Objetivo total" value={BM.eur0(totalAlvo)} icon="flag" color="var(--c-habitacao)" sub="Soma de todas as metas" />
        <Kpi label="Progresso global" value={pct + "%"} icon="chart" color="var(--c-educacao)" sub={totalAlvo > 0 ? `Faltam ${BM.eur0(totalAlvo - totalAtual)}` : "Sem metas ainda"} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        {metas.map((m) => {
          const isOpen = !m.alvo || m.alvo <= 0;
          const p = isOpen ? null : Math.round((m.atual / m.alvo) * 100);
          const done = !isOpen && m.atual >= m.alvo;
          const fechada = !!m.fechada;
          return (
            <div className="card card-pad" key={m.id} style={{ display: "flex", flexDirection: "column", gap: 16, opacity: fechada ? 0.74 : 1 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="li-ico" style={{ width: 44, height: 44, background: `color-mix(in srgb, ${m.cor} 16%, transparent)` }}>
                  <Icon name={done || fechada ? "check" : "target"} size={20} color={m.cor} sw={2} />
                </div>
                <div className="row" style={{ gap: 4 }}>
                  <span className="chip" style={{ background: `color-mix(in srgb, ${m.cor} 14%, transparent)`, color: m.cor, borderColor: "transparent" }}>{fechada ? "Concluída" : isOpen ? "Livre" : p + "%"}</span>
                  <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => open("meta", m)}><Icon name="edit" size={13} /></button>
                  <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => fin.meta.remove(m.id)}><Icon name="trash" size={13} /></button>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{m.nome}</div>
                <div className="tnum" style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{BM.eur0(m.atual)} {isOpen ? <span style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 700 }}>acumulado</span> : <span style={{ fontSize: 15, color: "var(--ink-3)", fontWeight: 700 }}>/ {BM.eur0(m.alvo)}</span>}</div>
              </div>
              {isOpen
                ? <div className="bar" style={{ opacity: .5 }}><i style={{ width: "100%", background: m.cor }} /></div>
                : <Progress value={m.atual} max={m.alvo} color={m.cor} />}
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <span className="tiny muted" style={{ fontWeight: 700 }}>{fechada ? `Concluída${m.fechadaEm ? " · " + mesLabel(m.fechadaEm) : ""}` : isOpen ? "Poupança sem objetivo fixo" : done ? "Meta atingida 🎉" : `Faltam ${BM.eur0(m.alvo - m.atual)}`}</span>
                <div className="row" style={{ gap: 8 }}>
                  {!fechada && <button className="btn btn-soft" style={{ flex: 1, justifyContent: "center", padding: "8px 12px" }} onClick={() => open("deposit", m)}><Icon name="plus" size={14} /> Depositar</button>}
                  {fechada
                    ? <button className="btn btn-soft" style={{ flex: 1, justifyContent: "center", padding: "8px 12px" }} onClick={() => fin.meta.reabrir(m.id)}><Icon name="history" size={14} /> Reabrir</button>
                    : <button className="btn btn-soft" style={{ flex: 1, justifyContent: "center", padding: "8px 12px" }} onClick={() => fin.meta.fechar(m.id)}><Icon name="check" size={14} /> Concluir</button>}
                </div>
              </div>
            </div>
          );
        })}
        <button className="card card-pad" onClick={() => open("meta")} style={{ display: "grid", placeItems: "center", border: "1.5px dashed var(--border-strong)", background: "transparent", minHeight: 220, cursor: "pointer", textAlign: "center" }}>
          <div>
            <div className="li-ico" style={{ width: 48, height: 48, margin: "0 auto 12px", background: "var(--accent-soft)" }}><Icon name="plus" size={22} color="var(--accent)" sw={2.2} /></div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Nova meta de poupança</div>
            <div className="tiny muted" style={{ marginTop: 4, fontWeight: 600, maxWidth: 180, marginInline: "auto" }}>Define um objetivo e acompanha o progresso.</div>
          </div>
        </button>
      </div>

      {metas.length > 0 && (
        <div className="card card-pad">
          <div className="section-head" style={{ marginBottom: 12 }}>
            <div>
              <div className="section-title">Evolução das poupanças</div>
              <div className="tiny muted" style={{ fontWeight: 600, marginTop: 2 }}>Acumulado de cada meta, mês a mês — as concluídas aparecem a tracejado</div>
            </div>
          </div>
          <MultiLineSavings months={fin.series.map((s) => s.m)} series={fin.metaSeries} />
          <div className="row" style={{ flexWrap: "wrap", gap: 16, marginTop: 14 }}>
            {fin.metaSeries.map((s) => (
              <span key={s.id} className="row" style={{ gap: 7, fontSize: 12.5, fontWeight: 700, opacity: s.fechada ? 0.6 : 1 }}>
                <span className="dot" style={{ background: s.cor }} />{s.nome}{s.fechada ? " (concluída)" : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {fin.totalRec > 0 && fin.saldo > 0 && metas.length > 0 && (
        <Alert kind="ok" icon="target" title={`Este mês sobrou-te ${BM.eur0(fin.saldo)} para poupar.`}>
          Considera transferir parte deste valor para uma das tuas metas.
        </Alert>
      )}
    </div>
  );
}

/* ---------- RELATÓRIOS ---------- */
function Relatorios() {
  const fin = useFinance();
  const hist = fin.historico;
  if (hist.length === 0) {
    return <div className="content"><EmptyState icon="report" title="Sem dados para relatórios"
      msg="Assim que registares rendimentos e despesas, geramos automaticamente médias, gráficos e análises da tua saúde financeira." /></div>;
  }
  const mRec = Math.round(hist.reduce((s, h) => s + h.rec, 0) / hist.length);
  const mGasto = Math.round(hist.reduce((s, h) => s + h.gasto, 0) / hist.length);
  const mPoup = mRec - mGasto;
  const taxa = mRec > 0 ? Math.round((mPoup / mRec) * 100) : 0;
  const topCat = fin.catBreak[0];

  return (
    <div className="content">
      <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <Kpi label="Média recebida / mês" value={BM.eur0(mRec)} icon="arrowsDown" color="var(--accent)" />
        <Kpi label="Média gasta / mês" value={BM.eur0(mGasto)} icon="wallet" color="var(--c-transporte)" />
        <Kpi label="Média poupada / mês" value={BM.eur0(mPoup)} icon="target" color="var(--c-educacao)" />
        <Kpi label="Taxa de poupança" value={taxa + "%"} icon="chart" color="var(--c-habitacao)" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 14 }}>Receitas vs. Despesas</div>
          <BarPair data={fin.series} height={220} />
          <div className="row tiny" style={{ fontWeight: 700, marginTop: 10, gap: 16 }}>
            <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: "var(--accent)" }} /> Receitas</span>
            <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: "var(--c-transporte)" }} /> Despesas</span>
          </div>
        </div>
        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 14 }}>Onde vai o teu dinheiro <span className="muted tiny" style={{ fontWeight: 600 }}>· {fin.monthLabel}</span></div>
          {fin.catBreak.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600 }}>Sem despesas neste mês.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {fin.catBreak.map((c) => {
                const p = fin.totalGasto > 0 ? Math.round((c.valor / fin.totalGasto) * 100) : 0;
                return (
                  <div key={c.key}>
                    <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                      <span className="row" style={{ gap: 8, fontSize: 13, fontWeight: 700 }}><span className="dot" style={{ background: c.color }} />{c.nome}</span>
                      <span className="tnum tiny" style={{ fontWeight: 700 }}>{BM.eur0(c.valor)} · {p}%</span>
                    </div>
                    <div className="bar"><i style={{ width: p + "%", background: c.color }} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card card-pad">
        <div className="section-title" style={{ marginBottom: 4 }}>Análise automática</div>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", marginTop: 12 }}>
          {topCat ? <Alert kind="bad" icon="info" title={`Maior gasto: ${topCat.nome}`}>{`Representa ${Math.round((topCat.valor / fin.totalGasto) * 100)}% das despesas de ${fin.monthLabel}.`}</Alert>
            : <Alert kind="ok" icon="check" title="Sem despesas este mês">Boa gestão!</Alert>}
          {taxa >= 0 ? <Alert kind={taxa >= 10 ? "ok" : "warn"} icon={taxa >= 10 ? "check" : "bell"} title={`Taxa média de poupança: ${taxa}%`}>{taxa >= 10 ? "Estás no bom caminho." : "Tenta reduzir despesas variáveis."}</Alert>
            : <Alert kind="bad" icon="info" title="Estás a gastar mais do que recebes">Reavalia as tuas despesas fixas.</Alert>}
          <Alert kind="ok" icon="history" title={`${hist.length} ${hist.length === 1 ? "mês registado" : "meses registados"}`}>Continua a registar para análises mais precisas.</Alert>
        </div>
      </div>
    </div>
  );
}

/* ---------- HISTÓRICO ---------- */
function Historico() {
  const fin = useFinance();
  const [q, setQ] = React.useState("");
  const hist = fin.historico.filter((h) => h.label.toLowerCase().includes(q.toLowerCase()));
  if (fin.historico.length === 0) {
    return <div className="content"><EmptyState icon="history" title="Sem histórico ainda"
      msg="O teu histórico mensal aparece aqui automaticamente à medida que vais registando rendimentos e despesas." /></div>;
  }
  const trend = fin.series.map((m) => m.rec - m.gasto);
  return (
    <div className="content">
      <div className="card">
        <div className="card-pad row" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 12 }}>
          <div className="row" style={{ flex: 1, minWidth: 220, gap: 10, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 13px" }}>
            <Icon name="search" size={17} color="var(--ink-3)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar por mês…" style={{ border: "none", background: "transparent", outline: "none", color: "var(--ink)", fontSize: 14, fontWeight: 600, fontFamily: "inherit", width: "100%" }} />
          </div>
          <span className="muted tiny" style={{ fontWeight: 700 }}>{fin.historico.length} {fin.historico.length === 1 ? "mês" : "meses"} com registos</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="t">
            <thead><tr><th>Período</th><th style={{ textAlign: "right" }}>Recebido</th><th style={{ textAlign: "right" }}>Gasto</th><th style={{ textAlign: "right" }}>Saldo</th><th>Tendência</th></tr></thead>
            <tbody>
              {hist.map((h) => {
                const saldo = h.rec - h.gasto;
                return (
                  <tr key={h.key}>
                    <td><span className="row" style={{ gap: 9, fontWeight: 700 }}><Icon name="cal" size={16} color="var(--ink-3)" />{h.label}{h.atual && <span className="chip sel" style={{ padding: "2px 8px" }}>Atual</span>}</span></td>
                    <td className="tnum" style={{ textAlign: "right", color: "var(--accent)", fontWeight: 700 }}>+{BM.eur0(h.rec)}</td>
                    <td className="tnum" style={{ textAlign: "right", color: "var(--neg)", fontWeight: 700 }}>−{BM.eur0(h.gasto)}</td>
                    <td className="tnum" style={{ textAlign: "right", fontWeight: 700, color: saldo < 0 ? "var(--neg)" : "var(--ink)" }}>{BM.eur0(saldo)}</td>
                    <td><Sparkline data={trend.length > 1 ? trend : [0, saldo]} w={80} h={26} color={saldo < 0 ? "var(--neg)" : "var(--accent)"} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- PERFIL ---------- */
/* ---------- Preferências financeiras (dados do passo 3, editáveis) ---------- */
function PerfilPreferencias() {
  const fin = useFinance();
  const a = fin.account || {};
  const [editar, setEditar] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  const SITUACOES = [["estudante", "Estudante"], ["trabalhador", "Trabalhador"], ["freelancer", "Freelancer"], ["empresario", "Empresário"], ["casado", "Casado"], ["solteiro", "Solteiro"], ["outro", "Outro"]];
  const OBJETIVOS = [["casa", "Comprar casa"], ["viajar", "Viajar"], ["carro", "Comprar carro"], ["computador", "Novo computador"], ["familia", "Família"], ["fundo", "Fundo de emergência"], ["investir", "Investir"], ["estudos", "Estudos"]];
  const PREFERENCIAS = [["controlar", "Controlar gastos"], ["poupar", "Poupança e objetivos"], ["investir", "Investir melhor"]];
  const PLANEAMENTO = [["sim", "Sim, todos os meses"], ["ainda-nao", "Ainda não"], ["comecar", "Quero começar"]];
  const PARTILHA = [["nao", "Não"], ["parceiro", "Parceiro(a)"], ["casa", "Casa partilhada"], ["familia", "Família"]];
  const RENDIMENTOS = ["Salário", "Apoio familiar", "Bolsa", "Investimentos", "Freelancer", "Rendimentos extras", "Negócio próprio", "Outro"];
  const DESPESAS = ["Renda", "Alimentação", "Streaming", "Água", "Universidade", "Lazer", "Luz", "Ginásio", "Empréstimos", "Internet", "Saúde", "Animais", "Transportes", "Seguro", "Outro"];
  const rotulo = (lista, val) => (lista.find((o) => o[0] === val) || [null, "—"])[1];

  const [f, setF] = React.useState({});
  const abrir = () => {
    setF({
      situacao: a.situacao || "estudante", objetivo: a.objetivo || "fundo", preferencia: a.preferencia || "controlar",
      planeamento: a.planeamento || "ainda-nao", partilha: a.partilha || "nao", telefone: a.telefone || "", sobre: a.sobre || "",
      fontesRendimento: Array.isArray(a.fontesRendimento) ? a.fontesRendimento : [], principaisDespesas: Array.isArray(a.principaisDespesas) ? a.principaisDespesas : [],
      notificacoes: a.notificacoes !== false, resumoSemanal: a.resumoSemanal !== false,
    });
    setMsg(""); setEditar(true);
  };
  const toggleArr = (k, v) => setF((s) => { const arr = s[k] || []; return { ...s, [k]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] }; });
  const guardar = async () => {
    setBusy(true); setMsg("");
    try { await fin.updateAccount({ ...f }); setMsg("Guardado."); setEditar(false); }
    catch (e) { setMsg(e.message || "Não foi possível guardar."); }
    finally { setBusy(false); }
  };

  const Linha = ({ label, valor }) => (
    <div className="row" style={{ justifyContent: "space-between", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
      <span className="tiny muted" style={{ fontWeight: 700 }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: 13, textAlign: "right" }}>{valor}</span>
    </div>
  );
  const Chips = ({ label, valor }) => (
    <div style={{ paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
      <div className="tiny muted" style={{ fontWeight: 700, marginBottom: 7 }}>{label}</div>
      {valor && valor.length ? <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>{valor.map((c) => <span className="chip" key={c}>{c}</span>)}</div> : <span style={{ fontWeight: 700, fontSize: 13 }}>—</span>}
    </div>
  );
  const Seletor = ({ label, lista, k }) => (
    <Field label={label}><select className="select" value={f[k]} onChange={(e) => setF((s) => ({ ...s, [k]: e.target.value }))}>{lista.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
  );
  const Multi = ({ label, opcoes, k }) => (
    <div style={{ marginBottom: 12 }}>
      <div className="tiny muted" style={{ fontWeight: 700, marginBottom: 8 }}>{label}</div>
      <div className="row" style={{ gap: 7, flexWrap: "wrap" }}>
        {opcoes.map((o) => { const on = (f[k] || []).includes(o); return <button type="button" key={o} className={"chip" + (on ? " sel" : "")} style={{ cursor: "pointer" }} onClick={() => toggleArr(k, o)}>{o}</button>; })}
      </div>
    </div>
  );

  return (
    <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 10, margin: 0 }}>
          <span className="li-ico" style={{ width: 30, height: 30, background: "var(--accent-soft)", flex: "none" }}><Icon name="target" size={16} color="var(--accent)" /></span>
          Preferências financeiras
        </div>
        {!editar && <button className="btn btn-ghost" onClick={abrir}><Icon name="edit" size={15} /> Editar</button>}
      </div>

      {msg && <div className={"alert " + (msg === "Guardado." ? "ok" : "bad")} style={{ padding: "9px 12px" }}><Icon name={msg === "Guardado." ? "check" : "info"} size={16} color={msg === "Guardado." ? "var(--accent)" : "var(--neg)"} /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{msg}</span></div>}

      {!editar ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Linha label="Situação atual" valor={rotulo(SITUACOES, a.situacao)} />
          <Linha label="Objetivo principal" valor={rotulo(OBJETIVOS, a.objetivo)} />
          <Linha label="Preferência" valor={rotulo(PREFERENCIAS, a.preferencia)} />
          <Chips label="Fontes de rendimento" valor={a.fontesRendimento} />
          <Chips label="Principais despesas" valor={a.principaisDespesas} />
          <Linha label="Planeamento" valor={rotulo(PLANEAMENTO, a.planeamento)} />
          <Linha label="Partilha de despesas" valor={rotulo(PARTILHA, a.partilha)} />
          <Linha label="Telefone" valor={a.telefone || "—"} />
          <div className="row" style={{ justifyContent: "space-between", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
            <span className="tiny muted" style={{ fontWeight: 700 }}>Notificações · Resumo semanal</span>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{a.notificacoes !== false ? "On" : "Off"} · {a.resumoSemanal !== false ? "On" : "Off"}</span>
          </div>
          <div>
            <div className="tiny muted" style={{ fontWeight: 700, marginBottom: 4 }}>Sobre os teus objetivos</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)", lineHeight: 1.5 }}>{a.sobre || "—"}</div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Seletor label="Situação atual" lista={SITUACOES} k="situacao" />
            <Seletor label="Objetivo principal" lista={OBJETIVOS} k="objetivo" />
            <Seletor label="Preferência" lista={PREFERENCIAS} k="preferencia" />
            <Seletor label="Planeamento" lista={PLANEAMENTO} k="planeamento" />
            <Seletor label="Partilha de despesas" lista={PARTILHA} k="partilha" />
            <Field label="Telefone"><input className="input" value={f.telefone} onChange={(e) => setF((s) => ({ ...s, telefone: e.target.value }))} placeholder="+351 912 345 678" inputMode="tel" /></Field>
          </div>
          <Multi label="Fontes de rendimento" opcoes={RENDIMENTOS} k="fontesRendimento" />
          <Multi label="Principais despesas" opcoes={DESPESAS} k="principaisDespesas" />
          <Field label="Sobre os teus objetivos"><textarea className="input" rows={3} maxLength={250} value={f.sobre} onChange={(e) => setF((s) => ({ ...s, sobre: e.target.value }))} placeholder="Ex.: Quero juntar dinheiro para viajar…" style={{ resize: "vertical", minHeight: 80 }} /></Field>
          <div className="row" style={{ gap: 16, flexWrap: "wrap", margin: "4px 0 10px" }}>
            <button type="button" className={"chip" + (f.notificacoes ? " sel" : "")} style={{ cursor: "pointer" }} onClick={() => setF((s) => ({ ...s, notificacoes: !s.notificacoes }))}>Notificações: {f.notificacoes ? "On" : "Off"}</button>
            <button type="button" className={"chip" + (f.resumoSemanal ? " sel" : "")} style={{ cursor: "pointer" }} onClick={() => setF((s) => ({ ...s, resumoSemanal: !s.resumoSemanal }))}>Resumo semanal: {f.resumoSemanal ? "On" : "Off"}</button>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn-soft" disabled={busy} style={{ flex: 1, justifyContent: "center" }} onClick={() => { setEditar(false); setMsg(""); }}>Cancelar</button>
            <button className="btn btn-primary" disabled={busy} style={{ flex: 1, justifyContent: "center", border: "none" }} onClick={guardar}>{busy ? "A guardar…" : "Guardar alterações"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Perfil({ open }) {
  const fin = useFinance();
  const a = fin.account || {};
  const metas = fin.data.metas || [];
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [busyDel, setBusyDel] = React.useState(false);
  const [delErr, setDelErr] = React.useState("");
  const stats = [
    { ico: "coins", v: a.moeda || "EUR", l: "Moeda", bg: "var(--accent-soft)", c: "var(--accent)" },
    { ico: "spark", v: BM.eur0(fin.poupado || 0), l: "Poupado", bg: "color-mix(in srgb, var(--c-educacao) 16%, transparent)", c: "var(--c-educacao)" },
    { ico: "flag", v: metas.length, l: metas.length === 1 ? "Meta" : "Metas", bg: "color-mix(in srgb, var(--c-habitacao) 16%, transparent)", c: "var(--c-habitacao)" },
  ];
  const Rowi = ({ label, sub, children, last }) => (
    <div className="row" style={{ justifyContent: "space-between", paddingBottom: last ? 0 : 14, borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <div><div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>{sub && <div className="tiny muted" style={{ marginTop: 2, fontWeight: 600 }}>{sub}</div>}</div>
      {children}
    </div>
  );
  return (
    <div className="content" style={{ maxWidth: 760 }}>
      <div className="card card-pad">
        <div className="row" style={{ gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <Avatar account={a} size={64} fontSize={22} />
          <div style={{ minWidth: 0, flex: "1 1 160px" }}>
            <div style={{ fontWeight: 700, fontSize: 19, letterSpacing: "-.01em" }}>{a.nome || "—"}</div>
            <div className="muted" style={{ fontWeight: 600, fontSize: 13, marginTop: 3, wordBreak: "break-word" }}>{[a.idade && `${a.idade} anos`, a.nascimento && BM.fmtData(a.nascimento), a.cidade, a.email].filter(Boolean).join(" · ") || "Sem dados"}</div>
          </div>
          <button className="btn btn-ghost" onClick={() => open("perfil")}><Icon name="edit" size={15} /> Editar</button>
        </div>
        {[a.perfil, a.estado, a.habitacao].filter(Boolean).length > 0 && (
          <div className="row" style={{ gap: 7, marginTop: 14, flexWrap: "wrap" }}>
            {[a.perfil, a.estado, a.habitacao].filter(Boolean).map((c) => <span className="chip" key={c}>{c}</span>)}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginTop: 16 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "12px 14px" }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", flex: "none", background: s.bg }}><Icon name={s.ico} size={16} color={s.c} /></span>
              <div style={{ minWidth: 0 }}><div className="tnum" style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-.01em" }}>{s.v}</div><div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600, marginTop: 1 }}>{s.l}</div></div>
            </div>
          ))}
        </div>
      </div>

      <PerfilPreferencias />

      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="li-ico" style={{ width: 30, height: 30, background: "var(--accent-soft)", flex: "none" }}><Icon name="bank" size={16} color="var(--accent)" /></span>
          Conta
        </div>
        <Rowi label="Apagar todos os dados" sub="Remove despesas, rendimentos e metas (a conta mantém-se)">
          <button className="btn btn-ghost" style={{ color: "var(--neg)", borderColor: "color-mix(in srgb, var(--neg) 35%, transparent)" }}
            onClick={() => setConfirmClear(true)}>
            <Icon name="trash" size={15} /> Limpar dados
          </button>
        </Rowi>
        <Rowi label="Terminar sessão" sub="Voltar ao ecrã de início de sessão">
          <button className="btn btn-ghost" onClick={fin.logout}><Icon name="logout" size={15} /> Sair</button>
        </Rowi>
        <Rowi label="Eliminar conta" sub="Apaga a conta e todos os dados de forma permanente" last>
          <button className="btn btn-ghost" style={{ color: "var(--neg)", borderColor: "color-mix(in srgb, var(--neg) 35%, transparent)" }}
            onClick={() => { setDelErr(""); setConfirmDelete(true); }}>
            <Icon name="trash" size={15} /> Eliminar conta
          </button>
        </Rowi>
      </div>

      {confirmClear && (
        <div className="modal-bg" onClick={() => setConfirmClear(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "30px 26px", textAlign: "center" }}>
              <div style={{ width: 66, height: 66, borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 18px", background: "color-mix(in srgb, var(--neg) 13%, transparent)" }}>
                <Icon name="trash" size={28} color="var(--neg)" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 19, letterSpacing: "-.01em" }}>Limpar todos os dados?</div>
              <div className="muted" style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.6, marginTop: 9 }}>
                Vais remover todas as despesas, rendimentos e metas. A tua conta mantém-se, mas <strong style={{ color: "var(--ink)" }}>esta ação não pode ser revertida</strong>.
              </div>
              <div className="row" style={{ gap: 10, marginTop: 24 }}>
                <button className="btn btn-soft" style={{ flex: 1, justifyContent: "center" }} onClick={() => setConfirmClear(false)}>Cancelar</button>
                <button className="btn" style={{ flex: 1, justifyContent: "center", background: "var(--neg)", color: "#fff", border: "none" }}
                  onClick={() => { setConfirmClear(false); fin.resetData(); }}>
                  <Icon name="trash" size={15} color="#fff" /> Limpar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-bg" onClick={() => !busyDel && setConfirmDelete(false)}>
          <div className="modal" style={{ maxWidth: 410 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "30px 26px", textAlign: "center" }}>
              <div style={{ width: 66, height: 66, borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 18px", background: "color-mix(in srgb, var(--neg) 13%, transparent)" }}>
                <Icon name="trash" size={28} color="var(--neg)" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 19, letterSpacing: "-.01em" }}>Eliminar a tua conta?</div>
              <div className="muted" style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.6, marginTop: 9 }}>
                Vais apagar a conta <strong style={{ color: "var(--ink)" }}>{a.email}</strong> e <strong style={{ color: "var(--ink)" }}>todos</strong> os dados — despesas, rendimentos, metas, contas e categorias. Esta ação <strong style={{ color: "var(--ink)" }}>não pode ser revertida</strong>. Se voltares a criar conta com este email, começa tudo do zero.
              </div>
              {delErr && <div className="alert bad" style={{ marginTop: 14, padding: "9px 12px", textAlign: "left" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{delErr}</span></div>}
              <div className="row" style={{ gap: 10, marginTop: 24 }}>
                <button className="btn btn-soft" disabled={busyDel} style={{ flex: 1, justifyContent: "center" }} onClick={() => setConfirmDelete(false)}>Cancelar</button>
                <button className="btn" disabled={busyDel} style={{ flex: 1, justifyContent: "center", background: "var(--neg)", color: "#fff", border: "none", opacity: busyDel ? .8 : 1, cursor: busyDel ? "wait" : "pointer" }}
                  onClick={async () => { setBusyDel(true); setDelErr(""); try { await fin.eliminarConta(); } catch (e) { setDelErr(e.message || "Não foi possível eliminar a conta."); setBusyDel(false); } }}>
                  <Icon name="trash" size={15} color="#fff" /> {busyDel ? "A eliminar…" : "Eliminar conta"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- DEFINIÇÕES ---------- */
function Definicoes({ theme, setTheme, open }) {
  const fin = useFinance();
  const a = fin.account || {};
  const [notif, setNotif] = React.useState(true);
  const [alertas, setAlertas] = React.useState(true);

  const Section = ({ title, icon, children }) => (
    <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {icon && <span className="li-ico" style={{ width: 30, height: 30, background: "var(--accent-soft)", flex: "none" }}><Icon name={icon} size={16} color="var(--accent)" /></span>}
        {title}
      </div>{children}
    </div>
  );
  const Toggle = ({ on, onClick }) => (
    <button onClick={onClick} style={{ width: 46, height: 26, borderRadius: 99, border: "none", padding: 3, background: on ? "var(--accent)" : "var(--border-strong)", display: "flex", justifyContent: on ? "flex-end" : "flex-start", transition: "background .15s" }}>
      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", display: "block", boxShadow: "0 1px 3px rgba(0,0,0,.3)" }} />
    </button>
  );
  const Rowi = ({ label, sub, children, last }) => (
    <div className="row" style={{ justifyContent: "space-between", paddingBottom: last ? 0 : 14, borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <div><div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>{sub && <div className="tiny muted" style={{ marginTop: 2, fontWeight: 600 }}>{sub}</div>}</div>
      {children}
    </div>
  );

  return (
    <div className="content" style={{ maxWidth: 760 }}>
      <Section title="Preferências" icon="gear">
        <Rowi label="Modo escuro" sub="Reduz o brilho em ambientes com pouca luz">
          <Toggle on={theme === "dark"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} />
        </Rowi>
        <Rowi label="Orçamento mensal" sub={fin.data.orcamento ? `Limite atual: ${BM.eur0(fin.data.orcamento)}` : "Ainda não definido"}>
          <button className="btn btn-ghost" onClick={() => open("orcamento")}><Icon name="edit" size={14} /> Definir</button>
        </Rowi>
        <Rowi label="Notificações" sub="Resumos semanais por email"><Toggle on={notif} onClick={() => setNotif(!notif)} /></Rowi>
        <Rowi label="Alertas inteligentes" sub="Avisos de orçamento e poupança" last><Toggle on={alertas} onClick={() => setAlertas(!alertas)} /></Rowi>
      </Section>

      <Section title="Categorias de despesa" icon="grid">
        <Rowi label="Categorias personalizadas" sub={(fin.data.customCats || []).length ? `${fin.data.customCats.length} categoria(s) criada(s)` : "Cria categorias próprias ao registar uma despesa"} last={!(fin.data.customCats || []).length}>
          <button className="btn btn-ghost" onClick={() => open("despesa")}><Icon name="plus" size={14} /> Adicionar</button>
        </Rowi>
        {(fin.data.customCats || []).length > 0 && (
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {fin.data.customCats.map((c) => (
              <span key={c.key} className="chip" style={{ gap: 7 }}>
                <span className="dot" style={{ background: c.color }} />{c.nome}
                <button onClick={() => fin.removeCategory(c.key)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "grid", color: "var(--ink-3)" }}><span style={{ transform: "rotate(45deg)", display: "grid" }}><Icon name="plus" size={13} color="var(--ink-3)" /></span></button>
              </span>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

Object.assign(window, { Perfil, Poupanca, Relatorios, Historico, Definicoes });