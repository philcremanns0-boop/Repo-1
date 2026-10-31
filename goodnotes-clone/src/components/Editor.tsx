import { pageDims } from '../lib/pageDims'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X } from './glyphs'
import { emptyContent, newId, type Content, type Selection } from '../lib/draw'
import { ELEMENT_SIZE } from '../lib/elements'
import { buildPdf, download, printPages, readImage, renderPage } from '../lib/export'
import { importPdf, isPdf } from '../lib/files'
import { clipFor, copyPage, copySel, hasClip, hasPageClip, pastedPage, remove } from '../lib/clipboard'

import { useRecorder } from '../lib/recorder'
import { useNotebook } from '../store/useNotebook'
import { useMyElements } from '../lib/myElements'
import type { NbMeta, NotebookData, Page } from '../store/types'
import type { Library } from '../store/useLibrary'
import { useSettings, useT } from '../context/Settings'
import DocumentView from './DocumentView'
import Sidebar, { type SideTab } from './Sidebar'
import Toolbar, { type PopName } from './Toolbar'
import { OptionsBar, UndoPill } from './ToolOptionsBar'
import { TimerWidget } from './Widgets'
import ZoomWindow from './ZoomWindow'
import type { Ruler } from './NoteCanvas'
import type { AccId, EditorProps, TextRef, ToolId, ZoomRegion } from './editorTypes'
import { buildCanvasTool, currentColor, loadPrefs, savePrefs, type ToolPrefs } from './toolState'
import ColorPopover from './popovers/ColorPopover'
import PenPopover from './popovers/PenPopover'
import ShapesPopover from './popovers/ShapesPopover'
import { TextBoxStylePopover, TextStylesPopover, AccessoriesPopover, EraserPopover, FontPopover, ImagesPopover, LassoPopover, ObjectsPopover, SettingsPopover, SizePopover, SpacingPopover, TextColorPopover } from './popovers/SimplePopovers'
import { AddPagePopover, MorePopover, SearchPopover, SharePopover, type ClearKind, type ExportFormat, type Where } from './popovers/PagePopovers'
import CustomizeToolbar from './sheets/CustomizeToolbar'
import FontPicker from './sheets/FontPicker'
import LinkSheet from './sheets/LinkSheet'
import TemplatePicker, { type TemplateResult } from './sheets/TemplatePicker'

const HINT = 'Tippe, um ein Textfeld hinzuzufügen. Halte gedrückt, um Text zur ganzen Seite hinzuzufügen.'
type TplAction = { kind: 'change' } | { kind: 'add'; where: Where }

interface Props {
  initial: NotebookData
  meta: NbMeta
  lib: Library
  present: boolean
  setPresent: (v: boolean) => void
  toast: (msg: string, persistent?: boolean) => void
  hideToast: () => void
}
export default function Editor({ initial, meta, lib, present, setPresent, toast, hideToast }: Props) {
  const t = useT()
  const floating = useSettings().toolbar === 'floating'
  const nb = useNotebook(meta.id, initial, useCallback((m) => lib.patch(meta.id, { pages: m.pages, title: m.title, updated: Date.now() }), [lib.patch, meta.id])) // eslint-disable-line react-hooks/exhaustive-deps
  const [prefs, setPrefsRaw] = useState<ToolPrefs>(loadPrefs)
  const myEls = useMyElements()
  const set = useCallback((fn: (p: ToolPrefs) => ToolPrefs) => setPrefsRaw((p) => { const n = fn(p); savePrefs(n); return n }), [])
  const [tool, setToolRaw] = useState<ToolId>('pen')
  const prevTool = useRef<ToolId>('pen')
  const setTool = useCallback((t: ToolId) => setToolRaw((cur) => { if (cur !== t) prevTool.current = cur; return t }), [])
  const [popover, setPopover] = useState<PopName | null>(null)
  const anchors = useRef<Record<string, HTMLElement | null>>({})
  const anchorFor = (...keys: string[]) => ({ get current() { for (const k of keys) if (anchors.current[k]) return anchors.current[k]; return null } }) as React.RefObject<HTMLElement | null>
  const [selection, setSelection] = useState<Selection | null>(null)
  const [selText, setSelText] = useState<TextRef | null>(null)
  const [editText, setEditTextRaw] = useState<TextRef | null>(null)
  const [ruler, setRuler] = useState<Ruler | null>(null)
  const [playback, setPlayback] = useState<{ now: number; end: number; start: number } | null>(null)
  const [flash, setFlash] = useState<{ pageId: string; needle: string } | null>(null)
  const clearFlash = useCallback(() => setFlash(null), [])
  const [linkReq, setLinkReq] = useState<{ pageId: string; box: { x: number; y: number; w: number; h: number } } | null>(null)
  const [pasteAt, setPasteAt] = useState<{ pageId: string; p: { x: number; y: number }; client: { x: number; y: number } } | null>(null)
  const paste = (pageId: string, at?: { x: number; y: number }) => {
    const r = clipFor(pageId, at)
    if (!r) return
    nb.store(pageId).commit((c) => ({ strokes: [...c.strokes, ...r.add.strokes], texts: [...c.texts, ...r.add.texts], images: [...c.images, ...r.add.images] }))
    setTool('lasso'); setSelection(r.sel); setPasteAt(null)
  }
  /** Paste from the system clipboard: text → text box in the current style, image → image object. */
  const pasteExternal = (pageId: string, data: { text?: string; image?: Blob }, at?: { x: number; y: number }) => {
    const st = nb.store(pageId)
    const pg = nb.pages.find((p) => p.id === pageId) ?? page
    const { w: pw, h: ph } = pageDims(pg)
    if (data.image) {
      void readImage(data.image).then((im) => {
        const tw = Math.min(im.w, pw * 0.6), th = (tw * im.h) / im.w, id = newId()
        st.commit((c) => ({ ...c, images: [...c.images, { id, src: im.src, w: tw, h: th, x: at ? at.x : (pw - tw) / 2, y: at ? at.y : Math.max(40, (ph - th) / 3) }] }))
        setTool('lasso'); setSelection({ pageId, strokes: [], texts: [], images: [id] })
      }).catch(() => toast(t('Datei konnte nicht gelesen werden')))
    } else if (data.text?.trim()) {
      const id = newId(), s = prefs.textStyle
      const w = Math.min(pw - 96, Math.max(200, Math.min(...[data.text.split('\n').reduce((m, l) => Math.max(m, l.length), 0) * s.size * 0.55 + 16])))
      st.commit((c) => ({ ...c, texts: [...c.texts, { id, x: at ? at.x : 48, y: at ? at.y : 80, w, text: data.text!, ...s }] }))
      setTool('lasso'); setSelection({ pageId, strokes: [], texts: [id], images: [] })
    }
    setPasteAt(null)
  }
  const pasteAny = async (pageId: string, at?: { x: number; y: number }) => {
    if (hasClip()) return paste(pageId, at)
    try {
      const items = await navigator.clipboard.read()
      for (const it of items) {
        const img = it.types.find((x) => x.startsWith('image/'))
        if (img) return pasteExternal(pageId, { image: await it.getType(img) }, at)
        if (it.types.includes('text/plain')) return pasteExternal(pageId, { text: await (await it.getType('text/plain')).text() }, at)
      }
      toast(t('Die Zwischenablage ist leer'))
    } catch {
      try { const text = await navigator.clipboard.readText(); if (text) return pasteExternal(pageId, { text }, at) } catch { /* no permission */ }
      toast(t('Kein Zugriff auf die Zwischenablage – nutze ⌘V / Strg+V'))
    }
    setPasteAt(null)
  }
  const [zoomSet, setZoom] = useState<number | null>(null)
  const zoomNow = useRef(1)
  const [readOnly, setReadOnly] = useState(false)
  const [sidebar, setSidebar] = useState(false)
  const [sideTab, setSideTab] = useState<SideTab>('pages')
  const [zoomRegion, setZoomRegion] = useState<ZoomRegion | null>(null)
  const [timer, setTimer] = useState(false)
  const [scrollTo, setScrollTo] = useState<{ id: string; n: number } | null>(null)
  const [tpl, setTpl] = useState<TplAction | null>(null)
  const [fontSheet, setFontSheet] = useState(false)
  const [customize, setCustomize] = useState(false)
  const autoSwitch = useRef(false)
  const rec = useRecorder(meta.id, useCallback(() => toast(t('Mikrofonzugriff nicht möglich')), [toast, t]))
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const pending = useRef<{ kind: 'insert' } | { kind: 'page'; where: Where }>({ kind: 'insert' })

  const page = nb.page
  const store = nb.store(page.id)
  const goPage = (id: string) => { nb.setCurrent(id); setScrollTo({ id, n: Date.now() }) }

  /* ------------------------------ tools ------------------------------ */
  const closeText = () => { setSelText(null); setEditTextRaw(null) }
  const onTool = (id: ToolId, again: boolean) => {
    const popTools: ToolId[] = ['pen', 'eraser', 'lasso', 'objects', 'images', 'shapes']
    const always: ToolId[] = ['objects', 'images']
    if (!again) {
      setTool(id); setSelection(null); closeText(); hideToast()
      setPopover(always.includes(id) ? (id as PopName) : null)
      if (id === 'text') toast(t(HINT), true)
    } else if (popTools.includes(id)) setPopover(popover === id ? null : (id as PopName))
  }
  const setEditText = (v: TextRef | null) => {
    setEditTextRaw(v)
    if (!v && autoSwitch.current) { autoSwitch.current = false; if (!prefs.pinText) { setTool('lasso'); hideToast() } }
  }
  const onTextStyle = (patch: Partial<ToolPrefs['textStyle']>) => {
    set((p) => ({ ...p, textStyle: { ...p.textStyle, ...patch }, recentFonts: patch.font ? [patch.font, ...p.recentFonts.filter((f) => f !== patch.font)].slice(0, 6) : p.recentFonts }))
    if (selText) nb.store(selText.pageId).commit((c) => ({ ...c, texts: c.texts.map((x) => (x.id === selText.id ? { ...x, ...patch, ...(x.note && patch.color ? { color: x.color } : {}) } : x)) }))
  }
  const canvasTool = useMemo(() => buildCanvasTool(tool, prefs, readOnly), [tool, prefs, readOnly])

  /* ------------------------------ images / elements ------------------------------ */
  const place = (src: string, w: number, h: number, max = 0.6) => {
    const { w: pw, h: ph } = pageDims(page)
    const tw = Math.min(w, pw * max), th = (tw * h) / w
    const id = newId()
    store.commit((c) => ({ ...c, images: [...c.images, { id, src, w: tw, h: th, x: (pw - tw) / 2, y: Math.max(40, (ph - th) / 3) }] }))
    setTool('lasso'); setSelection({ pageId: page.id, strokes: [], texts: [], images: [id] })
  }
  const insertElement = (src: string) => {
    if (src.startsWith('data:image/png')) {
      // own object: keep its real size (it was drawn on a page), scaled from the 2× export
      const im = new Image(); im.onload = () => place(src, im.naturalWidth / 2, im.naturalHeight / 2, 0.9); im.src = src
      return
    }
    place(src, ELEMENT_SIZE * 2, ELEMENT_SIZE * 2, 0.3)
    if (!src.startsWith('data:image/png')) set((p) => ({ ...p, recent: [src, ...p.recent.filter((r) => r !== src)].slice(0, 12) }))
  }
  const choose = (kind: 'file' | 'camera' | 'import', where: Where = 'after', asPage = false) => {
    pending.current = asPage || kind === 'import' ? { kind: 'page', where } : { kind: 'insert' }
    ;(kind === 'camera' ? cameraRef : kind === 'import' ? importRef : fileRef).current?.click()
  }
  const addPageWith = (where: Where, meta?: Partial<Parameters<typeof nb.addPage>[1]>, content?: Content, bg?: Page['bg']) => {
    const id = nb.addPage(where, meta as never, content, bg)
    setScrollTo({ id, n: Date.now() })
    return id
  }
  const onFile = async (f: File | undefined, mode: 'insert' | 'page', where: Where = 'after') => {
    if (!f) return
    try {
      if (f.type === 'application/json' || f.name.endsWith('.json')) { await lib.restoreBackup(await f.text()); toast(t('Backup wiederhergestellt')); return }
      if (isPdf(f)) {
        toast(t('PDF wird importiert …'), true)
        const bgs = await importPdf(f, (d, n) => toast(`${t('PDF wird importiert …')} ${d}/${n}`, true))
        let first = ''
        for (const bg of bgs) { const id = nb.addPage(where, { template: 'blank', color: 'white' }, undefined, bg); first ||= id; where = 'after' }
        if (first) setScrollTo({ id: first, n: Date.now() })
        toast(`${bgs.length} ${t(bgs.length === 1 ? 'Seite importiert' : 'Seiten importiert')}`)
        return
      }
      const im = await readImage(f)
      if (mode === 'insert') place(im.src, im.w, im.h)
      else {
        const { w: pw, h: ph } = pageDims(page)
        const k = Math.min(pw / im.w, ph / im.h)
        addPageWith(where, { template: 'blank' }, { ...emptyContent(), images: [{ id: newId(), src: im.src, x: (pw - im.w * k) / 2, y: (ph - im.h * k) / 2, w: im.w * k, h: im.h * k }] })
      }
    } catch { toast(t('Datei konnte nicht gelesen werden')) }
  }

  /* ------------------------------ accessories ------------------------------ */
  const onAcc = (a: AccId) => {
    if (a === 'record') { if (rec.recording) rec.stop(); else { rec.start(); setSidebar(true); setSideTab('audio') } }
    else if (a === 'recordings') { setSidebar(true); setSideTab('audio') }
    else if (a === 'zoom') setZoomRegion((r) => (r ? null : { pageId: page.id, x: 48, y: Math.min(160, pageDims(page).h / 4), w: Math.min(360, pageDims(page).w), h: 110 }))
    else if (a === 'timer') setTimer((v) => !v)
    else if (a === 'ruler') setRuler((r) => (r ? null : { pageId: page.id, x: pageDims(page).w / 2, y: pageDims(page).h / 2, angle: 0 }))
  }
  const accActive: Record<AccId, boolean> = { record: rec.recording, recordings: sidebar && sideTab === 'audio', zoom: !!zoomRegion, ruler: !!ruler, timer }

  /* ------------------------------ export ------------------------------ */
  const exportAs = async (all: boolean, format: ExportFormat) => {
    const name = nb.title || meta.title || 'notizbuch'
    const pages = all ? nb.pages : [page]
    toast(t('Export wird erstellt …'))
    try {
      if (format === 'pdf') download(`${name}${all ? '' : `-${nb.index + 1}`}.pdf`, await buildPdf(pages), 'application/pdf')
      else if (format === 'png') {
        for (let i = 0; i < pages.length; i++) {
          const cv = await renderPage(pages[i], 2)
          const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), 'image/png'))
          download(`${name}-${all ? i + 1 : nb.index + 1}.png`, blob)
        }
      } else {
        nb.flush()
        download(`${name}.goodnotes.json`, await lib.backupOne(meta.id), 'application/json')
      }
      hideToast()
    } catch { toast(t('Export fehlgeschlagen')) }
  }

  /* ------------------------------ keyboard ------------------------------ */
  const deleteSelection = useCallback(() => {
    if (!selection) return
    nb.store(selection.pageId).commit((x) => ({ strokes: x.strokes.filter((s) => !selection.strokes.includes(s.id)), texts: x.texts.filter((s) => !selection.texts.includes(s.id)), images: x.images.filter((s) => !selection.images.includes(s.id)) }))
    setSelection(null)
  }, [selection, nb])
  const key = useRef<(e: KeyboardEvent) => void>(() => {})
  key.current = (e) => {
    const el = e.target as HTMLElement
    if (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return
    const mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase()
    if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? store.redo() : store.undo() }
    else if (mod && k === 'y') { e.preventDefault(); store.redo() }
    else if (mod && (k === 'c' || k === 'x') && selection) { e.preventDefault(); const st = nb.store(selection.pageId); copySel(st.content, selection); if (k === 'x') { st.commit((c) => remove(c, selection)); setSelection(null) } }
    else if (mod && k === 'v' && hasClip()) { e.preventDefault(); paste(page.id) }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && selection) { e.preventDefault(); deleteSelection() }
    else if (e.key === 'Escape') { setSelection(null); setPopover(null) }
  }
  useEffect(() => { const f = (e: KeyboardEvent) => key.current(e); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f) }, [])
  // system paste (⌘V / Strg+V) when no in-app lasso clipboard is active
  const onPaste = useRef<(e: ClipboardEvent) => void>(() => {})
  onPaste.current = (e) => {
    const el = e.target as HTMLElement
    if (el?.isContentEditable || /^(INPUT|TEXTAREA)$/.test(el?.tagName)) return
    const d = e.clipboardData; if (!d) return
    const file = Array.from(d.files).find((f) => f.type.startsWith('image/'))
    const text = d.getData('text/plain')
    if (file || text) { e.preventDefault(); pasteExternal(page.id, file ? { image: file } : { text }) }
  }
  useEffect(() => { const f = (e: ClipboardEvent) => onPaste.current(e); window.addEventListener('paste', f); return () => window.removeEventListener('paste', f) }, [])
  useEffect(() => { if (nb.saveError) toast(t('Speicher voll – Änderungen werden nur noch im Arbeitsspeicher gehalten.')) }, [nb.saveError]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------ render ------------------------------ */
  const ed = useMemo<Omit<EditorProps, 'zoom'>>(() => ({
    tool, canvasTool, selection, setSelection, textStyle: prefs.textStyle, selText, setSelText, editText, setEditText, ruler, setRuler, colors: prefs.colors,
    onTextCreated: () => { autoSwitch.current = true },
    onLassoTap: (pageId, p, client) => setPasteAt({ pageId, p, client }),
    toast,
    readOnly,
    onAddLink: (pageId, box) => setLinkReq({ pageId, box }),
    goPage: (id) => goPage(id),
    pageNo: (id) => nb.pages.findIndex((p) => p.id === id) + 1,
    zoomRegion, setZoomRegion, flash, clearFlash, playback,
    onSaveElement: (src) => myEls.add(src),
    onEraseEnd: () => { if (prefs.erAuto && prevTool.current && prevTool.current !== 'eraser') setTool(prevTool.current) },
  }), [tool, canvasTool, selection, prefs.textStyle, selText, editText, ruler, prefs.colors, readOnly, nb.pages, zoomRegion, flash, prefs.erAuto, playback]) // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => setPopover(null)
  const P = (name: PopName) => popover === name
  const tplInit: TemplateResult = { template: page.template, color: page.color, size: page.size, cover: meta.cover, coverColor: meta.coverColor, title: meta.title }
  const kinds = (k: ClearKind) => (c: Content): Content => ({
    ...c,
    strokes: c.strokes.filter((s) => (k === 'strokes' ? s.tool !== 'pen' : k === 'highlighter' ? s.tool !== 'highlighter' : k === 'shapes' ? s.tool !== 'shape' : true)),
    texts: k === 'texts' ? [] : c.texts, images: k === 'images' ? [] : c.images,
  })

  return (
    <>
      {!present && !floating && (
        <Toolbar tool={tool} onTool={onTool} prefs={prefs} anchors={anchors} popover={popover} onPop={setPopover} sidebar={sidebar} onSidebar={() => setSidebar((s) => !s)}
          readOnly={readOnly} onReadOnly={() => { setReadOnly((v) => !v); setSelection(null) }} accActive={accActive} onAcc={onAcc} />
      )}
      <div className="relative flex min-h-0 flex-1">
        {sidebar && !present && <Sidebar nb={nb} tab={sideTab} setTab={setSideTab} onClose={() => setSidebar(false)} onGo={goPage} recordings={rec.items} onRemoveRec={rec.remove} recording={rec.recording} secs={rec.secs} onPlayback={setPlayback} />}
        <div className="relative flex min-w-0 flex-1 flex-col">
          {!present && floating && (
            <div className="pointer-events-none absolute inset-x-0 top-2 z-30"><div className="pointer-events-auto">
              <Toolbar floating tool={tool} onTool={onTool} prefs={prefs} anchors={anchors} popover={popover} onPop={setPopover} sidebar={sidebar} onSidebar={() => setSidebar((s) => !s)}
                readOnly={readOnly} onReadOnly={() => { setReadOnly((v) => !v); setSelection(null) }} accActive={accActive} onAcc={onAcc} />
            </div></div>
          )}
          <DocumentView nb={nb} ed={ed} zoom={zoomSet} setZoom={setZoom} scrollTo={scrollTo} topInset={present ? 8 : floating ? 116 : 58} onZoomValue={(z) => { zoomNow.current = z }} onUndo={() => nb.store(nb.page.id).undo()} onRedo={() => nb.store(nb.page.id).redo()}
            laser={{ on: tool === 'laser' && !readOnly, color: prefs.laserColor, trail: prefs.laserTrail, size: 9 }} />
          {zoomRegion && !present && (() => {
            const zp = nb.pages.find((p) => p.id === zoomRegion.pageId)
            return zp ? <ZoomWindow page={zp} store={nb.store(zp.id)} ed={{ ...ed, zoom: 1 }} region={zoomRegion} onRegion={setZoomRegion} onClose={() => setZoomRegion(null)} /> : null
          })()}
          {!present && (
            <div className={`pointer-events-none absolute inset-x-0 ${floating ? 'top-[66px]' : 'top-2'} z-20 grid grid-cols-[96px_minmax(0,1fr)_96px] items-start px-2`}>
              <div className="pointer-events-auto w-fit"><UndoPill canUndo={nb.canUndo(page.id)} canRedo={nb.canRedo(page.id)} onUndo={store.undo} onRedo={store.redo} /></div>
              <div className="pointer-events-auto flex min-w-0 justify-center"><OptionsBar tool={tool} prefs={prefs} set={set} anchors={anchors} popover={popover} onPop={setPopover} onTextStyle={onTextStyle} /></div>
            </div>
          )}
          {present && (
            <button onClick={() => setPresent(false)} className="absolute right-3 top-3 z-30 flex items-center gap-1.5 rounded-full bg-float px-4 py-2 text-[15px] font-semibold shadow-pill backdrop-blur"><X size={16} />{t('Präsentation beenden')}</button>
          )}
        </div>
      </div>

      {timer && <TimerWidget onClose={() => setTimer(false)} />}
      {pasteAt && (
        <div className="fixed inset-0 z-[58]" onPointerDown={() => setPasteAt(null)}>
          <button onPointerDown={(e) => e.stopPropagation()} onClick={() => void pasteAny(pasteAt.pageId, pasteAt.p)}
            className="absolute -translate-x-1/2 -translate-y-[130%] rounded-xl bg-gn-ui-toast px-4 py-2 text-[15px] font-medium text-white shadow-lg" style={{ left: pasteAt.client.x, top: pasteAt.client.y }}>{t('Einfügen')}</button>
        </div>
      )}

      <PenPopover anchor={anchorFor('opt:pen', 'tool:pen')} open={P('pen')} onClose={close} prefs={prefs} set={set} />
      <ColorPopover anchor={anchorFor('color')} open={P('color')} onClose={close} color={currentColor(tool, prefs)}
        onChange={(hex) => set((p) => { const k = tool === 'shapes' ? 'shape' : p.penMode; const colors = [...p.colors]; colors[p.colorIdx[k]] = hex; return { ...p, colors } })}
        onRemove={prefs.colors.length > 1 ? () => set((p) => {
          const k = tool === 'shapes' ? 'shape' : p.penMode, i = p.colorIdx[k]
          const colors = p.colors.filter((_, j) => j !== i)
          const fix = (n: number) => Math.max(0, Math.min(colors.length - 1, n > i ? n - 1 : n))
          return { ...p, colors, colorIdx: { pen: fix(p.colorIdx.pen), highlighter: fix(p.colorIdx.highlighter), tape: fix(p.colorIdx.tape), shape: fix(p.colorIdx.shape) } }
        }) : undefined} />
      <EraserPopover anchor={anchorFor('tool:eraser')} open={P('eraser')} onClose={close} prefs={prefs} set={set} onClearPage={() => store.commit(() => emptyContent())} />
      <LassoPopover anchor={anchorFor('tool:lasso')} open={P('lasso')} onClose={close} prefs={prefs} set={set} />
      <ShapesPopover anchor={anchorFor('tool:shapes')} open={P('shapes')} onClose={close} prefs={prefs} set={set} />
      <ObjectsPopover anchor={anchorFor('tool:objects')} open={P('objects')} onClose={close} prefs={prefs} mine={myEls.items} onInsert={insertElement} />
      <ImagesPopover anchor={anchorFor('tool:images')} open={P('images')} onClose={close} onChoose={(k) => choose(k)} />
      <AccessoriesPopover anchor={anchorFor('acc')} open={P('acc')} onClose={close} prefs={prefs} onAcc={onAcc} onCustomize={() => setCustomize(true)} />
      <FontPopover anchor={anchorFor('font')} open={P('font')} onClose={close} prefs={prefs} onFont={(f) => onTextStyle({ font: f })} onMore={() => setFontSheet(true)} />
      <SizePopover anchor={anchorFor('size')} open={P('size')} onClose={close} prefs={prefs} onSize={(n) => onTextStyle({ size: n })} />
      <SpacingPopover anchor={anchorFor('spacing')} open={P('spacing')} onClose={close} prefs={prefs} onLh={(n) => onTextStyle({ lh: n })} />
      <TextBoxStylePopover anchor={anchorFor('textbox')} open={P('textbox')} onClose={close} prefs={prefs} onStyle={onTextStyle} />
      <TextStylesPopover anchor={anchorFor('textstyles')} open={P('textstyles')} onClose={close} prefs={prefs} set={set} onApply={onTextStyle} />
      <TextColorPopover anchor={anchorFor('textcolor')} open={P('textcolor')} onClose={close} prefs={prefs} onColor={(c) => onTextStyle({ color: c })} />
      <AddPagePopover anchor={anchorFor('add')} open={P('add')} onClose={close} current={{ size: page.size, template: page.template, color: page.color }}
        onAdd={(w, m) => addPageWith(w, m)} onMoreTemplates={(w) => setTpl({ kind: 'add', where: w })} onChoose={(k, w) => choose(k, w, true)}
        onPastePage={hasPageClip() ? (w) => { const pg = pastedPage(); if (pg) addPageWith(w, { size: pg.size, template: pg.template, color: pg.color }, pg.content, pg.bg) } : undefined} />
      <SharePopover anchor={anchorFor('share')} open={P('share')} onClose={close} onExport={exportAs} onPrint={async (all) => { if (!(await printPages(all ? nb.pages : [page]))) toast(t('Pop-ups sind blockiert')) }}
        present={present} onPresent={setPresent} onUnavailable={() => toast(t('Zusammenarbeit ist in dieser Web-Version nicht verfügbar.'))} />
      <MorePopover anchor={anchorFor('more')} open={P('more')} onClose={close} page={page} index={nb.index} total={nb.pages.length}
        onBookmark={() => nb.toggleBookmark(page.id)} onCopy={() => { copyPage(page); toast(t('Seite kopiert – über „Seite hinzufügen“ einfügen')) }} onDuplicate={() => nb.duplicatePage(page.id)} onRotate={(d) => nb.rotatePage(page.id, d)}
        onOutline={() => { nb.addOutline(page.id, `${t('Seite')} ${nb.index + 1}`); toast(t('Zur Gliederung hinzugefügt')) }} onTemplate={() => setTpl({ kind: 'change' })}
        onGoto={(n) => goPage(nb.pages[n - 1].id)} onClearKinds={(k) => store.commit(kinds(k))} onClearPage={() => store.commit(() => emptyContent())}
        onDelete={() => nb.deletePage(page.id)} onSettings={() => setPopover('settings')} />
      <SettingsPopover anchor={anchorFor('more')} open={P('settings')} onClose={close} />
      <SearchPopover anchor={anchorFor('search')} open={P('search')} onClose={close} pages={nb.pages} outline={nb.outline} onGo={goPage} onHit={(pageId, needle) => setFlash({ pageId, needle })} />

      <LinkSheet open={!!linkReq} pages={nb.pages} onClose={() => setLinkReq(null)}
        onDone={(to) => { if (linkReq) { const { pageId, box } = linkReq; nb.store(pageId).commit((c) => ({ ...c, links: [...(c.links ?? []), { id: newId(), ...box, to }] })); toast(t('Link hinzugefügt')) } setLinkReq(null) }} />
      <FontPicker open={fontSheet} onClose={() => setFontSheet(false)} current={prefs.textStyle.font} recent={prefs.recentFonts} onPick={(f) => onTextStyle({ font: f })} />
      <CustomizeToolbar open={customize} onClose={() => setCustomize(false)} prefs={prefs} set={set} onCustomizePen={() => { setTool('pen'); setTimeout(() => setPopover('pen'), 50) }} />
      <TemplatePicker open={!!tpl} mode="page" initial={tplInit} onClose={() => setTpl(null)}
        onConfirm={(r) => { if (tpl?.kind === 'add') addPageWith(tpl.where, { template: r.template, color: r.color, size: r.size }); else if (r.applyAll) nb.pages.filter((p) => !p.bg).forEach((p) => nb.setMeta(p.id, { template: r.template, color: r.color, size: r.size })); else nb.setMeta(page.id, { template: r.template, color: r.color, size: r.size }); setTpl(null) }}
        onImportImage={(f) => { pending.current = { kind: 'page', where: tpl?.kind === 'add' ? tpl.where : 'after' }; setTpl(null); void onFile(f, 'page', tpl?.kind === 'add' ? tpl.where : 'after') }} />

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; const p = pending.current; void onFile(f, p.kind, p.kind === 'page' ? p.where : 'after') }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; const p = pending.current; void onFile(f, p.kind, p.kind === 'page' ? p.where : 'after') }} />
      <input ref={importRef} type="file" accept="application/pdf,.pdf,image/*,application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; const p = pending.current; void onFile(f, 'page', p.kind === 'page' ? p.where : 'after') }} />
    </>
  )
}
