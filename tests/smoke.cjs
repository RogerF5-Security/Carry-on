/* Run against a local server. Playwright is a development-only dependency. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:8087');
    const text = id => page.locator('#' + id).innerText();
    const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('carry-on.v1')));
    async function add(name, amount, quantity = 1, bag = 'suitcase') {
      await page.locator('#item-name').fill(name);
      await page.locator('#item-weight').fill(String(amount));
      await page.locator('#item-quantity').fill(String(quantity));
      await page.locator('#item-bag').selectOption(bag);
      await page.locator('#submit-item').click();
    }
    for (const [bag, tare] of [['suitcase', '4'], ['backpack', '1']]) {
      await page.locator(`[data-bag="${bag}"] summary`).click();
      await page.locator(`#${bag}-tare`).fill(tare);
      await page.locator(`#${bag}-tare`).press('Tab');
    }
    await add('Pantalón azul de lona', 1.5, 2);
    assert.equal(await text('suitcase-weight'), '7');
    assert.equal(await text('suitcase-percent'), '35%');
    await add('Nintendo y cargador', 1.2, 1, 'backpack');
    assert.equal(await text('backpack-weight'), '2,2');
    const before = await saved();
    for (let i = 0; i < 3; i++) {
      await page.locator('[data-unit="kg"]').click();
      assert.equal(await text('suitcase-weight'), '3,18');
      await page.locator('[data-unit="lb"]').click();
    }
    assert.deepEqual((await saved()).bags, before.bags);
    assert.deepEqual((await saved()).items, before.items);
    await page.reload();
    assert.equal(await text('suitcase-weight'), '7');
    assert.equal(await text('backpack-weight'), '2,2');
    await page.getByRole('button', { name: 'Editar Pantalón azul de lona', exact: true }).click();
    await page.locator('#item-quantity').fill('1');
    await page.locator('#submit-item').click();
    assert.equal(await text('suitcase-weight'), '5,5');
    await page.getByLabel('Equipaje de Pantalón azul de lona', { exact: true }).selectOption('backpack');
    assert.equal(await text('suitcase-weight'), '4');
    assert.equal(await text('backpack-weight'), '3,7');
    await add('Carga de prueba', 10, 1, 'backpack');
    assert.equal(await text('backpack-percent'), '137%');
    assert.match(await text('backpack-remaining'), /3,7 lb/);
    assert.equal(await page.locator('[data-bag="backpack"]').evaluate(e => e.classList.contains('over')), true);
    await page.getByRole('button', { name: 'Eliminar Carga de prueba', exact: true }).click();
    await page.locator('#confirm-no').click();
    assert.equal((await saved()).items.length, 3);
    await page.getByRole('button', { name: 'Eliminar Carga de prueba', exact: true }).click();
    await page.locator('#confirm-yes').click();
    assert.equal((await saved()).items.length, 2);
    await add('<img src=x onerror=alert(1)>', .2);
    assert.equal(await page.locator('#items img').count(), 0);
    await page.locator('#item-name').fill('   ');
    await page.locator('#item-weight').fill('1');
    await page.locator('#submit-item').click();
    assert.equal((await saved()).items.length, 3);
    await page.locator('#item-name').fill('Borrador');
    await page.locator('[data-unit="kg"]').click();
    assert.ok(Math.abs(Number(await page.locator('#item-weight').inputValue()) - .453592) < .000001);
    await page.locator('[data-unit="lb"]').click();
    const backup = await saved();
    await page.locator('#import-file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":1}') });
    assert.deepEqual(await saved(), backup);
    assert.equal(await page.locator('#confirm-dialog').evaluate(e => e.open), false);
    await page.locator('#reset').click();
    await page.locator('#confirm-yes').click();
    assert.equal((await saved()).items.length, 0);
    assert.deepEqual((await saved()).bags, backup.bags);
    await page.locator('#import-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
    await page.locator('#confirm-yes').click();
    assert.deepEqual(await saved(), backup);
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export').click();
    const download = await downloadPromise;
    const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.deepEqual(exported, backup);
    // Put representative generic articles on the screenshots, not personal data.
    await page.getByRole('button', { name: 'Eliminar <img src=x onerror=alert(1)>', exact: true }).click();
    await page.locator('#confirm-yes').click();
    await add('Camisetas', .4, 3);
    await add('Zapatos cómodos', 1.6);
    await add('Chaqueta ligera', .8);
    await add('Neceser', .7, 1, 'backpack');
    await page.locator('#item-name').fill('');
    for (const el of await page.locator('.bag details[open] summary').all()) await el.click();
    await page.locator('#title').click();
    await page.waitForTimeout(600); // Let the weight-fill transition finish for the visual check.
    fs.mkdirSync(path.join(__dirname, '../test-results'), { recursive: true });
    await page.screenshot({ path: path.join(__dirname, '../test-results/desktop.png'), fullPage: true });
    for (const width of [390, 360]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow at ${width}px`);
      assert.equal(await page.evaluate(() => document.querySelector('.side').getBoundingClientRect().top < document.querySelector('.list-panel').getBoundingClientRect().top), true, 'Mobile entry form must precede the growing inventory');
      await page.screenshot({ path: path.join(__dirname, `../test-results/mobile-${width}.png`), fullPage: true });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Overflow at 200% text');
    // Corrupt local storage must not be silently overwritten.
    await page.evaluate(() => localStorage.setItem('carry-on.v1', 'BROKEN'));
    await page.reload();
    assert.match(await text('storage-warning'), /No pudimos cargar/);
    await add('Artículo sin persistencia', 1);
    assert.equal(await page.evaluate(() => localStorage.getItem('carry-on.v1')), 'BROKEN');
    // Blocked browser storage remains usable, with an explicit warning.
    const isolated = await browser.newContext();
    await isolated.addInitScript(() => {
      Storage.prototype.setItem = function () { throw new DOMException('Quota exceeded', 'QuotaExceededError'); };
    });
    const blocked = await isolated.newPage();
    await blocked.goto(process.env.TEST_URL || 'http://127.0.0.1:8087');
    await blocked.locator('[data-unit="kg"]').click();
    assert.match(await blocked.locator('#storage-warning').innerText(), /no permite guardar/);
    await isolated.close();
    assert.deepEqual(errors, []);
    console.log('PASS: calculations, quantities, conversion, reload, edit, move, excess, deletion confirmation, XSS, validation, draft conversion, backup round-trip, mobile 360/390, 200% text, corrupt/blocked storage.');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
