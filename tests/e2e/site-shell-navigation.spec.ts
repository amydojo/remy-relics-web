import { expect, test } from "@playwright/test";

const browseRoutes = ["/", "/current", "/archive", "/log", "/about"] as const;

for (const width of [390, 430]) {
  for (const route of browseRoutes) {
    test(`${route} uses the browser field without a device shell at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(route);

      const screen = page.locator("body > main[data-screen]");
      await expect(screen).toBeVisible();
      await expect(screen).toHaveCSS("border-radius", "0px");

      const box = await screen.boundingBox();
      expect(box).not.toBeNull();
      expect(box?.x).toBeCloseTo(0, 0);
      expect(box?.width).toBeCloseTo(width, 0);
      expect(box?.height).toBeGreaterThanOrEqual(844);
    });
  }
}

test("browse navigation is explicit and consistent across the site", async ({ page }) => {
  await page.goto("/");

  const bottomNav = page.getByRole("navigation", { name: "Browse" });
  await expect(bottomNav.getByRole("link", { name: "CURRENT", exact: true })).toHaveAttribute(
    "href",
    "/current",
  );
  await expect(bottomNav.getByRole("link", { name: "ARCHIVE", exact: true })).toHaveAttribute(
    "href",
    "/archive",
  );
  await expect(bottomNav.getByRole("link", { name: "LOG", exact: true })).toHaveAttribute(
    "href",
    "/log",
  );

  await page.getByTestId("menu-trigger").click();
  const menu = page.getByTestId("menu-overlay");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("heading", { name: "BROWSE" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "CURRENT", exact: true })).toHaveAttribute(
    "href",
    "/current",
  );
  await expect(menu.getByRole("link", { name: "ARCHIVE", exact: true })).toHaveAttribute(
    "href",
    "/archive",
  );
  await expect(menu.getByRole("link", { name: /^YOUR LOG \/ / })).toHaveAttribute(
    "href",
    "/log",
  );

  await menu.getByRole("link", { name: "ARCHIVE", exact: true }).click();
  await expect(page).toHaveURL("/archive");
  await expect(
    page
      .getByRole("navigation", { name: "Browse" })
      .getByRole("link", { name: "ARCHIVE", exact: true }),
  ).toHaveAttribute("aria-current", "page");

  await page.getByTestId("menu-trigger").click();
  const archiveMenu = page.getByTestId("menu-overlay");
  await expect(
    archiveMenu.getByRole("link", { name: "ARCHIVE", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await archiveMenu.getByRole("link", { name: /^YOUR LOG \/ / }).click();
  await expect(page).toHaveURL("/log");

  await expect(
    page
      .getByRole("navigation", { name: "Browse" })
      .getByRole("link", { name: "LOG", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("desktop screens expand into the shared 960px composition", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });

  for (const route of ["/", "/current", "/archive", "/log", "/about"] as const) {
    await page.goto(route);
    const screen = page.locator("body > main[data-screen]");
    const box = await screen.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width).toBeCloseTo(960, 0);
    expect(box?.x).toBeCloseTo(32, 0);
    expect(box?.height).toBeGreaterThanOrEqual(900);
  }
});
