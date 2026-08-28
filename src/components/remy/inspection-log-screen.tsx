"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  RelicMeta,
  RemyState,
  SpatialCue,
  TransferStamp,
} from "@/components/remy/relic-primitives";
import { SiteMenu } from "@/components/remy/site-menu";
import { getCanonicalAsset } from "@/data/asset-manifest";
import {
  getGoldenPathRelicById,
  GREEN_DROP_FIGMA_LABEL,
} from "@/data/golden-path";
import { formatInspectionTimestamp } from "@/inspection-log/presentation";
import {
  INSPECTION_LOG_STORAGE_KEY,
  parseInspectionLogRecords,
  type InspectionLogRecord,
} from "@/inspection-log/storage";
import { MOTION_CONTRACT } from "@/motion/contract";
import { usePrefersReducedMotion } from "@/motion/use-prefers-reduced-motion";

import styles from "./inspection-log-screen.module.css";

const witnessAsset = getCanonicalAsset("relic.evilEyeHex.macroBlackWhite");
const fieldPlateAsset = getCanonicalAsset("relic.redWindowRect.macroBokeh");

function subscribeToInspectionLog(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === INSPECTION_LOG_STORAGE_KEY || event.key === null) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

function getInspectionLogSnapshot() {
  try {
    return window.localStorage.getItem(INSPECTION_LOG_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerInspectionLogSnapshot() {
  return null;
}

function supportsStatusChangeAcknowledgement(record: InspectionLogRecord) {
  return (
    record.lastObservedStatus === "transferred" &&
    record.transferRevealAcknowledgedAt !== null
  );
}

export function InspectionLogScreen() {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [reopening, setReopening] = useState(false);
  const reopenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inspectionLogSnapshot = useSyncExternalStore(
    subscribeToInspectionLog,
    getInspectionLogSnapshot,
    getServerInspectionLogSnapshot,
  );
  const records = useMemo(
    () => parseInspectionLogRecords(inspectionLogSnapshot),
    [inspectionLogSnapshot],
  );

  useEffect(() => {
    return () => {
      if (reopenTimer.current !== null) {
        clearTimeout(reopenTimer.current);
      }
    };
  }, []);

  const primaryRecord = records[0] ?? null;
  const primaryRelic =
    primaryRecord === null ? null : getGoldenPathRelicById(primaryRecord.relicId);
  const primaryStatusChanged =
    primaryRecord !== null &&
    primaryRelic?.status === "transferred" &&
    primaryRecord.lastObservedStatus === "available" &&
    primaryRecord.transferRevealAcknowledgedAt === null;
  const acknowledgedChange = useMemo(
    () => records.find(supportsStatusChangeAcknowledgement) ?? null,
    [records],
  );
  const showStatusChange = primaryStatusChanged || acknowledgedChange !== null;
  const primaryAsset = primaryRelic
    ? getCanonicalAsset(primaryRelic.assets.hero)
    : null;
  const countLabel = String(records.length).padStart(2, "0");
  const transitionStyle = {
    "--log-reopen-duration": `${
      prefersReducedMotion
        ? MOTION_CONTRACT.reducedMotionMs
        : MOTION_CONTRACT.fieldPromotionMs
    }ms`,
  } as CSSProperties;

  function reopenRelic(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      reopening
    ) {
      return;
    }

    event.preventDefault();
    setReopening(true);
    const duration = prefersReducedMotion
      ? MOTION_CONTRACT.reducedMotionMs
      : MOTION_CONTRACT.fieldPromotionMs;

    reopenTimer.current = setTimeout(() => {
      router.push("/relic/green-drop-lariat?view=record", { scroll: false });
    }, duration);
  }

  return (
    <main
      className={styles.screen}
      data-motion={prefersReducedMotion ? "reduced" : "full"}
      data-node-id="548:102"
      data-reopening={reopening}
      data-screen="inspection-log"
      style={transitionStyle}
    >
      <button
        aria-label="Go back"
        className={styles.backButton}
        onClick={() => router.back()}
        type="button"
      >
        ←
      </button>
      <SiteMenu className={styles.menuGlyph} glyph="+" />

      <h1 className={styles.title}>YOUR INSPECTION LOG</h1>
      <p className={styles.count} data-testid="inspection-log-count">
        {countLabel} OBJECTS OBSERVED
      </p>
      <p className={styles.localNote}>LOCAL DEVICE / NO ACCOUNT REQUIRED</p>
      <p className={styles.fieldHeading}>
        TRACE FIELD / {countLabel}
        <br />
        MOST RECENT → OLDER
      </p>
      <RemyState className={styles.remyClipboard} state="clipboard" />

      {primaryRecord !== null && primaryRelic !== null && primaryAsset !== null ? (
        <section aria-label="Most recent inspection" className={styles.primaryRecord}>
          <Link
            aria-label={`Reopen ${primaryRelic.name} full record`}
            className={styles.primaryTrace}
            data-testid="reopen-relic"
            href="/relic/green-drop-lariat?view=record"
            onClick={reopenRelic}
          >
            <Image
              alt={`${primaryRelic.name} inspection trace`}
              fill
              preload
              sizes="253px"
              src={primaryAsset.publicPath}
            />
          </Link>
          <span aria-hidden className={styles.primaryTether} />
          <RelicMeta
            className={styles.primaryMeta}
            displayName={GREEN_DROP_FIGMA_LABEL}
            relicId={primaryRecord.relicId}
            status={primaryRecord.lastObservedStatus}
          />
          <p className={styles.inspectedAt}>
            INSPECTED / {formatInspectionTimestamp(primaryRecord.lastInspectedAt)}
          </p>
          <Link
            className={styles.reopenCue}
            href="/relic/green-drop-lariat?view=record"
            onClick={reopenRelic}
          >
            <SpatialCue label="REOPEN RECORD ↗" />
          </Link>
        </section>
      ) : records.length === 0 ? (
        <p className={styles.emptyState}>NO OBJECTS OBSERVED YET.</p>
      ) : null}

      {records.length >= 2 ? (
        <section aria-label="Older inspection trace" className={styles.secondaryRecord}>
          <figure className={styles.witnessTrace}>
            <Image
              alt=""
              fill
              sizes="112px"
              src={witnessAsset.publicPath}
            />
            <TransferStamp className={styles.witnessStamp} />
          </figure>
          <p className={styles.secondaryLabel}>TRACE 02 / TRANSFERRED</p>
        </section>
      ) : null}

      {showStatusChange ? (
        <p className={styles.statusChange} data-testid="log-status-change">
          STATUS CHANGE
          <br />
          AVAILABLE → TRANSFERRED
        </p>
      ) : null}

      {records.length >= 3 ? (
        <section aria-label="Oldest inspection trace" className={styles.tertiaryRecord}>
          <figure className={styles.fieldPlate}>
            <Image
              alt=""
              fill
              sizes="84px"
              src={fieldPlateAsset.publicPath}
            />
          </figure>
          <p className={styles.tertiaryLabel}>TRACE 03 / YESTERDAY</p>
        </section>
      ) : null}

      <Link className={styles.currentLink} href="/current">
        VIEW CURRENT RECOVERIES →
      </Link>
    </main>
  );
}
