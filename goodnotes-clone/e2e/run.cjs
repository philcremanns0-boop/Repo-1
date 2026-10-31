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
const check = (name, ok, info = '') => { results.push({ name, ok, info }); console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${info ? `  (${info})` : ''}`) }

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
    // migration: a notebook left in localStorage by an older build must open from IndexedDB
    await p.evaluate(async () => {
      localStorage.clear()
      await Promise.all(['gn-data', 'gn-blobs'].map((n) => new Promise((r) => { const q = indexedDB.deleteDatabase(n); q.onsuccess = q.onerror = q.onblocked = r })))
      localStorage.setItem('gn:settings', JSON.stringify({ theme: 'light', lang: 'de', scroll: 'vertical', toolbar: 'docked' }))
      localStorage.setItem('gn:nb:old', JSON.stringify({ v: 2, id: 'old', title: 'Alt', currentId: 'p1', outline: [], pages: [{ id: 'p1', size: 'a4p', template: 'wide', color: 'white', bookmarked: false, content: { strokes: [{ id: 1, tool: 'pen', color: '#000', width: 2, points: [{ x: 10, y: 10, w: 1 }, { x: 90, y: 10, w: 1 }] }], texts: [], images: [] } }] }))
      localStorage.setItem('gn:library', JSON.stringify({ notebooks: [{ id: 'old', title: 'Alt', cover: 'hell', coverColor: '#02BDE4', created: 1, updated: 1, pages: 1 }], folders: [], tabs: [], view: 'home' }))
    })
    await p.reload()
    const nbData = (title) => p.evaluate((title) => new Promise((res) => {
      const r = indexedDB.open('gn-data')
      r.onsuccess = () => {
        const st = r.result.transaction('kv', 'readonly').objectStore('kv'), q = st.getAll()
        q.onsuccess = () => { const all = q.result.map((x) => JSON.parse(x)).filter((d) => d && Array.isArray(d.pages)); res(title ? all.find((d) => d.title === title) : all.find((d) => d.id !== 'old') ?? null) }
      }
    }), title)
    await p.getByRole('button', { name: 'Alt', exact: true }).click(); await p.waitForSelector('[data-page]'); await p.waitForTimeout(300)
    check('localStorage notebook migrated to IndexedDB', (await nbData('Alt'))?.pages[0].content.strokes.length === 1 && !(await p.evaluate(() => localStorage.getItem('gn:nb:old'))))
    await p.getByRole('button', { name: 'Dokumente' }).first().click()
    const content = async (i = 0) => (await nbData())?.pages[i]?.content ?? null
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
    // handwriting from Eigenhand: clipboard HTML with vector ink -> real, erasable pen strokes
    const ink = { v: 1, src: 'eigenhand', unit: 'pt', text: 'Test', strokes: [0, 1, 2, 3, 4].map((i) => ({ p: [i * 30, 0, i * 30 + 2, 15, i * 30, 30], w: 1.2, c: '#1a2973' })) }
    await p.evaluate((ink) => {
      const dt = new DataTransfer()
      dt.setData('text/html', `<meta charset="utf-8"><div data-gn-ink="${btoa(JSON.stringify(ink))}">Test</div>`); dt.setData('text/plain', 'Test')
      window.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }))
    }, ink)
    await p.waitForTimeout(400)
    let pasted = (await content()).strokes
    check('Eigenhand ink pastes as pen strokes', pasted.length === 5 && pasted.every((x) => x.tool === 'pen' && x.color === '#1a2973'), String(pasted.length))
    await p.getByRole('button', { name: 'Radierer' }).first().click(); await p.getByRole('button', { name: 'Strichradierer' }).click()
    {
      const k = bx.width / 794, sx = pasted[0].points[0].x, sy = pasted[0].points[0].y
      await p.mouse.move(bx.x + (sx - 15) * k, bx.y + (sy + 20) * k); await p.mouse.down(); await p.mouse.move(bx.x + (sx + 12) * k, bx.y + (sy + 20) * k, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(400)
    }
    check('pasted handwriting can be erased with the eraser', (await content()).strokes.length === 4)
    await p.keyboard.press('Escape')
    for (let i = 0; i < 2; i++) { await p.getByRole('button', { name: 'Rückgängig' }).click(); await p.waitForTimeout(600) }
    check('undo removes the paste', (await content()).strokes.length === 0, String((await content()).strokes.length))
    // shapes
    await p.getByRole('button', { name: 'Formen' }).first().click(); await p.keyboard.press('Escape')
    const rect = [[100, 300], [300, 302], [302, 420], [98, 418], [101, 305]]
    await p.mouse.move(bx.x + rect[0][0], bx.y + rect[0][1]); await p.mouse.down(); for (const [x, y] of rect.slice(1)) await p.mouse.move(bx.x + x, bx.y + y, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(400)
    check('shape tool recognises rectangle', (await content()).strokes.some((s) => s.shape === 'rect'))
    // text with font + box style
    await p.getByRole('button', { name: 'Text', exact: true }).first().click()
    await p.getByRole('button', { name: 'Schrift', exact: true }).click(); await p.getByText('Weitere Schriften …').click()
    await p.getByPlaceholder('Suchen').fill('Marker Felt'); await p.locator('[data-popover] button', { hasText: 'Marker Felt' }).first().click()
    await p.mouse.click(bx.x + 60, bx.y + 500); await p.keyboard.type('Hallo Goodnotes'); await p.keyboard.press('Escape'); await p.waitForTimeout(900)
    const txt = (await content()).texts[0]
    if (!txt && process.env.DEBUG) { await p.screenshot({ path: '/tmp/claude-0/-home-user-Repo-1/9b4f1dfd-632e-5bde-9bdf-4596152885d8/scratchpad/txtfail.png' }); console.log('DOM texts', await p.locator('[data-text-id]').count(), 'tool', await p.evaluate(() => [...document.querySelectorAll('[aria-pressed=true]')].map((e) => e.getAttribute('aria-label')).join('|'))) }
    check('text box with chosen font', txt?.text === 'Hallo Goodnotes' && txt.font === 'Marker Felt', txt?.font)
    // lasso copy/paste
    await p.getByRole('button', { name: 'Lasso' }).click(); await p.keyboard.press('Escape')
    bx = await pageBox()
    await p.mouse.move(bx.x + 60, bx.y + 270); await p.mouse.down(); for (const [x, y] of [[340, 270], [340, 450], [60, 450], [60, 272]]) await p.mouse.move(bx.x + x, bx.y + y, { steps: 5 }); await p.mouse.up()
    await p.keyboard.press('Control+c'); await p.keyboard.press('Control+v'); await p.waitForTimeout(400)
    check('lasso copy + paste', (await content()).strokes.length === 2)
    // save selection as own object and re-insert it
    await p.getByRole('button', { name: 'Als Objekt sichern' }).click(); await p.waitForTimeout(400)
    await p.getByRole('button', { name: 'Objekte' }).first().click(); await p.getByRole('button', { name: 'Meine Objekte' }).click()
    await p.locator('[data-popover] button[aria-label="object"]').first().click(); await p.waitForTimeout(400)
    check('own object saved + inserted', (await content()).images.length === 1)
    await p.getByRole('button', { name: 'Zuschneiden', exact: true }).click()
    const hr = await p.getByLabel('Zuschneiden r').boundingBox()
    await p.mouse.move(hr.x + hr.width / 2, hr.y + hr.height / 2); await p.mouse.down(); await p.mouse.move(hr.x - 30, hr.y + hr.height / 2, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(500)
    const im = (await content()).images[0]
    check('image crop', !!im.crop && im.crop.w < 1 && im.crop.w > 0.05, JSON.stringify(im.crop))
    await p.getByRole('button', { name: 'Fertig', exact: true }).click()
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
    // add colour swatch
    await p.getByRole('button', { name: 'Schreibwerkzeug' }).click(); await p.keyboard.press('Escape')
    const nColors = await p.evaluate(() => JSON.parse(localStorage.getItem('gn:tools')).colors.length)
    await p.getByLabel('Farbe hinzufügen').click(); await p.waitForTimeout(300); await p.keyboard.press('Escape')
    check('add colour swatch', (await p.evaluate(() => JSON.parse(localStorage.getItem('gn:tools')).colors.length)) === nColors + 1)
    // template on all pages
    await p.getByRole('button', { name: 'Mehr', exact: true }).first().click(); await p.getByText('Vorlage wechseln').click(); await p.waitForTimeout(300)
    await p.getByRole('button', { name: 'Kariert', exact: true }).click(); await p.getByRole('switch', { name: 'Auf alle Seiten anwenden' }).click(); await p.getByRole('button', { name: 'Fertig' }).click(); await p.waitForTimeout(500)
    check('template applied to all pages', (await nbData()).pages.every((x) => x.template === 'grid'))
    // outline add + rename
    await p.getByRole('button', { name: 'Mehr', exact: true }).first().click(); await p.getByText('Seite zur Gliederung hinzufügen').click()
    await p.getByRole('button', { name: 'Seitenleiste' }).first().click(); await p.getByRole('button', { name: 'Gliederungen' }).click()
    await p.getByRole('button', { name: 'Umbenennen', exact: true }).first().click(); await p.keyboard.press('Control+a'); await p.keyboard.type('Kapitel 1'); await p.keyboard.press('Enter'); await p.waitForTimeout(400)
        check('outline rename', (await nbData()).outline[0]?.title === 'Kapitel 1')
    await p.locator('aside').getByRole('button', { name: 'Schließen' }).click()
    await p.getByRole('button', { name: 'Mehr', exact: true }).first().click(); await p.getByText('Einstellungen', { exact: true }).last().click()
    await p.getByRole('switch', { name: 'Dunkelmodus' }).click(); await p.waitForTimeout(700)
    await p.reload(); await p.waitForSelector('[data-page]')
    check('persists after reload', (await p.locator('[data-page]').count()) === 2 && (await p.evaluate(() => document.documentElement.classList.contains('dark'))))
    // page copy → paste, and add-page tile at the end
    await p.getByRole('button', { name: 'Mehr', exact: true }).first().click(); await p.getByText('Seite kopieren', { exact: true }).click()
    await p.getByRole('button', { name: 'Seite hinzufügen' }).click(); await p.getByText('Kopierte Seite einfügen').click(); await p.waitForTimeout(500)
    check('page copy + paste', (await p.locator('[data-page]').count()) === 3)
    await p.getByLabel('Seite am Ende hinzufügen').click(); await p.waitForTimeout(500)
    check('add page at end tile', (await p.locator('[data-page]').count()) === 4)
    // flashcards: switch the current page to the flashcard template, study it
    await p.getByRole('button', { name: 'Mehr', exact: true }).first().click(); await p.getByText('Vorlage wechseln').click(); await p.waitForTimeout(300)
    await p.getByRole('button', { name: 'Lernkarte', exact: true }).click(); await p.getByRole('button', { name: 'Fertig' }).click(); await p.waitForTimeout(400)
    await p.getByRole('button', { name: 'Mehr', exact: true }).first().click(); await p.getByText('Lernkarten lernen').click(); await p.waitForTimeout(500)
    await p.getByRole('button', { name: 'Antwort zeigen' }).last().click(); await p.getByRole('button', { name: 'Gut', exact: true }).click(); await p.waitForTimeout(500)
    check('flashcard study + scheduling', (await p.getByText('Alle fälligen Karten gelernt!').count()) === 1 && (await nbData()).pages.some((x) => x.card && x.card.reps === 1))
    await p.locator('[data-popover]').getByRole('button', { name: 'Fertig' }).click(); await p.waitForTimeout(300)
    // library: duplicate + search
    await p.getByRole('button', { name: 'Dokumente' }).first().click(); await p.waitForTimeout(300)
    await p.getByRole('button', { name: 'Menü' }).first().click(); await p.getByText('Duplizieren', { exact: true }).click(); await p.waitForTimeout(300)
    check('duplicate notebook', (await p.evaluate(() => JSON.parse(localStorage.getItem('gn:library')).notebooks.length)) === 3)
    await p.getByLabel('Notizbücher suchen').fill('kopie'); await p.waitForTimeout(200)
    check('library search filters', (await p.locator('main button[aria-label$="Kopie"], main button[aria-label$="kopie"]').count()) === 1)
    await p.getByLabel('Notizbücher suchen').fill('')
    // PDF import + search
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
    check('run without exception', false, e.message.split('\n').slice(0, 3).join(' '))
    if (process.env.DEBUG) await p.screenshot({ path: '/tmp/claude-0/-home-user-Repo-1/9b4f1dfd-632e-5bde-9bdf-4596152885d8/scratchpad/fail.png' })
  } finally {
    await b.close(); try { process.kill(-server.pid) } catch { /* ignore */ }
  }
  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
  process.exit(failed.length ? 1 : 0)
})()
