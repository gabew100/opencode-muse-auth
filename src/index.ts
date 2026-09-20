// opencode-muse-auth: Muse Spark in opencode billed to the Muse Code
// monthly subscription (Meta device login, no API key, no third-party CLI).
import type { Plugin } from "@opencode-ai/plugin"
import { readCache, writeCache, deviceAuthorize, pollToken, mintKey } from "./auth.js"
import { addContributorMaxVariant, museFetch } from "./runtime.js"

export const MuseCodeAuth: Plugin = async () => {
  return {
    provider: {
      id: "meta",
      async models(provider) {
        // Only advertise Contributor `max` when this plugin has an active
        // Muse subscription key. The matching auth loader also installs the
        // Muse request fingerprint required by Meta for that effort level.
        const key = await readCache()
        if (!key) return provider.models
        return addContributorMaxVariant(provider.models)
      },
    },
    auth: {
      provider: "meta",
      methods: [
        {
          type: "oauth",
          label: "Muse Code subscription (Meta device login)",
          async authorize() {
            const device = await deviceAuthorize()
            const url = device.verification_uri_complete || device.verification_uri
            return {
              url,
              method: "auto",
              instructions: `Open ${url}\nEnter code: ${device.user_code}`,
              callback: async () => {
                try {
                  const access = await pollToken(device.device_code, device.interval, device.expires_in)
                  const minted = await mintKey(access)
                  await writeCache(minted)
                  return { type: "success", key: minted.apiKey }
                } catch {
                  return { type: "failed" }
                }
              },
            }
          },
        },
      ],
      loader: async () => {
        const key = await readCache()
        return key ? { apiKey: key, fetch: museFetch } : {}
      },
    },
  }
}
