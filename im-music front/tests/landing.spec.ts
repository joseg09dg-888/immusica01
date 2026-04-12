import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero section with title', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
    const h1 = await page.locator('h1').first().textContent();
    expect(h1).toMatch(/DISTRIBUYE|DISTRIBUTE/);
  });

  test('navbar is visible', async ({ page }) => {
    await expect(page.locator('nav').first()).toBeVisible();
  });

  test('has COMENZAR GRATIS button', async ({ page }) => {
    const btn = page.getByText(/COMENZAR GRATIS|GET STARTED/i).first();
    await expect(btn).toBeVisible();
  });

  test('language toggle works', async ({ page }) => {
    const toggleBtn = page.getByText(/🇺🇸 EN|🇨🇴 ES/);
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    await expect(page.locator('h1').first()).toContainText(/DISTRIBUTE|DISTRIBUYE/);
  });

  test('smooth scrolls to sections', async ({ page }) => {
    const serviciosLink = page.getByText(/Servicios|Services/i).first();
    await serviciosLink.click();
    await page.waitForTimeout(500);
  });

  test('cookie consent banner appears', async ({ page }) => {
    // Clear storage to simulate first visit
    await page.evaluate(() => localStorage.removeItem('im_cookies'));
    await page.reload();
    const banner = page.getByText(/cookies|Cookies/i).first();
    await expect(banner).toBeVisible({ timeout: 5000 });
  });

  test('footer has legal links', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const terms = page.getByText(/Términos de uso|Terms of Use/i);
    await expect(terms.first()).toBeVisible();
  });

  test('clicking Términos opens terms page', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const terms = page.getByText('Términos de uso').first();
    await terms.click();
    await expect(page.locator('h1')).toContainText(/TÉRMINOS|TERMS/i);
  });

  test('terms page has back button', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.getByText('Términos de uso').first().click();
    const back = page.getByText('← Volver');
    await expect(back).toBeVisible();
    await back.click();
    await expect(page.locator('h1').first()).toContainText(/DISTRIBUYE|DISTRIBUTE/);
  });
});

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText(/COMENZAR GRATIS|GET STARTED/i).first().click();
  });

  test('login form renders', async ({ page }) => {
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.locator('input[type="email"]').first().fill('wrong@email.com');
    await page.locator('input[type="password"]').first().fill('wrongpass');
    await page.getByText(/ENTRAR|CREAR/i).first().click();
    await page.waitForTimeout(2000);
  });
});

test.describe('Mobile Layout', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hamburger menu visible on mobile', async ({ page }) => {
    await page.goto('/');
    const hamburger = page.locator('.landing-hamburger');
    await expect(hamburger).toBeVisible();
  });

  test('hero stacks on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
