// Shared filename, error, and HTML helpers for platform adapters.
export function sanitizeName(name) {
  return (
    (name || "Problem")
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/[\u0000-\u001f]/g, "")
      .replace(/\s+/g, " ")
      .replace(/\.+$/, "")
      .trim()
      .slice(0, 80) || "Problem"
  );
}

export function transientError(message, retryAfterMs) {
  const err = new Error(message);
  err.code = "transient";
  if (retryAfterMs) err.retryAfter = retryAfterMs;
  return err;
}

export function authError(message) {
  const err = new Error(message);
  err.code = "auth";
  return err;
}

export function decodeEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}
