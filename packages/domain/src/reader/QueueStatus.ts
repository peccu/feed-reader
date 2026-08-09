export type QueueStatus = "unread" | "reading" | "read" | "skipped" | "archived";

const VALID_TRANSITIONS: Record<QueueStatus, readonly QueueStatus[]> = {
  // The carousel card is itself the reader, so like/dislike mark an unread
  // item read directly (unread -> read), and skip goes unread -> skipped.
  unread: ["reading", "read", "skipped", "archived"],
  reading: ["read", "skipped", "archived"],
  read: ["archived"],
  skipped: ["unread", "read", "archived"],
  archived: [],
};

export function canTransitionTo(from: QueueStatus, to: QueueStatus): boolean {
  return (VALID_TRANSITIONS[from] as readonly string[]).includes(to);
}
