import { test } from "node:test"
import assert from "node:assert/strict"
import {
  CONTRIBUTOR_MODEL_ID,
  MUSE_USER_AGENT,
  addContributorMaxVariant,
  isDirectMetaModelApiUrl,
  museFetch,
} from "../dist/runtime.js"

test("direct Meta Model API URL detection is strict", () => {
  assert.equal(isDirectMetaModelApiUrl("https://api.meta.ai/v1/responses"), true)
  assert.equal(isDirectMetaModelApiUrl("https://API.META.AI/v1/responses"), true)
  assert.equal(isDirectMetaModelApiUrl("https://api.meta.ai:443/v1/responses"), true)
  assert.equal(isDirectMetaModelApiUrl("https://api.meta.ai:8443/v1/responses"), false)
  assert.equal(isDirectMetaModelApiUrl("https://api.meta.ai.evil.example/v1/responses"), false)
  assert.equal(isDirectMetaModelApiUrl("https://proxy.example/v1/responses"), false)
  assert.equal(isDirectMetaModelApiUrl("http://api.meta.ai/v1/responses"), false)
  assert.equal(isDirectMetaModelApiUrl("https://api.meta.ai/muse-code/key"), false)
})

test("Muse fetch fingerprints direct Meta requests and not proxies", async () => {
  const originalFetch = globalThis.fetch
  const seen: Array<{ url: string; userAgent: string | null }> = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input)
    seen.push({ url, userAgent: new Headers(init?.headers).get("user-agent") })
    return new Response("ok")
  }) as typeof fetch

  try {
    await museFetch("https://api.meta.ai/v1/responses", {
      headers: { "User-Agent": "ai-sdk/openai" },
    })
    await museFetch("https://proxy.example/v1/responses", {
      headers: { "User-Agent": "custom-client" },
    })
  } finally {
    globalThis.fetch = originalFetch
  }

  assert.equal(seen[0]?.userAgent, MUSE_USER_AGENT)
  assert.equal(seen[1]?.userAgent, "custom-client")
})

test("Contributor model gains a native max reasoning variant", () => {
  const models = {
    [CONTRIBUTOR_MODEL_ID]: {
      variants: {
        xhigh: { reasoningEffort: "xhigh" },
      },
    },
    "muse-spark-1.3": {
      variants: { xhigh: { reasoningEffort: "xhigh" } },
    },
  }

  const next = addContributorMaxVariant(models)

  assert.notEqual(next, models)
  assert.deepStrictEqual(next[CONTRIBUTOR_MODEL_ID].variants.max, {
    reasoningEffort: "max",
    reasoningSummary: "auto",
    include: ["reasoning.encrypted_content"],
  })
  assert.equal((models[CONTRIBUTOR_MODEL_ID].variants as Record<string, unknown>).max, undefined)
  assert.equal((next["muse-spark-1.3"].variants as Record<string, unknown>).max, undefined)
})
