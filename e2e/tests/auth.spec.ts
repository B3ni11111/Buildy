import { test, expect } from '@playwright/test';
import { USERS } from './helpers';

test.describe('Dev sign-in', () => {
  test('lists the mock users and signs in as one, then signs out', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');

    await expect(page.getByText('Dev: sign in as…')).toBeVisible();
    // claudeAdminTesting is the only mock admin.
    const adminRow = page.getByTestId(`dev-user-${USERS.admin.sub}`);
    await expect(adminRow).toContainText('Admin');
    await expect(page.getByTestId(`dev-user-${USERS.noa.sub}`)).not.toContainText('Admin');

    // Noa belongs to buildings, so she lands on the home screen with the top bar.
    await page.getByTestId(`dev-user-${USERS.noa.sub}`).click();
    await expect(page.getByText('Welcome back, Noa')).toBeVisible();

    // Sign out from the avatar menu returns to the landing page (no Cognito logout for a dev session).
    await page.getByRole('banner').getByRole('button', { name: 'NL' }).click();
    await page.getByRole('menuitem', { name: /sign out/i }).click();
    await expect(page.getByText('Dev: sign in as…')).toBeVisible();
  });
});
