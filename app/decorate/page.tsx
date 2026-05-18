"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const TEMPLATE = "/phototemplate.jpg";

/** Native pixel size of the template image */
const TEMPLATE_W = 736;
const TEMPLATE_H = 736;

/**
 * White photo-box areas in the template, measured in native image pixels.
 * Each entry: { x (left), y (top), w (width), h (height) }
 * Measured by pixel-scanning the actual template file.
 */
const TEMPLATE_BOXES: { x: number; y: number; w: number; h: number }[] = [
  { x: 289, y: 94, w: 166, h: 140 }, // Box 1 – top
  { x: 288, y: 264, w: 166, h: 140 }, // Box 2 – middle
  { x: 286, y: 432, w: 168, h: 142 }, // Box 3 – bottom
];

//put emojis as stickers for now
const STICKER_GROUPS = [
  {
    label: "✨ Stars",
    items: ["⭐", "🌟", "💫", "✨", "🌠", "⚡", "🌙", "☀️"],
  },
  {
    label: "🌸 Nature",
    items: ["🌸", "🌼", "🌺", "🍀", "🌈", "🦋", "🐝", "🍄"],
  },
  { label: "💖 Cute", items: ["🎀", "💖", "💗", "💝", "🧸", "🍭", "🍬", "🎠"] },
  {
    label: "😊 Faces",
    items: ["😊", "😍", "🥰", "😜", "🤩", "😎", "🥳", "👑"],
  },
  {
    label: "🎉 Party",
    items: ["🎉", "🎊", "🎈", "🎁", "🎆", "🪄", "🎪", "🎨"],
  },
];
interface Sticker {
  id: number;
  emoji: string;
  xPct: number; // % of preview container width
  yPct: number; // % of preview container height
}
//crop img into canvas rect
function drawCoverCrop(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  destX: number,
  destY: number,
  destW: number,
  destH: number,
) {
  const srcAspect = img.naturalWidth / img.naturalHeight;
  const destAspect = destW / destH;
  let sx = 0,
    sy = 0,
    sw = img.naturalWidth,
    sh = img.naturalHeight;
  if (srcAspect > destAspect) {
    sw = sh * destAspect;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = sw / destAspect;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, destX, destY, destW, destH);
}
//
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
export default function DecoratePage() {
  const router = useRouter();
  // Ref to the preview div – used to map pointer events → % coordinates
  const previewRef = useRef<HTMLDivElement>(null);

  // ── Photos loaded from sessionStorage ────────────────────────────────────
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("wb_photos");
      if (raw) {
        const p: (string | null)[] = JSON.parse(raw);
        // Support both 3-slot and legacy 4-slot arrays
        setPhotos([p[0] ?? null, p[1] ?? null, p[2] ?? null]);
      }
    } catch {}
  }, []);

  // ── Sticker state ─────────────────────────────────────────────────────────
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const nextId = useRef(0);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Add a sticker near the strip centre
  // ─────────────────────────────────────────────────────────────────────────
  const addSticker = useCallback((emoji: string) => {
    nextId.current++;
    setStickers((prev) => [
      ...prev,
      {
        id: nextId.current,
        emoji,
        xPct: 38 + Math.random() * 24,
        yPct: 35 + Math.random() * 30,
      },
    ]);
  }, []);

  const removeSticker = useCallback(
    (id: number) => setStickers((prev) => prev.filter((s) => s.id !== id)),
    [],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Drag stickers – mouse + touch, stores result as % of preview container
  // so positions are resolution-independent and survive the canvas export.
  // ─────────────────────────────────────────────────────────────────────────
  const onStickerPointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, id: number) => {
      e.preventDefault();
      e.stopPropagation();
      const el = previewRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();

      const getXY = (ev: MouseEvent | TouchEvent): [number, number] =>
        "touches" in ev
          ? [ev.touches[0].clientX, ev.touches[0].clientY]
          : [(ev as MouseEvent).clientX, (ev as MouseEvent).clientY];

      const onMove = (ev: MouseEvent | TouchEvent) => {
        const [cx, cy] = getXY(ev);
        setStickers((prev) =>
          prev.map((s) =>
            s.id !== id
              ? s
              : {
                  ...s,
                  xPct: Math.max(
                    0,
                    Math.min(97, ((cx - rect.left) / rect.width) * 100),
                  ),
                  yPct: Math.max(
                    0,
                    Math.min(97, ((cy - rect.top) / rect.height) * 100),
                  ),
                },
          ),
        );
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("touchend", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("touchmove", onMove, { passive: false });
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchend", onUp);
    },
    [],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // DOWNLOAD
  // Builds the final image on an offscreen canvas at native template size:
  //   1. Draw template
  //   2. Cover-crop each photo into its measured box
  //   3. Render each sticker emoji at the scaled position
  //   4. Trigger PNG download
  // ─────────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = TEMPLATE_W;
      canvas.height = TEMPLATE_H;
      const ctx = canvas.getContext("2d")!;

      // 1. Template background
      const tmpl = await loadImage(TEMPLATE);
      ctx.drawImage(tmpl, 0, 0, TEMPLATE_W, TEMPLATE_H);

      // 2. User photos cover-cropped into each box
      for (let i = 0; i < TEMPLATE_BOXES.length; i++) {
        if (!photos[i]) continue;
        const img = await loadImage(photos[i]!);
        const box = TEMPLATE_BOXES[i];
        // Clip to box so photo never bleeds outside
        ctx.save();
        ctx.beginPath();
        ctx.rect(box.x, box.y, box.w, box.h);
        ctx.clip();
        drawCoverCrop(ctx, img, box.x, box.y, box.w, box.h);
        ctx.restore();
      }

      // 3. Sticker emojis at native scale
      const fontSize = Math.round(TEMPLATE_W * 0.06); // ~6% of template width
      ctx.font = `${fontSize}px serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      for (const s of stickers) {
        const px = (s.xPct / 100) * TEMPLATE_W;
        const py = (s.yPct / 100) * TEMPLATE_H;
        ctx.fillText(s.emoji, px, py);
      }

      // 4. Download
      const link = document.createElement("a");
      link.download = "photobooth.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error(err);
      alert("Could not save – try right-clicking and saving manually 🌸");
    } finally {
      setSaving(false);
    }
  }, [photos, stickers]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 pt-5">
      {/* Header */}
      <div>
        <h1 className="sm:text-5xl text-3xl font-bold text-pink-500">
          Guinea Pig Photobooth
        </h1>
      </div>
      {/* Action buttons */}
      <div className="flex gap-3 mb-6 flex-wrap justify-center">
        <button
          onClick={() => setModalOpen(true)}
          className="btn-pastel "
          style={{ background: "#bde0fe", color: "#1a4a7a" }}
        >
          👁 Preview
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-pastel "
          style={{ background: "#b5ead7", color: "#1a4a2a" }}
        >
          {saving ? "⏳ Saving…" : "💾 Save"}
        </button>
        <button
          onClick={() => router.push("/")}
          className="btn-pastel "
          style={{ background: "#ffc8dd", color: "#7a1a3a" }}
        >
          🔄 Start Over
        </button>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-row gap-5 w-full max-w-4xl items-start justify-center">
        {/* Sticker sidebar */}
        <aside className="w-50 rounded-3xl p-4 shrink-0 flex flex-col justify-center gap-4 bg-white/50">
          <h2 className="text-xl text-center text-pink-500">Stickers 🌟</h2>
          <p className=" text-pink-500 text-sm text-center">
            Tap to place<br/>Drag to move<br/> Double-tap to remove
          </p>
          {STICKER_GROUPS.map((group) => (
            <div key={group.label}>
              <p className=" text-xs text-gray-400 mb-2">{group.label}</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {group.items.map((emoji) => (
                  <button
                    key={emoji}
                    className="sticker-btn"
                    title={`Add ${emoji}`}
                    onClick={() => addSticker(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className=" text-xl text-gray-400 text-center mt-1">Made by Pat</p>
        </aside>

        {/* Interactive strip (main editing view) */}
        <div className="flex-1 flex justify-center">
          <div style={{ width: "100%", maxWidth: "420px" }}>
            {/* The previewRef is attached to this wrapper for drag coordinate mapping */}
            <div
              ref={previewRef}
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: `${TEMPLATE_W} / ${TEMPLATE_H}`,
                userSelect: "none",
              }}
            >
              {/* Template image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={TEMPLATE}
                alt="Photo strip template"
                draggable={false}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  display: "block",
                }}
              />

              {/* Photos in boxes */}
              {TEMPLATE_BOXES.map((box, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${(box.x / TEMPLATE_W) * 100}%`,
                    top: `${(box.y / TEMPLATE_H) * 100}%`,
                    width: `${(box.w / TEMPLATE_W) * 100}%`,
                    height: `${(box.h / TEMPLATE_H) * 100}%`,
                    overflow: "hidden",
                  }}
                >
                  {photos[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photos[i]!}
                      alt={`Photo ${i + 1}`}
                      draggable={false}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255,255,255,0.5)",
                      }}
                    >
                      Photo {i + 1}
                    </div>
                  )}
                </div>
              ))}

              {/* Draggable stickers */}
              {stickers.map((s) => (
                <span
                  key={s.id}
                  className="sticker-placed"
                  style={{
                    left: `${s.xPct}%`,
                    top: `${s.yPct}%`,
                    fontSize: "clamp(20px, 5vw, 36px)",
                    transform: "translate(-50%,-50%)",
                    zIndex: 20,
                  }}
                  onMouseDown={(e) => onStickerPointerDown(e, s.id)}
                  onTouchStart={(e) => onStickerPointerDown(e, s.id)}
                  onDoubleClick={() => removeSticker(s.id)}
                  title="Double-click to remove"
                >
                  {s.emoji}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ════ MODAL POPUP ════
          Full-screen overlay showing the strip enlarged.
          Stickers are non-interactive (read-only preview).
          Download button triggers the canvas export.
      ════════════════════ */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.60)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "20px",
              maxWidth: "360px",
              width: "100%",
              boxShadow: "0 12px 60px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            {/* Read-only strip preview inside modal */}
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: `${TEMPLATE_W} / ${TEMPLATE_H}`,
                userSelect: "none",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={TEMPLATE}
                alt="template"
                draggable={false}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  display: "block",
                }}
              />
              {TEMPLATE_BOXES.map((box, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${(box.x / TEMPLATE_W) * 100}%`,
                    top: `${(box.y / TEMPLATE_H) * 100}%`,
                    width: `${(box.w / TEMPLATE_W) * 100}%`,
                    height: `${(box.h / TEMPLATE_H) * 100}%`,
                    overflow: "hidden",
                  }}
                >
                  {photos[i] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photos[i]!}
                      alt=""
                      draggable={false}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  )}
                </div>
              ))}
              {/* Read-only stickers */}
              {stickers.map((s) => (
                <span
                  key={s.id}
                  style={{
                    position: "absolute",
                    left: `${s.xPct}%`,
                    top: `${s.yPct}%`,
                    transform: "translate(-50%,-50%)",
                    fontSize: "clamp(18px,4vw,30px)",
                    pointerEvents: "none",
                    zIndex: 20,
                  }}
                >
                  {s.emoji}
                </span>
              ))}
            </div>

            {/* Modal buttons */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => {
                  setModalOpen(false);
                  handleSave();
                }}
                className="btn-pastel"
                style={{ background: "#b5ead7", color: "#1a4a2a" }}
              >
                {saving ? "⏳ Saving…" : "💾 Download"}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="btn-pastel"
                style={{ background: "#ffc8dd", color: "#7a1a3a" }}
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
