import { test, expect } from '@playwright/test';

test('home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /edit the page\.tsx file/i }),
  ).toBeVisible();
});
