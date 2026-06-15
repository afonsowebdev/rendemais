/* ===== Screens (parte 1): Auth, Dashboard, Despesas, Rendimentos ===== */

/* ---------- AUTH: criar conta / iniciar sessão ---------- */
function Auth({ initialMode, onBack }) {
  const fin = useFinance();
  const [mode, setMode] = React.useState(initialMode || (fin.account ? "login" : "signup"));
  const [f, setF] = React.useState({ nome: "", email: "", password: "", password2: "", code: "", idade: "", cidade: "", perfil: "Estudante", estado: "Solteiro(a)", habitacao: "Vive com colegas", moeda: "EUR" });
  const [err, setErr] = React.useState("");
  const [okMsg, setOkMsg] = React.useState("");
  const [sentCode, setSentCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const goMode = (m) => { setErr(""); setOkMsg(""); setMode(m); };

  const doSignup = async () => {
    if (!f.nome.trim() || !f.email.trim() || f.password.length < 4) { setErr("Preenche nome, email e uma palavra-passe (mín. 4 caracteres)."); return; }
    setErr("");
    try {
      await fin.signup({ nome: f.nome, email: f.email, password: f.password, idade: f.idade, cidade: f.cidade, perfil: f.perfil, estado: f.estado, habitacao: f.habitacao, moeda: f.moeda });
    } catch (e) { setErr(e.message || "Não foi possível criar a conta."); }
  };
  const doLogin = async () => {
    setErr("");
    try { await fin.login(f.email, f.password); }
    catch (e) { setErr(e.message || "Email ou palavra-passe incorretos."); }
  };
  const doForgot = () => {
    if (!f.email.trim()) return setErr("Indica o email da tua conta.");
    if (!fin.emailExists(f.email)) return setErr("Não encontrámos nenhuma conta com esse email.");
    setSentCode(fin.genResetCode());
    setErr(""); setOkMsg(""); setMode("reset");
  };
  const doReset = () => {
    if (f.code.trim() !== sentCode) return setErr("Código incorreto. Confirma o código enviado para o email.");
    if ((f.password || "").length < 4) return setErr("A nova palavra-passe deve ter pelo menos 4 caracteres.");
    if (f.password !== f.password2) return setErr("As palavras-passe não coincidem.");
    fin.resetPassword(f.password);
    setF((s) => ({ ...s, password: "", password2: "", code: "" }));
    setErr(""); setOkMsg("Palavra-passe alterada com sucesso. Já podes iniciar sessão."); setMode("login");
  };
  const primaryAction = mode === "signup" ? doSignup : mode === "login" ? doLogin : mode === "forgot" ? doForgot : doReset;
  const titles = {
    signup: ["Criar conta gratuita", "Em segundos. Os teus dados ficam guardados em segurança."],
    login: ["Bem-vindo de volta", "Inicia sessão para continuar."],
    forgot: ["Recuperar acesso", "Indica o email da tua conta para receberes um código de recuperação."],
    reset: ["Definir nova senha", `Enviámos um código para ${f.email || "o teu email"}.`],
  };
  const primaryLabel = { signup: "Criar conta e começar", login: "Entrar", forgot: "Enviar código", reset: "Definir nova senha" }[mode];
  const loadingLabel = { signup: "A criar conta…", login: "A entrar…", forgot: "A enviar…", reset: "A guardar…" }[mode];
  const runPrimary = async () => {
    if (busy) return;
    setBusy(true);
    try { await primaryAction(); }
    finally { setBusy(false); }
  };

  return (
    <div className="login-wrap">
      <div className="login-hero">
        <Brand nameColor="#fff" onClick={onBack} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 470, position: "relative", zIndex: 1 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start", padding: "6px 13px", borderRadius: 999, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.16)", fontSize: 12.5, fontWeight: 700, marginBottom: 22 }}>
            <Icon name="spark" size={14} color="var(--accent)" /> Finanças pessoais, sem complicações
          </span>
          <h2 style={{ fontSize: 40, lineHeight: 1.07, fontWeight: 800, letterSpacing: "-.035em", margin: "0 0 16px", textWrap: "balance" }}>
            Controla o teu dinheiro <span style={{ color: "var(--accent)" }}>de forma simples.</span>
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, opacity: .82, fontWeight: 500, margin: "0 0 28px", maxWidth: "33em" }}>
            Rendimentos, despesas e poupança num só lugar. Vê os números e os gráficos a atualizarem-se a cada movimento.
          </p>
          <div style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.13)", borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 13 }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, opacity: .6 }}>Saldo disponível</div>
                <div className="tnum" style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.03em", marginTop: 3 }}>{BM.eur0(1525)}</div>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 700, color: "var(--accent)" }}><Icon name="arrowUp" size={13} color="var(--accent)" /> +12%</span>
            </div>
            <div className="bar" style={{ background: "rgba(255,255,255,.12)" }}><i style={{ width: "67%", background: "var(--accent)" }} /></div>
            <div className="row" style={{ gap: 18 }}>
              <span className="row" style={{ gap: 7, fontSize: 12.5, fontWeight: 600, opacity: .85 }}><span className="dot" style={{ background: "var(--accent)" }} /> Recebido {BM.eur0(960)}</span>
              <span className="row" style={{ gap: 7, fontSize: 12.5, fontWeight: 600, opacity: .85 }}><span className="dot" style={{ background: "var(--c-transporte)" }} /> Gasto {BM.eur0(643)}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 24 }}>
            {[["wallet", "Despesas fixas e variáveis organizadas"], ["target", "Várias poupanças e metas separadas"], ["coins", "Funciona em 6 moedas"]].map(([ic, t]) => (
              <div key={t} className="row" style={{ gap: 12 }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,.1)", display: "grid", placeItems: "center", flex: "none" }}><Icon name={ic} size={16} color="var(--accent)" /></span>
                <span style={{ fontSize: 14, fontWeight: 600, opacity: .9 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, fontWeight: 600, opacity: .72, marginTop: 8 }}>
          <Icon name="check" size={15} color="var(--accent)" /> Os teus dados ficam guardados no teu dispositivo.
        </div>
      </div>

      <div className="login-form">
        <div className="login-card">
          <div className="login-form-brand"><Brand /></div>
          {onBack && <button onClick={onBack} className="login-back" style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--ink-2)", fontWeight: 700, font: "inherit", fontSize: 12.5, cursor: "pointer", padding: "7px 12px", borderRadius: "var(--radius-pill)", marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 6 }}>← Voltar ao início</button>}
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.02em", margin: "0 0 6px" }}>{titles[mode][0]}</h2>
          <p className="muted" style={{ margin: "0 0 24px", fontSize: 14, fontWeight: 500 }}>{titles[mode][1]}</p>

          {okMsg && <div className="alert ok" style={{ marginBottom: 16, padding: "10px 12px" }}><Icon name="check" size={16} color="var(--accent)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{okMsg}</span></div>}

          {mode === "signup" && (
            <>
              <Field label="Nome"><input className="input" value={f.nome} onChange={set("nome")} placeholder="O teu nome" /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Idade"><input className="input" type="number" value={f.idade} onChange={set("idade")} placeholder="21" /></Field>
                <Field label="Cidade"><input className="input" value={f.cidade} onChange={set("cidade")} placeholder="Coimbra" /></Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Situação"><select className="select" value={f.perfil} onChange={set("perfil")}>{["Estudante", "Trabalhador", "Estudante e Trabalhador"].map((o) => <option key={o}>{o}</option>)}</select></Field>
                <Field label="Estado civil"><select className="select" value={f.estado} onChange={set("estado")}>{["Solteiro(a)", "Casado(a)"].map((o) => <option key={o}>{o}</option>)}</select></Field>
              </div>
              <Field label="Moeda" hint="Usada em todos os valores da aplicação.">
                <select className="select" value={f.moeda} onChange={set("moeda")}>
                  {Object.values(BM.currencies).map((c) => <option key={c.code} value={c.code}>{c.sym} ({c.code})</option>)}
                </select>
              </Field>
            </>
          )}

          {(mode === "signup" || mode === "login" || mode === "forgot") && (
            <Field label="Email"><input className="input" value={f.email} onChange={set("email")} placeholder="nome@email.pt" /></Field>
          )}

          {(mode === "signup" || mode === "login") && (
            <Field label="Palavra-passe"><input className="input" type="password" value={f.password} onChange={set("password")} placeholder="••••••••" /></Field>
          )}

          {mode === "login" && (
            <div style={{ textAlign: "right", marginTop: -6, marginBottom: 8 }}>
              <button onClick={() => goMode("forgot")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", fontSize: 12.5, cursor: "pointer", padding: 0 }}>Esqueci-me da senha?</button>
            </div>
          )}

          {mode === "reset" && (
            <>
              <div className="alert ok" style={{ marginBottom: 14, padding: "10px 12px" }}>
                <Icon name="info" size={16} color="var(--accent)" />
                <span style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.5 }}>Código de recuperação (demo): <span className="tnum" style={{ letterSpacing: ".12em", fontSize: 14 }}>{sentCode}</span></span>
              </div>
              <Field label="Código de recuperação"><input className="input tnum" value={f.code} onChange={set("code")} placeholder="123456" inputMode="numeric" maxLength={6} /></Field>
              <Field label="Nova palavra-passe"><input className="input" type="password" value={f.password} onChange={set("password")} placeholder="••••••••" /></Field>
              <Field label="Confirmar palavra-passe"><input className="input" type="password" value={f.password2} onChange={set("password2")} placeholder="••••••••" /></Field>
            </>
          )}

          {err && <div className="alert bad" style={{ marginBottom: 12, padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}

          <style>{`@keyframes rmaisSpin{to{transform:rotate(360deg)}}`}</style>
          <button className="btn btn-primary" disabled={busy} style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: 15, marginTop: 4, opacity: busy ? 0.8 : 1, cursor: busy ? "wait" : "pointer" }} onClick={runPrimary}>
            {busy && <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.45)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", marginRight: 8, animation: "rmaisSpin .6s linear infinite", verticalAlign: "-2px" }} />}
            {busy ? loadingLabel : primaryLabel}
          </button>
          {busy && (mode === "login" || mode === "signup") && <p className="muted tiny" style={{ textAlign: "center", marginTop: 10, fontWeight: 600 }}>A ligar ao servidor… na primeira vez pode demorar alguns segundos.</p>}

          <p className="muted tiny" style={{ textAlign: "center", marginTop: 18, fontWeight: 600 }}>
            {mode === "signup" && <>Já tens conta? <button onClick={() => goMode("login")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 800, font: "inherit", cursor: "pointer", padding: 0 }}>Iniciar sessão</button></>}
            {mode === "login" && <>Ainda não tens conta? <button onClick={() => goMode("signup")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 800, font: "inherit", cursor: "pointer", padding: 0 }}>Criar conta</button></>}
            {(mode === "forgot" || mode === "reset") && <button onClick={() => goMode("login")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 800, font: "inherit", cursor: "pointer", padding: 0 }}>← Voltar a iniciar sessão</button>}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- DASHBOARD ---------- */
function Dashboard({ go, open }) {
  const fin = useFinance();
  const hasData = fin.despMes.length > 0 || fin.rendMes.length > 0;
  const orc = fin.data.orcamento;
  const pctGasto = orc ? Math.round((fin.totalGasto / orc) * 100) : null;
  const recent = [...fin.despMes].sort((a, b) => (b.data || "").localeCompare(a.data || "")).slice(0, 6);
  const recSpark = fin.series.map((m) => m.rec);
  const gastoSpark = fin.series.map((m) => m.gasto);
  const taxaPoup = fin.totalRec > 0 ? Math.round((fin.saldo / fin.totalRec) * 100) : 0;

  if (!hasData) {
    return (
      <div className="content">
        <EmptyState icon="bolt" title={`Vamos começar, ${(fin.account?.nome || "").split(" ")[0] || "olá"}!`}
          msg={`Ainda não há movimentos em ${fin.monthLabel}. Começa por adicionar um rendimento ou uma despesa — os gráficos preenchem-se sozinhos a cada movimento.`}
          action={
            <div className="row" style={{ gap: 10 }}>
              <button className="btn btn-primary" onClick={() => open("rendimento")}><Icon name="arrowsDown" size={16} color="#fff" /> Adicionar rendimento</button>
              <button className="btn btn-ghost" onClick={() => open("despesa")}><Icon name="wallet" size={16} /> Adicionar despesa</button>
            </div>
          } />
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[["arrowsDown", "1. Regista o que recebes", "Salário, bolsa, ajuda dos pais, subsídios…"],
            ["wallet", "2. Adiciona despesas", "Marca cada uma como fixa ou variável."],
            ["chart", "3. Vê os gráficos", "Tudo se atualiza automaticamente a cada movimento."]].map(([ic, t, d]) => (
            <div className="card card-pad" key={t}>
              <div className="kpi-ico" style={{ background: "var(--accent-soft)", marginBottom: 12 }}><Icon name={ic} size={19} color="var(--accent)" /></div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{t}</div>
              <div className="tiny muted" style={{ marginTop: 5, fontWeight: 600, lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const alerts = [];
  if (pctGasto != null && pctGasto >= 80) alerts.push(["warn", "bell", `Já usaste ${pctGasto}% do orçamento`, `Faltam ${BM.eur(Math.max(0, orc - fin.totalGasto))} para o limite de ${BM.eur0(orc)}.`]);
  if (fin.saldo < 0) alerts.push(["bad", "info", "Saldo negativo este mês", `Gastaste ${BM.eur(-fin.saldo)} a mais do que recebeste.`]);
  else if (taxaPoup >= 10) alerts.push(["ok", "target", `Estás a poupar ${taxaPoup}% do que recebes`, "Bom trabalho — continua assim!"]);
  const nearMeta = fin.data.metas.find((m) => m.atual / m.alvo >= 0.7 && m.atual < m.alvo);
  if (nearMeta) alerts.push(["ok", "target", `Estás perto da meta "${nearMeta.nome}"`, `Faltam ${BM.eur0(nearMeta.alvo - nearMeta.atual)}.`]);

  return (
    <div className="content">
      {alerts.length > 0 && (
        <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(3, alerts.length)},1fr)` }}>
          {alerts.slice(0, 3).map((a, i) => <Alert key={i} kind={a[0]} icon={a[1]} title={a[2]}>{a[3]}</Alert>)}
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <Kpi label="Total recebido" value={BM.eur0(fin.totalRec)} icon="arrowsDown" color="var(--accent)" spark={recSpark} />
        <Kpi label="Total gasto" value={BM.eur0(fin.totalGasto)} icon="wallet" color="var(--c-transporte)" spark={gastoSpark} />
        <Kpi label="Saldo disponível" value={BM.eur0(fin.disponivel)} icon="bolt" color={fin.disponivel < 0 ? "var(--neg)" : "var(--c-habitacao)"} sub={fin.poupancaSeparada > 0 ? `Após ${BM.eur0(fin.poupancaSeparada)} p/ poupança` : "Até ao fim do mês"} />
        <Kpi label="Total poupado" value={BM.eur0(fin.poupado)} icon="target" color="var(--c-educacao)" sub={`${fin.data.metas.length} ${fin.data.metas.length === 1 ? "meta ativa" : "metas ativas"}`} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <div className="card card-pad">
          <div className="section-head" style={{ marginBottom: 14 }}>
            <div><div className="section-title">Evolução mensal</div><div className="tiny muted" style={{ fontWeight: 600, marginTop: 2 }}>Recebido vs. gasto · últimos 6 meses</div></div>
            <div className="row tiny" style={{ fontWeight: 700 }}>
              <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: "var(--accent)" }} /> Recebido</span>
              <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: "var(--c-transporte)" }} /> Gasto</span>
            </div>
          </div>
          <LineChart data={fin.series} height={216} />
        </div>
        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 14 }}>Gastos por categoria</div>
          {fin.catBreak.length === 0 ? (
            <div style={{ display: "grid", placeItems: "center", height: 200, textAlign: "center" }} className="muted tiny">
              <div><Icon name="cart" size={26} color="var(--ink-3)" /><div style={{ marginTop: 8, fontWeight: 600 }}>Sem despesas este mês</div></div>
            </div>
          ) : (
            <div className="row" style={{ gap: 20, alignItems: "center" }}>
              <DonutChart data={fin.catBreak} center={<div><div className="tnum" style={{ fontSize: 21, fontWeight: 800 }}>{BM.eur0(fin.totalGasto)}</div><div className="tiny muted" style={{ fontWeight: 600 }}>gasto</div></div>} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                {fin.catBreak.slice(0, 6).map((c) => (
                  <div key={c.key} className="row" style={{ justifyContent: "space-between" }}>
                    <span className="row" style={{ gap: 8, fontSize: 13, fontWeight: 600 }}><span className="dot" style={{ background: c.color }} />{c.nome}</span>
                    <span className="tnum" style={{ fontWeight: 700, fontSize: 13 }}>{BM.eur0(c.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <div className="card card-pad">
          <div className="section-head" style={{ marginBottom: 6 }}>
            <div className="section-title">Movimentos recentes</div>
            <button className="btn btn-soft" style={{ padding: "7px 12px" }} onClick={() => go("despesas")}>Ver todos <Icon name="chevR" size={14} /></button>
          </div>
          {recent.length === 0 ? <div className="muted tiny" style={{ padding: "24px 0", fontWeight: 600 }}>Sem despesas este mês.</div> : (
            <div className="list">
              {recent.map((d) => (
                <div className="li" key={d.id}>
                  <CatBadge catKey={d.cat} />
                  <div className="li-main">
                    <div className="li-title">{d.nome}</div>
                    <div className="li-sub">{(BM.cats[d.cat] || BM.cats.outros).nome} · {BM.fmtData(d.data)} · {d.tipo === "fixa" ? "Fixa" : "Variável"}</div>
                  </div>
                  <div className="li-amt tnum" style={{ color: "var(--neg)" }}>−{BM.eur(d.valor)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="section-head"><div className="section-title">Orçamento do mês</div>
            <button className="btn btn-soft" style={{ padding: "5px 10px" }} onClick={() => open("orcamento")}><Icon name="edit" size={13} /> Definir</button>
          </div>
          {orc ? (
            <div>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 9 }}>
                <span className="tnum" style={{ fontWeight: 800, fontSize: 18 }}>{BM.eur0(fin.totalGasto)}</span>
                <span className="muted tiny" style={{ fontWeight: 700 }}>de {BM.eur0(orc)}</span>
              </div>
              <Progress value={fin.totalGasto} max={orc} color={pctGasto > 80 ? "var(--warn)" : "var(--accent)"} />
              <div className="tiny muted" style={{ marginTop: 9, fontWeight: 600 }}>Restam {BM.eur(Math.max(0, orc - fin.totalGasto))} · {pctGasto}% utilizado</div>
            </div>
          ) : <div className="muted tiny" style={{ fontWeight: 600 }}>Define um orçamento mensal para acompanhares os teus limites.</div>}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 13 }}>
            <div className="tiny" style={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink-3)" }}>Metas</div>
            {fin.data.metas.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600 }}>Sem metas. <button onClick={() => go("poupanca")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 800, cursor: "pointer", padding: 0, font: "inherit" }}>Criar a primeira →</button></div> :
              fin.data.metas.map((m) => (
                <div key={m.id}>
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{m.nome}</span>
                    <span className="tnum tiny muted" style={{ fontWeight: 700 }}>{BM.eur0(m.atual)} / {BM.eur0(m.alvo)}</span>
                  </div>
                  <Progress value={m.atual} max={m.alvo} color={m.cor} />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- DESPESAS ---------- */
function Despesas({ open }) {
  const fin = useFinance();
  const [tipo, setTipo] = React.useState("todas");
  const [cat, setCat] = React.useState("todas");
  const catKeys = Object.keys(BM.cats);
  let rows = fin.despMes.filter((d) => (tipo === "todas" || d.tipo === tipo) && (cat === "todas" || d.cat === cat));
  rows = [...rows].sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const total = rows.reduce((s, d) => s + (+d.valor || 0), 0);

  return (
    <div className="content">
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Kpi label="Total de despesas" value={BM.eur0(fin.totalGasto)} icon="wallet" color="var(--c-transporte)" sub={`${fin.despMes.length} ${fin.despMes.length === 1 ? "movimento" : "movimentos"} este mês`} />
        <Kpi label="Despesas fixas" value={BM.eur0(fin.fixas)} icon="home" color="var(--c-habitacao)" sub="Renda, contas, propina…" />
        <Kpi label="Despesas variáveis" value={BM.eur0(fin.variaveis)} icon="cart" color="var(--c-alimentacao)" sub="Alimentação, lazer, saúde…" />
      </div>

      {fin.despMes.length === 0 ? (
        <EmptyState icon="wallet" title="Ainda não há despesas este mês"
          msg="Adiciona a tua primeira despesa e escolhe se é fixa (todos os meses) ou variável (pontual). O gráfico desenha-se automaticamente."
          action={<button className="btn btn-primary" onClick={() => open("despesa")}><Icon name="plus" size={16} color="#fff" /> Adicionar despesa</button>} />
      ) : (
        <div className="card">
          <div className="card-pad" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderBottom: "1px solid var(--border)" }}>
            <div className="seg">
              {["todas", "fixa", "variavel"].map((t) => (
                <button key={t} className={tipo === t ? "on" : ""} onClick={() => setTipo(t)}>{t === "todas" ? "Todas" : t === "fixa" ? "Fixas" : "Variáveis"}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginLeft: 4 }}>
              <button className={"chip" + (cat === "todas" ? " sel" : "")} onClick={() => setCat("todas")}>Todas</button>
              {catKeys.filter((k) => fin.despMes.some((d) => d.cat === k)).map((k) => (
                <button key={k} className={"chip" + (cat === k ? " sel" : "")} onClick={() => setCat(k)}>
                  <span className="dot" style={{ background: cat === k ? "#fff" : BM.cats[k].color }} />{BM.cats[k].nome}
                </button>
              ))}
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="t">
              <thead><tr><th>Despesa</th><th>Categoria</th><th>Tipo</th><th>Data</th><th style={{ textAlign: "right" }}>Valor</th><th></th></tr></thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td><div className="row" style={{ gap: 12 }}><CatBadge catKey={d.cat} size={36} r={10} /><span style={{ fontWeight: 700 }}>{d.nome}</span></div></td>
                    <td><span className="row" style={{ gap: 7, fontWeight: 600 }}><span className="dot" style={{ background: (BM.cats[d.cat] || BM.cats.outros).color }} />{(BM.cats[d.cat] || BM.cats.outros).nome}</span></td>
                    <td><span className="chip" style={{ padding: "3px 9px" }}>{d.tipo === "fixa" ? "Fixa" : "Variável"}</span></td>
                    <td className="muted">{BM.fmtData(d.data)}</td>
                    <td className="tnum" style={{ textAlign: "right", fontWeight: 800, color: "var(--neg)" }}>−{BM.eur(d.valor)}</td>
                    <td><div className="row" style={{ gap: 4, justifyContent: "flex-end" }}>
                      <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => open("despesa", d)}><Icon name="edit" size={15} /></button>
                      <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => fin.despesa.remove(d.id)}><Icon name="trash" size={15} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-pad row" style={{ justifyContent: "space-between", borderTop: "1px solid var(--border)" }}>
            <span className="muted" style={{ fontWeight: 700, fontSize: 13 }}>{rows.length} {rows.length === 1 ? "resultado" : "resultados"}</span>
            <span style={{ fontWeight: 800 }}>Total: <span className="tnum">{BM.eur(total)}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- PLANO DE POUPANÇA (calculadora com slider 10–50%) ---------- */
function SavingsPlanner({ open }) {
  const fin = useFinance();
  const pct = fin.poupancaPct;
  const receita = fin.totalRec;
  const despesas = fin.totalGasto;
  const restante = fin.saldo;
  const planoTotal = fin.poupancaPlano;
  const jaGuardado = fin.poupadoMes;
  const disponivel = fin.disponivel;
  const semSobra = restante <= 0;
  const falta = Math.max(0, Math.round((planoTotal - jaGuardado) * 100) / 100);

  const Linha = ({ label, valor, sinal, cor, forte, big }) => (
    <div className="row" style={{ justifyContent: "space-between", padding: forte ? "12px 0 0" : "7px 0", borderTop: forte ? "1px solid var(--border)" : "none" }}>
      <span style={{ fontSize: forte ? 14 : 13.5, fontWeight: forte ? 800 : 600, color: forte ? "var(--ink)" : "var(--ink-2)" }}>{label}</span>
      <span className="tnum" style={{ fontWeight: 800, fontSize: big ? 22 : forte ? 16 : 14.5, color: cor || "var(--ink)" }}>{sinal}{BM.eur(Math.abs(valor))}</span>
    </div>
  );

  return (
    <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="section-head" style={{ marginBottom: 6 }}>
        <div>
          <div className="section-title">Plano de poupança</div>
          <div className="tiny muted" style={{ fontWeight: 600, marginTop: 2 }}>Sobre o que sobra ({fin.monthLabel}), decide quanto guardar para ti.</div>
        </div>
        <span className="li-ico" style={{ width: 40, height: 40, background: "var(--accent-soft)" }}><Icon name="target" size={19} color="var(--accent)" sw={2} /></span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "stretch" }}>
        {/* esquerda: decomposição */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Linha label="Receita total" valor={receita} sinal="+" cor="var(--accent)" />
          <Linha label="Total de despesas" valor={despesas} sinal="−" cor="var(--neg)" />
          <Linha label="Restante" valor={restante} sinal={restante < 0 ? "−" : ""} cor={restante < 0 ? "var(--neg)" : "var(--ink)"} forte />
        </div>

        {/* direita: slider + resultado */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: 18 }}>
          {semSobra ? (
            <div className="muted" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.55, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Icon name="info" size={18} color="var(--warn)" />
              <span>Este mês não sobra nada para poupar — as despesas já igualam ou superam a receita. Reduz despesas ou regista mais rendimentos.</span>
            </div>
          ) : (
            <>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)" }}>Percentagem a poupar</span>
                <span className="tnum" style={{ fontSize: 26, fontWeight: 800, color: "var(--accent)" }}>{pct}%</span>
              </div>
              <input type="range" min="10" max="50" step="5" value={pct} onChange={(e) => fin.setPoupancaPct(+e.target.value)} className="range" />
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="tiny muted" style={{ fontWeight: 700 }}>10%</span>
                <span className="tiny muted" style={{ fontWeight: 700 }}>50%</span>
              </div>
              <Linha label={`Poupança (${pct}% do restante)`} valor={planoTotal} sinal="−" cor="var(--c-educacao)" forte />
              {jaGuardado > 0 && <Linha label="Já guardado este mês" valor={jaGuardado} sinal="✓ " cor="var(--accent)" />}
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginTop: 2, padding: "12px 14px", background: "var(--accent-soft)", borderRadius: "var(--radius-sm)" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>Disponível</div>
                  <div className="tiny muted" style={{ fontWeight: 600 }}>para gastares este mês</div>
                </div>
                <span className="tnum" style={{ fontWeight: 800, fontSize: 24, color: "var(--accent-ink)" }}>{BM.eur(disponivel)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {!semSobra && (
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 8, gap: 10, alignItems: "center" }}>
          {falta > 0
            ? <button className="btn btn-primary" onClick={() => open("reservar", { amount: falta })}><Icon name="target" size={15} color="#fff" /> Guardar {BM.eur0(falta)} na poupança</button>
            : <span className="row tiny" style={{ fontWeight: 700, color: "var(--accent)", gap: 6 }}><Icon name="check" size={15} color="var(--accent)" /> Já separaste a poupança deste mês</span>}
        </div>
      )}
    </div>
  );
}

/* ---------- RENDIMENTOS ---------- */
function Rendimentos({ open }) {
  const fin = useFinance();
  const rec = fin.rendMes.filter((r) => r.rec).reduce((s, r) => s + (+r.valor || 0), 0);
  const extra = fin.totalRec - rec;
  const rows = [...fin.rendMes].sort((a, b) => (b.data || "").localeCompare(a.data || ""));

  return (
    <div className="content">
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Kpi label="Rendimento do mês" value={BM.eur0(fin.totalRec)} icon="arrowsDown" color="var(--accent)" sub={`${fin.rendMes.length} ${fin.rendMes.length === 1 ? "fonte" : "fontes"}`} />
        <Kpi label="Recorrente" value={BM.eur0(rec)} icon="cal" color="var(--c-habitacao)" sub="Todos os meses" />
        <Kpi label="Extra / pontual" value={BM.eur0(extra)} icon="spark" color="var(--c-educacao)" sub="Freelance, prendas…" />
      </div>

      {fin.rendMes.length === 0 ? (
        <EmptyState icon="arrowsDown" title="Ainda não registaste rendimentos"
          msg="Adiciona tudo o que recebes este mês: salário, bolsa, ajuda dos pais, subsídios ou apoios do Estado."
          action={<button className="btn btn-primary" onClick={() => open("rendimento")}><Icon name="plus" size={16} color="#fff" /> Adicionar rendimento</button>} />
      ) : (
        <>
        <SavingsPlanner open={open} />
        <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
          <div className="card card-pad">
            <div className="section-title" style={{ marginBottom: 6 }}>Rendimentos deste mês</div>
            <div className="list">
              {rows.map((r) => (
                <div className="li" key={r.id}>
                  <div className="li-ico" style={{ background: "var(--accent-soft)" }}><Icon name="arrowsDown" size={18} color="var(--accent)" sw={2} /></div>
                  <div className="li-main">
                    <div className="li-title">{r.fonte}</div>
                    <div className="li-sub">{r.cat} · {BM.fmtData(r.data)} · {r.rec ? "recorrente" : "pontual"}</div>
                  </div>
                  <div className="li-amt tnum" style={{ color: "var(--accent)" }}>+{BM.eur(r.valor)}</div>
                  <div className="row" style={{ gap: 4 }}>
                    <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => open("rendimento", r)}><Icon name="edit" size={15} /></button>
                    <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => fin.rendimento.remove(r.id)}><Icon name="trash" size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card card-pad">
            <div className="section-title" style={{ marginBottom: 14 }}>Origem dos rendimentos</div>
            <div className="row" style={{ gap: 20 }}>
              <DonutChart data={fin.incBreak} center={<div><div className="tnum" style={{ fontSize: 20, fontWeight: 800 }}>{BM.eur0(fin.totalRec)}</div><div className="tiny muted" style={{ fontWeight: 600 }}>/ mês</div></div>} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {fin.incBreak.map((c) => (
                  <div key={c.key} className="row" style={{ justifyContent: "space-between" }}>
                    <span className="row" style={{ gap: 8, fontSize: 13, fontWeight: 600 }}><span className="dot" style={{ background: c.color }} />{c.nome}</span>
                    <span className="tnum" style={{ fontWeight: 700, fontSize: 13 }}>{BM.eur0(c.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { Auth, Dashboard, Despesas, Rendimentos, SavingsPlanner });