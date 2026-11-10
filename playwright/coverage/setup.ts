import MCR from 'monocart-coverage-reports';

import { coverageOptions } from './options';

/** Clears coverage left over from an earlier run (each test worker adds its own results to the cache). */
export default async function globalSetup(): Promise<void> {
  MCR(coverageOptions).cleanCache();
}
