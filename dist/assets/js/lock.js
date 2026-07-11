(function() {
  const KEY = "rende_lock";
  const DEFAULT_MIN = 5;
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (e) {
      return null;
    }
  };
  const write = (o) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(o));
    } catch (e) {
    }
  };
  const djb2 = (s) => {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = (h << 5) + h + s.charCodeAt(i);
    return "h" + (h >>> 0);
  };
  const subs = /* @__PURE__ */ new Set();
  const notify = () => subs.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  let unlockedThisSession = false;
  const RendeLock = {
    hasPin() {
      const o = read();
      return !!(o && o.pinHash);
    },
    verify(pin) {
      const o = read();
      return !!(o && o.pinHash === djb2(String(pin)));
    },
    setPin(pin) {
      const o = read() || {};
      o.pinHash = djb2(String(pin));
      if (o.minutes == null) o.minutes = DEFAULT_MIN;
      write(o);
      unlockedThisSession = true;
      notify();
    },
    removePin() {
      const o = read() || {};
      delete o.pinHash;
      write(o);
      unlockedThisSession = true;
      notify();
    },
    getMinutes() {
      const o = read();
      return o && o.minutes != null ? o.minutes : DEFAULT_MIN;
    },
    setMinutes(m) {
      const o = read() || {};
      o.minutes = m;
      write(o);
      notify();
    },
    markUnlocked() {
      unlockedThisSession = true;
    },
    wasUnlocked() {
      return unlockedThisSession;
    },
    lockNow() {
      unlockedThisSession = false;
      notify();
      window.dispatchEvent(new CustomEvent("rende-lock-now"));
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    }
  };
  window.RendeLock = RendeLock;
})();
function LockScreen({ onUnlock }) {
  const fin = useFinance();
  const acc = fin && fin.account || {};
  const email = acc.email || "";
  const podePass = !!email;
  const [tab, setTab] = React.useState("pin");
  const [digits, setDigits] = React.useState(["", "", "", ""]);
  const [pass, setPass] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const [status, setStatus] = React.useState("idle");
  const [msg, setMsg] = React.useState("");
  const refs = [React.useRef(null), React.useRef(null), React.useRef(null), React.useRef(null)];
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      if (refs[0].current) refs[0].current.focus();
    }, 120);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, []);
  const okUnlock = () => {
    setStatus("ok");
    window.RendeLock.markUnlocked();
    setTimeout(onUnlock, 280);
  };
  const falhar = (m) => {
    setStatus("error");
    setMsg(m);
    setTimeout(() => setStatus((s) => s === "error" ? "idle" : s), 520);
  };
  const validarPin = (str) => {
    if (str.length < 4) return falhar("Completa os 4 d\xEDgitos.");
    setStatus("validating");
    setTimeout(() => {
      if (window.RendeLock.verify(str)) okUnlock();
      else {
        setDigits(["", "", "", ""]);
        if (refs[0].current) refs[0].current.focus();
        falhar("PIN incorreto. Tenta novamente.");
      }
    }, 240);
  };
  const onDigit = (i, v) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setMsg("");
    setDigits((arr) => {
      const n = arr.slice();
      n[i] = d;
      if (d && i < 3 && refs[i + 1].current) refs[i + 1].current.focus();
      const full = n.join("");
      if (full.length === 4 && n.every((x) => x)) validarPin(full);
      return n;
    });
    if (status === "error") setStatus("idle");
  };
  const onKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0 && refs[i - 1].current) refs[i - 1].current.focus();
  };
  const validarPass = () => {
    if (!pass) return falhar("Introduz a palavra-passe.");
    setStatus("validating");
    API.login({ email, password: pass }).then(() => okUnlock()).catch(() => {
      setPass("");
      falhar("Palavra-passe incorreta.");
    });
  };
  const erro = status === "error";
  const ocupado = status === "validating" || status === "ok";
  const acionar = () => tab === "pin" ? validarPin(digits.join("")) : validarPass();
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "lock-root" + (status === "ok" ? " lock-out" : ""),
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Sess\xE3o bloqueada",
      onKeyDown: (e) => {
        if (e.key === "Escape") e.preventDefault();
      }
    },
    /* @__PURE__ */ React.createElement("div", { className: "lock-card" }, /* @__PURE__ */ React.createElement("aside", { className: "lock-left" }, /* @__PURE__ */ React.createElement("div", { className: "lock-brand" }, /* @__PURE__ */ React.createElement(Brand, { nameColor: "#fff" })), /* @__PURE__ */ React.createElement("div", { className: "lock-left-mid" }, /* @__PURE__ */ React.createElement("h1", { className: "lock-h1" }, "Sess\xE3o bloqueada", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", null, "por inatividade")), /* @__PURE__ */ React.createElement("p", { className: "lock-lead" }, "Para proteger os teus dados, a tua sess\xE3o foi bloqueada automaticamente devido a um per\xEDodo de inatividade.")), /* @__PURE__ */ React.createElement("div", { className: "lock-privacy" }, /* @__PURE__ */ React.createElement("span", { className: "lock-privacy-ic" }, /* @__PURE__ */ React.createElement(Icon, { name: "shield", size: 16, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "A tua privacidade \xE9 importante"), /* @__PURE__ */ React.createElement("span", null, "S\xF3 tu tens acesso \xE0s tuas informa\xE7\xF5es financeiras.")))), /* @__PURE__ */ React.createElement("div", { className: "lock-right" }, /* @__PURE__ */ React.createElement("div", { className: "lock-brand lock-m" }, /* @__PURE__ */ React.createElement(Brand, { nameColor: "var(--ink)" })), /* @__PURE__ */ React.createElement("div", { className: "lock-ico" + (erro ? " shake" : "") }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 30, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("h2", { className: "lock-h2 lock-d" }, "Bem-vindo de volta!"), /* @__PURE__ */ React.createElement("h2", { className: "lock-h2 lock-m" }, "Sess\xE3o bloqueada", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", null, "por inatividade")), /* @__PURE__ */ React.createElement("p", { className: "lock-sub lock-d" }, "Introduz o teu ", podePass ? "PIN ou palavra-passe" : "PIN", " para continuar."), /* @__PURE__ */ React.createElement("p", { className: "lock-sub lock-m" }, "Para proteger os teus dados, a tua sess\xE3o foi bloqueada por seguran\xE7a."), podePass && /* @__PURE__ */ React.createElement("div", { className: "lock-tabs" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "lock-tab" + (tab === "pin" ? " on" : ""), onClick: () => {
      setTab("pin");
      setMsg("");
      setStatus("idle");
    } }, "PIN"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "lock-tab" + (tab === "pass" ? " on" : ""), onClick: () => {
      setTab("pass");
      setMsg("");
      setStatus("idle");
    } }, "Palavra-passe"), /* @__PURE__ */ React.createElement("span", { className: "lock-tab-ink", style: { transform: tab === "pass" ? "translateX(100%)" : "translateX(0)" } })), tab === "pin" ? /* @__PURE__ */ React.createElement("div", { className: "lock-pane" + (erro ? " shake" : "") }, /* @__PURE__ */ React.createElement("div", { className: "lock-pin-label" }, "Insere o teu PIN de 4 d\xEDgitos"), /* @__PURE__ */ React.createElement("div", { className: "lock-pin" }, digits.map((d, i) => /* @__PURE__ */ React.createElement(
      "input",
      {
        key: i,
        ref: refs[i],
        className: "lock-pin-box" + (erro ? " err" : ""),
        inputMode: "numeric",
        maxLength: 1,
        type: "password",
        value: d,
        disabled: ocupado,
        "aria-label": "D\xEDgito " + (i + 1),
        onChange: (e) => onDigit(i, e.target.value),
        onKeyDown: (e) => onKey(i, e)
      }
    )))) : /* @__PURE__ */ React.createElement("div", { className: "lock-pane" + (erro ? " shake" : "") }, /* @__PURE__ */ React.createElement("div", { className: "lock-pass" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "input lock-pass-input" + (erro ? " err" : ""),
        type: showPass ? "text" : "password",
        value: pass,
        placeholder: "A tua palavra-passe",
        autoFocus: true,
        disabled: ocupado,
        onChange: (e) => {
          setPass(e.target.value);
          setMsg("");
          if (status === "error") setStatus("idle");
        },
        onKeyDown: (e) => {
          if (e.key === "Enter") validarPass();
        }
      }
    ), /* @__PURE__ */ React.createElement("button", { type: "button", className: "lock-eye", onClick: () => setShowPass((v) => !v), title: showPass ? "Esconder" : "Mostrar" }, /* @__PURE__ */ React.createElement(Icon, { name: showPass ? "eyeOff" : "eye", size: 17, color: "rgba(255,255,255,.55)" })))), /* @__PURE__ */ React.createElement("div", { className: "lock-msg" + (erro ? " show" : "") }, msg), /* @__PURE__ */ React.createElement("button", { className: "lock-btn", disabled: ocupado, onClick: acionar }, status === "validating" ? "A validar\u2026" : status === "ok" ? "Desbloqueado \u2713" : "Desbloquear"), podePass && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "lock-or" }, /* @__PURE__ */ React.createElement("span", null, "ou")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "lock-alt", onClick: () => {
      setTab(tab === "pin" ? "pass" : "pin");
      setMsg("");
      setStatus("idle");
    } }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 15, color: "rgba(255,255,255,.75)" }), " ", tab === "pin" ? "Usar palavra-passe" : "Usar PIN")), /* @__PURE__ */ React.createElement("div", { className: "lock-privacy lock-m", style: { marginTop: 24 } }, /* @__PURE__ */ React.createElement("span", { className: "lock-privacy-ic" }, /* @__PURE__ */ React.createElement(Icon, { name: "shield", size: 16, color: "var(--accent)" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "A tua privacidade \xE9 importante"), /* @__PURE__ */ React.createElement("span", null, "S\xF3 tu tens acesso \xE0s tuas informa\xE7\xF5es financeiras."))), /* @__PURE__ */ React.createElement("div", { className: "lock-foot" }, /* @__PURE__ */ React.createElement("div", { className: "lock-foot-t" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 13, color: "rgba(255,255,255,.5)" }), " ", /* @__PURE__ */ React.createElement("b", null, "Seguran\xE7a em primeiro lugar")), /* @__PURE__ */ React.createElement("span", null, "A tua sess\xE3o ser\xE1 desbloqueada apenas por ti."))))
  );
}
function LockGate({ active }) {
  const [locked, setLocked] = React.useState(() => window.RendeLock.hasPin() && !window.RendeLock.wasUnlocked());
  const lastActivity = React.useRef(Date.now());
  React.useEffect(() => {
    const bump = () => {
      lastActivity.current = Date.now();
    };
    const evs = ["click", "keydown", "mousemove", "touchstart", "scroll"];
    evs.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const onLockNow = () => setLocked(true);
    window.addEventListener("rende-lock-now", onLockNow);
    const iv = setInterval(() => {
      if (active && window.RendeLock.hasPin() && !locked) {
        const mins = window.RendeLock.getMinutes();
        if (Date.now() - lastActivity.current > mins * 6e4) setLocked(true);
      }
    }, 1e3);
    return () => {
      evs.forEach((e) => window.removeEventListener(e, bump));
      window.removeEventListener("rende-lock-now", onLockNow);
      clearInterval(iv);
    };
  }, [active, locked]);
  if (!active || !locked || !window.RendeLock.hasPin()) return null;
  return /* @__PURE__ */ React.createElement(LockScreen, { onUnlock: () => {
    lastActivity.current = Date.now();
    setLocked(false);
  } });
}
function RLPinSetup({ onClose }) {
  const [a, setA] = React.useState("");
  const [b, setB] = React.useState("");
  const [err, setErr] = React.useState("");
  const ok = () => {
    if (!/^\d{4}$/.test(a)) return setErr("O PIN deve ter exatamente 4 d\xEDgitos.");
    if (a !== b) return setErr("Os PINs n\xE3o coincidem.");
    window.RendeLock.setPin(a);
    onClose();
  };
  return /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: "Definir PIN",
      sub: "Protege a app e as a\xE7\xF5es graves",
      onClose,
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: onClose }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: ok }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 15, color: "#fff" }), " Definir"))
    },
    /* @__PURE__ */ React.createElement(Field, { label: "Novo PIN (4 d\xEDgitos)" }, /* @__PURE__ */ React.createElement("input", { className: "input", type: "password", inputMode: "numeric", maxLength: 4, autoFocus: true, value: a, onChange: (e) => setA(e.target.value.replace(/\D/g, "")), placeholder: "\u2022\u2022\u2022\u2022" })),
    /* @__PURE__ */ React.createElement(Field, { label: "Confirmar PIN" }, /* @__PURE__ */ React.createElement("input", { className: "input", type: "password", inputMode: "numeric", maxLength: 4, value: b, onChange: (e) => setB(e.target.value.replace(/\D/g, "")), placeholder: "\u2022\u2022\u2022\u2022" })),
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 13px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 16, color: "var(--accent)" }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", lineHeight: 1.5 } }, "S\xF3 precisas de definir o PIN. No ecr\xE3 de bloqueio podes desbloquear com este PIN ", /* @__PURE__ */ React.createElement("b", null, "ou"), " com a ", /* @__PURE__ */ React.createElement("b", null, "palavra-passe da tua conta"), " (a mesma do in\xEDcio de sess\xE3o) \u2014 n\xE3o \xE9 preciso criar outra.")),
    err && /* @__PURE__ */ React.createElement("div", { className: "alert bad", style: { marginTop: 4, padding: "9px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16, color: "var(--neg)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, err))
  );
}
function RLConfirmPin({ title, desc, onConfirm, onClose }) {
  const fin = useFinance();
  const email = fin && fin.account && fin.account.email || "";
  const temPin = window.RendeLock.hasPin();
  const [val, setVal] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const confirm = async () => {
    if (!val) return setErr(temPin ? "Introduz o teu PIN ou palavra-passe." : "Introduz a tua palavra-passe.");
    setBusy(true);
    try {
      if (temPin && /^\d{4,6}$/.test(val) && window.RendeLock.verify(val)) {
        onConfirm();
        onClose();
        return;
      }
      if (email) {
        try {
          await API.login({ email, password: val });
          onConfirm();
          onClose();
          return;
        } catch (e) {
        }
      }
      setErr(temPin ? "PIN ou palavra-passe incorretos." : "Palavra-passe incorreta.");
      setVal("");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ React.createElement(
    Modal,
    {
      title,
      onClose,
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: onClose }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { className: "btn", style: { background: "var(--neg)", color: "#fff", border: "none", opacity: busy ? 0.7 : 1 }, disabled: busy, onClick: confirm }, busy ? "A verificar\u2026" : "Confirmar"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "muted", style: { fontSize: 13.5, fontWeight: 500, lineHeight: 1.6, marginBottom: 14 } }, desc),
    /* @__PURE__ */ React.createElement(Field, { label: temPin ? "Introduz o teu PIN ou palavra-passe para confirmar" : "Introduz a tua palavra-passe para confirmar" }, /* @__PURE__ */ React.createElement("input", { className: "input", type: "password", autoFocus: true, value: val, onChange: (e) => {
      setVal(e.target.value);
      setErr("");
    }, placeholder: temPin ? "PIN ou palavra-passe" : "Palavra-passe", onKeyDown: (e) => {
      if (e.key === "Enter") confirm();
    } })),
    err && /* @__PURE__ */ React.createElement("div", { className: "alert bad", style: { marginTop: 4, padding: "9px 12px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16, color: "var(--neg)" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700 } }, err))
  );
}
window.LockGate = LockGate;
window.LockScreen = LockScreen;
window.RLPinSetup = RLPinSetup;
window.RLConfirmPin = RLConfirmPin;
