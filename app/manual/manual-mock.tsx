"use client";

// NOT IMPLEMENTED (MVP): immersive, full-screen mock of the "Manual novato
// digital". Chapters come from lib/mocks/manual.ts and every paragraph is a
// placeholder. Heavy on motion by design (allowed only inside /manual), but it
// animates transform/opacity only and degrades to static under reduced motion.

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "motion/react";
import { ArrowDownIcon, ArrowUpIcon, HomeIcon, XIcon } from "lucide-react";
import { cn } from "cn";
import { MockBadge } from "@/components/mock-badge";
import { caiContent, caiRepresentativeAreaLabel } from "@/lib/mocks/cai-content";
import { manualGuide } from "@/lib/mocks/manual";
import type { ManualChapter, ManualIllustration } from "@/lib/types/manual";

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/70";
const CHAPTER_ATTR = "data-chapter-index";

export function ManualMock() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion() ?? false;
  const chapters = manualGuide.chapters;
  const total = chapters.length;

  // Thin progress bar at the top, driven directly by the container's scroll.
  const { scrollYProgress } = useScroll({ container: containerRef });

  // Track the visible chapter. State is only set inside the observer callback.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>(`[${CHAPTER_ATTR}]`));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.chapterIndex);
            if (!Number.isNaN(index)) setActive(index);
          }
        }
      },
      { root, threshold: 0.55 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(0, index), total - 1);
      const target = containerRef.current?.querySelector<HTMLElement>(`[${CHAPTER_ATTR}="${clamped}"]`);
      if (!target) return;
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      target.focus({ preventScroll: true });
    },
    [reduced, total],
  );

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const tag = (event.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    switch (event.key) {
      case "ArrowDown":
      case "PageDown":
        event.preventDefault();
        goTo(active + 1);
        break;
      case "ArrowUp":
      case "PageUp":
        event.preventDefault();
        goTo(active - 1);
        break;
      case "Home":
        event.preventDefault();
        goTo(0);
        break;
      case "End":
        event.preventDefault();
        goTo(total - 1);
        break;
      default:
    }
  }

  return (
    <div className="relative h-dvh bg-slate-950 text-white">
      {/* Top progress bar */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-40 h-1 origin-left bg-white/90 will-change-transform"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Top bar: exit link and mock badge */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          href="/"
          className={cn(
            "pointer-events-auto inline-flex min-h-11 items-center gap-1.5 rounded-full bg-black/35 px-3 text-sm font-medium text-white backdrop-blur-sm hover:bg-black/50",
            FOCUS_RING,
          )}
        >
          <XIcon className="size-4" aria-hidden />
          Salir
        </Link>
        <MockBadge className="pointer-events-auto mt-2 border-amber-300/70 bg-black/35 text-amber-100 backdrop-blur-sm dark:bg-black/35 dark:text-amber-100" />
      </div>

      {/* Side dots */}
      <nav aria-label="Capítulos" className="fixed top-1/2 right-1 z-30 -translate-y-1/2">
        <ol className="flex flex-col">
          {chapters.map((chapter, index) => {
            const current = index === active;
            return (
              <li key={chapter.id}>
                <button
                  type="button"
                  aria-label={`Ir al capítulo ${chapter.order}: ${chapter.title}`}
                  aria-current={current ? "true" : undefined}
                  onClick={() => goTo(index)}
                  className={cn("grid size-11 place-items-center rounded-full", FOCUS_RING)}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "block rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)] transition-transform duration-300 motion-reduce:transition-none",
                      current ? "size-3 scale-100" : "size-2 scale-100 opacity-60",
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Scroll-snap container */}
      <div
        ref={containerRef}
        tabIndex={0}
        role="region"
        aria-label={`${manualGuide.title}, ${manualGuide.edition}`}
        onKeyDown={onKeyDown}
        className={cn(
          "h-dvh snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth motion-reduce:scroll-auto",
          FOCUS_RING,
          "focus-visible:ring-inset",
        )}
      >
        {chapters.map((chapter, index) => (
          <Chapter
            key={chapter.id}
            chapter={chapter}
            index={index}
            total={total}
            containerRef={containerRef}
            reduced={reduced}
            onNext={() => goTo(index + 1)}
            onTop={() => goTo(0)}
          />
        ))}
      </div>
    </div>
  );
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

function Chapter({
  chapter,
  index,
  total,
  containerRef,
  reduced,
  onNext,
  onTop,
}: {
  chapter: ManualChapter;
  index: number;
  total: number;
  containerRef: RefObject<HTMLDivElement | null>;
  reduced: boolean;
  onNext: () => void;
  onTop: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  // 0 when the chapter enters from the bottom, 1 when it leaves through the top.
  const { scrollYProgress } = useScroll({ container: containerRef, target: ref, offset: ["start end", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [90, -90]);
  const parallaxRotate = useTransform(scrollYProgress, [0, 1], [-4, 4]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.2, 1, 1, 0.2]);
  const contentScale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.94, 1, 1, 0.94]);
  const isLast = index === total - 1;

  return (
    <section
      ref={ref}
      id={chapter.slug}
      tabIndex={-1}
      aria-labelledby={`${chapter.slug}-title`}
      {...{ [CHAPTER_ATTR]: index }}
      className={cn(
        "relative flex min-h-dvh snap-start flex-col justify-end overflow-hidden px-5 pt-20 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-8",
        FOCUS_RING,
        "focus-visible:ring-inset",
      )}
      style={{ background: chapter.gradient }}
    >
      {/* Parallax illustration */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[58dvh] will-change-transform"
        style={reduced ? undefined : { y: parallaxY, rotate: parallaxRotate }}
      >
        <FloatingIllustration variant={chapter.illustration} accent={chapter.accent} reduced={reduced} />
      </motion.div>

      {/* Text block with staggered reveal and scroll-linked fade between chapters */}
      <motion.div
        className="relative z-10 mx-auto w-full max-w-xl"
        style={reduced ? undefined : { opacity: contentOpacity, scale: contentScale }}
      >
        <motion.div
          variants={containerVariants}
          initial={reduced ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.4, root: containerRef }}
          className="space-y-4"
        >
          <motion.p variants={itemVariants} className="text-xs font-semibold tracking-[0.2em] text-white/70 uppercase">
            {chapter.kicker} · {index + 1}/{total}
          </motion.p>
          <motion.h2
            id={`${chapter.slug}-title`}
            variants={itemVariants}
            className="font-heading text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl"
          >
            {chapter.title}
          </motion.h2>
          <motion.p variants={itemVariants} className="text-lg font-medium text-white/90">
            {chapter.summary}
          </motion.p>
          {chapter.paragraphs.map((paragraph, i) => (
            <motion.p key={i} variants={itemVariants} className="text-base leading-relaxed text-white/75">
              {paragraph}
            </motion.p>
          ))}

          {chapter.slug === "quien-es-quien" && (
            <motion.div variants={itemVariants}>
              <RepresentativesPreview />
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="flex flex-wrap gap-2 pt-2">
            {isLast ? (
              <>
                <Link
                  href="/"
                  className={cn(
                    "inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold text-slate-950 shadow-lg transition-transform hover:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:scale-100",
                    FOCUS_RING,
                  )}
                  style={{ backgroundColor: chapter.accent }}
                >
                  <HomeIcon className="size-4" aria-hidden />
                  Volver al inicio
                </Link>
                <button
                  type="button"
                  onClick={onTop}
                  className={cn(
                    "inline-flex min-h-12 items-center gap-2 rounded-full bg-white/15 px-5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/25",
                    FOCUS_RING,
                  )}
                >
                  <ArrowUpIcon className="size-4" aria-hidden />
                  Subir al comienzo
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onNext}
                className={cn(
                  "inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold text-slate-950 shadow-lg transition-transform hover:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:scale-100",
                  FOCUS_RING,
                )}
                style={{ backgroundColor: chapter.accent }}
              >
                Siguiente
                <motion.span
                  aria-hidden
                  className="inline-flex"
                  animate={reduced ? undefined : { y: [0, 3, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowDownIcon className="size-4" />
                </motion.span>
              </button>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/** Tiny read-only preview of the cai.cl structure (placeholders only). */
function RepresentativesPreview() {
  const items = caiContent.representatives.slice(0, 4);
  return (
    <div className="rounded-2xl bg-black/25 p-4 text-sm backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold tracking-wide text-white/70 uppercase">Estructura del CAi · pendiente de migrar</p>
      <ul className="divide-y divide-white/10">
        {items.map((rep) => (
          <li key={rep.id} className="flex items-center justify-between gap-3 py-2">
            <span>
              <span className="block font-medium">{rep.role}</span>
              <span className="block text-xs text-white/60">{caiRepresentativeAreaLabel[rep.area]}</span>
            </span>
            <span className="shrink-0 text-xs text-white/70">Nombre pendiente</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Gentle floating loop around the static SVG placeholder (transform only). */
function FloatingIllustration({ variant, accent, reduced }: { variant: ManualIllustration; accent: string; reduced: boolean }) {
  return (
    <motion.div
      className="size-full"
      animate={reduced ? undefined : { y: [0, -10, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    >
      <PlaceholderIllustration variant={variant} accent={accent} />
    </motion.div>
  );
}

/** Abstract SVG shapes; no real images. */
function PlaceholderIllustration({ variant, accent }: { variant: ManualIllustration; accent: string }) {
  const common = { className: "size-full", viewBox: "0 0 400 300", preserveAspectRatio: "xMidYMid slice", "aria-hidden": true } as const;
  const soft = "rgba(255,255,255,0.14)";

  switch (variant) {
    case "orbit":
      return (
        <svg {...common}>
          <circle cx="200" cy="140" r="70" fill={accent} opacity="0.9" />
          <circle cx="200" cy="140" r="110" fill="none" stroke={soft} strokeWidth="2" />
          <circle cx="200" cy="140" r="150" fill="none" stroke={soft} strokeWidth="2" strokeDasharray="6 10" />
          <circle cx="310" cy="140" r="14" fill="#fff" opacity="0.85" />
          <circle cx="95" cy="80" r="9" fill="#fff" opacity="0.6" />
        </svg>
      );
    case "blocks":
      return (
        <svg {...common}>
          {[0, 1, 2].map((row) =>
            [0, 1, 2, 3].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={70 + col * 70}
                y={50 + row * 70}
                width="54"
                height="54"
                rx="12"
                fill={(row + col) % 2 === 0 ? accent : soft}
                opacity={(row + col) % 2 === 0 ? 0.85 : 1}
              />
            )),
          )}
        </svg>
      );
    case "waves":
      return (
        <svg {...common}>
          <path d="M0 120 C 80 80, 120 160, 200 120 S 320 80, 400 120 V 300 H 0 Z" fill={soft} />
          <path d="M0 160 C 80 120, 120 200, 200 160 S 320 120, 400 160 V 300 H 0 Z" fill={accent} opacity="0.55" />
          <path d="M0 200 C 80 160, 120 240, 200 200 S 320 160, 400 200 V 300 H 0 Z" fill={accent} opacity="0.85" />
          <circle cx="300" cy="60" r="26" fill="#fff" opacity="0.8" />
        </svg>
      );
    case "plates":
      return (
        <svg {...common}>
          <ellipse cx="200" cy="170" rx="130" ry="60" fill={soft} />
          <circle cx="150" cy="150" r="46" fill={accent} opacity="0.9" />
          <circle cx="150" cy="150" r="28" fill="#fff" opacity="0.5" />
          <circle cx="255" cy="165" r="34" fill="#fff" opacity="0.35" />
          <rect x="300" y="60" width="18" height="110" rx="9" fill={accent} opacity="0.7" />
          <rect x="82" y="60" width="18" height="110" rx="9" fill="#fff" opacity="0.3" />
        </svg>
      );
    case "faces":
      return (
        <svg {...common}>
          {[
            [110, 120, 1],
            [200, 100, 1.25],
            [290, 120, 1],
            [155, 200, 0.85],
            [245, 200, 0.85],
          ].map(([cx, cy, s], i) => (
            <g key={i} transform={`translate(${cx} ${cy}) scale(${s})`}>
              <circle r="34" fill={i === 1 ? accent : soft} opacity={i === 1 ? 0.9 : 1} />
              <circle cy="-6" r="12" fill="#fff" opacity="0.7" />
              <path d="M-18 16 a18 12 0 0 1 36 0 Z" fill="#fff" opacity="0.7" />
            </g>
          ))}
        </svg>
      );
    case "confetti":
      return (
        <svg {...common}>
          {Array.from({ length: 22 }, (_, i) => {
            const x = (i * 97) % 400;
            const y = (i * 61) % 260;
            const rotate = (i * 37) % 180;
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={i % 3 === 0 ? 18 : 10}
                height={i % 3 === 0 ? 8 : 18}
                rx="3"
                fill={i % 2 === 0 ? accent : "#fff"}
                opacity={i % 2 === 0 ? 0.9 : 0.6}
                transform={`rotate(${rotate} ${x} ${y})`}
              />
            );
          })}
          <circle cx="200" cy="150" r="48" fill={soft} />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M200 40 L290 75 V 150 C 290 205 250 245 200 265 C 150 245 110 205 110 150 V 75 Z" fill={accent} opacity="0.9" />
          <path d="M200 70 L265 95 V 150 C 265 192 235 222 200 238 C 165 222 135 192 135 150 V 95 Z" fill={soft} />
          <path d="M170 150 l20 20 l40 -45" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
