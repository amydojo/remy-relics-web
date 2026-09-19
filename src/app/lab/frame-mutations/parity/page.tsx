import type { Metadata } from "next";
import Image from "next/image";

import { getRemyCanonVectorAsset } from "@/data/remy-canon-vector-manifest";
import { RR_SPECIMEN_GLASS } from "@/data/specimen-glass-material";

import { SpecimenGlassMaterial } from "../specimen-glass";
import styles from "./parity.module.css";

export const metadata: Metadata = {
  title: "Specimen Glass Parity — Remy Relics",
  description:
    "Figma-to-web parity reference for RR / Specimen Glass / Periwinkle Refraction.",
};

const contexts = [
  { key: "light", label: "LIGHT" },
  { key: "midtone", label: "MIDTONE" },
  { key: "dark", label: "DARK" },
  { key: "alpha", label: "ALPHA / CHECKER" },
] as const;

function WebMaterialSample({
  context,
  filterId,
}: {
  context: (typeof contexts)[number]["key"];
  filterId: string;
}) {
  const asset = getRemyCanonVectorAsset("patrol");

  return (
    <div className={`${styles.webSample} ${styles[context]}`}>
      <SpecimenGlassMaterial filterId={filterId} />
      <Image
        className={styles.remy}
        src={asset.publicPath}
        width={asset.width}
        height={asset.height}
        alt=""
        aria-hidden="true"
        unoptimized
      />
    </div>
  );
}

export default function SpecimenGlassParityPage() {
  const defaults = RR_SPECIMEN_GLASS.defaults;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.eyebrow}>RR / PRODUCTION PARITY / STATIC</div>
        <h1>Periwinkle specimen glass</h1>
        <p>
          Figma shader authority versus the smallest production web analogue.
          Canon Remy remains outside the material effect in every render.
        </p>
      </header>

      <section className={styles.compare} aria-labelledby="comparison-title">
        <div className={styles.sectionHeader}>
          <span>01</span>
          <h2 id="comparison-title">Authority / implementation</h2>
        </div>

        <article className={styles.card}>
          <div className={styles.cardMeta}>
            <span>FIGMA DEFAULT</span>
            <span>NODE {RR_SPECIMEN_GLASS.figma.defaultSpecimenNodeId}</span>
          </div>
          <Image
            className={styles.referenceImage}
            src="/assets/frame-mutations/rr-specimen-glass-figma-default.png"
            width={336}
            height={178}
            alt="Approved Figma default specimen glass reference"
            unoptimized
          />
        </article>

        <article className={styles.card}>
          <div className={styles.cardMeta}>
            <span>WEB DEFAULT</span>
            <span>CSS + SVG FILTER</span>
          </div>
          <WebMaterialSample context="light" filterId="rr-parity-default" />
        </article>
      </section>

      <section className={styles.contextSection} aria-labelledby="context-title">
        <div className={styles.sectionHeader}>
          <span>02</span>
          <h2 id="context-title">Context gate</h2>
        </div>
        <div className={styles.contextGrid}>
          {contexts.map((context, index) => (
            <article className={styles.contextCard} key={context.key}>
              <span>{context.label}</span>
              <WebMaterialSample
                context={context.key}
                filterId={`rr-parity-context-${index}`}
              />
            </article>
          ))}
        </div>
      </section>

      <section className={styles.mobileSection} aria-labelledby="mobile-title">
        <div className={styles.sectionHeader}>
          <span>03</span>
          <h2 id="mobile-title">Mobile envelope</h2>
        </div>
        <div className={styles.mobileViewport}>
          <div className={styles.mobileMeta}>390 × 844 QA ENVELOPE</div>
          <div className={styles.mobileField}>
            <SpecimenGlassMaterial filterId="rr-parity-mobile" />
            <Image
              className={styles.mobileRemy}
              src={getRemyCanonVectorAsset("patrol").publicPath}
              width={160}
              height={160}
              alt=""
              aria-hidden="true"
              unoptimized
            />
          </div>
          <div className={styles.mobileCopy}>
            <span>ROUTE MARK</span>
            <strong>GOING ANYWAY</strong>
          </div>
        </div>
      </section>

      <section className={styles.parameters} aria-labelledby="parameters-title">
        <div className={styles.sectionHeader}>
          <span>04</span>
          <h2 id="parameters-title">Parity parameters</h2>
        </div>
        <dl>
          <div><dt>REFRACTION</dt><dd>{defaults.refraction}</dd></div>
          <div><dt>FROST</dt><dd>{defaults.frost}%</dd></div>
          <div><dt>EDGE DISPERSION</dt><dd>{defaults.edgeDispersion}</dd></div>
          <div><dt>IRREGULARITY</dt><dd>{defaults.irregularity}%</dd></div>
          <div><dt>DEPTH</dt><dd>{defaults.depth}%</dd></div>
          <div><dt>PERIWINKLE</dt><dd>{defaults.periwinkleInfluence}%</dd></div>
          <div><dt>MATERIAL SCALE</dt><dd>{defaults.materialScale}%</dd></div>
        </dl>
        <p>
          Production implementation is intentionally static. CSS supplies the
          translucent optical field and frost; an inline SVG filter supplies
          low-amplitude turbulence/displacement. No effect is applied to the
          Patrol SVG.
        </p>
      </section>
    </main>
  );
}
