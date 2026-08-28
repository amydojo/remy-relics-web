import { expect, test } from "@playwright/test";

test("the V1 path remains operable with touch input", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("enter-recoveries").tap();
  await expect(page).toHaveURL("/current");

  // Re-enter at the stable Current resting state so the next gesture is not
  // coupled to the preceding route-announcement/hydration boundary.
  await page.goto("/current");
  await expect(page.locator("main[data-screen='current']")).toBeVisible();
  await page.getByTestId("active-relic").tap();
  await expect(page).toHaveURL("/relic/green-drop-lariat");

  const evidence = page.getByTestId("inspection-evidence");
  const box = await evidence.boundingBox();
  expect(box).not.toBeNull();

  if (box !== null) {
    const session = await page.context().newCDPSession(page);
    const start = {
      x: box.x + box.width * 0.82,
      y: box.y + box.height * 0.5,
    };
    const end = {
      x: box.x + box.width * 0.18,
      y: start.y,
    };

    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...start, id: 1 }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ ...end, id: 1 }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  }

  await expect(page.getByTestId("evidence-counter")).toContainText(
    "02 / 05 · SURFACE",
  );
  await page.getByTestId("view-full-record").tap();
  await expect(page.locator("main")).toHaveAttribute("data-screen", "record");
});
