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
const LOCK_PIN_LEN = 6;
function LockScreen({ onUnlock }) {
  const fin = useFinance();
  const acc = fin && fin.account || {};
  const nome = acc.nome || "";
  const email = acc.email || "";
  const [digits, setDigits] = React.useState("");
  const [status, setStatus] = React.useState("idle");
  const [msg, setMsg] = React.useState("");
  const [recuperar, setRecuperar] = React.useState(null);
  const [recBusy, setRecBusy] = React.useState(false);
  const [recErr, setRecErr] = React.useState("");
  const [codigo, setCodigo] = React.useState("");
  const [novaPass, setNovaPass] = React.useState("");
  const [novaPass2, setNovaPass2] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [showPw2, setShowPw2] = React.useState(false);
  const [novoPin, setNovoPin] = React.useState("");
  const [novoPin2, setNovoPin2] = React.useState("");
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  const okUnlock = () => {
    setStatus("ok");
    window.RendeLock.markUnlocked();
    setTimeout(onUnlock, 260);
  };
  const falhar = () => {
    setStatus("error");
    setMsg("PIN incorreto. Tente novamente.");
    setTimeout(() => {
      setDigits("");
      setStatus("idle");
      setMsg("");
    }, 640);
  };
  const validar = (str) => {
    setStatus("validating");
    setTimeout(() => {
      if (window.RendeLock.verify(str)) okUnlock();
      else falhar();
    }, 220);
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
  const apagar = () => {
    if (status !== "idle") return;
    setDigits((s) => s.slice(0, -1));
  };
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
    setRecBusy(true);
    setRecErr("");
    try {
      await fin.esqueciPassword(email);
      setRecuperar("code");
    } catch (e) {
      setRecErr(e.message || "N\xE3o foi poss\xEDvel enviar o c\xF3digo. Tenta novamente.");
    } finally {
      setRecBusy(false);
    }
  };
  const reenviarCodigo = async () => {
    setRecBusy(true);
    setRecErr("");
    try {
      await fin.esqueciPassword(email);
      setRecErr("");
    } catch (e) {
      setRecErr(e.message || "N\xE3o foi poss\xEDvel reenviar o c\xF3digo.");
    } finally {
      setRecBusy(false);
    }
  };
  const confirmarCodigo = async () => {
    if (!/^\d{6}$/.test(codigo.trim())) return setRecErr("Introduz o c\xF3digo de 6 d\xEDgitos.");
    if (!pwStrong(novaPass)) return setRecErr("A nova palavra-passe \xE9 demasiado fraca.");
    if (novaPass !== novaPass2) return setRecErr("As palavras-passe n\xE3o coincidem.");
    setRecBusy(true);
    setRecErr("");
    try {
      await fin.redefinirPassword(email, codigo, novaPass);
      setRecuperar("newpin");
    } catch (e) {
      setRecErr(e.message || "C\xF3digo inv\xE1lido ou expirado.");
    } finally {
      setRecBusy(false);
    }
  };
  const confirmarNovoPin = () => {
    if (!/^\d{6}$/.test(novoPin)) return setRecErr("O PIN deve ter exatamente 6 d\xEDgitos.");
    if (novoPin !== novoPin2) return setRecErr("Os PINs n\xE3o coincidem.");
    window.RendeLock.setPin(novoPin);
    okUnlock();
  };
  const erro = status === "error";
  const ocupado = status === "validating" || status === "ok";
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
    /* @__PURE__ */ React.createElement("span", { className: "lock-shape s1", "aria-hidden": "true" }),
    /* @__PURE__ */ React.createElement("span", { className: "lock-shape s2", "aria-hidden": "true" }),
    /* @__PURE__ */ React.createElement("span", { className: "lock-shape s3", "aria-hidden": "true" }),
    /* @__PURE__ */ React.createElement("div", { className: "lock-card" }, !recuperar ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "lock-user" }, /* @__PURE__ */ React.createElement(Avatar, { account: acc, size: 64 }), /* @__PURE__ */ React.createElement("div", { className: "lock-user-name" }, nome || "A tua conta"), /* @__PURE__ */ React.createElement("p", { className: "lock-user-sub" }, "Introduza o seu PIN para desbloquear o Rende+.")), /* @__PURE__ */ React.createElement("div", { className: "lock-pin" + (erro ? " shake" : ""), role: "status", "aria-label": "PIN, " + digits.length + " de " + LOCK_PIN_LEN + " d\xEDgitos" }, Array.from({ length: LOCK_PIN_LEN }).map((_, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "lock-dot" + (i < digits.length ? " filled" : "") + (erro ? " err" : "") }))), /* @__PURE__ */ React.createElement("div", { className: "lock-feedback" + (erro ? " show" : ""), role: "alert", "aria-live": "assertive" }, msg), /* @__PURE__ */ React.createElement("div", { className: "lock-keypad" }, [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => /* @__PURE__ */ React.createElement("button", { type: "button", key: n, className: "lock-key", disabled: ocupado, onClick: () => push(String(n)), "aria-label": "D\xEDgito " + n }, n)), /* @__PURE__ */ React.createElement("span", { className: "lock-key lock-key-blank", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "lock-key", disabled: ocupado, onClick: () => push("0"), "aria-label": "D\xEDgito 0" }, "0"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "lock-key lock-key-del", disabled: ocupado || !digits.length, onClick: apagar, "aria-label": "Apagar d\xEDgito" }, "Apagar")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "lock-forgot", onClick: () => setRecuperar("confirm") }, "Esqueceu-se do PIN?")) : /* @__PURE__ */ React.createElement("div", { className: "lock-recover" }, /* @__PURE__ */ React.createElement("div", { className: "lock-recover-ico" }, /* @__PURE__ */ React.createElement(Icon, { name: "shield", size: 20, color: "var(--accent)" })), recuperar === "confirm" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "lock-recover-title" }, "Recuperar acesso"), /* @__PURE__ */ React.createElement("p", { className: "lock-recover-txt" }, "Vamos enviar um c\xF3digo de verifica\xE7\xE3o de 6 d\xEDgitos para ", /* @__PURE__ */ React.createElement("b", null, email), ". Com ele, pode definir uma nova palavra-passe e um novo PIN sem sair daqui."), recErr && /* @__PURE__ */ React.createElement("div", { className: "lock-recover-err" }, recErr), /* @__PURE__ */ React.createElement("div", { className: "lock-recover-actions" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost", onClick: () => {
      setRecuperar(null);
      setRecErr("");
    } }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-primary", disabled: recBusy, onClick: enviarRecuperacao }, recBusy ? "A enviar\u2026" : "Enviar c\xF3digo"))) : recuperar === "code" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "lock-recover-title" }, "Introduza o c\xF3digo"), /* @__PURE__ */ React.createElement("p", { className: "lock-recover-txt" }, "Envi\xE1mos um c\xF3digo de 6 d\xEDgitos para ", /* @__PURE__ */ React.createElement("b", null, email), ". Introduza-o e defina uma nova palavra-passe de acesso."), /* @__PURE__ */ React.createElement("div", { className: "lock-recover-form" }, /* @__PURE__ */ React.createElement(Field, { label: "C\xF3digo de verifica\xE7\xE3o" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "input",
        inputMode: "numeric",
        maxLength: 6,
        autoFocus: true,
        value: codigo,
        onChange: (e) => {
          setCodigo(e.target.value.replace(/\D/g, ""));
          setRecErr("");
        },
        placeholder: "000000"
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "Nova palavra-passe" }, /* @__PURE__ */ React.createElement(PwInput, { value: novaPass, onChange: (e) => {
      setNovaPass(e.target.value);
      setRecErr("");
    }, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", show: showPw, toggle: () => setShowPw((v) => !v), autoComplete: "new-password" })), novaPass && /* @__PURE__ */ React.createElement(Strength, { value: novaPass }), /* @__PURE__ */ React.createElement(Field, { label: "Confirmar palavra-passe" }, /* @__PURE__ */ React.createElement(PwInput, { value: novaPass2, onChange: (e) => {
      setNovaPass2(e.target.value);
      setRecErr("");
    }, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", show: showPw2, toggle: () => setShowPw2((v) => !v), autoComplete: "new-password", disabled: !pwStrong(novaPass) }))), recErr && /* @__PURE__ */ React.createElement("div", { className: "lock-recover-err" }, recErr), /* @__PURE__ */ React.createElement("button", { type: "button", className: "lock-forgot", onClick: reenviarCodigo }, "Reenviar c\xF3digo"), /* @__PURE__ */ React.createElement("div", { className: "lock-recover-actions" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost", onClick: () => {
      setRecuperar(null);
      setRecErr("");
    } }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-primary", disabled: recBusy, onClick: confirmarCodigo }, recBusy ? "A confirmar\u2026" : "Confirmar"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "lock-recover-title" }, "Defina um novo PIN"), /* @__PURE__ */ React.createElement("p", { className: "lock-recover-txt" }, "A sua conta foi recuperada. Defina um novo PIN de 6 d\xEDgitos para desbloquear rapidamente o Rende+ da pr\xF3xima vez."), /* @__PURE__ */ React.createElement("div", { className: "lock-recover-form" }, /* @__PURE__ */ React.createElement(Field, { label: "Novo PIN (6 d\xEDgitos)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "input",
        type: "password",
        inputMode: "numeric",
        maxLength: 6,
        autoFocus: true,
        value: novoPin,
        onChange: (e) => {
          setNovoPin(e.target.value.replace(/\D/g, ""));
          setRecErr("");
        },
        placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022"
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "Confirmar PIN" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "input",
        type: "password",
        inputMode: "numeric",
        maxLength: 6,
        value: novoPin2,
        onChange: (e) => {
          setNovoPin2(e.target.value.replace(/\D/g, ""));
          setRecErr("");
        },
        placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022"
      }
    ))), recErr && /* @__PURE__ */ React.createElement("div", { className: "lock-recover-err" }, recErr), /* @__PURE__ */ React.createElement("div", { className: "lock-recover-actions" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost", onClick: okUnlock }, "Saltar por agora"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-primary", onClick: confirmarNovoPin }, "Concluir")))), /* @__PURE__ */ React.createElement("div", { className: "lock-security" }, /* @__PURE__ */ React.createElement(Icon, { name: "shield", size: 13, color: "var(--ink-3)" }), " A sua sess\xE3o permanece protegida com encripta\xE7\xE3o segura."))
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
    if (!/^\d{6}$/.test(a)) return setErr("O PIN deve ter exatamente 6 d\xEDgitos.");
    if (a !== b) return setErr("Os PINs n\xE3o coincidem.");
    window.RendeLock.setPin(a);
    onClose();
  };
  const aside = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "modal-info-title" }, "Como funciona"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", lineHeight: 1.55 } }, "Este PIN de 6 d\xEDgitos \xE9 usado apenas no ecr\xE3 de bloqueio, para desbloquear rapidamente o Rende+ sem escrever a palavra-passe. Se o esqueceres, podes repor a partir do ecr\xE3 de bloqueio."));
  return /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: "Definir PIN",
      sub: "Protege a app e as a\xE7\xF5es graves",
      icon: "lock",
      onClose,
      aside,
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: onClose }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: ok }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 15, color: "#fff" }), " Definir"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "modal-row-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Novo PIN (6 d\xEDgitos)" }, /* @__PURE__ */ React.createElement("input", { className: "input", type: "password", inputMode: "numeric", maxLength: 6, autoFocus: true, value: a, onChange: (e) => setA(e.target.value.replace(/\D/g, "")), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022" })), /* @__PURE__ */ React.createElement(Field, { label: "Confirmar PIN" }, /* @__PURE__ */ React.createElement("input", { className: "input", type: "password", inputMode: "numeric", maxLength: 6, value: b, onChange: (e) => setB(e.target.value.replace(/\D/g, "")), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022" }))),
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
      sub: "Confirma\xE7\xE3o de seguran\xE7a",
      icon: "shield",
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
