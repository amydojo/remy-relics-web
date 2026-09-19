import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { RR_SPECIMEN_GLASS } from "./specimen-glass-material";

describe("RR specimen glass production parity contract", () => {
  it("pins the approved Figma shader authority and canon defaults", () => {
    expect(RR_SPECIMEN_GLASS).toMatchObject({
      name: "RR / Specimen Glass / Periwinkle Refraction",
      kind: "effect",
      shaderId: "58f32006-9569-48bd-bf57-f1dc9d4cbad6",
      approvedVersion: "47a1a1a4de6e45b5f688a1f361b273fb01c396aa",
      routeSpecimenId: "RR-FM-01",
      productionTechnique: "css-svg-filter",
      defaults: {
        refraction: 7,
        frost: 12,
        edgeDispersion: 1.4,
        irregularity: 7,
        depth: 14,
        periwinkleInfluence: 12,
        materialScale: 72,
      },
    });
  });

  it("keeps the runtime material isolated from canon Remy", () => {
    const page = readFileSync(
      new URL("../app/lab/frame-mutations/page.tsx", import.meta.url),
      "utf8",
    );
    const materialCss = readFileSync(
      new URL("../app/lab/frame-mutations/specimen-glass.module.css", import.meta.url),
      "utf8",
    );

    expect(page).toContain(
      'specimen.id === RR_SPECIMEN_GLASS.routeSpecimenId ? (',
    );
    expect(page).toContain(
      '<SpecimenGlassMaterial filterId="rr-route-specimen-glass" />',
    );
    expect(page).toContain(
      '<CanonRemy remyState={specimen.remyState} subjectClass={specimen.subjectClass} />',
    );
    expect(materialCss).not.toMatch(/\.remy\b|\bimg\s*\{/i);
    expect(materialCss).toContain("backdrop-filter: blur(1.2px) saturate(1.03)");
  });

  it("stores the approved Figma DEFAULT as a stable PNG reference", () => {
    const png = readFileSync(
      new URL(
        "../../public/assets/frame-mutations/rr-specimen-glass-figma-default.png",
        import.meta.url,
      ),
    );

    expect(Array.from(png.subarray(0, 8))).toEqual([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
  });
});
