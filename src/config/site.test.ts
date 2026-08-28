import { describe, expect, it } from "vitest";

import { getMenuExternalLinks, getSiteUrl } from "./site";

describe("site configuration", () => {
  it("normalizes the production origin", () => {
    expect(
      getSiteUrl({ NEXT_PUBLIC_SITE_URL: "remy.example" }).toString(),
    ).toBe("https://remy.example/");
  });

  it("keeps unconfirmed menu destinations safely disabled", () => {
    expect(getMenuExternalLinks({})).toEqual({
      etsyShop: null,
      instagram: null,
    });
    expect(
      getMenuExternalLinks({
        NEXT_PUBLIC_ETSY_SHOP_URL: "javascript:alert(1)",
        NEXT_PUBLIC_INSTAGRAM_URL: "not a URL",
      }),
    ).toEqual({ etsyShop: null, instagram: null });
  });

  it("accepts configured HTTP destinations", () => {
    expect(
      getMenuExternalLinks({
        NEXT_PUBLIC_ETSY_SHOP_URL: "https://www.etsy.com/shop/example",
        NEXT_PUBLIC_INSTAGRAM_URL: "https://www.instagram.com/example/",
      }),
    ).toEqual({
      etsyShop: "https://www.etsy.com/shop/example",
      instagram: "https://www.instagram.com/example/",
    });
  });
});
