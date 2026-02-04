const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: string | undefined, fallback: boolean) => {
  if (value == null) return fallback;
  return ["1", "true", "yes"].includes(value.toLowerCase());
};

export const AI_CONFIG = {
  apiUrl:
    process.env.AISHOP24H_API_URL ??
    "https://aishop24h.com/v1/chat/completions",
  apiKeyDefault: process.env.AISHOP24H_API_KEY ?? "",
  apiKeyInsight: process.env.AISHOP24H_API_KEY_INSIGHT ?? "",
  apiKeyReco: process.env.AISHOP24H_API_KEY_RECO ?? "",
  modelInsight: process.env.AISHOP24H_MODEL_INSIGHT ?? "",
  modelReco: process.env.AISHOP24H_MODEL_RECO ?? "",
  timeoutMs: toNumber(process.env.AI_TIMEOUT_MS, 8000),
  cacheTtlMs: toNumber(process.env.AI_CACHE_TTL_MS, 300000),
  cacheRemoteEnabled: toBoolean(process.env.AI_CACHE_REMOTE_ENABLED, true),
  cacheRemoteTimeoutMs: toNumber(process.env.AI_CACHE_REMOTE_TIMEOUT_MS, 700),
  cacheRestUrl:
    process.env.AI_CACHE_REST_URL ??
    process.env.KV_REST_API_URL ??
    process.env.UPSTASH_REDIS_REST_URL ??
    "",
  cacheRestToken:
    process.env.AI_CACHE_REST_TOKEN ??
    process.env.KV_REST_API_TOKEN ??
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    "",
  locale: process.env.APP_LOCALE ?? "th-TH",
  useResponseFormat: toBoolean(process.env.AI_USE_RESPONSE_FORMAT, false),
};
