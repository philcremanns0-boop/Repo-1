/* Eigenhand -> Notizen-App: Handschrift als echte Stiftstriche kopieren.
 * Legt zwei Formate in die Zwischenablage:
 *   text/plain  der reine Text (fuer alle anderen Apps)
 *   text/html   <div data-gn-ink="BASE64(JSON)">Text</div>
 * Die Notizen-App liest das JSON und fuegt die Schrift als Striche ein,
 * die sich radieren, umfaerben und mit dem Lasso verschieben lassen. */
(function () {
  'use strict'
  var p = window.__eh
  if (!p || !window.EH) return
  var DEF_INK = [0.1, 0.16, 0.45]

  function hex(rgb) {
    if (!rgb || rgb.length < 3) rgb = DEF_INK
    return '#' + rgb.slice(0, 3).map(function (v) {
      var n = Math.max(0, Math.min(255, Math.round(v <= 1 ? v * 255 : v)))
      return (n < 16 ? '0' : '') + n.toString(16)
    }).join('')
  }
  function r1(v) { return Math.round(v * 10) / 10 }
  function r2(v) { return Math.round(v * 100) / 100 }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }
  function b64(str) {
    var bytes = new TextEncoder().encode(str), bin = ''
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
    return btoa(bin)
  }
  function view() { var v = p.pageView && p.pageView(); return v && v.res ? v : null }
  function pageOf(v) { return v.res.pages[p.state.pageIdx] || v.res.pages[0] }

  /** Baut die Nutzlast fuer die Bausteine `blocks` (null = ganze Seite). */
  function payload(v, blocks) {
    var pg = pageOf(v)
    var ops = blocks ? pg.ops.filter(function (s) { return blocks.indexOf(s.b) >= 0 }) : pg.ops
    ops = ops.filter(function (s) { return s.pts && s.pts.length })
    if (!ops.length) return null
    var mx = 1e9, my = 1e9
    ops.forEach(function (s) { s.pts.forEach(function (q) { if (q[0] < mx) mx = q[0]; if (q[1] < my) my = q[1] }) })
    var ink = (v.o && v.o.ink) || DEF_INK
    var seen = {}, ids = []
    ops.forEach(function (s) { if (!seen[s.b]) { seen[s.b] = 1; ids.push(s.b) } })
    var text = ids.map(function (b) { return (v.res.paras && v.res.paras[b]) || '' }).filter(Boolean).join('\n\n')
    return {
      v: 1, src: 'eigenhand', unit: 'pt', text: text,
      strokes: ops.map(function (s) {
        var flat = []
        s.pts.forEach(function (q) { flat.push(r2(q[0] - mx), r2(q[1] - my)) })
        if (flat.length === 2) flat.push(flat[0] + 0.05, flat[1])
        return { p: flat, w: r1(s.w || 1), c: hex(s.c || ink) }
      })
    }
  }

  function legacyCopy(html, text) {
    var ok = false
    function on(e) { e.clipboardData.setData('text/html', html); e.clipboardData.setData('text/plain', text); e.preventDefault(); ok = true }
    document.addEventListener('copy', on)
    try { document.execCommand('copy') } catch (e) { /* ignore */ }
    document.removeEventListener('copy', on)
    return ok
  }

  /** Kopiert; ruft msg(text) mit einer Rueckmeldung auf.
   * text/plain traegt die Striche als "EIGENHAND-INK1:<base64>" (Safari filtert eigene
   * HTML-Attribute beim Einfuegen auf einer anderen Seite heraus, reinen Text nie). */
  function copyInk(blocks, msg) {
    var v = view()
    var data = v && payload(v, blocks)
    if (!data) { msg('Auf dieser Seite gibt es noch keine Schrift.'); return }
    var enc = b64(JSON.stringify(data))
    var text = 'EIGENHAND-INK1:' + enc
    var html = '<meta charset="utf-8"><div data-gn-ink="' + enc + '">' + esc(data.text || '').replace(/\n/g, '<br>') + '</div>'
    var done = 'Kopiert (' + data.strokes.length + (data.strokes.length === 1 ? ' Strich' : ' Striche') + '). Jetzt in der Notizen-App lange auf die Seite tippen und \u201eEinf\u00fcgen\u201c w\u00e4hlen. Die Schrift ist dort radierbar.'
    var fail = 'Kopieren wurde vom Browser blockiert. Bitte noch einmal tippen.'
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        navigator.clipboard.write([new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' })
        })]).then(function () { msg(done) }, function () {
          if (navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { msg(done) }, function () { msg(legacyCopy(html, text) ? done : fail) })
          else msg(legacyCopy(html, text) ? done : fail)
        })
        return
      }
    } catch (e) { /* fall through */ }
    msg(legacyCopy(html, text) ? done : fail)
  }

  /* Export-Blatt: "Kopieren" kopiert jetzt radierbare Striche fuer die Notizen-App,
   * das bisherige Bild-Kopieren heisst "Als Bild". */
  function enhance(body) {
    if (body.querySelector('[data-gn-copy]')) return
    var rows = body.querySelectorAll('.exp-row')
    if (!rows.length) return
    var v = view(); if (!v) return
    var pg = pageOf(v), seen = {}, ids = []
    pg.ops.forEach(function (s) { if (!seen[s.b]) { seen[s.b] = 1; ids.push(s.b) } })
    Array.prototype.forEach.call(body.children, function (el) { if (!el.classList.contains('exp-list')) el.style.display = 'none' })
    var info = document.createElement('div')
    info.className = 'exp-info'
    info.innerHTML = '<b>Kopieren</b> legt die Handschrift als echte Stiftstriche in die Zwischenablage. In der Notizen-App lange auf die Seite tippen und \u201eEinf\u00fcgen\u201c w\u00e4hlen: Die Schrift l\u00e4sst sich dort radieren, umf\u00e4rben und mit dem Lasso verschieben. <b>Als Bild</b> kopiert ein festes Bild f\u00fcr andere Apps.'
    body.insertBefore(info, body.firstChild)
    var head = document.querySelector('#exSheet .sch-h b')
    if (head) head.textContent = 'In die Notizen-App kopieren'
    var out = document.getElementById('exMsg')
    Array.prototype.forEach.call(rows, function (row, i) {
      var blocks = i === 0 ? null : (ids[i - 1] != null ? [ids[i - 1]] : undefined)
      if (blocks === undefined) return
      var old = row.querySelectorAll('button')
      if (old[0]) { old[0].textContent = 'Als Bild'; old[0].className = 'btn' }
      var b = document.createElement('button')
      b.type = 'button'; b.className = 'btn pri'; b.textContent = 'Kopieren'
      b.setAttribute('data-gn-copy', i === 0 ? 'page' : String(i - 1))
      b.addEventListener('click', function () { copyInk(blocks, function (t) { if (out && t) out.textContent = t }) })
      row.insertBefore(b, old[0] || null)
    })
  }

  /* Gut sichtbarer Einstieg neben dem bisherigen Export-Knopf im Text-Reiter. */
  function addEntry() {
    var more = document.getElementById('exMore')
    if (!more || document.getElementById('gnCopyEntry')) return
    var b = document.createElement('button')
    b.type = 'button'; b.id = 'gnCopyEntry'; b.className = (more.className || 'btn') + ' pri'
    b.textContent = 'In Notizen kopieren'
    b.addEventListener('click', function () { more.click() })
    more.parentNode.insertBefore(b, more)
  }

  addEntry()
  new MutationObserver(function () {
    addEntry()
    var body = document.getElementById('exBody')
    if (body && body.querySelector('.exp-row')) enhance(body)
  }).observe(document.body, { childList: true, subtree: true })

  window.EH.copyInk = copyInk
  window.EH.inkPayload = function (blocks) { var v = view(); return v ? payload(v, blocks || null) : null }
})()
