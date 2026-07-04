import { test, expect } from '@playwright/test';

test('landing page loads and shows brand', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Dual-Rhythm Architecture/);
  await expect(page.locator('body')).toContainText('Dual-Rhythm Architecture');
});

test('sign-in page renders without error', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page).toHaveURL(/sign-in/);
});

test('/api/chat returns 401 without auth', async ({ request }) => {
  const res = await request.post('/api/chat', { data: { messages: [] } });
  expect(res.status()).toBe(401);
});

test('/api/benchmark returns data', async ({ request }) => {
  const res = await request.get('/api/benchmark');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.benchmarks).toBeDefined();
  expect(Array.isArray(body.benchmarks)).toBeTruthy();
  expect(body.disclaimer).toBeDefined();
});

test('/api/cron/quarterly returns 401 without secret', async ({ request }) => {
  const res = await request.get('/api/cron/quarterly');
  expect(res.status()).toBe(401);
});
