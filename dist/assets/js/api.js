/* =========================================================
   Rende+ — Camada de ligação à API (backend)
   =========================================================
   É AQUI que defines o endereço do backend. Só este sítio.
   - Local (no teu computador):  http://localhost:3000
   - Depois do deploy no Render:  https://o-teu-servico.onrender.com
   Quando publicares, troca apenas a linha BASE em baixo.
   ========================================================= */
const API = (function () {
  // Em casa (localhost) usa o backend local; publicado, usa o do Render.
  const LOCAL = "http://localhost:3000";
  const PRODUCAO = "https://rende-backend-33m7.onrender.com";
  // Dentro da app nativa (Capacitor) o hostname também é "localhost", mas é o telemóvel,
  // não o teu PC — por isso usa SEMPRE produção quando corre como app instalada.
  const isNative = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform());
  const emCasa = !isNative && (location.hostname === "localhost" || location.hostname === "127.0.0.1");
  const BASE = emCasa ? LOCAL : PRODUCAO;

  const TOKEN_KEY = "rende_token";
  const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || null; } catch { return null; } };
  const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {} };

  // Faz um pedido à API, já com o token (se existir) e tratando erros.
  async function req(metodo, caminho, corpo) {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;

    const resp = await fetch(BASE + caminho, {
      method: metodo,
      headers,
      body: corpo ? JSON.stringify(corpo) : undefined,
    });

    let dados = null;
    try { dados = await resp.json(); } catch (_) {}

    if (!resp.ok) {
      throw new Error((dados && dados.erro) || ("Erro " + resp.status));
    }
    return dados;
  }

  return {
    BASE,
    getToken,
    setToken,
    // autenticação
    registar: (corpo) => req("POST", "/api/auth/registar", corpo),
    verificarEmail: (corpo) => req("POST", "/api/auth/verificar-email", corpo),
    definirPassword: (corpo) => req("POST", "/api/auth/definir-password", corpo),
    reenviarCodigo: (corpo) => req("POST", "/api/auth/reenviar-codigo", corpo),
    esqueciPassword: (corpo) => req("POST", "/api/auth/esqueci-password", corpo),
    redefinirPassword: (corpo) => req("POST", "/api/auth/redefinir-password", corpo),
    login: (corpo) => req("POST", "/api/auth/login", corpo),
    perfil: () => req("GET", "/api/auth/eu"),
    atualizarPerfil: (corpo) => req("PATCH", "/api/auth/eu", corpo),
    eliminarConta: () => req("DELETE", "/api/auth/eu"),
    // CRUD genérico (recurso = "despesas", "rendimentos", ...)
    listar: (recurso) => req("GET", "/api/" + recurso),
    criar: (recurso, corpo) => req("POST", "/api/" + recurso, corpo),
    editar: (recurso, id, corpo) => req("PATCH", "/api/" + recurso + "/" + id, corpo),
    apagar: (recurso, id) => req("DELETE", "/api/" + recurso + "/" + id),
    // pagamentos (Stripe)
    criarCheckout: (plano) => req("POST", "/api/pagamentos/checkout", { plano }),
    confirmarPagamento: (sessionId) => req("GET", "/api/pagamentos/confirmar?session_id=" + encodeURIComponent(sessionId)),
  };
})();
window.API = API;