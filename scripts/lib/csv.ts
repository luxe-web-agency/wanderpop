import { readFile } from 'node:fs/promises';

import Papa from 'papaparse';

export type CsvFile<T extends Record<string, string>> = {
  path: string;
  fields: string[];
  rows: T[];
};

export async function readCsv<T extends Record<string, string>>(
  filePath: string,
): Promise<CsvFile<T>> {
  const content = await readFile(filePath, 'utf8');

  const parsed = Papa.parse<T>(content, {
    header: true,
    skipEmptyLines: 'greedy',
    transform: (value) => value.trim(),
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    const errors = parsed.errors
      .map((error) => `row ${error.row ?? 'unknown'}: ${error.message}`)
      .join('\n');

    throw new Error(`Failed to parse ${filePath}\n${errors}`);
  }

  return {
    path: filePath,
    fields: parsed.meta.fields ?? [],
    rows: parsed.data,
  };
}
