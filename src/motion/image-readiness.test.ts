import { describe, expect, it, vi } from "vitest";

import {
  confirmDecodedImage,
  confirmDecodedImageWithin,
  isDecodedImageUsable,
  type DecodableImage,
} from "./image-readiness";

function imageFixture(
  overrides: Partial<DecodableImage> = {},
): DecodableImage {
  return {
    complete: true,
    naturalWidth: 1585,
    decode: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("image readiness", () => {
  it("accepts an already decoded destination without decoding again", async () => {
    const image = imageFixture();

    expect(isDecodedImageUsable(image)).toBe(true);
    await expect(confirmDecodedImage(image)).resolves.toBe(true);
    expect(image.decode).not.toHaveBeenCalled();
  });

  it("waits for a cold image decode and then accepts it", async () => {
    const image = imageFixture({ complete: false, naturalWidth: 0 });
    image.decode = vi.fn(async () => {
      Object.assign(image, { complete: true, naturalWidth: 1585 });
    });

    await expect(confirmDecodedImage(image)).resolves.toBe(true);
    expect(image.decode).toHaveBeenCalledOnce();
  });

  it("rejects failed or zero-width media cleanly", async () => {
    const failed = imageFixture({
      complete: false,
      naturalWidth: 0,
      decode: vi.fn().mockRejectedValue(new Error("decode failed")),
    });

    await expect(confirmDecodedImage(failed)).resolves.toBe(false);
    await expect(confirmDecodedImage(null)).resolves.toBe(false);
  });

  it("times out slow decode so navigation can degrade to dissolve", async () => {
    vi.useFakeTimers();
    const image = imageFixture({ complete: false, naturalWidth: 0 });
    image.decode = vi.fn(() => new Promise<void>(() => undefined));

    const readiness = confirmDecodedImageWithin(image, 80);
    await vi.advanceTimersByTimeAsync(80);

    await expect(readiness).resolves.toBe(false);
    vi.useRealTimers();
  });
});
