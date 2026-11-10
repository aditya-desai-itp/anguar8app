import MCR from 'monocart-coverage-reports';

import { coverageOptions } from './options';

/** Merges the coverage from every test and writes coverage-report/index.html plus a console summary. */
export default async function globalTeardown(): Promise<void> {
  await MCR(coverageOptions).generate();
}
