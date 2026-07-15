function estimarConclusaoMeta(meta, serieMeta) {
  if (meta.fechada || !(meta.alvo > 0)) return null;
  const falta = meta.alvo - meta.atual;
  if (falta <= 0) return { meses: 0, mediaMensal: 0, label: "Conclu\xEDdo" };
  const pts = serieMeta && serieMeta.points || [];
  if (pts.length < 2) return null;
  const deltas = [];
  for (let i = 1; i < pts.length; i++) deltas.push(pts[i] - pts[i - 1]);
  const media = deltas.reduce((s, d) => s + d, 0) / deltas.length;
  if (media <= 0.01) return null;
  const meses = Math.max(1, Math.ceil(falta / media));
  const hoje = /* @__PURE__ */ new Date();
  const dt = new Date(hoje.getFullYear(), hoje.getMonth() + meses, 1);
  return { meses, mediaMensal: media, label: BM.MESES[dt.getMonth()] + " " + dt.getFullYear() };
}
function gerarDicaObjetivos(abertas, metaSeries) {
  let pior = null;
  abertas.forEach((m) => {
    const serie = metaSeries.find((s) => s.id === m.id);
    const est2 = estimarConclusaoMeta(m, serie);
    if (est2 && est2.meses > 0 && (!pior || est2.meses > pior.est.meses)) pior = { meta: m, est: est2 };
  });
  if (!pior) return null;
  const { meta, est } = pior;
  const falta = meta.alvo - meta.atual;
  const novosMeses = Math.max(1, Math.ceil(falta / (est.mediaMensal + 100)));
  const ganho = est.meses - novosMeses;
  if (ganho <= 0) return null;
  return `Se aumentar a sua poupan\xE7a mensal em ${BM.eur0(100)}, consegue atingir "${meta.nome}" aproximadamente ${ganho} ${ganho === 1 ? "m\xEAs" : "meses"} mais cedo.`;
}
const GOAL_FILTROS = [["todos", "Todos"], ["progresso", "Em progresso"], ["concluidos", "Conclu\xEDdos"], ["suspensos", "Suspensos"]];
function Poupanca({ open }) {
  const fin = useFinance();
  const metas = fin.data.metas;
  const [filtro, setFiltro] = React.useState("todos");
  const [filtrosVisiveis, setFiltrosVisiveis] = React.useState(true);
  const [menuId, setMenuId] = React.useState(null);
  const [detalheId, setDetalheId] = React.useState(null);
  React.useEffect(() => {
    if (!menuId) return;
    const h = (e) => {
      if (!e.target.closest || !e.target.closest(".ph-menu-wrap")) setMenuId(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuId]);
  const totalAlvo = metas.reduce((s, m) => s + (+m.alvo || 0), 0);
  const totalAtual = metas.reduce((s, m) => s + (+m.atual || 0), 0);
  const pct = totalAlvo > 0 ? Math.round(totalAtual / totalAlvo * 100) : 0;
  const concluidas = metas.filter((m) => m.fechada);
  const abertas = metas.filter((m) => !m.fechada);
  const estimativas = metas.map((m) => ({ meta: m, est: estimarConclusaoMeta(m, fin.metaSeries.find((s) => s.id === m.id)) })).filter((x) => x.est && x.est.meses > 0);
  const prazoMedioMeses = estimativas.length ? Math.round(estimativas.reduce((s, x) => s + x.est.meses, 0) / estimativas.length) : null;
  const dica = gerarDicaObjetivos(abertas, fin.metaSeries);
  const proximosAVencer = estimativas.filter((x) => !x.meta.fechada).sort((a, b) => a.est.meses - b.est.meses).slice(0, 3);
  const metasFiltradas = metas.filter((m) => {
    if (filtro === "progresso") return !m.fechada;
    if (filtro === "concluidos") return m.fechada;
    if (filtro === "suspensos") return false;
    return true;
  });
  const mesLabel = (key) => {
    const [y, mo] = (key || "").split("-").map(Number);
    return mo ? BM.MESES[mo - 1] + " " + y : "";
  };
  const paceTxt = (m, serie, est) => {
    if (m.fechada) return "Objetivo conclu\xEDdo";
    if (!(m.alvo > 0)) return "Poupan\xE7a sem objetivo fixo";
    if (est && est.mediaMensal > 0) return "Poupa em m\xE9dia " + BM.eur0(est.mediaMensal) + "/m\xEAs";
    return "Ainda sem ritmo de poupan\xE7a para estimar";
  };
  const detalhe = detalheId ? metas.find((m) => m.id === detalheId) : null;
  return /* @__PURE__ */ React.createElement("div", { className: "content goals-page" }, /* @__PURE__ */ React.createElement("div", { className: "goals-main" }, /* @__PURE__ */ React.createElement("div", { className: "goals-header" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "goals-title" }, "Objetivos"), /* @__PURE__ */ React.createElement("p", { className: "goals-sub" }, "Acompanhe o progresso dos seus objetivos financeiros e mantenha-se focado nas suas metas.")), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 10, flex: "none" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => setFiltrosVisiveis((v) => !v), "aria-pressed": filtrosVisiveis }, /* @__PURE__ */ React.createElement(Icon, { name: "filter", size: 15 }), " Filtros"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => open("meta") }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 16, color: "#fff" }), " Novo objetivo"))), filtrosVisiveis && /* @__PURE__ */ React.createElement("div", { className: "pg-tabs", style: { width: "fit-content" } }, GOAL_FILTROS.map(([id, lbl]) => /* @__PURE__ */ React.createElement("button", { type: "button", key: id, className: "pg-tab" + (filtro === id ? " on" : ""), onClick: () => setFiltro(id) }, lbl))), /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: "repeat(4,1fr)" } }, /* @__PURE__ */ React.createElement(Kpi, { label: "Total de objetivos", value: String(metas.length), icon: "flag", color: "var(--c-habitacao)", sub: `${concluidas.length} conclu\xEDdo(s)` }), /* @__PURE__ */ React.createElement(Kpi, { label: "Total poupado", value: BM.eur0(totalAtual), icon: "target", color: "var(--accent)", sub: totalAlvo > 0 ? pct + "% do objetivo global" : "Sem objetivo definido" }), /* @__PURE__ */ React.createElement(Kpi, { label: "Valor restante", value: BM.eur0(Math.max(0, totalAlvo - totalAtual)), icon: "wallet", color: "var(--c-transporte)", sub: "Para concluir todos" }), /* @__PURE__ */ React.createElement(Kpi, { label: "Prazo m\xE9dio", value: prazoMedioMeses != null ? prazoMedioMeses + (prazoMedioMeses === 1 ? " m\xEAs" : " meses") : "\u2014", icon: "cal", color: "var(--c-educacao)", sub: prazoMedioMeses != null ? "Estimativa ao ritmo atual" : "Sem estimativa dispon\xEDvel" })), metas.length === 0 ? /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: "target",
      title: "Ainda n\xE3o criou nenhum objetivo financeiro.",
      msg: "Os objetivos ajudam-no a acompanhar o progresso das suas metas financeiras.",
      action: /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => open("meta") }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 16, color: "#fff" }), " Criar primeiro objetivo")
    }
  ) : metasFiltradas.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "card card-pad muted", style: { textAlign: "center", padding: "40px 20px", fontWeight: 600 } }, filtro === "suspensos" ? "N\xE3o existem objetivos suspensos." : "Sem objetivos nesta categoria.") : /* @__PURE__ */ React.createElement("div", { className: "goals-grid" }, metasFiltradas.map((m) => {
    const isOpen = !m.alvo || m.alvo <= 0;
    const p = isOpen ? null : Math.min(100, Math.round(m.atual / m.alvo * 100));
    const done = !isOpen && m.atual >= m.alvo;
    const fechada = !!m.fechada;
    const serie = fin.metaSeries.find((s) => s.id === m.id);
    const est = estimarConclusaoMeta(m, serie);
    return /* @__PURE__ */ React.createElement("div", { className: "card goal-card", key: m.id, style: { opacity: fechada ? 0.78 : 1 }, onClick: () => setDetalheId(m.id) }, /* @__PURE__ */ React.createElement("div", { className: "goal-card-top" }, /* @__PURE__ */ React.createElement("span", { className: "goal-ico", style: { background: `color-mix(in srgb, ${m.cor} 16%, transparent)` } }, /* @__PURE__ */ React.createElement(Icon, { name: done || fechada ? "check" : "target", size: 24, color: m.cor, sw: 2 })), /* @__PURE__ */ React.createElement("div", { className: "ph-menu-wrap", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", title: "Op\xE7\xF5es", onClick: () => setMenuId(menuId === m.id ? null : m.id) }, /* @__PURE__ */ React.createElement(Icon, { name: "dots", size: 17 })), menuId === m.id && /* @__PURE__ */ React.createElement("div", { className: "ph-menu" }, !fechada && /* @__PURE__ */ React.createElement("button", { onClick: () => {
      setMenuId(null);
      open("deposit", m);
    } }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 15 }), " Depositar"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      setMenuId(null);
      open("meta", m);
    } }, /* @__PURE__ */ React.createElement(Icon, { name: "edit", size: 15 }), " Editar"), fechada ? /* @__PURE__ */ React.createElement("button", { onClick: () => {
      setMenuId(null);
      fin.meta.reabrir(m.id);
    } }, /* @__PURE__ */ React.createElement(Icon, { name: "history", size: 15 }), " Reabrir") : /* @__PURE__ */ React.createElement("button", { onClick: () => {
      setMenuId(null);
      fin.meta.fechar(m.id);
    } }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 15 }), " Concluir"), /* @__PURE__ */ React.createElement("button", { className: "danger", onClick: () => {
      setMenuId(null);
      fin.meta.remove(m.id);
    } }, /* @__PURE__ */ React.createElement(Icon, { name: "trash", size: 15 }), " Remover")))), /* @__PURE__ */ React.createElement("div", { className: "goal-card-name" }, m.nome), /* @__PURE__ */ React.createElement("div", { className: "goal-card-desc" }, paceTxt(m, serie, est)), /* @__PURE__ */ React.createElement("div", { className: "goal-card-amt" }, /* @__PURE__ */ React.createElement("span", { className: "tnum" }, BM.eur0(m.atual)), !isOpen && /* @__PURE__ */ React.createElement("span", { className: "goal-card-amt-of" }, "de ", BM.eur0(m.alvo))), isOpen ? /* @__PURE__ */ React.createElement("div", { className: "bar", style: { opacity: 0.5 } }, /* @__PURE__ */ React.createElement("i", { style: { width: "100%", background: m.cor } })) : /* @__PURE__ */ React.createElement(Progress, { value: m.atual, max: m.alvo, color: "var(--accent)" }), /* @__PURE__ */ React.createElement("div", { className: "goal-card-foot" }, /* @__PURE__ */ React.createElement("span", { className: "goal-card-pct" }, fechada ? "Conclu\xEDdo" : isOpen ? "Livre" : p + "% conclu\xEDdo"), /* @__PURE__ */ React.createElement("span", { className: "goal-card-prazo" }, /* @__PURE__ */ React.createElement(Icon, { name: "cal", size: 13, color: "var(--ink-3)" }), fechada ? m.fechadaEm ? mesLabel(m.fechadaEm) : "Conclu\xEDdo" : est ? est.label : "Sem estimativa")));
  })), metas.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "section-head", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Evolu\xE7\xE3o das poupan\xE7as"), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 600, marginTop: 2 } }, "Acumulado de cada objetivo, m\xEAs a m\xEAs \u2014 os conclu\xEDdos aparecem a tracejado"))), /* @__PURE__ */ React.createElement(MultiLineSavings, { months: fin.series.map((s) => s.m), series: fin.metaSeries }), /* @__PURE__ */ React.createElement("div", { className: "row", style: { flexWrap: "wrap", gap: 16, marginTop: 14 } }, fin.metaSeries.map((s) => /* @__PURE__ */ React.createElement("span", { key: s.id, className: "row", style: { gap: 7, fontSize: 12.5, fontWeight: 700, opacity: s.fechada ? 0.6 : 1 } }, /* @__PURE__ */ React.createElement("span", { className: "dot", style: { background: s.cor } }), s.nome, s.fechada ? " (conclu\xEDda)" : "")))), fin.totalRec > 0 && fin.saldo > 0 && metas.length > 0 && /* @__PURE__ */ React.createElement(Alert, { kind: "ok", icon: "target", title: `Este m\xEAs sobrou-te ${BM.eur0(fin.saldo)} para poupar.` }, "Considera transferir parte deste valor para um dos teus objetivos.")), /* @__PURE__ */ React.createElement("aside", { className: "goals-aside" }, /* @__PURE__ */ React.createElement("div", { className: "card card-pad goals-aside-card" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Resumo geral"), /* @__PURE__ */ React.createElement("div", { className: "goals-donut-wrap" }, /* @__PURE__ */ React.createElement(
    DonutChart,
    {
      data: [{ valor: totalAtual, color: "var(--accent)" }, { valor: Math.max(0, totalAlvo - totalAtual), color: "var(--border)" }],
      size: 148,
      thickness: 18,
      center: /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "tnum", style: { fontSize: 22, fontWeight: 700 } }, pct, "%"), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 600 } }, "conclu\xEDdo"))
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "goals-donut-legend" }, /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 7 } }, /* @__PURE__ */ React.createElement("span", { className: "dot", style: { background: "var(--accent)" } }), " Valor atingido ", /* @__PURE__ */ React.createElement("b", { className: "tnum" }, BM.eur0(totalAtual))), /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 7 } }, /* @__PURE__ */ React.createElement("span", { className: "dot", style: { background: "var(--border-strong)" } }), " Valor restante ", /* @__PURE__ */ React.createElement("b", { className: "tnum" }, BM.eur0(Math.max(0, totalAlvo - totalAtual)))))), /* @__PURE__ */ React.createElement("div", { className: "card card-pad goals-aside-card" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Dica inteligente"), /* @__PURE__ */ React.createElement("p", { className: "goals-tip-text" }, dica || "Ainda n\xE3o h\xE1 dados suficientes para gerar uma recomenda\xE7\xE3o \u2014 registe alguns dep\xF3sitos nos seus objetivos."), /* @__PURE__ */ React.createElement("button", { className: "btn btn-soft", disabled: true, title: "Em breve", style: { width: "100%", justifyContent: "center" } }, "Ver plano personalizado")), /* @__PURE__ */ React.createElement("div", { className: "card card-pad goals-aside-card" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Pr\xF3ximos objetivos a vencer"), proximosAVencer.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600 } }, "Sem estimativas dispon\xEDveis de momento.") : /* @__PURE__ */ React.createElement("div", { className: "goals-upcoming-list" }, proximosAVencer.map(({ meta, est }) => /* @__PURE__ */ React.createElement("div", { className: "goals-upcoming-item", key: meta.id }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13 } }, meta.nome), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 600, marginTop: 2 } }, est.label)), /* @__PURE__ */ React.createElement("span", { className: "chip" }, est.meses <= 1 ? "Em breve" : `Faltam ${est.meses} meses`)))), /* @__PURE__ */ React.createElement("button", { type: "button", className: "goals-see-all", onClick: () => {
    setFiltro("todos");
    setFiltrosVisiveis(true);
  } }, "Ver todos os objetivos"))), detalhe && /* @__PURE__ */ React.createElement(
    MetaDetalheModal,
    {
      meta: detalhe,
      serie: fin.metaSeries.find((s) => s.id === detalhe.id),
      onClose: () => setDetalheId(null),
      onDeposit: () => {
        setDetalheId(null);
        open("deposit", detalhe);
      },
      onEdit: () => {
        setDetalheId(null);
        open("meta", detalhe);
      },
      onToggleFechada: () => {
        setDetalheId(null);
        detalhe.fechada ? fin.meta.reabrir(detalhe.id) : fin.meta.fechar(detalhe.id);
      }
    }
  ));
}
function MetaDetalheModal({ meta, serie, onClose, onDeposit, onEdit, onToggleFechada }) {
  const isOpen = !meta.alvo || meta.alvo <= 0;
  const p = isOpen ? null : Math.min(100, Math.round(meta.atual / meta.alvo * 100));
  const fechada = !!meta.fechada;
  const est = estimarConclusaoMeta(meta, serie);
  return /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: meta.nome,
      sub: fechada ? "Objetivo conclu\xEDdo" : isOpen ? "Poupan\xE7a sem objetivo fixo" : est ? "Estimativa: " + est.label : "Sem estimativa dispon\xEDvel",
      icon: "target",
      onClose,
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: onToggleFechada }, fechada ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { name: "history", size: 14 }), " Reabrir") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 14 }), " Concluir")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: onDeposit, disabled: fechada }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 15, color: "#fff" }), " Depositar"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "modal-row-2", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 700 } }, "J\xE1 poupado"), /* @__PURE__ */ React.createElement("div", { className: "tnum", style: { fontSize: 22, fontWeight: 700, marginTop: 4 } }, BM.eur0(meta.atual))), !isOpen && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 700 } }, "Objetivo"), /* @__PURE__ */ React.createElement("div", { className: "tnum", style: { fontSize: 22, fontWeight: 700, marginTop: 4 } }, BM.eur0(meta.alvo)))),
    !isOpen && /* @__PURE__ */ React.createElement(Progress, { value: meta.atual, max: meta.alvo, color: "var(--accent)" }),
    !isOpen && /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { marginTop: 9, fontWeight: 600 } }, p, "% conclu\xEDdo \xB7 faltam ", BM.eur0(Math.max(0, meta.alvo - meta.atual))),
    serie && serie.points && serie.points.some((v) => v > 0) && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 700, marginBottom: 8 } }, "Evolu\xE7\xE3o (\xFAltimos 6 meses)"), /* @__PURE__ */ React.createElement(Sparkline, { data: serie.points, w: 380, h: 54, color: meta.cor })),
    /* @__PURE__ */ React.createElement("div", { style: { marginTop: 4 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: onEdit }, /* @__PURE__ */ React.createElement(Icon, { name: "edit", size: 14 }), " Editar objetivo"))
  );
}
function Relatorios({ open }) {
  const [tab, setTab] = React.useState("geral");
  const TABS = [["geral", "Vis\xE3o geral"], ["receitas", "Receitas"], ["despesas", "Despesas"], ["objetivos", "Objetivos"], ["orcamento", "Or\xE7amento"]];
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "content", style: { paddingBottom: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "pg-tabs", style: { width: "fit-content" } }, TABS.map(([id, lbl]) => /* @__PURE__ */ React.createElement("button", { type: "button", key: id, className: "pg-tab" + (tab === id ? " on" : ""), onClick: () => setTab(id) }, lbl)))), tab === "geral" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(RelatoriosVisaoGeral, null), /* @__PURE__ */ React.createElement(Historico, null)), tab === "receitas" && /* @__PURE__ */ React.createElement(RelatoriosReceitas, null), tab === "despesas" && /* @__PURE__ */ React.createElement(RelatoriosDespesas, null), tab === "objetivos" && /* @__PURE__ */ React.createElement(RelatoriosObjetivos, null), tab === "orcamento" && /* @__PURE__ */ React.createElement(RelatoriosOrcamento, { open }));
}
function RelatoriosVisaoGeral() {
  const fin = useFinance();
  const hist = fin.historico;
  if (hist.length === 0) {
    return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement(
      EmptyState,
      {
        icon: "report",
        title: "Sem dados para relat\xF3rios",
        msg: "Assim que registares rendimentos e despesas, geramos automaticamente m\xE9dias, gr\xE1ficos e an\xE1lises da tua sa\xFAde financeira."
      }
    ));
  }
  const mRec = Math.round(hist.reduce((s, h) => s + h.rec, 0) / hist.length);
  const mGasto = Math.round(hist.reduce((s, h) => s + h.gasto, 0) / hist.length);
  const mPoup = mRec - mGasto;
  const taxa = mRec > 0 ? Math.round(mPoup / mRec * 100) : 0;
  const topCat = fin.catBreak[0];
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: "repeat(4,1fr)" } }, /* @__PURE__ */ React.createElement(Kpi, { label: "M\xE9dia recebida / m\xEAs", value: BM.eur0(mRec), icon: "arrowsDown", color: "var(--accent)" }), /* @__PURE__ */ React.createElement(Kpi, { label: "M\xE9dia gasta / m\xEAs", value: BM.eur0(mGasto), icon: "wallet", color: "var(--c-transporte)" }), /* @__PURE__ */ React.createElement(Kpi, { label: "M\xE9dia poupada / m\xEAs", value: BM.eur0(mPoup), icon: "target", color: "var(--c-educacao)" }), /* @__PURE__ */ React.createElement(Kpi, { label: "Taxa de poupan\xE7a", value: taxa + "%", icon: "chart", color: "var(--c-habitacao)" })), /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: "1fr 1fr" } }, /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 14 } }, "Receitas vs. Despesas"), /* @__PURE__ */ React.createElement(BarPair, { data: fin.series, height: 220 }), /* @__PURE__ */ React.createElement("div", { className: "row tiny", style: { fontWeight: 700, marginTop: 10, gap: 16 } }, /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "dot", style: { background: "var(--accent)" } }), " Receitas"), /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "dot", style: { background: "var(--c-transporte)" } }), " Despesas"))), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 14 } }, "Onde vai o teu dinheiro ", /* @__PURE__ */ React.createElement("span", { className: "muted tiny", style: { fontWeight: 600 } }, "\xB7 ", fin.monthLabel)), fin.catBreak.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600 } }, "Sem despesas neste m\xEAs.") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 13 } }, fin.catBreak.map((c) => {
    const p = fin.totalGasto > 0 ? Math.round(c.valor / fin.totalGasto * 100) : 0;
    return /* @__PURE__ */ React.createElement("div", { key: c.key }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 8, fontSize: 13, fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", { className: "dot", style: { background: c.color } }), c.nome), /* @__PURE__ */ React.createElement("span", { className: "tnum tiny", style: { fontWeight: 700 } }, BM.eur0(c.valor), " \xB7 ", p, "%")), /* @__PURE__ */ React.createElement("div", { className: "bar" }, /* @__PURE__ */ React.createElement("i", { style: { width: p + "%", background: c.color } })));
  })))), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 4 } }, "An\xE1lise autom\xE1tica"), /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: "1fr 1fr 1fr", marginTop: 12 } }, topCat ? /* @__PURE__ */ React.createElement(Alert, { kind: "bad", icon: "info", title: `Maior gasto: ${topCat.nome}` }, `Representa ${Math.round(topCat.valor / fin.totalGasto * 100)}% das despesas de ${fin.monthLabel}.`) : /* @__PURE__ */ React.createElement(Alert, { kind: "ok", icon: "check", title: "Sem despesas este m\xEAs" }, "Boa gest\xE3o!"), taxa >= 0 ? /* @__PURE__ */ React.createElement(Alert, { kind: taxa >= 10 ? "ok" : "warn", icon: taxa >= 10 ? "check" : "bell", title: `Taxa m\xE9dia de poupan\xE7a: ${taxa}%` }, taxa >= 10 ? "Est\xE1s no bom caminho." : "Tenta reduzir despesas vari\xE1veis.") : /* @__PURE__ */ React.createElement(Alert, { kind: "bad", icon: "info", title: "Est\xE1s a gastar mais do que recebes" }, "Reavalia as tuas despesas fixas."), /* @__PURE__ */ React.createElement(Alert, { kind: "ok", icon: "history", title: `${hist.length} ${hist.length === 1 ? "m\xEAs registado" : "meses registados"}` }, "Continua a registar para an\xE1lises mais precisas."))));
}
function RelatoriosReceitas() {
  const fin = useFinance();
  if (fin.historico.length === 0) {
    return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement(
      EmptyState,
      {
        icon: "arrowsDown",
        title: "Sem receitas registadas",
        msg: "Assim que registares rendimentos, aparecem aqui as tuas fontes e a evolu\xE7\xE3o mensal."
      }
    ));
  }
  const mediaRec = Math.round(fin.historico.reduce((s, h) => s + h.rec, 0) / fin.historico.length);
  const recSpark = fin.series.map((s) => s.rec);
  const variacao = fin.series.length >= 2 ? fin.series[fin.series.length - 1].rec - fin.series[fin.series.length - 2].rec : 0;
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: "repeat(3,1fr)" } }, /* @__PURE__ */ React.createElement(Kpi, { label: "Recebido este m\xEAs", value: BM.eur0(fin.totalRec), icon: "arrowsDown", color: "var(--accent)", spark: recSpark }), /* @__PURE__ */ React.createElement(Kpi, { label: "M\xE9dia mensal (6 meses)", value: BM.eur0(mediaRec), icon: "chart", color: "var(--c-habitacao)" }), /* @__PURE__ */ React.createElement(Kpi, { label: "Fontes ativas este m\xEAs", value: String(fin.incBreak.length), icon: "wallet", color: "var(--c-educacao)", sub: variacao !== 0 ? (variacao > 0 ? "+" : "") + BM.eur0(variacao) + " vs. m\xEAs anterior" : void 0 })), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 14 } }, "Receitas por fonte ", /* @__PURE__ */ React.createElement("span", { className: "muted tiny", style: { fontWeight: 600 } }, "\xB7 ", fin.monthLabel)), fin.incBreak.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600 } }, "Sem receitas neste m\xEAs.") : /* @__PURE__ */ React.createElement(BarBreakdown, { data: fin.incBreak, money: BM.eur0, labelOf: (c) => c.nome })));
}
function RelatoriosDespesas() {
  const fin = useFinance();
  if (fin.historico.length === 0) {
    return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement(
      EmptyState,
      {
        icon: "wallet",
        title: "Sem despesas registadas",
        msg: "Assim que registares despesas, aparece aqui a divis\xE3o por categoria e a evolu\xE7\xE3o mensal."
      }
    ));
  }
  const mediaGasto = Math.round(fin.historico.reduce((s, h) => s + h.gasto, 0) / fin.historico.length);
  const gastoSpark = fin.series.map((s) => s.gasto);
  const pctFixas = fin.totalGasto > 0 ? Math.round(fin.fixas / fin.totalGasto * 100) : 0;
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: "repeat(3,1fr)" } }, /* @__PURE__ */ React.createElement(Kpi, { label: "Gasto este m\xEAs", value: BM.eur0(fin.totalGasto), icon: "wallet", color: "var(--c-transporte)", spark: gastoSpark }), /* @__PURE__ */ React.createElement(Kpi, { label: "M\xE9dia mensal (6 meses)", value: BM.eur0(mediaGasto), icon: "chart", color: "var(--c-habitacao)" }), /* @__PURE__ */ React.createElement(Kpi, { label: "Despesas fixas", value: pctFixas + "%", icon: "home", color: "var(--c-educacao)", sub: BM.eur0(fin.fixas) + " de " + BM.eur0(fin.totalGasto) })), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 14 } }, "Despesas por categoria ", /* @__PURE__ */ React.createElement("span", { className: "muted tiny", style: { fontWeight: 600 } }, "\xB7 ", fin.monthLabel)), fin.catBreak.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "muted tiny", style: { fontWeight: 600 } }, "Sem despesas neste m\xEAs.") : /* @__PURE__ */ React.createElement(BarBreakdown, { data: fin.catBreak, money: BM.eur0, labelOf: (c) => c.nome })));
}
function RelatoriosObjetivos() {
  const fin = useFinance();
  const metas = fin.metaSeries;
  if (metas.length === 0) {
    return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement(
      EmptyState,
      {
        icon: "target",
        title: "Ainda sem objetivos",
        msg: "Cria um objetivo de poupan\xE7a para acompanhares aqui o progresso ao longo do tempo."
      }
    ));
  }
  const abertas = metas.filter((m) => !m.fechada);
  const totalAtual = metas.reduce((s, m) => s + m.atual, 0);
  const totalAlvo = metas.filter((m) => m.alvo > 0).reduce((s, m) => s + m.alvo, 0);
  const pctGlobal = totalAlvo > 0 ? Math.round(totalAtual / totalAlvo * 100) : 0;
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: "repeat(3,1fr)" } }, /* @__PURE__ */ React.createElement(Kpi, { label: "Total poupado em objetivos", value: BM.eur0(totalAtual), icon: "target", color: "var(--accent)" }), /* @__PURE__ */ React.createElement(Kpi, { label: "Objetivos ativos", value: String(abertas.length), icon: "flag", color: "var(--c-habitacao)", sub: metas.length - abertas.length > 0 ? metas.length - abertas.length + " conclu\xEDdo(s)" : void 0 }), /* @__PURE__ */ React.createElement(Kpi, { label: "Progresso global", value: totalAlvo > 0 ? pctGlobal + "%" : "\u2014", icon: "chart", color: "var(--c-educacao)", sub: totalAlvo > 0 ? "Faltam " + BM.eur0(Math.max(0, totalAlvo - totalAtual)) : "Sem valor-alvo definido" })), /* @__PURE__ */ React.createElement("div", { className: "card card-pad", style: { display: "flex", flexDirection: "column", gap: 18 } }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Progresso por objetivo"), metas.map((m) => {
    const isOpen = !(m.alvo > 0);
    const p = isOpen ? null : Math.round(m.atual / m.alvo * 100);
    return /* @__PURE__ */ React.createElement("div", { key: m.id, style: { display: "flex", alignItems: "center", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between", marginBottom: 7 } }, /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 8, fontSize: 13.5, fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", { className: "dot", style: { background: m.cor } }), m.nome, m.fechada && /* @__PURE__ */ React.createElement("span", { className: "chip", style: { padding: "2px 8px" } }, "Conclu\xEDda")), /* @__PURE__ */ React.createElement("span", { className: "tnum tiny muted", style: { fontWeight: 700 } }, BM.eur0(m.atual), !isOpen && " / " + BM.eur0(m.alvo))), isOpen ? /* @__PURE__ */ React.createElement("div", { className: "bar", style: { opacity: 0.5 } }, /* @__PURE__ */ React.createElement("i", { style: { width: "100%", background: m.cor } })) : /* @__PURE__ */ React.createElement(Progress, { value: m.atual, max: m.alvo, color: m.cor })), /* @__PURE__ */ React.createElement(Sparkline, { data: m.points.some((v) => v > 0) ? m.points : [0, 0], w: 92, h: 32, color: m.cor }));
  })));
}
function RelatoriosOrcamento({ open }) {
  const fin = useFinance();
  const orc = fin.data.orcamento;
  if (!orc) {
    return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement(
      EmptyState,
      {
        icon: "wallet",
        title: "Sem or\xE7amento definido",
        msg: "Define um or\xE7amento mensal para acompanhares aqui quanto j\xE1 gastaste, quanto falta e como te tens sa\xEDdo nos \xFAltimos meses.",
        action: /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => open("orcamento") }, /* @__PURE__ */ React.createElement(Icon, { name: "edit", size: 16, color: "#fff" }), " Definir or\xE7amento")
      }
    ));
  }
  const pct = Math.round(fin.totalGasto / orc * 100);
  const restante = Math.max(0, orc - fin.totalGasto);
  const hoje = /* @__PURE__ */ new Date();
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const diasRestantes = Math.max(1, diasNoMes - hoje.getDate() + 1);
  const mediaDiaria = restante / diasRestantes;
  const comparaveis = fin.historico.filter((h) => !h.atual);
  const dentroOrc = comparaveis.filter((h) => h.gasto <= orc).length;
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { className: "grid", style: { gridTemplateColumns: "repeat(3,1fr)" } }, /* @__PURE__ */ React.createElement(Kpi, { label: "Or\xE7amento mensal", value: BM.eur0(orc), icon: "wallet", color: "var(--accent)", sub: pct + "% utilizado" }), /* @__PURE__ */ React.createElement(Kpi, { label: "Restante este m\xEAs", value: BM.eur0(restante), icon: "bolt", color: pct >= 100 ? "var(--neg)" : "var(--c-habitacao)" }), /* @__PURE__ */ React.createElement(Kpi, { label: "M\xE9dia di\xE1ria recomendada", value: BM.eur0(mediaDiaria), icon: "cal", color: "var(--c-educacao)", sub: diasRestantes + " dia(s) at\xE9 ao fim do m\xEAs" })), /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "section-head", style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Utiliza\xE7\xE3o deste m\xEAs"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", style: { padding: "6px 12px" }, onClick: () => open("orcamento") }, /* @__PURE__ */ React.createElement(Icon, { name: "edit", size: 14 }), " Editar")), /* @__PURE__ */ React.createElement(Progress, { value: fin.totalGasto, max: orc, color: pct > 80 ? "var(--warn)" : "var(--accent)" }), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { marginTop: 9, fontWeight: 600 } }, BM.eur0(fin.totalGasto), " de ", BM.eur0(orc), " gastos at\xE9 agora.")), comparaveis.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { marginBottom: 4 } }, "Hist\xF3rico face ao or\xE7amento atual"), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 600, marginBottom: 14 } }, "Com o or\xE7amento de ", BM.eur0(orc), ", terias ficado dentro do limite em ", dentroOrc, " de ", comparaveis.length, " m\xEAs(es) anteriores."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, comparaveis.slice(0, 6).map((h) => {
    const p = Math.min(999, Math.round(h.gasto / orc * 100));
    const over = h.gasto > orc;
    return /* @__PURE__ */ React.createElement("div", { key: h.key }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between", marginBottom: 5 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, h.label), /* @__PURE__ */ React.createElement("span", { className: "tnum tiny", style: { fontWeight: 700, color: over ? "var(--neg)" : "var(--ink-2)" } }, BM.eur0(h.gasto), " \xB7 ", p, "%")), /* @__PURE__ */ React.createElement("div", { className: "bar" }, /* @__PURE__ */ React.createElement("i", { style: { width: Math.min(100, p) + "%", background: over ? "var(--neg)" : "var(--accent)" } })));
  }))));
}
function Historico() {
  const fin = useFinance();
  const [q, setQ] = React.useState("");
  const hist = fin.historico.filter((h) => h.label.toLowerCase().includes(q.toLowerCase()));
  if (fin.historico.length === 0) {
    return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement(
      EmptyState,
      {
        icon: "history",
        title: "Sem hist\xF3rico ainda",
        msg: "O teu hist\xF3rico mensal aparece aqui automaticamente \xE0 medida que vais registando rendimentos e despesas."
      }
    ));
  }
  const trend = fin.series.map((m) => m.rec - m.gasto);
  return /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-pad row", style: { justifyContent: "space-between", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { flex: 1, minWidth: 220, gap: 10, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 13px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "search", size: 17, color: "var(--ink-3)" }), /* @__PURE__ */ React.createElement("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Pesquisar por m\xEAs\u2026", style: { border: "none", background: "transparent", outline: "none", color: "var(--ink)", fontSize: 14, fontWeight: 600, fontFamily: "inherit", width: "100%" } })), /* @__PURE__ */ React.createElement("span", { className: "muted tiny", style: { fontWeight: 700 } }, fin.historico.length, " ", fin.historico.length === 1 ? "m\xEAs" : "meses", " com registos")), /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", { className: "t" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Per\xEDodo"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Recebido"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Gasto"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "right" } }, "Saldo"), /* @__PURE__ */ React.createElement("th", null, "Tend\xEAncia"))), /* @__PURE__ */ React.createElement("tbody", null, hist.map((h) => {
    const saldo = h.rec - h.gasto;
    return /* @__PURE__ */ React.createElement("tr", { key: h.key }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 9, fontWeight: 700 } }, /* @__PURE__ */ React.createElement(Icon, { name: "cal", size: 16, color: "var(--ink-3)" }), h.label, h.atual && /* @__PURE__ */ React.createElement("span", { className: "chip sel", style: { padding: "2px 8px" } }, "Atual"))), /* @__PURE__ */ React.createElement("td", { className: "tnum", style: { textAlign: "right", color: "var(--accent)", fontWeight: 700 } }, "+", BM.eur0(h.rec)), /* @__PURE__ */ React.createElement("td", { className: "tnum", style: { textAlign: "right", color: "var(--neg)", fontWeight: 700 } }, "\u2212", BM.eur0(h.gasto)), /* @__PURE__ */ React.createElement("td", { className: "tnum", style: { textAlign: "right", fontWeight: 700, color: saldo < 0 ? "var(--neg)" : "var(--ink)" } }, BM.eur0(saldo)), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(Sparkline, { data: trend.length > 1 ? trend : [0, saldo], w: 80, h: 26, color: saldo < 0 ? "var(--neg)" : "var(--accent)" })));
  }))))));
}
function PerfilPreferencias() {
  const fin = useFinance();
  const a = fin.account || {};
  const [editar, setEditar] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const SITUACOES = [["estudante", "Estudante"], ["trabalhador", "Trabalhador"], ["freelancer", "Freelancer"], ["empresario", "Empres\xE1rio"], ["casado", "Casado"], ["vive-sozinho", "Vive sozinho"], ["casa-partilhada", "Vive numa casa partilhada"], ["outro", "Outro"]];
  const OBJETIVOS = [["fundo", "Fundo de emerg\xEAncia"], ["casa", "Comprar casa"], ["carro", "Comprar carro"], ["viagem", "Viagem"], ["educacao", "Educa\xE7\xE3o"], ["tecnologia", "Tecnologia"], ["familia", "Fam\xEDlia"], ["saude", "Sa\xFAde"], ["investimento", "Investimento"], ["outro", "Outro"]];
  const PREFERENCIAS = [["controlar", "Controlar despesas"], ["orcamento", "Organizar o or\xE7amento mensal"], ["objetivos", "Criar objetivos financeiros"], ["partilhadas", "Gerir despesas partilhadas"], ["pagamentos", "Acompanhar pagamentos futuros"], ["habitos", "Melhorar h\xE1bitos financeiros"]];
  const PLANEAMENTO = [["criar-agora", "Quero criar um or\xE7amento mensal agora"], ["sugestao", "Quero receber uma sugest\xE3o inicial"], ["mais-tarde", "Prefiro configurar mais tarde"]];
  const PARTILHA = [["nao", "N\xE3o"], ["parceiro", "Com parceiro ou parceira"], ["familia", "Com fam\xEDlia"], ["casa", "Numa casa partilhada"], ["grupo", "Em grupos ocasionais"]];
  const RENDIMENTOS = Object.keys(BM.incomeCats);
  const DESPESAS = ["Renda", "\xC1gua", "Eletricidade", "G\xE1s", "Internet", "Alimenta\xE7\xE3o", "Transporte", "Educa\xE7\xE3o", "Sa\xFAde", "Seguros", "Subscri\xE7\xF5es", "Lazer", "Telecomunica\xE7\xF5es", "Outro"];
  const rotulo = (lista, val) => (lista.find((o) => o[0] === val) || [null, "\u2014"])[1];
  const SEL_MAX = 3;
  const asArr = (v, fallback) => Array.isArray(v) ? v : v ? [v] : fallback;
  const [f, setF] = React.useState({});
  const abrir = () => {
    setF({
      situacao: asArr(a.situacao, ["estudante"]),
      objetivo: asArr(a.objetivo, ["fundo"]),
      preferencia: asArr(a.preferencia, ["controlar"]),
      planeamento: a.planeamento || "mais-tarde",
      partilha: a.partilha || "nao",
      fontesRendimento: Array.isArray(a.fontesRendimento) ? a.fontesRendimento : [],
      principaisDespesas: Array.isArray(a.principaisDespesas) ? a.principaisDespesas : [],
      notificacoes: a.notificacoes !== false,
      resumoSemanal: a.resumoSemanal !== false
    });
    setMsg("");
    setEditar(true);
  };
  const toggleArr = (k, v, max) => setF((s) => {
    const arr = s[k] || [];
    if (arr.includes(v)) return { ...s, [k]: arr.filter((x) => x !== v) };
    if (max && arr.length >= max) return s;
    return { ...s, [k]: [...arr, v] };
  });
  const guardar = async () => {
    setBusy(true);
    setMsg("");
    try {
      await fin.updateAccount({ ...f });
      setMsg("Guardado.");
      setEditar(false);
    } catch (e) {
      setMsg(e.message || "N\xE3o foi poss\xEDvel guardar.");
    } finally {
      setBusy(false);
    }
  };
  const Linha = ({ label, valor }) => /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("span", { className: "tiny muted", style: { fontWeight: 700 } }, label), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 13, textAlign: "right" } }, valor));
  const Chips = ({ label, valor }) => /* @__PURE__ */ React.createElement("div", { style: { paddingBottom: 12, borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 700, marginBottom: 7 } }, label), valor && valor.length ? /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 6, flexWrap: "wrap" } }, valor.map((c) => /* @__PURE__ */ React.createElement("span", { className: "chip", key: c }, c))) : /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 13 } }, "\u2014"));
  const Seletor = ({ label, lista, k }) => /* @__PURE__ */ React.createElement(Field, { label }, /* @__PURE__ */ React.createElement("select", { className: "select", value: f[k], onChange: (e) => setF((s) => ({ ...s, [k]: e.target.value })) }, lista.map(([v, l]) => /* @__PURE__ */ React.createElement("option", { key: v, value: v }, l))));
  const Multi = ({ label, opcoes, k, max }) => /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 700, marginBottom: 8 } }, label, max ? ` (${(f[k] || []).length}/${max})` : ""), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 7, flexWrap: "wrap" } }, opcoes.map((o) => {
    const on = (f[k] || []).includes(o);
    const disabled = !on && !!max && (f[k] || []).length >= max;
    return /* @__PURE__ */ React.createElement("button", { type: "button", key: o, className: "chip" + (on ? " sel" : ""), disabled, style: { cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1 }, onClick: () => toggleArr(k, o, max) }, o);
  })));
  const MultiLabeled = ({ label, lista, k, max }) => /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 700, marginBottom: 8 } }, label, max ? ` (${(f[k] || []).length}/${max})` : ""), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 7, flexWrap: "wrap" } }, lista.map(([v, l]) => {
    const on = (f[k] || []).includes(v);
    const disabled = !on && !!max && (f[k] || []).length >= max;
    return /* @__PURE__ */ React.createElement("button", { type: "button", key: v, className: "chip" + (on ? " sel" : ""), disabled, style: { cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1 }, onClick: () => toggleArr(k, v, max) }, l);
  })));
  return /* @__PURE__ */ React.createElement("div", { className: "card card-pad", style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { display: "flex", alignItems: "center", gap: 10, margin: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "li-ico", style: { width: 30, height: 30, background: "var(--accent-soft)", flex: "none" } }, /* @__PURE__ */ React.createElement(Icon, { name: "target", size: 16, color: "var(--accent)" })), "Prefer\xEAncias financeiras"), !editar && /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: abrir }, /* @__PURE__ */ React.createElement(Icon, { name: "edit", size: 15 }), " Editar")), msg && /* @__PURE__ */ React.createElement("div", { className: "alert " + (msg === "Guardado." ? "ok" : "bad"), style: { padding: "9px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: msg === "Guardado." ? "check" : "info", size: 16, color: msg === "Guardado." ? "var(--accent)" : "var(--neg)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, msg)), !editar ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement(Chips, { label: "Situa\xE7\xE3o atual", valor: asArr(a.situacao, []).map((v) => rotulo(SITUACOES, v)) }), /* @__PURE__ */ React.createElement(Chips, { label: "Como pretende utilizar o Rende+", valor: asArr(a.preferencia, []).map((v) => rotulo(PREFERENCIAS, v)) }), /* @__PURE__ */ React.createElement(Chips, { label: "Fontes de rendimento", valor: a.fontesRendimento }), /* @__PURE__ */ React.createElement(Chips, { label: "Principais despesas", valor: a.principaisDespesas }), /* @__PURE__ */ React.createElement(Chips, { label: "Objetivo principal", valor: asArr(a.objetivo, []).map((v) => rotulo(OBJETIVOS, v)) }), /* @__PURE__ */ React.createElement(Linha, { label: "Planeamento", valor: rotulo(PLANEAMENTO, a.planeamento) }), /* @__PURE__ */ React.createElement(Linha, { label: "Partilha de despesas", valor: rotulo(PARTILHA, a.partilha) }), a.telefone && /* @__PURE__ */ React.createElement(Linha, { label: "Telefone", valor: a.telefone }), /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between", gap: 12, paddingBottom: a.sobre ? 12 : 0, borderBottom: a.sobre ? "1px solid var(--border)" : "none" } }, /* @__PURE__ */ React.createElement("span", { className: "tiny muted", style: { fontWeight: 700 } }, "Notifica\xE7\xF5es \xB7 Resumo semanal"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 13 } }, a.notificacoes !== false ? "On" : "Off", " \xB7 ", a.resumoSemanal !== false ? "On" : "Off")), a.sobre && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 700, marginBottom: 4 } }, "Sobre os teus objetivos"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: "var(--ink-2)", lineHeight: 1.5 } }, a.sobre))) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, /* @__PURE__ */ React.createElement(MultiLabeled, { label: "Situa\xE7\xE3o atual", lista: SITUACOES, k: "situacao", max: SEL_MAX }), /* @__PURE__ */ React.createElement(MultiLabeled, { label: "Como pretende utilizar o Rende+", lista: PREFERENCIAS, k: "preferencia", max: SEL_MAX }), /* @__PURE__ */ React.createElement(Multi, { label: "Fontes de rendimento", opcoes: RENDIMENTOS, k: "fontesRendimento" }), /* @__PURE__ */ React.createElement(Multi, { label: "Principais despesas", opcoes: DESPESAS, k: "principaisDespesas" }), /* @__PURE__ */ React.createElement(MultiLabeled, { label: "Objetivo principal", lista: OBJETIVOS, k: "objetivo", max: SEL_MAX }), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement(Seletor, { label: "Planeamento", lista: PLANEAMENTO, k: "planeamento" }), /* @__PURE__ */ React.createElement(Seletor, { label: "Partilha de despesas", lista: PARTILHA, k: "partilha" })), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 16, flexWrap: "wrap", margin: "4px 0 10px" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "chip" + (f.notificacoes ? " sel" : ""), style: { cursor: "pointer" }, onClick: () => setF((s) => ({ ...s, notificacoes: !s.notificacoes })) }, "Notifica\xE7\xF5es: ", f.notificacoes ? "On" : "Off"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "chip" + (f.resumoSemanal ? " sel" : ""), style: { cursor: "pointer" }, onClick: () => setF((s) => ({ ...s, resumoSemanal: !s.resumoSemanal })) }, "Resumo semanal: ", f.resumoSemanal ? "On" : "Off")), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-soft", disabled: busy, style: { flex: 1, justifyContent: "center" }, onClick: () => {
    setEditar(false);
    setMsg("");
  } }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", disabled: busy, style: { flex: 1, justifyContent: "center", border: "none" }, onClick: guardar }, busy ? "A guardar\u2026" : "Guardar altera\xE7\xF5es"))));
}
function Perfil({ open, go }) {
  const fin = useFinance();
  const a = fin.account || {};
  const metas = fin.data.metas || [];
  const stats = [
    { ico: "coins", v: a.moeda || "EUR", l: "Moeda", bg: "var(--accent-soft)", c: "var(--accent)" },
    { ico: "spark", v: BM.eur0(fin.poupado || 0), l: "Poupado", bg: "color-mix(in srgb, var(--c-educacao) 16%, transparent)", c: "var(--c-educacao)" },
    { ico: "flag", v: metas.length, l: metas.length === 1 ? "Meta" : "Metas", bg: "color-mix(in srgb, var(--c-habitacao) 16%, transparent)", c: "var(--c-habitacao)" }
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "content", style: { maxWidth: 760 } }, /* @__PURE__ */ React.createElement("div", { className: "card card-pad" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 16, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(Avatar, { account: a, size: 64, fontSize: 22 }), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0, flex: "1 1 160px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 19, letterSpacing: "-.01em" } }, a.nome || "\u2014"), /* @__PURE__ */ React.createElement("div", { className: "muted", style: { fontWeight: 600, fontSize: 13, marginTop: 3, wordBreak: "break-word" } }, [a.idade && `${a.idade} anos`, a.nascimento && BM.fmtData(a.nascimento), a.cidade, a.email].filter(Boolean).join(" \xB7 ") || "Sem dados")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => open("perfil") }, /* @__PURE__ */ React.createElement(Icon, { name: "edit", size: 15 }), " Editar")), [a.perfil, a.estado, a.habitacao].filter(Boolean).length > 0 && /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 7, marginTop: 14, flexWrap: "wrap" } }, [a.perfil, a.estado, a.habitacao].filter(Boolean).map((c) => /* @__PURE__ */ React.createElement("span", { className: "chip", key: c }, c))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginTop: 16 } }, stats.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 11, background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "12px 14px" } }, /* @__PURE__ */ React.createElement("span", { style: { width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", flex: "none", background: s.bg } }, /* @__PURE__ */ React.createElement(Icon, { name: s.ico, size: 16, color: s.c })), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "tnum", style: { fontWeight: 700, fontSize: 16, letterSpacing: "-.01em" } }, s.v), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600, marginTop: 1 } }, s.l)))))), /* @__PURE__ */ React.createElement(PerfilPreferencias, null), /* @__PURE__ */ React.createElement("div", { className: "card card-pad row", style: { justifyContent: "space-between", flexWrap: "wrap", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "li-ico", style: { width: 30, height: 30, background: "var(--accent-soft)", flex: "none" } }, /* @__PURE__ */ React.createElement(Icon, { name: "bank", size: 16, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, "Gest\xE3o de conta"), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { fontWeight: 600, marginTop: 2 } }, "Terminar sess\xE3o, limpar dados ou eliminar a conta"))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => go("config") }, /* @__PURE__ */ React.createElement(Icon, { name: "gear", size: 15 }), " Ir a Defini\xE7\xF5es")));
}
function Definicoes({ theme, setTheme, open, go, onOpenTweaks, contraste, setContraste }) {
  const fin = useFinance();
  const a = fin.account || {};
  const [pinModal, setPinModal] = React.useState(false);
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => window.RendeLock.subscribe(force), []);
  const hasPin = window.RendeLock.hasPin();
  const lockMin = window.RendeLock.getMinutes();
  const ehPremium = a.plano === "premium";
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [busyDel, setBusyDel] = React.useState(false);
  const [delErr, setDelErr] = React.useState("");
  const Section = ({ title, icon, children }) => /* @__PURE__ */ React.createElement("div", { className: "card card-pad", style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { display: "flex", alignItems: "center", gap: 10 } }, icon && /* @__PURE__ */ React.createElement("span", { className: "li-ico", style: { width: 30, height: 30, background: "var(--accent-soft)", flex: "none" } }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 16, color: "var(--accent)" })), title), children);
  const Toggle = ({ on, onClick }) => /* @__PURE__ */ React.createElement("button", { onClick, style: { width: 46, height: 26, borderRadius: 99, border: "none", padding: 3, background: on ? "var(--accent)" : "var(--border-strong)", display: "flex", justifyContent: on ? "flex-end" : "flex-start", transition: "background .15s" } }, /* @__PURE__ */ React.createElement("span", { style: { width: 20, height: 20, borderRadius: "50%", background: "#fff", display: "block", boxShadow: "0 1px 3px rgba(0,0,0,.3)" } }));
  const Rowi = ({ label, sub, children, last }) => /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between", paddingBottom: last ? 0 : 14, borderBottom: last ? "none" : "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, label), sub && /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { marginTop: 2, fontWeight: 600 } }, sub)), children);
  const Soon = () => /* @__PURE__ */ React.createElement("span", { className: "chip", style: { color: "var(--ink-3)", fontWeight: 700 } }, "Em breve");
  return /* @__PURE__ */ React.createElement("div", { className: "content", style: { maxWidth: 880, margin: "0 auto" } }, /* @__PURE__ */ React.createElement(Section, { title: "Conta", icon: "user" }, /* @__PURE__ */ React.createElement(Rowi, { label: "Dados pessoais", sub: [a.nome, a.email].filter(Boolean).join(" \xB7 ") || "Sem dados" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => open("perfil") }, /* @__PURE__ */ React.createElement(Icon, { name: "edit", size: 14 }), " Editar")), /* @__PURE__ */ React.createElement(Rowi, { label: "Ver perfil completo", sub: "Dados, estat\xEDsticas e prefer\xEAncias financeiras" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => go("perfil") }, /* @__PURE__ */ React.createElement(Icon, { name: "user", size: 14 }), " Abrir")), /* @__PURE__ */ React.createElement(Rowi, { label: "Terminar sess\xE3o", sub: "Voltar ao ecr\xE3 de in\xEDcio de sess\xE3o", last: true }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: fin.logout }, /* @__PURE__ */ React.createElement(Icon, { name: "logout", size: 14 }), " Sair"))), /* @__PURE__ */ React.createElement(Section, { title: "Apar\xEAncia", icon: "sun" }, /* @__PURE__ */ React.createElement(Rowi, { label: "Modo escuro", sub: "Reduz o brilho em ambientes com pouca luz" }, /* @__PURE__ */ React.createElement(Toggle, { on: theme === "dark", onClick: () => setTheme(theme === "dark" ? "light" : "dark") })), /* @__PURE__ */ React.createElement(Rowi, { label: "Cor de acento, tipo de letra e cantos", sub: "Personaliza\xE7\xE3o avan\xE7ada do visual da app" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: onOpenTweaks }, /* @__PURE__ */ React.createElement(Icon, { name: "edit", size: 14 }), " Personalizar")), /* @__PURE__ */ React.createElement(Rowi, { label: "Contraste alto", sub: "Refor\xE7a o texto e os contornos para melhor legibilidade", last: true }, /* @__PURE__ */ React.createElement(Toggle, { on: !!contraste, onClick: () => setContraste(!contraste) }))), /* @__PURE__ */ React.createElement(Section, { title: "Finan\xE7as", icon: "wallet" }, /* @__PURE__ */ React.createElement(Rowi, { label: "Contas", sub: "Gere as tuas contas banc\xE1rias e carteiras" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => go("contas") }, /* @__PURE__ */ React.createElement(Icon, { name: "wallet", size: 14 }), " Abrir")), /* @__PURE__ */ React.createElement(Rowi, { label: "Categorias personalizadas", sub: (fin.data.customCats || []).length ? `${fin.data.customCats.length} categoria(s) criada(s)` : "Cria categorias pr\xF3prias ao registar uma despesa" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => open("despesa") }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 14 }), " Adicionar")), (fin.data.customCats || []).length > 0 && /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 8, flexWrap: "wrap" } }, fin.data.customCats.map((c) => /* @__PURE__ */ React.createElement("span", { key: c.key, className: "chip", style: { gap: 7 } }, /* @__PURE__ */ React.createElement("span", { className: "dot", style: { background: c.color } }), c.nome, /* @__PURE__ */ React.createElement("button", { onClick: () => fin.removeCategory(c.key), style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "grid", color: "var(--ink-3)" } }, /* @__PURE__ */ React.createElement("span", { style: { transform: "rotate(45deg)", display: "grid" } }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 13, color: "var(--ink-3)" })))))), /* @__PURE__ */ React.createElement(Rowi, { label: "Fontes de rendimento e principais despesas", sub: "Definidas na sec\xE7\xE3o Prefer\xEAncias, mais abaixo" }, /* @__PURE__ */ React.createElement(Icon, { name: "chevR", size: 16, color: "var(--ink-3)" })), /* @__PURE__ */ React.createElement(Rowi, { label: "Moeda principal", sub: "Definida no registo \u2014 usada em toda a app" }, /* @__PURE__ */ React.createElement("span", { className: "chip" }, a.moeda || fin.curSym || "EUR")), /* @__PURE__ */ React.createElement(Rowi, { label: "Or\xE7amento mensal", sub: fin.data.orcamento ? `Limite atual: ${BM.eur0(fin.data.orcamento)}` : "Ainda n\xE3o definido", last: true }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => open("orcamento") }, /* @__PURE__ */ React.createElement(Icon, { name: "edit", size: 14 }), " Definir"))), /* @__PURE__ */ React.createElement(Section, { title: "Notifica\xE7\xF5es", icon: "bell" }, /* @__PURE__ */ React.createElement(Rowi, { label: "Notifica\xE7\xF5es no separador", sub: "Alertas de or\xE7amento, objetivos e pagamentos a vencer \u2014 editar em Prefer\xEAncias, mais abaixo" }, /* @__PURE__ */ React.createElement("span", { className: "chip" }, a.notificacoes !== false ? "Ativas" : "Desativadas")), /* @__PURE__ */ React.createElement(Rowi, { label: "Resumo semanal", sub: "Editar em Prefer\xEAncias, mais abaixo" }, /* @__PURE__ */ React.createElement("span", { className: "chip" }, a.resumoSemanal !== false ? "Ativo" : "Desativado")), /* @__PURE__ */ React.createElement(Rowi, { label: "Notifica\xE7\xF5es de Partilha", sub: "D\xEDvidas, despesas de grupo a vencer e convites pendentes", last: true }, /* @__PURE__ */ React.createElement("span", { className: "chip" }, a.notificacoes !== false ? "Ativas" : "Desativadas"))), /* @__PURE__ */ React.createElement(Section, { title: "Seguran\xE7a", icon: "shield" }, /* @__PURE__ */ React.createElement(Rowi, { label: "PIN de bloqueio", sub: hasPin ? "Definido \u2014 a app bloqueia por inatividade" : "Sem PIN \u2014 a app n\xE3o bloqueia" }, hasPin ? /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", style: { color: "var(--neg)" }, onClick: () => window.RendeLock.removePin() }, /* @__PURE__ */ React.createElement(Icon, { name: "trash", size: 14 }), " Remover") : /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => setPinModal(true) }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 14, color: "#fff" }), " Definir PIN")), hasPin && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Rowi, { label: "Bloquear ap\xF3s inatividade", sub: "Tempo sem usar at\xE9 a app pedir o PIN" }, /* @__PURE__ */ React.createElement("select", { className: "select", style: { width: "auto" }, value: lockMin, onChange: (e) => window.RendeLock.setMinutes(Number(e.target.value)) }, [1, 5, 15, 30, 60].map((m) => /* @__PURE__ */ React.createElement("option", { key: m, value: m }, m, " min")))), /* @__PURE__ */ React.createElement(Rowi, { label: "Bloquear agora", sub: "Termina j\xE1 o acesso at\xE9 voltares a introduzir o PIN" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => window.RendeLock.lockNow() }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 14 }), " Bloquear"))), /* @__PURE__ */ React.createElement(Rowi, { label: "Alterar palavra-passe", sub: "Ainda n\xE3o dispon\xEDvel" }, /* @__PURE__ */ React.createElement(Soon, null)), /* @__PURE__ */ React.createElement(Rowi, { label: "Sess\xF5es ativas", sub: "Ainda n\xE3o dispon\xEDvel" }, /* @__PURE__ */ React.createElement(Soon, null)), /* @__PURE__ */ React.createElement(Rowi, { label: "Autentica\xE7\xE3o social", sub: "Ainda n\xE3o dispon\xEDvel", last: true }, /* @__PURE__ */ React.createElement(Soon, null))), /* @__PURE__ */ React.createElement(Section, { title: "Privacidade", icon: "lock" }, /* @__PURE__ */ React.createElement(Rowi, { label: "Exportar dados", sub: "Descarrega a tua previs\xE3o financeira em PDF ou Excel (Premium)" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => go("previsao") }, /* @__PURE__ */ React.createElement(Icon, { name: "report", size: 14 }), " Exportar")), /* @__PURE__ */ React.createElement(Rowi, { label: "Pol\xEDtica de privacidade", sub: "Como tratamos os teus dados" }, /* @__PURE__ */ React.createElement("a", { className: "btn btn-ghost", href: "privacidade.html", target: "_blank", rel: "noopener" }, "Ver")), /* @__PURE__ */ React.createElement(Rowi, { label: "Consentimentos", sub: "Ainda n\xE3o dispon\xEDvel" }, /* @__PURE__ */ React.createElement(Soon, null)), /* @__PURE__ */ React.createElement(Rowi, { label: "Apagar todos os dados", sub: "Remove despesas, rendimentos e metas (a conta mant\xE9m-se)" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-ghost",
      style: { color: "var(--neg)", borderColor: "color-mix(in srgb, var(--neg) 35%, transparent)" },
      onClick: () => setConfirmClear(true)
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "trash", size: 14 }),
    " Limpar dados"
  )), /* @__PURE__ */ React.createElement(Rowi, { label: "Eliminar conta", sub: "Apaga a conta e todos os dados de forma permanente", last: true }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-ghost",
      style: { color: "var(--neg)", borderColor: "color-mix(in srgb, var(--neg) 35%, transparent)" },
      onClick: () => {
        setDelErr("");
        setConfirmDelete(true);
      }
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "trash", size: 14 }),
    " Eliminar conta"
  ))), /* @__PURE__ */ React.createElement(Section, { title: "Plano", icon: "spark" }, /* @__PURE__ */ React.createElement(Rowi, { label: ehPremium ? "Rende+ Premium" : "Plano gratuito", sub: ehPremium ? "Tens acesso a Lembretes, Recorrentes, Partilha e Previs\xE3o" : "Faz upgrade para desbloquear Lembretes, Recorrentes, Partilha e Previs\xE3o", last: true }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => go("premium") }, /* @__PURE__ */ React.createElement(Icon, { name: "spark", size: 14, color: "#fff" }), " ", ehPremium ? "Gerir plano" : "Upgrade"))), /* @__PURE__ */ React.createElement("div", { className: "tiny", style: { fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink-3)", marginTop: 4 } }, "Prefer\xEAncias"), /* @__PURE__ */ React.createElement(PerfilPreferencias, null), pinModal && /* @__PURE__ */ React.createElement(RLPinSetup, { onClose: () => setPinModal(false) }), confirmClear && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: "Limpar todos os dados?",
      sub: "Esta a\xE7\xE3o n\xE3o pode ser revertida.",
      icon: "trash",
      iconNeg: true,
      onClose: () => setConfirmClear(false),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => setConfirmClear(false) }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { className: "btn", style: { background: "var(--neg)", color: "#fff", border: "none" }, onClick: () => {
        setConfirmClear(false);
        fin.resetData();
      } }, /* @__PURE__ */ React.createElement(Icon, { name: "trash", size: 15, color: "#fff" }), " Limpar"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "muted", style: { fontSize: 13.5, fontWeight: 500, lineHeight: 1.6 } }, "Vais remover todas as despesas, rendimentos e metas. A tua conta mant\xE9m-se, mas ", /* @__PURE__ */ React.createElement("strong", { style: { color: "var(--ink)" } }, "esta a\xE7\xE3o n\xE3o pode ser revertida"), ".")
  ), confirmDelete && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: "Eliminar a tua conta?",
      sub: "Esta a\xE7\xE3o n\xE3o pode ser revertida.",
      icon: "trash",
      iconNeg: true,
      onClose: () => !busyDel && setConfirmDelete(false),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", disabled: busyDel, onClick: () => setConfirmDelete(false) }, "Cancelar"), /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "btn",
          disabled: busyDel,
          style: { background: "var(--neg)", color: "#fff", border: "none", opacity: busyDel ? 0.8 : 1, cursor: busyDel ? "wait" : "pointer" },
          onClick: async () => {
            setBusyDel(true);
            setDelErr("");
            try {
              await fin.eliminarConta();
            } catch (e) {
              setDelErr(e.message || "N\xE3o foi poss\xEDvel eliminar a conta.");
              setBusyDel(false);
            }
          }
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "trash", size: 15, color: "#fff" }),
        " ",
        busyDel ? "A eliminar\u2026" : "Eliminar conta"
      ))
    },
    /* @__PURE__ */ React.createElement("div", { className: "muted", style: { fontSize: 13.5, fontWeight: 500, lineHeight: 1.6 } }, "Vais apagar a conta ", /* @__PURE__ */ React.createElement("strong", { style: { color: "var(--ink)" } }, a.email), " e ", /* @__PURE__ */ React.createElement("strong", { style: { color: "var(--ink)" } }, "todos"), " os dados \u2014 despesas, rendimentos, metas, contas e categorias. Esta a\xE7\xE3o ", /* @__PURE__ */ React.createElement("strong", { style: { color: "var(--ink)" } }, "n\xE3o pode ser revertida"), ". Se voltares a criar conta com este email, come\xE7a tudo do zero."),
    delErr && /* @__PURE__ */ React.createElement("div", { className: "alert bad", style: { marginTop: 14, padding: "9px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16, color: "var(--neg)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, delErr))
  ), /* @__PURE__ */ React.createElement("div", { className: "tiny muted", style: { textAlign: "center", marginTop: 4, fontWeight: 600 } }, "Rende+ \xB7 vers\xE3o ", window.APP_VERSION || "1.0.0"));
}
Object.assign(window, { Perfil, Poupanca, Relatorios, Historico, Definicoes });
