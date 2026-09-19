import styles from "./specimen-glass.module.css";
import { RR_SPECIMEN_GLASS } from "@/data/specimen-glass-material";

type SpecimenGlassMaterialProps = {
  filterId: string;
  className?: string;
};

export function SpecimenGlassMaterial({
  filterId,
  className,
}: SpecimenGlassMaterialProps) {
  const classNames = [styles.material, className].filter(Boolean).join(" ");

  return (
    <>
      <svg
        className={styles.filterDefinitions}
        width="0"
        height="0"
        aria-hidden="true"
      >
        <defs>
          <filter
            id={filterId}
            x="-8%"
            y="-8%"
            width="116%"
            height="116%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.022"
              numOctaves={2}
              seed={11}
              result="surfaceNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="surfaceNoise"
              scale={3.2}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation={0.32} result="frosted" />
            <feBlend in="displaced" in2="frosted" mode="normal" />
          </filter>
        </defs>
      </svg>

      <div
        className={classNames}
        aria-hidden="true"
        data-material={RR_SPECIMEN_GLASS.name}
        data-shader-id={RR_SPECIMEN_GLASS.shaderId}
        data-shader-version={RR_SPECIMEN_GLASS.approvedVersion}
        data-production-technique={RR_SPECIMEN_GLASS.productionTechnique}
      >
        <div
          className={styles.refraction}
          style={{ filter: `url(#${filterId})` }}
        />
        <div className={styles.frost} />
        <div className={styles.edge} />
      </div>
    </>
  );
}
