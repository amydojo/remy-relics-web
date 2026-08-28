export function formatInspectionTimestamp(
  timestamp: string,
  now = new Date(),
) {
  const inspectedAt = new Date(timestamp);
  const time = `${String(inspectedAt.getHours()).padStart(2, "0")}:${String(
    inspectedAt.getMinutes(),
  ).padStart(2, "0")}`;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inspectedDay = new Date(
    inspectedAt.getFullYear(),
    inspectedAt.getMonth(),
    inspectedAt.getDate(),
  );
  const dayDifference = Math.round(
    (today.getTime() - inspectedDay.getTime()) / 86_400_000,
  );

  if (dayDifference === 0) {
    return `TODAY ${time}`;
  }

  if (dayDifference === 1) {
    return `YESTERDAY ${time}`;
  }

  const date = [
    String(inspectedAt.getMonth() + 1).padStart(2, "0"),
    String(inspectedAt.getDate()).padStart(2, "0"),
    String(inspectedAt.getFullYear()).slice(-2),
  ].join(".");

  return `${date} ${time}`;
}
