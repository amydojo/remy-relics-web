import Image from "next/image";
import Link from "next/link";

import { RemyState } from "@/components/remy/relic-primitives";
import { SiteMenu } from "@/components/remy/site-menu";
import { getCanonicalVectorAsset } from "@/data/asset-manifest";

import styles from "./material-memory-screen.module.css";

const traceMap = getCanonicalVectorAsset(
  "materialMemory.traceMapObjectRemoved",
);

export function MaterialMemoryScreen() {
  return (
    <main
      className={styles.screen}
      data-node-id="546:78"
      data-screen="material-memory"
      id="material-memory"
    >
      <p className={styles.brand}>REMY RELICS</p>
      <SiteMenu className={styles.menuGlyph} glyph="+" />

      <h1 className={styles.statement}>
        EVERY ENCOUNTER
        <br />
        LEAVES MATERIAL
        <br />
        MEMORY.
      </h1>

      <p className={styles.traceTypes}>
        SCRATCH
        <br />
        TARNISH
        <br />
        PRESSURE
        <br />
        HEAT
        <br />
        CONTACT
      </p>

      <div aria-hidden className={styles.traceMap}>
        <Image
          alt=""
          height={traceMap.height}
          loading="eager"
          src={traceMap.publicPath}
          unoptimized
          width={traceMap.width}
        />
      </div>
      <p className={styles.traceMapLabel}>
        TRACE MAP / OBJECT REMOVED
        <br />
        CONTACT / PRESSURE / RESIDUE
      </p>

      <p className={styles.remyNote}>REMY FELL ASLEEP ON THE PAPERWORK.</p>
      <span className={styles.remyAnchor} id="remy" />
      <RemyState className={styles.remySleep} state="sleep" />

      <Link className={styles.continueLink} href="/current">
        CONTINUE RECOVERIES ↓
      </Link>
    </main>
  );
}
