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
  const emCasa = location.hostname === "localhost" || location.hostname === "127.0.0.1";
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
    login: (corpo) => req("POST", "/api/auth/login", corpo),
    perfil: () => req("GET", "/api/auth/eu"),
    atualizarPerfil: (corpo) => req("PATCH", "/api/auth/eu", corpo),
    // CRUD genérico (recurso = "despesas", "rendimentos", ...)
    listar: (recurso) => req("GET", "/api/" + recurso),
    criar: (recurso, corpo) => req("POST", "/api/" + recurso, corpo),
    editar: (recurso, id, corpo) => req("PATCH", "/api/" + recurso + "/" + id, corpo),
    apagar: (recurso, id) => req("DELETE", "/api/" + recurso + "/" + id),
  };
})();
window.API = API;