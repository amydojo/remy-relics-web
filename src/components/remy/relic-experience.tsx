"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
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
} from "@/components/remy/relic-primitives";
import { createEtsyHandoff } from "@/commerce/etsy";
import { getCanonicalAsset } from "@/data/asset-manifest";
import {
  formatRecoveryDate,
  formatRelicPrice,
  GREEN_DROP_FIGMA_LABEL,
  GREEN_DROP_LARIAT,
} from "@/data/golden-path";
import { createBrowserInspectionLogStore } from "@/inspection-log/storage";
import { MOTION_CONTRACT } from "@/motion/contract";
import { usePrefersReducedMotion } from "@/motion/use-prefers-reduced-motion";

import styles from "./relic-experience.module.css";

const greenDrop = getCanonicalAsset("relic.greenDrop.sunlightMacro");
const wornMacro = getCanonicalAsset("relic.greenDrop.wornMacro");
const handoff = (() => {
  const value = createEtsyHandoff(GREEN_DROP_LARIAT);

  if (value === null) {
    throw new Error("The PASS 01 relic must remain available.");
  }

  return value;
})();
const price = formatRelicPrice(GREEN_DROP_LARIAT);
const inspectionEvidenceTotal = 5;

type ExperienceMode = "inspection" | "record";
type TransitionPhase = "rest" | "holding" | "record-entering";

type EvidencePointer = {
  lastAt: number;
  lastX: number;
  pointerId: number;
  startX: number;
  velocity: number;
};

export function RelicExperience() {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [mode, setMode] = useState<ExperienceMode>("inspection");
  const [phase, setPhase] = useState<TransitionPhase>("rest");
  const [inspectionEvidence, setInspectionEvidence] = useState(0);
  const [recordEvidence, setRecordEvidence] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const evidencePointer = useRef<EvidencePointer | null>(null);
  const dragDistance = useRef(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    const scheduledTimers = timers.current;

    createBrowserInspectionLogStore().recordInspection(
      GREEN_DROP_LARIAT.id,
      GREEN_DROP_LARIAT.status,
    );

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
      inspectionEvidence === GREEN_DROP_LARIAT.assets.evidence.length - 1 &&
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
        GREEN_DROP_LARIAT.assets.evidence.length - 1,
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

  const evidenceCount = GREEN_DROP_LARIAT.assets.evidence.length;
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
      data-transition={phase}
    >
      {mode === "inspection" ? (
        <>
          <header className={`${styles.inspectionHeader} ${styles.inspectionFade}`}>
            <button
              aria-label="Back to Current Recoveries"
              className={styles.backButton}
              onClick={() => router.back()}
              type="button"
            >
              ←
            </button>
            <p className={styles.inspectionId}>{GREEN_DROP_LARIAT.id}</p>
            <StatusSignal className={styles.inspectionStatus} />
            <span aria-hidden className={styles.shareGlyph}>↗</span>
            <span aria-hidden className={styles.moreGlyph}>•••</span>
          </header>

          <div
            aria-label="Relic evidence"
            className={styles.inspectionViewport}
            data-testid="inspection-evidence"
            onPointerCancel={finishEvidenceDrag}
            onPointerDown={beginEvidenceDrag}
            onPointerMove={moveEvidence}
            onPointerUp={finishEvidenceDrag}
          >
            <div
              className={`${styles.inspectionTrack} ${dragging ? styles.dragging : ""}`}
              style={evidenceTrackStyle}
            >
              {GREEN_DROP_LARIAT.assets.evidence.map((evidence, index) => {
                const asset = getCanonicalAsset(evidence.assetKey);

                return (
                  <div
                    className={styles.inspectionSlide}
                    data-evidence-index={evidence.index}
                    key={`${evidence.index}-${evidence.label}`}
                    style={{ width: `${100 / evidenceCount}%` }}
                  >
                    <Image
                      alt={index === 0 ? "Green Drop Lariat resting in sunlight" : ""}
                      className={
                        index === 0
                          ? styles.fullObjectImage
                          : index === 1
                            ? styles.surfaceImage
                            : styles.wornImage
                      }
                      fill
                      preload={index === 0}
                      sizes="(max-width: 390px) calc(100vw - 32px), 358px"
                      src={asset.publicPath}
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
            {GREEN_DROP_LARIAT.assets.evidence[inspectionEvidence]?.label}
          </p>
          <p className={`${styles.swipeLabel} ${styles.inspectionFade}`}>
            SWIPE EVIDENCE ↔
          </p>
          <div className={`${styles.sheetPosition} ${styles.inspectionFade}`}>
            <InspectionSheet
              classification={GREEN_DROP_LARIAT.classification}
              condition={GREEN_DROP_LARIAT.condition}
              relicId={GREEN_DROP_LARIAT.id}
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
            aria-label="Back to Current Recoveries"
            className={styles.recordBack}
            onClick={() => router.back()}
            type="button"
          >
            ←
          </button>
          <p className={styles.recordId}>{GREEN_DROP_LARIAT.id}</p>
          <span aria-hidden className={styles.recordMenu}>☰</span>
          <h1 className={styles.recordTitle}>{GREEN_DROP_FIGMA_LABEL}</h1>
          <p className={styles.recordStatus}>OBJECT RECORD / ACTIVE</p>
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
              alt="Green Drop Lariat full-object evidence"
              fill
              sizes="290px"
              src={greenDrop.publicPath}
            />
          </button>
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
            <Image alt="" fill sizes="122px" src={greenDrop.publicPath} />
          </button>
          <div className={styles.recordContext}>
            <Image alt="" fill sizes="212px" src={wornMacro.publicPath} />
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
                <dd>{GREEN_DROP_LARIAT.id}</dd>
              </div>
              <div>
                <dt>RECOVERY</dt>
                <dd>{formatRecoveryDate(GREEN_DROP_LARIAT.recoveredOn)}</dd>
              </div>
              <div>
                <dt>MATERIAL</dt>
                <dd>{GREEN_DROP_LARIAT.materials.join(" / ")}</dd>
              </div>
              <div>
                <dt>CONDITION</dt>
                <dd>{GREEN_DROP_LARIAT.condition}</dd>
              </div>
              <div>
                <dt>ASSEMBLY</dt>
                <dd>{GREEN_DROP_LARIAT.assembly}</dd>
              </div>
            </dl>
          </div>
          <RemyState className={styles.remyClipboard} state="clipboard" />
          <div className={styles.recordAcquire}>
            <AcquireCta context="record" handoff={handoff} price={price} />
          </div>
        </section>
      )}
    </main>
  );
}
