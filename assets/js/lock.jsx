/* ===== Bloqueio de ecrã por PIN + inatividade (Funcionalidade #1) =====
   Camada local do dispositivo (não depende do backend). Expõe window.RendeLock
   para o ecrã de Definições e a app. O PIN é guardado com hash simples.
   NOTA: em produção, trocar por um hash forte (SHA-256 / bcrypt no backend). */
(function () {
  const KEY = "rende_lock";
  const DEFAULT_MIN = 5; // minutos de inatividade até bloquear (predefinição)

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } };
  const write = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  const djb2 = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i); return "h" + (h >>> 0); };

  const subs = new Set();
  const notify = () => subs.forEach((fn) => { try { fn(); } catch (e) {} });

  // marca que esta sessão de página já está desbloqueada (evita bloquear logo a seguir a definir/desbloquear)
  let unlockedThisSession = false;

  const RendeLock = {
    hasPin() { const o = read(); return !!(o && o.pinHash); },
    verify(pin) { const o = read(); return !!(o && o.pinHash === djb2(String(pin))); },
    setPin(pin) { const o = read() || {}; o.pinHash = djb2(String(pin)); if (o.minutes == null) o.minutes = DEFAULT_MIN; write(o); unlockedThisSession = true; notify(); },
    removePin() { const o = read() || {}; delete o.pinHash; write(o); unlockedThisSession = true; notify(); },
    getMinutes() { const o = read(); return (o && o.minutes != null) ? o.minutes : DEFAULT_MIN; },
    setMinutes(m) { const o = read() || {}; o.minutes = m; write(o); notify(); },
    markUnlocked() { unlockedThisSession = true; },
    wasUnlocked() { return unlockedThisSession; },
    lockNow() { unlockedThisSession = false; notify(); window.dispatchEvent(new CustomEvent("rende-lock-now")); },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
  window.RendeLock = RendeLock;
})();

/* ---------- Ecrã de bloqueio (PIN de 6 dígitos, estilo app bancária) ----------
   Substitui por completo o mockup anterior de 2 colunas. Mantém-se só a camada de
   dados (RendeLock, acima) e o contrato onUnlock — toda a UI é nova. */
const LOCK_PIN_LEN = 6;

function LockScreen({ onUnlock }) {
  const fin = useFinance();
  const acc = (fin && fin.account) || {};
  const nome = acc.nome || "";
  const email = acc.email || "";
  const [digits, setDigits] = React.useState("");
  const [status, setStatus] = React.useState("idle"); // idle | validating | error | ok
  const [msg, setMsg] = React.useState("");
  const [recuperar, setRecuperar] = React.useState(null); // null | "confirm" | "sent"
  const [recBusy, setRecBusy] = React.useState(false);
  const [recErr, setRecErr] = React.useState("");

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const okUnlock = () => { setStatus("ok"); window.RendeLock.markUnlocked(); setTimeout(onUnlock, 260); };
  const falhar = () => {
    setStatus("error"); setMsg("PIN incorreto. Tente novamente.");
    setTimeout(() => { setDigits(""); setStatus("idle"); setMsg(""); }, 640);
  };
  const validar = (str) => {
    setStatus("validating");
    setTimeout(() => { if (window.RendeLock.verify(str)) okUnlock(); else falhar(); }, 220);
  };
  const push = (d) => {
    if (status !== "idle") return;
    setDigits((s) => {
      if (s.length >= LOCK_PIN_LEN) return s;
      const n = s + d;
      if (n.length === LOCK_PIN_LEN) validar(n);
      return n;
    });
  };
  const apagar = () => { if (status !== "idle") return; setDigits((s) => s.slice(0, -1)); };

  React.useEffect(() => {
    if (recuperar) return;
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) push(e.key);
      else if (e.key === "Backspace") apagar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, recuperar]);

  const enviarRecuperacao = async () => {
    setRecBusy(true); setRecErr("");
    try { await fin.esqueciPassword(email); setRecuperar("sent"); }
    catch (e) { setRecErr(e.message || "Não foi possível enviar o código. Tenta novamente."); }
    finally { setRecBusy(false); }
  };

  const erro = status === "error";
  const ocupado = status === "validating" || status === "ok";

  return (
    <div className={"lock-root" + (status === "ok" ? " lock-out" : "")} role="dialog" aria-modal="true" aria-label="Sessão bloqueada"
      onKeyDown={(e) => { if (e.key === "Escape") e.preventDefault(); }}>
      <span className="lock-shape s1" aria-hidden="true" />
      <span className="lock-shape s2" aria-hidden="true" />
      <span className="lock-shape s3" aria-hidden="true" />

      <div className="lock-card">
        {!recuperar ? (
          <>
            <div className="lock-user">
              <Avatar account={acc} size={64} />
              <div className="lock-user-name">{nome || "A tua conta"}</div>
              <p className="lock-user-sub">Introduza o seu PIN para desbloquear o Rende+.</p>
            </div>

            <div className={"lock-pin" + (erro ? " shake" : "")} role="status" aria-label={"PIN, " + digits.length + " de " + LOCK_PIN_LEN + " dígitos"}>
              {Array.from({ length: LOCK_PIN_LEN }).map((_, i) => (
                <span key={i} className={"lock-dot" + (i < digits.length ? " filled" : "") + (erro ? " err" : "")} />
              ))}
            </div>

            <div className={"lock-feedback" + (erro ? " show" : "")} role="alert" aria-live="assertive">{msg}</div>

            <div className="lock-keypad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button type="button" key={n} className="lock-key" disabled={ocupado} onClick={() => push(String(n))} aria-label={"Dígito " + n}>{n}</button>
              ))}
              <span className="lock-key lock-key-blank" aria-hidden="true" />
              <button type="button" className="lock-key" disabled={ocupado} onClick={() => push("0")} aria-label="Dígito 0">0</button>
              <button type="button" className="lock-key lock-key-del" disabled={ocupado || !digits.length} onClick={apagar} aria-label="Apagar dígito">Apagar</button>
            </div>

            <button type="button" className="lock-forgot" onClick={() => setRecuperar("confirm")}>Esqueceu-se do PIN?</button>
          </>
        ) : (
          <div className="lock-recover">
            <div className="lock-recover-ico"><Icon name="shield" size={20} color="var(--accent)" /></div>
            {recuperar === "confirm" ? (
              <>
                <div className="lock-recover-title">Recuperar acesso</div>
                <p className="lock-recover-txt">Vamos enviar um código de verificação para <b>{email}</b>. De seguida, termine a sessão para continuar a recuperação a partir do ecrã de entrada.</p>
                {recErr && <div className="lock-recover-err">{recErr}</div>}
                <div className="lock-recover-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => { setRecuperar(null); setRecErr(""); }}>Cancelar</button>
                  <button type="button" className="btn btn-primary" disabled={recBusy} onClick={enviarRecuperacao}>{recBusy ? "A enviar…" : "Enviar código"}</button>
                </div>
              </>
            ) : (
              <>
                <div className="lock-recover-title">Código enviado</div>
                <p className="lock-recover-txt">Verifique o email <b>{email}</b>. Termine a sessão para introduzir o código e criar uma nova palavra-passe; depois pode definir um novo PIN em Definições.</p>
                <div className="lock-recover-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setRecuperar(null)}>Voltar</button>
                  <button type="button" className="btn btn-primary" onClick={() => fin.logout()}>Terminar sessão</button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="lock-security"><Icon name="shield" size={13} color="var(--ink-3)" /> A sua sessão permanece protegida com encriptação segura.</div>
      </div>
    </div>
  );
}

/* ---------- Porta de bloqueio: mede inatividade e mostra o ecrã ----------
   Renderiza-se dentro do Shell: <LockGate active={!!fin.session} /> */
function LockGate({ active }) {
  const [locked, setLocked] = React.useState(() => window.RendeLock.hasPin() && !window.RendeLock.wasUnlocked());
  const lastActivity = React.useRef(Date.now());

  React.useEffect(() => {
    const bump = () => { lastActivity.current = Date.now(); };
    const evs = ["click", "keydown", "mousemove", "touchstart", "scroll"];
    evs.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const onLockNow = () => setLocked(true);
    window.addEventListener("rende-lock-now", onLockNow);
    const iv = setInterval(() => {
      if (active && window.RendeLock.hasPin() && !locked) {
        const mins = window.RendeLock.getMinutes();
        if (Date.now() - lastActivity.current > mins * 60000) setLocked(true);
      }
    }, 1000);
    return () => { evs.forEach((e) => window.removeEventListener(e, bump)); window.removeEventListener("rende-lock-now", onLockNow); clearInterval(iv); };
  }, [active, locked]);

  if (!active || !locked || !window.RendeLock.hasPin()) return null;
  return <LockScreen onUnlock={() => { lastActivity.current = Date.now(); setLocked(false); }} />;
}

/* ---------- Modal: definir/alterar PIN (reutiliza o teu Modal) ---------- */
function RLPinSetup({ onClose }) {
  const [a, setA] = React.useState("");
  const [b, setB] = React.useState("");
  const [err, setErr] = React.useState("");
  const ok = () => {
    if (!/^\d{6}$/.test(a)) return setErr("O PIN deve ter exatamente 6 dígitos.");
    if (a !== b) return setErr("Os PINs não coincidem.");
    window.RendeLock.setPin(a); onClose();
  };
  const aside = (
    <>
      <div className="modal-info-title">Como funciona</div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", lineHeight: 1.55 }}>
        Este PIN de 6 dígitos é usado apenas no ecrã de bloqueio, para desbloquear rapidamente o Rende+ sem escrever a palavra-passe. Se o esqueceres, podes repor a partir do ecrã de bloqueio.
      </div>
    </>
  );
  return (
    <Modal title="Definir PIN" sub="Protege a app e as ações graves" icon="lock" onClose={onClose} aside={aside}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={ok}><Icon name="check" size={15} color="#fff" /> Definir</button>
      </>}>
      <div className="modal-row-2">
        <Field label="Novo PIN (6 dígitos)"><input className="input" type="password" inputMode="numeric" maxLength={6} autoFocus value={a} onChange={(e) => setA(e.target.value.replace(/\D/g, ""))} placeholder="••••••" /></Field>
        <Field label="Confirmar PIN"><input className="input" type="password" inputMode="numeric" maxLength={6} value={b} onChange={(e) => setB(e.target.value.replace(/\D/g, ""))} placeholder="••••••" /></Field>
      </div>
      {err && <div className="alert bad" style={{ marginTop: 4, padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
    </Modal>
  );
}

/* ---------- Modal: confirmar ação grave com PIN (Funcionalidade #5) ----------
   Uso: RLConfirmPin({ title, desc, onConfirm, onClose }) */
function RLConfirmPin({ title, desc, onConfirm, onClose }) {
  const fin = useFinance();
  const email = (fin && fin.account && fin.account.email) || "";
  const temPin = window.RendeLock.hasPin();
  const [val, setVal] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const confirm = async () => {
    if (!val) return setErr(temPin ? "Introduz o teu PIN ou palavra-passe." : "Introduz a tua palavra-passe.");
    setBusy(true);
    try {
      if (temPin && /^\d{4,6}$/.test(val) && window.RendeLock.verify(val)) { onConfirm(); onClose(); return; }
      if (email) { try { await API.login({ email: email, password: val }); onConfirm(); onClose(); return; } catch (e) {} }
      setErr(temPin ? "PIN ou palavra-passe incorretos." : "Palavra-passe incorreta.");
      setVal("");
    } finally { setBusy(false); }
  };
  return (
    <Modal title={title} sub="Confirmação de segurança" icon="shield" onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn" style={{ background: "var(--neg)", color: "#fff", border: "none", opacity: busy ? .7 : 1 }} disabled={busy} onClick={confirm}>{busy ? "A verificar…" : "Confirmar"}</button>
      </>}>
      <div className="muted" style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.6, marginBottom: 14 }}>{desc}</div>
      <Field label={temPin ? "Introduz o teu PIN ou palavra-passe para confirmar" : "Introduz a tua palavra-passe para confirmar"}>
        <input className="input" type="password" autoFocus value={val} onChange={(e) => { setVal(e.target.value); setErr(""); }} placeholder={temPin ? "PIN ou palavra-passe" : "Palavra-passe"} onKeyDown={(e) => { if (e.key === "Enter") confirm(); }} />
      </Field>
      {err && <div className="alert bad" style={{ marginTop: 4, padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
    </Modal>
  );
}

window.LockGate = LockGate;
window.LockScreen = LockScreen;
window.RLPinSetup = RLPinSetup;
window.RLConfirmPin = RLConfirmPin;