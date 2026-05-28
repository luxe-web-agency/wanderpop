import type { LocalDate } from '../types';

const padDatePart = (value: number) => value.toString().padStart(2, '0');

export function formatLocalDate(date: Date): LocalDate {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());

  return `${year}-${month}-${day}` as LocalDate;
}

export function getTodayLocalDate(): LocalDate {
  return formatLocalDate(new Date());
}
