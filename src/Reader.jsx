import { useEffect, useRef, useState, useMemo } from 'react';

function tintR(n) { return `var(--tint-${((n - 1) % 8) + 1})`; }

export default function Reader({ entry, fromRect, onClose }) {
  const wrapRef = useRef(null);
  const [phase, setPhase] = useState("opening");
  const [released, setReleased] = useState(false);
  const [hint, setHint] = useState(true);

  const target = useMemo(() => {
    const W = Math.min(720, window.innerWidth - 80);
    const H = Math.min(window.innerHeight - 80, 760);
    return {
      left: (window.innerWidth - W) / 2,
      top:  (window.innerHeight - H) / 2,
      width: W,
      height: H,
    };
  }, []);

  const startXform = useMemo(() => {
    if (!fromRect) return null;
    const sx = fromRect.width  / target.width;
    const sy = fromRect.height / target.height;
    const tx = fromRect.left + fromRect.width  / 2 - (target.left + target.width  / 2);
    const ty = fromRect.top  + fromRect.height / 2 - (target.top  + target.height / 2);
    return `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
  }, [fromRect, target]);

  useEffect(() => {
    const id1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setReleased(true);
        setTimeout(() => setPhase("open"), 620);
      });
    });
    return () => cancelAnimationFrame(id1);
  }, []);

  function close() {
    if (phase === "closing") return;
    setReleased(false);
    setPhase("closing");
    setTimeout(() => onClose && onClose(), 540);
  }

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") close(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <div
        onClick={close}
        style={{
          position: "fixed", inset: 0, zIndex: 40,
          background: "oklch(0.18 0.020 60 / 0.30)",
          backdropFilter: "blur(2px)",
          opacity: phase === "closing" ? 0 : (phase === "opening" ? 0.6 : 1),
          transition: "opacity 500ms ease",
        }}
      />

      <div
        ref={wrapRef}
        style={{
          position: "fixed",
          zIndex: 50,
          left:   target.left,
          top:    target.top,
          width:  target.width,
          height: target.height,
          transform: released ? "translate(0,0) scale(1,1)" : (startXform || "translate(0,0) scale(1,1)"),
          transformOrigin: "center center",
          transition: "transform 620ms cubic-bezier(.2,.8,.2,1)",
          willChange: "transform",
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0,
            background: tintR(entry.tint),
            borderRadius: phase === "open" ? 6 : 4,
            boxShadow: phase === "opening" || phase === "closing"
              ? "var(--shadow-rest)"
              : "0 30px 80px -20px rgba(60,40,20,0.35), 0 8px 24px -8px rgba(60,40,20,0.18)",
            transition: "border-radius 500ms ease, box-shadow 600ms ease",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "44px 56px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div style={{
              display: "flex",
              gap: 14,
              fontFamily: "var(--sans)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-faint)",
              alignItems: "center",
            }}>
              <span>{entry.date}</span>
              <span style={{ color: "var(--accent-soft)" }}>·</span>
              <span style={{ fontStyle: "italic", textTransform: "lowercase", letterSpacing: "0.04em", fontFamily: "var(--serif)", fontSize: 14 }}>
                {entry.mood}
              </span>
              <span style={{ color: "var(--accent-soft)" }}>·</span>
              <span>{entry.weather}</span>

              <button
                onClick={close}
                aria-label="Close"
                style={{
                  marginLeft: "auto",
                  fontFamily: "var(--sans)",
                  fontSize: 12,
                  color: "var(--ink-faint)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  opacity: phase === "open" ? 1 : 0,
                  transition: "opacity 400ms ease 200ms",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <span style={{ width: 14, height: 1, background: "currentColor" }} />
                close
              </button>
            </div>

            <h1
              style={{
                margin: 0,
                fontFamily: "var(--serif)",
                fontWeight: 400,
                fontVariationSettings: "'opsz' 60",
                fontSize: "clamp(36px, 4.4vw, 52px)",
                lineHeight: 1.08,
                letterSpacing: "-0.018em",
                color: "var(--ink)",
                textWrap: "balance",
              }}
            >
              {entry.title}
            </h1>
          </div>

          <div
            style={{
              padding: "0 56px 56px",
              flex: 1,
              overflow: "auto",
              opacity: phase === "open" ? 1 : 0,
              transform: phase === "open" ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 500ms ease 220ms, transform 500ms ease 220ms",
            }}
          >
            <div style={{
              height: 1,
              background: "var(--paper-edge)",
              margin: "8px 0 28px",
              transformOrigin: "left center",
              transform: phase === "open" ? "scaleX(1)" : "scaleX(0)",
              transition: "transform 700ms cubic-bezier(.2,.8,.2,1) 280ms",
            }} />
            {entry.body.map((p, i) => (
              <p
                key={i}
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 19,
                  lineHeight: 1.62,
                  color: "var(--ink-soft)",
                  margin: "0 0 1.1em",
                  textWrap: "pretty",
                  opacity: phase === "open" ? 1 : 0,
                  transform: phase === "open" ? "translateY(0)" : "translateY(6px)",
                  transition: `opacity 500ms ease ${340 + i * 90}ms, transform 500ms ease ${340 + i * 90}ms`,
                }}
              >
                {p}
              </p>
            ))}

            <div style={{
              marginTop: 36,
              fontFamily: "var(--hand)",
              fontSize: 22,
              color: "var(--accent)",
              opacity: phase === "open" ? 0.85 : 0,
              transition: `opacity 600ms ease ${340 + entry.body.length * 90 + 100}ms`,
            }}>
              — {entry.date.split(",")[0].toLowerCase()}
            </div>
          </div>
        </div>

        <div style={{
          position: "absolute",
          bottom: -34, left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "var(--sans)",
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--ink-ghost)",
          opacity: phase === "open" && hint ? 1 : 0,
          transition: "opacity 600ms ease",
          whiteSpace: "nowrap",
        }}>
          esc · or click outside
        </div>
      </div>
    </>
  );
}
