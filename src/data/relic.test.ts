import { describe, expect, it } from "vitest";

import { GREEN_DROP_LARIAT } from "./golden-path";
import { transferRelic } from "./relic";

describe("relic lifecycle", () => {
  it("preserves the permanent record while removing commerce on transfer", () => {
    const transferred = transferRelic(GREEN_DROP_LARIAT, "2026-08-27");

    expect(transferred).toMatchObject({
      id: GREEN_DROP_LARIAT.id,
      slug: GREEN_DROP_LARIAT.slug,
      status: "transferred",
      commerce: null,
      transferredOn: "2026-08-27",
      assets: GREEN_DROP_LARIAT.assets,
    });
    expect(transferred).not.toHaveProperty("price");
  });

  it("does not fabricate a transfer date when truth does not provide one", () => {
    expect(transferRelic(GREEN_DROP_LARIAT)).not.toHaveProperty("transferredOn");
  });
});
