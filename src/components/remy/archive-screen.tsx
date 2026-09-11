"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  type PointerEvent,
  useRef,
  useState,
} from "react";

import {
  BottomNav,
  RemyState,
  SpatialCue,
  TransferStamp,
} from "@/components/remy/relic-primitives";
import { SiteMenu } from "@/components/remy/site-menu";
import {
  formatCanonicalDate,
  type ResolvedRelicCommerce,
} from "@/commerce/catalog-adapter";
import { ARCHIVE_TRACES } from "@/data/archive";
import { getCanonicalAsset } from "@/data/asset-manifest";
import { MOTION_CONTRACT } from "@/motion/contract";
import { usePrefersReducedMotion } from "@/motion/use-prefers-reduced-motion";

import styles from "./archive-screen.module.css";

type DragOrigin = {
  pointerId: number;
  x: number;
  y: number;
};

const traceClasses = {
  1: styles.traceOne,
  2: styles.traceTwo,
  3: styles.traceThree,
  4: styles.traceFour,
} as const;

const stampClasses = {
  1: styles.stampOne,
  2: styles.stampTwo,
  3: styles.stampThree,
  4: styles.stampFour,
} as const;

export function ArchiveScreen({
  commerce,
}: {
  commerce: ResolvedRelicCommerce;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragOrigin = useRef<DragOrigin | null>(null);
  const includesGreenDrop = commerce.status === "transferred";
  const visibleTraces = ARCHIVE_TRACES.filter(
    (trace) => trace.index !== 4 || includesGreenDrop,
  );
  const transferDate = formatCanonicalDate(commerce.transferDate);

  function beginDrag(event: PointerEvent<HTMLElement>) {
    const target = event.target;

    if (
      prefersReducedMotion ||
      (target instanceof Element && target.closest("a, button") !== null)
    ) {
      return;
    }

    dragOrigin.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveField(event: PointerEvent<HTMLElement>) {
    const origin = dragOrigin.current;

    if (origin === null || origin.pointerId !== event.pointerId) {
      return;
    }

    setDrag({
      x: Math.max(-28, Math.min(28, event.clientX - origin.x)),
      y: Math.max(-18, Math.min(18, event.clientY - origin.y)),
    });
  }

  function finishDrag(event: PointerEvent<HTMLElement>) {
    if (dragOrigin.current?.pointerId !== event.pointerId) {
      return;
    }

    dragOrigin.current = null;
    setDragging(false);
    setDrag({ x: 0, y: 0 });

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  const fieldStyle = {
    "--archive-foreground-x": `${drag.x}px`,
    "--archive-foreground-y": `${drag.y}px`,
    "--archive-mid-x": `${drag.x * MOTION_CONTRACT.depthMultipliers.mid}px`,
    "--archive-mid-y": `${drag.y * MOTION_CONTRACT.depthMultipliers.mid}px`,
    "--archive-far-x": `${drag.x * MOTION_CONTRACT.depthMultipliers.far}px`,
    "--archive-far-y": `${drag.y * MOTION_CONTRACT.depthMultipliers.far}px`,
  } as CSSProperties;

  return (
    <main
      className={`${styles.screen} ${dragging ? styles.dragging : ""}`}
      data-motion={prefersReducedMotion ? "reduced" : "full"}
      data-node-id="547:65"
      data-screen="archive"
      data-testid="archive-field"
      onPointerCancel={finishDrag}
      onPointerDown={beginDrag}
      onPointerMove={moveField}
      onPointerUp={finishDrag}
      style={fieldStyle}
    >
      <header>
        <h1 className={styles.title}>ARCHIVE</h1>
        <p className={styles.count}>
          {includesGreenDrop ? "12" : "11"} TRANSFERRED
        </p>
        <SiteMenu className={styles.menuGlyph} />
        <p className={styles.fieldLabel}>
          ARCHIVE FIELD / 12
          <br />
          TRANSFERRED TRACES
        </p>
        <SpatialCue className={styles.roamCue} label="DRAG FIELD ↔" />
      </header>

      <section aria-label="Transferred relic traces" className={styles.traceField}>
        {visibleTraces.map((trace, index) => {
          const asset = getCanonicalAsset(trace.assetKey);
          const className = `${styles.trace} ${traceClasses[trace.index]}`;
          const image = (
            <>
              <Image
                alt={trace.alt}
                fill
                loading={
                  index === 0 || trace.assetKey === "relic.greenDrop.sunlightMacro"
                    ? "eager"
                    : "lazy"
                }
                sizes={index === 0 ? "240px" : trace.index === 4 ? "164px" : "112px"}
                src={asset.publicPath}
              />
              <TransferStamp className={stampClasses[trace.index]} />
            </>
          );

          return trace.index === 4 ? (
            <Link
              aria-label="View transferred Green Drop Lariat record"
              className={`${className} ${styles.traceLink}`}
              data-depth={trace.depth}
              data-testid="archive-green-drop"
              href="/relic/green-drop-lariat?view=record"
              key={trace.index}
            >
              {image}
            </Link>
          ) : (
            <figure
              className={className}
              data-depth={trace.depth}
              key={trace.index}
            >
              {image}
            </figure>
          );
        })}

        <span aria-hidden className={styles.activeTether} />
        <p className={styles.activeTrace}>
          TRACE 01
          <br />
          TRANSFERRED
        </p>
        <p className={styles.traceTwoLabel}>TRACE 02</p>
        <p className={styles.traceThreeLabel}>TRACE 03</p>
        {includesGreenDrop ? (
          <>
            <p className={styles.traceFourLabel}>TRACE 04</p>
            {transferDate ? (
              <p className={styles.traceFourDate}>TRANSFER / {transferDate}</p>
            ) : null}
          </>
        ) : null}
      </section>

      <p className={styles.archiveNote}>
        PAST OBJECTS REMAIN IN THE FIELD.
        <br />
        DRAG TO ROAM · TAP TO REOPEN.
      </p>
      <RemyState className={styles.remyBox} state="box" />
      <BottomNav active="archive" />
    </main>
  );
}
