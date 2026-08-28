"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useRef, useState } from "react";

import { RemyState, StatusSignal } from "@/components/remy/relic-primitives";
import { SiteMenu } from "@/components/remy/site-menu";
import { getCanonicalAsset } from "@/data/asset-manifest";
import { MOTION_CONTRACT } from "@/motion/contract";
import { usePrefersReducedMotion } from "@/motion/use-prefers-reduced-motion";

import styles from "./arrival-screen.module.css";

const hero = getCanonicalAsset("relic.evilEyeHex.macroBlackWhite");

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function ArrivalScreen() {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [departing, setDeparting] = useState(false);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (navigationTimer.current !== null) {
        clearTimeout(navigationTimer.current);
      }
    },
    [],
  );

  function enterCurrent(event: MouseEvent<HTMLAnchorElement>) {
    if (isModifiedClick(event) || departing) {
      return;
    }

    event.preventDefault();
    setDeparting(true);
    navigationTimer.current = setTimeout(
      () => router.push("/current", { scroll: false }),
      prefersReducedMotion
        ? MOTION_CONTRACT.reducedMotionMs
        : MOTION_CONTRACT.arrivalRevealMs,
    );
  }

  return (
    <main
      aria-busy={departing}
      className={`${styles.screen} ${departing ? styles.departing : ""}`}
      data-motion={prefersReducedMotion ? "reduced" : "full"}
      data-node-id="540:2"
      data-screen="arrival"
    >
      <div className={styles.hero} data-node-id="540:3">
        <Image
          alt="Evil-eye relic suspended on a gold chain"
          fill
          preload
          sizes="(max-width: 390px) 100vw, 390px"
          src={hero.publicPath}
        />
      </div>

      <p className={styles.brand}>REMY RELICS</p>
      <StatusSignal className={styles.brandSignal} />
      <SiteMenu className={styles.menuGlyph} />
      <p className={styles.archiveStatus}>
        PUBLIC ARCHIVE / ACTIVE
        <br />
        07 OBJECTS IN CUSTODY
      </p>

      <section className={styles.paper} aria-label="Archive introduction">
        <h1 className={styles.statement}>
          wearable artifacts for
          <br />
          minor personal emergencies
        </h1>
        <p className={styles.classification}>HAND ASSEMBLED / FIELD CLASSIFIED</p>
        <RemyState className={styles.remyPatrol} state="patrol" />
        <p className={styles.routeCheck}>ROUTE CHECK / ACTIVE</p>
        <Link
          className={styles.enterLink}
          data-testid="enter-recoveries"
          href="/current"
          onClick={enterCurrent}
          scroll={false}
        >
          ENTER RECOVERIES ↓
        </Link>
        <p className={styles.fieldCount}>FIELD / 07</p>
      </section>
    </main>
  );
}
