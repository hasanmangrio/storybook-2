import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

function tintR(n) { return `var(--tint-${((n - 1) % 8) + 1})`; }

// ─── PhotoCard ────────────────────────────────────────────────────────────────

function PhotoCard({ photo, index, onUpdateCaption, onDelete, isOnly }) {
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(photo.caption || '');
  const inputRef = useRef(null);

  function commitCaption() {
    setEditing(false);
    if (caption !== photo.caption) onUpdateCaption(photo.id, caption);
  }

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      flexShrink: 0,
      width: isOnly ? '100%' : 260,
      animation: `photoSlideIn 320ms cubic-bezier(.2,.8,.2,1) ${index * 60}ms both`,
    }}>
      {/* Photo frame — the "sticky on the sticky" feel */}
      <div style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        background: 'oklch(0 0 0 / 0.10)',
        aspectRatio: isOnly ? '16/9' : '4/3',
        boxShadow: '0 4px 20px -6px rgba(20,30,40,0.18), 0 1px 4px rgba(20,30,40,0.08)',
      }}>
        <img
          src={photo.dataUrl}
          alt={photo.caption || ''}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />

        {/* Delete button */}
        <button
          onClick={() => onDelete(photo.id)}
          title="Remove photo"
          style={{
            position: 'absolute',
            top: 10, right: 10,
            width: 28, height: 28,
            borderRadius: '50%',
            background: 'oklch(0 0 0 / 0.52)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 180ms ease',
            fontSize: 14,
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0'}
          onFocus={e => e.currentTarget.style.opacity = '1'}
          onBlur={e => e.currentTarget.style.opacity = '0'}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1.5 1.5L9.5 9.5M9.5 1.5L1.5 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Caption */}
      {editing ? (
        <input
          ref={inputRef}
          value={caption}
          onChange={e => setCaption(e.target.value)}
          onBlur={commitCaption}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === 'Escape') commitCaption();
          }}
          placeholder="Add a title…"
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 14,
            fontStyle: 'italic',
            color: 'var(--ink-soft)',
            caretColor: 'var(--accent)',
            textAlign: 'center',
            borderBottom: '1px solid var(--accent-soft)',
            paddingBottom: 3,
          }}
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 14,
            fontStyle: caption ? 'italic' : 'normal',
            color: caption ? 'var(--ink-soft)' : 'var(--ink-ghost)',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          {caption || 'Add a title…'}
        </button>
      )}
    </div>
  );
}

// ─── PhotoSection ─────────────────────────────────────────────────────────────

function PhotoSection({ photos, onPhotosChange, phase }) {
  const fileInputRef = useRef(null);

  function handleFiles(files) {
    const toProcess = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!toProcess.length) return;

    toProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        onPhotosChange(prev => [
          ...prev,
          {
            id: 'p-' + Math.random().toString(36).slice(2, 8),
            dataUrl: e.target.result,
            caption: '',
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }

  function handleInputChange(e) {
    handleFiles(e.target.files);
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  function updateCaption(id, caption) {
    onPhotosChange(prev => prev.map(p => p.id === id ? { ...p, caption } : p));
  }

  function deletePhoto(id) {
    onPhotosChange(prev => prev.filter(p => p.id !== id));
  }

  const isEmpty = !photos || photos.length === 0;

  return (
    <div style={{
      marginTop: 36,
      opacity: phase === 'open' ? 1 : 0,
      transform: phase === 'open' ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity 500ms ease 400ms, transform 500ms ease 400ms',
    }}>
      {/* Section label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 20,
      }}>
        <div style={{ flex: 1, height: 1, background: 'var(--paper-edge)' }} />
        <span style={{
          fontFamily: 'var(--sans)',
          fontSize: 10,
          letterSpacing: '0.20em',
          textTransform: 'uppercase',
          color: 'var(--ink-ghost)',
        }}>
          Photos
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--paper-edge)' }} />
      </div>

      {/* Drop zone or photo grid */}
      {isEmpty ? (
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '1.5px dashed var(--paper-edge)',
            borderRadius: 14,
            padding: '36px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            transition: 'border-color 200ms, background 200ms',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--accent-soft)';
            e.currentTarget.style.background = 'oklch(0 0 0 / 0.02)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--paper-edge)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ color: 'var(--ink-ghost)' }}>
            <rect x="1.5" y="4.5" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="7.5" cy="9.5" r="1.8" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M1.5 15.5l5-5 3.5 3.5 3-3 7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{
            fontFamily: 'var(--sans)',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--ink-ghost)',
          }}>
            Add photos
          </span>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: photos.length === 1 ? 'column' : 'row',
          flexWrap: photos.length > 1 ? 'wrap' : 'nowrap',
          gap: 18,
          alignItems: 'flex-start',
        }}>
          {photos.map((photo, i) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={i}
              isOnly={photos.length === 1}
              onUpdateCaption={updateCaption}
              onDelete={deletePhoto}
            />
          ))}

          {/* Add more button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              flexShrink: 0,
              width: 80,
              aspectRatio: '1',
              borderRadius: 14,
              border: '1.5px dashed var(--paper-edge)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              color: 'var(--ink-ghost)',
              transition: 'border-color 200ms, color 200ms',
              alignSelf: 'flex-start',
              marginTop: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent-soft)';
              e.currentTarget.style.color = 'var(--ink-soft)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--paper-edge)';
              e.currentTarget.style.color = 'var(--ink-ghost)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
              Add
            </span>
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      <style>{`
        @keyframes photoSlideIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Reader ───────────────────────────────────────────────────────────────────

export default function Reader({ entry, fromRect, onClose, onUpdate }) {
  const wrapRef = useRef(null);
  const [phase, setPhase] = useState("opening");
  const [released, setReleased] = useState(false);
  const [hint, setHint] = useState(true);
  const [photos, setPhotos] = useState(entry.photos || []);

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
    // Persist photo changes before closing
    onUpdate?.({ photos });
    setReleased(false);
    setPhase("closing");
    setTimeout(() => onClose && onClose(), 540);
  }

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") close(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, photos]);

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 3500);
    return () => clearTimeout(t);
  }, []);

  // Sync photos changes back to parent immediately (so card thumbnail updates)
  const handlePhotosChange = useCallback((updater) => {
    setPhotos(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      onUpdate?.({ photos: next });
      return next;
    });
  }, [onUpdate]);

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
              flexShrink: 0,
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

            <PhotoSection
              photos={photos}
              onPhotosChange={handlePhotosChange}
              phase={phase}
            />

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
