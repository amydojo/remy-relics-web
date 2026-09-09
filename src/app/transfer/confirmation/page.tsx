import type { Metadata } from "next";

import { TransferConfirmationScreen } from "@/components/remy/transfer-confirmation-screen";
import { readTransferConfirmation } from "@/commerce/public-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Transfer Confirmation",
  robots: { index: false, follow: false },
};

type TransferConfirmationPageProps = {
  searchParams: Promise<{
    session_id?: string | string[];
  }>;
};

export default async function TransferConfirmationPage({
  searchParams,
}: TransferConfirmationPageProps) {
  const params = await searchParams;
  const rawSessionId = params.session_id;
  const sessionId =
    typeof rawSessionId === "string" && rawSessionId.trim()
      ? rawSessionId.trim()
      : null;
  const record =
    sessionId === null ? null : await readTransferConfirmation(sessionId);

  return (
    <TransferConfirmationScreen
      record={record}
      sessionId={sessionId}
    />
  );
}
