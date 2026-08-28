import type { RelicId, RelicStatus } from "@/data/relic";

export const INSPECTION_LOG_STORAGE_KEY = "rr.inspectionLog.v1" as const;

export type InspectionLogRecord = {
  firstInspectedAt: string;
  lastInspectedAt: string;
  lastObservedStatus: RelicStatus;
  relicId: RelicId;
  transferRevealAcknowledgedAt: string | null;
};

type InspectionLogDocument = {
  records: Record<string, InspectionLogRecord>;
  version: 1;
};

export type StorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

type InspectionLogStoreOptions = {
  now?: () => Date;
  storage: StorageLike;
};

const EMPTY_DOCUMENT: InspectionLogDocument = {
  version: 1,
  records: {},
};

function isRelicStatus(value: unknown): value is RelicStatus {
  return value === "available" || value === "transferred";
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isInspectionLogRecord(value: unknown): value is InspectionLogRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Partial<InspectionLogRecord>;

  return (
    typeof record.relicId === "string" &&
    record.relicId.startsWith("RR-") &&
    isIsoTimestamp(record.firstInspectedAt) &&
    isIsoTimestamp(record.lastInspectedAt) &&
    isRelicStatus(record.lastObservedStatus) &&
    (record.transferRevealAcknowledgedAt === null ||
      isIsoTimestamp(record.transferRevealAcknowledgedAt))
  );
}

function parseDocument(serialized: string | null): InspectionLogDocument {
  if (serialized === null) {
    return { ...EMPTY_DOCUMENT, records: {} };
  }

  try {
    const value: unknown = JSON.parse(serialized);

    if (typeof value !== "object" || value === null) {
      return { ...EMPTY_DOCUMENT, records: {} };
    }

    const candidate = value as Partial<InspectionLogDocument>;

    if (
      candidate.version !== 1 ||
      typeof candidate.records !== "object" ||
      candidate.records === null
    ) {
      return { ...EMPTY_DOCUMENT, records: {} };
    }

    const records = Object.fromEntries(
      Object.entries(candidate.records).filter(
        ([key, record]) => isInspectionLogRecord(record) && record.relicId === key,
      ),
    );

    return { version: 1, records };
  } catch {
    return { ...EMPTY_DOCUMENT, records: {} };
  }
}

export function parseInspectionLogRecords(serialized: string | null) {
  return Object.values(parseDocument(serialized).records).sort((left, right) =>
    right.lastInspectedAt.localeCompare(left.lastInspectedAt),
  );
}

export function createInspectionLogStore({
  storage,
  now = () => new Date(),
}: InspectionLogStoreOptions) {
  function readDocument() {
    try {
      return parseDocument(storage.getItem(INSPECTION_LOG_STORAGE_KEY));
    } catch {
      return { ...EMPTY_DOCUMENT, records: {} };
    }
  }

  function writeDocument(document: InspectionLogDocument) {
    try {
      storage.setItem(INSPECTION_LOG_STORAGE_KEY, JSON.stringify(document));
      return true;
    } catch {
      return false;
    }
  }

  return {
    acknowledgeTransfer(relicId: RelicId) {
      const document = readDocument();
      const current = document.records[relicId];

      if (
        current === undefined ||
        current.lastObservedStatus !== "available" ||
        current.transferRevealAcknowledgedAt !== null
      ) {
        return false;
      }

      document.records[relicId] = {
        ...current,
        lastObservedStatus: "transferred",
        transferRevealAcknowledgedAt: now().toISOString(),
      };
      return writeDocument(document);
    },

    clear() {
      try {
        storage.removeItem(INSPECTION_LOG_STORAGE_KEY);
        return true;
      } catch {
        return false;
      }
    },

    get(relicId: RelicId) {
      return readDocument().records[relicId] ?? null;
    },

    hasPendingTransferReveal(relicId: RelicId, currentStatus: RelicStatus) {
      const record = readDocument().records[relicId];

      return (
        currentStatus === "transferred" &&
        record?.lastObservedStatus === "available" &&
        record.transferRevealAcknowledgedAt === null
      );
    },

    list() {
      try {
        return parseInspectionLogRecords(
          storage.getItem(INSPECTION_LOG_STORAGE_KEY),
        );
      } catch {
        return [];
      }
    },

    recordInspection(relicId: RelicId, observedStatus: RelicStatus) {
      const document = readDocument();
      const timestamp = now().toISOString();
      const current = document.records[relicId];
      const preservePendingTransfer =
        current?.lastObservedStatus === "available" &&
        observedStatus === "transferred" &&
        current.transferRevealAcknowledgedAt === null;

      const record: InspectionLogRecord = current
        ? {
            ...current,
            lastInspectedAt: timestamp,
            lastObservedStatus: preservePendingTransfer
              ? "available"
              : observedStatus,
          }
        : {
            relicId,
            firstInspectedAt: timestamp,
            lastInspectedAt: timestamp,
            lastObservedStatus: observedStatus,
            transferRevealAcknowledgedAt: null,
          };

      document.records[relicId] = record;
      writeDocument(document);
      return record;
    },
  };
}

export function createBrowserInspectionLogStore() {
  if (typeof window === "undefined") {
    throw new Error("The Inspection Log is only available in the browser.");
  }

  try {
    return createInspectionLogStore({ storage: window.localStorage });
  } catch {
    const unavailableStorage: StorageLike = {
      getItem: () => null,
      removeItem: () => {
        throw new Error("Browser storage is unavailable.");
      },
      setItem: () => {
        throw new Error("Browser storage is unavailable.");
      },
    };

    return createInspectionLogStore({ storage: unavailableStorage });
  }
}

export type InspectionLogStore = ReturnType<typeof createInspectionLogStore>;
