"use client";

import Image from "next/image";
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
import { createEtsyHandoff } from "@/commerce/etsy";
import { ARCHIVE_TRACES } from "@/data/archive";
import { getCanonicalAsset } from "@/data/asset-manifest";
import { GREEN_DROP_LARIAT } from "@/data/golden-path";
import { MOTION_CONTRACT } from "@/motion/contract";
import { usePrefersReducedMotion } from "@/motion/use-prefers-reduced-motion";

import styles from "./archive-screen.module.css";

const archiveHandoff = (() => {
  const handoff = createEtsyHandoff(GREEN_DROP_LARIAT);

  if (handoff === null) {
    throw new Error("The current canonical Etsy handoff is unavailable.");
  }

  return handoff;
})();

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

export function ArchiveScreen() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragOrigin = useRef<DragOrigin | null>(null);

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
        <p className={styles.count}>12 TRANSFERRED</p>
        <SiteMenu className={styles.menuGlyph} />
        <p className={styles.fieldLabel}>
          ARCHIVE FIELD / 12
          <br />
          TRANSFERRED TRACES
        </p>
        <SpatialCue className={styles.roamCue} label="DRAG FIELD ↔" />
      </header>

      <section aria-label="Transferred relic traces" className={styles.traceField}>
        {ARCHIVE_TRACES.map((trace, index) => {
          const asset = getCanonicalAsset(trace.assetKey);

          return (
            <figure
              className={`${styles.trace} ${traceClasses[trace.index]}`}
              data-depth={trace.depth}
              key={trace.index}
            >
              <Image
                alt={trace.alt}
                fill
                loading={
                  index === 0 || trace.assetKey === "relic.greenDrop.sunlightMacro"
                    ? "eager"
                    : "lazy"
                }
                sizes={index === 0 ? "240px" : index === 3 ? "164px" : "112px"}
                src={asset.publicPath}
              />
              <TransferStamp className={stampClasses[trace.index]} />
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
        <p className={styles.traceFourLabel}>TRACE 04</p>
      </section>

      <p className={styles.archiveNote}>
        PAST OBJECTS REMAIN IN THE FIELD.
        <br />
        DRAG TO ROAM · TAP TO REOPEN.
      </p>
      <RemyState className={styles.remyBox} state="box" />
      <BottomNav active="archive" handoff={archiveHandoff} />
    </main>
  );
}
