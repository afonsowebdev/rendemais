/* ===== Finance store: auth + dados via API (backend) + seletores derivados ===== */
const FinanceContext = React.createContext(null);
const useFinance = () => React.useContext(FinanceContext);

const LS = { acc: "bm_account" }; // só uma cache local da conta (para pré-preencher o login)
const load = (k, fb) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : fb; } catch { return fb; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const EMPTY_DATA = { despesas: [], rendimentos: [], metas: [], orcamento: null, contas: [], poupancaPct: 20, customCats: [], aforros: [] };
// paleta de cores das metas (o backend não guarda a cor; mantemo-la de forma estável aqui)
const PALETA = ["var(--c-educacao)", "var(--c-alimentacao)", "var(--c-habitacao)", "var(--c-transporte)", "var(--c-lazer)", "var(--c-internet)"];
const mkeyLocal = (dt) => dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0");

// mostra um erro de forma simples (pode-se trocar por algo mais bonito no futuro)
const erroAlerta = (e) => { console.error(e); try { alert("Rende+: " + (e && e.message ? e.message : "ocorreu um erro.")); } catch (_) {} };

function FinanceProvider({ children }) {
  const [account, setAccount] = React.useState(() => load(LS.acc, null));
  const [session, setSession] = React.useState(null); // só fica preenchido depois de validar o token
  const [data, setData] = React.useState(() => ({ ...EMPTY_DATA }));
  const [month, setMonth] = React.useState(() => BM.todayISO().slice(0, 7));
  const pctTimer = React.useRef(null); // debounce para gravar a % de poupança

  // guarda a conta em cache local (para o ecrã de login pré-preencher)
  React.useEffect(() => { if (account) save(LS.acc, account); }, [account]);

  // moeda ativa: só aplica a da conta depois de iniciar sessão; senão Euro por defeito
  BM.setCurrency((session && account && account.moeda) || "EUR");
  // regista as categorias personalizadas no catálogo partilhado
  (data.customCats || []).forEach((c) => { BM.cats[c.key] = { nome: c.nome, color: c.color, icon: c.icon, custom: true }; });

  // ---- carregar todos os dados do utilizador a partir da API ----
  const carregarTudo = async () => {
    const [perfil, despesas, rendimentos, metasRaw, contas, categorias] = await Promise.all([
      API.perfil(),
      API.listar("despesas"),
      API.listar("rendimentos"),
      API.listar("metas"),
      API.listar("contas"),
      API.listar("categorias"),
    ]);
    const aforros = [];
    const metas = (metasRaw || []).map((m, i) => {
      (m.aforros || []).forEach((a) => aforros.push({ id: a.id, metaId: m.id, valor: a.valor, data: a.data }));
      const { aforros: _omit, ...rest } = m;
      return { ...rest, cor: PALETA[i % PALETA.length] };
    });
    const customCats = (categorias || []).map((c) => ({ key: c.id, nome: c.nome, color: c.cor, icon: c.icon }));
    customCats.forEach((c) => { BM.cats[c.key] = { nome: c.nome, color: c.color, icon: c.icon, custom: true }; });

    setData({ ...EMPTY_DATA, despesas, rendimentos, metas, aforros, contas, customCats,
      orcamento: perfil.orcamento || null, poupancaPct: perfil.poupancaPct ?? 20 });
    setAccount((a) => ({ ...(a || {}), email: perfil.email, nome: perfil.nome, moeda: perfil.moeda, poupancaPct: perfil.poupancaPct, orcamento: perfil.orcamento }));
    setSession(perfil.email || true);
  };

  // ao abrir a app: se houver token guardado, tenta carregar a sessão
  React.useEffect(() => {
    if (API.getToken()) {
      carregarTudo().catch((e) => { console.error(e); API.setToken(null); setSession(null); });
    }
  }, []);

  // ---- auth ----
  const signup = async (info) => {
    const resp = await API.registar({ email: info.email, password: info.password, nome: info.nome, moeda: info.moeda });
    API.setToken(resp.token);
    const extra = { idade: info.idade, cidade: info.cidade, pais: info.pais, perfil: info.perfil, estado: info.estado, habitacao: info.habitacao };
    setAccount((a) => ({ ...(a || {}), ...(resp.user || {}), ...extra }));
    await carregarTudo();
  };
  const login = async (email, pass) => {
    const resp = await API.login({ email, password: pass });
    API.setToken(resp.token);
    setAccount((a) => ({ ...(a || {}), ...(resp.user || {}) }));
    await carregarTudo();
  };
  const logout = () => { API.setToken(null); setSession(null); setData({ ...EMPTY_DATA }); };

  // campos do perfil que o servidor guarda
  const camposServidor = ["nome", "moeda", "poupancaPct", "orcamento"];
  const updateAccount = (patch) => {
    setAccount((a) => ({ ...(a || {}), ...patch }));
    const servidor = {};
    camposServidor.forEach((k) => { if (patch[k] !== undefined) servidor[k] = patch[k]; });
    if (Object.keys(servidor).length && API.getToken()) {
      API.atualizarPerfil(servidor).catch((e) => console.error(e));
    }
  };
  const resetData = async () => {
    try {
      const apaga = (rec, arr) => Promise.all((arr || []).map((x) => API.apagar(rec, x.id).catch(() => {})));
      await Promise.all([
        apaga("despesas", data.despesas),
        apaga("rendimentos", data.rendimentos),
        apaga("metas", data.metas),
        apaga("contas", data.contas),
        apaga("categorias", (data.customCats || []).map((c) => ({ id: c.key }))),
      ]);
      setData({ ...EMPTY_DATA });
    } catch (e) { erroAlerta(e); }
  };

  // ---- recuperação de senha (demo; ainda não ligada ao backend) ----
  const emailExists = () => true;
  const genResetCode = () => String(Math.floor(100000 + Math.random() * 900000));
  const resetPassword = () => {};

  // ---- CRUD genérico (cria/edita/apaga no servidor e atualiza o estado local) ----
  const crud = (key, recurso, paraApi, daApi) => ({
    add: async (item) => {
      try {
        const criado = await API.criar(recurso, paraApi ? paraApi(item) : item);
        const local = daApi ? daApi(criado) : criado;
        setData((d) => ({ ...d, [key]: [...d[key], local] }));
        return local;
      } catch (e) { erroAlerta(e); }
    },
    edit: async (id, patch) => {
      try {
        const at = await API.editar(recurso, id, paraApi ? paraApi(patch) : patch);
        const local = daApi ? daApi(at) : at;
        setData((d) => ({ ...d, [key]: d[key].map((x) => (x.id === id ? { ...x, ...local } : x)) }));
      } catch (e) { erroAlerta(e); }
    },
    remove: async (id) => {
      try {
        await API.apagar(recurso, id);
        setData((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== id) }));
      } catch (e) { erroAlerta(e); }
    },
  });
  const despesa = crud("despesas", "despesas");
  const rendimento = crud("rendimentos", "rendimentos");
  const conta = crud("contas", "contas");

  // metas (poupanças): criar com saldo inicial regista um depósito datado
  const meta = {
    edit: async (id, patch) => {
      try {
        const m = await API.editar("metas", id, patch);
        setData((d) => ({ ...d, metas: d.metas.map((x) => (x.id === id ? { ...x, ...m, cor: patch.cor !== undefined ? patch.cor : x.cor } : x)) }));
      } catch (e) { erroAlerta(e); }
    },
    add: async (item) => {
      try {
        const atual = +item.atual || 0;
        const m = await API.criar("metas", { nome: item.nome, alvo: +item.alvo || 0, atual });
        let novoAforro = null;
        if (atual > 0) novoAforro = await API.criar("aforros", { metaId: m.id, valor: atual, data: BM.todayISO() });
        setData((d) => ({
          ...d,
          metas: [...d.metas, { ...m, cor: item.cor || PALETA[d.metas.length % PALETA.length] }],
          aforros: novoAforro ? [...(d.aforros || []), novoAforro] : (d.aforros || []),
        }));
        return m;
      } catch (e) { erroAlerta(e); }
    },
    remove: async (id) => {
      try {
        await API.apagar("metas", id);
        setData((d) => ({ ...d, metas: d.metas.filter((x) => x.id !== id), aforros: (d.aforros || []).filter((a) => a.metaId !== id) }));
      } catch (e) { erroAlerta(e); }
    },
  };
  // depositar numa poupança: soma ao acumulado e regista um movimento datado
  const deposit = async (id, valor) => {
    try {
      const m = (data.metas || []).find((x) => x.id === id);
      const novo = (m ? (+m.atual || 0) : 0) + (+valor || 0);
      const capado = (m && m.alvo > 0) ? Math.min(m.alvo, novo) : novo;
      await API.editar("metas", id, { atual: capado });
      const aforro = await API.criar("aforros", { metaId: id, valor: +valor || 0, data: BM.todayISO() });
      setData((d) => ({
        ...d,
        metas: d.metas.map((x) => (x.id === id ? { ...x, atual: capado } : x)),
        aforros: [...(d.aforros || []), aforro],
      }));
    } catch (e) { erroAlerta(e); }
  };

  const setOrcamento = async (v) => {
    try { await API.atualizarPerfil({ orcamento: v }); setData((d) => ({ ...d, orcamento: v })); setAccount((a) => ({ ...(a || {}), orcamento: v })); }
    catch (e) { erroAlerta(e); }
  };
  const setPoupancaPct = (v) => {
    // atualiza o ecrã já (sem esperar o servidor) — evita o tremor do slider ao arrastar
    setData((d) => ({ ...d, poupancaPct: v }));
    setAccount((a) => ({ ...(a || {}), poupancaPct: v }));
    // grava no servidor só quando o utilizador pára de arrastar (debounce)
    clearTimeout(pctTimer.current);
    pctTimer.current = setTimeout(() => {
      API.atualizarPerfil({ poupancaPct: v }).catch((e) => erroAlerta(e));
    }, 400);
  };

  // categorias de despesa personalizadas
  const addCategory = async ({ nome, color, icon }) => {
    try {
      const c = await API.criar("categorias", { nome, cor: color, icon });
      const key = c.id;
      BM.cats[key] = { nome, color, icon, custom: true };
      setData((d) => ({ ...d, customCats: [...(d.customCats || []), { key, nome, color, icon }] }));
      return key;
    } catch (e) { erroAlerta(e); }
  };
  const removeCategory = async (key) => {
    try {
      await API.apagar("categorias", key);
      delete BM.cats[key];
      setData((d) => ({ ...d, customCats: (d.customCats || []).filter((c) => c.key !== key) }));
    } catch (e) { erroAlerta(e); }
  };

  // ---- contas ligadas (Revolut / Wise) ----
  const connectBank = async (bancoKey) => {
    try {
      const preset = BM.bancos[bancoKey];
      if (!preset) return;
      const c = await API.criar("contas", { banco: bancoKey, nome: preset.nome, saldo: preset.saldoInicial, moeda: preset.moeda, ligadoEm: BM.todayISO() });
      setData((d) => ({ ...d, contas: [...d.contas, c] }));
    } catch (e) { erroAlerta(e); }
  };
  const disconnectBank = async (id) => {
    try { await API.apagar("contas", id); setData((d) => ({ ...d, contas: d.contas.filter((c) => c.id !== id) })); }
    catch (e) { erroAlerta(e); }
  };
  const importMovs = async (id, movs) => {
    try {
      const c = (data.contas || []).find((x) => x.id === id);
      if (!c) return;
      const tag = c.banco;
      const novasDesp = [], novosRend = [];
      for (const m of movs) {
        if (m.kind === "despesa") {
          novasDesp.push(await API.criar("despesas", { nome: m.nome, cat: m.cat, valor: m.valor, data: BM.todayISO(), tipo: m.tipo, origem: tag }));
        } else if (m.kind === "rendimento") {
          novosRend.push(await API.criar("rendimentos", { fonte: m.nome, cat: m.cat, valor: m.valor, data: BM.todayISO(), rec: false, origem: tag }));
        }
      }
      const sinc = await API.editar("contas", id, { sincronizadoEm: BM.todayISO() });
      setData((d) => ({
        ...d,
        despesas: [...d.despesas, ...novasDesp],
        rendimentos: [...d.rendimentos, ...novosRend],
        contas: d.contas.map((x) => (x.id === id ? { ...x, sincronizadoEm: sinc.sincronizadoEm } : x)),
      }));
    } catch (e) { erroAlerta(e); }
  };

  // ---- seletores derivados (recalculam a cada alteração) ----
  const sel = React.useMemo(() => {
    const inMonth = (iso) => BM.monthKey(iso) === month;
    const despMes = data.despesas.filter((x) => inMonth(x.data));
    const rendMes = data.rendimentos.filter((x) => inMonth(x.data));
    const totalGasto = despMes.reduce((s, x) => s + (+x.valor || 0), 0);
    const totalRec = rendMes.reduce((s, x) => s + (+x.valor || 0), 0);
    const fixas = despMes.filter((x) => x.tipo === "fixa").reduce((s, x) => s + (+x.valor || 0), 0);
    const variaveis = totalGasto - fixas;
    const poupado = data.metas.reduce((s, m) => s + (+m.atual || 0), 0);
    const saldo = totalRec - totalGasto;
    const poupancaPct = data.poupancaPct ?? 20;
    const planoTotal = saldo > 0 ? Math.round((poupancaPct / 100) * saldo * 100) / 100 : 0;
    const poupadoMes = (data.aforros || []).filter((a) => BM.monthKey(a.data) === month).reduce((s, a) => s + (+a.valor || 0), 0);
    const poupancaSeparada = Math.max(poupadoMes, planoTotal);
    const poupancaPlano = planoTotal;
    const disponivel = saldo - poupancaSeparada;

    const byCat = {};
    despMes.forEach((x) => { byCat[x.cat] = (byCat[x.cat] || 0) + (+x.valor || 0); });
    const catBreak = Object.keys(byCat)
      .map((k) => ({ key: k, nome: (BM.cats[k] || BM.cats.outros).nome, color: (BM.cats[k] || BM.cats.outros).color, valor: byCat[k] }))
      .sort((a, b) => b.valor - a.valor);

    const byInc = {};
    rendMes.forEach((x) => { byInc[x.cat] = (byInc[x.cat] || 0) + (+x.valor || 0); });
    const incBreak = Object.keys(byInc)
      .map((k) => ({ key: k, nome: k, color: BM.incomeCats[k] || "var(--c-outros)", valor: byInc[k] }))
      .sort((a, b) => b.valor - a.valor);

    const [yy, mm] = month.split("-").map(Number);
    const mkey = (dt) => dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0");
    const series = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(yy, mm - 1 - i, 1);
      const key = mkey(dt);
      const rec = data.rendimentos.filter((x) => BM.monthKey(x.data) === key).reduce((s, x) => s + (+x.valor || 0), 0);
      const gasto = data.despesas.filter((x) => BM.monthKey(x.data) === key).reduce((s, x) => s + (+x.valor || 0), 0);
      series.push({ m: BM.MESES[dt.getMonth()], key, rec, gasto });
    }
    const allKeys = Array.from(new Set([...data.despesas, ...data.rendimentos].map((x) => BM.monthKey(x.data)))).filter(Boolean).sort().reverse();
    const historico = allKeys.map((key) => {
      const [y, m] = key.split("-").map(Number);
      const rec = data.rendimentos.filter((x) => BM.monthKey(x.data) === key).reduce((s, x) => s + (+x.valor || 0), 0);
      const gasto = data.despesas.filter((x) => BM.monthKey(x.data) === key).reduce((s, x) => s + (+x.valor || 0), 0);
      return { key, label: `${BM.MESES[m - 1]} ${y}`, rec, gasto, atual: key === month };
    });

    return { despMes, rendMes, totalGasto, totalRec, fixas, variaveis, poupado, saldo, poupancaPct, poupancaPlano, planoTotal, poupadoMes, poupancaSeparada, disponivel, catBreak, incBreak, series, historico };
  }, [data, month]);

  const monthLabel = (() => { const [y, m] = month.split("-").map(Number); return `${BM.MESES[m - 1]} ${y}`; })();
  const realMonth = BM.todayISO().slice(0, 7);
  const isCurrentMonth = month >= realMonth;
  const shiftMonth = (delta) => {
    const [y, m] = month.split("-").map(Number);
    const key = mkeyLocal(new Date(y, m - 1 + delta, 1));
    if (key > realMonth) return;
    setMonth(key);
  };
  const goToday = () => setMonth(realMonth);

  const bancosTotal = data.contas.reduce((s, c) => s + (+c.saldo || 0), 0);

  const value = {
    account, session, data, month, monthLabel, realMonth, isCurrentMonth,
    signup, login, logout, updateAccount, resetData,
    emailExists, genResetCode, resetPassword,
    cur: BM.curInfo(), curSym: BM.curInfo().sym, setCurrency: (code) => updateAccount({ moeda: code }),
    despesa, rendimento, meta, conta, deposit, setOrcamento, setPoupancaPct, addCategory, removeCategory,
    connectBank, disconnectBank, importMovs, bancosTotal,
    setMonth, shiftMonth, goToday, ...sel,
  };
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

Object.assign(window, { FinanceContext, useFinance, FinanceProvider });
