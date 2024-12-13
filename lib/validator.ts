import { DATE_REGEX, SIMPLE_OBJECT_ID_REGEX } from "./constants";
import { getBaseUrl } from "./utils";

let debugTimeout: number | null = null;

let lastValidatedPlatformId: string | undefined;
let lastValidatedOrganizationTaxId: string | undefined;

export async function validateConfig(
  config?: Partial<SimpleConfig>,
): Promise<string[] | null> {
  if (typeof config !== "object" || config === null) {
    return null;
  }

  const errors: string[] = [];

  if (config.platformId && !SIMPLE_OBJECT_ID_REGEX.test(config.platformId)) {
    errors.push("Invalid platformId!");
  }

  if (!config.organizationTaxId) {
    errors.push("Invalid organizationTaxId!");
  }

  if (!config.amount || isNaN(Number(config.amount))) {
    errors.push("Invalid amount!");
  }

  if (config.schedule) {
    if (!config.schedule.intervalType || !config.schedule.intervalCount) {
      errors.push(
        "Invalid schedule!, Expected intervalType and intervalCount!",
      );
    }

    if (
      !["day", "week", "month", "year"].includes(config.schedule.intervalType)
    ) {
      errors.push(
        "Invalid schedule!, Expected 'intervalType' to be one of: 'day', 'week', 'month', 'year'",
      );
    }

    if (config.schedule.intervalCount < 1) {
      errors.push(
        "Invalid schedule!, Expected 'intervalCount' to be greater than 0!",
      );
    }

    if (
      config.schedule.startDate &&
      !DATE_REGEX.test(config.schedule.startDate)
    ) {
      errors.push(
        "Invalid schedule!, Expected 'startDate' to be a valid date!",
      );
    }

    if (config.schedule.endDate && !DATE_REGEX.test(config.schedule.endDate)) {
      errors.push("Invalid schedule!, Expected 'endDate' to be a valid date!");
    }

    if (
      config.schedule.totalPayments &&
      isNaN(Number(config.schedule.totalPayments))
    ) {
      errors.push(
        "Invalid schedule!, Expected 'totalPayments' to be a number!",
      );
    }

    if (config.schedule.endDate && config.schedule.totalPayments) {
      errors.push(
        "Invalid schedule!, 'endDate' and 'totalPayments' cannot be set together!",
      );
    }
  }

  // validate platformId and organizationTaxId from backend
  if (
    !errors.length &&
    (config.platformId !== lastValidatedPlatformId ||
      config.organizationTaxId !== lastValidatedOrganizationTaxId)
  ) {
    const response = await fetch(
      `${getBaseUrl()}/api/popup/verify-ids?platformId=${config.platformId}&organizationTaxId=${config.organizationTaxId}`,
    );
    const data = await response.json();
    if (!response.ok || data?.error) {
      errors.push(
        data?.error || "Failed to validate platformId and organizationTaxId!",
      );
    }
    lastValidatedPlatformId = config.platformId;
    lastValidatedOrganizationTaxId = config.organizationTaxId;
  }

  if (debugTimeout) {
    clearTimeout(debugTimeout);
  }
  if (errors.length > 0) {
    debugTimeout = window.setTimeout(() => {
      console.debug("Simple config validation errors:", errors);
    }, 500);
  }

  return errors;
}
