import type { CoverageReportOptions } from 'monocart-coverage-reports';

/**
 * Code coverage of the Angular app while the Playwright tests run (E2E_COVERAGE=1).
 * Chromium's built-in V8 coverage records which JavaScript ran; the build's source maps map it back to
 * the TypeScript files in src/app. Only the app's own code is reported (no Angular, ag-Grid or other libraries).
 */
export const coverageOptions: CoverageReportOptions = {
  name: 'Forge Inventory · Playwright E2E code coverage',
  outputDir: './coverage-report',
  reports: [
    ['v8', { outputFile: 'index.html' }],
    ['console-details', { maxCols: 120 }],
    ['json-summary', { file: 'coverage-summary.json' }],
    ['lcovonly', { file: 'lcov.info' }]
  ],
  // the app's own bundles only: main + the lazy-loaded feature chunks (not vendor, polyfills, runtime, sql.js)
  entryFilter: entry =>
    entry.url.startsWith('http://localhost') &&
    entry.url.endsWith('.js') &&
    !/\/(vendor|polyfills|polyfills-es5|runtime|styles|scripts)\.js$/.test(entry.url),
  sourceFilter: sourcePath => /src\/app\//.test(sourcePath) && !sourcePath.endsWith('.spec.ts'),
  // webpack:///./src/app/core/db.service.ts -> src/app/core/db.service.ts
  sourcePath: filePath => {
    const i = filePath.indexOf('src/app/');
    return i >= 0 ? filePath.slice(i) : filePath;
  }
};
