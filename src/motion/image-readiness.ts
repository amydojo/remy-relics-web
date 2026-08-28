export type DecodableImage = Pick<
  HTMLImageElement,
  "complete" | "decode" | "naturalWidth"
>;

export function isDecodedImageUsable(image: DecodableImage | null) {
  return image !== null && image.complete && image.naturalWidth > 0;
}

export async function confirmDecodedImage(image: DecodableImage | null) {
  if (image === null) {
    return false;
  }

  if (isDecodedImageUsable(image)) {
    return true;
  }

  try {
    await image.decode();
  } catch {
    return false;
  }

  return isDecodedImageUsable(image);
}

export async function confirmDecodedImageWithin(
  image: DecodableImage | null,
  timeoutMs: number,
) {
  if (timeoutMs <= 0) {
    return isDecodedImageUsable(image);
  }

  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      confirmDecodedImage(image),
      new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}
