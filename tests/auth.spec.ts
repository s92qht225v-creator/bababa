import { test, expect } from '@playwright/test'

const EMPLOYER = { email: 'monadotmoda@gmail.com', password: 'Zarifa1803' }
const WORKER = { email: 'sh.baltabaev@gmail.com', password: 'Zarifa1803' }

async function login(page, user, dashboardPattern) {
  await page.goto('/uz/auth/login')
  await page.locator('input[type="email"]').fill(user.email)
  await page.locator('input[type="password"]').fill(user.password)
  await page.getByRole('button', { name: /Kirish/, exact: true }).click()
  await page.waitForURL(dashboardPattern, { timeout: 30000 })
  // Client-side router.push may not have the auth cookie ready for the RSC fetch.
  // If the welcome text isn't visible, reload to force a full server render.
  const welcome = page.getByText(/Xush kelibsiz/)
  try {
    await expect(welcome).toBeVisible({ timeout: 5000 })
  } catch {
    await page.reload()
    await expect(welcome).toBeVisible({ timeout: 15000 })
  }
}

test.describe.configure({ mode: 'serial' })

test.describe('Authentication', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/uz/auth/login')
    await expect(page.getByRole('heading', { name: 'Kirish' })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('register page loads', async ({ page }) => {
    await page.goto('/uz/auth/register')
    await expect(page.getByRole('heading', { name: /Hisob yaratish/ })).toBeVisible()
  })

  test('shows error on wrong password', async ({ page }) => {
    await page.goto('/uz/auth/login')
    await page.locator('input[type="email"]').fill('monadotmoda@gmail.com')
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.getByRole('button', { name: /Kirish/, exact: true }).click()
    // Should show error message
    await expect(page.getByText(/xato|noto'g'ri|Invalid/i)).toBeVisible({ timeout: 10000 })
  })

  test('employer login redirects to employer dashboard', async ({ page }) => {
    await login(page, EMPLOYER, /\/employer\/dashboard/)
    await expect(page).toHaveURL(/\/uz\/employer\/dashboard/)
  })

  test('worker login redirects to worker dashboard', async ({ page }) => {
    await login(page, WORKER, /\/worker\/dashboard/)
    await expect(page).toHaveURL(/\/uz\/worker\/dashboard/)
  })

  test('logout works', async ({ page }) => {
    await login(page, EMPLOYER, /\/employer\/dashboard/)
    // Logout
    await page.getByRole('button', { name: /Chiqish/ }).click()
    await page.waitForURL(/\/uz/, { timeout: 10000 })
  })

  test('protected route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/uz/worker/dashboard')
    await expect(page).toHaveURL(/\/uz\/auth\/login/)
  })

  test('employer cannot access worker routes', async ({ page }) => {
    await login(page, EMPLOYER, /\/employer\/dashboard/)
    // Try to access worker route
    await page.goto('/uz/worker/dashboard')
    await expect(page).toHaveURL(/\/employer\/dashboard/)
  })
})
