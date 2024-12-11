import { SIMPLE_OBJECT_ID_REGEX, DATE_REGEX } from "./constants";

export function validateConfig(config: SimpleConfig): string | null {
  if (config.platformId && !SIMPLE_OBJECT_ID_REGEX.test(config.platformId)) {
    return "Invalid platformId!";
  }

  if (
    config.organizationId &&
    !SIMPLE_OBJECT_ID_REGEX.test(config.organizationId)
  ) {
    return "Invalid organizationId!";
  }

  if (config.amount && isNaN(Number(config.amount))) {
    return "Invalid amount!";
  }

  if (config.schedule) {
    if (!config.schedule.intervalType || !config.schedule.intervalCount) {
      return "Invalid schedule!, Expected intervalType and intervalCount!";
    }

    if (
      !["day", "week", "month", "year"].includes(config.schedule.intervalType)
    ) {
      return "Invalid schedule!, Expected 'intervalType' to be one of: 'day', 'week', 'month', 'year'";
    }

    if (config.schedule.intervalCount < 1) {
      return "Invalid schedule!, Expected 'intervalCount' to be greater than 0!";
    }

    if (
      config.schedule.startDate &&
      !DATE_REGEX.test(config.schedule.startDate)
    ) {
      return "Invalid schedule!, Expected 'startDate' to be a valid date!";
    }

    if (config.schedule.endDate && !DATE_REGEX.test(config.schedule.endDate)) {
      return "Invalid schedule!, Expected 'endDate' to be a valid date!";
    }
  }

  return null; // No errors
}
