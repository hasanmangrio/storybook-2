import { useState, useRef, useEffect } from 'react';
import SEED_ENTRIES from './entries.js';
import Garden from './Garden.jsx';
import Reader from './Reader.jsx';
import Composer from './Composer.jsx';

function ScatterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden>
      <circle cx="2.5" cy="3.5" r="1.5"/>
      <circle cx="11" cy="2" r="1.5"/>
      <circle cx="13" cy="10" r="1.5"/>
      <circle cx="2" cy="12" r="1.5"/>
      <circle cx="7.5" cy="7.5" r="1.5"/>
      <circle cx="5.5" cy="13" r="1.5"/>
    </svg>
  );
}

function StackIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <rect x="1"   y="9.5" width="13" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.1"/>
      <rect x="1.8" y="6"   width="11.4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.1"/>
      <rect x="2.6" y="2.5" width="9.8"  height="4" rx="0.8" stroke="currentColor" strokeWidth="1.1"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function ModeToggle({ mode, setMode }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      background: "var(--paper-edge)",
      borderRadius: 999,
      padding: 3,
      gap: 2,
    }}>
      {[
        { id: 'float', label: 'Float', Icon: ScatterIcon },
        { id: 'deck',  label: 'Deck',  Icon: StackIcon  },
      ].map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => setMode(id)}
          title={label}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px",
            borderRadius: 999,
            background: mode === id ? "var(--ink)" : "transparent",
            color: mode === id ? "var(--paper)" : "var(--ink-ghost)",
            fontFamily: "var(--sans)",
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            transition: "background 300ms ease, color 300ms ease",
          }}
        >
          <Icon />
          {label}
        </button>
      ))}
    </div>
  );
}

function Header({ count, mode, setMode }) {
  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      padding: "22px 32px",
      display: "flex", alignItems: "center", gap: 20,
      zIndex: 30,
      pointerEvents: "none",
    }}>
      <div style={{ pointerEvents: "auto", display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{
          fontFamily: "var(--hand)",
          fontSize: 28,
          color: "var(--accent)",
          lineHeight: 1,
        }}>
          field notes
        </span>
        <span style={{
          fontFamily: "var(--sans)", fontSize: 10,
          letterSpacing: "0.20em", textTransform: "uppercase",
          color: "var(--ink-ghost)",
        }}>
          a private journal
        </span>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ pointerEvents: "auto" }}>
        <ModeToggle mode={mode} setMode={setMode} />
      </div>

      <div style={{
        pointerEvents: "auto",
        fontFamily: "var(--sans)", fontSize: 10,
        letterSpacing: "0.20em", textTransform: "uppercase",
        color: "var(--ink-faint)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ width: 14, height: 1, background: "var(--paper-edge)" }} />
        <span>{count} entries</span>
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
      aria-label="New entry"
      style={{
        position: "fixed",
        bottom: 32, right: 32,
        zIndex: 25,
        width: hover ? 156 : 52,
        height: 52,
        borderRadius: 999,
        background: "var(--ink)",
        color: "var(--paper)",
        boxShadow: hover
          ? "0 16px 36px -10px rgba(20,30,40,0.45), 0 4px 12px -4px rgba(20,30,40,0.25)"
          : "0 8px 24px -8px rgba(20,30,40,0.35), 0 2px 6px -2px rgba(20,30,40,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 18px",
        gap: 10,
        overflow: "hidden",
        transition: "width 480ms cubic-bezier(.2,.8,.2,1), box-shadow 400ms ease, opacity 400ms ease, transform 400ms ease",
        opacity: hidden ? 0 : 1,
        transform: hidden ? "scale(0.8) translateY(20px)" : "scale(1) translateY(0)",
        pointerEvents: hidden ? "none" : "auto",
      }}
    >
      <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
        <PlusIcon />
      </span>
      <span style={{
        fontFamily: "var(--sans)", fontSize: 11,
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

function DeckHint({ deckFront, total, onPrev, onNext }) {
  return (
    <div style={{
      position: "fixed",
      bottom: 34,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 25,
      display: "flex",
      alignItems: "center",
      gap: 16,
      fontFamily: "var(--sans)",
      fontSize: 11,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: "var(--ink-faint)",
    }}>
      <button
        onClick={onPrev}
        aria-label="Previous"
        style={{
          width: 32, height: 32, borderRadius: "50%",
          border: "1px solid var(--paper-edge)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--ink-faint)",
          background: "var(--paper)",
          transition: "background 200ms, color 200ms",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--ink)"; e.currentTarget.style.color = "var(--paper)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "var(--paper)"; e.currentTarget.style.color = "var(--ink-faint)"; }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M6.5 2L3.5 5l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <span style={{ opacity: 0.7 }}>
        {deckFront + 1} / {total}
      </span>

      <button
        onClick={onNext}
        aria-label="Next"
        style={{
          width: 32, height: 32, borderRadius: "50%",
          border: "1px solid var(--paper-edge)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--ink-faint)",
          background: "var(--paper)",
          transition: "background 200ms, color 200ms",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--ink)"; e.currentTarget.style.color = "var(--paper)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "var(--paper)"; e.currentTarget.style.color = "var(--ink-faint)"; }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M3.5 2L6.5 5l-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

function SavedFlourish({ id, gardenStore }) {
  const [pos, setPos] = useState(null);
  useEffect(() => {
    let raf, attempts = 0;
    function find() {
      const r = gardenStore.current?.getCardRect?.(id);
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
  const [mode, setMode] = useState('float');
  const [deckFront, setDeckFront] = useState(0);
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
    const r = fabRef.current?.getBoundingClientRect() ?? null;
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

  function prevDeck() {
    setDeckFront(f => (f - 1 + entries.length) % entries.length);
  }
  function nextDeck() {
    setDeckFront(f => (f + 1) % entries.length);
  }

  // Arrow key navigation in deck mode
  useEffect(() => {
    if (mode !== 'deck') return;
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextDeck();
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   prevDeck();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, entries.length]);

  const openEntryObj = openId ? entries.find(e => e.id === openId) : null;
  const hiddenIds = new Set();
  if (openId) hiddenIds.add(openId);

  return (
    <>
      <Header count={entries.length} mode={mode} setMode={setMode} />

      <Garden
        entries={entries}
        onOpen={openEntry}
        focusedId={openId}
        hiddenIds={hiddenIds}
        cardRefsStore={gardenStore}
        mode={mode}
        deckFront={deckFront}
        onDeckFrontChange={setDeckFront}
      />

      {justSavedId && <SavedFlourish id={justSavedId} gardenStore={gardenStore} />}

      <FAB
        fabRef={fabRef}
        onClick={startCompose}
        hidden={composing || !!openId}
      />

      {mode === 'deck' && !openId && !composing && (
        <DeckHint
          deckFront={deckFront}
          total={entries.length}
          onPrev={prevDeck}
          onNext={nextDeck}
        />
      )}

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
        bottom: 34, left: 32,
        zIndex: 25,
        display: "flex", alignItems: "center", gap: 10,
        fontFamily: "var(--sans)", fontSize: 10,
        letterSpacing: "0.20em", textTransform: "uppercase",
        color: "var(--ink-ghost)",
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "var(--accent)",
          animation: "breathe 4s ease-in-out infinite",
        }} />
        synced
      </div>
    </>
  );
}
