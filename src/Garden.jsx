import { useEffect, useRef, useMemo, useState, forwardRef, useCallback } from 'react';

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

// Hand-tuned shuffled-deck offsets. Index 0 = front card (centered, no rotation).
const STACK_OFFSETS = [
  { x:  0,  y:  0,  r:  0.0 },
  { x: -5,  y:  3,  r: -2.5 },
  { x:  7,  y:  2,  r:  3.2 },
  { x: -3,  y:  5,  r: -1.8 },
  { x:  6,  y: -3,  r:  2.8 },
  { x: -8,  y:  4,  r: -3.5 },
  { x:  4,  y:  6,  r:  1.5 },
  { x: -6,  y:  2,  r: -2.2 },
  { x:  9,  y: -2,  r:  4.0 },
  { x: -4,  y:  7,  r: -1.2 },
  { x:  5,  y: -5,  r:  3.0 },
  { x: -9,  y:  3,  r: -3.8 },
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

const Card = forwardRef(function Card(
  { entry, layout, onOpen, onCardMouseDown, focused, hidden, dragging, mode, deckZIndex },
  ref
) {
  const [hovered, setHovered] = useState(false);
  const hasPhoto = entry.photos && entry.photos.length > 0;
  const coverPhoto = hasPhoto ? entry.photos[0] : null;

  // ── Grid mode: simple uniform sticky note, no animation ──────────────────
  if (mode === 'grid') {
    return (
      <div
        ref={ref}
        data-id={entry.id}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onOpen(entry.id)}
        style={{
          position: "relative",
          opacity: hidden ? 0 : 1,
          pointerEvents: hidden ? "none" : "auto",
          userSelect: "none",
        }}
      >
        <div style={{
          background: tintVar(entry.tint),
          borderRadius: 4,
          boxShadow: hovered ? "var(--shadow-lift)" : "var(--shadow-rest)",
          transform: hovered ? "translateY(-4px) scale(1.015)" : "translateY(0) scale(1)",
          transition: "transform 300ms cubic-bezier(.2,.8,.2,1), box-shadow 300ms ease",
          padding: "12px 14px",
          aspectRatio: "5 / 3",
          display: "flex",
          flexDirection: "column",
          justifyContent: hasPhoto ? "flex-start" : "space-between",
          gap: hasPhoto ? 6 : 0,
          overflow: "hidden",
          cursor: "pointer",
        }}>
          {/* Date + mood */}
          <div style={{
            fontFamily: "var(--sans)", fontSize: 8,
            letterSpacing: "0.10em", textTransform: "uppercase",
            color: "var(--ink-faint)", display: "flex", gap: 5, flexShrink: 0,
          }}>
            <span>{entry.date}</span>
            <span style={{ color: "var(--accent-soft)" }}>·</span>
            <span style={{ fontStyle: "italic", textTransform: "lowercase", fontFamily: "var(--serif)", fontSize: 10 }}>
              {entry.mood}
            </span>
          </div>

          {/* Cover photo */}
          {coverPhoto && (
            <div style={{ flex: 1, borderRadius: 8, overflow: "hidden", minHeight: 0, background: "oklch(0 0 0 / 0.08)" }}>
              <img src={coverPhoto.dataUrl} alt={coverPhoto.caption || entry.title} draggable={false}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          )}

          {/* Title */}
          <div style={{
            fontFamily: "var(--serif)", fontWeight: 400,
            fontVariationSettings: "'opsz' 36",
            fontSize: hasPhoto ? 14 : 22,
            lineHeight: 1.2, color: "var(--ink)",
            letterSpacing: "-0.012em", textWrap: "balance", flexShrink: 0,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}>
            {entry.title}
          </div>

          {/* Weather line */}
          {!hasPhoto && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--sans)", fontSize: 9, color: "var(--ink-ghost)" }}>
              <div style={{ flex: 1, height: 1, background: "var(--paper-edge)" }} />
              <span>{entry.weather}</span>
            </div>
          )}

          {/* Photo count badge */}
          {entry.photos && entry.photos.length > 1 && (
            <div style={{
              position: "absolute", top: 10, right: 10,
              background: "oklch(0 0 0 / 0.45)", color: "#fff",
              borderRadius: 99, padding: "2px 6px",
              fontFamily: "var(--sans)", fontSize: 9, letterSpacing: "0.08em",
            }}>
              {entry.photos.length}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Float / Deck mode ─────────────────────────────────────────────────────
  const sz = sizePx(layout.size, layout.scale || 1);

  const cursor = mode === 'deck'
    ? 'pointer'
    : dragging ? 'grabbing' : 'grab';

  const zIndex = mode === 'deck'
    ? (deckZIndex ?? 5)
    : (dragging ? 100 : (hovered ? 20 : 5));

  const pad = layout.size === "s" ? 14 : layout.size === "m" ? 18 : 22;

  return (
    <div
      ref={ref}
      data-id={entry.id}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={onCardMouseDown}
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
        transition: "opacity 500ms ease, filter 400ms ease",
        opacity: hidden ? 0 : (mode === 'deck' && focused === false ? 0.6 : 1),
        filter: focused === false && mode !== 'deck' ? "blur(2px) saturate(0.85)" : "none",
        pointerEvents: hidden ? "none" : "auto",
        zIndex,
        userSelect: "none",
        willChange: "transform",
      }}
    >
      <div
        style={{
          position: "absolute", inset: 0,
          background: tintVar(entry.tint),
          borderRadius: 4,
          boxShadow: hovered && mode === 'float'
            ? "var(--shadow-lift)"
            : mode === 'deck' && deckZIndex > 10
              ? "0 12px 40px -10px rgba(20,30,40,0.30), 0 3px 10px -3px rgba(20,30,40,0.15)"
              : "var(--shadow-rest)",
          transform: hovered && mode === 'float'
            ? "translateY(-6px) scale(1.025)"
            : "translateY(0) scale(1)",
          transition: "transform 500ms cubic-bezier(.2,.8,.2,1), box-shadow 400ms ease",
          padding: `${pad}px`,
          display: "flex",
          flexDirection: "column",
          gap: hasPhoto ? 8 : 0,
          justifyContent: hasPhoto ? "flex-start" : "space-between",
          overflow: "hidden",
          cursor,
        }}
      >
        {/* Date + mood header */}
        <div style={{
          fontFamily: "var(--sans)",
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--ink-faint)",
          display: "flex",
          gap: 8,
          flexShrink: 0,
        }}>
          <span>{entry.date}</span>
          <span style={{ color: "var(--accent-soft)" }}>·</span>
          <span style={{
            fontStyle: "italic", textTransform: "lowercase",
            letterSpacing: "0.04em", fontFamily: "var(--serif)", fontSize: 12,
          }}>
            {entry.mood}
          </span>
        </div>

        {/* Cover photo — sits inside the sticky note with rounded corners */}
        {coverPhoto && (
          <div style={{
            flex: 1,
            borderRadius: 10,
            overflow: "hidden",
            background: "oklch(0 0 0 / 0.08)",
            flexShrink: 1,
            minHeight: 0,
          }}>
            <img
              src={coverPhoto.dataUrl}
              alt={coverPhoto.caption || entry.title}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        )}

        {/* Title */}
        <div style={{
          fontFamily: "var(--serif)",
          fontWeight: 400,
          fontVariationSettings: "'opsz' 36",
          fontSize: hasPhoto
            ? (layout.size === "s" ? 14 : layout.size === "m" ? 15 : 17)
            : (layout.size === "s" ? 22 : layout.size === "m" ? 27 : 33),
          lineHeight: hasPhoto ? 1.25 : 1.18,
          color: "var(--ink)",
          letterSpacing: "-0.012em",
          textWrap: "balance",
          flexShrink: 0,
        }}>
          {entry.title}
        </div>

        {/* Weather line — only when no photo and not small */}
        {layout.size !== "s" && !hasPhoto && (
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

        {/* Photo count badge */}
        {entry.photos && entry.photos.length > 1 && (
          <div style={{
            position: "absolute",
            top: pad, right: pad,
            background: "oklch(0 0 0 / 0.45)",
            color: "#fff",
            borderRadius: 99,
            padding: "2px 7px",
            fontFamily: "var(--sans)",
            fontSize: 9,
            letterSpacing: "0.08em",
          }}>
            {entry.photos.length}
          </div>
        )}
      </div>
    </div>
  );
});

export default function Garden({
  entries, onOpen, focusedId, hiddenIds, cardRefsStore,
  mode, deckFront, onDeckFrontChange,
}) {
  const stageRef = useRef(null);
  const cardRefs = useRef({});
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const rafRef = useRef(null);

  // Per-card user drag offsets — persist across mode switches
  const userOffsets = useRef({});
  // Active drag state
  const dragRef = useRef(null); // {id, startX, startY, startOX, startOY, hasMoved}
  // Suppress click after a real drag
  const suppressClickRef = useRef(new Set());
  // Deck mode lerp state — current interpolated position per card
  const deckLerpRef = useRef({});
  // Cached deck target positions
  const deckTargetsRef = useRef({});
  // True while cards are dispersing back to their natural positions after leaving deck mode
  const dispersingRef = useRef(false);
  // Track which id is currently being dragged (for cursor state in React)
  const [draggingId, setDraggingId] = useState(null);

  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => {
    function onResize() { setVw(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const cardScale = vw < 760 ? 0.62 : vw < 1024 ? 0.78 : vw < 1280 ? 0.9 : 1;

  const slots = useMemo(() => {
    // Use seeded phases so they're stable across re-renders
    return entries.map((e, i) => {
      const seed = e.id.split('').reduce((a, c, j) => a + c.charCodeAt(0) * (j + 1), 0);
      return {
        ...LAYOUT[i % LAYOUT.length],
        scale: cardScale,
        phaseX: (seed % 628) / 100,
        phaseY: (seed % 314) / 50,
        phaseR: (seed % 157) / 25,
        speed:  0.35 + (seed % 100) / 400,
      };
    });
  }, [entries, cardScale]);

  // Compute deck target positions (translate each card from its base pos to center stack)
  const computeDeckTargets = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const stageW = stage.clientWidth;
    const stageH = stage.clientHeight;
    const n = entries.length;
    const targets = {};
    entries.forEach((e, i) => {
      const slot = slots[i];
      const sz = sizePx(slot.size, slot.scale || 1);
      const baseLeft = slot.x / 100 * stageW - sz.w / 2;
      const baseTop  = slot.y / 100 * stageH - sz.h / 2;
      const targetLeft = stageW / 2 - sz.w / 2;
      const targetTop  = stageH / 2 - sz.h / 2;
      // Stack rank: 0 = front (deckFront), 1 = next, ...
      const rank = (i - deckFront + n) % n;
      const off = STACK_OFFSETS[rank % STACK_OFFSETS.length];
      targets[e.id] = {
        tx: targetLeft - baseLeft + off.x,
        ty: targetTop  - baseTop  + off.y,
        tr: off.r,
        rank,
      };
    });
    deckTargetsRef.current = targets;
  }, [entries, slots, deckFront]);

  // Recompute deck targets whenever deck config changes
  useEffect(() => {
    if (mode === 'deck') computeDeckTargets();
  }, [mode, deckFront, computeDeckTargets]);

  // When switching float → deck, seed deckLerp from current card positions
  // When switching deck → float, seed userOffsets from current lerp positions
  useEffect(() => {
    if (mode === 'deck') {
      computeDeckTargets();
      entries.forEach(e => {
        const ref = cardRefs.current[e.id];
        if (!ref) return;
        const tx = parseFloat(ref.style.getPropertyValue('--tx') || '0');
        const ty = parseFloat(ref.style.getPropertyValue('--ty') || '0');
        const tr = parseFloat(ref.style.getPropertyValue('--tr') || '0');
        deckLerpRef.current[e.id] = { tx, ty, tr };
      });
    } else {
      // Returning to float: seed userOffsets from current deck lerp positions so
      // there's no jump, then let the rAF decay them to 0 (spreading cards out).
      entries.forEach(e => {
        const dl = deckLerpRef.current[e.id];
        if (dl) userOffsets.current[e.id] = { x: dl.tx, y: dl.ty };
      });
      dispersingRef.current = true;
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Unified mouse/pointer event handler
  useEffect(() => {
    function onMove(e) {
      const drag = dragRef.current;
      if (drag) {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.hasMoved = true;
        userOffsets.current[drag.id] = { x: drag.startOX + dx, y: drag.startOY + dy };
      } else {
        const r = stageRef.current?.getBoundingClientRect();
        if (!r) return;
        mouseRef.current.x = ((e.clientX - r.left) / r.width  - 0.5) * 2;
        mouseRef.current.y = ((e.clientY - r.top)  / r.height - 0.5) * 2;
      }
    }
    function onUp() {
      const drag = dragRef.current;
      if (drag?.hasMoved) {
        suppressClickRef.current.add(drag.id);
        setTimeout(() => suppressClickRef.current.delete(drag.id), 100);
      }
      dragRef.current = null;
      setDraggingId(null);
    }
    function onLeave() { mouseRef.current.x = 0; mouseRef.current.y = 0; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // rAF animation loop
  useEffect(() => {
    const start = performance.now();
    function tick(now) {
      if (mode === 'grid') { rafRef.current = requestAnimationFrame(tick); return; }
      const t = (now - start) / 1000;
      const m = mouseRef.current;
      m.tx += (m.x - m.tx) * 0.06;
      m.ty += (m.y - m.ty) * 0.06;

      entries.forEach((e, i) => {
        const ref = cardRefs.current[e.id];
        if (!ref) return;
        const s = slots[i];

        if (mode === 'deck') {
          const target = deckTargetsRef.current[e.id];
          if (!target) return;
          const dl = deckLerpRef.current[e.id] || { tx: target.tx, ty: target.ty, tr: target.tr };
          const SPEED = 0.075;
          dl.tx += (target.tx - dl.tx) * SPEED;
          dl.ty += (target.ty - dl.ty) * SPEED;
          dl.tr += (target.tr - dl.tr) * SPEED;
          deckLerpRef.current[e.id] = dl;
          ref.style.setProperty("--tx", `${dl.tx}px`);
          ref.style.setProperty("--ty", `${dl.ty}px`);
          ref.style.setProperty("--tr", `${dl.tr}deg`);
        } else {
          // float mode
          const uo = userOffsets.current[e.id] || { x: 0, y: 0 };
          const isDragging = dragRef.current?.id === e.id;

          // Decay offset toward 0 while dispersing from deck, skip dragged card
          if (dispersingRef.current && !isDragging) {
            const DECAY = 0.038; // ~1.5 s to fully disperse at 60 fps
            uo.x *= (1 - DECAY);
            uo.y *= (1 - DECAY);
            userOffsets.current[e.id] = uo;
          }

          const driftX = isDragging ? 0 : Math.sin(t * 0.35 * s.speed + s.phaseX) * 8;
          const driftY = isDragging ? 0 : Math.cos(t * 0.30 * s.speed + s.phaseY) * 10;
          const driftR = isDragging ? 0 : Math.sin(t * 0.20 * s.speed + s.phaseR) * 0.8;
          const px = isDragging ? 0 : -m.tx * 22 * s.depth;
          const py = isDragging ? 0 : -m.ty * 18 * s.depth;
          ref.style.setProperty("--tx", `${driftX + px + uo.x}px`);
          ref.style.setProperty("--ty", `${driftY + py + uo.y}px`);
          ref.style.setProperty("--tr", `${driftR}deg`);
        }
      });

      // Clear dispersal flag once all offsets have decayed to near-zero
      if (dispersingRef.current && mode === 'float') {
        const done = entries.every(e => {
          const uo = userOffsets.current[e.id];
          return !uo || (Math.abs(uo.x) < 1.5 && Math.abs(uo.y) < 1.5);
        });
        if (done) {
          entries.forEach(e => { userOffsets.current[e.id] = { x: 0, y: 0 }; });
          dispersingRef.current = false;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [entries, slots, mode]);

  function handleCardMouseDown(e, id) {
    if (mode === 'deck') return;
    e.preventDefault();
    const cur = userOffsets.current[id] || { x: 0, y: 0 };
    dragRef.current = {
      id, startX: e.clientX, startY: e.clientY,
      startOX: cur.x, startOY: cur.y, hasMoved: false,
    };
    setDraggingId(id);
  }

  function handleOpen(id) {
    if (suppressClickRef.current.has(id)) return;
    if (mode === 'deck') {
      const idx = entries.findIndex(e => e.id === id);
      if (idx === deckFront) {
        onOpen(id);
      } else {
        onDeckFrontChange?.(idx);
      }
      return;
    }
    onOpen(id);
  }

  // Expose helpers to App
  useEffect(() => {
    if (cardRefsStore) {
      cardRefsStore.current = {
        getCardRect: (id) => {
          const el = cardRefs.current[id];
          return el ? el.getBoundingClientRect() : null;
        },
        setUserOffset: (id, x, y) => {
          userOffsets.current[id] = { x, y };
        },
      };
    }
  });

  const n = entries.length;
  const gridCols = vw < 640 ? 2 : vw < 1024 ? 3 : vw < 1400 ? 4 : 5;

  // ── Grid layout ────────────────────────────────────────────────────────────
  if (mode === 'grid') {
    return (
      <div
        ref={stageRef}
        style={{
          position: "absolute",
          inset: 0,
          overflowY: "auto",
          zIndex: 3,
          padding: `80px 32px 120px`,
          display: "grid",
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gap: 10,
          alignContent: "start",
        }}
      >
        {entries.map((e) => (
          <Card
            key={e.id}
            ref={(el) => { if (el) cardRefs.current[e.id] = el; }}
            entry={e}
            layout={{ size: "m", scale: 1, rot: 0 }}
            onOpen={handleOpen}
            onCardMouseDown={() => {}}
            focused={null}
            hidden={hiddenIds && hiddenIds.has(e.id)}
            dragging={false}
            mode="grid"
            deckZIndex={5}
          />
        ))}
      </div>
    );
  }

  // ── Float / Deck layout ────────────────────────────────────────────────────
  return (
    <div
      ref={stageRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: 3,
        cursor: draggingId ? "grabbing" : "default",
      }}
    >
      {entries.map((e, i) => {
        // deck z-index: front card on top, others behind in rank order
        const rank = (i - deckFront + n) % n;
        const deckZIndex = n + 1 - rank;
        return (
          <Card
            key={e.id}
            ref={(el) => { if (el) cardRefs.current[e.id] = el; }}
            entry={e}
            layout={slots[i]}
            onOpen={handleOpen}
            onCardMouseDown={(ev) => handleCardMouseDown(ev, e.id)}
            focused={focusedId == null ? null : focusedId === e.id}
            hidden={hiddenIds && hiddenIds.has(e.id)}
            dragging={draggingId === e.id}
            mode={mode}
            deckZIndex={deckZIndex}
          />
        );
      })}
    </div>
  );
}
