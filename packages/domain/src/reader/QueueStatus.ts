export type QueueStatus = "unread" | "reading" | "read" | "skipped" | "archived";

const VALID_TRANSITIONS: Record<QueueStatus, readonly QueueStatus[]> = {
  unread: ["reading", "skipped"],
  reading: ["read", "skipped"],
  read: ["archived"],
  skipped: ["unread", "archived"],
  archived: [],
};

export function canTransitionTo(from: QueueStatus, to: QueueStatus): boolean {
  return (VALID_TRANSITIONS[from] as readonly string[]).includes(to);
}
