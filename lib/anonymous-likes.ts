const ANONYMOUS_LIKE_ID_KEY = "report-tools-anonymous-like-id";
const ANONYMOUS_LIKE_ID_PATTERN =
  /^rt_anon_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function createFallbackId(): string {
  const randomPart = Array.from({ length: 36 }, (_, index) => {
    if ([8, 13, 18, 23].includes(index)) return "-";
    return Math.floor(Math.random() * 16).toString(16);
  }).join("");

  return `rt_anon_${randomPart}`;
}

export function getAnonymousLikeId(): string {
  const existing = window.localStorage.getItem(ANONYMOUS_LIKE_ID_KEY);

  if (existing && ANONYMOUS_LIKE_ID_PATTERN.test(existing)) {
    return existing;
  }

  const nextId =
    typeof window.crypto?.randomUUID === "function"
      ? `rt_anon_${window.crypto.randomUUID()}`
      : createFallbackId();

  window.localStorage.setItem(ANONYMOUS_LIKE_ID_KEY, nextId);
  return nextId;
}
