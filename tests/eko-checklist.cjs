const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = process.env.TEST_URL || 'http://127.0.0.1:8087';
    await page.goto(base + '/eko-2026/');
    assert.equal(await page.title(), 'Checklist EKO 2026 · Carry-on');
    assert.equal(await page.locator('#count-all').innerText(), '47');
    assert.equal(await page.locator('#count-done').innerText(), '6');
    assert.equal(await page.locator('#item-sat').isChecked(), false);
    assert.equal(await page.locator('#item-toalla').isChecked(), true);
    await page.locator('#item-sat').check();
    await page.locator('#add-name').fill('<img src=x onerror=alert(1)>');
    await page.locator('#add-bag').selectOption('backpack');
    await page.locator('#add-qty').fill('2');
    await page.getByRole('button', { name: '＋ Añadir' }).click();
    assert.equal(await page.locator('#count-all').innerText(), '48');
    assert.equal(await page.locator('#sections img').count(), 0);
    await page.reload();
    assert.equal(await page.locator('#item-sat').isChecked(), true);
    assert.equal(await page.locator('#count-all').innerText(), '48');
    await page.locator('[data-filter="backpack"]').click();
    assert.equal(await page.locator('#sections').getByText('2 × <img src=x onerror=alert(1)>').count(), 1);
    await page.goto(base + '/');
    await page.locator('#item-name').fill('Cable USB-C');
    await page.locator('#item-weight').fill('0.2');
    await page.locator('#item-bag').selectOption('backpack');
    await page.locator('#submit-item').click();
    await page.getByRole('link', { name: 'Checklist EKO 2026 ↗' }).click();
    assert.equal(await page.locator('#calculator-items').getByText('Cable USB-C').count(), 1);
    assert.equal(await page.locator('#count-all').innerText(), '49');
    await page.getByRole('checkbox', { name: 'Cable USB-C, Mochila, calculadora' }).check();
    assert.equal(await page.locator('#count-done').innerText(), '8');
    await page.reload();
    assert.equal(await page.getByRole('checkbox', { name: 'Cable USB-C, Mochila, calculadora' }).isChecked(), true);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(width <= 390, `Horizontal overflow: ${width}px`);
    if (process.env.SCREENSHOT_PATH) await page.screenshot({ path: process.env.SCREENSHOT_PATH, fullPage: true });
    assert.deepEqual(errors, []);
    console.log('EKO_CHECKLIST_OK');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
