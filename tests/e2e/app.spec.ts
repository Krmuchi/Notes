import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page, baseURL }) => {
  await page.goto(baseURL || 'http://localhost:5173');
  await expect(page).toHaveTitle(/学习笔记|学习/);
});
