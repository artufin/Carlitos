"use client";

// NOT IMPLEMENTED (MVP): mock gallery with placeholder "photos" (gradients +
// SVG shapes). Filters and the lightbox are pure UI state. No real images.

import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { galleryAlbums, galleryItems } from "@/lib/mocks/gallery";
import type { GalleryAspect, GalleryItem, GalleryShape } from "@/lib/types/gallery";

const ASPECT_CLASS: Record<GalleryAspect, string> = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  tall: "aspect-[2/3]",
  wide: "aspect-[16/9]",
};

const SWIPE_THRESHOLD = 50;

export function GalleryMock() {
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const visible = useMemo(() => (albumId ? galleryItems.filter((i) => i.albumId === albumId) : galleryItems), [albumId]);
  const activeItem = activeIndex === null ? null : (visible[activeIndex] ?? null);
  const activeAlbum = albumId ? (galleryAlbums.find((a) => a.id === albumId) ?? null) : null;

  function open(index: number) {
    triggerRef.current = document.activeElement as HTMLElement | null;
    setActiveIndex(index);
  }

  function close() {
    setActiveIndex(null);
    triggerRef.current?.focus();
    triggerRef.current = null;
  }

  function step(delta: number) {
    setActiveIndex((prev) => (prev === null ? prev : (prev + delta + visible.length) % visible.length));
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar por álbum">
        <FilterChip pressed={albumId === null} onClick={() => setAlbumId(null)}>
          Todos
        </FilterChip>
        {galleryAlbums.map((album) => (
          <FilterChip key={album.id} pressed={albumId === album.id} onClick={() => setAlbumId(album.id)}>
            {album.title}
          </FilterChip>
        ))}
      </div>

      {activeAlbum && (
        <p className="text-sm text-muted-foreground">
          {activeAlbum.kind === "alianza" ? "Alianza" : "Carrete"} · {formatDate(activeAlbum.date)} · {activeAlbum.description}
        </p>
      )}

      <p className="sr-only" aria-live="polite">
        {visible.length} fotos
      </p>

      <ul className="columns-2 gap-3 sm:columns-3" aria-label="Fotos">
        {visible.map((item, index) => (
          <li key={item.id} className="mb-3 break-inside-avoid">
            <button
              type="button"
              onClick={() => open(index)}
              className="block w-full overflow-hidden rounded-xl ring-1 ring-foreground/10 transition-transform hover:scale-[1.01] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:scale-100"
              aria-label={`Abrir foto: ${item.caption}`}
            >
              <Placeholder item={item} />
            </button>
          </li>
        ))}
      </ul>

      {activeItem && activeIndex !== null && (
        <Lightbox
          item={activeItem}
          index={activeIndex}
          total={visible.length}
          onClose={close}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
        />
      )}
    </div>
  );
}

function FilterChip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "h-11 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        pressed ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

/** Gradient + SVG shape standing in for a real photo. */
function Placeholder({ item, className }: { item: GalleryItem; className?: string }) {
  const [from, to] = item.palette;
  return (
    <div
      role="img"
      aria-label={item.caption}
      className={cn("relative w-full", ASPECT_CLASS[item.aspect], className)}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full" aria-hidden>
        <Shape shape={item.shape} />
      </svg>
    </div>
  );
}

function Shape({ shape }: { shape: GalleryShape }) {
  const fill = "rgba(255,255,255,0.35)";
  switch (shape) {
    case "circle":
      return <circle cx="50" cy="50" r="28" fill={fill} />;
    case "triangle":
      return <polygon points="50,18 82,78 18,78" fill={fill} />;
    case "rings":
      return (
        <g fill="none" stroke={fill} strokeWidth="6">
          <circle cx="50" cy="50" r="14" />
          <circle cx="50" cy="50" r="28" />
        </g>
      );
    case "bars":
      return (
        <g fill={fill}>
          <rect x="22" y="40" width="12" height="40" rx="3" />
          <rect x="44" y="24" width="12" height="56" rx="3" />
          <rect x="66" y="52" width="12" height="28" rx="3" />
        </g>
      );
    case "diamond":
      return <polygon points="50,16 84,50 50,84 16,50" fill={fill} />;
  }
}

function Lightbox({
  item,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  item: GalleryItem;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft") onPrev();
      else if (event.key === "ArrowRight") onNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onPrev, onNext]);

  function onTouchStart(event: TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: TouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    const end = event.changedTouches[0]?.clientX;
    if (start === null || end === undefined) return;
    const delta = end - start;
    if (delta > SWIPE_THRESHOLD) onPrev();
    else if (delta < -SWIPE_THRESHOLD) onNext();
  }

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" as const };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${index + 1} de ${total}: ${item.caption}`}
      className="fixed inset-0 z-50 flex flex-col bg-black/90 text-white"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={transition}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-between gap-2 p-3">
        <span className="text-sm tabular-nums opacity-80">
          {index + 1} / {total}
        </span>
        <Button
          ref={closeRef}
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 text-white hover:bg-white/15 hover:text-white"
          onClick={onClose}
          aria-label="Cerrar visor"
        >
          <XIcon className="size-5" />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-14">
        <motion.div
          key={item.id}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={transition}
          className="w-full max-w-3xl"
        >
          <Placeholder item={item} className="max-h-[70vh] rounded-xl" />
        </motion.div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-1/2 left-2 size-11 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/25 hover:text-white"
        onClick={onPrev}
        aria-label="Foto anterior"
      >
        <ChevronLeftIcon className="size-6" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-1/2 right-2 size-11 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/25 hover:text-white"
        onClick={onNext}
        aria-label="Foto siguiente"
      >
        <ChevronRightIcon className="size-6" />
      </Button>

      <p className="p-4 text-center text-sm" data-testid="lightbox-caption">
        {item.caption}
      </p>
    </motion.div>
  );
}
