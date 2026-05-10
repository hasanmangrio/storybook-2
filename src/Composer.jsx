import { useEffect, useRef, useState } from 'react';

const MOODS = [
  { key: "tender",    tint: 6 },
  { key: "warm",      tint: 2 },
  { key: "still",     tint: 5 },
  { key: "stubborn",  tint: 7 },
  { key: "in flow",   tint: 8 },
  { key: "small joy", tint: 3 },
  { key: "rooted",    tint: 4 },
  { key: "grateful",  tint: 1 },
];

function tintC(n) { return `var(--tint-${((n - 1) % 8) + 1})`; }

function todayPretty() {
  const d = new Date();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  return {
    long: `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`,
    short: `${months[d.getMonth()].slice(0,3)} ${d.getDate()}, ${d.getFullYear()}`,
  };
}

export default function Composer({ onSave, onCancel, mountRect }) {
  const [phase, setPhase] = useState("opening");
  const [title, setTitle] = useState("");
  const [body, setBody]   = useState("");
  const [mood, setMood]   = useState(MOODS[0]);
  const [weather, setWeather] = useState("48° • clear");
  const [breathing, setBreathing] = useState(false);
  const [ripples, setRipples] = useState([]);
  const wrapRef = useRef(null);
  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  const pauseTimerRef = useRef(null);
  const today = todayPretty();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (mountRect) {
      el.style.left = mountRect.left + "px";
      el.style.top  = mountRect.top + "px";
      el.style.width  = mountRect.width + "px";
      el.style.height = mountRect.height + "px";
      el.style.borderRadius = "999px";
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.left = "0px"; el.style.top = "0px";
      el.style.width = "100vw"; el.style.height = "100vh";
      el.style.borderRadius = "0px";
      setTimeout(() => {
        setPhase("open");
        setTimeout(() => titleRef.current && titleRef.current.focus(), 60);
      }, 620);
    }));
  }, []);

  function onBodyChange(e) {
    setBody(e.target.value);
    setBreathing(false);
    clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => setBreathing(true), 1400);
  }

  function maybeRipple(e) {
    if (e.key !== " " && e.key !== "Enter") return;
    const ta = bodyRef.current;
    if (!ta) return;
    const r = ta.getBoundingClientRect();
    const x = r.left + Math.min(r.width - 40, 80 + Math.random() * (r.width - 200));
    const y = r.top  + 60 + Math.random() * Math.max(20, r.height - 200);
    const id = Math.random().toString(36).slice(2);
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(p => p.id !== id)), 1400);
  }

  function close() {
    setPhase("closing");
    const el = wrapRef.current;
    if (el && mountRect) {
      el.style.left = mountRect.left + "px";
      el.style.top  = mountRect.top + "px";
      el.style.width  = mountRect.width + "px";
      el.style.height = mountRect.height + "px";
      el.style.borderRadius = "999px";
    }
    setTimeout(() => onCancel && onCancel(), 540);
  }

  function save() {
    if (!title.trim() && !body.trim()) { close(); return; }
    setPhase("saving");
    setTimeout(() => {
      onSave && onSave({
        id: "e-" + Math.random().toString(36).slice(2, 8),
        title: title.trim() || "Untitled",
        date: today.short,
        mood: mood.key,
        weather,
        tint: mood.tint,
        body: body.split(/\n\n+/).map(s => s.trim()).filter(Boolean),
      });
    }, 680);
  }

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <div
      ref={wrapRef}
      style={{
        position: "fixed",
        zIndex: 60,
        background: tintC(mood.tint),
        boxShadow: "0 30px 80px -20px rgba(60,40,20,0.35)",
        overflow: "hidden",
        transition: "left 620ms cubic-bezier(.2,.8,.2,1), top 620ms cubic-bezier(.2,.8,.2,1), width 620ms cubic-bezier(.2,.8,.2,1), height 620ms cubic-bezier(.2,.8,.2,1), border-radius 620ms cubic-bezier(.2,.8,.2,1), background 800ms ease, transform 600ms cubic-bezier(.2,.8,.2,1), opacity 500ms ease",
        opacity: phase === "saving" ? 0 : 1,
        transform: phase === "saving" ? "scale(0.94)" : "scale(1)",
      }}
    >
      {/* Breathing aura */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 45%, transparent 50%, oklch(0.88 0.025 60 / 0.45) 100%)",
        opacity: breathing ? 1 : 0.45,
        transform: breathing ? "scale(1.04)" : "scale(1)",
        transition: "opacity 2.4s ease, transform 2.4s ease",
      }} />

      {ripples.map(r => (
        <div key={r.id} style={{
          position: "fixed",
          left: r.x, top: r.y,
          width: 6, height: 6,
          marginLeft: -3, marginTop: -3,
          borderRadius: "50%",
          border: "1px solid var(--ink-ghost)",
          opacity: 0.55,
          pointerEvents: "none",
          animation: "rippleOut 1.4s cubic-bezier(.2,.8,.2,1) forwards",
        }} />
      ))}

      {/* Top chrome */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "28px 40px",
        display: "flex", alignItems: "center", gap: 18,
        opacity: phase === "open" ? 1 : 0,
        transition: "opacity 500ms ease 250ms",
        zIndex: 4,
      }}>
        <button
          onClick={close}
          style={{
            fontFamily: "var(--sans)", fontSize: 12,
            letterSpacing: "0.14em", textTransform: "uppercase",
            color: "var(--ink-faint)",
            display: "flex", alignItems: "center", gap: 10,
          }}
        >
          <span style={{ width: 18, height: 1, background: "currentColor" }} />
          back to garden
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={save}
          style={{
            fontFamily: "var(--sans)", fontSize: 12,
            letterSpacing: "0.14em", textTransform: "uppercase",
            color: "var(--accent)",
            display: "flex", alignItems: "center", gap: 10,
          }}
        >
          plant in garden
          <span style={{ width: 18, height: 1, background: "currentColor" }} />
        </button>
      </div>

      {/* Writing column */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        padding: "100px 40px 60px",
        opacity: phase === "open" ? 1 : 0,
        transition: "opacity 700ms ease 200ms",
      }}>
        <div style={{ width: "min(720px, 100%)", display: "flex", flexDirection: "column", gap: 24 }}>

          <div style={{
            display: "flex", alignItems: "baseline", gap: 14,
            color: "var(--ink-faint)",
          }}>
            <span style={{
              fontFamily: "var(--hand)",
              fontSize: 28,
              color: "var(--accent)",
              lineHeight: 1,
            }}>
              {today.long}
            </span>
            <span style={{ flex: 1, height: 1, background: "var(--paper-edge)" }} />
            <input
              value={weather}
              onChange={e => setWeather(e.target.value)}
              spellCheck={false}
              style={{
                fontFamily: "var(--sans)", fontSize: 11,
                letterSpacing: "0.14em", textTransform: "uppercase",
                color: "var(--ink-faint)",
                width: 130, textAlign: "right",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontFamily: "var(--sans)", fontSize: 11,
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: "var(--ink-ghost)",
              marginRight: 6,
            }}>
              today feels
            </span>
            {MOODS.map(m => (
              <button
                key={m.key}
                onClick={() => setMood(m)}
                style={{
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                  fontSize: 16,
                  color: mood.key === m.key ? "var(--accent)" : "var(--ink-faint)",
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: mood.key === m.key ? "oklch(0.98 0.012 60 / 0.7)" : "transparent",
                  transition: "background 400ms ease, color 400ms ease, transform 300ms cubic-bezier(.2,.8,.2,1)",
                  transform: mood.key === m.key ? "translateY(-1px)" : "translateY(0)",
                }}
              >
                {m.key}
              </button>
            ))}
          </div>

          <div style={{ position: "relative", marginTop: 12 }}>
            {!title && (
              <div style={{
                position: "absolute",
                inset: 0,
                fontFamily: "var(--serif)",
                fontWeight: 400,
                fontVariationSettings: "'opsz' 60",
                fontSize: "clamp(34px, 4.2vw, 48px)",
                lineHeight: 1.1,
                letterSpacing: "-0.018em",
                color: "var(--ink-ghost)",
                pointerEvents: "none",
                fontStyle: "italic",
              }}>
                what's the small headline of today?
              </div>
            )}
            <input
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  bodyRef.current && bodyRef.current.focus();
                }
              }}
              style={{
                width: "100%",
                fontFamily: "var(--serif)",
                fontWeight: 400,
                fontVariationSettings: "'opsz' 60",
                fontSize: "clamp(34px, 4.2vw, 48px)",
                lineHeight: 1.1,
                letterSpacing: "-0.018em",
                color: "var(--ink)",
                caretColor: "var(--accent)",
              }}
            />
          </div>

          <div style={{ height: 1, background: "var(--paper-edge)" }} />

          <div style={{ position: "relative" }}>
            {!body && (
              <div style={{
                position: "absolute",
                top: 0, left: 0,
                fontFamily: "var(--serif)",
                fontSize: 19,
                lineHeight: 1.62,
                color: "var(--ink-ghost)",
                pointerEvents: "none",
                fontStyle: "italic",
              }}>
                tell yourself the story. nobody else has to read this.
              </div>
            )}
            <textarea
              ref={bodyRef}
              value={body}
              onChange={onBodyChange}
              onKeyDown={maybeRipple}
              rows={14}
              style={{
                width: "100%",
                resize: "none",
                fontFamily: "var(--serif)",
                fontSize: 19,
                lineHeight: 1.62,
                color: "var(--ink-soft)",
                caretColor: "var(--accent)",
                minHeight: "calc(100vh - 480px)",
              }}
            />
          </div>
        </div>
      </div>

      <div style={{
        position: "absolute",
        bottom: 28, right: 40,
        fontFamily: "var(--sans)",
        fontSize: 11,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--ink-ghost)",
        opacity: phase === "open" && wordCount > 0 ? 1 : 0,
        transition: "opacity 500ms ease",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--accent)",
          opacity: breathing ? 0.4 : 1,
          transition: "opacity 1.2s ease",
        }} />
        {wordCount} {wordCount === 1 ? "word" : "words"}
      </div>
    </div>
  );
}
