"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BottomNav,
  RelicMeta,
  SpatialCue,
  StatusSignal,
} from "@/components/remy/relic-primitives";
import { SiteMenu } from "@/components/remy/site-menu";
import { createEtsyHandoff } from "@/commerce/etsy";
import { getCanonicalAsset } from "@/data/asset-manifest";
import {
  GREEN_DROP_FIGMA_LABEL,
  GREEN_DROP_LARIAT,
  GREEN_DROP_LARIAT_SLUG,
} from "@/data/golden-path";
import { MOTION_CONTRACT } from "@/motion/contract";
import { usePrefersReducedMotion } from "@/motion/use-prefers-reduced-motion";

import styles from "./current-screen.module.css";

const greenDrop = getCanonicalAsset("relic.greenDrop.sunlightMacro");
const evilEye = getCanonicalAsset("relic.evilEyeHex.macroBlackWhite");
const clearFound = getCanonicalAsset("relic.clearFoundTrapezoid.heroBokeh");
const redWindow = getCanonicalAsset("relic.redWindowRect.macroBokeh");
const handoff = (() => {
  const value = createEtsyHandoff(GREEN_DROP_LARIAT);

  if (value === null) {
    throw new Error("The PASS 01 relic must remain available.");
  }

  return value;
})();

type DragOrigin = {
  pointerId: number;
  x: number;
  y: number;
};

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function CurrentScreen() {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [promoting, setPromoting] = useState(false);
  const dragOrigin = useRef<DragOrigin | null>(null);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (navigationTimer.current !== null) {
        clearTimeout(navigationTimer.current);
      }
    },
    [],
  );

  function beginDrag(event: PointerEvent<HTMLElement>) {
    const target = event.target;

    if (
      prefersReducedMotion ||
      promoting ||
      (target instanceof Element && target.closest("a, button") !== null)
    ) {
      return;
    }

    dragOrigin.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveField(event: PointerEvent<HTMLElement>) {
    const origin = dragOrigin.current;

    if (origin === null || origin.pointerId !== event.pointerId) {
      return;
    }

    const max = MOTION_CONTRACT.ambientDisplacementPx.max;
    setDrag({
      x: Math.max(-max, Math.min(max, event.clientX - origin.x)),
      y: Math.max(-max, Math.min(max, event.clientY - origin.y)),
    });
  }

  function endDrag(event: PointerEvent<HTMLElement>) {
    if (dragOrigin.current?.pointerId !== event.pointerId) {
      return;
    }

    dragOrigin.current = null;
    setDrag({ x: 0, y: 0 });

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function inspectRelic(event: MouseEvent<HTMLAnchorElement>) {
    if (isModifiedClick(event) || promoting) {
      return;
    }

    event.preventDefault();
    setDrag({ x: 0, y: 0 });
    setPromoting(true);
    navigationTimer.current = setTimeout(
      () => router.push(`/relic/${GREEN_DROP_LARIAT_SLUG}`, { scroll: false }),
      prefersReducedMotion
        ? MOTION_CONTRACT.reducedMotionMs
        : MOTION_CONTRACT.currentToInspectionMs,
    );
  }

  const motionStyle = {
    "--drag-foreground-x": `${drag.x}px`,
    "--drag-foreground-y": `${drag.y}px`,
    "--drag-mid-x": `${drag.x * MOTION_CONTRACT.depthMultipliers.mid}px`,
    "--drag-mid-y": `${drag.y * MOTION_CONTRACT.depthMultipliers.mid}px`,
    "--drag-far-x": `${drag.x * MOTION_CONTRACT.depthMultipliers.far}px`,
    "--drag-far-y": `${drag.y * MOTION_CONTRACT.depthMultipliers.far}px`,
  } as CSSProperties;

  return (
    <main
      aria-busy={promoting}
      className={`${styles.screen} ${promoting ? styles.promoting : ""}`}
      data-motion={prefersReducedMotion ? "reduced" : "full"}
      data-node-id="543:2"
      data-screen="current"
      onPointerCancel={endDrag}
      onPointerDown={beginDrag}
      onPointerMove={moveField}
      onPointerUp={endDrag}
      style={motionStyle}
    >
      <header className={styles.chrome}>
        <h1 className={styles.title}>CURRENT RECOVERIES</h1>
        <StatusSignal className={styles.titleSignal} />
        <p className={styles.availableCount}>07 AVAILABLE</p>
        <SiteMenu className={styles.menuGlyph} />
        <p className={styles.fieldLabel}>
          FIELD / 01
          <br />
          DRAG · TAP · INSPECT
        </p>
      </header>

      <Link
        aria-label="Inspect Green Drop Lariat"
        className={styles.activeObject}
        data-testid="active-relic"
        href={`/relic/${GREEN_DROP_LARIAT_SLUG}`}
        onClick={inspectRelic}
        scroll={false}
      >
        <Image
          alt="Green teardrop lariat resting in sunlight"
          fill
          loading="eager"
          sizes="(max-width: 390px) 68vw, 265px"
          src={greenDrop.publicPath}
        />
      </Link>

      <div className={`${styles.trace} ${styles.eyeTrace}`}>
        <Image alt="" fill loading="eager" sizes="120px" src={evilEye.publicPath} />
      </div>
      <div className={`${styles.trace} ${styles.clearTrace}`}>
        <Image alt="" fill sizes="212px" src={clearFound.publicPath} />
      </div>
      <div className={`${styles.trace} ${styles.redTrace}`}>
        <Image alt="" fill sizes="104px" src={redWindow.publicPath} />
      </div>

      <div className={styles.fieldCopy}>
        <p className={styles.activeCount}>ACTIVE 01 / 07</p>
        <span className={styles.tether} />
        <RelicMeta
          className={styles.activeMeta}
          displayName={GREEN_DROP_FIGMA_LABEL}
          relicId={GREEN_DROP_LARIAT.id}
        />
        <SpatialCue className={styles.inspectCue} label="TAP TO INSPECT ↗" />
        <p className={styles.eyeLabel}>02 / EYE HEX</p>
        <p className={styles.clearLabel}>03 / CLEAR FOUND</p>
        <p className={styles.redLabel}>04 / RED WINDOW</p>
      </div>

      <BottomNav handoff={handoff} />
    </main>
  );
}
