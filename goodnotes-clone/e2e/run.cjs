/* End-to-end smoke test through the real UI. Usage: npm run build && npm run test:e2e
   Needs Playwright with Chromium available (require('playwright')). Exits 1 on the first failed check. */
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')
let chromium
try { ({ chromium } = require('playwright')) } catch { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')) }

const PORT = 4179, URL = `http://localhost:${PORT}`
const results = []
const check = (name, ok, info = '') => { results.push({ name, ok, info }); console.log(`${ok ? '✔' : '✘'} ${name}${info ? `  (${info})` : ''}`) }

function makePdf(file) {
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>']
  const page = (c) => [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${objs.length + 2} 0 R /Resources << /Font << /F1 7 0 R >> >> >>`, `<< /Length ${c.length} >>\nstream\n${c}\nendstream`]
  objs.push(...page('BT /F1 36 Tf 72 760 Td (Arbeitsblatt Photosynthese) Tj ET'))
  objs.push(...page('BT /F1 36 Tf 72 760 Td (Zweite Seite) Tj ET'))
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  let out = '%PDF-1.4\n'; const offs = []
  objs.forEach((s, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${s}\nendobj\n` })
  const x = out.length
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`
  fs.writeFileSync(file, out)
}

;(async () => {
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: path.join(__dirname, '..'), stdio: 'ignore', detached: true })
  for (let i = 0; i < 50; i++) { try { await fetch(URL); break } catch { await new Promise((r) => setTimeout(r, 200)) } }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gn-e2e-')); const pdf = path.join(tmp, 'blatt.pdf'); makePdf(pdf)
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, acceptDownloads: true })
  const p = await ctx.newPage()
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  try {
    await p.goto(URL)
    await p.evaluate(() => { localStorage.clear(); localStorage.setItem('gn:settings', JSON.stringify({ theme: 'light', lang: 'de', scroll: 'vertical', toolbar: 'docked' })) })
    await p.reload()
    const content = (i = 0) => p.evaluate((i) => { const k = Object.keys(localStorage).find((k) => k.startsWith('gn:nb:')); return k ? JSON.parse(localStorage.getItem(k)).pages[i]?.content : null }, i)
    const pageBox = () => p.locator('[data-page-inner]').first().boundingBox()

    // notebook
    await p.getByRole('button', { name: 'Neu', exact: true }).click(); await p.getByText('Notizbuch', { exact: true }).click(); await p.getByRole('button', { name: 'Fertig' }).click()
    await p.waitForSelector('[data-page]'); check('create notebook', true)
    let bx = await pageBox()
    // pen + undo
    await p.mouse.move(bx.x + 80, bx.y + 120); await p.mouse.down(); await p.mouse.move(bx.x + 300, bx.y + 140, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(400)
    check('pen stroke saved', (await content()).strokes.length === 1)
    await p.getByRole('button', { name: 'Rückgängig' }).click(); await p.waitForTimeout(400)
    check('undo', (await content()).strokes.length === 0)
    await p.getByRole('button', { name: 'Wiederholen' }).click(); await p.waitForTimeout(400)
    // stroke eraser
    await p.getByRole('button', { name: 'Radierer' }).first().click(); await p.getByRole('button', { name: 'Strichradierer' }).click()
    await p.mouse.move(bx.x + 190, bx.y + 90); await p.mouse.down(); await p.mouse.move(bx.x + 190, bx.y + 170, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(400)
    check('stroke eraser removes stroke', (await content()).strokes.length === 0)
    // shapes
    await p.getByRole('button', { name: 'Formen' }).first().click(); await p.keyboard.press('Escape')
    const rect = [[100, 300], [300, 302], [302, 420], [98, 418], [101, 305]]
    await p.mouse.move(bx.x + rect[0][0], bx.y + rect[0][1]); await p.mouse.down(); for (const [x, y] of rect.slice(1)) await p.mouse.move(bx.x + x, bx.y + y, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(400)
    check('shape tool recognises rectangle', (await content()).strokes.some((s) => s.shape === 'rect'))
    // text with font + box style
    await p.getByRole('button', { name: 'Text', exact: true }).first().click()
    await p.getByRole('button', { name: 'Schrift', exact: true }).click(); await p.getByText('Weitere Schriften …').click()
    await p.getByPlaceholder('Suchen').fill('Marker Felt'); await p.locator('[data-popover] button', { hasText: 'Marker Felt' }).first().click()
    await p.mouse.click(bx.x + 60, bx.y + 500); await p.keyboard.type('Hallo Goodnotes'); await p.keyboard.press('Escape'); await p.waitForTimeout(400)
    const txt = (await content()).texts[0]
    check('text box with chosen font', txt?.text === 'Hallo Goodnotes' && txt.font === 'Marker Felt', txt?.font)
    // lasso copy/paste
    await p.getByRole('button', { name: 'Lasso' }).click(); await p.keyboard.press('Escape')
    bx = await pageBox()
    await p.mouse.move(bx.x + 60, bx.y + 270); await p.mouse.down(); for (const [x, y] of [[340, 270], [340, 450], [60, 450], [60, 272]]) await p.mouse.move(bx.x + x, bx.y + y, { steps: 5 }); await p.mouse.up()
    await p.keyboard.press('Control+c'); await p.keyboard.press('Control+v'); await p.waitForTimeout(400)
    check('lasso copy + paste', (await content()).strokes.length === 2)
    // ruler
    await p.getByRole('button', { name: 'Zubehör' }).click(); await p.getByText('Lineal', { exact: true }).click(); await p.waitForTimeout(300)
    check('ruler opens', (await p.locator('[data-ruler]').count()) === 1)
    await p.getByLabel('Lineal schließen').click()
    // zoom window
    await p.getByRole('button', { name: 'Schreibwerkzeug' }).click(); await p.keyboard.press('Escape')
    await p.getByRole('button', { name: 'Zubehör' }).click(); await p.getByText('Zoom-Ansicht', { exact: true }).click(); await p.waitForTimeout(400)
    const zw = await p.locator('[data-zoomwindow] .overflow-hidden').first().boundingBox(); const n0 = (await content()).strokes.length
    await p.mouse.move(zw.x + 60, zw.y + 110); await p.mouse.down(); await p.mouse.move(zw.x + 260, zw.y + 130, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(400)
    check('zoom window writes onto page', (await content()).strokes.length === n0 + 1)
    await p.getByRole('button', { name: 'Schließen' }).last().click()
    // add page + link
    await p.getByRole('button', { name: 'Seite hinzufügen' }).click(); await p.getByText('Leer', { exact: true }).first().click(); await p.waitForTimeout(500)
    check('add page', (await p.locator('[data-page]').count()) === 2)
    // dark mode + persistence
    await p.getByRole('button', { name: 'Mehr', exact: true }).first().click(); await p.getByText('Einstellungen', { exact: true }).last().click()
    await p.getByRole('switch', { name: 'Dunkelmodus' }).click(); await p.waitForTimeout(700)
    await p.reload(); await p.waitForSelector('[data-page]')
    check('persists after reload', (await p.locator('[data-page]').count()) === 2 && (await p.evaluate(() => document.documentElement.classList.contains('dark'))))
    // PDF import + search
    await p.getByRole('button', { name: 'Dokumente' }).first().click()
    await p.getByRole('button', { name: 'Neu', exact: true }).click()
    const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.getByText('Importieren', { exact: true }).click()]); await fc.setFiles(pdf)
    await p.waitForFunction(() => document.querySelectorAll('[data-page] img').length >= 1, null, { timeout: 20000 })
    check('PDF import', (await p.locator('[data-page]').count()) === 2)
    await p.getByRole('button', { name: 'Suchen' }).click(); await p.getByPlaceholder('Suchen').fill('photosynthese'); await p.waitForTimeout(300)
    check('search finds PDF text', (await p.locator('[data-popover]', { hasText: 'Arbeitsblatt Photosynthese' }).count()) > 0)
    await p.keyboard.press('Escape')
    // export
    await p.getByRole('button', { name: 'Teilen und Exportieren' }).click(); await p.getByText('Alle exportieren').click()
    const [dl] = await Promise.all([p.waitForEvent('download'), p.getByText('PDF', { exact: true }).click()])
    check('export PDF', /\.pdf$/.test(dl.suggestedFilename()), dl.suggestedFilename())
    check('no console errors', errors.length === 0, errors.join(' | '))
  } catch (e) {
    check('run without exception', false, e.message.split('\n')[0])
  } finally {
    await b.close(); try { process.kill(-server.pid) } catch { /* ignore */ }
  }
  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
  process.exit(failed.length ? 1 : 0)
})()
