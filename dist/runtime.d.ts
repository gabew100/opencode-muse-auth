export declare const CONTRIBUTOR_MODEL_ID = "muse-spark-1.3-contributor";
export declare const MUSE_USER_AGENT = "muse-build/1.3.0 (non-interactive; linux-x86_64; build ac7280f2aca67769d1455a8847bb502b617d50f6)";
export declare function isDirectMetaModelApiUrl(input: RequestInfo | URL): boolean;
export declare function museRequestHeaders(input: RequestInfo | URL, init?: RequestInit): Headers;
export declare function museFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
export declare function addContributorMaxVariant<T extends Record<string, any>>(models: T): T;
