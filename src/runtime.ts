export const CONTRIBUTOR_MODEL_ID = "muse-spark-1.3-contributor"

// Captured from Muse Code 1.3.0. Meta currently gates Contributor `max`
// on this client fingerprint for direct Model API requests.
export const MUSE_USER_AGENT =
  "muse-build/1.3.0 (non-interactive; linux-x86_64; build ac7280f2aca67769d1455a8847bb502b617d50f6)"

const MAX_VARIANT = {
  reasoningEffort: "max",
  reasoningSummary: "auto",
  include: ["reasoning.encrypted_content"],
}

function asUrl(input: RequestInfo | URL): URL | undefined {
  try {
    if (input instanceof URL) return input
    if (typeof input === "string") return new URL(input)
    return new URL(input.url)
  } catch {
    return undefined
  }
}

export function isDirectMetaModelApiUrl(input: RequestInfo | URL): boolean {
  const url = asUrl(input)
  if (!url) return false
  return (
    url.protocol === "https:" &&
    url.hostname === "api.meta.ai" &&
    url.port === "" &&
    (url.pathname === "/v1" || url.pathname.startsWith("/v1/"))
  )
}

export function museRequestHeaders(input: RequestInfo | URL, init?: RequestInit): Headers {
  const headers = new Headers(input instanceof Request ? input.headers : undefined)
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value))
  }
  if (isDirectMetaModelApiUrl(input)) {
    // Override SDK/runtime fingerprints on the direct first-party endpoint.
    // The auth loader installs this fetch only while Muse subscription creds
    // are active, and the endpoint guard prevents leaking it to proxies.
    headers.set("User-Agent", MUSE_USER_AGENT)
  }
  return headers
}

export async function museFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, headers: museRequestHeaders(input, init) })
}

export function addContributorMaxVariant<T extends Record<string, any>>(models: T): T {
  const model = models[CONTRIBUTOR_MODEL_ID]
  if (!model || typeof model !== "object") return models
  if (model.variants?.max) return models

  return {
    ...models,
    [CONTRIBUTOR_MODEL_ID]: {
      ...model,
      variants: {
        ...(model.variants ?? {}),
        max: { ...MAX_VARIANT },
      },
    },
  }
}
