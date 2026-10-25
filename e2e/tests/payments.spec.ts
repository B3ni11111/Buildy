import { test, expect, type Page } from '@playwright/test';
import {
  USERS,
  api,
  apiStatus,
  createTestBuilding,
  deleteTestBuilding,
  paymentsTile,
  signInAs,
  waitForFreshPeriod,
  type TestBuilding,
} from './helpers';

/**
 * The monthly-fees flow across roles, in order (one building, one period):
 * renter sees who pays → head opens the month → owner hands payment to the renter → the renter
 * pays → the head marks the other apartment with a chosen method → the log says who/how/method →
 * privacy holds for the renter.
 */
test.describe.serial('Payments across roles', () => {
  let building: TestBuilding;

  // eslint-disable-next-line no-empty-pattern -- Playwright needs the fixtures argument to reach testInfo.
  test.beforeAll(async ({}, testInfo) => {
    // The whole flow must fit in one 5-minute dev "month": this may wait up to ~2.5 minutes.
    testInfo.setTimeout(240_000);
    await waitForFreshPeriod(150);
    building = await createTestBuilding('payments');
  });
  test.afterAll(async () => deleteTestBuilding(building));

  /** A row of the head's apartment list (each row has its own "Change fee" button; the head's own part has none). */
  const headRow = (page: Page, apartment: number) =>
    paymentsTile(page)
      .getByRole('button', { name: 'Change fee' })
      .locator('xpath=..')
      .filter({ hasText: new RegExp(`^Apt ${apartment}Pays`) });

  test('a renter sees who pays and gets no Pay button', async ({ page }) => {
    await signInAs(page, USERS.lior, building.id);
    const tile = paymentsTile(page);
    await expect(tile.getByText('Avi Friedman pays this apartment.')).toBeVisible();
    await expect(tile.getByText("Building management hasn't opened this month yet.")).toBeVisible();
    await expect(tile.getByRole('button', { name: 'Pay', exact: true })).toHaveCount(0);
  });

  test('the head opens the month: goal is each fee (own or building default)', async ({ page }) => {
    await signInAs(page, USERS.shira, building.id);
    const tile = paymentsTile(page);
    await tile.getByRole('button', { name: 'Open this month' }).click();
    // Apt 1 has no own fee -> ₪300 default; apt 2 -> ₪500.
    await expect(tile.getByText('₪0 of ₪800 collected')).toBeVisible();
    await expect(headRow(page, 1)).toContainText('Pays: Avi Friedman');
    await expect(headRow(page, 2)).toContainText('Pays: Shira Dahan');
  });

  test('an owner hands payment to the renter in the apartment center', async ({ page }) => {
    await signInAs(page, USERS.avi, building.id);
    const myApartment = page.locator('.MuiCard-root').filter({ has: page.getByRole('heading', { name: 'My apartment', exact: true }) });
    await myApartment.getByRole('button', { name: /Apt 1/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Apartment center · Apt 1');
    await dialog.getByRole('combobox', { name: 'Who pays' }).click();
    await page.getByRole('option', { name: /Lior Azulay/ }).click();
    await expect(dialog.getByRole('combobox', { name: 'Who pays' })).toContainText('Lior Azulay');
    await dialog.getByRole('button', { name: 'Close' }).click();
    // Avi is no longer the payer: no Pay button for him.
    await expect(paymentsTile(page).getByText('Lior Azulay pays this apartment.')).toBeVisible();
    await expect(paymentsTile(page).getByRole('button', { name: 'Pay', exact: true })).toHaveCount(0);
  });

  test('only the payer can pay, and it counts at once', async ({ page }) => {
    const mine = await api<{ apartments: { apartmentId: number }[] }>(USERS.avi, 'GET', `/buildings/${building.id}/payments/mine`);
    expect(await apiStatus(USERS.avi, 'POST', `/buildings/${building.id}/payments/${mine.apartments[0].apartmentId}/pay`)).toBe(403);

    await signInAs(page, USERS.lior, building.id);
    const tile = paymentsTile(page);
    await expect(tile.getByText('You pay this apartment.')).toBeVisible();
    await tile.getByRole('button', { name: 'Pay', exact: true }).click();
    await expect(tile.getByText('Paid', { exact: true }).first()).toBeVisible();
    await expect(tile.getByRole('button', { name: 'Pay', exact: true })).toHaveCount(0);
  });

  test('the head marks an apartment paid with a chosen method; the log records who, how and the method', async ({ page }) => {
    await signInAs(page, USERS.shira, building.id);
    const tile = paymentsTile(page);
    await expect(tile.getByText('₪300 of ₪800 collected')).toBeVisible();

    await headRow(page, 2).getByRole('button', { name: 'Mark paid' }).click();
    const confirm = page.getByRole('dialog');
    // Pre-selected from the apartment's own method (cash); change it for this payment.
    await expect(confirm.getByRole('combobox', { name: 'Payment method' })).toContainText('Cash');
    await confirm.getByRole('combobox', { name: 'Payment method' }).click();
    await page.getByRole('option', { name: 'Bank transfer' }).click();
    await confirm.getByRole('button', { name: 'Mark paid' }).click();
    await expect(tile.getByText('₪800 of ₪800 collected')).toBeVisible();
    await expect(tile.getByLabel('Fully collected')).toBeVisible();

    await tile.getByRole('button', { name: 'Payments log' }).click();
    const log = page.getByRole('dialog');
    const renterRow = log.getByRole('row').filter({ hasText: 'Paid by the resident' });
    await expect(renterRow).toContainText('Lior Azulay'); // paid by and confirmed by
    await expect(renterRow).toContainText('Credit card'); // apt 1 has no method -> building default
    const headRowInLog = log.getByRole('row').filter({ hasText: 'Marked by management' });
    await expect(headRowInLog).toContainText('Bank transfer');
    await expect(headRowInLog).toContainText('Shira Dahan');
  });

  test('a renter cannot read the building log or other apartments', async () => {
    const mine = await api<{ apartments: { number: number }[] }>(USERS.lior, 'GET', `/buildings/${building.id}/payments/mine`);
    expect(mine.apartments.map((a) => a.number)).toEqual([1]);
    expect(await apiStatus(USERS.lior, 'GET', `/buildings/${building.id}/manage/payments/log`)).toBe(403);
    const overview = await api<{ apartments: { apartmentId: number; number: number }[] }>(USERS.shira, 'GET', `/buildings/${building.id}/manage/payments`);
    const apt2 = overview.apartments.find((a) => a.number === 2)!;
    expect(await apiStatus(USERS.lior, 'GET', `/buildings/${building.id}/payments/${apt2.apartmentId}/log`)).toBe(403);
  });
});
