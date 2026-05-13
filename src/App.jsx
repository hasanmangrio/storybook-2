import { useState, useRef, useEffect, useCallback } from 'react';
import SEED_ENTRIES from './entries.js';
import Garden from './Garden.jsx';
import Reader from './Reader.jsx';

// ─── icons ────────────────────────────────────────────────────────────────────

function ScatterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden>
      <circle cx="2.5" cy="3.5" r="1.5"/>
      <circle cx="11"  cy="2"   r="1.5"/>
      <circle cx="13"  cy="10"  r="1.5"/>
      <circle cx="2"   cy="12"  r="1.5"/>
      <circle cx="7.5" cy="7.5" r="1.5"/>
      <circle cx="5.5" cy="13"  r="1.5"/>
    </svg>
  );
}

function StackIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <rect x="1"   y="9.5" width="13"  height="4" rx="0.8" stroke="currentColor" strokeWidth="1.1"/>
      <rect x="1.8" y="6"   width="11.4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.1"/>
      <rect x="2.6" y="2.5" width="9.8"  height="4" rx="0.8" stroke="currentColor" strokeWidth="1.1"/>
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <rect x="0.6" y="0.6" width="4.8" height="4.8" rx="0.7" stroke="currentColor" strokeWidth="1.1"/>
      <rect x="7.6" y="0.6" width="4.8" height="4.8" rx="0.7" stroke="currentColor" strokeWidth="1.1"/>
      <rect x="0.6" y="7.6" width="4.8" height="4.8" rx="0.7" stroke="currentColor" strokeWidth="1.1"/>
      <rect x="7.6" y="7.6" width="4.8" height="4.8" rx="0.7" stroke="currentColor" strokeWidth="1.1"/>
    </svg>
  );
}

// ─── utils ────────────────────────────────────────────────────────────────────

function todayShort() {
  const d = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ─── DragToCreate ─────────────────────────────────────────────────────────────

function DragToCreate({ onDrop, hidden, gridMode }) {
  const [dragging, setDragging] = useState(false);
  const [ghost, setGhost] = useState({ x: 0, y: 0 });
  const startRef = useRef(null);
  const tints = ['var(--tint-4)', 'var(--tint-2)', 'var(--tint-7)', 'var(--tint-3)', 'var(--tint-5)'];
  const colorRef = useRef(tints[0]);

  const onMove = useCallback((e) => {
    setGhost({ x: e.clientX, y: e.clientY });
  }, []);

  const onUp = useCallback((e) => {
    setDragging(false);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (gridMode || Math.hypot(dx, dy) > 14) {
      onDrop(
        gridMode ? window.innerWidth / 2 : e.clientX,
        gridMode ? window.innerHeight / 2 : e.clientY,
        colorRef.current,
      );
      colorRef.current = tints[Math.floor(Math.random() * tints.length)];
    }
  }, [onDrop, onMove, gridMode]);

  function handleMouseDown(e) {
    e.preventDefault();
    startRef.current = { x: e.clientX, y: e.clientY };
    setGhost({ x: e.clientX, y: e.clientY });
    if (!gridMode) setDragging(true);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  const dots = Array.from({ length: 6 });

  return (
    <>
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed',
          bottom: 32, right: 32,
          width: 96, height: 80,
          background: colorRef.current,
          border: '1px solid var(--paper-edge)',
          borderRadius: 3,
          boxShadow: dragging
            ? 'none'
            : '0 2px 8px -2px rgba(20,30,40,0.14), 0 1px 3px rgba(20,30,40,0.08)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 7,
          cursor: gridMode ? 'pointer' : dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          zIndex: 25,
          opacity: hidden ? 0 : (dragging ? 0.35 : 1),
          transition: 'opacity 300ms ease, box-shadow 200ms ease',
          pointerEvents: hidden ? 'none' : 'auto',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px 4px' }}>
          {dots.map((_, i) => (
            <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--ink-ghost)' }} />
          ))}
        </div>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
          New Entry
        </span>
      </div>

      {dragging && !gridMode && (
        <div style={{
          position: 'fixed',
          left: ghost.x - 130, top: ghost.y - 90,
          width: 260, height: 180,
          background: colorRef.current,
          border: '1px solid var(--paper-edge)',
          borderRadius: 3,
          boxShadow: '0 20px 50px -12px rgba(20,30,40,0.28), 0 4px 14px -4px rgba(20,30,40,0.14)',
          pointerEvents: 'none', zIndex: 200,
          padding: '18px 20px', display: 'flex', alignItems: 'flex-end', opacity: 0.92,
        }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-ghost)' }}>
            Drop anywhere…
          </span>
        </div>
      )}
    </>
  );
}

// ─── InlineEditor ─────────────────────────────────────────────────────────────

function InlineEditor({ x, y, tintColor, onSave, onDiscard }) {
  const [title, setTitle] = useState('');
  const [body,  setBody]  = useState('');
  const titleRef = useRef(null);
  const bodyRef  = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const W = 320;
  const left = Math.max(16, Math.min(x - W / 2, window.innerWidth  - W - 16));
  const top  = Math.max(72, Math.min(y - 50,   window.innerHeight - 300 - 16));

  function save() {
    if (!title.trim() && !body.trim()) { onDiscard(); return; }
    const tintMap = {
      'var(--tint-1)': 1, 'var(--tint-2)': 2, 'var(--tint-3)': 3,
      'var(--tint-4)': 4, 'var(--tint-5)': 5, 'var(--tint-6)': 6,
      'var(--tint-7)': 7, 'var(--tint-8)': 8,
    };
    const tint = tintMap[tintColor] ?? Math.ceil(Math.random() * 8);
    onSave({
      id: 'e-' + Math.random().toString(36).slice(2, 8),
      title: title.trim() || 'Untitled',
      date: todayShort(),
      mood: '',
      weather: '',
      tint,
      body: body.trim()
        ? body.split(/\n\n+/).map(s => s.trim()).filter(Boolean)
        : [''],
      photos: [],
    });
  }

  return (
    <>
      <div onClick={save} style={{ position: 'fixed', inset: 0, zIndex: 55, cursor: 'default' }} />

      <div style={{
        position: 'fixed', left, top, width: W, zIndex: 60,
        background: tintColor, borderRadius: 3,
        boxShadow: '0 24px 60px -14px rgba(20,30,40,0.32), 0 6px 18px -6px rgba(20,30,40,0.16)',
        overflow: 'hidden',
        animation: 'editorDrop 220ms cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{ padding: '16px 16px 10px' }}>
          <input
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Tab' || e.key === 'Enter') { e.preventDefault(); bodyRef.current?.focus(); }
              if (e.key === 'Escape') onDiscard();
            }}
            placeholder="Title"
            style={{
              width: '100%', fontFamily: 'var(--serif)', fontSize: 19,
              fontWeight: 500, color: 'var(--ink)', caretColor: 'var(--accent)', letterSpacing: '-0.01em',
            }}
          />
        </div>

        <div style={{ height: 1, background: 'oklch(0.0 0 0 / 0.07)', margin: '0 16px' }} />

        <div style={{ position: 'relative' }}>
          {!body && (
            <div style={{
              position: 'absolute', top: 12, left: 16,
              fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.6,
              color: 'var(--ink-ghost)', fontStyle: 'italic', pointerEvents: 'none',
            }}>
              Write…
            </div>
          )}
          <textarea
            ref={bodyRef}
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') save();
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
            }}
            rows={5}
            style={{
              display: 'block', width: '100%', resize: 'none', padding: '12px 16px',
              fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.62,
              color: 'var(--ink-soft)', caretColor: 'var(--accent)',
            }}
          />
        </div>

        <div style={{
          padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'oklch(0.0 0 0 / 0.04)', borderTop: '1px solid oklch(0.0 0 0 / 0.07)',
        }}>
          <span style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-ghost)' }}>
            ⌘↵ to post · Esc to discard
          </span>
          <button
            onClick={save}
            style={{
              fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--paper)', background: 'var(--ink)', padding: '6px 16px', borderRadius: 3,
            }}
          >
            Post
          </button>
        </div>
      </div>

      <style>{`
        @keyframes editorDrop {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </>
  );
}

// ─── ThemeToggle ──────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="2.8" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="7" y1="0.5" x2="7" y2="2"   stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="7" y1="12" x2="7" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="0.5" y1="7" x2="2"   y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="12"  y1="7" x2="13.5" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="2.4" y1="2.4" x2="3.4" y2="3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="10.6" y1="10.6" x2="11.6" y2="11.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="11.6" y1="2.4" x2="10.6" y2="3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="3.4" y1="10.6" x2="2.4" y2="11.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M11.5 8.5A5 5 0 0 1 5.5 2.5a5 5 0 1 0 6 6z"
        stroke="currentColor" strokeWidth="1.2"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function ThemeToggle({ theme, setTheme }) {
  const dark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 10px', borderRadius: 999,
        border: '1px solid var(--paper-edge)', background: 'var(--paper-deep)',
        color: 'var(--ink-faint)', fontFamily: 'var(--sans)', fontSize: 11,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        transition: 'background 280ms ease, color 280ms ease, border-color 280ms ease',
        cursor: 'pointer',
      }}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
      {dark ? 'Light' : 'Dark'}
    </button>
  );
}

// ─── ModeToggle ───────────────────────────────────────────────────────────────

function ModeToggle({ mode, setMode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: 'var(--paper-edge)', borderRadius: 999, padding: 3, gap: 2,
    }}>
      {[
        { id: 'float', label: 'Float', Icon: ScatterIcon },
        { id: 'deck',  label: 'Deck',  Icon: StackIcon  },
        { id: 'grid',  label: 'Grid',  Icon: GridIcon   },
      ].map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => setMode(id)}
          title={label}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 999,
            background: mode === id ? 'var(--ink)' : 'transparent',
            color: mode === id ? 'var(--paper)' : 'var(--ink-ghost)',
            fontFamily: 'var(--sans)', fontSize: 11,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            transition: 'background 280ms ease, color 280ms ease',
          }}
        >
          <Icon />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ count, mode, setMode, theme, setTheme }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      padding: '18px 24px',
      display: 'flex', alignItems: 'center', gap: 12,
      zIndex: 30, pointerEvents: 'none',
    }}>
      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontFamily: 'var(--hand)', fontSize: 28, color: 'var(--accent)', lineHeight: 1 }}>
          field notes
        </span>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'var(--ink-ghost)' }}>
          a private journal
        </span>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ pointerEvents: 'auto' }}>
        <ModeToggle mode={mode} setMode={setMode} />
      </div>

      <div style={{
        pointerEvents: 'auto',
        fontFamily: 'var(--sans)', fontSize: 10,
        letterSpacing: '0.20em', textTransform: 'uppercase',
        color: 'var(--ink-faint)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ width: 14, height: 1, background: 'var(--paper-edge)' }} />
        <span>{count} entries</span>
      </div>

      <div style={{ pointerEvents: 'auto' }}>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>
    </div>
  );
}

// ─── DeckHint ─────────────────────────────────────────────────────────────────

function DeckHint({ deckFront, total, onPrev, onNext }) {
  const btnStyle = {
    width: 32, height: 32, borderRadius: '50%',
    border: '1px solid var(--paper-edge)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--ink-faint)', background: 'var(--paper)',
    transition: 'background 200ms, color 200ms',
  };
  function hoverOn(e) { e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.style.color = 'var(--paper)'; }
  function hoverOff(e) { e.currentTarget.style.background = 'var(--paper)'; e.currentTarget.style.color = 'var(--ink-faint)'; }

  return (
    <div style={{
      position: 'fixed', bottom: 34, left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 25, display: 'flex', alignItems: 'center', gap: 16,
      fontFamily: 'var(--sans)', fontSize: 11,
      letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-faint)',
    }}>
      <button style={btnStyle} onClick={onPrev} onMouseEnter={hoverOn} onMouseLeave={hoverOff} aria-label="Previous">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M6.5 2L3.5 5l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <span style={{ opacity: 0.7 }}>{deckFront + 1} / {total}</span>
      <button style={btnStyle} onClick={onNext} onMouseEnter={hoverOn} onMouseLeave={hoverOff} aria-label="Next">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M3.5 2L6.5 5l-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

// ─── SavedFlourish ────────────────────────────────────────────────────────────

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
      position: 'fixed',
      left: pos.x, top: pos.y,
      width: 360, height: 360,
      marginLeft: -180, marginTop: -180,
      borderRadius: '50%',
      border: '1px solid var(--accent-soft)',
      pointerEvents: 'none', zIndex: 4,
      animation: 'haloOut 1.6s cubic-bezier(.2,.8,.2,1) forwards',
    }} />
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [entries, setEntries] = useState(() => SEED_ENTRIES);
  const [openId, setOpenId]   = useState(null);
  const [openRect, setOpenRect] = useState(null);
  const [mode, setMode]       = useState('float');
  const [deckFront, setDeckFront] = useState(0);
  const [justSavedId, setJustSavedId] = useState(null);
  const [theme, setTheme] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [draft, setDraft] = useState(null);
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

  function saveEntry(updated) {
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
  }

  function handleDrop(x, y, tintColor) {
    setDraft({ x, y, tintColor });
  }

  function saveDraft(entry) {
    const stageW = window.innerWidth;
    const stageH = window.innerHeight;
    const baseCX = stageW * 0.14;
    const baseCY = stageH * 0.20;
    gardenStore.current?.setUserOffset(entry.id, draft.x - baseCX, draft.y - baseCY);

    setEntries(prev => [entry, ...prev]);
    setDraft(null);
    setJustSavedId(entry.id);
    setTimeout(() => setJustSavedId(null), 2000);
  }

  function discardDraft() {
    setDraft(null);
  }

  function prevDeck() { setDeckFront(f => (f - 1 + entries.length) % entries.length); }
  function nextDeck() { setDeckFront(f => (f + 1) % entries.length); }

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

  const overlayActive = !!openId || !!draft;

  return (
    <>
      <Header count={entries.length} mode={mode} setMode={setMode} theme={theme} setTheme={setTheme} />

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

      <DragToCreate onDrop={handleDrop} hidden={overlayActive} gridMode={mode === 'grid'} />

      {mode === 'deck' && !openId && !draft && (
        <DeckHint
          deckFront={deckFront}
          total={entries.length}
          onPrev={prevDeck}
          onNext={nextDeck}
        />
      )}

      {draft && (
        <InlineEditor
          x={draft.x}
          y={draft.y}
          tintColor={draft.tintColor}
          onSave={saveDraft}
          onDiscard={discardDraft}
        />
      )}

      {openEntryObj && openRect && (
        <Reader
          entry={openEntryObj}
          fromRect={openRect}
          onClose={closeEntry}
          onSave={saveEntry}
        />
      )}

      <div style={{
        position: 'fixed',
        bottom: 34, left: 32,
        zIndex: 25,
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: 'var(--sans)', fontSize: 10,
        letterSpacing: '0.20em', textTransform: 'uppercase',
        color: 'var(--ink-ghost)',
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--accent)',
          animation: 'breathe 4s ease-in-out infinite',
        }} />
        synced
      </div>
    </>
  );
}
