import { expect, test, type Page } from "@playwright/test";

const relicPath = "/relic/green-drop-lariat";
const relicId = "RR-S3-N1";
const mediaKey = "relic.greenDrop.sunlightMacro";

async function waitForDestinationPreload(page: Page) {
  await page.waitForFunction((expectedMediaKey) => {
    return Array.from(document.images).some((image) => {
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

async function installRuntimeRecorder(page: Page) {
  await page.evaluate(() => {
    const main = document.querySelector<HTMLElement>("main[data-screen='current']");
    if (main === null) {
      throw new Error("Current screen was not mounted.");
    }

    const state = {
      cls: 0,
      longTaskMs: 0,
      phases: [] as Array<{ phase: string; at: number }>,
    };
    (window as typeof window & { __rrCloseout?: typeof state }).__rrCloseout = state;

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
        const shifts = new PerformanceObserver((list) => {
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
        shifts.observe({ type: "layout-shift", buffered: true });
      } catch {
        // LayoutShift is not implemented in every engine.
      }

      try {
        const longTasks = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            state.longTaskMs += entry.duration;
          }
        });
        longTasks.observe({ type: "longtask", buffered: true });
      } catch {
        // Long Task timing is not implemented in every engine.
      }
    }
  });
}

test("closeout captures warm Object Lift timing, media, CLS, and evidence frames", async ({
  page,
}, testInfo) => {
  await page.request.get(relicPath);
  await page.goto("/current");
  await waitForDestinationPreload(page);
  await installRuntimeRecorder(page);

  const current = page.locator("main[data-screen='current']");
  const active = page.getByTestId("active-relic");
  const sourceBox = await active.boundingBox();
  expect(sourceBox).not.toBeNull();
  expect(sourceBox?.x ?? 0).toBeLessThan(0);

  await testInfo.attach("01-current-resting.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });

  const startedAt = await page.evaluate(() => performance.now());
  await active.click();
  await expect(current).toHaveAttribute("data-object-transition", "lifting");

  const liftStyle = await active.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      duration: style.transitionDuration,
      easing: style.transitionTimingFunction,
      transform: style.transform,
    };
  });
  expect(liftStyle.duration).toBe("0.08s");
  expect(liftStyle.easing).toBe("cubic-bezier(0.22, 1, 0.36, 1)");
  expect(liftStyle.transform).not.toBe("none");

  await testInfo.attach("02-touch-acknowledgement.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });

  await page.waitForFunction(() =>
    document
      .querySelector("main[data-screen='current']")
      ?.getAttribute("data-object-transition") === "traveling",
  );
  const travelStyle = await active.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      duration: style.transitionDuration,
      easing: style.transitionTimingFunction,
      property: style.transitionProperty,
    };
  });
  expect(travelStyle.duration).toBe("0.18s");
  expect(travelStyle.easing).toBe("cubic-bezier(0.22, 1, 0.36, 1)");
  expect(travelStyle.property).toBe("transform");

  await testInfo.attach("03-object-travel.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });

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

  await testInfo.attach("04-inspection-settled.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });

  const metrics = await page.evaluate((transitionStart) => {
    const state = (window as typeof window & {
      __rrCloseout?: {
        cls: number;
        longTaskMs: number;
        phases: Array<{ phase: string; at: number }>;
      };
    }).__rrCloseout;
    const image = document.querySelector<HTMLImageElement>(
      "[data-testid='inspection-hero'] img",
    );
    const resource = image?.currentSrc
      ? (performance.getEntriesByName(image.currentSrc).at(-1) as
          | PerformanceResourceTiming
          | undefined)
      : undefined;

    return {
      cls: state?.cls ?? null,
      longTaskMs: state?.longTaskMs ?? null,
      phases: state?.phases ?? [],
      routeLatencyMs: performance.now() - transitionStart,
      media: image
        ? {
            currentSrc: image.currentSrc,
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            estimatedDecodedBytes:
              image.naturalWidth * image.naturalHeight * 4,
            transferSize: resource?.transferSize ?? null,
            decodedBodySize: resource?.decodedBodySize ?? null,
            resourceDurationMs: resource?.duration ?? null,
          }
        : null,
    };
  }, startedAt);

  const liftingAt = metrics.phases.find((entry) => entry.phase === "lifting")?.at;
  const travelingAt = metrics.phases.find((entry) => entry.phase === "traveling")?.at;
  if (liftingAt !== undefined && travelingAt !== undefined) {
    expect(travelingAt - liftingAt).toBeGreaterThanOrEqual(55);
    expect(travelingAt - liftingAt).toBeLessThan(160);
  }
  if (metrics.cls !== null) {
    expect(metrics.cls).toBeLessThan(0.01);
  }

  console.log(`OBJECT_PHYSICS_METRICS ${JSON.stringify(metrics)}`);
  await testInfo.attach("object-physics-metrics.json", {
    body: JSON.stringify(metrics, null, 2),
    contentType: "application/json",
  });
});

test("slow destination decode times out to the clean 120ms dissolve", async ({ page }) => {
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
    preload.decode = () => new Promise<void>(() => undefined);
    return true;
  }, mediaKey);
  expect(patched).toBe(true);

  const current = page.locator("main[data-screen='current']");
  const startedAt = await page.evaluate(() => performance.now());
  await page.getByTestId("active-relic").click();
  await expect(current).toHaveAttribute("data-object-transition", "dissolving");
  const fallbackAt = await page.evaluate(() => performance.now());
  const readinessElapsed = fallbackAt - startedAt;
  expect(readinessElapsed).toBeGreaterThanOrEqual(55);
  expect(readinessElapsed).toBeLessThan(250);
  await expect(page).toHaveURL(relicPath);
});

test("browser Back during lift cancels pending relic navigation", async ({ page }) => {
  await page.goto("/archive");
  await page.goto("/current");
  await waitForDestinationPreload(page);

  await page.getByTestId("active-relic").click();
  await expect(page.locator("main[data-screen='current']")).toHaveAttribute(
    "data-object-transition",
    "lifting",
  );
  await page.goBack();
  await expect(page).toHaveURL("/archive");
  await page.waitForTimeout(350);
  await expect(page).toHaveURL("/archive");
  await expect(page.locator("main")).toHaveAttribute("data-screen", "archive");
});

test("duplicate activation and return leave a clean reusable Current state", async ({ page }) => {
  await page.goto("/current");
  await waitForDestinationPreload(page);

  const active = page.getByTestId("active-relic");
  await active.click();
  await active.dispatchEvent("click", { button: 0 });
  await expect(page).toHaveURL(relicPath);

  await page.goBack();
  await expect(page).toHaveURL("/current");
  const current = page.locator("main[data-screen='current']");
  await expect(current).toHaveAttribute("data-object-transition", "idle");
  await expect(current).toHaveAttribute("aria-busy", "false");
  await expect(page.getByTestId("active-relic")).toHaveAttribute(
    "data-relic-id",
    relicId,
  );

  await page.setViewportSize({ width: 320, height: 844 });
  await waitForDestinationPreload(page);
  await page.getByTestId("active-relic").click();
  await expect(page).toHaveURL(relicPath);
});

test("viewport evidence settles the same relic at 320, 390, and 430", async ({
  page,
}, testInfo) => {
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/current");
    await waitForDestinationPreload(page);
    await page.getByTestId("active-relic").click();
    await expect(page).toHaveURL(relicPath);

    const hero = page.getByTestId("inspection-hero");
    await expect(hero).toHaveAttribute("data-relic-id", relicId);
    await expect(hero).toHaveAttribute("data-object-media-key", mediaKey);
    await testInfo.attach(`inspection-${width}px.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  }
});

test("reduced motion has no transform travel and remains Back-safe", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/current");

  const current = page.locator("main[data-screen='current']");
  const active = page.getByTestId("active-relic");
  await expect(current).toHaveAttribute("data-motion", "reduced");
  await expect(active).toHaveCSS("transform", "none");
  await expect(active).toHaveCSS("transition-property", "none");

  await active.click();
  await expect(current).toHaveAttribute("data-object-transition", "dissolving");
  await expect(active).toHaveCSS("transform", "none");
  await expect(page).toHaveURL(relicPath);

  await testInfo.attach("reduced-motion-inspection.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });

  await page.goBack();
  await expect(page).toHaveURL("/current");
  await expect(page.locator("main[data-screen='current']")).toHaveAttribute(
    "data-object-transition",
    "idle",
  );
  await expect(page.getByTestId("active-relic")).toHaveCSS("transform", "none");
});
