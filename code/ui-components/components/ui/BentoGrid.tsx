"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

/**
 * Bento grid, based on Денис's draft (2026-10-08).
 * Colours come from theme tokens: light on the white site, dark automatically inside
 * <main data-role="industrial"> (B2B), or forced with tone="dark".
 * Media: next/image poster always; video only on hover (desktop) or while on screen
 * (touch), never with Save-Data or "reduce motion".
 */
export function BentoGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 gap-4 [grid-auto-flow:dense] sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${className}`}>
      {children}
    </div>
  );
}

export interface BentoItemProps {
  title: string;
  category: string;
  description?: string;
  /** Grid spans etc., e.g. "md:col-span-2 md:row-span-2". */
  className?: string;
  bgMedia?:
    | { type: "image"; src: string; alt?: string }
    | { type: "video"; src: string; webm?: string; poster: string; alt?: string };
  href?: string;
  /** Force a theme for this card; default follows the section. */
  tone?: "auto" | "dark";
  /** Only for the card that is the LCP element on the page. */
  priority?: boolean;
  children?: ReactNode;
}

export function BentoCard({
  title, category, description, className = "", bgMedia, href, tone = "auto", priority, children,
}: BentoItemProps) {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [canPlay, setCanPlay] = useState(false);
  const [playing, setPlaying] = useState(false);
  const isVideo = bgMedia?.type === "video";

  useEffect(() => {
    if (!isVideo || reduce) return;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (!saveData) setCanPlay(true);
  }, [isVideo, reduce]);

  // Touch screens: play while at least 60 % of the card is visible, pause otherwise.
  useEffect(() => {
    if (!canPlay || !root.current || window.matchMedia("(hover: hover)").matches) return;
    const io = new IntersectionObserver(([e]) => setPlaying(e.intersectionRatio >= 0.6), { threshold: [0, 0.6] });
    io.observe(root.current);
    return () => io.disconnect();
  }, [canPlay]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (playing) v.play().catch(() => undefined);
    else v.pause();
  }, [playing]);

  const poster = bgMedia ? (bgMedia.type === "video" ? bgMedia.poster : bgMedia.src) : null;

  const body = (
    <>
      {bgMedia && poster && (
        <div className="absolute inset-0 -z-10" aria-hidden={!bgMedia.alt}>
          <Image src={poster} alt={bgMedia.alt ?? ""} fill priority={priority} sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          {bgMedia.type === "video" && canPlay && (
            <video ref={video} muted loop playsInline preload="none" poster={bgMedia.poster} aria-hidden="true"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${playing ? "opacity-100" : "opacity-0"}`}>
              {playing && bgMedia.webm && <source src={bgMedia.webm} type="video/webm" />}
              {playing && <source src={bgMedia.src} type="video/mp4" />}
            </video>
          )}
          {/* Keeps text readable over any photo: fades to the card background at the bottom. */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[color-mix(in_srgb,var(--bg)_55%,transparent)] to-transparent" />
        </div>
      )}

      <div className="flex h-full flex-col justify-between">
        <div className={bgMedia ? "mt-auto" : ""}>
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--role-accent)]" style={{ fontFamily: "var(--font-spec)" }}>
            {category}
          </span>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink)] [text-wrap:balance]">{title}</h3>
          {description && <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>}
        </div>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </>
  );

  const cardClass =
    "group relative isolate flex h-full min-h-[220px] flex-col overflow-hidden rounded-[calc(var(--radius)+6px)] " +
    "border border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--ink)] shadow-[0_1px_2px_rgba(15,29,51,.06)] " +
    "transition-[border-color,box-shadow] hover:border-[var(--muted)] hover:shadow-[0_12px_32px_rgba(15,29,51,.12)] " +
    "outline-none focus-visible:ring-4 focus-visible:ring-[var(--buy)] focus-visible:ring-offset-2";

  return (
    <motion.div
      ref={root}
      data-role={tone === "dark" ? "industrial" : undefined}
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onPointerEnter={(e: PointerEvent) => e.pointerType === "mouse" && canPlay && setPlaying(true)}
      onPointerLeave={(e: PointerEvent) => e.pointerType === "mouse" && setPlaying(false)}
      className={className}
    >
      {href ? <Link href={href} className={cardClass}>{body}</Link> : <div className={cardClass}>{body}</div>}
    </motion.div>
  );
}
