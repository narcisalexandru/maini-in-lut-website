const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "transfer-encoding",
]);

export default defineEventHandler(async (event) => {
  const requestUrl = getRequestURL(event);
  if (requestUrl.pathname !== "/api" && !requestUrl.pathname.startsWith("/api/")) {
    return;
  }

  const destination = requestUrl.pathname.replace(/^\/api/, "") || "/";
  const target = `${useRuntimeConfig().backendUrl}${destination}${requestUrl.search}`;
  const method = event.method;
  const headers = new Headers();
  for (const [key, value] of Object.entries(getRequestHeaders(event))) {
    if (!value || HOP_BY_HOP_HEADERS.has(key)) {
      continue;
    }
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

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
  for (const cookie of response.headers.getSetCookie()) {
    appendResponseHeader(event, "set-cookie", cookie);
  }

  return new Uint8Array(await response.arrayBuffer());
});
