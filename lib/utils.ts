export function omitKeys<T extends object>(obj: T, keys: (keyof T)[]) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key as keyof T)),
  );
}

export function removeEmptyValues<T extends object>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== "" && v !== undefined),
  );
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function getBaseUrl() {
  return isProduction() ? "https://simple.arnbr.com" : "http://localhost:8000";
}
