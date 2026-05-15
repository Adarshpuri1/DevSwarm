// tests/e2e/devswarm.spec.js
// Run with: npx playwright test
const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const TEST_USER = {
  name: 'E2E Tester',
  email: `e2e_${Date.now()}@devswarm.ai`,
  password: 'E2ETest123!'
};

test.describe('DevSwarm E2E', () => {
  test('shows auth page for unauthenticated users', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.getByText('Sign In to DevSwarm')).toBeVisible();
  });

  test('can register a new account', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByText('Create Account').click();

    await page.getByPlaceholder('Your name').fill(TEST_USER.name);
    await page.getByPlaceholder('you@example.com').fill(TEST_USER.email);
    await page.getByPlaceholder('Min. 8 characters').fill(TEST_USER.password);

    await page.getByRole('button', { name: /Join DevSwarm/i }).click();

    // Should redirect to main app
    await expect(page.getByText('DevSwarm')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Agent Roster')).toBeVisible();
  });

  test('shows 4 agents in the panel', async ({ page }) => {
    await page.goto(BASE_URL);
    // Login
    await page.getByPlaceholder('you@example.com').fill(TEST_USER.email);
    await page.getByPlaceholder('Min. 8 characters').fill(TEST_USER.password);
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page.getByText('Aria')).toBeVisible();
    await expect(page.getByText('Nexus')).toBeVisible();
    await expect(page.getByText('Vera')).toBeVisible();
    await expect(page.getByText('Orion')).toBeVisible();
  });

  test('example prompts appear on empty state', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByPlaceholder('you@example.com').fill(TEST_USER.email);
    await page.getByPlaceholder('Min. 8 characters').fill(TEST_USER.password);
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page.getByText('What should the team build?')).toBeVisible();
    await expect(page.getByText(/authentication system/i)).toBeVisible();
  });

  test('clicking example fills input', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByPlaceholder('you@example.com').fill(TEST_USER.email);
    await page.getByPlaceholder('Min. 8 characters').fill(TEST_USER.password);
    await page.getByRole('button', { name: /Sign In/i }).click();

    await page.getByText(/authentication system/i).first().click();
    const textarea = page.getByPlaceholder(/Describe a feature/i);
    await expect(textarea).not.toBeEmpty();
  });

  test('can sign out', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByPlaceholder('you@example.com').fill(TEST_USER.email);
    await page.getByPlaceholder('Min. 8 characters').fill(TEST_USER.password);
    await page.getByRole('button', { name: /Sign In/i }).click();

    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page.getByText('Sign In to DevSwarm')).toBeVisible();
  });
});
