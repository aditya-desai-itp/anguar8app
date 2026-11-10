import { Page } from '@playwright/test';

/**
 * Draws a caption bar over the app so the recorded video explains itself.
 * It is plain page decoration: it doesn't affect the app and is re-created after a reload.
 */
export async function caption(page: Page, step: string, text: string, holdMs = 1800): Promise<void> {
  await page.evaluate(
    ([stepText, bodyText]) => {
      let bar = document.getElementById('pw-caption');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'pw-caption';
        bar.setAttribute('aria-hidden', 'true');
        bar.style.cssText = [
          'position:fixed', 'left:50%', 'bottom:24px', 'transform:translateX(-50%)', 'z-index:2147483647',
          'max-width:88%', 'padding:12px 22px', 'border-radius:10px', 'pointer-events:none',
          'background:rgba(17,24,39,.92)', 'color:#fff', 'font:600 20px/1.35 Segoe UI,Arial,sans-serif',
          'box-shadow:0 6px 24px rgba(0,0,0,.35)', 'text-align:center'
        ].join(';');
        document.body.appendChild(bar);
      }
      bar.innerHTML = '';
      const small = document.createElement('div');
      small.textContent = stepText;
      small.style.cssText = 'font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#93c5fd;margin-bottom:4px';
      const main = document.createElement('div');
      main.textContent = bodyText;
      bar.appendChild(small);
      bar.appendChild(main);
    },
    [step, text]
  );
  await page.waitForTimeout(holdMs);
}

/** Full-screen title or closing card. */
export async function card(page: Page, title: string, lines: string[], holdMs = 4000): Promise<void> {
  await page.evaluate(
    ([t, ls]) => {
      document.getElementById('pw-card')?.remove();
      const el = document.createElement('div');
      el.id = 'pw-card';
      el.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:2147483647', 'display:flex', 'flex-direction:column',
        'align-items:center', 'justify-content:center', 'gap:14px', 'background:#0f172a', 'color:#fff',
        'font-family:Segoe UI,Arial,sans-serif', 'text-align:center', 'padding:40px'
      ].join(';');
      const h = document.createElement('div');
      h.textContent = t as string;
      h.style.cssText = 'font-size:38px;font-weight:700';
      el.appendChild(h);
      for (const line of ls as string[]) {
        const p = document.createElement('div');
        p.textContent = line;
        p.style.cssText = 'font-size:21px;color:#cbd5e1';
        el.appendChild(p);
      }
      document.body.appendChild(el);
    },
    [title, lines] as [string, string[]]
  );
  await page.waitForTimeout(holdMs);
  await page.evaluate(() => document.getElementById('pw-card')?.remove());
}
