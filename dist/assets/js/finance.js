const FinanceContext = React.createContext(null);
const useFinance = () => React.useContext(FinanceContext);
const LS = { acc: "bm_account" };
const load = (k, fb) => {
  try {
    const s = localStorage.getItem(k);
    return s ? JSON.parse(s) : fb;
  } catch {
    return fb;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
  }
};
const EMPTY_DATA = { despesas: [], rendimentos: [], metas: [], orcamento: null, contas: [], poupancaPct: 20, customCats: [], aforros: [] };
const PALETA = ["var(--c-educacao)", "var(--c-alimentacao)", "var(--c-habitacao)", "var(--c-transporte)", "var(--c-lazer)", "var(--c-internet)"];
const FECH_KEY = "rende_metas_fechadas";
const lerFechadas = () => {
  try {
    return JSON.parse(localStorage.getItem(FECH_KEY) || "{}");
  } catch (e) {
    return {};
  }
};
const gravarFechadas = (map) => {
  try {
    localStorage.setItem(FECH_KEY, JSON.stringify(map));
  } catch (e) {
  }
};
const ARQ_KEY = "rende_arquivos";
const lerArquivos = () => {
  try {
    return JSON.parse(localStorage.getItem(ARQ_KEY) || "[]");
  } catch (e) {
    return [];
  }
};
const gravarArquivos = (arr) => {
  try {
    localStorage.setItem(ARQ_KEY, JSON.stringify(arr));
  } catch (e) {
  }
};
const mkeyLocal = (dt) => dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0");
const erroAlerta = (e) => {
  console.error(e);
  try {
    alert("Rende+: " + (e && e.message ? e.message : "ocorreu um erro."));
  } catch (_) {
  }
};
function FinanceProvider({ children }) {
  const [account, setAccount] = React.useState(() => load(LS.acc, null));
  const [session, setSession] = React.useState(null);
  const [data, setData] = React.useState(() => ({ ...EMPTY_DATA }));
  const [month, setMonth] = React.useState(() => BM.todayISO().slice(0, 7));
  const pctTimer = React.useRef(null);
  React.useEffect(() => {
    if (account) save(LS.acc, account);
  }, [account]);
  BM.setCurrency(session && account && account.moeda || "EUR");
  (data.customCats || []).forEach((c) => {
    BM.cats[c.key] = { nome: c.nome, color: c.color, icon: c.icon, custom: true };
  });
  const carregarTudo = async () => {
    var _a;
    const [perfil, despesas, rendimentos, metasRaw, contas, categorias] = await Promise.all([
      API.perfil(),
      API.listar("despesas"),
      API.listar("rendimentos"),
      API.listar("metas"),
      API.listar("contas"),
      API.listar("categorias")
    ]);
    const aforros = [];
    const fech = lerFechadas();
    const metas = (metasRaw || []).map((m, i) => {
      (m.aforros || []).forEach((a) => aforros.push({ id: a.id, metaId: m.id, valor: a.valor, data: a.data }));
      const { aforros: _omit, ...rest } = m;
      const fechadaEm = (rest.fechada ? rest.fechadaEm : null) || fech[m.id] || null;
      return { ...rest, cor: PALETA[i % PALETA.length], fechada: !!(rest.fechada || fech[m.id]), fechadaEm };
    });
    const customCats = (categorias || []).map((c) => ({ key: c.id, nome: c.nome, color: c.cor, icon: c.icon }));
    customCats.forEach((c) => {
      BM.cats[c.key] = { nome: c.nome, color: c.color, icon: c.icon, custom: true };
    });
    setData({
      ...EMPTY_DATA,
      despesas,
      rendimentos,
      metas,
      aforros,
      contas,
      customCats,
      orcamento: perfil.orcamento || null,
      poupancaPct: (_a = perfil.poupancaPct) != null ? _a : 20
    });
    setAccount((a) => ({ ...a || {}, email: perfil.email, nome: perfil.nome, moeda: perfil.moeda, poupancaPct: perfil.poupancaPct, orcamento: perfil.orcamento, dataNascimento: perfil.dataNascimento || null, nascimentoBloqueado: !!perfil.nascimentoBloqueado }));
    setSession(perfil.email || true);
  };
  React.useEffect(() => {
    if (API.getToken()) {
      carregarTudo().catch((e) => {
        console.error(e);
        API.setToken(null);
        setSession(null);
      });
    }
  }, []);
  const signup = async (info) => {
    const idade = parseInt(info.idade, 10);
    if (isNaN(idade) || idade < 16) throw new Error("Tens de ter pelo menos 16 anos para criar conta.");
    const nome = (info.nome || "").trim().replace(/\s{2,}/g, " ");
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]+(?: [A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(nome)) throw new Error("O nome s\xF3 pode conter letras.");
    const moedas = Array.isArray(info.moedas) && info.moedas.length ? Array.from(/* @__PURE__ */ new Set([info.moeda, ...info.moedas])) : [info.moeda];
    const resp = await API.registar({ email: info.email, password: info.password, nome, moeda: info.moeda });
    API.setToken(resp.token);
    const extra = { idade: info.idade, cidade: info.cidade, pais: info.pais, perfil: info.perfil, estado: info.estado, habitacao: info.habitacao, moedas };
    setAccount((a) => ({ ...a || {}, ...resp.user || {}, ...extra }));
    await carregarTudo();
  };
  const iniciarRegisto = async (info) => {
    const idade = parseInt(info.idade, 10);
    if (isNaN(idade) || idade < 16) throw new Error("Tens de ter pelo menos 16 anos para criar conta.");
    const nome = (info.nome || "").trim().replace(/\s{2,}/g, " ");
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]+(?: [A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(nome)) throw new Error("O nome s\xF3 pode conter letras.");
    await API.registar({ email: (info.email || "").trim(), nome, moeda: info.moeda });
    return true;
  };
  const verificarEmail = async (email, codigo) => {
    const r = await API.verificarEmail({ email: (email || "").trim(), codigo: (codigo || "").trim() });
    return r.setupToken;
  };
  const definirPassword = async (setupToken, password, info) => {
    const moedas = Array.isArray(info == null ? void 0 : info.moedas) && info.moedas.length ? Array.from(/* @__PURE__ */ new Set([info.moeda, ...info.moedas])) : [info == null ? void 0 : info.moeda].filter(Boolean);
    const resp = await API.definirPassword({ setupToken, password, dataNascimento: (info == null ? void 0 : info.nascimento) || null });
    API.setToken(resp.token);
    const extra = info ? { idade: info.idade, nascimento: info.nascimento, cidade: info.cidade, pais: info.pais, perfil: info.perfil, estado: info.estado, habitacao: info.habitacao, moedas } : {};
    setAccount((a) => ({ ...a || {}, ...resp.user || {}, ...extra }));
    await carregarTudo();
  };
  const reenviarCodigo = async (email) => {
    await API.reenviarCodigo({ email: (email || "").trim() });
    return true;
  };
  const login = async (email, pass) => {
    const resp = await API.login({ email, password: pass });
    API.setToken(resp.token);
    setAccount((a) => ({ ...a || {}, ...resp.user || {} }));
    await carregarTudo();
  };
  const logout = () => {
    API.setToken(null);
    setSession(null);
    setData({ ...EMPTY_DATA });
  };
  const eliminarConta = async () => {
    await API.eliminarConta();
    API.setToken(null);
    setSession(null);
    setData({ ...EMPTY_DATA });
  };
  const camposServidor = ["nome", "moeda", "poupancaPct", "orcamento", "dataNascimento"];
  const updateAccount = (patch) => {
    setAccount((a) => ({ ...a || {}, ...patch }));
    const servidor = {};
    camposServidor.forEach((k) => {
      if (patch[k] !== void 0) servidor[k] = patch[k];
    });
    if (Object.keys(servidor).length && API.getToken()) {
      API.atualizarPerfil(servidor).catch((e) => console.error(e));
    }
  };
  const resetData = async () => {
    try {
      const apaga = (rec, arr) => Promise.all((arr || []).map((x) => API.apagar(rec, x.id).catch(() => {
      })));
      await Promise.all([
        apaga("despesas", data.despesas),
        apaga("rendimentos", data.rendimentos),
        apaga("metas", data.metas),
        apaga("contas", data.contas),
        apaga("categorias", (data.customCats || []).map((c) => ({ id: c.key })))
      ]);
      setData({ ...EMPTY_DATA });
    } catch (e) {
      erroAlerta(e);
    }
  };
  const [arquivos, setArquivos] = React.useState(() => lerArquivos());
  const mudarLocalizacao = async ({ pais, cidade }) => {
    const a = account || {};
    const mudouPais = pais && pais !== a.pais;
    if (!mudouPais) {
      setAccount((x) => ({ ...x || {}, cidade: cidade != null ? cidade : x && x.cidade || "" }));
      return { reset: false };
    }
    const novaMoeda = BM.currencyForCountry(pais);
    const soma = (arr) => (arr || []).reduce((s, x) => s + (+x.valor || 0), 0);
    const temDados = (data.despesas || []).length + (data.rendimentos || []).length + (data.metas || []).length > 0;
    if (temDados) {
      const snap = {
        id: String(Date.now()),
        pais: a.pais || null,
        moeda: a.moeda || "EUR",
        cidade: a.cidade || null,
        dataArquivo: BM.todayISO(),
        totais: {
          rendimentos: soma(data.rendimentos),
          despesas: soma(data.despesas),
          poupado: (data.metas || []).reduce((s, m) => s + (+m.atual || 0), 0),
          nDespesas: (data.despesas || []).length,
          nRendimentos: (data.rendimentos || []).length,
          nMetas: (data.metas || []).length
        },
        dados: { despesas: data.despesas || [], rendimentos: data.rendimentos || [], metas: data.metas || [], aforros: data.aforros || [], orcamento: data.orcamento || null }
      };
      const novos = [snap, ...lerArquivos()];
      gravarArquivos(novos);
      setArquivos(novos);
      const apaga = (rec, arr) => Promise.all((arr || []).map((x) => API.apagar(rec, x.id).catch(() => {
      })));
      await Promise.all([apaga("despesas", data.despesas), apaga("rendimentos", data.rendimentos), apaga("metas", data.metas)]);
      setData((d) => ({ ...EMPTY_DATA, customCats: d.customCats, poupancaPct: d.poupancaPct }));
      setMonth(BM.todayISO().slice(0, 7));
    }
    updateAccount({ pais, cidade: cidade || "", moeda: novaMoeda });
    return { reset: temDados, moeda: novaMoeda };
  };
  const apagarArquivo = (id) => {
    const novos = lerArquivos().filter((x) => x.id !== id);
    gravarArquivos(novos);
    setArquivos(novos);
  };
  const esqueciPassword = async (email) => {
    await API.esqueciPassword({ email: (email || "").trim() });
    return true;
  };
  const redefinirPassword = async (email, codigo, password) => {
    const resp = await API.redefinirPassword({ email: (email || "").trim(), codigo: (codigo || "").trim(), password });
    API.setToken(resp.token);
    setAccount((a) => ({ ...a || {}, ...resp.user || {} }));
    await carregarTudo();
    return true;
  };
  const crud = (key, recurso, paraApi, daApi) => ({
    add: async (item) => {
      try {
        const criado = await API.criar(recurso, paraApi ? paraApi(item) : item);
        const local = daApi ? daApi(criado) : criado;
        setData((d) => ({ ...d, [key]: [...d[key], local] }));
        return local;
      } catch (e) {
        erroAlerta(e);
      }
    },
    edit: async (id, patch) => {
      try {
        const at = await API.editar(recurso, id, paraApi ? paraApi(patch) : patch);
        const local = daApi ? daApi(at) : at;
        setData((d) => ({ ...d, [key]: d[key].map((x) => x.id === id ? { ...x, ...local } : x) }));
      } catch (e) {
        erroAlerta(e);
      }
    },
    remove: async (id) => {
      try {
        await API.apagar(recurso, id);
        setData((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== id) }));
      } catch (e) {
        erroAlerta(e);
      }
    }
  });
  const despesa = crud("despesas", "despesas");
  const rendimento = crud("rendimentos", "rendimentos");
  const conta = crud("contas", "contas");
  const meta = {
    edit: async (id, patch) => {
      try {
        const m = await API.editar("metas", id, patch);
        setData((d) => ({ ...d, metas: d.metas.map((x) => x.id === id ? { ...x, ...m, cor: patch.cor !== void 0 ? patch.cor : x.cor } : x) }));
      } catch (e) {
        erroAlerta(e);
      }
    },
    add: async (item) => {
      try {
        const atual = +item.atual || 0;
        const m = await API.criar("metas", { nome: item.nome, alvo: +item.alvo || 0, atual });
        let novoAforro = null;
        const ini = !!item.inicial;
        const dataAforro = ini ? prevMonthISO() : BM.todayISO();
        if (atual > 0) novoAforro = await API.criar("aforros", { metaId: m.id, valor: atual, data: dataAforro, inicial: ini });
        setData((d) => ({
          ...d,
          metas: [...d.metas, { ...m, cor: item.cor || PALETA[d.metas.length % PALETA.length] }],
          aforros: novoAforro ? [...d.aforros || [], { ...novoAforro, inicial: ini, data: novoAforro.data || dataAforro }] : d.aforros || []
        }));
        return m;
      } catch (e) {
        erroAlerta(e);
      }
    },
    remove: async (id) => {
      try {
        await API.apagar("metas", id);
        const map = lerFechadas();
        delete map[id];
        gravarFechadas(map);
        setData((d) => ({ ...d, metas: d.metas.filter((x) => x.id !== id), aforros: (d.aforros || []).filter((a) => a.metaId !== id) }));
      } catch (e) {
        erroAlerta(e);
      }
    },
    fechar: async (id) => {
      const mes = BM.monthKey(BM.todayISO());
      const map = lerFechadas();
      map[id] = mes;
      gravarFechadas(map);
      setData((d) => ({ ...d, metas: d.metas.map((x) => x.id === id ? { ...x, fechada: true, fechadaEm: mes } : x) }));
      try {
        await API.editar("metas", id, { fechada: true, fechadaEm: mes });
      } catch (e) {
      }
    },
    reabrir: async (id) => {
      const map = lerFechadas();
      delete map[id];
      gravarFechadas(map);
      setData((d) => ({ ...d, metas: d.metas.map((x) => x.id === id ? { ...x, fechada: false, fechadaEm: null } : x) }));
      try {
        await API.editar("metas", id, { fechada: false, fechadaEm: null });
      } catch (e) {
      }
    }
  };
  const prevMonthISO = () => {
    const d = /* @__PURE__ */ new Date();
    d.setDate(1);
    d.setDate(0);
    return d.toISOString().slice(0, 10);
  };
  const deposit = async (id, valor, inicial = false) => {
    try {
      const m = (data.metas || []).find((x) => x.id === id);
      const novo = (m ? +m.atual || 0 : 0) + (+valor || 0);
      const capado = m && m.alvo > 0 ? Math.min(m.alvo, novo) : novo;
      await API.editar("metas", id, { atual: capado });
      const dataAforro = inicial ? prevMonthISO() : BM.todayISO();
      const aforro = await API.criar("aforros", { metaId: id, valor: +valor || 0, data: dataAforro, inicial: !!inicial });
      setData((d) => ({
        ...d,
        metas: d.metas.map((x) => x.id === id ? { ...x, atual: capado } : x),
        aforros: [...d.aforros || [], { ...aforro, inicial: !!inicial, data: aforro.data || dataAforro }]
      }));
    } catch (e) {
      erroAlerta(e);
    }
  };
  const setOrcamento = async (v) => {
    try {
      await API.atualizarPerfil({ orcamento: v });
      setData((d) => ({ ...d, orcamento: v }));
      setAccount((a) => ({ ...a || {}, orcamento: v }));
    } catch (e) {
      erroAlerta(e);
    }
  };
  const setPoupancaPct = (v) => {
    setData((d) => ({ ...d, poupancaPct: v }));
    setAccount((a) => ({ ...a || {}, poupancaPct: v }));
    clearTimeout(pctTimer.current);
    pctTimer.current = setTimeout(() => {
      API.atualizarPerfil({ poupancaPct: v }).catch((e) => erroAlerta(e));
    }, 400);
  };
  const addCategory = async ({ nome, color, icon }) => {
    try {
      const c = await API.criar("categorias", { nome, cor: color, icon });
      const key = c.id;
      BM.cats[key] = { nome, color, icon, custom: true };
      setData((d) => ({ ...d, customCats: [...d.customCats || [], { key, nome, color, icon }] }));
      return key;
    } catch (e) {
      erroAlerta(e);
    }
  };
  const removeCategory = async (key) => {
    try {
      await API.apagar("categorias", key);
      delete BM.cats[key];
      setData((d) => ({ ...d, customCats: (d.customCats || []).filter((c) => c.key !== key) }));
    } catch (e) {
      erroAlerta(e);
    }
  };
  const connectBank = async (bancoKey) => {
    try {
      const preset = BM.bancos[bancoKey];
      if (!preset) return;
      const c = await API.criar("contas", { banco: bancoKey, nome: preset.nome, saldo: preset.saldoInicial, moeda: preset.moeda, ligadoEm: BM.todayISO() });
      setData((d) => ({ ...d, contas: [...d.contas, c] }));
    } catch (e) {
      erroAlerta(e);
    }
  };
  const disconnectBank = async (id) => {
    try {
      await API.apagar("contas", id);
      setData((d) => ({ ...d, contas: d.contas.filter((c) => c.id !== id) }));
    } catch (e) {
      erroAlerta(e);
    }
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
        contas: d.contas.map((x) => x.id === id ? { ...x, sincronizadoEm: sinc.sincronizadoEm } : x)
      }));
    } catch (e) {
      erroAlerta(e);
    }
  };
  const sel = React.useMemo(() => {
    var _a;
    const inMonth = (iso) => BM.monthKey(iso) === month;
    const despMes = data.despesas.filter((x) => inMonth(x.data));
    const rendMes = data.rendimentos.filter((x) => inMonth(x.data));
    const totalGasto = despMes.reduce((s, x) => s + (+x.valor || 0), 0);
    const totalRec = rendMes.reduce((s, x) => s + (+x.valor || 0), 0);
    const fixas = despMes.filter((x) => x.tipo === "fixa").reduce((s, x) => s + (+x.valor || 0), 0);
    const variaveis = totalGasto - fixas;
    const poupado = data.metas.reduce((s, m) => s + (+m.atual || 0), 0);
    const saldo = totalRec - totalGasto;
    const poupancaPct = (_a = data.poupancaPct) != null ? _a : 20;
    const planoTotal = saldo > 0 ? Math.round(poupancaPct / 100 * saldo * 100) / 100 : 0;
    const poupadoMes = (data.aforros || []).filter((a) => !a.inicial && BM.monthKey(a.data) === month).reduce((s, a) => s + (+a.valor || 0), 0);
    const poupancaSeparada = Math.max(poupadoMes, planoTotal);
    const poupancaPlano = planoTotal;
    const disponivel = saldo - poupancaSeparada;
    const byCat = {};
    despMes.forEach((x) => {
      byCat[x.cat] = (byCat[x.cat] || 0) + (+x.valor || 0);
    });
    const catBreak = Object.keys(byCat).map((k) => ({ key: k, nome: (BM.cats[k] || BM.cats.outros).nome, color: (BM.cats[k] || BM.cats.outros).color, valor: byCat[k] })).sort((a, b) => b.valor - a.valor);
    const byInc = {};
    rendMes.forEach((x) => {
      byInc[x.cat] = (byInc[x.cat] || 0) + (+x.valor || 0);
    });
    const incBreak = Object.keys(byInc).map((k) => ({ key: k, nome: k, color: BM.incomeCats[k] || "var(--c-outros)", valor: byInc[k] })).sort((a, b) => b.valor - a.valor);
    const [yy, mm] = month.split("-").map(Number);
    const mkey = (dt) => dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0");
    const series = [];
    const windowStart = mkey(new Date(yy, mm - 1 - 5, 1));
    let acum = (data.aforros || []).filter((a) => BM.monthKey(a.data) < windowStart).reduce((s, a) => s + (+a.valor || 0), 0);
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(yy, mm - 1 - i, 1);
      const key = mkey(dt);
      const rec = data.rendimentos.filter((x) => BM.monthKey(x.data) === key).reduce((s, x) => s + (+x.valor || 0), 0);
      const gasto = data.despesas.filter((x) => BM.monthKey(x.data) === key).reduce((s, x) => s + (+x.valor || 0), 0);
      const pou = (data.aforros || []).filter((a) => BM.monthKey(a.data) === key).reduce((s, a) => s + (+a.valor || 0), 0);
      acum += pou;
      series.push({ m: BM.MESES[dt.getMonth()], key, rec, gasto, pou, poupAcum: acum });
    }
    const allKeys = Array.from(new Set([...data.despesas, ...data.rendimentos].map((x) => BM.monthKey(x.data)))).filter(Boolean).sort().reverse();
    const historico = allKeys.map((key) => {
      const [y, m] = key.split("-").map(Number);
      const rec = data.rendimentos.filter((x) => BM.monthKey(x.data) === key).reduce((s, x) => s + (+x.valor || 0), 0);
      const gasto = data.despesas.filter((x) => BM.monthKey(x.data) === key).reduce((s, x) => s + (+x.valor || 0), 0);
      return { key, label: `${BM.MESES[m - 1]} ${y}`, rec, gasto, atual: key === month };
    });
    const winKeys = series.map((s) => s.key);
    const metaSeries = data.metas.map((m) => {
      const af = (data.aforros || []).filter((a) => a.metaId === m.id);
      let acum2 = af.filter((a) => BM.monthKey(a.data) < winKeys[0]).reduce((s, a) => s + (+a.valor || 0), 0);
      const points = winKeys.map((k) => {
        acum2 += af.filter((a) => BM.monthKey(a.data) === k).reduce((s, a) => s + (+a.valor || 0), 0);
        return acum2;
      });
      return { id: m.id, nome: m.nome, cor: m.cor, alvo: +m.alvo || 0, atual: +m.atual || 0, fechada: !!m.fechada, fechadaEm: m.fechadaEm || null, points };
    });
    return { despMes, rendMes, totalGasto, totalRec, fixas, variaveis, poupado, saldo, poupancaPct, poupancaPlano, planoTotal, poupadoMes, poupancaSeparada, disponivel, catBreak, incBreak, series, metaSeries, historico };
  }, [data, month]);
  const monthLabel = (() => {
    const [y, m] = month.split("-").map(Number);
    return `${BM.MESES[m - 1]} ${y}`;
  })();
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
    account,
    session,
    data,
    month,
    monthLabel,
    realMonth,
    isCurrentMonth,
    signup,
    iniciarRegisto,
    verificarEmail,
    definirPassword,
    reenviarCodigo,
    login,
    logout,
    eliminarConta,
    updateAccount,
    resetData,
    mudarLocalizacao,
    arquivos,
    apagarArquivo,
    esqueciPassword,
    redefinirPassword,
    cur: BM.curInfo(),
    curSym: BM.curInfo().sym,
    setCurrency: (code) => updateAccount({ moeda: code }),
    despesa,
    rendimento,
    meta,
    conta,
    deposit,
    setOrcamento,
    setPoupancaPct,
    addCategory,
    removeCategory,
    connectBank,
    disconnectBank,
    importMovs,
    bancosTotal,
    setMonth,
    shiftMonth,
    goToday,
    ...sel
  };
  return /* @__PURE__ */ React.createElement(FinanceContext.Provider, { value }, children);
}
Object.assign(window, { FinanceContext, useFinance, FinanceProvider });
