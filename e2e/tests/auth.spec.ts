import { expect, test } from '@playwright/test';

/** A unique account per run, so tests never collide on the unique email index. */
const newAccount = () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    fullname: 'Test User',
    email: `e2e-${suffix}@example.com`,
    password: 'CorrectHorse1!',
  };
};

test.describe('Authentication', () => {
  test('a visitor can sign up and lands in the playground', async ({ page }) => {
    const account = newAccount();

    await page.goto('/auth');
    await page.getByRole('button', { name: /sign up/i }).click();

    await page.getByLabel('Full name').fill(account.fullname);
    await page.getByLabel('Email').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill(account.password);
    await page.getByLabel('Confirm password').fill(account.password);
    await page.getByRole('button', { name: /create account/i }).click();

    // ProtectedRoute sends an authenticated user to the playground.
    await expect(page).toHaveURL(/\/playground/, { timeout: 20_000 });
    await expect(page.getByText(/drop a file here/i)).toBeVisible();
  });

  test('an existing account can sign in and out', async ({ page }) => {
    const account = newAccount();

    await page.goto('/auth');
    await page.getByRole('button', { name: /sign up/i }).click();
    await page.getByLabel('Full name').fill(account.fullname);
    await page.getByLabel('Email').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill(account.password);
    await page.getByLabel('Confirm password').fill(account.password);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/playground/, { timeout: 20_000 });

    await page.getByRole('button', { name: /account menu/i }).click();
    await page.getByRole('menuitem', { name: /sign out/i }).click();

    await expect(page).toHaveURL('/', { timeout: 10_000 });

    // Signing back in with the same credentials must work.
    await page.goto('/auth');
    await page.getByLabel('Email').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await expect(page).toHaveURL(/\/playground/, { timeout: 20_000 });
  });

  test('bad credentials are rejected without navigating away', async ({ page }) => {
    await page.goto('/auth');

    await page.getByLabel('Email').fill('nobody@example.com');
    await page.getByLabel('Password', { exact: true }).fill('WrongPassword1!');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/auth/);
  });

  test('a weak password is caught before the request is sent', async ({ page }) => {
    await page.goto('/auth');
    await page.getByRole('button', { name: /sign up/i }).click();

    await page.getByLabel('Full name').fill('Test User');
    await page.getByLabel('Email').fill('weak@example.com');
    await page.getByLabel('Password', { exact: true }).fill('short');
    await page.getByLabel('Confirm password').fill('short');
    await page.getByRole('button', { name: /create account/i }).click();

    // Scoped to the toast: the form also shows static helper text mentioning the
    // same requirement, which would make a bare text match ambiguous.
    await expect(
      page.getByText('Password must be at least 8 characters', { exact: true })
    ).toBeVisible();
  });

  test('the playground is not reachable while signed out', async ({ page }) => {
    await page.goto('/playground');
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
  });
});
