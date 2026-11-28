const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "transfer-encoding",
]);

function browserOrigin(event: H3Event): string {
  const requestUrl = getRequestURL(event);
  const forwardedProto = getRequestHeader(event, "x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const host =
    getRequestHeader(event, "x-forwarded-host")?.split(",")[0]?.trim() ||
    getRequestHeader(event, "host") ||
    requestUrl.host;
  const proto = forwardedProto || requestUrl.protocol.replace(":", "");
  return `${proto}://${host}`;
}

function cookieForBrowser(cookie: string, https: boolean): string {
  const parts = cookie
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  const [pair, ...attributes] = parts;
  const kept = attributes.filter((attribute) => {
    const name = attribute.split("=")[0]?.trim().toLowerCase();
    return name !== "domain" && name !== "samesite" && name !== "secure";
  });
  if (https) {
    kept.push("Secure");
  }
  kept.push("SameSite=Lax");
  return [pair, ...kept].join("; ");
}

export default defineEventHandler(async (event) => {
  const requestUrl = getRequestURL(event);
  if (requestUrl.pathname !== "/api" && !requestUrl.pathname.startsWith("/api/")) {
    return;
  }

  const destination = requestUrl.pathname.replace(/^\/api/, "") || "/";
  const target = `${useRuntimeConfig().backendUrl}${destination}${requestUrl.search}`;
  const origin = browserOrigin(event);
  const method = event.method;
  const headers = new Headers();
  for (const [key, value] of Object.entries(getRequestHeaders(event))) {
    if (!value || HOP_BY_HOP_HEADERS.has(key) || key === "x-maini-public-origin") {
      continue;
    }
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  headers.set("x-maini-public-origin", origin);

  const hasBody = method !== "GET" && method !== "HEAD";
  const rawBody = hasBody ? await readRawBody(event, false) : undefined;
  const response = await fetch(target, {
    method,
    headers,
    body: rawBody ? new Uint8Array(rawBody) : undefined,
    redirect: "manual",
  });

  setResponseStatus(event, response.status, response.statusText);
  response.headers.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key) || key === "set-cookie") {
      return;
    }
    setResponseHeader(event, key, value);
  });
  const https = origin.startsWith("https://");
  for (const cookie of response.headers.getSetCookie()) {
    appendResponseHeader(event, "set-cookie", cookieForBrowser(cookie, https));
  }

  return new Uint8Array(await response.arrayBuffer());
});
