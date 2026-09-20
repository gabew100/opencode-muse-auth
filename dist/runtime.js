export const CONTRIBUTOR_MODEL_ID = "muse-spark-1.3-contributor";
export const MUSE_USER_AGENT = "muse-build/1.3.0 (non-interactive; linux-x86_64; build ac7280f2aca67769d1455a8847bb502b617d50f6)";
const MAX_VARIANT = {
    reasoningEffort: "max",
    reasoningSummary: "auto",
    include: ["reasoning.encrypted_content"],
};
function asUrl(input) {
    try {
        if (input instanceof URL)
            return input;
        if (typeof input === "string")
            return new URL(input);
        return new URL(input.url);
    }
    catch {
        return undefined;
    }
}
export function isDirectMetaModelApiUrl(input) {
    const url = asUrl(input);
    if (!url)
        return false;
    return (url.protocol === "https:" &&
        url.hostname === "api.meta.ai" &&
        url.port === "" &&
        (url.pathname === "/v1" || url.pathname.startsWith("/v1/")));
}
export function museRequestHeaders(input, init) {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    if (init?.headers) {
        new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isDirectMetaModelApiUrl(input)) {
        headers.set("User-Agent", MUSE_USER_AGENT);
    }
    return headers;
}
export async function museFetch(input, init) {
    return fetch(input, { ...init, headers: museRequestHeaders(input, init) });
}
export function addContributorMaxVariant(models) {
    const model = models[CONTRIBUTOR_MODEL_ID];
    if (!model || typeof model !== "object")
        return models;
    if (model.variants?.max)
        return models;
    return {
        ...models,
        [CONTRIBUTOR_MODEL_ID]: {
            ...model,
            variants: {
                ...(model.variants ?? {}),
                max: { ...MAX_VARIANT },
            },
        },
    };
}
