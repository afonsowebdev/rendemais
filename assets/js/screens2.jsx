/* ===== Screens (parte 2): Poupança, Relatórios, Histórico, Definições ===== */

/* ---------- POUPANÇA ---------- */
function Poupanca({ open }) {
  const fin = useFinance();
  const metas = fin.data.metas;
  const totalAlvo = metas.reduce((s, m) => s + (+m.alvo || 0), 0);
  const totalAtual = metas.reduce((s, m) => s + (+m.atual || 0), 0);
  const pct = totalAlvo > 0 ? Math.round((totalAtual / totalAlvo) * 100) : 0;

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
          return (
            <div className="card card-pad" key={m.id} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="li-ico" style={{ width: 44, height: 44, background: `color-mix(in srgb, ${m.cor} 16%, transparent)` }}>
                  <Icon name={done ? "check" : "target"} size={20} color={m.cor} sw={2} />
                </div>
                <div className="row" style={{ gap: 4 }}>
                  <span className="chip" style={{ background: `color-mix(in srgb, ${m.cor} 14%, transparent)`, color: m.cor, borderColor: "transparent" }}>{isOpen ? "Livre" : p + "%"}</span>
                  <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => open("meta", m)}><Icon name="edit" size={13} /></button>
                  <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => fin.meta.remove(m.id)}><Icon name="trash" size={13} /></button>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{m.nome}</div>
                <div className="tnum" style={{ marginTop: 8, fontSize: 24, fontWeight: 800 }}>{BM.eur0(m.atual)} {isOpen ? <span style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 700 }}>acumulado</span> : <span style={{ fontSize: 15, color: "var(--ink-3)", fontWeight: 700 }}>/ {BM.eur0(m.alvo)}</span>}</div>
              </div>
              {isOpen
                ? <div className="bar" style={{ opacity: .5 }}><i style={{ width: "100%", background: m.cor }} /></div>
                : <Progress value={m.atual} max={m.alvo} color={m.cor} />}
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="tiny muted" style={{ fontWeight: 700 }}>{isOpen ? "Poupança sem objetivo fixo" : done ? "Meta atingida 🎉" : `Faltam ${BM.eur0(m.alvo - m.atual)}`}</span>
                {!done && <button className="btn btn-soft" style={{ padding: "6px 12px" }} onClick={() => open("deposit", m)}>+ Depositar</button>}
              </div>
            </div>
          );
        })}
        <button className="card card-pad" onClick={() => open("meta")} style={{ display: "grid", placeItems: "center", border: "1.5px dashed var(--border-strong)", background: "transparent", minHeight: 220, cursor: "pointer", textAlign: "center" }}>
          <div>
            <div className="li-ico" style={{ width: 48, height: 48, margin: "0 auto 12px", background: "var(--accent-soft)" }}><Icon name="plus" size={22} color="var(--accent)" sw={2.2} /></div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Nova meta de poupança</div>
            <div className="tiny muted" style={{ marginTop: 4, fontWeight: 600, maxWidth: 180, marginInline: "auto" }}>Define um objetivo e acompanha o progresso.</div>
          </div>
        </button>
      </div>

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
                    <td className="tnum" style={{ textAlign: "right", fontWeight: 800, color: saldo < 0 ? "var(--neg)" : "var(--ink)" }}>{BM.eur0(saldo)}</td>
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
      <div className="card profile-card">
        <div className="profile-banner" />
        <div className="profile-body">
          <div className="profile-avwrap">
            <div className="profile-av"><Avatar account={a} size={72} fontSize={26} /></div>
            <button className="btn btn-ghost profile-edit" onClick={() => open("perfil")}><Icon name="edit" size={15} /> Editar</button>
          </div>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-.01em" }}>{a.nome || "—"}</div>
          <div className="muted" style={{ fontWeight: 600, fontSize: 13.5, marginTop: 3 }}>{[a.idade && `${a.idade} anos`, a.cidade, a.email].filter(Boolean).join(" · ") || "Sem dados"}</div>
          {[a.perfil, a.estado, a.habitacao].filter(Boolean).length > 0 && (
            <div className="row" style={{ gap: 7, marginTop: 12, flexWrap: "wrap" }}>
              {[a.perfil, a.estado, a.habitacao].filter(Boolean).map((c) => <span className="chip" key={c}>{c}</span>)}
            </div>
          )}
          <div className="profile-stats">
            <div className="pstat"><span className="pstat-ico" style={{ background: "var(--accent-soft)" }}><Icon name="coins" size={16} color="var(--accent)" /></span><div><div className="pstat-v">{a.moeda || "EUR"}</div><div className="pstat-l">Moeda</div></div></div>
            <div className="pstat"><span className="pstat-ico" style={{ background: "color-mix(in srgb, var(--c-educacao) 16%, transparent)" }}><Icon name="target" size={16} color="var(--c-educacao)" /></span><div><div className="pstat-v">{fin.poupancaPct}%</div><div className="pstat-l">Poupança alvo</div></div></div>
            <div className="pstat"><span className="pstat-ico" style={{ background: "color-mix(in srgb, var(--c-habitacao) 16%, transparent)" }}><Icon name="flag" size={16} color="var(--c-habitacao)" /></span><div><div className="pstat-v">{fin.data.metas.length}</div><div className="pstat-l">{fin.data.metas.length === 1 ? "Meta" : "Metas"}</div></div></div>
          </div>
        </div>
      </div>

      <Section title="Preferências" icon="gear">
        <Rowi label="Modo escuro" sub="Reduz o brilho em ambientes com pouca luz">
          <Toggle on={theme === "dark"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} />
        </Rowi>
        <Rowi label="Orçamento mensal" sub={fin.data.orcamento ? `Limite atual: ${BM.eur0(fin.data.orcamento)}` : "Ainda não definido"}>
          <button className="btn btn-ghost" onClick={() => open("orcamento")}><Icon name="edit" size={14} /> Definir</button>
        </Rowi>
        <Rowi label="Moeda" sub="Usada em toda a aplicação">
          <select className="select" style={{ width: "auto" }} value={a.moeda || "EUR"} onChange={(e) => fin.setCurrency(e.target.value)}>
            {Object.values(BM.currencies).map((c) => <option key={c.code} value={c.code}>{c.sym} ({c.code})</option>)}
          </select>
        </Rowi>
        <Rowi label="Notificações" sub="Resumos semanais por email"><Toggle on={notif} onClick={() => setNotif(!notif)} /></Rowi>
        <Rowi label="Alertas inteligentes" sub="Avisos de orçamento e poupança" last><Toggle on={alertas} onClick={() => setAlertas(!alertas)} /></Rowi>
      </Section>

      <Section title="Conta e dados" icon="bank">
        <Rowi label="Categorias de despesa" sub={(fin.data.customCats || []).length ? `${fin.data.customCats.length} categoria(s) personalizada(s)` : "Cria categorias próprias ao registar uma despesa"}>
          <button className="btn btn-ghost" onClick={() => open("despesa")}><Icon name="plus" size={14} /> Adicionar</button>
        </Rowi>
        {(fin.data.customCats || []).length > 0 && (
          <div className="row" style={{ gap: 8, flexWrap: "wrap", paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
            {fin.data.customCats.map((c) => (
              <span key={c.key} className="chip" style={{ gap: 7 }}>
                <span className="dot" style={{ background: c.color }} />{c.nome}
                <button onClick={() => fin.removeCategory(c.key)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "grid", color: "var(--ink-3)" }}><span style={{ transform: "rotate(45deg)", display: "grid" }}><Icon name="plus" size={13} color="var(--ink-3)" /></span></button>
              </span>
            ))}
          </div>
        )}
        <Rowi label="Apagar todos os dados" sub="Remove despesas, rendimentos e metas (a conta mantém-se)">
          <button className="btn btn-ghost" style={{ color: "var(--neg)", borderColor: "color-mix(in srgb, var(--neg) 35%, transparent)" }}
            onClick={() => { if (confirm("Apagar todos os movimentos e metas? Esta ação não pode ser revertida.")) fin.resetData(); }}>
            <Icon name="trash" size={15} /> Limpar dados
          </button>
        </Rowi>
        <Rowi label="Terminar sessão" sub="Voltar ao ecrã de início de sessão" last>
          <button className="btn btn-ghost" onClick={fin.logout}><Icon name="logout" size={15} /> Sair</button>
        </Rowi>
      </Section>
    </div>
  );
}

Object.assign(window, { Poupanca, Relatorios, Historico, Definicoes });
