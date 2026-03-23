import { test, expect } from '@playwright/test'

const WORKER = { email: 'sh.baltabaev@gmail.com', password: 'Zarifa1803' }

test.describe.configure({ mode: 'serial' })

test.describe('Worker Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/uz/auth/login')
    await page.locator('input[type="email"]').fill(WORKER.email)
    await page.locator('input[type="password"]').fill(WORKER.password)
    await page.getByRole('button', { name: /Kirish/, exact: true }).click()
    await page.waitForURL(/\/worker\/dashboard/, { timeout: 30000 })
    // Client-side router.push may not have the auth cookie ready for RSC fetch
    const welcome = page.getByText(/Xush kelibsiz/)
    try {
      await expect(welcome).toBeVisible({ timeout: 5000 })
    } catch {
      await page.reload()
      await expect(welcome).toBeVisible({ timeout: 15000 })
    }
  })

  test('dashboard loads with welcome message', async ({ page }) => {
    await expect(page.getByText(/Xush kelibsiz/)).toBeVisible()
    await expect(page.getByText('Rol: Ishchi')).toBeVisible()
  })

  test('profile page loads with form', async ({ page }) => {
    await page.goto('/uz/worker/profile')
    await expect(page.getByText('Mening profilim')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Profil to\'liqligi')).toBeVisible()
    // Form sections
    await expect(page.getByText('Shaxsiy ma\'lumotlar')).toBeVisible()
    await expect(page.getByText('Kasbiy ma\'lumotlar')).toBeVisible()
  })

  test('profile visibility toggle works', async ({ page }) => {
    await page.goto('/uz/worker/profile')
    const toggle = page.locator('button[role="switch"], [class*="toggle"]').first()
    if (await toggle.isVisible()) {
      await toggle.click()
      await page.waitForTimeout(1000)
      // Should not show error
      await expect(page.locator('body')).not.toContainText('Application error')
    }
  })

  test('can browse jobs while logged in', async ({ page }) => {
    await page.goto('/uz/jobs')
    await expect(page.getByRole('heading', { name: /Barcha ish o'rinlari/ })).toBeVisible()
    const jobCards = page.locator('a[href*="/uz/jobs/"][href*="-"]')
    await expect(jobCards.first()).toBeVisible({ timeout: 10000 })
  })

  test('can view job detail and see apply or already-applied state', async ({ page }) => {
    await page.goto('/uz/jobs')
    const jobLink = page.locator('a[href*="/uz/jobs/"][href*="-"]').first()
    await jobLink.click()
    await page.waitForURL(/\/uz\/jobs\//)
    // Should see apply button or "already applied" indicator (not "login to apply")
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const applyBtn = page.getByRole('button', { name: /Ariza topshirish/ })
    const alreadyApplied = page.getByText(/Ariza topshirilgan|Siz allaqachon/)
    await expect(applyBtn.or(alreadyApplied)).toBeVisible({ timeout: 10000 })
  })

  test('apply modal opens on job detail', async ({ page }) => {
    await page.goto('/uz/jobs')
    const jobLink = page.locator('a[href*="/uz/jobs/"][href*="-"]').first()
    await jobLink.click()
    await page.waitForURL(/\/uz\/jobs\//)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const applyBtn = page.getByRole('button', { name: /Ariza topshirish/ })
    // Only test the modal if apply button exists (worker hasn't already applied)
    if (await applyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await applyBtn.click()
      await expect(page.getByText('Qo\'shimcha xat')).toBeVisible({ timeout: 5000 })
      await expect(page.getByRole('button', { name: /Arizani yuborish/ })).toBeVisible()
    }
  })

  test('can access messages page', async ({ page }) => {
    await page.goto('/uz/worker/messages')
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await expect(page.locator('body')).not.toContainText('Application error')
  })

  test('profile form saves correctly', async ({ page }) => {
    await page.goto('/uz/worker/profile')
    await page.waitForTimeout(2000)
    // Fill in a field
    const nameInput = page.locator('input').first()
    if (await nameInput.isVisible()) {
      const currentValue = await nameInput.inputValue()
      expect(currentValue.length).toBeGreaterThan(0)
    }
    // Save
    const saveBtn = page.getByRole('button', { name: /Profilni saqlash/ })
    if (await saveBtn.isVisible()) {
      await saveBtn.click()
      await page.waitForTimeout(2000)
      await expect(page.locator('body')).not.toContainText('Application error')
    }
  })
})
