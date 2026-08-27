import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { FIGMA_COLOR_TOKENS, FIGMA_REFERENCE_VIEWPORT } from "./figma-contract";

describe("Figma token contract", () => {
  it("keeps the 390px canonical mobile viewport", () => {
    expect(FIGMA_REFERENCE_VIEWPORT).toEqual({ width: 390, height: 844 });
  });

  it("maps every frozen color token into the global CSS", () => {
    const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

    for (const [token, value] of Object.entries(FIGMA_COLOR_TOKENS)) {
      expect(css).toContain(`${token}: ${value}`);
    }
  });
});
