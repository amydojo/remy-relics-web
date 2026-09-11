import {
  assertCanonicalCommerceIdentity,
  isPurchasableCommerceRelic,
  type CommerceRelicRecord,
} from "@/commerce/model";
import type { Relic } from "@/data/relic";

export type ResolvedRelicCommerce = {
  currency: CommerceRelicRecord["currency"];
  etsyUrl: string | null;
  priceCents: number | null;
  purchasable: boolean;
  quantity: CommerceRelicRecord["quantity"];
  status: CommerceRelicRecord["status"];
  transferDate: string | null;
};

export type ResolvedRelic = {
  presentation: Relic;
  commerce: ResolvedRelicCommerce;
};

export function resolveRelicWithCommerceTruth(
  presentation: Relic,
  commerce: CommerceRelicRecord,
): ResolvedRelic {
  assertCanonicalCommerceIdentity(presentation, commerce);

  const purchasable = isPurchasableCommerceRelic(commerce);

  return {
    presentation,
    commerce: {
      currency: commerce.currency,
      etsyUrl: commerce.etsyUrl,
      priceCents: purchasable ? commerce.priceCents : null,
      purchasable,
      quantity: commerce.quantity,
      status: commerce.status,
      transferDate: commerce.transferDate,
    },
  };
}

export function formatCanonicalPrice(
  commerce: Pick<ResolvedRelicCommerce, "currency" | "priceCents">,
) {
  if (commerce.priceCents === null) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: commerce.currency,
    maximumFractionDigits: commerce.priceCents % 100 === 0 ? 0 : 2,
  }).format(commerce.priceCents / 100);
}


export function formatCanonicalDate(value: string | null) {
  if (value === null) {
    return null;
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${month}.${day}.${year.slice(-2)}`;
}
