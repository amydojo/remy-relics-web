import Link from "next/link";

import { formatCanonicalDate } from "@/commerce/catalog-adapter";
import type { PublicTransferConfirmation } from "@/commerce/postgres-store";
import {
  RemyState,
  TransferStamp,
} from "@/components/remy/relic-primitives";

import styles from "./transfer-confirmation-screen.module.css";

export function TransferConfirmationScreen({
  record,
  sessionId,
}: {
  record: PublicTransferConfirmation | null;
  sessionId: string | null;
}) {
  const recorded =
    record?.paymentStatus === "paid" &&
    record.relicStatus === "transferred";
  const verifying =
    record !== null &&
    !recorded &&
    (record.paymentStatus === "paid" ||
      record.paymentStatus === "pending" ||
      record.relicStatus === "reserved");
  const transferDate = formatCanonicalDate(record?.transferDate ?? null);
  const title = recorded
    ? "RELIC TRANSFER RECORDED"
    : verifying
      ? "TRANSFER VERIFYING"
      : "TRANSFER NOT RECORDED";
  const serverState = recorded
    ? "SERVER RECORD / VERIFIED"
    : verifying
      ? "SERVER RECORD / PAYMENT PENDING"
      : "SERVER RECORD / NO VERIFIED TRANSFER";

  return (
    <main
      className={styles.screen}
      data-screen="transfer-confirmation"
      data-transfer-state={
        recorded ? "recorded" : verifying ? "verifying" : "not-recorded"
      }
    >
      <p className={styles.kicker}>TRANSFER / REMY RELICS</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.serverState}>{serverState}</p>

      <span aria-hidden className={styles.rule} />

      {record !== null ? (
        <section aria-label="Transfer record" className={styles.record}>
          <p className={styles.relicId}>{record.relicId}</p>
          <h2 className={styles.relicName}>{record.title}</h2>
          <div className={styles.stateRow}>
            {recorded ? <TransferStamp className={styles.stamp} /> : null}
            <p className={styles.lifecycle}>
              {recorded
                ? "TRANSFERRED"
                : verifying
                  ? "PROCESSING"
                  : record.relicStatus.toUpperCase()}
            </p>
          </div>
          {recorded && transferDate !== null ? (
            <p className={styles.date}>TRANSFER / {transferDate}</p>
          ) : null}
        </section>
      ) : (
        <p className={styles.unknown}>
          NO SERVER RECORD MATCHED THIS CHECKOUT SESSION.
        </p>
      )}

      <p className={styles.note}>
        PAYMENT AND TRANSFER STATE COME FROM THE SERVER RECORD.
        <br />
        THIS PAGE DOES NOT ESTABLISH OWNERSHIP.
      </p>

      <nav aria-label="Transfer record actions" className={styles.actions}>
        {recorded && record !== null ? (
          <>
            <Link
              className={styles.primaryAction}
              href={`/relic/${record.slug}?view=record`}
            >
              VIEW TRANSFER RECORD →
            </Link>
            <Link className={styles.secondaryAction} href="/archive">
              RETURN TO ARCHIVE →
            </Link>
          </>
        ) : verifying && record !== null ? (
          <>
            <Link
              className={styles.primaryAction}
              href={
                sessionId === null
                  ? "/transfer/confirmation"
                  : `/transfer/confirmation?session_id=${encodeURIComponent(sessionId)}`
              }
            >
              CHECK SERVER RECORD →
            </Link>
            <Link
              className={styles.secondaryAction}
              href={`/relic/${record.slug}`}
            >
              RETURN TO RELIC →
            </Link>
          </>
        ) : (
          <>
            {record !== null ? (
              <Link
                className={styles.primaryAction}
                href={`/relic/${record.slug}`}
              >
                RETURN TO RELIC →
              </Link>
            ) : (
              <Link className={styles.primaryAction} href="/current">
                VIEW CURRENT RECOVERIES →
              </Link>
            )}
            <Link className={styles.secondaryAction} href="/archive">
              VIEW ARCHIVE →
            </Link>
          </>
        )}
      </nav>

      <RemyState className={styles.remyBox} state="box" />
    </main>
  );
}
