import Image from "next/image";
import Link from "next/link";

import type { EtsyHandoff } from "@/commerce/etsy";
import { getRemyStateAsset, type RemyStateKey } from "@/data/remy-state-manifest";

import styles from "./relic-primitives.module.css";

export function StatusSignal({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`${styles.signal} ${className}`} />;
}

export function RelicMeta({
  className,
  displayName,
  relicId,
}: {
  className?: string;
  displayName: string;
  relicId: string;
}) {
  return (
    <div className={`${styles.relicMeta} ${className ?? ""}`}>
      <span className={styles.metaId}>
        <StatusSignal />
        {relicId}
      </span>
      <span className={styles.metaName}>{displayName}</span>
      <span className={styles.metaStatus}>AVAILABLE</span>
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

export function BottomNav({ handoff }: { handoff: EtsyHandoff }) {
  return (
    <nav aria-label="Browse" className={styles.bottomNav}>
      <Link className={styles.navActive} href="/current">
        <StatusSignal />
        CURRENT
      </Link>
      <Link className={styles.navMuted} href="/archive">
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
