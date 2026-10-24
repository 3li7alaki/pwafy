/**
 * What kind of failure reached the error page, so it can say what happened instead of "Something went wrong":
 * - "offline": the request never reached the server.
 * - "update": a deploy replaced the code this screen lazy-loads, so only a reload fixes it.
 * - "missing": the server says the thing is gone (a deleted match, a dead link).
 * - "broken": a bug. The page offers the details to send to whoever runs the app.
 */
export type ErrorKind = "offline" | "update" | "missing" | "broken";

// Chromium, WebKit and Firefox wordings for a failed dynamic import, and Vite's CSS preload failure.
const staleChunk = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;
// A fetch that never got an answer: Chromium, WebKit, Firefox.
const noAnswer = /^(Failed to fetch|Load failed|NetworkError when attempting to fetch resource\.)$/;

export function errorKind(error: unknown, online: boolean): ErrorKind {
  const message = error instanceof Error ? error.message : String(error);
  if (staleChunk.test(message)) return online ? "update" : "offline";
  // PocketBase's ClientResponseError carries the HTTP status; 0 means no response at all.
  const status = (error as { status?: unknown } | null)?.status;
  if (!online || status === 0 || noAnswer.test(message)) return "offline";
  if (status === 404) return "missing";
  return "broken";
}

/** Plain text for the person to paste to whoever runs the app: enough to find the bug, nothing private. */
export function errorDetails(error: unknown, context: { url: string; build?: string; userAgent: string; at: Date }) {
  const lines = [
    error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    `Page: ${context.url}`,
    context.build && `Build: ${context.build}`,
    `Time: ${context.at.toISOString()}`,
    `Browser: ${context.userAgent}`,
  ];
  // The top of the stack finds the line; the rest is framework frames.
  const stack = error instanceof Error ? error.stack?.split("\n").slice(0, 6).join("\n") : undefined;
  return [...lines.filter(Boolean), stack && `\n${stack}`].filter(Boolean).join("\n");
}
