import { expect, test, type Page } from '@playwright/test';

const SAMPLE_CSV = `city,product_line,total,rating
Yangon,Health and beauty,548.97,9.1
Naypyitaw,Electronic accessories,80.22,9.6
Yangon,Home and lifestyle,340.53,7.4
Mandalay,Sports and travel,489.05,8.4
Naypyitaw,Food and beverages,634.38,5.3
Mandalay,Fashion accessories,627.62,4.1
`;

/** Register a throwaway account and land in the playground. */
const signUp = async (page: Page): Promise<void> => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await page.goto('/auth');
  await page.getByRole('button', { name: /sign up/i }).click();
  await page.getByLabel('Full name').fill('Test User');
  await page.getByLabel('Email').fill(`e2e-${suffix}@example.com`);
  await page.getByLabel('Password', { exact: true }).fill('CorrectHorse1!');
  await page.getByLabel('Confirm password').fill('CorrectHorse1!');
  await page.getByRole('button', { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/playground/, { timeout: 20_000 });
};

/**
 * The dataset rail. Scoping to it keeps selectors unambiguous: the filename also
 * appears in the chat as a "… is ready" system message.
 */
const rail = (page: Page) => page.getByRole('complementary');

/** Upload the sample dataset and wait for its schema to load. */
const uploadSample = async (page: Page): Promise<void> => {
  await page.setInputFiles('input[type="file"]', {
    name: 'sales.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(SAMPLE_CSV),
  });

  await expect(rail(page).getByText('sales.csv', { exact: true })).toBeVisible({
    timeout: 30_000,
  });
};

test.describe('Playground', () => {
  test.beforeEach(async ({ page }) => {
    await signUp(page);
  });

  test('uploading a CSV shows its schema', async ({ page }) => {
    await uploadSample(page);

    // The CSV is converted to a single table.
    await expect(rail(page).getByText('sales')).toBeVisible();
    await expect(rail(page).getByText(/1 table · 6 rows/)).toBeVisible();

    // Expanding the table reveals its inferred columns.
    await rail(page).getByText('sales').click();
    await expect(rail(page).getByText('city', { exact: true })).toBeVisible();
    await expect(rail(page).getByText('product_line', { exact: true })).toBeVisible();
  });

  test('a table can be previewed before asking anything', async ({ page }) => {
    await uploadSample(page);

    await page.getByRole('button', { name: /preview sales/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Yangon').first()).toBeVisible();
  });

  test('the composer is disabled until a dataset exists', async ({ page }) => {
    const composer = page.getByLabel(/your question/i);
    await expect(composer).toBeDisabled();
    await expect(page.getByPlaceholder(/upload a dataset first/i)).toBeVisible();

    await uploadSample(page);
    await expect(composer).toBeEnabled();
  });

  test('a dataset can be removed', async ({ page }) => {
    await uploadSample(page);

    await page.getByRole('button', { name: /remove this dataset/i }).click();

    await expect(page.getByText(/drop a file here/i)).toBeVisible({ timeout: 10_000 });
  });

  test('a second file becomes another table in the same dataset', async ({ page }) => {
    await uploadSample(page);

    await page.setInputFiles(
      'input[aria-label="Add another file to this dataset"]',
      {
        name: 'targets.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('city,goal\nYangon,2000\nMandalay,1500\nNaypyitaw,900\n'),
      }
    );

    // Both files are now tables the agent can join across.
    await expect(rail(page).getByText(/2 tables/)).toBeVisible({ timeout: 30_000 });

    await rail(page).getByRole('button', { name: /schema/i }).click();
    await expect(rail(page).getByText('sales')).toBeVisible();
    await expect(rail(page).getByText('targets')).toBeVisible();
  });

  test('a question can join across two uploaded files', async ({ page }) => {
    await uploadSample(page);

    await page.setInputFiles(
      'input[aria-label="Add another file to this dataset"]',
      {
        name: 'targets.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('city,goal\nYangon,2000\nMandalay,1500\nNaypyitaw,900\n'),
      }
    );
    await expect(rail(page).getByText(/2 tables/)).toBeVisible({ timeout: 30_000 });

    await page
      .getByLabel(/your question/i)
      .fill('For each city, compare total revenue against its goal');
    await page.getByRole('button', { name: /^send$/i }).click();

    await expect(page.getByRole('tab', { name: /answer/i })).toBeVisible({ timeout: 120_000 });

    // The generated SQL should reference both tables, which is the whole point.
    await page.getByRole('tab', { name: /sql/i }).click();
    const sql = page.getByLabel('SQL query');
    await expect(sql).toContainText(/sales/i);
    await expect(sql).toContainText(/targets/i);
  });

  test('asking a question returns an answer and records it in history', async ({ page }) => {
    await uploadSample(page);

    await page.getByLabel(/your question/i).fill('What is the total revenue by city?');
    await page.getByRole('button', { name: /^send$/i }).click();

    // A full agent run makes several model calls, so this is generous.
    await expect(page.getByRole('tab', { name: /answer/i })).toBeVisible({ timeout: 120_000 });

    // The generated SQL is exposed for inspection.
    await page.getByRole('tab', { name: /sql/i }).click();
    await expect(page.getByLabel('SQL query')).toContainText(/select/i);

    // The exchange is saved and reopenable.
    await rail(page).getByRole('button', { name: /history/i }).click();
    await expect(rail(page).getByText(/total revenue by city/i).first()).toBeVisible();
  });

  test('the generated SQL can be edited and re-run without the model', async ({ page }) => {
    await uploadSample(page);

    await page.getByLabel(/your question/i).fill('Show me every row');
    await page.getByRole('button', { name: /^send$/i }).click();
    await expect(page.getByRole('tab', { name: /sql/i })).toBeVisible({ timeout: 120_000 });

    await page.getByRole('tab', { name: /sql/i }).click();

    const editor = page.getByLabel('SQL query');
    await editor.fill('SELECT city, total FROM sales ORDER BY total DESC LIMIT 3');
    await page.getByRole('button', { name: /run query/i }).click();

    await expect(page.getByText(/3 rows in \d+ms/i)).toBeVisible({ timeout: 20_000 });
  });

  test('a write statement is rejected by the server', async ({ page }) => {
    await uploadSample(page);

    await page.getByLabel(/your question/i).fill('Show me every row');
    await page.getByRole('button', { name: /^send$/i }).click();
    await expect(page.getByRole('tab', { name: /sql/i })).toBeVisible({ timeout: 120_000 });

    await page.getByRole('tab', { name: /sql/i }).click();
    await page.getByLabel('SQL query').fill('DROP TABLE sales');
    await page.getByRole('button', { name: /run query/i }).click();

    await expect(page.getByText(/only select and with queries are permitted/i)).toBeVisible({
      timeout: 20_000,
    });
  });
});

test.describe('Theme', () => {
  test('the dark theme applies and survives a reload', async ({ page }) => {
    await page.goto('/');

    // Below the `md` breakpoint the toggle lives inside the collapsed menu, so
    // it has to be opened first. Keeps the test valid on both viewports.
    const menuButton = page.getByRole('button', { name: /open the menu/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }

    await page.getByRole('radio', { name: /dark theme/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // next-themes persists the choice, so a reload must not reset it.
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
