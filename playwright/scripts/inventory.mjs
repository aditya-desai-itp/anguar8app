// Writes docs/TEST-INVENTORY.md: how many Playwright tests there are, broken down by file, area tag and role,
// followed by every test. The numbers come straight from `playwright test --list`, so they are always current.
// Usage (in the playwright folder): npm run inventory
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const report = JSON.parse(
  execSync('npx playwright test --list --reporter=json --project=chromium', {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore']
  })
);

const tests = [];
function walk(suite, path) {
  const here = suite.title ? [...path, suite.title] : path;
  for (const spec of suite.specs || []) {
    tests.push({
      file: spec.file.replace(/\\/g, '/'),
      path: here.filter(t => !t.endsWith('.spec.ts')),
      title: spec.title,
      tags: [...new Set(spec.tags || [])].map(t => (t.startsWith('@') ? t : '@' + t)),
      expectedFailure: (spec.tests || []).some(
        t => t.expectedStatus === 'failed' || (t.annotations || []).some(a => a.type === 'fail' || a.type === 'known bug')
      )
    });
  }
  for (const child of suite.suites || []) walk(child, here);
}
for (const suite of report.suites) walk(suite, []);

function roleOf(t) {
  const text = [...t.path, t.title].join(' › ');
  if (/signed out|signing in|sessionStorage is blocked/i.test(text)) return 'Signed out';
  if (/viewer/i.test(t.path.join(' '))) return 'Viewer';
  return 'Manager';
}

const count = (items, key) =>
  [...items.reduce((m, i) => m.set(key(i), (m.get(key(i)) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1]);
const table = (head, rows) =>
  [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');

const byTag = count(tests.flatMap(t => t.tags.map(tag => ({ tag }))), x => x.tag);
const known = tests.filter(t => t.expectedFailure);
const lines = [
  '# Playwright test inventory',
  '',
  `Generated ${new Date().toISOString().slice(0, 10)} by \`npm run inventory\` from \`playwright test --list\`.`,
  '',
  `**Total: ${tests.length} tests** in ${new Set(tests.map(t => t.file)).size} spec files` +
    ` (Chromium; ${tests.filter(t => t.tags.includes('@smoke')).length} tagged \`@smoke\`;` +
    ` ${known.length} marked as a known app bug).`,
  '',
  '## By spec file',
  '',
  table(['Spec file', 'Tests'], count(tests, t => t.file).map(([k, v]) => ['`' + k + '`', v])),
  '',
  '## By area tag',
  '',
  table(['Tag', 'Tests'], byTag.map(([k, v]) => ['`' + k + '`', v])),
  '',
  '## By who is signed in',
  '',
  table(['Role', 'Tests'], count(tests, roleOf)),
  ''
];
if (known.length) {
  lines.push('## Known app bugs (expected failures)', '');
  for (const t of known) lines.push(`- \`${t.file}\` › ${[...t.path, t.title].join(' › ')}`);
  lines.push('');
}
lines.push('## Every test', '');
for (const [file] of count(tests, t => t.file).sort((a, b) => a[0].localeCompare(b[0]))) {
  lines.push(`### ${file}`, '');
  tests
    .filter(t => t.file === file)
    .forEach((t, i) =>
      lines.push(
        `${i + 1}. ${[...t.path, t.title].join(' › ')}` +
          (t.tags.length ? ' ' + t.tags.map(x => '`' + x + '`').join(' ') : '') +
          (t.expectedFailure ? ' **(known bug)**' : '')
      )
    );
  lines.push('');
}

mkdirSync('docs', { recursive: true });
writeFileSync('docs/TEST-INVENTORY.md', lines.join('\n'));
console.log(`docs/TEST-INVENTORY.md: ${tests.length} tests`);
for (const [k, v] of count(tests, t => t.file)) console.log(`  ${String(v).padStart(3)}  ${k}`);
