import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('page loads with cit-ui element', async ({ page }) => {
    await page.goto('/');
    let citUi = page.locator('cit-ui');
    await expect(citUi).toBeAttached();
  });

  test('page contains script module', async ({ page }) => {
    await page.goto('/');
    let script = page.locator('script[type="module"]').first();
    await expect(script).toBeAttached();
  });

  test('toolbar panels render', async ({ page }) => {
    await page.goto('/');
    // Wait for shadow DOM / custom elements to register
    await page.waitForTimeout(500);
    // Check that the page has rendered content
    let body = await page.content();
    expect(body).toContain('cit-ui');
  });

  test('footer is visible', async ({ page }) => {
    await page.goto('/');
    let footer = page.locator('[footer]');
    await expect(footer).toBeAttached();
  });

  test('empty state loads without errors', async ({ page }) => {
    let errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForTimeout(1000);
    // No JS errors should occur
    expect(errors).toEqual([]);
  });

  test('collection profiles can be filtered by project metadata', async ({ page }) => {
    await page.goto('/');
    await page.locator('img[title="Select Collection Profile"]').click();

    let popup = page.locator('cit-collection-profiles[active]');
    await expect(popup).toBeAttached();
    await expect(popup.locator('[project-filter] input')).toBeVisible();
    await expect(popup.getByText('Local Projects')).toBeVisible();
    await expect(popup.getByText('GitHub Pages')).toBeVisible();
    await expect(popup.getByText('Included Project')).toBeVisible();
    await expect(popup.locator('span[read-only]:visible')).toHaveText('Read-only include');

    await popup.locator('[project-filter] input').fill('pages');

    let visibleItems = popup.locator('cit-collection-item:not([hidden])');
    await expect(visibleItems).toHaveCount(1);
    await expect(visibleItems.first()).toContainText('Included Test Collection');
    await expect(visibleItems.first().locator('button[title="Save Changes"]')).toBeDisabled();
    await expect(visibleItems.first().locator('button[title="Activate Profile"]')).toBeEnabled();
  });
});
