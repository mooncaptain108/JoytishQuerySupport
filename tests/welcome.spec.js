const { test, expect } = require('@playwright/test');

// Mock Open.md for all tests in this file so the fetch never fails
test.beforeEach(async ({ page }) => {
  await page.route('**/static/Open.md**', route =>
    route.fulfill({ body: '# Jyotish Query\n\nWelcome to the app.' })
  );
});

test('shows on first visit when localStorage is empty', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('jyotish_hide_welcome'));
  await page.goto('/');
  await expect(page.locator('#dlgWelcome')).toBeVisible();
});

test('dialog content loads from Open.md', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('jyotish_hide_welcome'));
  await page.goto('/');
  await expect(page.locator('#welcomeContent h1')).toHaveText('Jyotish Query');
});

test('does not show on reload after checking hide checkbox', async ({ page }) => {
  // Guard so addInitScript only clears on first load, not on the test-triggered reload
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('_test_first_load_done')) {
      localStorage.removeItem('jyotish_hide_welcome');
      sessionStorage.setItem('_test_first_load_done', '1');
    }
  });
  await page.goto('/');
  await expect(page.locator('#dlgWelcome')).toBeVisible();

  await page.locator('#chkHideWelcome').check();
  await page.locator('#dlgWelcome button:has-text("Close")').click();
  await expect(page.locator('#dlgWelcome')).not.toBeVisible();

  await page.reload();
  await expect(page.locator('#dlgWelcome')).not.toBeVisible();
});

test('does not show on first visit when hide flag is already set', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jyotish_hide_welcome', '1'));
  await page.goto('/');
  await expect(page.locator('#dlgWelcome')).not.toBeVisible();
});

test('reopens from Settings panel', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jyotish_hide_welcome', '1'));
  await page.goto('/');
  await expect(page.locator('#dlgWelcome')).not.toBeVisible();

  await page.locator('#gearBtn').click();
  await expect(page.locator('#settingsPanel')).toBeVisible();
  await page.locator('#settingsPanel button:has-text("Welcome")').click();

  await expect(page.locator('#dlgWelcome')).toBeVisible();
});
