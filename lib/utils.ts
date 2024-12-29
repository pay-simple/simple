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

export function createRenewableAbortController(): AbortController & {
  renew: () => void;
} {
  let abortController = new AbortController();
  const renew = () => {
    abortController.abort();
    abortController = new AbortController();
  };
  return { ...abortController, renew };
}

export const parseErrorMessage = (error: unknown, defaultMessage?: string) => {
  let message = "";

  if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === "object" && "message" in error) {
    message = String(error.message);
  } else if (typeof error === "string") {
    message = error;
  } else {
    message = defaultMessage ?? "An unknown error occurred";
  }

  return message;
};
