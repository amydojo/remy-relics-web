"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AcquireCta,
  EvidenceLabel,
  InspectionSheet,
  RemyState,
  SpatialCue,
  StatusSignal,
  TransferStamp,
} from "@/components/remy/relic-primitives";
import { SiteMenu } from "@/components/remy/site-menu";
import { createEtsyHandoff } from "@/commerce/etsy";
import { getCanonicalAsset } from "@/data/asset-manifest";
import {
  formatRecoveryDate,
  formatRelicPrice,
} from "@/data/golden-path";
import type { Relic } from "@/data/relic";
import { getRelicObjectMedia } from "@/data/relic-object-media";
import { createBrowserInspectionLogStore } from "@/inspection-log/storage";
import { MOTION_CONTRACT } from "@/motion/contract";
import { usePrefersReducedMotion } from "@/motion/use-prefers-reduced-motion";

import styles from "./relic-experience.module.css";

const inspectionEvidenceTotal = 5;

type ExperienceMode = "inspection" | "record";
type TransitionPhase = "rest" | "holding" | "record-entering";
type TransferRevealState = "hidden" | "revealing" | "settled";

type EvidencePointer = {
  lastAt: number;
  lastX: number;
  pointerId: number;
  startX: number;
  velocity: number;
};

export function RelicExperience({
  displayLabel,
  initialMode = "inspection",
  relic,
}: {
  displayLabel: string;
  initialMode?: ExperienceMode;
  relic: Relic;
}) {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [mode, setMode] = useState<ExperienceMode>(() =>
    relic.status === "transferred" ? "record" : initialMode,
  );
  const [phase, setPhase] = useState<TransitionPhase>("rest");
  const [inspectionEvidence, setInspectionEvidence] = useState(0);
  const [recordEvidence, setRecordEvidence] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [transferReveal, setTransferReveal] =
    useState<TransferRevealState>("hidden");
  const evidencePointer = useRef<EvidencePointer | null>(null);
  const dragDistance = useRef(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const transferRevealStarted = useRef(false);
  const handoff = createEtsyHandoff(relic);
  const price = relic.status === "available" ? formatRelicPrice(relic) : null;
  const objectMedia = getRelicObjectMedia(relic);
  const heroAsset = getCanonicalAsset(relic.assets.hero);
  const wornAsset = getCanonicalAsset(
    relic.assets.evidence[2]?.assetKey ?? relic.assets.hero,
  );

  useEffect(() => {
    createBrowserInspectionLogStore().recordInspection(relic.id, relic.status);
  }, [relic.id, relic.status]);

  useEffect(() => {
    if (relic.status !== "transferred" || transferRevealStarted.current) {
      return;
    }

    const store = createBrowserInspectionLogStore();
    const pendingReveal = store.hasPendingTransferReveal(relic.id, relic.status);

    if (!pendingReveal) {
      timers.current.push(setTimeout(() => setTransferReveal("settled"), 0));
      return;
    }

    transferRevealStarted.current = true;
    const pause = prefersReducedMotion
      ? 0
      : MOTION_CONTRACT.transferRevealPauseMs;
    const settle = prefersReducedMotion
      ? MOTION_CONTRACT.reducedMotionMs
      : MOTION_CONTRACT.transferRevealSettleMs;

    timers.current.push(
      setTimeout(() => setTransferReveal("revealing"), pause),
      setTimeout(() => {
        store.acknowledgeTransfer(relic.id);
        setTransferReveal("settled");
      }, pause + settle),
    );
  }, [prefersReducedMotion, relic.id, relic.status]);

  useEffect(() => {
    const scheduledTimers = timers.current;

    return () => {
      for (const timer of scheduledTimers) {
        clearTimeout(timer);
      }
    };
  }, []);

  function beginEvidenceDrag(event: PointerEvent<HTMLDivElement>) {
    evidencePointer.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      lastX: event.clientX,
      lastAt: event.timeStamp,
      velocity: 0,
    };
    dragDistance.current = 0;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveEvidence(event: PointerEvent<HTMLDivElement>) {
    const pointer = evidencePointer.current;

    if (pointer === null || pointer.pointerId !== event.pointerId) {
      return;
    }

    const elapsed = Math.max(1, event.timeStamp - pointer.lastAt);
    pointer.velocity = (event.clientX - pointer.lastX) / elapsed;
    pointer.lastX = event.clientX;
    pointer.lastAt = event.timeStamp;

    let nextDrag = event.clientX - pointer.startX;
    const atStart = inspectionEvidence === 0 && nextDrag > 0;
    const atEnd =
      inspectionEvidence === relic.assets.evidence.length - 1 &&
      nextDrag < 0;

    if (atStart || atEnd) {
      nextDrag = 0;
    }

    dragDistance.current = nextDrag;
    setDragX(nextDrag);
  }

  function finishEvidenceDrag(event: PointerEvent<HTMLDivElement>) {
    const pointer = evidencePointer.current;

    if (pointer === null || pointer.pointerId !== event.pointerId) {
      return;
    }

    const projected = dragDistance.current + pointer.velocity * 90;
    const threshold = event.currentTarget.clientWidth * 0.16;
    let nextIndex = inspectionEvidence;

    if (projected <= -threshold) {
      nextIndex = Math.min(
        relic.assets.evidence.length - 1,
        inspectionEvidence + 1,
      );
    } else if (projected >= threshold) {
      nextIndex = Math.max(0, inspectionEvidence - 1);
    }

    evidencePointer.current = null;
    dragDistance.current = 0;
    setDragging(false);
    setDragX(0);
    setInspectionEvidence(nextIndex);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleEvidenceKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let nextIndex = inspectionEvidence;

    if (event.key === "ArrowRight") {
      nextIndex = Math.min(
        relic.assets.evidence.length - 1,
        inspectionEvidence + 1,
      );
    } else if (event.key === "ArrowLeft") {
      nextIndex = Math.max(0, inspectionEvidence - 1);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = relic.assets.evidence.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    setDragX(0);
    setInspectionEvidence(nextIndex);
  }

  function showFullRecord() {
    if (phase !== "rest") {
      return;
    }

    if (prefersReducedMotion) {
      setMode("record");
      setPhase("record-entering");
      timers.current.push(
        setTimeout(() => setPhase("rest"), MOTION_CONTRACT.reducedMotionMs),
      );
      return;
    }

    setPhase("holding");
    timers.current.push(
      setTimeout(() => {
        setMode("record");
        setPhase("record-entering");
      }, MOTION_CONTRACT.inspectionToRecordHoldMs),
    );
    timers.current.push(
      setTimeout(
        () => setPhase("rest"),
        MOTION_CONTRACT.inspectionToRecordTotalMs,
      ),
    );
  }

  const evidenceCount = relic.assets.evidence.length;
  const evidenceTrackStyle = {
    transform: `translate3d(calc(${-inspectionEvidence * (100 / evidenceCount)}% + ${dragX}px), 0, 0)`,
    width: `${evidenceCount * 100}%`,
  } as CSSProperties;

  return (
    <main
      className={styles.experience}
      data-motion={prefersReducedMotion ? "reduced" : "full"}
      data-node-id={mode === "inspection" ? "544:31" : "545:56"}
      data-screen={mode}
      data-status={relic.status}
      data-transfer-reveal={transferReveal}
      data-transition={phase}
    >
      {mode === "inspection" && relic.status === "available" && handoff !== null && price !== null ? (
        <>
          <h1 className={styles.visuallyHidden}>{displayLabel}</h1>
          <header className={`${styles.inspectionHeader} ${styles.inspectionFade}`}>
            <button
              aria-label="Back to Current Recoveries"
              className={styles.backButton}
              onClick={() => router.back()}
              type="button"
            >
              ←
            </button>
            <p className={styles.inspectionId}>{relic.id}</p>
            <StatusSignal className={styles.inspectionStatus} />
            <span aria-hidden className={styles.shareGlyph}>↗</span>
            <span aria-hidden className={styles.moreGlyph}>•••</span>
          </header>

          <div
            aria-label={`Relic evidence, item ${inspectionEvidence + 1} of ${relic.assets.evidence.length}`}
            aria-roledescription="carousel"
            className={styles.inspectionViewport}
            data-testid="inspection-evidence"
            onKeyDown={handleEvidenceKeyDown}
            onPointerCancel={finishEvidenceDrag}
            onPointerDown={beginEvidenceDrag}
            onPointerMove={moveEvidence}
            onPointerUp={finishEvidenceDrag}
            role="region"
            tabIndex={0}
          >
            <div
              className={`${styles.inspectionTrack} ${dragging ? styles.dragging : ""}`}
              style={evidenceTrackStyle}
            >
              {relic.assets.evidence.map((evidence, index) => {
                const asset = getCanonicalAsset(evidence.assetKey);
                const isObjectHero = index === 0;

                return (
                  <div
                    className={styles.inspectionSlide}
                    data-evidence-index={evidence.index}
                    data-object-media-key={
                      isObjectHero ? objectMedia.canonicalAssetKey : undefined
                    }
                    data-relic-id={isObjectHero ? objectMedia.relicId : undefined}
                    data-testid={isObjectHero ? "inspection-hero" : undefined}
                    key={`${evidence.index}-${evidence.label}`}
                    style={{ width: `${100 / evidenceCount}%` }}
                  >
                    <Image
                      alt={isObjectHero ? `${relic.name} resting in sunlight` : ""}
                      className={
                        isObjectHero
                          ? styles.fullObjectImage
                          : index === 1
                            ? styles.surfaceImage
                            : styles.wornImage
                      }
                      fill
                      loading={isObjectHero ? "eager" : "lazy"}
                      sizes="(max-width: 390px) calc(100vw - 32px), 358px"
                      src={
                        isObjectHero
                          ? objectMedia.masterAsset.publicPath
                          : asset.publicPath
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <p
            aria-live="polite"
            className={`${styles.inspectionCounter} ${styles.inspectionFade}`}
            data-testid="evidence-counter"
          >
            {String(inspectionEvidence + 1).padStart(2, "0")} / {String(inspectionEvidenceTotal).padStart(2, "0")}&nbsp; · &nbsp;
            {relic.assets.evidence[inspectionEvidence]?.label}
          </p>
          <p className={`${styles.swipeLabel} ${styles.inspectionFade}`}>
            SWIPE EVIDENCE ↔
          </p>
          <div className={`${styles.sheetPosition} ${styles.inspectionFade}`}>
            <InspectionSheet
              classification={relic.classification}
              condition={relic.condition}
              relicId={relic.id}
            />
          </div>
          <button
            className={`${styles.fullRecordButton} ${styles.inspectionFade}`}
            data-testid="view-full-record"
            onClick={showFullRecord}
            type="button"
          >
            VIEW FULL RECORD ↓
          </button>
          <div className={`${styles.inspectionAcquire} ${styles.inspectionFade}`}>
            <AcquireCta context="inspection" handoff={handoff} price={price} />
          </div>
        </>
      ) : (
        <section
          className={`${styles.recordScreen} ${phase === "record-entering" ? styles.recordEntering : ""}`}
          data-active-evidence={recordEvidence + 1}
        >
          <button
            aria-label={
              relic.status === "transferred"
                ? "Back to Archive"
                : "Back to Current Recoveries"
            }
            className={styles.recordBack}
            onClick={() => router.back()}
            type="button"
          >
            ←
          </button>
          <p className={styles.recordId}>{relic.id}</p>
          <SiteMenu className={styles.recordMenu} />
          <h1 className={styles.recordTitle}>{displayLabel}</h1>
          <p className={styles.recordStatus}>
            OBJECT RECORD / {relic.status === "available" ? "ACTIVE" : "TRANSFERRED"}
          </p>
          <p className={styles.recordFieldLabel}>
            EVIDENCE FIELD / 03
            <br />
            TAP ANY TRACE
          </p>

          <button
            aria-label="Show full-object evidence"
            className={styles.recordHero}
            onClick={() => setRecordEvidence(0)}
            type="button"
          >
            <Image
              alt={`${relic.name} full-object evidence`}
              fill
              loading="eager"
              sizes="290px"
              src={heroAsset.publicPath}
            />
          </button>
          {relic.status === "transferred" ? (
            <TransferStamp
              className={styles.recordTransferStamp}
              reveal={transferReveal}
            />
          ) : null}
          <EvidenceLabel
            className={styles.recordEvidenceLabel}
            index={recordEvidence + 1}
            label={recordEvidence === 0 ? "FULL OBJECT" : "SURFACE"}
          />
          <button
            aria-label="Promote surface evidence"
            className={styles.recordMacro}
            onClick={() => setRecordEvidence(1)}
            type="button"
          >
            <Image
              alt=""
              fill
              loading="eager"
              sizes="122px"
              src={heroAsset.publicPath}
            />
          </button>
          <div className={styles.recordContext}>
            <Image alt="" fill sizes="212px" src={wornAsset.publicPath} />
          </div>
          <p className={styles.surfaceLabel}>02 / SURFACE</p>
          <p className={styles.wornLabel}>03 / WORN SCALE</p>
          <button
            className={styles.tapEvidence}
            onClick={() => setRecordEvidence(1)}
            type="button"
          >
            <SpatialCue label="TAP EVIDENCE ↗" />
          </button>

          <div className={styles.recordFacts}>
            <dl>
              <div>
                <dt>RELIC ID</dt>
                <dd>{relic.id}</dd>
              </div>
              <div>
                <dt>RECOVERY</dt>
                <dd>{formatRecoveryDate(relic.recoveredOn)}</dd>
              </div>
              <div>
                <dt>MATERIAL</dt>
                <dd>{relic.materials.join(" / ")}</dd>
              </div>
              <div>
                <dt>CONDITION</dt>
                <dd>{relic.condition}</dd>
              </div>
              <div>
                <dt>ASSEMBLY</dt>
                <dd>{relic.assembly}</dd>
              </div>
              {relic.status === "transferred" && relic.transferredOn !== undefined ? (
                <div>
                  <dt>TRANSFER</dt>
                  <dd>{formatRecoveryDate(relic.transferredOn)}</dd>
                </div>
              ) : null}
            </dl>
          </div>
          <RemyState
            className={styles.remyClipboard}
            state={relic.status === "transferred" ? "box" : "clipboard"}
          />
          {relic.status === "available" && handoff !== null && price !== null ? (
            <div className={styles.recordAcquire}>
              <AcquireCta context="record" handoff={handoff} price={price} />
            </div>
          ) : (
            <Link className={styles.transferredReturn} href="/current">
              VIEW CURRENT RECOVERIES →
            </Link>
          )}
        </section>
      )}
    </main>
  );
}
