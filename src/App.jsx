import { useState, useRef, useEffect } from 'react';
import SEED_ENTRIES from './entries.js';
import Garden from './Garden.jsx';
import Reader from './Reader.jsx';
import Composer from './Composer.jsx';

function Header({ count }) {
  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      padding: "26px 36px",
      display: "flex", alignItems: "center",
      zIndex: 30,
      pointerEvents: "none",
    }}>
      <div style={{ pointerEvents: "auto", display: "flex", alignItems: "baseline", gap: 14 }}>
        <span style={{
          fontFamily: "var(--hand)",
          fontSize: 30,
          color: "var(--accent)",
          lineHeight: 1,
        }}>
          field notes
        </span>
        <span style={{
          fontFamily: "var(--sans)", fontSize: 11,
          letterSpacing: "0.18em", textTransform: "uppercase",
          color: "var(--ink-ghost)",
        }}>
          a private journal
        </span>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{
        pointerEvents: "auto",
        fontFamily: "var(--sans)", fontSize: 11,
        letterSpacing: "0.18em", textTransform: "uppercase",
        color: "var(--ink-faint)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span>{count} memories</span>
        <span style={{ width: 18, height: 1, background: "var(--paper-edge)" }} />
        <span>autumn</span>
      </div>
    </div>
  );
}

function FAB({ onClick, fabRef, hidden }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      ref={fabRef}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "fixed",
        bottom: 32, right: 32,
        zIndex: 25,
        width: hover ? 168 : 64,
        height: 64,
        borderRadius: 999,
        background: "var(--ink)",
        color: "var(--paper)",
        boxShadow: hover
          ? "0 16px 36px -10px rgba(60,40,20,0.45), 0 4px 12px -4px rgba(60,40,20,0.25)"
          : "0 8px 24px -8px rgba(60,40,20,0.35), 0 2px 6px -2px rgba(60,40,20,0.15)",
        display: "flex", alignItems: "center", justifyContent: "flex-start",
        padding: "0 22px",
        gap: 14,
        overflow: "hidden",
        transition: "width 480ms cubic-bezier(.2,.8,.2,1), box-shadow 400ms ease, opacity 400ms ease, transform 400ms ease",
        opacity: hidden ? 0 : 1,
        transform: hidden ? "scale(0.8) translateY(20px)" : "scale(1) translateY(0)",
        pointerEvents: hidden ? "none" : "auto",
      }}
    >
      <span style={{
        fontFamily: "var(--serif)",
        fontSize: 30, lineHeight: 1,
        fontWeight: 300,
        marginTop: -3,
      }}>＋</span>
      <span style={{
        fontFamily: "var(--sans)", fontSize: 12,
        letterSpacing: "0.16em", textTransform: "uppercase",
        whiteSpace: "nowrap",
        opacity: hover ? 1 : 0,
        transition: "opacity 300ms ease 80ms",
      }}>
        new entry
      </span>
    </button>
  );
}

function SavedFlourish({ id, gardenStore }) {
  const [pos, setPos] = useState(null);
  useEffect(() => {
    let raf, attempts = 0;
    function find() {
      const r = gardenStore.current?.getCardRect && gardenStore.current.getCardRect(id);
      if (r) {
        setPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      } else if (attempts++ < 20) {
        raf = requestAnimationFrame(find);
      }
    }
    find();
    return () => raf && cancelAnimationFrame(raf);
  }, [id]);
  if (!pos) return null;
  return (
    <div style={{
      position: "fixed",
      left: pos.x, top: pos.y,
      width: 360, height: 360,
      marginLeft: -180, marginTop: -180,
      borderRadius: "50%",
      border: "1px solid var(--accent-soft)",
      pointerEvents: "none",
      zIndex: 4,
      animation: "haloOut 1.6s cubic-bezier(.2,.8,.2,1) forwards",
    }} />
  );
}

export default function App() {
  const [entries, setEntries] = useState(() => SEED_ENTRIES);
  const [openId, setOpenId] = useState(null);
  const [openRect, setOpenRect] = useState(null);
  const [composing, setComposing] = useState(false);
  const [composeRect, setComposeRect] = useState(null);
  const [justSavedId, setJustSavedId] = useState(null);
  const fabRef = useRef(null);
  const gardenStore = useRef(null);

  function openEntry(id) {
    const r = gardenStore.current?.getCardRect(id);
    if (!r) return;
    setOpenRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    setOpenId(id);
  }

  function closeEntry() {
    setOpenId(null);
    setTimeout(() => setOpenRect(null), 600);
  }

  function startCompose() {
    const r = fabRef.current ? fabRef.current.getBoundingClientRect() : null;
    if (r) setComposeRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    setComposing(true);
  }

  function cancelCompose() {
    setComposing(false);
    setTimeout(() => setComposeRect(null), 600);
  }

  function saveEntry(entry) {
    setEntries(prev => [entry, ...prev]);
    setComposing(false);
    setComposeRect(null);
    setJustSavedId(entry.id);
    setTimeout(() => setJustSavedId(null), 2000);
  }

  const openEntryObj = openId ? entries.find(e => e.id === openId) : null;
  const hiddenIds = new Set();
  if (openId) hiddenIds.add(openId);

  return (
    <>
      <Header count={entries.length} />

      <Garden
        entries={entries}
        onOpen={openEntry}
        focusedId={openId}
        hiddenIds={hiddenIds}
        cardRefsStore={gardenStore}
      />

      {justSavedId && <SavedFlourish id={justSavedId} gardenStore={gardenStore} />}

      <FAB
        fabRef={fabRef}
        onClick={startCompose}
        hidden={composing || !!openId}
      />

      {openEntryObj && openRect && (
        <Reader
          entry={openEntryObj}
          fromRect={openRect}
          onClose={closeEntry}
        />
      )}

      {composing && (
        <Composer
          mountRect={composeRect}
          onCancel={cancelCompose}
          onSave={saveEntry}
        />
      )}

      <div style={{
        position: "fixed",
        bottom: 32, left: 36,
        zIndex: 25,
        display: "flex", alignItems: "center", gap: 12,
        fontFamily: "var(--sans)", fontSize: 11,
        letterSpacing: "0.18em", textTransform: "uppercase",
        color: "var(--ink-ghost)",
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "var(--accent)",
          animation: "breathe 4s ease-in-out infinite",
        }} />
        synced just now
      </div>
    </>
  );
}
