import type { Metadata } from "next";

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
    frameClass: styles.route,
  },
  {
    id: "RR-FM-02",
    title: "SOFT OBJECT",
    event: "RECOVERED ELSEWHERE",
    family: "FLOCK POCKET",
    material: "LAVENDER FLOCK",
    emotion: "ATTACHED",
    breakRule: "OBJECT + TAIL CROSS SEAM",
    signal: "CARRY / 01",
    note: "Relocation appears intentional. Ownership remains under review.",
    pose: "carry",
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
    frameClass: styles.tent,
  },
  {
    id: "RR-FM-04",
    title: "EDGE EVENT",
    event: "OBJECT DESCENT",
    family: "WARNING STEP",
    material: "CORAL ENAMEL",
    emotion: "PROVOCATION",
    breakRule: "LOWER PLATE DETACHES",
    signal: "DROP / 04",
    note: "The object was stable until observed by the subject.",
    pose: "drop",
    frameClass: styles.drop,
  },
  {
    id: "RR-FM-05",
    title: "LOW SIGNAL",
    event: "NAP IN PROGRESS",
    family: "FROST BED",
    material: "FROSTED ACRYLIC",
    emotion: "ASLEEP",
    breakRule: "PAW RESTS ON DATA RAIL",
    signal: "REST / 00",
    note: "No actionable movement. Continue monitoring at a respectful distance.",
    pose: "sleep",
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
    frameClass: styles.box,
  },
  {
    id: "RR-FM-07",
    title: "NIGHT CIRCUIT",
    event: "03:17 ACTIVITY",
    family: "STATIC FIELD",
    material: "GRAPHITE FOIL",
    emotion: "ZOOMIES",
    breakRule: "TAIL THREADS THROUGH INDEX",
    signal: "BURST / 88",
    note: "Velocity exceeded the usefulness of conventional documentation.",
    pose: "run",
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
    note: "Machine route and cat route briefly entered the same system.",
    pose: "ride",
    frameClass: styles.roomba,
  },
];

function RemyGlyph({ pose }: Pick<Specimen, "pose">) {
  return (
    <svg
      className={styles.remy}
      data-pose={pose}
      viewBox="0 0 240 260"
      role="img"
      aria-label={`Remy ${pose} silhouette`}
    >
      <g className={styles.poseGroup}>
        <path className={styles.tail} d="M166 183 C224 185 228 119 194 103 C179 96 174 112 184 120 C205 137 195 163 173 157" />
        <ellipse className={styles.body} cx="126" cy="164" rx="63" ry="69" />
        <ellipse className={styles.hind} cx="156" cy="190" rx="45" ry="38" />
        <circle className={styles.head} cx="105" cy="91" r="52" />
        <path className={styles.ear} d="M66 57 L74 7 L103 44 Z" />
        <path className={styles.ear} d="M115 43 L148 10 L150 62 Z" />
        <path className={styles.chest} d="M92 127 C105 117 125 119 137 131 C132 165 129 190 119 216 C104 208 94 191 88 167 C84 150 85 137 92 127 Z" />
        <ellipse className={styles.paw} cx="94" cy="218" rx="20" ry="10" />
        <ellipse className={styles.paw} cx="132" cy="220" rx="20" ry="10" />
        <path className={styles.muzzle} d="M86 98 C94 91 105 90 112 97 C120 91 132 92 139 101 C133 115 122 121 111 120 C99 120 90 113 86 98 Z" />
        <path className={styles.eye} d="M78 82 Q88 88 98 82" />
        <path className={styles.eye} d="M116 81 Q127 87 138 80" />
        <circle className={styles.nose} cx="110" cy="104" r="4" />
        <g className={styles.plush}>
          <circle cx="48" cy="155" r="18" />
          <circle cx="36" cy="140" r="8" />
          <circle cx="60" cy="140" r="8" />
        </g>
      </g>
    </svg>
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
          <RemyGlyph pose={specimen.pose} />
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
          <span>NOT FOR TRANSFER</span>
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
          <span>FRAME MUTATION LAB / 01</span>
        </div>
        <h1>Relic-state carriers for behavior that refuses containment.</h1>
        <p>
          Eight original frame families built from Remy Relics grammar: quiet archival structure,
          semantic materials, tiny state signals, and one controlled rule-break per object. Rarity is
          not scarcity here. Rarity is the material a memory seems to want.
        </p>
        <div className={styles.heroRail}>
          <span>STRUCTURE</span>
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
          <li>No trading-card geometry, rarity names, iconography, or game-stat conventions survive.</li>
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
