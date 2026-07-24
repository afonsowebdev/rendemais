/* =========================================================
   Rende+ — Ecrã de introdução em vídeo
   ---------------------------------------------------------
   Aparece uma única vez, no arranque da app (antes da landing, ou do ecrã
   seguinte se já houver sessão iniciada — ver Shell em app.jsx). autoPlay +
   muted + playsInline são obrigatórios para o autoplay funcionar em browsers
   móveis e dentro da WebView Android do Capacitor.
   ========================================================= */
function IntroVideo({ onDone }) {
  // Garante que onDone só é chamado uma vez, mesmo que o utilizador clique em
  // "Saltar" ao mesmo tempo que o vídeo termina ou falha.
  const avancadoRef = React.useRef(false);
  const avancar = () => {
    if (avancadoRef.current) return;
    avancadoRef.current = true;
    onDone();
  };

  // Nunca bloqueia o acesso à app: se o vídeo falhar a carregar (ficheiro em
  // falta, formato não suportado, etc.), avança sozinho ao fim de 1 segundo.
  const onError = () => { setTimeout(avancar, 1000); };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#0E1F1A",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
      }}
    >
      <video
        src="assets/video/intro.mp4"
        autoPlay
        muted
        playsInline
        onEnded={avancar}
        onError={onError}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <button
        type="button"
        onClick={avancar}
        aria-label="Saltar introdução"
        style={{
          position: "absolute",
          top: "calc(16px + env(safe-area-inset-top, 0px))",
          right: "calc(16px + env(safe-area-inset-right, 0px))",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "9px 16px",
          border: "none",
          borderRadius: 999,
          background: "#1D9E75",
          color: "#fff",
          fontWeight: 700,
          fontSize: 14,
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        Saltar <Icon name="chevR" size={14} color="#fff" />
      </button>
    </div>
  );
}

Object.assign(window, { IntroVideo });
