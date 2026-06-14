/* ===== Rende+ — catálogo + helpers (sem dados) ===== */
window.BM = (function () {
  // ---- moedas suportadas ----
  const currencies = {
    EUR: { code: "EUR", sym: "€",   nome: "Euro",                 pais: "Zona Euro",  pos: "before" },
    AOA: { code: "AOA", sym: "Kz",  nome: "Kwanza angolano",      pais: "Angola",     pos: "after"  },
    USD: { code: "USD", sym: "$",   nome: "Dólar americano",      pais: "EUA",        pos: "before" },
    CVE: { code: "CVE", sym: "Esc", nome: "Escudo cabo-verdiano", pais: "Cabo Verde", pos: "after"  },
    MZN: { code: "MZN", sym: "MT",  nome: "Metical moçambicano",  pais: "Moçambique", pos: "after"  },
    BRL: { code: "BRL", sym: "R$",  nome: "Real brasileiro",      pais: "Brasil",     pos: "before" },
  };
  let curCode = "EUR";
  const setCurrency = (c) => { if (currencies[c]) curCode = c; };
  const curInfo = () => currencies[curCode] || currencies.EUR;
  const fmtMoney = (n, dec) => {
    const c = curInfo();
    const v = (+n || 0).toLocaleString("pt-PT", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return c.pos === "before" ? `${c.sym}${v}` : `${v}\u00A0${c.sym}`;
  };
  const eur = (n) => fmtMoney(n, 2);
  const eur0 = (n) => fmtMoney(n, 0);

  // categorias de DESPESA (chave -> nome, cor, ícone)
  const cats = {
    habitacao:   { nome: "Habitação",   color: "var(--c-habitacao)",   icon: "home" },
    alimentacao: { nome: "Alimentação", color: "var(--c-alimentacao)", icon: "cart" },
    transporte:  { nome: "Transporte",  color: "var(--c-transporte)",  icon: "bus" },
    educacao:    { nome: "Educação",    color: "var(--c-educacao)",    icon: "cap" },
    internet:    { nome: "Internet",    color: "var(--c-internet)",    icon: "wifi" },
    saude:       { nome: "Saúde",       color: "var(--c-saude)",       icon: "heart" },
    lazer:       { nome: "Lazer",       color: "var(--c-lazer)",       icon: "spark" },
    criancas:    { nome: "Crianças",    color: "var(--c-lazer)",       icon: "heart" },
    outros:      { nome: "Outros",      color: "var(--c-outros)",      icon: "dots" },
  };

  // categorias de RENDIMENTO (label -> cor)
  const incomeCats = {
    "Salário":        "var(--accent)",
    "Bolsa":          "var(--c-habitacao)",
    "Ajuda Familiar": "var(--c-transporte)",
    "Subsídios":      "var(--c-educacao)",
    "Apoios do Estado":"var(--c-internet)",
    "Freelance":      "var(--c-lazer)",
    "Outros":         "var(--c-outros)",
  };

  const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const todayISO = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const monthKey = (iso) => (iso || "").slice(0, 7);
  const fmtData = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${+d} ${MESES[+m - 1]} ${y}`;
  };
  const uid = () => Math.random().toString(36).slice(2, 9);

  // bancos / apps que se podem ligar (representação neutra — sem logótipos de marca)
  const bancos = {
    revolut: {
      nome: "Revolut", mono: "R", cor: "#1c1c1e", moeda: "EUR", saldoInicial: 312.45,
      desc: "Conta multimoeda e cartão.",
      importar: [
        { kind: "despesa", nome: "Lidl", cat: "alimentacao", valor: 23.7, tipo: "variavel" },
        { kind: "despesa", nome: "Uber", cat: "transporte", valor: 6.2, tipo: "variavel" },
        { kind: "despesa", nome: "Netflix", cat: "lazer", valor: 8.99, tipo: "fixa" },
      ],
    },
    wise: {
      nome: "Wise", mono: "W", cor: "#163300", moeda: "EUR", saldoInicial: 148.9,
      desc: "Transferências internacionais.",
      importar: [
        { kind: "rendimento", nome: "Transferência recebida", cat: "Freelance", valor: 120 },
        { kind: "despesa", nome: "Levantamento ATM", cat: "outros", valor: 40, tipo: "variavel" },
      ],
    },
  };

  return { eur, eur0, currencies, setCurrency, curInfo, cats, incomeCats, MESES, todayISO, monthKey, fmtData, uid, bancos };
})();
