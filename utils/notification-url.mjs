export function safeMessageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value, "https://localhost");
    return ["https:", "http:"].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
}
