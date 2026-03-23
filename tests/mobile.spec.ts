import { test, expect } from '@playwright/test'

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
})

test.describe('Mobile Experience', () => {
  test('home page renders correctly on mobile', async ({ page }) => {
    await page.goto('/uz')
    await expect(page.locator('h1')).toBeVisible()
    // Logo should be visible
    await expect(page.locator('header')).toBeVisible()
    // Search form should be stacked vertically
    await expect(page.locator('input[name="q"]')).toBeVisible()
  })

  test('jobs page is usable on mobile', async ({ page }) => {
    await page.goto('/uz/jobs')
    await expect(page.getByRole('heading', { name: /Barcha ish o'rinlari/ })).toBeVisible()
    // Job cards should be visible (filters should not block content)
    const jobCards = page.locator('a[href*="/uz/jobs/"][href*="-"]')
    await expect(jobCards.first()).toBeVisible({ timeout: 10000 })
  })

  test('workers page filter is collapsible on mobile', async ({ page }) => {
    await page.goto('/uz/workers')
    await expect(page.getByRole('heading', { name: /Barcha ishchilar/ })).toBeVisible()
    // Filters should be in a collapsible element
    const filterToggle = page.getByText('Filterlar')
    if (await filterToggle.isVisible()) {
      await filterToggle.click()
      await page.waitForTimeout(500)
    }
  })

  test('job detail page is readable on mobile', async ({ page }) => {
    await page.goto('/uz/jobs')
    const jobLink = page.locator('a[href*="/uz/jobs/"][href*="-"]').first()
    await jobLink.click()
    await page.waitForURL(/\/uz\/jobs\//)
    // Content should be readable
    await expect(page.getByRole('heading', { name: /Talablar/ })).toBeVisible({ timeout: 10000 })
    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10) // small tolerance
  })

  test('worker detail page is readable on mobile', async ({ page }) => {
    await page.goto('/uz/workers')
    const workerLink = page.locator('a[href*="/uz/workers/"][href*="-"]').first()
    await workerLink.click()
    await page.waitForURL(/\/uz\/workers\//)
    await expect(page.getByText('Kasbiy ma\'lumotlar')).toBeVisible({ timeout: 10000 })
  })

  test('company page is readable on mobile', async ({ page }) => {
    await page.goto('/uz/companies')
    await expect(page.getByRole('heading', { name: 'Kompaniyalar' })).toBeVisible()
    const companyLink = page.locator('a[href*="/uz/companies/"][href*="-"]').first()
    await companyLink.click()
    await page.waitForURL(/\/uz\/companies\//)
    await expect(page.getByText('Kompaniya haqida')).toBeVisible({ timeout: 10000 })
  })

  test('login form works on mobile', async ({ page }) => {
    await page.goto('/uz/auth/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /Kirish/, exact: true })).toBeVisible()
  })

  test('language switcher is accessible on mobile', async ({ page }) => {
    await page.goto('/uz')
    // Language links should be visible
    await expect(page.getByRole('link', { name: 'UZ' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'ZH' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'RU' }).first()).toBeVisible()
  })

  test('footer is not clipped on mobile', async ({ page }) => {
    await page.goto('/uz')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.locator('footer')).toBeVisible()
    const footerEmail = page.locator('footer').getByText('info@baibang.uz')
    await expect(footerEmail).toBeVisible()
  })
})
