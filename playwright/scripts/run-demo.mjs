// Records the captioned demo video (headless) and copies it to demo-video/forge-inventory-demo.webm.
// Usage (in the playwright folder): npm run demo
// Needs the production build in ../dist/forge-inventory (npx ng build --prod at the repo root, Node 12).
import { execSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const list = execSync('npx playwright test --list --project=chromium', { encoding: 'utf8' });
const count = (list.match(/Total: (\d+) tests?/) || [])[1] || '';
console.log(`Full suite: ${count} tests. Recording the demo walkthrough...`);

const result = spawnSync('npx playwright test', {
  shell: true,
  stdio: 'inherit',
  // own port, so the demo always uses the production build (not an ng serve that may be running on 4200)
  env: { ...process.env, DEMO: '1', DEMO_TEST_COUNT: count, E2E_PORT: process.env.E2E_PORT || '4320' }
});

function findVideos(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? findVideos(path) : name.endsWith('.webm') ? [path] : [];
  });
}

const videos = findVideos('test-results-demo').sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
if (!videos.length) {
  console.error('No video was recorded.');
  process.exit(1);
}
mkdirSync('demo-video', { recursive: true });
const target = join('demo-video', 'forge-inventory-demo.webm');
copyFileSync(videos[0], target);
console.log(`\nDemo video: ${join(process.cwd(), target)}`);
console.log(result.status === 0 ? 'All demo checks passed.' : 'The demo run FAILED; the video shows where.');
process.exit(result.status ?? 1);
