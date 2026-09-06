export function formatMarkedTime(markedAtIso: string): string {
  return new Date(markedAtIso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}
