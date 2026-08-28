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
import { flushSync } from "react-dom";

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
import { getRelicObjectMedia } from "@/data/relic-object-media";
import { MOTION_CONTRACT } from "@/motion/contract";
import { confirmDecodedImageWithin } from "@/motion/image-readiness";
import {
  flipTransformVariables,
  getFlipTransform,
  getInspectionHeroRect,
  type FlipTransform,
} from "@/motion/object-lift";
import { usePrefersReducedMotion } from "@/motion/use-prefers-reduced-motion";

import styles from "./current-screen.module.css";

const greenDropMedia = getRelicObjectMedia(GREEN_DROP_LARIAT);
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

type ObjectTransitionPhase =
  | "idle"
  | "lifting"
  | "travel-prep"
  | "traveling"
  | "dissolving";

const IDENTITY_FLIP: FlipTransform = { x: 0, y: 0, scaleX: 1, scaleY: 1 };

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function CurrentScreen() {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [objectTransition, setObjectTransition] =
    useState<ObjectTransitionPhase>("idle");
  const [flip, setFlip] = useState<FlipTransform>(IDENTITY_FLIP);
  const dragOrigin = useRef<DragOrigin | null>(null);
  const screenRef = useRef<HTMLElement | null>(null);
  const activeObjectRef = useRef<HTMLAnchorElement | null>(null);
  const inspectionPreloadRef = useRef<HTMLImageElement | null>(null);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const transitionInFlight = useRef(false);
  const promoting = objectTransition !== "idle";

  useEffect(
    () => () => {
      mounted.current = false;
      if (navigationTimer.current !== null) {
        clearTimeout(navigationTimer.current);
      }
      if (phaseTimer.current !== null) {
        clearTimeout(phaseTimer.current);
      }
    },
    [],
  );

  function scheduleNavigation(delayMs: number) {
    navigationTimer.current = setTimeout(
      () => router.push(`/relic/${GREEN_DROP_LARIAT_SLUG}`, { scroll: false }),
      delayMs,
    );
  }

  function dissolveToInspection() {
    if (!mounted.current) {
      return;
    }

    setObjectTransition("dissolving");
    scheduleNavigation(MOTION_CONTRACT.reducedMotionMs);
  }

  async function beginObjectLift() {
    const mediaReady = await confirmDecodedImageWithin(
      inspectionPreloadRef.current,
      MOTION_CONTRACT.mediaDecodeBudgetMs,
    );

    if (!mounted.current) {
      return;
    }

    if (!mediaReady) {
      dissolveToInspection();
      return;
    }

    setObjectTransition("lifting");
    phaseTimer.current = setTimeout(() => {
      const source = activeObjectRef.current?.getBoundingClientRect();
      const screen = screenRef.current?.getBoundingClientRect();

      if (source === undefined || screen === undefined) {
        dissolveToInspection();
        return;
      }

      const destination = getInspectionHeroRect(screen);
      const nextFlip = getFlipTransform(source, destination);

      flushSync(() => {
        setFlip(nextFlip);
        setObjectTransition("travel-prep");
      });

      void activeObjectRef.current?.offsetWidth;

      flushSync(() => {
        setObjectTransition("traveling");
      });
      scheduleNavigation(MOTION_CONTRACT.objectTravelMs);
    }, MOTION_CONTRACT.objectLiftMs);
  }

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
    if (isModifiedClick(event) || transitionInFlight.current) {
      return;
    }

    event.preventDefault();
    transitionInFlight.current = true;
    setDrag({ x: 0, y: 0 });

    if (prefersReducedMotion) {
      dissolveToInspection();
      return;
    }

    void beginObjectLift();
  }

  const motionStyle = {
    "--drag-foreground-x": `${drag.x}px`,
    "--drag-foreground-y": `${drag.y}px`,
    "--drag-mid-x": `${drag.x * MOTION_CONTRACT.depthMultipliers.mid}px`,
    "--drag-mid-y": `${drag.y * MOTION_CONTRACT.depthMultipliers.mid}px`,
    "--drag-far-x": `${drag.x * MOTION_CONTRACT.depthMultipliers.far}px`,
    "--drag-far-y": `${drag.y * MOTION_CONTRACT.depthMultipliers.far}px`,
    ...flipTransformVariables(flip),
  } as CSSProperties;

  return (
    <main
      aria-busy={promoting}
      className={styles.screen}
      data-motion={prefersReducedMotion ? "reduced" : "full"}
      data-node-id="543:2"
      data-object-transition={objectTransition}
      data-screen="current"
      onPointerCancel={endDrag}
      onPointerDown={beginDrag}
      onPointerMove={moveField}
      onPointerUp={endDrag}
      ref={screenRef}
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
        data-object-media-key={greenDropMedia.canonicalAssetKey}
        data-relic-id={greenDropMedia.relicId}
        data-testid="active-relic"
        href={`/relic/${GREEN_DROP_LARIAT_SLUG}`}
        onClick={inspectRelic}
        ref={activeObjectRef}
        scroll={false}
      >
        <Image
          alt="Green teardrop lariat resting in sunlight"
          fill
          loading="eager"
          sizes="(max-width: 390px) 68vw, 265px"
          src={greenDropMedia.masterAsset.publicPath}
        />
      </Link>

      <div aria-hidden className={styles.inspectionPreload}>
        <Image
          alt=""
          fill
          loading="eager"
          ref={inspectionPreloadRef}
          sizes="(max-width: 390px) calc(100vw - 32px), 358px"
          src={greenDropMedia.masterAsset.publicPath}
        />
      </div>

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
