import { useEffect, useRef, useMemo, useState, forwardRef } from 'react';

const LAYOUT = [
  { x: 14, y: 20, size: "l", rot: -3.2, depth: 0.9 },
  { x: 38, y: 14, size: "m", rot:  2.1, depth: 0.6 },
  { x: 60, y: 22, size: "l", rot: -1.4, depth: 1.0 },
  { x: 83, y: 18, size: "s", rot:  4.0, depth: 0.5 },
  { x: 10, y: 58, size: "m", rot:  3.3, depth: 0.7 },
  { x: 30, y: 70, size: "s", rot: -2.6, depth: 0.4 },
  { x: 50, y: 60, size: "m", rot:  1.8, depth: 0.8 },
  { x: 72, y: 64, size: "l", rot: -2.2, depth: 1.1 },
  { x: 89, y: 52, size: "s", rot:  3.6, depth: 0.5 },
  { x: 22, y: 88, size: "s", rot: -3.8, depth: 0.6 },
  { x: 56, y: 90, size: "m", rot:  2.4, depth: 0.7 },
  { x: 80, y: 86, size: "s", rot: -1.6, depth: 0.5 },
];

const SIZE_PX_BASE = {
  s: { w: 220, h: 150 },
  m: { w: 280, h: 200 },
  l: { w: 340, h: 240 },
};

function sizePx(size, scale) {
  const b = SIZE_PX_BASE[size];
  return { w: Math.round(b.w * scale), h: Math.round(b.h * scale) };
}

function tintVar(n) { return `var(--tint-${((n - 1) % 8) + 1})`; }

const Card = forwardRef(function Card({ entry, layout, onOpen, focused, hidden }, ref) {
  const [hovered, setHovered] = useState(false);
  const sz = sizePx(layout.size, layout.scale || 1);

  return (
    <div
      ref={ref}
      data-id={entry.id}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(entry.id)}
      style={{
        position: "absolute",
        width: sz.w,
        height: sz.h,
        left: `calc(${layout.x}% - ${sz.w / 2}px)`,
        top:  `calc(${layout.y}% - ${sz.h / 2}px)`,
        "--rot": `${layout.rot}deg`,
        transform: `
          translate3d(var(--tx, 0px), var(--ty, 0px), 0)
          rotate(calc(var(--rot) + var(--tr, 0deg)))
          scale(var(--sc, 1))
        `,
        transition: "transform 600ms cubic-bezier(.2,.8,.2,1), opacity 500ms ease, filter 400ms ease",
        opacity: hidden ? 0 : 1,
        filter: focused === false ? "blur(2px) saturate(0.85)" : "none",
        pointerEvents: hidden ? "none" : "auto",
        zIndex: hovered ? 20 : 5,
      }}
    >
      <div
        style={{
          position: "absolute", inset: 0,
          background: tintVar(entry.tint),
          borderRadius: 4,
          boxShadow: hovered ? "var(--shadow-lift)" : "var(--shadow-rest)",
          transform: hovered ? "translateY(-6px) scale(1.025)" : "translateY(0) scale(1)",
          transition: "transform 500ms cubic-bezier(.2,.8,.2,1), box-shadow 400ms ease",
          padding: layout.size === "s" ? "18px 20px" : layout.size === "m" ? "22px 24px" : "28px 30px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        <div style={{
          fontFamily: "var(--sans)",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--ink-faint)",
          display: "flex",
          gap: 12,
        }}>
          <span>{entry.date}</span>
          <span style={{ color: "var(--accent-soft)" }}>·</span>
          <span style={{ fontStyle: "italic", textTransform: "lowercase", letterSpacing: "0.04em", fontFamily: "var(--serif)", fontSize: 13 }}>
            {entry.mood}
          </span>
        </div>

        <div style={{
          fontFamily: "var(--serif)",
          fontWeight: 400,
          fontVariationSettings: "'opsz' 36",
          fontSize: layout.size === "s" ? 22 : layout.size === "m" ? 27 : 33,
          lineHeight: 1.18,
          color: "var(--ink)",
          letterSpacing: "-0.012em",
          textWrap: "balance",
        }}>
          {entry.title}
        </div>

        {layout.size !== "s" && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "var(--sans)",
            fontSize: 11,
            color: "var(--ink-ghost)",
            letterSpacing: "0.06em",
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--paper-edge)" }} />
            <span>{entry.weather}</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default function Garden({ entries, onOpen, focusedId, hiddenIds, cardRefsStore }) {
  const stageRef = useRef(null);
  const cardRefs = useRef({});
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const rafRef = useRef(null);

  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => {
    function onResize() { setVw(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const cardScale = vw < 760 ? 0.62 : vw < 1024 ? 0.78 : vw < 1280 ? 0.9 : 1;

  const slots = useMemo(() => {
    return entries.map((e, i) => ({
      ...LAYOUT[i % LAYOUT.length],
      scale: cardScale,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      phaseR: Math.random() * Math.PI * 2,
      speed:  0.35 + Math.random() * 0.25,
    }));
  }, [entries, cardScale]);

  useEffect(() => {
    function onMove(e) {
      const r = stageRef.current?.getBoundingClientRect();
      if (!r) return;
      mouseRef.current.x = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      mouseRef.current.y = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    }
    function onLeave() { mouseRef.current.x = 0; mouseRef.current.y = 0; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useEffect(() => {
    const start = performance.now();
    function tick(now) {
      const t = (now - start) / 1000;
      const m = mouseRef.current;
      m.tx += (m.x - m.tx) * 0.06;
      m.ty += (m.y - m.ty) * 0.06;

      entries.forEach((e, i) => {
        const ref = cardRefs.current[e.id];
        if (!ref) return;
        const s = slots[i];
        const driftX = Math.sin(t * 0.35 * s.speed + s.phaseX) * 8;
        const driftY = Math.cos(t * 0.30 * s.speed + s.phaseY) * 10;
        const driftR = Math.sin(t * 0.20 * s.speed + s.phaseR) * 0.8;
        const px = -m.tx * 22 * s.depth;
        const py = -m.ty * 18 * s.depth;
        ref.style.setProperty("--tx", `${driftX + px}px`);
        ref.style.setProperty("--ty", `${driftY + py}px`);
        ref.style.setProperty("--tr", `${driftR}deg`);
      });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [entries, slots]);

  // Expose getCardRect to parent via callback ref store
  useEffect(() => {
    if (cardRefsStore) {
      cardRefsStore.current = {
        getCardRect: (id) => {
          const el = cardRefs.current[id];
          return el ? el.getBoundingClientRect() : null;
        }
      };
    }
  });

  return (
    <div
      ref={stageRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: 3,
      }}
    >
      {entries.map((e, i) => (
        <Card
          key={e.id}
          ref={(el) => { if (el) cardRefs.current[e.id] = el; }}
          entry={e}
          layout={slots[i]}
          onOpen={onOpen}
          focused={focusedId == null ? null : focusedId === e.id}
          hidden={hiddenIds && hiddenIds.has(e.id)}
        />
      ))}
    </div>
  );
}
