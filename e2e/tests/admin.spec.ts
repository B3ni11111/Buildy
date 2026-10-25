import { test, expect, type Page } from '@playwright/test';
import { USERS, createTestBuilding, deleteTestBuilding, signInAs, type TestBuilding } from './helpers';

/** The admin console as claudeAdminTesting (the only mock admin). */
test.describe.serial('Admin console', () => {
  let building: TestBuilding;

  test.beforeAll(async () => {
    building = await createTestBuilding('admin');
  });
  test.afterAll(async () => deleteTestBuilding(building));

  async function openConsoleOn(page: Page) {
    await signInAs(page, USERS.admin);
    await page.evaluate((id) => localStorage.setItem('buildy_admin_building', id), building.id);
    await page.goto('/');
    await page.getByRole('button', { name: 'Admin tools' }).click();
    await page.getByRole('menuitem', { name: 'Open admin console' }).click();
    await expect(page.getByRole('heading', { name: building.name })).toBeVisible();
  }

  test('reads every apartment: residents, payer, fee and method', async ({ page }) => {
    await openConsoleOn(page);
    await page.getByRole('tab', { name: 'Apartments' }).click();
    const apt1 = page.getByRole('row').filter({ hasText: 'Avi Friedman (Owner)' });
    await expect(apt1).toContainText('Lior Azulay (Tenant)');
    await expect(apt1).toContainText('₪300');
    await expect(apt1).toContainText('Credit card');
    const apt2 = page.getByRole('row').filter({ hasText: 'Shira Dahan (Owner)' });
    await expect(apt2).toContainText('₪500');
    await expect(apt2).toContainText('Cash');
  });

  test('manages payments: the budget, settings and log', async ({ page }) => {
    await openConsoleOn(page);
    await page.getByRole('tab', { name: 'Payments' }).click();
    await expect(page.getByText('Monthly budget')).toBeVisible();
    await page.getByRole('button', { name: 'Payment settings' }).click();
    const settings = page.getByRole('dialog');
    await expect(settings.getByLabel('Default monthly fee (₪)')).toHaveValue('300');
    await settings.getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Payments log' }).click();
    await expect(page.getByRole('dialog').getByText('Payments log')).toBeVisible();
  });

  test('"Open building" joins with a role and switches the app to it', async ({ page }) => {
    await openConsoleOn(page);
    await page.getByRole('button', { name: 'Open building' }).click();
    await page.getByRole('menuitem', { name: 'Join as Resident' }).click();
    await expect(page.getByText('Welcome back, claudeAdminTesting')).toBeVisible();
    await expect(page.getByRole('banner').getByRole('button', { name: building.name })).toBeVisible();
  });
});
