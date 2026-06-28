/* ===== Screen: Contas ligadas (Revolut / Wise) ===== */
function BankBadge({ bancoKey, size = 46 }) {
  const b = BM.bancos[bancoKey];
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, flex: "none", display: "grid", placeItems: "center",
      background: b.cor, color: "#fff", fontWeight: 700, fontSize: size * 0.42, letterSpacing: "-.02em" }}>{b.mono}</div>
  );
}

function Contas({ open }) {
  const fin = useFinance();
  const ligadas = fin.data.contas;
  const disponiveis = Object.keys(BM.bancos).filter((k) => !ligadas.some((c) => c.banco === k));
  const disponivel = fin.bancosTotal - fin.totalGasto;

  return (
    <div className="content">
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Kpi label="Saldo nas contas" value={BM.eur0(fin.bancosTotal)} icon="bank" color="var(--accent)" sub={`${ligadas.length} ${ligadas.length === 1 ? "conta ligada" : "contas ligadas"}`} />
        <Kpi label="Apps disponíveis" value={String(Object.keys(BM.bancos).length)} icon="link" color="var(--c-habitacao)" sub="Revolut, Wise" />
        <Kpi label="Importado este mês" value={BM.eur0(fin.data.despesas.concat(fin.data.rendimentos).filter((m) => m.origem && BM.monthKey(m.data) === fin.month).reduce((s, m) => s + (+m.valor || 0), 0))} icon="sync" color="var(--c-educacao)" sub="Movimentos sincronizados" />
      </div>

      {ligadas.length > 0 && (
        <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="section-head">
            <div><div className="section-title">Separar o teu dinheiro</div><div className="tiny muted" style={{ fontWeight: 600, marginTop: 2 }}>Saldo das contas menos os gastos de {fin.monthLabel}</div></div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            <div><div className="tiny muted" style={{ fontWeight: 700 }}>Saldo nas contas</div><div className="tnum" style={{ fontWeight: 700, fontSize: 22, marginTop: 4 }}>{BM.eur(fin.bancosTotal)}</div></div>
            <div><div className="tiny muted" style={{ fontWeight: 700 }}>Gastos do mês</div><div className="tnum" style={{ fontWeight: 700, fontSize: 22, marginTop: 4, color: "var(--neg)" }}>−{BM.eur(fin.totalGasto)}</div></div>
            <div><div className="tiny muted" style={{ fontWeight: 700 }}>Disponível para gastar</div><div className="tnum" style={{ fontWeight: 700, fontSize: 22, marginTop: 4, color: disponivel < 0 ? "var(--neg)" : "var(--accent)" }}>{BM.eur(disponivel)}</div></div>
          </div>
          <Progress value={Math.min(fin.totalGasto, fin.bancosTotal)} max={fin.bancosTotal || 1} color={disponivel < 0 ? "var(--neg)" : "var(--accent)"} />
          <div className="tiny muted" style={{ fontWeight: 600 }}>
            {disponivel < 0
              ? `Atenção: os gastos do mês já superam o saldo das contas em ${BM.eur(-disponivel)}.`
              : `Já comprometeste ${fin.bancosTotal > 0 ? Math.round((fin.totalGasto / fin.bancosTotal) * 100) : 0}% do saldo com despesas deste mês.`}
          </div>
        </div>
      )}

      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="section-head">
          <div><div className="section-title">Contas ligadas</div><div className="tiny muted" style={{ fontWeight: 600, marginTop: 2 }}>Sincroniza saldos e movimentos com verificação</div></div>
        </div>

        {ligadas.length === 0 ? (
          <div style={{ padding: "16px 0", textAlign: "center" }} className="muted tiny">
            <Icon name="bank" size={28} color="var(--ink-3)" />
            <div style={{ marginTop: 8, fontWeight: 600 }}>Ainda não ligaste nenhuma conta. Escolhe uma app abaixo.</div>
          </div>
        ) : (
          <div className="list">
            {ligadas.map((c) => (
              <div className="li" key={c.id} style={{ gap: 16 }}>
                <BankBadge bancoKey={c.banco} />
                <div className="li-main">
                  <div className="li-title">{c.nome}</div>
                  <div className="li-sub">{c.sincronizadoEm ? `Sincronizado a ${BM.fmtData(c.sincronizadoEm)}` : `Ligado a ${BM.fmtData(c.ligadoEm)} · ainda sem sincronização`}</div>
                </div>
                <div style={{ textAlign: "right", marginRight: 6 }}>
                  <div className="tnum" style={{ fontWeight: 700, fontSize: 16 }}>{BM.eur(c.saldo)}</div>
                  <div className="tiny muted" style={{ fontWeight: 600 }}>{c.moeda}</div>
                </div>
                <button className="btn btn-soft" style={{ padding: "8px 12px" }} onClick={() => open("sync", c)}><Icon name="sync" size={15} /> Sincronizar</button>
                <button className="icon-btn" style={{ width: 36, height: 36 }} title="Desligar" onClick={() => { if (confirm(`Desligar a conta ${c.nome}? Os movimentos já importados mantêm-se.`)) fin.disconnectBank(c.id); }}><Icon name="trash" size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {disponiveis.length > 0 && (
        <div>
          <div className="section-title" style={{ marginBottom: 12 }}>Ligar uma app</div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
            {disponiveis.map((k) => {
              const b = BM.bancos[k];
              return (
                <div className="card card-pad row" key={k} style={{ gap: 16, justifyContent: "space-between" }}>
                  <div className="row" style={{ gap: 14 }}>
                    <BankBadge bancoKey={k} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{b.nome}</div>
                      <div className="tiny muted" style={{ fontWeight: 600, marginTop: 2 }}>{b.desc}</div>
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={() => fin.connectBank(k)}><Icon name="link" size={15} color="#fff" /> Ligar</button>
                </div>
              );
            })}
          </div>
          <div className="alert ok" style={{ marginTop: 16 }}>
            <span className="alert-ico"><Icon name="info" size={18} color="var(--accent)" /></span>
            <div><div style={{ fontWeight: 700, fontSize: 13.5 }}>Demonstração</div>
              <div className="tiny muted" style={{ marginTop: 3, fontWeight: 600, lineHeight: 1.5 }}>A ligação é simulada para o protótipo. Numa versão real, abriria o ecrã seguro de autorização (Open Banking) da Revolut ou da Wise.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Contas, BankBadge });