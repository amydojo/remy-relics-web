import { expect, test, type Page } from "@playwright/test";

const relicPath = "/relic/green-drop-lariat";
const relicId = "RR-S3-N1";
const mediaKey = "relic.greenDrop.sunlightMacro";

async function waitForDestinationPreload(page: Page) {
  await page.waitForFunction((expectedMediaKey) => {
    const images = Array.from(document.images);
    return images.some((image) => {
      const parent = image.parentElement;
      return (
        image.currentSrc.includes(expectedMediaKey) &&
        parent !== null &&
        getComputedStyle(parent).opacity === "0" &&
        image.complete &&
        image.naturalWidth > 0
      );
    });
  }, mediaKey);
}

async function waitForObjectTravel(page: Page) {
  await page.waitForFunction(() =>
    document
      .querySelector("main[data-screen='current']")
      ?.getAttribute("data-object-transition") === "traveling",
  );
}

async function installPhaseRecorder(page: Page) {
  await page.evaluate(() => {
    const main = document.querySelector<HTMLElement>("main[data-screen='current']");
    if (main === null) {
      throw new Error("Current screen was not mounted.");
    }

    const state = {
      cls: 0,
      phases: [] as Array<{ phase: string; at: number }>,
    };
    (window as typeof window & { __rrObjectPhysics?: typeof state }).__rrObjectPhysics = state;

    const record = () => {
      state.phases.push({
        phase: main.dataset.objectTransition ?? "missing",
        at: performance.now(),
      });
    };
    record();

    new MutationObserver(record).observe(main, {
      attributes: true,
      attributeFilter: ["data-object-transition"],
    });

    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & {
              hadRecentInput?: boolean;
              value?: number;
            };
            if (!shift.hadRecentInput) {
              state.cls += shift.value ?? 0;
            }
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });
      } catch {
        // LayoutShift is not available in every browser; phase assertions still run.
      }
    }
  });
}

test("Object Lift preserves one media identity and uses transform-only travel", async ({
  page,
}) => {
  await page.request.get(relicPath);
  await page.goto("/current");
  await waitForDestinationPreload(page);
  await installPhaseRecorder(page);

  const active = page.getByTestId("active-relic");

  await expect(active).toHaveAttribute("data-relic-id", relicId);
  await expect(active).toHaveAttribute("data-object-media-key", mediaKey);
  expect(
    await active.evaluate((node) => getComputedStyle(node).transitionProperty),
  ).toBe("transform");

  await active.click();
  await waitForObjectTravel(page);

  const travelingGeometry = await active.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      top: style.top,
      left: style.left,
      width: style.width,
      height: style.height,
      transitionProperty: style.transitionProperty,
    };
  });
  expect(travelingGeometry).toEqual({
    top: "70px",
    left: "16px",
    width: "358px",
    height: "318px",
    transitionProperty: "transform",
  });

  const proof = await page.evaluate(() => {
    return (window as typeof window & {
      __rrObjectPhysics?: {
        cls: number;
        phases: Array<{ phase: string; at: number }>;
      };
    }).__rrObjectPhysics;
  });
  expect(proof).toBeDefined();
  expect(proof?.phases.map((entry) => entry.phase)).toContain("lifting");
  expect(proof?.phases.map((entry) => entry.phase)).toContain("traveling");
  expect(proof?.cls ?? 0).toBeLessThan(0.01);

  await expect(page).toHaveURL(relicPath);
  const inspectionHero = page.getByTestId("inspection-hero");
  await expect(inspectionHero).toHaveAttribute("data-relic-id", relicId);
  await expect(inspectionHero).toHaveAttribute("data-object-media-key", mediaKey);
  await expect
    .poll(() =>
      inspectionHero.locator("img").evaluate((image) => {
        const img = image as HTMLImageElement;
        return img.complete && img.naturalWidth > 0;
      }),
    )
    .toBe(true);
});

test("Object Lift keeps canonical destination geometry at 320 and 430 widths", async ({
  page,
}) => {
  for (const viewportWidth of [320, 430]) {
    await page.setViewportSize({ width: viewportWidth, height: 844 });
    await page.goto("/current");
    await waitForDestinationPreload(page);

    const active = page.getByTestId("active-relic");
    await active.click();
    await waitForObjectTravel(page);

    const geometry = await active.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        top: style.top,
        left: style.left,
        width: style.width,
        height: style.height,
      };
    });
    const screenWidth = Math.min(viewportWidth, 390);

    expect(geometry).toEqual({
      top: "70px",
      left: "16px",
      width: `${screenWidth - 32}px`,
      height: "318px",
    });
    await expect(page).toHaveURL(relicPath);
  }
});

test("failed destination readiness degrades to the 120ms dissolve path", async ({
  page,
}) => {
  await page.goto("/current");
  await waitForDestinationPreload(page);

  const patched = await page.evaluate((expectedMediaKey) => {
    const preload = Array.from(document.images).find((image) => {
      const parent = image.parentElement;
      return (
        image.currentSrc.includes(expectedMediaKey) &&
        parent !== null &&
        getComputedStyle(parent).opacity === "0"
      );
    });

    if (preload === undefined) {
      return false;
    }

    Object.defineProperty(preload, "complete", {
      configurable: true,
      value: false,
    });
    Object.defineProperty(preload, "naturalWidth", {
      configurable: true,
      value: 0,
    });
    preload.decode = () => Promise.reject(new Error("injected decode failure"));
    return true;
  }, mediaKey);
  expect(patched).toBe(true);

  const current = page.locator("main[data-screen='current']");
  await page.getByTestId("active-relic").click();
  await expect(current).toHaveAttribute("data-object-transition", "dissolving");
  expect(
    await current.evaluate((node) =>
      getComputedStyle(node).getPropertyValue("--rr-motion-reduced").trim(),
    ),
  ).toBe(".12s");
  await expect(page).toHaveURL(relicPath);
});

test("reduced motion skips object travel and dissolves", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/current");

  const current = page.locator("main[data-screen='current']");
  const active = page.getByTestId("active-relic");
  await expect(active).toHaveCSS("transform", "none");
  await active.click();

  await expect(current).toHaveAttribute("data-object-transition", "dissolving");
  expect(await active.evaluate((node) => getComputedStyle(node).transform)).toBe("none");
  await expect(page).toHaveURL(relicPath);
  await expect(page.locator("main")).toHaveAttribute("data-motion", "reduced");
});

test("direct relic load remains independent from Current transition state", async ({ page }) => {
  await page.goto(relicPath);

  await expect(page.locator("main")).toHaveAttribute("data-screen", "inspection");
  await expect(page.getByTestId("inspection-hero")).toHaveAttribute(
    "data-relic-id",
    relicId,
  );
  await expect(page.getByTestId("inspection-hero")).toHaveAttribute(
    "data-object-media-key",
    mediaKey,
  );
});
