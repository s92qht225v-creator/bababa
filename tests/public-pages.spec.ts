import { test, expect } from '@playwright/test'

test.describe('Public Pages - UZ', () => {
  test('home page loads with correct content', async ({ page }) => {
    await page.goto('/uz')
    await expect(page).toHaveTitle(/百邦/)
    await expect(page.locator('h1')).toContainText('xitoy kompaniyalarida')
    // Stats section
    await expect(page.getByText('Faol ish o\'rinlari', { exact: true })).toBeVisible()
    // Search form
    await expect(page.locator('input[name="q"]')).toBeVisible()
    await expect(page.locator('select[name="city"]')).toBeVisible()
    await expect(page.getByText('Qidirish')).toBeVisible()
  })

  test('home page CTA buttons work', async ({ page }) => {
    await page.goto('/uz')
    const findJobBtn = page.getByRole('link', { name: /Ish topish/ })
    await expect(findJobBtn).toBeVisible()
    const postJobBtn = page.getByRole('link', { name: /Ish e'loni berish/ })
    await expect(postJobBtn).toBeVisible()
  })

  test('jobs listing page loads', async ({ page }) => {
    await page.goto('/uz/jobs')
    await expect(page.getByRole('heading', { name: /Barcha ish o'rinlari/ })).toBeVisible()
    // Category filter
    await expect(page.getByRole('heading', { name: 'Kasb toifasi' })).toBeVisible()
    // Region filter
    await expect(page.getByRole('heading', { name: 'Viloyat' })).toBeVisible()
    // At least one job card should exist
    await expect(page.locator('article, [class*="job"], a[href*="/jobs/"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('job detail page loads', async ({ page }) => {
    await page.goto('/uz/jobs')
    // Click first job link
    const jobLink = page.locator('a[href*="/uz/jobs/"][href*="-"]').first()
    await jobLink.click()
    await page.waitForURL(/\/uz\/jobs\//)
    // Job detail elements
    await expect(page.getByRole('heading', { name: /Talablar/ })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Ish tavsifi')).toBeVisible()
  })

  test('workers listing page loads', async ({ page }) => {
    await page.goto('/uz/workers')
    await expect(page.getByRole('heading', { name: /Barcha ishchilar/ })).toBeVisible()
    // Worker cards should exist
    await expect(page.locator('a[href*="/workers/"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('worker detail page loads', async ({ page }) => {
    await page.goto('/uz/workers')
    const workerLink = page.locator('a[href*="/uz/workers/"][href*="-"]').first()
    await workerLink.click()
    await page.waitForURL(/\/uz\/workers\//)
    await expect(page.getByText('Kasbiy ma\'lumotlar')).toBeVisible({ timeout: 10000 })
  })

  test('companies listing page loads', async ({ page }) => {
    await page.goto('/uz/companies')
    await expect(page.getByRole('heading', { name: 'Kompaniyalar' })).toBeVisible()
    await expect(page.locator('a[href*="/companies/"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('company detail page loads', async ({ page }) => {
    await page.goto('/uz/companies')
    const companyLink = page.locator('a[href*="/uz/companies/"][href*="-"]').first()
    await companyLink.click()
    await page.waitForURL(/\/uz\/companies\//)
    await expect(page.getByText('Kompaniya haqida')).toBeVisible({ timeout: 10000 })
  })

  test('about page loads', async ({ page }) => {
    await page.goto('/uz/about')
    await expect(page.getByRole('heading', { name: /haqida/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Ishchilar uchun' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Ish beruvchilar uchun' })).toBeVisible()
  })

  test('how it works page loads', async ({ page }) => {
    await page.goto('/uz/how-it-works')
    await expect(page.getByRole('heading', { name: 'Qanday ishlaydi' })).toBeVisible()
  })
})

test.describe('Public Pages - ZH', () => {
  test('home page loads in Chinese', async ({ page }) => {
    await page.goto('/zh')
    await expect(page.getByText('在乌兹别克斯坦的中国企业找工作')).toBeVisible()
    await expect(page.getByText('活跃职位', { exact: true })).toBeVisible()
  })

  test('jobs page loads in Chinese', async ({ page }) => {
    await page.goto('/zh/jobs')
    await expect(page.getByRole('heading', { name: /所有职位/ })).toBeVisible()
  })
})

test.describe('Public Pages - RU', () => {
  test('home page loads in Russian', async ({ page }) => {
    await page.goto('/ru')
    await expect(page.getByText('Найдите работу в китайских компаниях')).toBeVisible()
    await expect(page.getByText('Активных вакансий', { exact: true })).toBeVisible()
  })

  test('jobs page loads in Russian', async ({ page }) => {
    await page.goto('/ru/jobs')
    await expect(page.getByRole('heading', { name: /Все вакансии/ })).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('header links work', async ({ page }) => {
    await page.goto('/uz')
    await page.getByRole('navigation').getByRole('link', { name: 'Ish o\'rinlari' }).click()
    await expect(page).toHaveURL(/\/uz\/jobs/)

    await page.getByRole('navigation').getByRole('link', { name: 'Ishchilar' }).click()
    await expect(page).toHaveURL(/\/uz\/workers/)

    await page.getByRole('navigation').getByRole('link', { name: 'Kompaniyalar' }).click()
    await expect(page).toHaveURL(/\/uz\/companies/)
  })

  test('language switcher works', async ({ page }) => {
    await page.goto('/uz')
    await page.getByRole('link', { name: 'ZH' }).first().click()
    await expect(page).toHaveURL(/\/zh/)
    await expect(page).toHaveURL(/\/zh/)

    await page.getByRole('link', { name: 'RU' }).first().click()
    await expect(page).toHaveURL(/\/ru/)
  })

  test('footer links work', async ({ page }) => {
    await page.goto('/uz')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.locator('footer').getByText('info@baibang.uz')).toBeVisible()
  })
})

test.describe('Search & Filters', () => {
  test('home page search navigates to jobs', async ({ page }) => {
    await page.goto('/uz')
    await page.locator('input[name="q"]').fill('tarjimon')
    await page.getByText('Qidirish').click()
    await expect(page).toHaveURL(/\/uz\/jobs\?q=tarjimon/)
  })

  test('jobs page category filter works', async ({ page }) => {
    await page.goto('/uz/jobs')
    await page.locator('aside').getByRole('link', { name: 'Qurilish' }).click()
    await expect(page).toHaveURL(/category=/)
  })

  test('jobs page HSK filter works', async ({ page }) => {
    await page.goto('/uz/jobs')
    await page.locator('aside').getByRole('link', { name: 'HSK 3' }).click()
    await expect(page).toHaveURL(/hsk=/)
  })
})
