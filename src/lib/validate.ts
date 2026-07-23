/** Input validation for API routes. Throws ApiError with a client-safe message. */

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const LIMITS = {
  essayMinChars: 400,
  essayMaxChars: 12000,
  titleMaxChars: 200,
  essayTypes: [
    "Common App personal statement",
    "School supplemental",
    '"Why us?" essay',
    "Other",
  ] as const,
};

export function validateEssayContent(content: unknown): string {
  if (typeof content !== "string") throw new ApiError(400, "content required");
  const trimmed = content.replace(/\r\n/g, "\n").trim();
  if (trimmed.length < LIMITS.essayMinChars)
    throw new ApiError(400, `Essay must be at least ${LIMITS.essayMinChars} characters`);
  if (trimmed.length > LIMITS.essayMaxChars)
    throw new ApiError(400, `Essay must be under ${LIMITS.essayMaxChars} characters`);
  return trimmed;
}

export function validateTitle(title: unknown): string {
  if (typeof title !== "string" || !title.trim())
    throw new ApiError(400, "title required");
  return title.trim().slice(0, LIMITS.titleMaxChars);
}

export function validateEssayType(t: unknown): string {
  const s = typeof t === "string" ? t : "";
  return (LIMITS.essayTypes as readonly string[]).includes(s)
    ? s
    : LIMITS.essayTypes[0];
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function isUuid(s: unknown): s is string {
  return (
    typeof s === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
  );
}
