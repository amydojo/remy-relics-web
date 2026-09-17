import type { Metadata } from "next";
import Image from "next/image";

import {
  getRemyStateAsset,
  type RemyStateKey,
} from "@/data/remy-state-manifest";

import styles from "./frame-mutations.module.css";

export const metadata: Metadata = {
  title: "Frame Mutation Lab — Remy Relics",
  description:
    "Eight original relic-state carrier systems exploring material rarity, emotional state, and Remy breaking containment.",
};

type Specimen = {
  id: string;
  title: string;
  event: string;
  family: string;
  material: string;
  emotion: string;
  breakRule: string;
  signal: string;
  note: string;
  pose: "walk" | "carry" | "nest" | "drop" | "sleep" | "box" | "run" | "ride";
  remyState: RemyStateKey;
  frameClass: string;
};

const specimens: Specimen[] = [
  {
    id: "RR-FM-01",
    title: "ROUTE MARK",
    event: "GOING ANYWAY",
    family: "GLASS CARRIER",
    material: "PERIWINKLE GLASS",
    emotion: "UNDETERRED",
    breakRule: "BODY EXITS EAST RAIL",
    signal: "ROUTE / 03",
    note: "A route only becomes unauthorized after somebody tries to stop it.",
    pose: "walk",
    remyState: "patrol",
    frameClass: styles.route,
  },
  {
    id: "RR-FM-02",
    title: "SOFT OBJECT",
    event: "RECOVERED ELSEWHERE",
    family: "FLOCK POCKET",
    material: "LAVENDER FLOCK",
    emotion: "ATTACHED",
    breakRule: "SUBJECT CROSSES STITCHED SEAM",
    signal: "CARRY / 01",
    note: "Relocation appears intentional. Ownership remains under review.",
    pose: "carry",
    remyState: "clipboard",
    frameClass: styles.soft,
  },
  {
    id: "RR-FM-03",
    title: "TENT RECORD",
    event: "OCCUPANCY CONFIRMED",
    family: "VELLUM ARCH",
    material: "MILK VELLUM",
    emotion: "NESTED",
    breakRule: "EARS PIERCE CANOPY",
    signal: "SHELTER / 07",
    note: "Temporary structure has become a private jurisdiction.",
    pose: "nest",
    remyState: "box",
    frameClass: styles.tent,
  },
  {
    id: "RR-FM-04",
    title: "EDGE EVENT",
    event: "OBJECT DESCENT",
    family: "WARNING STEP",
    material: "CORAL ENAMEL",
    emotion: "PROVOCATION",
    breakRule: "DOCUMENTATION CROSSES LOWER PLATE",
    signal: "DROP / 04",
    note: "The object was stable until observed by the subject.",
    pose: "drop",
    remyState: "clipboard",
    frameClass: styles.drop,
  },
  {
    id: "RR-FM-05",
    title: "LOW SIGNAL",
    event: "NAP IN PROGRESS",
    family: "FROST BED",
    material: "FROSTED ACRYLIC",
    emotion: "ASLEEP",
    breakRule: "SLEEP MASS RESTS ON DATA RAIL",
    signal: "REST / 00",
    note: "No actionable movement. Continue monitoring at a respectful distance.",
    pose: "sleep",
    remyState: "sleep",
    frameClass: styles.sleep,
  },
  {
    id: "RR-FM-06",
    title: "BOX CLAIM",
    event: "CONTAINER REASSIGNED",
    family: "DIE-CUT KRAFT",
    material: "CORRUGATED KRAFT",
    emotion: "CLAIMED",
    breakRule: "HEAD OCCUPIES LABEL VOID",
    signal: "CLAIM / 11",
    note: "Original shipping purpose superseded immediately upon arrival.",
    pose: "box",
    remyState: "box",
    frameClass: styles.box,
  },
  {
    id: "RR-FM-07",
    title: "NIGHT CIRCUIT",
    event: "03:17 ACTIVITY",
    family: "STATIC FIELD",
    material: "GRAPHITE FOIL",
    emotion: "ZOOMIES",
    breakRule: "PATROL STATE THREADS INDEX",
    signal: "BURST / 88",
    note: "Velocity exceeded the usefulness of conventional documentation.",
    pose: "run",
    remyState: "patrol",
    frameClass: styles.zoom,
  },
  {
    id: "RR-FM-08",
    title: "ROOMBA CONTACT",
    event: "MOBILE SURFACE ACCEPTED",
    family: "CONDUCTIVE RING",
    material: "MINT INDICATOR",
    emotion: "UNBOTHERED",
    breakRule: "SUBJECT OVERRIDES CIRCLE",
    signal: "RIDE / 05",
    note: "Canon patrol is standing in until the locked Roomba state enters the production manifest.",
    pose: "ride",
    remyState: "patrol",
    frameClass: styles.roomba,
  },
];

function CanonRemy({
  pose,
  remyState,
}: Pick<Specimen, "pose" | "remyState">) {
  const asset = getRemyStateAsset(remyState);

  return (
    <Image
      className={`${styles.remy} ${styles.remyCanon}`}
      data-pose={pose}
      data-canon-state={remyState}
      src={asset.publicPath}
      width={asset.width}
      height={asset.height}
      sizes="(max-width: 760px) 68vw, 330px"
      style={{ height: "auto" }}
      alt={`Canon Remy — ${remyState} state`}
    />
  );
}

function SpecimenCard({ specimen }: { specimen: Specimen }) {
  return (
    <article className={`${styles.specimen} ${specimen.frameClass}`}>
      <header className={styles.specimenHeader}>
        <span>{specimen.id}</span>
        <span>{specimen.family}</span>
      </header>

      <div className={styles.carrier}>
        <div className={styles.surface} aria-hidden="true" />
        <div className={styles.indexRail} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>

        <div className={styles.visualField}>
          <span className={styles.fieldCode}>{specimen.signal}</span>
          <div className={styles.trace} aria-hidden="true" />
          <CanonRemy pose={specimen.pose} remyState={specimen.remyState} />
          <span className={styles.breakLabel}>{specimen.breakRule}</span>
        </div>

        <div className={styles.titleBlock}>
          <span>{specimen.title}</span>
          <strong>{specimen.event}</strong>
        </div>

        <div className={styles.stateBand}>
          <span>MATERIAL STATE</span>
          <b>{specimen.material}</b>
          <span>EMOTIONAL STATE</span>
          <b>{specimen.emotion}</b>
        </div>

        <div className={styles.note}>{specimen.note}</div>
        <div className={styles.serialRow}>
          <span>REMY RELICS / MUTATION LAB</span>
          <span>CANON / {specimen.remyState.toUpperCase()}</span>
        </div>
      </div>
    </article>
  );
}

export default function FrameMutationLabRoute() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroMeta}>
          <span>RR / INTERNAL STUDY</span>
          <span>FRAME MUTATION LAB / 02</span>
        </div>
        <h1>Relic-state carriers for behavior that refuses containment.</h1>
        <p>
          Eight original frame families built from Remy Relics grammar: quiet archival structure,
          semantic materials, tiny state signals, and one controlled rule-break per object. The
          subject layer now comes directly from the production Remy state manifest. Rarity is not
          scarcity here. Rarity is the material a memory seems to want.
        </p>
        <div className={styles.heroRail}>
          <span>CANON REMY</span>
          <span>→</span>
          <span>STATE</span>
          <span>→</span>
          <span>MATERIAL</span>
          <span>→</span>
          <span>BREACH</span>
        </div>
      </header>

      <section className={styles.rules} aria-labelledby="rules-heading">
        <div>
          <span className={styles.sectionIndex}>00</span>
          <h2 id="rules-heading">Mutation rules</h2>
        </div>
        <ol>
          <li>Every family must read before the microcopy is legible.</li>
          <li>Material state carries emotional meaning; it is never decorative foil for its own sake.</li>
          <li>Remy may break exactly one primary containment rule per frame.</li>
          <li>The breach must preserve the archive skeleton rather than erase it.</li>
          <li>The subject layer must resolve through the production Remy state manifest.</li>
        </ol>
      </section>

      <section className={styles.grid} aria-label="Eight frame mutation specimens">
        {specimens.map((specimen) => (
          <SpecimenCard key={specimen.id} specimen={specimen} />
        ))}
      </section>

      <section className={styles.legend} aria-labelledby="legend-heading">
        <div>
          <span className={styles.sectionIndex}>09</span>
          <h2 id="legend-heading">Material ≠ rarity tier</h2>
        </div>
        <p>
          The collectible signal comes from mismatch and specificity: frosted acrylic for sleep,
          flock for attachment, enamel for provocation, graphite foil for midnight velocity. The
          more emotionally exact the material feels, the rarer the record feels—without needing a
          hierarchy of common through legendary.
        </p>
      </section>

      <footer className={styles.footer}>
        <span>REMY RELICS / QUIET FICTIONAL PACKAGING FOR EMOTIONALLY SIGNIFICANT ANIMALS</span>
        <span>LAB RECORD / 2026</span>
      </footer>
    </main>
  );
}
