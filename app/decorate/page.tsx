"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const TEMPLATE = "/phototemplate.png";

/** Native pixel size of the template image */
const TEMPLATE_W = 2160;
const TEMPLATE_H = 3840;

/**
 * White photo-box areas in the template, measured in native image pixels.
 * Each entry: { x (left), y (top), w (width), h (height) }
 * Measured by pixel-scanning the actual template file.
 */
const TEMPLATE_BOXES = [
  { x: 340, y: 370, w: 1500, h: 895 }, // Box 1 – top
  { x: 340, y: 1450, w: 1500, h: 880 }, // Box 2 – middle
  { x: 340, y: 2525, w: 1500, h: 880 }, // Box 3 – bottom
];
//put emojis as stickers for now
const STICKER_GROUPS = [
  {
    label: "🐹 Animals",
    items: ["🐹","🐰","🐭","🐱","🐶","🐻","🐨","🐻‍❄️","🐼","🦁","🐺","🦊"],
  },
  {
    label: "🌸 Nature",
    items: ["🌸", "🌼", "🌺", "🥕", "🌱", "🌻", "🐝", "🍄"],
  },
  { label: "💖 Cute", 
    items: ["🎀", "💖", "💗", "💝", "🎈", "🍭", "🎉", "🎁"] 
  },
  {
    label: "🧁 Food",
    items: ["🧁", "🍥", "🍒", "🧋", "🍵", "🎂", "🍨", "🍕"],
  },
  {
    label: "✨ Stars",
    items: ["⭐", "🌟", "💫", "✨", "⚡", "🌙", "🪐", "🌤️"],
  },

  {
    label: "😊 Faces",
    items: ["😊", "😍", "🥰", "😴", "🤩", "😎", "🥳", "😭"],
  },
  {
    label: "🌈 Colors",
    items: ["💙","🧡","❤️","🩷","💚","💛","🩵","💜","🤎","🤍","🩶","🖤"],
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
//Load an image into an HTMLImageElement (Promise-based)
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
interface StripProps {
  photos: (string | null)[];
  stickers: Sticker[];
  interactive?: boolean; // true → stickers are draggable; false → read-only
  onPointerDown?: (e: React.MouseEvent | React.TouchEvent, id: number) => void;
  onRemove?: (id: number) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}
function StripCanvas({
  photos,
  stickers,
  interactive = false,
  onPointerDown,
  onRemove,
  containerRef,
}: StripProps) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const refToUse =
    (containerRef as React.RefObject<HTMLDivElement | null>) ?? localRef;
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = refToUse && "current" in refToUse ? refToUse.current : null;
    if (!el) return;
    const update = () => setContainerWidth(el.getBoundingClientRect().width || 0);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [refToUse]);

  const fontPx = Math.max(18, Math.round(containerWidth * 0.06));

  return (
    <div
      ref={refToUse as React.RefObject<HTMLDivElement>}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        aspectRatio: `${TEMPLATE_W} / ${TEMPLATE_H}`,
        userSelect: "none",
        overflow: "hidden",
        borderRadius: "8px",
      }}
    >
      {/* Photo boxes behind the template */}
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
            borderRadius: "4px",
            zIndex: 0,
          }}
        >
          {photos[i] ? (
            <img
              src={photos[i]!}
              alt=""
              draggable={false}
              className="w-full h-full object-cover object-center block"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-200 text-pink-500 font-bold">
              {i + 1}
            </div>
          )}
        </div>
      ))}
      {/*Photo Template */}
      <img src={TEMPLATE} alt="" draggable={false}
        className="absolute inset-0 w-full h-full block z-10 pointer-events-none"
      />

      {/* Stickers */}
      {stickers.map((s) => (
        <span
          key={s.id}
          className="sticker-placed"
          style={{
            left: `${s.xPct}%`,
            top: `${s.yPct}%`,
            transform: "translate(-50%, -50%)",
            fontSize: `${fontPx}px`,
            lineHeight: "1",
            zIndex: 20,
            pointerEvents: interactive ? "auto" : "none",
            cursor: interactive ? "grab" : "default",
            userSelect: "none",
            // Prevent browser from treating emoji drag as text selection
            WebkitUserSelect: "none",
          }}
          onMouseDown={
            interactive && onPointerDown
              ? (e) => onPointerDown(e, s.id)
              : undefined
          }
          onTouchStart={
            interactive && onPointerDown
              ? (e) => onPointerDown(e, s.id)
              : undefined
          }
          onDoubleClick={
            interactive && onRemove ? () => onRemove(s.id) : undefined
          }
        >
          {s.emoji}
        </span>
      ))}
    </div>
  );
}
{
  /* Main Photo Template Decorate Page*/
}
export default function DecoratePage() {
  const router = useRouter();
  // Ref to the preview div – used to map pointer events → % coordinates
  const previewRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const previewWrapperRef = useRef<HTMLDivElement | null>(null);

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
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const nextId = useRef(0);

  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // ── ADDED: detect Instagram/Facebook in-app browser ───────────────────────
  // Instagram's WebView blocks navigator.share and restricts camera access.
  // We show a banner so the user knows to open in Safari/Chrome for full features.
  const [showIgBanner, setShowIgBanner] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent || "";
    if (/Instagram|FBAN|FBAV/.test(ua)) setShowIgBanner(true);
  }, []);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    const previewWrapper = previewWrapperRef.current;
    if (!sidebar || !previewWrapper) return;

    const onScroll = () => {
      const offset = sidebar.scrollTop;
      previewWrapper.style.transform = offset ? `translateY(-${offset}px)` : "";
    };

    sidebar.addEventListener("scroll", onScroll, { passive: true });
    return () => sidebar.removeEventListener("scroll", onScroll);
  }, []);

  // Add a sticker near the strip center with a random offset
  const addSticker = useCallback((emoji: string) => {
    nextId.current++;
    setStickers((prev) => [
      ...prev,
      {
        id: nextId.current,
        emoji,
        xPct: 35 + Math.random() * 30,
        yPct: 35 + Math.random() * 30,
      },
    ]);
  }, []);

  const removeSticker = useCallback(
    (id: number) => setStickers((prev) => prev.filter((s) => s.id !== id)),
    [],
  );

  {/* Drag stickers – mouse + touch, stores result as % of preview container
 so positions are resolution-independent and survive the canvas export.*/}
  const onStickerPointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, id: number) => {
      e.preventDefault();
      e.stopPropagation();
      const container = previewRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

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
                  xPct: Math.max(0,Math.min(97, ((cx - rect.left) / rect.width) * 100),),
                  yPct: Math.max(0,Math.min(97, ((cy - rect.top) / rect.height) * 100),),
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

      // 1. User photos cover-cropped into each box
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

      // 2. Template overlay
      const tmpl = await loadImage(TEMPLATE);
      ctx.drawImage(tmpl, 0, 0, TEMPLATE_W, TEMPLATE_H);

      // 3. Sticker emojis at native scale
      const stickerPics = Math.round(TEMPLATE_W * 0.06); // ~6% of template width
      ctx.font = `${stickerPics}px serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      for (const s of stickers) {
        const px = (s.xPct / 100) * TEMPLATE_W;
        const py = (s.yPct / 100) * TEMPLATE_H;
        ctx.fillText(s.emoji, px, py);
      }

      // 4. Download
      // Convert canvas to a Blob so we can pass it to the Web Share API.
      // navigator.share({ files }) opens the native share sheet on:
      //   • iOS Safari 15+  → "Save Image" saves directly to Photos app
      //   • Android Chrome  → share to gallery, WhatsApp, Instagram, etc.
      // Instagram WebView and desktop browsers don't support navigator.share
      // with files, so we fall through to the classic <a download> link.
      const dataUrl = canvas.toDataURL("image/png");
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "photobooth.png", { type: "image/png" });

      // Check if the browser supports sharing files before trying
      const canShareFiles =
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });

      if (canShareFiles) {
        try {
          // Opens iOS/Android native share sheet
          await navigator.share({
            files: [file],
            title: "Guinea Pig Photobooth",
          });
          // User either shared or dismissed — either way we're done
          return;
        } catch {
          // User cancelled the sheet — no fallback download, just return quietly
          return;
        }
      }

      // Fallback: desktop download OR Instagram browser (user can long-press → Save)
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-5 pt-5">
      <div>
        <h1 className="sm:text-5xl text-3xl font-bold text-pink-500">
          Guinea Pig Photobooth
        </h1>
      </div>
      {/* ── ADDED: Instagram / Facebook in-app browser banner ─────────────────
          Their WebView blocks camera access and the native share sheet.
          Banner only appears when that UA is detected; user can dismiss it. */}
      {showIgBanner && (
        <div className="fixed inset-0 z-9999 bg-pink-100 flex items-center justify-center p-4">
        
          <span>
            📲 Open in Safari or Chrome for camera &amp; saving to Photos
          </span>
          <button
          className="bg-transparent text-pink-500 absolute top-2 right-2"
            onClick={() => setShowIgBanner(false)}
            >
            ✕
          </button>
        </div>
      )}
      {/* Action buttons */}
      <div className="flex gap-3 mb-6 flex-wrap justify-center">
        <button
          onClick={() => setPreviewOpen(true)}
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

      {/* Two-column layout: stickers sidebar and interactive strip */}
      <div className="flex flex-row gap-5 w-full min-h-0 items-start justify-center">
        {/* Sticker sidebar */}
        <div
          ref={sidebarRef}
          className="w-30 md:w-56 xl:w-auto shrink-0 h-full rounded-xl p-2 flex flex-col bg-pink-100"
        >
          <h2 className="text-xl text-center text-pink-500">Stickers 🌟</h2>
          <p className=" text-pink-500 text-sm text-center">
            Tap to place
            <br />
            Drag to move
            <br /> Double-tap to remove
          </p>
          {STICKER_GROUPS.map((group) => (
            <div key={group.label}>
              <p className=" text-xs text-gray-400 mb-2">{group.label}</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {group.items.map((emoji) => (
                  <button
                    key={emoji}
                    className="sticker-btn"
                    title={`add ${emoji}`}
                    onClick={() => addSticker(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className=" text-xl text-pink-500 text-center mt-1">
            Made by Patchatul
          </p>
        </div>

        {/* Interactive strip (main editing view) */}
        <div className="flex-1 flex justify-center h-full shrink-0"
            ref={previewWrapperRef}
            
            style={{
              maxWidth: "420px",
              aspectRatio: `${TEMPLATE_W} / ${TEMPLATE_H}`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <StripCanvas
              photos={photos}
              stickers={stickers}
              interactive={true}
              onPointerDown={onStickerPointerDown}
              onRemove={removeSticker}
              containerRef={previewRef}
            />
          </div>
      </div>

      {/* ════ preview POPUP ════
          Full-screen overlay showing the strip enlarged.
          Stickers are non-interactive (read-only preview).
          Download button triggers the canvas export.
      ════════════════════ */}
      {previewOpen && (
        <div
          onClick={() => setPreviewOpen(false)}
          className="fixed inset-0 z-1000 bg-black/50 flex items-center justify-center p-10"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl p-5 flex flex-col items-center gap-5"
          >
            {/* Strip fills all available space above the buttons */}
            <div className="flex-1 w-full h-full overflow-hidden">
              {/* CHANGE: read-only StripCanvas – stickers rendered inside at
               identical xPct/yPct so preview matches the editing view 1:1*/}
              <StripCanvas
                photos={photos}
                stickers={stickers}
                interactive={false}
              />
            </div>
            <div className="mt-1 shrink-0 gap-6 flex flex-wrap justify-center">
              <button
                onClick={() => {
                  setPreviewOpen(false);
                  handleSave();
                }}
                className="btn-pastel" style={{ background: "#b5ead7", color: "#1a4a2a" }}
              >
                {saving ? "⏳ Saving…" : "💾 Download"}
              </button>
              <button
                onClick={() => setPreviewOpen(false)}
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
