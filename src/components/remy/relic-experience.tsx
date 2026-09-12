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
import {
  formatCanonicalDate,
  formatCanonicalPrice,
  type ResolvedRelicCommerce,
} from "@/commerce/catalog-adapter";
import { getCanonicalAsset } from "@/data/asset-manifest";
import { formatRecoveryDate } from "@/data/golden-path";
import type { Relic } from "@/data/relic";
import { createBrowserInspectionLogStore } from "@/inspection-log/storage";
import { MOTION_CONTRACT } from "@/motion/contract";
import { usePrefersReducedMotion } from "@/motion/use-prefers-reduced-motion";

import styles from "./relic-experience.module.css";

const inspectionEvidenceTotal = 5;

type ExperienceMode = "inspection" | "record";
type TransitionPhase = "rest" | "holding" | "record-entering";
type TransferRevealState = "hidden" | "revealing" | "settled";
type CheckoutUiState = "idle" | "submitting" | "error" | "unavailable";

type EvidencePointer = {
  lastAt: number;
  lastX: number;
  pointerId: number;
  startX: number;
  velocity: number;
};

export function RelicExperience({
  commerce,
  displayLabel,
  initialMode = "inspection",
  relic,
}: {
  commerce: ResolvedRelicCommerce;
  displayLabel: string;
  initialMode?: ExperienceMode;
  relic: Relic;
}) {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [mode, setMode] = useState<ExperienceMode>(() =>
    commerce.status === "transferred" ? "record" : initialMode,
  );
  const activeMode =
    commerce.status === "transferred" ? "record" : mode;
  const [phase, setPhase] = useState<TransitionPhase>("rest");
  const [inspectionEvidence, setInspectionEvidence] = useState(0);
  const [recordEvidence, setRecordEvidence] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [transferReveal, setTransferReveal] =
    useState<TransferRevealState>("hidden");
  const [checkoutState, setCheckoutState] =
    useState<CheckoutUiState>("idle");
  const [shareAnnouncement, setShareAnnouncement] = useState("");
  const evidencePointer = useRef<EvidencePointer | null>(null);
  const dragDistance = useRef(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const transferRevealStarted = useRef(false);
  const price = formatCanonicalPrice(commerce);
  const transferDate = formatCanonicalDate(commerce.transferDate);
  const canAcquire =
    commerce.status === "available" &&
    commerce.purchasable &&
    price !== null;
  const checkoutAction =
    checkoutState === "submitting"
      ? "PREPARING SECURE CHECKOUT"
      : checkoutState === "unavailable" || commerce.status === "unavailable"
        ? "RELIC UNAVAILABLE"
        : commerce.status === "reserved"
          ? "TRANSFER IN PROCESS"
          : canAcquire
            ? `ACQUIRE RELIC — ${price}`
            : "RELIC UNAVAILABLE";
  const checkoutStatusMessage =
    checkoutState === "error"
      ? "CHECKOUT UNAVAILABLE · TRY AGAIN"
      : checkoutState === "unavailable"
        ? "LIVE RECORD CHANGED · RECHECKING"
        : null;
  const etsyUrl =
    canAcquire && checkoutState !== "submitting" ? commerce.etsyUrl : null;
  const heroAsset = getCanonicalAsset(relic.assets.hero);
  const wornAsset = getCanonicalAsset(
    relic.assets.evidence[2]?.assetKey ?? relic.assets.hero,
  );

  useEffect(() => {
    if (commerce.status === "available" || commerce.status === "transferred") {
      createBrowserInspectionLogStore().recordInspection(relic.id, commerce.status);
    }
  }, [commerce.status, relic.id]);

  useEffect(() => {
    if (commerce.status !== "transferred" || transferRevealStarted.current) {
      return;
    }

    const store = createBrowserInspectionLogStore();
    const pendingReveal = store.hasPendingTransferReveal(relic.id, "transferred");

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
  }, [commerce.status, prefersReducedMotion, relic.id]);

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

  async function shareRelic() {
    const url = `${window.location.origin}/relic/${relic.slug}`;
    const shareData = {
      title: `${displayLabel} — Remy Relics`,
      text: `${relic.id} / ${displayLabel}`,
      url,
    };

    setShareAnnouncement("");

    try {
      if (typeof navigator.share === "function") {
        await navigator.share(shareData);
        setShareAnnouncement("RELIC SHARED");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareAnnouncement("RELIC LINK COPIED");
        return;
      }

      setShareAnnouncement("SHARE UNAVAILABLE");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setShareAnnouncement("SHARE UNAVAILABLE");
    }
  }

  async function beginCheckout() {
    if (!canAcquire || checkoutState === "submitting") {
      return;
    }

    setCheckoutState("submitting");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: relic.slug }),
      });

      if (response.status === 409) {
        setCheckoutState("unavailable");
        router.refresh();
        return;
      }

      if (!response.ok) {
        throw new Error("Checkout request failed.");
      }

      const payload: unknown = await response.json();
      const url =
        typeof payload === "object" &&
        payload !== null &&
        "checkoutUrl" in payload &&
        typeof payload.checkoutUrl === "string"
          ? payload.checkoutUrl
          : null;

      if (url === null || !url.startsWith("https://")) {
        throw new Error("Checkout response is missing a secure URL.");
      }

      window.location.assign(url);
    } catch {
      setCheckoutState("error");
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

  const evidenceCount = relic.assets.evidence.length;
  const evidenceTrackStyle = {
    transform: `translate3d(calc(${-inspectionEvidence * (100 / evidenceCount)}% + ${dragX}px), 0, 0)`,
    width: `${evidenceCount * 100}%`,
  } as CSSProperties;

  return (
    <main
      className={styles.experience}
      data-motion={prefersReducedMotion ? "reduced" : "full"}
      data-node-id={activeMode === "inspection" ? "544:31" : "545:56"}
      data-screen={activeMode}
      data-status={commerce.status}
      data-transfer-reveal={transferReveal}
      data-transition={phase}
    >
      {activeMode === "inspection" ? (
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
            {commerce.status === "available" ? (
              <StatusSignal className={styles.inspectionStatus} />
            ) : null}
            <button
              aria-label="Share relic"
              className={styles.shareGlyph}
              data-testid="share-relic"
              onClick={shareRelic}
              style={{
                appearance: "none",
                background: "transparent",
                border: 0,
                color: "inherit",
                cursor: "pointer",
                padding: 0,
              }}
              type="button"
            >
              ↗
            </button>
            <p aria-live="polite" className={styles.visuallyHidden}>
              {shareAnnouncement}
            </p>
            <SiteMenu className={styles.moreGlyph} glyph="•••" />
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

                return (
                  <div
                    className={styles.inspectionSlide}
                    data-evidence-index={evidence.index}
                    key={`${evidence.index}-${evidence.label}`}
                    style={{ width: `${100 / evidenceCount}%` }}
                  >
                    <Image
                      alt={index === 0 ? `${relic.name} resting in sunlight` : ""}
                      className={
                        index === 0
                          ? styles.fullObjectImage
                          : index === 1
                            ? styles.surfaceImage
                            : styles.wornImage
                      }
                      fill
                      loading={
                        evidence.assetKey === relic.assets.hero ? "eager" : "lazy"
                      }
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
              status={
                commerce.status === "reserved"
                  ? "PROCESSING"
                  : commerce.status.toUpperCase()
              }
            />
          </div>
          <button
            className={`${styles.fullRecordButton} ${styles.inspectionFade}`}
            data-testid="view-full-record"
            onClick={showFullRecord}
            onPointerUp={(event) => {
              if (event.pointerType === "touch") {
                showFullRecord();
              }
            }}
            type="button"
          >
            VIEW FULL RECORD ↓
          </button>
          <div className={`${styles.inspectionAcquire} ${styles.inspectionFade}`}>
            <AcquireCta
              action={checkoutAction}
              context="inspection"
              disabled={
                !canAcquire ||
                checkoutState === "submitting" ||
                checkoutState === "unavailable"
              }
              etsyHref={etsyUrl}
              onAcquire={beginCheckout}
              statusMessage={checkoutStatusMessage}
            />
          </div>
        </>
      ) : (
        <section
          className={`${styles.recordScreen} ${phase === "record-entering" ? styles.recordEntering : ""}`}
          data-active-evidence={recordEvidence + 1}
        >
          <button
            aria-label={
              commerce.status === "transferred"
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
            OBJECT RECORD / {commerce.status === "available"
              ? "ACTIVE"
              : commerce.status === "reserved"
                ? "PROCESSING"
                : commerce.status.toUpperCase()}
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
          {commerce.status === "transferred" ? (
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
              {commerce.status === "transferred" && transferDate !== null ? (
                <div>
                  <dt>TRANSFER</dt>
                  <dd>{transferDate}</dd>
                </div>
              ) : null}
            </dl>
          </div>
          <RemyState
            className={styles.remyClipboard}
            state={commerce.status === "transferred" ? "box" : "clipboard"}
          />
          {commerce.status !== "transferred" ? (
            <div className={styles.recordAcquire}>
              <AcquireCta
                action={checkoutAction}
                context="record"
                disabled={
                  !canAcquire ||
                  checkoutState === "submitting" ||
                  checkoutState === "unavailable"
                }
                etsyHref={etsyUrl}
                onAcquire={beginCheckout}
                statusMessage={checkoutStatusMessage}
              />
            </div>
          ) : (
            <Link className={styles.transferredReturn} href="/archive">
              RETURN TO ARCHIVE →
            </Link>
          )}
        </section>
      )}
    </main>
  );
}
