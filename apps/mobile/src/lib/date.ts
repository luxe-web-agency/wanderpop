import { getTodayLocalDate, type LocalDateContext } from '@wanderpop/shared';

export function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function getCurrentLocalDateContext(): LocalDateContext {
  return {
    local_date: getTodayLocalDate(),
    timezone: getLocalTimezone(),
  };
}
