/* ===== Screens (parte 2): Poupança, Relatórios, Histórico, Definições ===== */

/* ---------- OBJETIVOS (poupança) ----------
   Estimativas de prazo e a dica inteligente são sempre calculadas a partir do ritmo real
   de contribuição de cada objetivo (fin.metaSeries, que já vem dos depósitos reais) —
   nunca uma data ou valor inventado. Quando não há ritmo positivo/dados suficientes,
   mostra-se claramente "sem estimativa" em vez de simular um número. */
function estimarConclusaoMeta(meta, serieMeta) {
  if (meta.fechada || !(meta.alvo > 0)) return null;
  const falta = meta.alvo - meta.atual;
  if (falta <= 0) return { meses: 0, mediaMensal: 0, label: "Concluído" };
  const pts = (serieMeta && serieMeta.points) || [];
  if (pts.length < 2) return null;
  const deltas = [];
  for (let i = 1; i < pts.length; i++) deltas.push(pts[i] - pts[i - 1]);
  const media = deltas.reduce((s, d) => s + d, 0) / deltas.length;
  if (media <= 0.01) return null;
  const meses = Math.max(1, Math.ceil(falta / media));
  const hoje = new Date();
  const dt = new Date(hoje.getFullYear(), hoje.getMonth() + meses, 1);
  return { meses, mediaMensal: media, label: BM.MESES[dt.getMonth()] + " " + dt.getFullYear() };
}
/* Recomendação baseada no objetivo aberto cuja estimativa está mais longe — mostra quanto
   tempo se ganharia com mais 100 EUR/mês de ritmo. Sem objetivo com ritmo real, não mostra nada. */
function gerarDicaObjetivos(abertas, metaSeries) {
  let pior = null;
  abertas.forEach((m) => {
    const serie = metaSeries.find((s) => s.id === m.id);
    const est = estimarConclusaoMeta(m, serie);
    if (est && est.meses > 0 && (!pior || est.meses > pior.est.meses)) pior = { meta: m, est };
  });
  if (!pior) return null;
  const { meta, est } = pior;
  const falta = meta.alvo - meta.atual;
  const novosMeses = Math.max(1, Math.ceil(falta / (est.mediaMensal + 100)));
  const ganho = est.meses - novosMeses;
  if (ganho <= 0) return null;
  return `Se aumentar a sua poupança mensal em ${BM.eur0(100)}, consegue atingir "${meta.nome}" aproximadamente ${ganho} ${ganho === 1 ? "mês" : "meses"} mais cedo.`;
}

const GOAL_FILTROS = [["todos", "Todos"], ["progresso", "Em progresso"], ["concluidos", "Concluídos"], ["suspensos", "Suspensos"]];

function Poupanca({ open }) {
  const fin = useFinance();
  const metas = fin.data.metas;
  const [filtro, setFiltro] = React.useState("todos");
  const [filtrosVisiveis, setFiltrosVisiveis] = React.useState(true);
  const [menuId, setMenuId] = React.useState(null);
  const [detalheId, setDetalheId] = React.useState(null);
  React.useEffect(() => {
    if (!menuId) return;
    const h = (e) => { if (!e.target.closest || !e.target.closest(".ph-menu-wrap")) setMenuId(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuId]);

  const totalAlvo = metas.reduce((s, m) => s + (+m.alvo || 0), 0);
  const totalAtual = metas.reduce((s, m) => s + (+m.atual || 0), 0);
  const pct = totalAlvo > 0 ? Math.round((totalAtual / totalAlvo) * 100) : 0;
  const concluidas = metas.filter((m) => m.fechada);
  const abertas = metas.filter((m) => !m.fechada);
  const estimativas = metas.map((m) => ({ meta: m, est: estimarConclusaoMeta(m, fin.metaSeries.find((s) => s.id === m.id)) })).filter((x) => x.est && x.est.meses > 0);
  const prazoMedioMeses = estimativas.length ? Math.round(estimativas.reduce((s, x) => s + x.est.meses, 0) / estimativas.length) : null;
  const dica = gerarDicaObjetivos(abertas, fin.metaSeries);
  const proximosAVencer = estimativas.filter((x) => !x.meta.fechada).sort((a, b) => a.est.meses - b.est.meses).slice(0, 3);

  const metasFiltradas = metas.filter((m) => {
    if (filtro === "progresso") return !m.fechada;
    if (filtro === "concluidos") return m.fechada;
    if (filtro === "suspensos") return false; // não existe estado "suspenso" nos dados reais
    return true;
  });

  const mesLabel = (key) => { const [y, mo] = (key || "").split("-").map(Number); return mo ? BM.MESES[mo - 1] + " " + y : ""; };
  const paceTxt = (m, serie, est) => {
    if (m.fechada) return "Objetivo concluído";
    if (!(m.alvo > 0)) return "Poupança sem objetivo fixo";
    if (est && est.mediaMensal > 0) return "Poupa em média " + BM.eur0(est.mediaMensal) + "/mês";
    return "Ainda sem ritmo de poupança para estimar";
  };
  const detalhe = detalheId ? metas.find((m) => m.id === detalheId) : null;

  return (
    <div className="content goals-page">
      <div className="goals-main">
        <div className="goals-header">
          <div className="row" style={{ gap: 10, flex: "none", marginLeft: "auto" }}>
            <button className="btn btn-ghost" onClick={() => setFiltrosVisiveis((v) => !v)} aria-pressed={filtrosVisiveis}><Icon name="filter" size={15} /> Filtros</button>
            <button className="btn btn-primary" onClick={() => open("meta")}><Icon name="plus" size={16} color="#fff" /> Novo objetivo</button>
          </div>
        </div>

        {filtrosVisiveis && (
          <div className="pg-tabs" style={{ width: "fit-content" }}>
            {GOAL_FILTROS.map(([id, lbl]) => (
              <button type="button" key={id} className={"pg-tab" + (filtro === id ? " on" : "")} onClick={() => setFiltro(id)}>{lbl}</button>
            ))}
          </div>
        )}

        <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          <Kpi label="Total de objetivos" value={String(metas.length)} icon="flag" color="var(--c-habitacao)" sub={`${concluidas.length} concluído(s)`} />
          <Kpi label="Total poupado" value={BM.eur0(totalAtual)} icon="target" color="var(--accent)" sub={totalAlvo > 0 ? pct + "% do objetivo global" : "Sem objetivo definido"} />
          <Kpi label="Valor restante" value={BM.eur0(Math.max(0, totalAlvo - totalAtual))} icon="wallet" color="var(--c-transporte)" sub="Para concluir todos" />
          <Kpi label="Prazo médio" value={prazoMedioMeses != null ? prazoMedioMeses + (prazoMedioMeses === 1 ? " mês" : " meses") : "—"} icon="cal" color="var(--c-educacao)" sub={prazoMedioMeses != null ? "Estimativa ao ritmo atual" : "Sem estimativa disponível"} />
        </div>

        {metas.length === 0 ? (
          <EmptyState icon="target" title="Ainda não criou nenhum objetivo financeiro."
            msg="Os objetivos ajudam-no a acompanhar o progresso das suas metas financeiras."
            action={<button className="btn btn-primary" onClick={() => open("meta")}><Icon name="plus" size={16} color="#fff" /> Criar primeiro objetivo</button>} />
        ) : metasFiltradas.length === 0 ? (
          <div className="card card-pad muted" style={{ textAlign: "center", padding: "40px 20px", fontWeight: 600 }}>
            {filtro === "suspensos" ? "Não existem objetivos suspensos." : "Sem objetivos nesta categoria."}
          </div>
        ) : (
          <div className="goals-grid">
            {metasFiltradas.map((m) => {
              const isOpen = !m.alvo || m.alvo <= 0;
              const p = isOpen ? null : Math.min(100, Math.round((m.atual / m.alvo) * 100));
              const done = !isOpen && m.atual >= m.alvo;
              const fechada = !!m.fechada;
              const serie = fin.metaSeries.find((s) => s.id === m.id);
              const est = estimarConclusaoMeta(m, serie);
              return (
                <div className="card goal-card" key={m.id} style={{ opacity: fechada ? 0.78 : 1 }} onClick={() => setDetalheId(m.id)}>
                  <div className="goal-card-top">
                    <span className="goal-ico" style={{ background: `color-mix(in srgb, ${m.cor} 16%, transparent)` }}>
                      <Icon name={done || fechada ? "check" : "target"} size={24} color={m.cor} sw={2} />
                    </span>
                    <div className="ph-menu-wrap" onClick={(e) => e.stopPropagation()}>
                      <button className="icon-btn" title="Opções" onClick={() => setMenuId(menuId === m.id ? null : m.id)}><Icon name="dots" size={17} /></button>
                      {menuId === m.id && (
                        <div className="ph-menu">
                          {!fechada && <button onClick={() => { setMenuId(null); open("deposit", m); }}><Icon name="plus" size={15} /> Depositar</button>}
                          <button onClick={() => { setMenuId(null); open("meta", m); }}><Icon name="edit" size={15} /> Editar</button>
                          {fechada
                            ? <button onClick={() => { setMenuId(null); fin.meta.reabrir(m.id); }}><Icon name="history" size={15} /> Reabrir</button>
                            : <button onClick={() => { setMenuId(null); fin.meta.fechar(m.id); }}><Icon name="check" size={15} /> Concluir</button>}
                          <button className="danger" onClick={() => { setMenuId(null); fin.meta.remove(m.id); }}><Icon name="trash" size={15} /> Remover</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="goal-card-name">{m.nome}</div>
                  <div className="goal-card-desc">{paceTxt(m, serie, est)}</div>

                  <div className="goal-card-amt">
                    <span className="tnum">{BM.eur0(m.atual)}</span>
                    {!isOpen && <span className="goal-card-amt-of">de {BM.eur0(m.alvo)}</span>}
                  </div>

                  {isOpen
                    ? <div className="bar" style={{ opacity: .5 }}><i style={{ width: "100%", background: m.cor }} /></div>
                    : <Progress value={m.atual} max={m.alvo} color="var(--accent)" />}

                  <div className="goal-card-foot">
                    <span className="goal-card-pct">{fechada ? "Concluído" : isOpen ? "Livre" : p + "% concluído"}</span>
                    <span className="goal-card-prazo">
                      <Icon name="cal" size={13} color="var(--ink-3)" />
                      {fechada ? (m.fechadaEm ? mesLabel(m.fechadaEm) : "Concluído") : est ? est.label : "Sem estimativa"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {metas.length > 0 && (
          <div className="card card-pad">
            <div className="section-head" style={{ marginBottom: 12 }}>
              <div>
                <div className="section-title">Evolução das poupanças</div>
                <div className="tiny muted" style={{ fontWeight: 600, marginTop: 2 }}>Acumulado de cada objetivo, mês a mês — os concluídos aparecem a tracejado</div>
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
            Considera transferir parte deste valor para um dos teus objetivos.
          </Alert>
        )}
      </div>

      <aside className="goals-aside">
        <div className="card card-pad goals-aside-card">
          <div className="section-title">Resumo geral</div>
          <div className="goals-donut-wrap">
            <DonutChart data={[{ valor: totalAtual, color: "var(--accent)" }, { valor: Math.max(0, totalAlvo - totalAtual), color: "var(--border)" }]}
              size={148} thickness={18}
              center={<div><div className="tnum" style={{ fontSize: 22, fontWeight: 700 }}>{pct}%</div><div className="tiny muted" style={{ fontWeight: 600 }}>concluído</div></div>} />
          </div>
          <div className="goals-donut-legend">
            <span className="row" style={{ gap: 7 }}><span className="dot" style={{ background: "var(--accent)" }} /> Valor atingido <b className="tnum">{BM.eur0(totalAtual)}</b></span>
            <span className="row" style={{ gap: 7 }}><span className="dot" style={{ background: "var(--border-strong)" }} /> Valor restante <b className="tnum">{BM.eur0(Math.max(0, totalAlvo - totalAtual))}</b></span>
          </div>
        </div>

        <div className="card card-pad goals-aside-card">
          <div className="section-title">Dica inteligente</div>
          <p className="goals-tip-text">{dica || "Ainda não há dados suficientes para gerar uma recomendação — registe alguns depósitos nos seus objetivos."}</p>
          <button className="btn btn-soft" disabled title="Em breve" style={{ width: "100%", justifyContent: "center" }}>Ver plano personalizado</button>
        </div>

        <div className="card card-pad goals-aside-card">
          <div className="section-title">Próximos objetivos a vencer</div>
          {proximosAVencer.length === 0 ? (
            <div className="muted tiny" style={{ fontWeight: 600 }}>Sem estimativas disponíveis de momento.</div>
          ) : (
            <div className="goals-upcoming-list">
              {proximosAVencer.map(({ meta, est }) => (
                <div className="goals-upcoming-item" key={meta.id}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{meta.nome}</div>
                    <div className="tiny muted" style={{ fontWeight: 600, marginTop: 2 }}>{est.label}</div>
                  </div>
                  <span className="chip">{est.meses <= 1 ? "Em breve" : `Faltam ${est.meses} meses`}</span>
                </div>
              ))}
            </div>
          )}
          <button type="button" className="goals-see-all" onClick={() => { setFiltro("todos"); setFiltrosVisiveis(true); }}>Ver todos os objetivos</button>
        </div>
      </aside>

      {detalhe && (
        <MetaDetalheModal meta={detalhe} serie={fin.metaSeries.find((s) => s.id === detalhe.id)}
          onClose={() => setDetalheId(null)}
          onDeposit={() => { setDetalheId(null); open("deposit", detalhe); }}
          onEdit={() => { setDetalheId(null); open("meta", detalhe); }}
          onToggleFechada={() => { setDetalheId(null); detalhe.fechada ? fin.meta.reabrir(detalhe.id) : fin.meta.fechar(detalhe.id); }} />
      )}
    </div>
  );
}

function MetaDetalheModal({ meta, serie, onClose, onDeposit, onEdit, onToggleFechada }) {
  const isOpen = !meta.alvo || meta.alvo <= 0;
  const p = isOpen ? null : Math.min(100, Math.round((meta.atual / meta.alvo) * 100));
  const fechada = !!meta.fechada;
  const est = estimarConclusaoMeta(meta, serie);
  return (
    <Modal title={meta.nome} sub={fechada ? "Objetivo concluído" : isOpen ? "Poupança sem objetivo fixo" : est ? "Estimativa: " + est.label : "Sem estimativa disponível"} icon="target" onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onToggleFechada}>{fechada ? <><Icon name="history" size={14} /> Reabrir</> : <><Icon name="check" size={14} /> Concluir</>}</button>
        <button className="btn btn-primary" onClick={onDeposit} disabled={fechada}><Icon name="plus" size={15} color="#fff" /> Depositar</button>
      </>}>
      <div className="modal-row-2" style={{ marginBottom: 16 }}>
        <div>
          <div className="tiny muted" style={{ fontWeight: 700 }}>Já poupado</div>
          <div className="tnum" style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{BM.eur0(meta.atual)}</div>
        </div>
        {!isOpen && (
          <div>
            <div className="tiny muted" style={{ fontWeight: 700 }}>Objetivo</div>
            <div className="tnum" style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{BM.eur0(meta.alvo)}</div>
          </div>
        )}
      </div>
      {!isOpen && <Progress value={meta.atual} max={meta.alvo} color="var(--accent)" />}
      {!isOpen && <div className="tiny muted" style={{ marginTop: 9, fontWeight: 600 }}>{p}% concluído · faltam {BM.eur0(Math.max(0, meta.alvo - meta.atual))}</div>}
      {serie && serie.points && serie.points.some((v) => v > 0) && (
        <div style={{ marginTop: 20 }}>
          <div className="tiny muted" style={{ fontWeight: 700, marginBottom: 8 }}>Evolução (últimos 6 meses)</div>
          <Sparkline data={serie.points} w={380} h={54} color={meta.cor} responsive />
        </div>
      )}
      <div style={{ marginTop: 4 }}>
        <button className="btn btn-ghost" onClick={onEdit}><Icon name="edit" size={14} /> Editar objetivo</button>
      </div>
    </Modal>
  );
}

/* ---------- RELATÓRIOS ---------- */
/* Relatórios: separadores por área de análise. "Visão geral" reaproveita o conteúdo
   já existente (médias, receitas vs. despesas, categorias, análise automática) e
   integra a tabela do Histórico (mesma fonte de dados, fin.historico) — o Histórico
   deixa de ter entrada própria no menu, mas o componente continua 100% intacto e
   acessível aqui. Receitas/Despesas/Objetivos/Orçamento usam os mesmos seletores já
   calculados em useFinance() — sem dados inventados. */
function Relatorios({ open }) {
  const [tab, setTab] = React.useState("geral");
  const TABS = [["geral", "Visão geral"], ["receitas", "Receitas"], ["despesas", "Despesas"], ["objetivos", "Objetivos"], ["orcamento", "Orçamento"]];
  return (
    <>
      <div className="content" style={{ paddingBottom: 0 }}>
        <div className="pg-tabs" style={{ width: "fit-content" }}>
          {TABS.map(([id, lbl]) => (
            <button type="button" key={id} className={"pg-tab" + (tab === id ? " on" : "")} onClick={() => setTab(id)}>{lbl}</button>
          ))}
        </div>
      </div>
      {tab === "geral" && (
        <>
          <RelatoriosVisaoGeral />
          <Historico />
        </>
      )}
      {tab === "receitas" && <RelatoriosReceitas />}
      {tab === "despesas" && <RelatoriosDespesas />}
      {tab === "objetivos" && <RelatoriosObjetivos />}
      {tab === "orcamento" && <RelatoriosOrcamento open={open} />}
    </>
  );
}

function RelatoriosVisaoGeral() {
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

/* Separadores de Relatórios: Receitas, Despesas, Objetivos e Orçamento.
   Reaproveitam 100% os seletores já calculados em useFinance() (catBreak, incBreak,
   series, historico, metaSeries) — nenhum valor é inventado ou simulado. */
function RelatoriosReceitas() {
  const fin = useFinance();
  if (fin.historico.length === 0) {
    return <div className="content"><EmptyState icon="arrowsDown" title="Sem receitas registadas"
      msg="Assim que registares rendimentos, aparecem aqui as tuas fontes e a evolução mensal." /></div>;
  }
  const mediaRec = Math.round(fin.historico.reduce((s, h) => s + h.rec, 0) / fin.historico.length);
  const recSpark = fin.series.map((s) => s.rec);
  const variacao = fin.series.length >= 2 ? fin.series[fin.series.length - 1].rec - fin.series[fin.series.length - 2].rec : 0;
  return (
    <div className="content">
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Kpi label="Recebido este mês" value={BM.eur0(fin.totalRec)} icon="arrowsDown" color="var(--accent)" spark={recSpark} />
        <Kpi label="Média mensal (6 meses)" value={BM.eur0(mediaRec)} icon="chart" color="var(--c-habitacao)" />
        <Kpi label="Fontes ativas este mês" value={String(fin.incBreak.length)} icon="wallet" color="var(--c-educacao)" sub={variacao !== 0 ? (variacao > 0 ? "+" : "") + BM.eur0(variacao) + " vs. mês anterior" : undefined} />
      </div>
      <div className="card card-pad">
        <div className="section-title" style={{ marginBottom: 14 }}>Receitas por fonte <span className="muted tiny" style={{ fontWeight: 600 }}>· {fin.monthLabel}</span></div>
        {fin.incBreak.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600 }}>Sem receitas neste mês.</div> : (
          <BarBreakdown data={fin.incBreak} money={BM.eur0} labelOf={(c) => c.nome} />
        )}
      </div>
    </div>
  );
}

function RelatoriosDespesas() {
  const fin = useFinance();
  if (fin.historico.length === 0) {
    return <div className="content"><EmptyState icon="wallet" title="Sem despesas registadas"
      msg="Assim que registares despesas, aparece aqui a divisão por categoria e a evolução mensal." /></div>;
  }
  const mediaGasto = Math.round(fin.historico.reduce((s, h) => s + h.gasto, 0) / fin.historico.length);
  const gastoSpark = fin.series.map((s) => s.gasto);
  const pctFixas = fin.totalGasto > 0 ? Math.round((fin.fixas / fin.totalGasto) * 100) : 0;
  return (
    <div className="content">
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Kpi label="Gasto este mês" value={BM.eur0(fin.totalGasto)} icon="wallet" color="var(--c-transporte)" spark={gastoSpark} />
        <Kpi label="Média mensal (6 meses)" value={BM.eur0(mediaGasto)} icon="chart" color="var(--c-habitacao)" />
        <Kpi label="Despesas fixas" value={pctFixas + "%"} icon="home" color="var(--c-educacao)" sub={BM.eur0(fin.fixas) + " de " + BM.eur0(fin.totalGasto)} />
      </div>
      <div className="card card-pad">
        <div className="section-title" style={{ marginBottom: 14 }}>Despesas por categoria <span className="muted tiny" style={{ fontWeight: 600 }}>· {fin.monthLabel}</span></div>
        {fin.catBreak.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600 }}>Sem despesas neste mês.</div> : (
          <BarBreakdown data={fin.catBreak} money={BM.eur0} labelOf={(c) => c.nome} />
        )}
      </div>
    </div>
  );
}

function RelatoriosObjetivos() {
  const fin = useFinance();
  const metas = fin.metaSeries;
  if (metas.length === 0) {
    return <div className="content"><EmptyState icon="target" title="Ainda sem objetivos"
      msg="Cria um objetivo de poupança para acompanhares aqui o progresso ao longo do tempo." /></div>;
  }
  const abertas = metas.filter((m) => !m.fechada);
  const totalAtual = metas.reduce((s, m) => s + m.atual, 0);
  const totalAlvo = metas.filter((m) => m.alvo > 0).reduce((s, m) => s + m.alvo, 0);
  const pctGlobal = totalAlvo > 0 ? Math.round((totalAtual / totalAlvo) * 100) : 0;
  return (
    <div className="content">
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Kpi label="Total poupado em objetivos" value={BM.eur0(totalAtual)} icon="target" color="var(--accent)" />
        <Kpi label="Objetivos ativos" value={String(abertas.length)} icon="flag" color="var(--c-habitacao)" sub={metas.length - abertas.length > 0 ? (metas.length - abertas.length) + " concluído(s)" : undefined} />
        <Kpi label="Progresso global" value={totalAlvo > 0 ? pctGlobal + "%" : "—"} icon="chart" color="var(--c-educacao)" sub={totalAlvo > 0 ? "Faltam " + BM.eur0(Math.max(0, totalAlvo - totalAtual)) : "Sem valor-alvo definido"} />
      </div>
      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="section-title">Progresso por objetivo</div>
        {metas.map((m) => {
          const isOpen = !(m.alvo > 0);
          const p = isOpen ? null : Math.round((m.atual / m.alvo) * 100);
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 7 }}>
                  <span className="row" style={{ gap: 8, fontSize: 13.5, fontWeight: 700 }}>
                    <span className="dot" style={{ background: m.cor }} />{m.nome}{m.fechada && <span className="chip" style={{ padding: "2px 8px" }}>Concluída</span>}
                  </span>
                  <span className="tnum tiny muted" style={{ fontWeight: 700 }}>{BM.eur0(m.atual)}{!isOpen && " / " + BM.eur0(m.alvo)}</span>
                </div>
                {isOpen ? <div className="bar" style={{ opacity: .5 }}><i style={{ width: "100%", background: m.cor }} /></div> : <Progress value={m.atual} max={m.alvo} color={m.cor} />}
              </div>
              <Sparkline data={m.points.some((v) => v > 0) ? m.points : [0, 0]} w={92} h={32} color={m.cor} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RelatoriosOrcamento({ open }) {
  const fin = useFinance();
  const orc = fin.data.orcamento;
  if (!orc) {
    return <div className="content"><EmptyState icon="wallet" title="Sem orçamento definido"
      msg="Define um orçamento mensal para acompanhares aqui quanto já gastaste, quanto falta e como te tens saído nos últimos meses."
      action={<button className="btn btn-primary" onClick={() => open("orcamento")}><Icon name="edit" size={16} color="#fff" /> Definir orçamento</button>} /></div>;
  }
  const pct = Math.round((fin.totalGasto / orc) * 100);
  const restante = Math.max(0, orc - fin.totalGasto);
  const hoje = new Date();
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const diasRestantes = Math.max(1, diasNoMes - hoje.getDate() + 1);
  const mediaDiaria = restante / diasRestantes;
  const comparaveis = fin.historico.filter((h) => !h.atual);
  const dentroOrc = comparaveis.filter((h) => h.gasto <= orc).length;
  return (
    <div className="content">
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Kpi label="Orçamento mensal" value={BM.eur0(orc)} icon="wallet" color="var(--accent)" sub={pct + "% utilizado"} />
        <Kpi label="Restante este mês" value={BM.eur0(restante)} icon="bolt" color={pct >= 100 ? "var(--neg)" : "var(--c-habitacao)"} />
        <Kpi label="Média diária recomendada" value={BM.eur0(mediaDiaria)} icon="cal" color="var(--c-educacao)" sub={diasRestantes + " dia(s) até ao fim do mês"} />
      </div>
      <div className="card card-pad">
        <div className="section-head" style={{ marginBottom: 10 }}>
          <div className="section-title">Utilização deste mês</div>
          <button className="btn btn-ghost" style={{ padding: "6px 12px" }} onClick={() => open("orcamento")}><Icon name="edit" size={14} /> Editar</button>
        </div>
        <Progress value={fin.totalGasto} max={orc} color={pct > 80 ? "var(--warn)" : "var(--accent)"} />
        <div className="tiny muted" style={{ marginTop: 9, fontWeight: 600 }}>{BM.eur0(fin.totalGasto)} de {BM.eur0(orc)} gastos até agora.</div>
      </div>
      {comparaveis.length > 0 && (
        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 4 }}>Histórico face ao orçamento atual</div>
          <div className="tiny muted" style={{ fontWeight: 600, marginBottom: 14 }}>Com o orçamento de {BM.eur0(orc)}, terias ficado dentro do limite em {dentroOrc} de {comparaveis.length} mês(es) anteriores.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {comparaveis.slice(0, 6).map((h) => {
              const p = Math.min(999, Math.round((h.gasto / orc) * 100));
              const over = h.gasto > orc;
              return (
                <div key={h.key}>
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700 }}>{h.label}</span>
                    <span className="tnum tiny" style={{ fontWeight: 700, color: over ? "var(--neg)" : "var(--ink-2)" }}>{BM.eur0(h.gasto)} · {p}%</span>
                  </div>
                  <div className="bar"><i style={{ width: Math.min(100, p) + "%", background: over ? "var(--neg)" : "var(--accent)" }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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

  // Mesmas listas/chaves do onboarding (assets/js/onboarding.jsx) — mantidas iguais para
  // que as opções guardadas aqui e lá batam sempre certo.
  const SITUACOES = [["estudante", "Estudante"], ["trabalhador", "Trabalhador"], ["freelancer", "Freelancer"], ["empresario", "Empresário"], ["casado", "Casado"], ["vive-sozinho", "Vive sozinho"], ["casa-partilhada", "Vive numa casa partilhada"], ["outro", "Outro"]];
  const OBJETIVOS = [["fundo", "Fundo de emergência"], ["casa", "Comprar casa"], ["carro", "Comprar carro"], ["viagem", "Viagem"], ["educacao", "Educação"], ["tecnologia", "Tecnologia"], ["familia", "Família"], ["saude", "Saúde"], ["investimento", "Investimento"], ["outro", "Outro"]];
  const PREFERENCIAS = [["controlar", "Controlar despesas"], ["orcamento", "Organizar o orçamento mensal"], ["objetivos", "Criar objetivos financeiros"], ["partilhadas", "Gerir despesas partilhadas"], ["pagamentos", "Acompanhar pagamentos futuros"], ["habitos", "Melhorar hábitos financeiros"]];
  const PLANEAMENTO = [["criar-agora", "Quero criar um orçamento mensal agora"], ["sugestao", "Quero receber uma sugestão inicial"], ["mais-tarde", "Prefiro configurar mais tarde"]];
  const PARTILHA = [["nao", "Não"], ["parceiro", "Com parceiro ou parceira"], ["familia", "Com família"], ["casa", "Numa casa partilhada"], ["grupo", "Em grupos ocasionais"]];
  const RENDIMENTOS = Object.keys(BM.incomeCats);
  const DESPESAS = ["Renda", "Água", "Eletricidade", "Gás", "Internet", "Alimentação", "Transporte", "Educação", "Saúde", "Seguros", "Subscrições", "Lazer", "Telecomunicações", "Outro"];
  const rotulo = (lista, val) => (lista.find((o) => o[0] === val) || [null, "—"])[1];

  const SEL_MAX = 3;
  const asArr = (v, fallback) => Array.isArray(v) ? v : (v ? [v] : fallback);
  const [f, setF] = React.useState({});
  const abrir = () => {
    setF({
      situacao: asArr(a.situacao, ["estudante"]), objetivo: asArr(a.objetivo, ["fundo"]), preferencia: asArr(a.preferencia, ["controlar"]),
      planeamento: a.planeamento || "mais-tarde", partilha: a.partilha || "nao",
      fontesRendimento: Array.isArray(a.fontesRendimento) ? a.fontesRendimento : [], principaisDespesas: Array.isArray(a.principaisDespesas) ? a.principaisDespesas : [],
      notificacoes: a.notificacoes !== false, resumoSemanal: a.resumoSemanal !== false,
    });
    setMsg(""); setEditar(true);
  };
  const toggleArr = (k, v, max) => setF((s) => {
    const arr = s[k] || [];
    if (arr.includes(v)) return { ...s, [k]: arr.filter((x) => x !== v) };
    if (max && arr.length >= max) return s;
    return { ...s, [k]: [...arr, v] };
  });
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
  const Multi = ({ label, opcoes, k, max }) => (
    <div style={{ marginBottom: 12 }}>
      <div className="tiny muted" style={{ fontWeight: 700, marginBottom: 8 }}>{label}{max ? ` (${(f[k] || []).length}/${max})` : ""}</div>
      <div className="row" style={{ gap: 7, flexWrap: "wrap" }}>
        {opcoes.map((o) => {
          const on = (f[k] || []).includes(o);
          const disabled = !on && !!max && (f[k] || []).length >= max;
          return <button type="button" key={o} className={"chip" + (on ? " sel" : "")} disabled={disabled} style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .45 : 1 }} onClick={() => toggleArr(k, o, max)}>{o}</button>;
        })}
      </div>
    </div>
  );
  const MultiLabeled = ({ label, lista, k, max }) => (
    <div style={{ marginBottom: 12 }}>
      <div className="tiny muted" style={{ fontWeight: 700, marginBottom: 8 }}>{label}{max ? ` (${(f[k] || []).length}/${max})` : ""}</div>
      <div className="row" style={{ gap: 7, flexWrap: "wrap" }}>
        {lista.map(([v, l]) => {
          const on = (f[k] || []).includes(v);
          const disabled = !on && !!max && (f[k] || []).length >= max;
          return <button type="button" key={v} className={"chip" + (on ? " sel" : "")} disabled={disabled} style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .45 : 1 }} onClick={() => toggleArr(k, v, max)}>{l}</button>;
        })}
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
          <Chips label="Situação atual" valor={asArr(a.situacao, []).map((v) => rotulo(SITUACOES, v))} />
          <Chips label="Como pretende utilizar o Rende+" valor={asArr(a.preferencia, []).map((v) => rotulo(PREFERENCIAS, v))} />
          <Chips label="Fontes de rendimento" valor={a.fontesRendimento} />
          <Chips label="Principais despesas" valor={a.principaisDespesas} />
          <Chips label="Objetivo principal" valor={asArr(a.objetivo, []).map((v) => rotulo(OBJETIVOS, v))} />
          <Linha label="Planeamento" valor={rotulo(PLANEAMENTO, a.planeamento)} />
          <Linha label="Partilha de despesas" valor={rotulo(PARTILHA, a.partilha)} />
          {a.telefone && <Linha label="Telefone" valor={a.telefone} />}
          <div className="row" style={{ justifyContent: "space-between", gap: 12, paddingBottom: a.sobre ? 12 : 0, borderBottom: a.sobre ? "1px solid var(--border)" : "none" }}>
            <span className="tiny muted" style={{ fontWeight: 700 }}>Notificações · Resumo semanal</span>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{a.notificacoes !== false ? "On" : "Off"} · {a.resumoSemanal !== false ? "On" : "Off"}</span>
          </div>
          {a.sobre && (
            <div>
              <div className="tiny muted" style={{ fontWeight: 700, marginBottom: 4 }}>Sobre os teus objetivos</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)", lineHeight: 1.5 }}>{a.sobre}</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <MultiLabeled label="Situação atual" lista={SITUACOES} k="situacao" max={SEL_MAX} />
          <MultiLabeled label="Como pretende utilizar o Rende+" lista={PREFERENCIAS} k="preferencia" max={SEL_MAX} />
          <Multi label="Fontes de rendimento" opcoes={RENDIMENTOS} k="fontesRendimento" />
          <Multi label="Principais despesas" opcoes={DESPESAS} k="principaisDespesas" />
          <MultiLabeled label="Objetivo principal" lista={OBJETIVOS} k="objetivo" max={SEL_MAX} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Seletor label="Planeamento" lista={PLANEAMENTO} k="planeamento" />
            <Seletor label="Partilha de despesas" lista={PARTILHA} k="partilha" />
          </div>
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

function Perfil({ open, go }) {
  const fin = useFinance();
  const a = fin.account || {};
  const metas = fin.data.metas || [];
  const stats = [
    { ico: "coins", v: a.moeda || "EUR", l: "Moeda", bg: "var(--accent-soft)", c: "var(--accent)" },
    { ico: "spark", v: BM.eur0(fin.poupado || 0), l: "Poupado", bg: "color-mix(in srgb, var(--c-educacao) 16%, transparent)", c: "var(--c-educacao)" },
    { ico: "flag", v: metas.length, l: metas.length === 1 ? "Meta" : "Metas", bg: "color-mix(in srgb, var(--c-habitacao) 16%, transparent)", c: "var(--c-habitacao)" },
  ];
  return (
    <div className="content" style={{ maxWidth: 760, margin: "0 auto" }}>
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

      <div className="card card-pad row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div className="row" style={{ gap: 10 }}>
          <span className="li-ico" style={{ width: 30, height: 30, background: "var(--accent-soft)", flex: "none" }}><Icon name="bank" size={16} color="var(--accent)" /></span>
          <div><div style={{ fontWeight: 700, fontSize: 14 }}>Gestão de conta</div><div className="tiny muted" style={{ fontWeight: 600, marginTop: 2 }}>Terminar sessão, limpar dados ou eliminar a conta</div></div>
        </div>
        <button className="btn btn-ghost" onClick={() => go("config")}><Icon name="gear" size={15} /> Ir a Definições</button>
      </div>
    </div>
  );
}

/* ---------- DEFINIÇÕES ---------- */
/* Reorganizado em 8 secções nomeadas (Conta/Aparência/Finanças/Notificações/Segurança/
   Privacidade/Plano/Preferências), num contentor centralizado. Reagrupa apenas cards e
   ações já existentes noutros ecrãs (Perfil, PerfilPreferencias, Previsão, Paywall) —
   nenhum toggle novo é criado sem função real; o que ainda não tem mecanismo próprio
   fica marcado "Em breve". */
function Definicoes({ theme, setTheme, open, go, onOpenTweaks, contraste, setContraste }) {
  const fin = useFinance();
  const a = fin.account || {};
  // Bloqueio por PIN (window.RendeLock — camada local do dispositivo)
  const [pinModal, setPinModal] = React.useState(false);
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => window.RendeLock.subscribe(force), []);
  const hasPin = window.RendeLock.hasPin();
  const lockMin = window.RendeLock.getMinutes();
  const ehPremium = a.plano === "premium";

  // Ações de conta (movidas do ecrã Perfil para aqui, secção Privacidade — única fonte destas ações)
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [busyDel, setBusyDel] = React.useState(false);
  const [delErr, setDelErr] = React.useState("");

  // Verificação manual de atualizações (compara com o version.json do servidor)
  const [verVerificando, setVerVerificando] = React.useState(false);
  const [verResultado, setVerResultado] = React.useState(null); // { tipo: "atual" | "nova" | "erro", versao }
  const [verConfirmar, setVerConfirmar] = React.useState(false);
  const verificarAtualizacoes = () => {
    setVerVerificando(true);
    setVerResultado(null);
    fetch("/version.json?t=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (d && d.version && d.version !== window.APP_VERSION) {
          setVerResultado({ tipo: "nova", versao: d.version });
          setVerConfirmar(true);
        } else {
          setVerResultado({ tipo: "atual" });
        }
      })
      .catch(() => setVerResultado({ tipo: "erro" }))
      .finally(() => setVerVerificando(false));
  };

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
  const Soon = () => <span className="chip" style={{ color: "var(--ink-3)", fontWeight: 700 }}>Em breve</span>;

  return (
    <div className="content" style={{ maxWidth: 880, margin: "0 auto" }}>
      <Section title="Aparência" icon="sun">
        <Rowi label="Modo escuro" sub="Reduz o brilho em ambientes com pouca luz">
          <Toggle on={theme === "dark"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} />
        </Rowi>
        <Rowi label="Cor de acento, tipo de letra e cantos" sub="Personalização avançada do visual da app">
          <button className="btn btn-ghost" onClick={onOpenTweaks}><Icon name="edit" size={14} /> Personalizar</button>
        </Rowi>
        <Rowi label="Contraste alto" sub="Reforça o texto e os contornos para melhor legibilidade" last>
          <Toggle on={!!contraste} onClick={() => setContraste(!contraste)} />
        </Rowi>
      </Section>

      <Section title="Finanças" icon="wallet">
        <Rowi label="Categorias personalizadas" sub={(fin.data.customCats || []).length ? `${fin.data.customCats.length} categoria(s) criada(s)` : "Cria categorias próprias ao registar uma despesa"}>
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
        <Rowi label="Fontes de rendimento e principais despesas" sub="Definidas na secção Preferências, mais abaixo">
          <Icon name="chevR" size={16} color="var(--ink-3)" />
        </Rowi>
        <Rowi label="Moeda principal" sub="Definida no registo — usada em toda a app">
          <span className="chip">{a.moeda || fin.curSym || "EUR"}</span>
        </Rowi>
        <Rowi label="Orçamento mensal" sub={fin.data.orcamento ? `Limite atual: ${BM.eur0(fin.data.orcamento)}` : "Ainda não definido"} last>
          <button className="btn btn-ghost" onClick={() => open("orcamento")}><Icon name="edit" size={14} /> Definir</button>
        </Rowi>
      </Section>

      <Section title="Notificações" icon="bell">
        <Rowi label="Notificações no separador" sub="Alertas de orçamento, objetivos e pagamentos a vencer — editar em Preferências, mais abaixo">
          <span className="chip">{a.notificacoes !== false ? "Ativas" : "Desativadas"}</span>
        </Rowi>
        <Rowi label="Resumo semanal" sub="Editar em Preferências, mais abaixo">
          <span className="chip">{a.resumoSemanal !== false ? "Ativo" : "Desativado"}</span>
        </Rowi>
        <Rowi label="Notificações de Partilha" sub="Dívidas, despesas de grupo a vencer e convites pendentes" last>
          <span className="chip">{a.notificacoes !== false ? "Ativas" : "Desativadas"}</span>
        </Rowi>
      </Section>

      <Section title="Segurança" icon="shield">
        <Rowi label="PIN de bloqueio" sub={hasPin ? "Definido — a app bloqueia por inatividade" : "Sem PIN — a app não bloqueia"}>
          {hasPin
            ? <button className="btn btn-ghost" style={{ color: "var(--neg)" }} onClick={() => window.RendeLock.removePin()}><Icon name="trash" size={14} /> Remover</button>
            : <button className="btn btn-primary" onClick={() => setPinModal(true)}><Icon name="lock" size={14} color="#fff" /> Definir PIN</button>}
        </Rowi>
        {hasPin && <>
          <Rowi label="Bloquear após inatividade" sub="Tempo sem usar até a app pedir o PIN">
            <select className="select" style={{ width: "auto" }} value={lockMin} onChange={(e) => window.RendeLock.setMinutes(Number(e.target.value))}>
              {[1, 5, 15, 30, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </Rowi>
          <Rowi label="Bloquear agora" sub="Termina já o acesso até voltares a introduzir o PIN">
            <button className="btn btn-ghost" onClick={() => window.RendeLock.lockNow()}><Icon name="lock" size={14} /> Bloquear</button>
          </Rowi>
        </>}
        <Rowi label="Alterar palavra-passe" sub="Ainda não disponível">
          <Soon />
        </Rowi>
        <Rowi label="Sessões ativas" sub="Ainda não disponível">
          <Soon />
        </Rowi>
        <Rowi label="Autenticação social" sub="Ainda não disponível" last>
          <Soon />
        </Rowi>
      </Section>

      <Section title="Privacidade" icon="lock">
        <Rowi label="Exportar dados" sub="Descarrega a tua previsão financeira em PDF ou Excel (Premium)">
          <button className="btn btn-ghost" onClick={() => go("previsao")}><Icon name="report" size={14} /> Exportar</button>
        </Rowi>
        <Rowi label="Política de privacidade" sub="Como tratamos os teus dados">
          <a className="btn btn-ghost" href="privacidade.html" target="_blank" rel="noopener">Ver</a>
        </Rowi>
        <Rowi label="Consentimentos" sub="Ainda não disponível">
          <Soon />
        </Rowi>
        <Rowi label="Apagar todos os dados" sub="Remove despesas, rendimentos e metas (a conta mantém-se)">
          <button className="btn btn-ghost" style={{ color: "var(--neg)", borderColor: "color-mix(in srgb, var(--neg) 35%, transparent)" }}
            onClick={() => setConfirmClear(true)}>
            <Icon name="trash" size={14} /> Limpar dados
          </button>
        </Rowi>
        <Rowi label="Eliminar conta" sub="Apaga a conta e todos os dados de forma permanente" last>
          <button className="btn btn-ghost" style={{ color: "var(--neg)", borderColor: "color-mix(in srgb, var(--neg) 35%, transparent)" }}
            onClick={() => { setDelErr(""); setConfirmDelete(true); }}>
            <Icon name="trash" size={14} /> Eliminar conta
          </button>
        </Rowi>
      </Section>

      <Section title="Plano" icon="spark">
        <Rowi label={ehPremium ? "Rende+ Premium" : "Plano gratuito"} sub={ehPremium ? "Tens acesso a Lembretes, Recorrentes, Partilha e Previsão" : "Faz upgrade para desbloquear Lembretes, Recorrentes, Partilha e Previsão"} last>
          <button className="btn btn-primary" onClick={() => go("premium")}><Icon name="spark" size={14} color="#fff" /> {ehPremium ? "Gerir plano" : "Upgrade"}</button>
        </Rowi>
      </Section>

      <Section title="Atualizações" icon="download">
        <Rowi
          label="Versão instalada"
          sub={
            verVerificando ? "A verificar…"
              : verResultado?.tipo === "atual" ? "Já tens a versão mais recente."
              : verResultado?.tipo === "erro" ? "Não foi possível verificar agora. Tenta mais tarde."
              : "Toca para procurar uma versão nova"
          }
          last
        >
          <button className="btn btn-ghost" disabled={verVerificando} onClick={verificarAtualizacoes}>
            <Icon name="sync" size={14} /> {verVerificando ? "A verificar…" : `v${window.APP_VERSION || "1.0.0"} · Verificar`}
          </button>
        </Rowi>
      </Section>

      <div className="tiny" style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink-3)", marginTop: 4 }}>Preferências</div>
      <PerfilPreferencias />

      {pinModal && <RLPinSetup onClose={() => setPinModal(false)} />}

      {confirmClear && (
        <Modal title="Limpar todos os dados?" sub="Esta ação não pode ser revertida." icon="trash" iconNeg onClose={() => setConfirmClear(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setConfirmClear(false)}>Cancelar</button>
            <button className="btn" style={{ background: "var(--neg)", color: "#fff", border: "none" }} onClick={() => { setConfirmClear(false); fin.resetData(); }}>
              <Icon name="trash" size={15} color="#fff" /> Limpar
            </button>
          </>}>
          <div className="muted" style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.6 }}>
            Vais remover todas as despesas, rendimentos e metas. A tua conta mantém-se, mas <strong style={{ color: "var(--ink)" }}>esta ação não pode ser revertida</strong>.
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Eliminar a tua conta?" sub="Esta ação não pode ser revertida." icon="trash" iconNeg onClose={() => !busyDel && setConfirmDelete(false)}
          footer={<>
            <button className="btn btn-ghost" disabled={busyDel} onClick={() => setConfirmDelete(false)}>Cancelar</button>
            <button className="btn" disabled={busyDel} style={{ background: "var(--neg)", color: "#fff", border: "none", opacity: busyDel ? .8 : 1, cursor: busyDel ? "wait" : "pointer" }}
              onClick={async () => { setBusyDel(true); setDelErr(""); try { await fin.eliminarConta(); } catch (e) { setDelErr(e.message || "Não foi possível eliminar a conta."); setBusyDel(false); } }}>
              <Icon name="trash" size={15} color="#fff" /> {busyDel ? "A eliminar…" : "Eliminar conta"}
            </button>
          </>}>
          <div className="muted" style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.6 }}>
            Vais apagar a conta <strong style={{ color: "var(--ink)" }}>{a.email}</strong> e <strong style={{ color: "var(--ink)" }}>todos</strong> os dados — despesas, rendimentos, metas, contas e categorias. Esta ação <strong style={{ color: "var(--ink)" }}>não pode ser revertida</strong>. Se voltares a criar conta com este email, começa tudo do zero.
          </div>
          {delErr && <div className="alert bad" style={{ marginTop: 14, padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{delErr}</span></div>}
        </Modal>
      )}

      {verConfirmar && verResultado?.tipo === "nova" && (
        <Modal title="Nova versão disponível" sub={`A versão ${verResultado.versao} já está pronta.`} icon="download" onClose={() => setVerConfirmar(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setVerConfirmar(false)}>Agora não</button>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              <Icon name="sync" size={15} color="#fff" /> Atualizar agora
            </button>
          </>}>
          <div className="muted" style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.6 }}>
            Ao atualizares, a app recarrega para instalar a versão mais recente. Os teus dados não são afetados.
          </div>
        </Modal>
      )}

      <div className="tiny muted" style={{ textAlign: "center", marginTop: 4, fontWeight: 600 }}>Rende+ · versão {window.APP_VERSION || "1.0.0"}</div>
    </div>
  );
}

Object.assign(window, { Perfil, Poupanca, Relatorios, Historico, Definicoes });