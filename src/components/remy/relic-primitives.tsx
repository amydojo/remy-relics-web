import Image from "next/image";
import Link from "next/link";

import type { EtsyHandoff } from "@/commerce/etsy";
import { getRemyStateAsset, type RemyStateKey } from "@/data/remy-state-manifest";
import type { RelicStatus } from "@/data/relic";

import styles from "./relic-primitives.module.css";

export function StatusSignal({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`${styles.signal} ${className}`} />;
}

export function RelicMeta({
  className,
  displayName,
  relicId,
  status = "available",
}: {
  className?: string;
  displayName: string;
  relicId: string;
  status?: RelicStatus | "inspected";
}) {
  const statusLabel = status.toUpperCase();

  return (
    <div className={`${styles.relicMeta} ${className ?? ""}`}>
      <span className={styles.metaId}>
        {status === "available" ? <StatusSignal /> : null}
        {relicId}
      </span>
      <span className={styles.metaName}>{displayName}</span>
      <span
        className={status === "available" ? styles.metaStatus : styles.metaStatusMuted}
      >
        {statusLabel}
      </span>
    </div>
  );
}

export function SpatialCue({
  className,
  label,
}: {
  className?: string;
  label: string;
}) {
  return (
    <span className={`${styles.spatialCue} ${className ?? ""}`}>
      <StatusSignal />
      {label}
    </span>
  );
}

export function BottomNav({
  active = "current",
  handoff,
}: {
  active?: "archive" | "current" | "neutral";
  handoff: EtsyHandoff;
}) {
  return (
    <nav aria-label="Browse" className={styles.bottomNav}>
      <Link
        aria-current={active === "current" ? "page" : undefined}
        className={active === "current" ? styles.navActive : styles.navMuted}
        href="/current"
      >
        {active === "current" ? <StatusSignal /> : null}
        CURRENT
      </Link>
      <Link
        aria-current={active === "archive" ? "page" : undefined}
        className={active === "archive" ? styles.navActive : styles.navMuted}
        href="/archive"
      >
        {active === "archive" ? <StatusSignal /> : null}
        ARCHIVE
      </Link>
      <a
        className={styles.navMuted}
        href={handoff.href}
        rel={handoff.rel}
        target={handoff.target}
      >
        ETSY ↗
      </a>
    </nav>
  );
}

export function AcquireCta({
  context,
  handoff,
  price,
}: {
  context: "inspection" | "record";
  handoff: EtsyHandoff;
  price: string;
}) {
  return (
    <div className={styles.acquireUnit} data-context={context}>
      <a
        className={styles.acquireButton}
        data-testid={`acquire-${context}`}
        href={handoff.href}
        rel={handoff.rel}
        target={handoff.target}
      >
        ACQUIRE RELIC — {price}
      </a>
      <p className={styles.trustLine}>secure checkout via Etsy ↗</p>
    </div>
  );
}

export function InspectionSheet({
  classification,
  condition,
  relicId,
}: {
  classification: string;
  condition: string;
  relicId: string;
}) {
  const rows = [
    ["RELIC ID", relicId],
    ["CLASSIFICATION", classification],
    ["STATUS", "AVAILABLE"],
    ["CONDITION", condition],
  ] as const;

  return (
    <section aria-label="Object inspection facts" className={styles.inspectionSheet}>
      <p className={styles.sheetTitle}>OBJECT RECORD / INSPECTION</p>
      <dl className={styles.sheetRows}>
        {rows.map(([term, detail]) => (
          <div className={styles.sheetRow} key={term}>
            <dt>{term}</dt>
            <dd className={term === "STATUS" ? styles.sheetStatus : undefined}>
              {term === "STATUS" ? <StatusSignal /> : null}
              {detail}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function EvidenceLabel({
  className,
  index,
  label,
}: {
  className?: string;
  index: number;
  label: string;
}) {
  return (
    <span className={`${styles.evidenceLabel} ${className ?? ""}`}>
      <span>EVIDENCE {String(index).padStart(2, "0")}</span>
      <strong>{label}</strong>
    </span>
  );
}

export function TransferStamp({
  className,
  reveal = "settled",
}: {
  className?: string;
  reveal?: "hidden" | "revealing" | "settled";
}) {
  return (
    <span
      aria-label="Transferred"
      className={`${styles.transferStamp} ${className ?? ""}`}
      data-reveal={reveal}
    >
      TRANSFERRED
    </span>
  );
}

export function RemyState({
  className,
  state,
}: {
  className?: string;
  state: RemyStateKey;
}) {
  const asset = getRemyStateAsset(state);

  return (
    <span aria-hidden className={`${styles.remy} ${className ?? ""}`}>
      <Image alt="" fill sizes="55px" src={asset.publicPath} />
    </span>
  );
}
