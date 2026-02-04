"use client";

export const BUSINESS_CONTEXT_STORAGE_KEY = "ai_business_context";

export const readBusinessContextFromStorage = () => {
  try {
    return window.localStorage.getItem(BUSINESS_CONTEXT_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
};

export const normalizeBusinessContext = (value: string) =>
  value.trim().slice(0, 2000);

const hashText = (value: string) => {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
};

export const readBusinessContextKeyFromStorage = () => {
  const normalized = normalizeBusinessContext(readBusinessContextFromStorage());
  if (!normalized) return "ctx_default";
  return `ctx_${hashText(normalized)}`;
};

export const subscribeBusinessContextUpdates = (listener: () => void) => {
  const handler = () => listener();
  window.addEventListener("ai-business-context-updated", handler);
  return () =>
    window.removeEventListener("ai-business-context-updated", handler);
};
