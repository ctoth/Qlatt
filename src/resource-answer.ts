/**
 * What a server's answer to a request for a resource says about the resource.
 *
 * Every loader that asks a server for a file reads the answer here, so that
 * "there is no such file" is decided in one place and is never confused with
 * "the request failed" or with the file's content.
 */

/**
 * True when the answer says the resource does not exist: HTTP 404 or 410, or a
 * successful answer that is an HTML page. The Vite dev server answers a path
 * with no file behind it with 200 and index.html (its SPA fallback); none of
 * the resources these loaders read (YAML, JSON) is served as HTML.
 *
 * A server that answers an existing file with a 200 HTML error page (some
 * proxies do) is read as absence.
 */
export function isAbsentResourceAnswer(
  status: number,
  contentType: string | null | undefined,
): boolean {
  if (status === 404 || status === 410) return true;
  if (status < 200 || status >= 300) return false;
  return (contentType ?? "").trim().toLowerCase().startsWith("text/html");
}

export type SyncTextAnswer =
  | { kind: "text"; text: string }
  /** The server said there is no such resource ({@link isAbsentResourceAnswer}). */
  | { kind: "absent" }
  /** The request got no answer (`status` 0) or an answer that is neither. */
  | { kind: "failed"; status: number; cause?: unknown };

/**
 * Read a URL with a blocking XMLHttpRequest. Null where there is no
 * XMLHttpRequest (Node): the caller reads the filesystem instead.
 */
export function requestTextSync(url: string): SyncTextAnswer | null {
  if (typeof XMLHttpRequest !== "function") return null;
  const request = new XMLHttpRequest();
  try {
    request.open("GET", url, false);
    request.send();
  } catch (cause) {
    // A blocking request that cannot reach the server throws.
    return { kind: "failed", status: 0, cause };
  }
  const { status } = request;
  if (isAbsentResourceAnswer(status, request.getResponseHeader("content-type"))) {
    return { kind: "absent" };
  }
  if (status < 200 || status >= 300 || typeof request.responseText !== "string") {
    return { kind: "failed", status };
  }
  return { kind: "text", text: request.responseText };
}

/** The end of an error message for a failed request: ` (HTTP 500)` or `: <why>`. */
export function requestFailureDetail(status: number, cause?: unknown): string {
  if (cause !== undefined) return `: ${cause instanceof Error ? cause.message : String(cause)}`;
  return status === 0 ? ": no answer" : ` (HTTP ${status})`;
}
