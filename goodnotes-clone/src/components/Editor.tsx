import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X } from './glyphs'
import { emptyContent, newId, type Content, type Selection } from '../lib/draw'
import { ELEMENT_SIZE } from '../lib/elements'
import { buildPdf, download, printPages, readImage } from '../lib/export'
import { SIZES } from '../lib/paper'
import { useRecorder } from '../lib/recorder'
import { useNotebook } from '../store/useNotebook'
import type { NbMeta } from '../store/types'
import type { Library } from '../store/useLibrary'
import { useSettings, useT } from '../context/Settings'
import DocumentView from './DocumentView'
import Sidebar, { type SideTab } from './Sidebar'
import Toolbar, { type PopName } from './Toolbar'
import { OptionsBar, UndoPill } from './ToolOptionsBar'
import { Magnifier, TimerWidget } from './Widgets'
import type { Ruler } from './NoteCanvas'
import type { AccId, EditorProps, TextRef, ToolId } from './editorTypes'
import { buildCanvasTool, currentColor, loadPrefs, savePrefs, type ToolPrefs } from './toolState'
import ColorPopover from './popovers/ColorPopover'
import PenPopover from './popovers/PenPopover'
import ShapesPopover from './popovers/ShapesPopover'
import { AccessoriesPopover, EraserPopover, FontPopover, ImagesPopover, LassoPopover, ObjectsPopover, SettingsPopover, SizePopover, SpacingPopover, TextColorPopover } from './popovers/SimplePopovers'
import { AddPagePopover, MorePopover, SearchPopover, SharePopover, type ClearKind, type Where } from './popovers/PagePopovers'
import CustomizeToolbar from './sheets/CustomizeToolbar'
import FontPicker from './sheets/FontPicker'
import TemplatePicker, { type TemplateResult } from './sheets/TemplatePicker'

const HINT = 'Tippe, um ein Textfeld hinzuzufügen. Halte gedrückt, um Text zur ganzen Seite hinzuzufügen.'
type TplAction = { kind: 'change' } | { kind: 'add'; where: Where }

interface Props {
  meta: NbMeta
  lib: Library
  present: boolean
  setPresent: (v: boolean) => void
  toast: (msg: string, persistent?: boolean) => void
  hideToast: () => void
}
export default function Editor({ meta, lib, present, setPresent, toast, hideToast }: Props) {
  const t = useT()
  const floating = useSettings().toolbar === 'floating'
  const nb = useNotebook(meta.id, meta.title, useCallback((m) => lib.patch(meta.id, { pages: m.pages, title: m.title, updated: Date.now() }), [lib.patch, meta.id])) // eslint-disable-line react-hooks/exhaustive-deps
  const [prefs, setPrefsRaw] = useState<ToolPrefs>(loadPrefs)
  const set = useCallback((fn: (p: ToolPrefs) => ToolPrefs) => setPrefsRaw((p) => { const n = fn(p); savePrefs(n); return n }), [])
  const [tool, setTool] = useState<ToolId>('pen')
  const [popover, setPopover] = useState<PopName | null>(null)
  const anchors = useRef<Record<string, HTMLElement | null>>({})
  const anchorFor = (...keys: string[]) => ({ get current() { for (const k of keys) if (anchors.current[k]) return anchors.current[k]; return null } }) as React.RefObject<HTMLElement | null>
  const [selection, setSelection] = useState<Selection | null>(null)
  const [selText, setSelText] = useState<TextRef | null>(null)
  const [editText, setEditTextRaw] = useState<TextRef | null>(null)
  const [ruler, setRuler] = useState<Ruler | null>(null)
  const [zoomSet, setZoom] = useState<number | null>(null)
  const zoomNow = useRef(1)
  const [readOnly, setReadOnly] = useState(false)
  const [sidebar, setSidebar] = useState(false)
  const [sideTab, setSideTab] = useState<SideTab>('pages')
  const [lens, setLens] = useState(false)
  const [timer, setTimer] = useState(false)
  const [scrollTo, setScrollTo] = useState<{ id: string; n: number } | null>(null)
  const [tpl, setTpl] = useState<TplAction | null>(null)
  const [fontSheet, setFontSheet] = useState(false)
  const [customize, setCustomize] = useState(false)
  const autoSwitch = useRef(false)
  const rec = useRecorder(useCallback(() => toast(t('Mikrofonzugriff nicht möglich')), [toast, t]))
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
    const always: ToolId[] = ['objects', 'images', 'shapes']
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
    const { w: pw, h: ph } = SIZES[page.size]
    const tw = Math.min(w, pw * max), th = (tw * h) / w
    const id = newId()
    store.commit((c) => ({ ...c, images: [...c.images, { id, src, w: tw, h: th, x: (pw - tw) / 2, y: Math.max(40, (ph - th) / 3) }] }))
    setTool('lasso'); setSelection({ pageId: page.id, strokes: [], texts: [], images: [id] })
  }
  const insertElement = (src: string) => {
    place(src, ELEMENT_SIZE * 2, ELEMENT_SIZE * 2, 0.3)
    set((p) => ({ ...p, recent: [src, ...p.recent.filter((r) => r !== src)].slice(0, 12) }))
  }
  const choose = (kind: 'file' | 'camera' | 'import', where: Where = 'after', asPage = false) => {
    pending.current = asPage || kind === 'import' ? { kind: 'page', where } : { kind: 'insert' }
    ;(kind === 'camera' ? cameraRef : kind === 'import' ? importRef : fileRef).current?.click()
  }
  const addPageWith = (where: Where, meta?: Partial<Parameters<typeof nb.addPage>[1]>, content?: Content) => {
    const id = nb.addPage(where, meta as never, content)
    setScrollTo({ id, n: Date.now() })
    return id
  }
  const onFile = async (f: File | undefined, mode: 'insert' | 'page', where: Where = 'after') => {
    if (!f) return
    try {
      if (f.type === 'application/json' || f.name.endsWith('.json')) { lib.restoreBackup(await f.text()); toast(t('Backup wiederhergestellt')); return }
      const im = await readImage(f)
      if (mode === 'insert') place(im.src, im.w, im.h)
      else {
        const { w: pw, h: ph } = SIZES[page.size]
        const k = Math.min(pw / im.w, ph / im.h)
        addPageWith(where, { template: 'blank' }, { ...emptyContent(), images: [{ id: newId(), src: im.src, x: (pw - im.w * k) / 2, y: (ph - im.h * k) / 2, w: im.w * k, h: im.h * k }] })
      }
    } catch { toast(t('Datei konnte nicht gelesen werden')) }
  }

  /* ------------------------------ accessories ------------------------------ */
  const onAcc = (a: AccId) => {
    if (a === 'record') { if (rec.recording) rec.stop(); else { rec.start(); setSidebar(true); setSideTab('audio') } }
    else if (a === 'recordings') { setSidebar(true); setSideTab('audio') }
    else if (a === 'zoom') setLens((v) => !v)
    else if (a === 'timer') setTimer((v) => !v)
    else if (a === 'ruler') setRuler((r) => (r ? null : { pageId: page.id, x: SIZES[page.size].w / 2, y: SIZES[page.size].h / 2, angle: 0 }))
  }
  const accActive: Record<AccId, boolean> = { record: rec.recording, recordings: sidebar && sideTab === 'audio', zoom: lens, ruler: !!ruler, timer }

  /* ------------------------------ export ------------------------------ */
  const exportPdf = async (all: boolean) => {
    toast(t('Export wird erstellt …'))
    try { download(`${nb.title || meta.title || 'notizbuch'}${all ? '' : `-${nb.index + 1}`}.pdf`, await buildPdf(all ? nb.pages : [page]), 'application/pdf'); hideToast() } catch { toast(t('Export fehlgeschlagen')) }
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
    else if ((e.key === 'Delete' || e.key === 'Backspace') && selection) { e.preventDefault(); deleteSelection() }
    else if (e.key === 'Escape') { setSelection(null); setPopover(null) }
  }
  useEffect(() => { const f = (e: KeyboardEvent) => key.current(e); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f) }, [])
  useEffect(() => { if (nb.saveError) toast(t('Speicher voll – Änderungen werden nur noch im Arbeitsspeicher gehalten.')) }, [nb.saveError]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------ render ------------------------------ */
  const ed = useMemo<Omit<EditorProps, 'zoom'>>(() => ({
    tool, canvasTool, selection, setSelection, textStyle: prefs.textStyle, selText, setSelText, editText, setEditText, ruler, setRuler, colors: prefs.colors,
    onTextCreated: () => { autoSwitch.current = true },
  }), [tool, canvasTool, selection, prefs.textStyle, selText, editText, ruler, prefs.colors]) // eslint-disable-line react-hooks/exhaustive-deps
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
        {sidebar && !present && <Sidebar nb={nb} tab={sideTab} setTab={setSideTab} onClose={() => setSidebar(false)} onGo={goPage} recordings={rec.items} onRemoveRec={rec.remove} recording={rec.recording} secs={rec.secs} />}
        <div className="relative flex min-w-0 flex-1 flex-col">
          {!present && floating && (
            <div className="pointer-events-none absolute inset-x-0 top-2 z-30"><div className="pointer-events-auto">
              <Toolbar floating tool={tool} onTool={onTool} prefs={prefs} anchors={anchors} popover={popover} onPop={setPopover} sidebar={sidebar} onSidebar={() => setSidebar((s) => !s)}
                readOnly={readOnly} onReadOnly={() => { setReadOnly((v) => !v); setSelection(null) }} accActive={accActive} onAcc={onAcc} />
            </div></div>
          )}
          <DocumentView nb={nb} ed={ed} zoom={zoomSet} setZoom={setZoom} scrollTo={scrollTo} topInset={present ? 8 : floating ? 116 : 58} onZoomValue={(z) => { zoomNow.current = z }}
            laser={{ on: tool === 'laser' && !readOnly, color: prefs.laserColor, trail: prefs.laserTrail, size: 9 }} />
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
      {lens && <Magnifier onClose={() => setLens(false)} />}

      <PenPopover anchor={anchorFor('opt:pen', 'tool:pen')} open={P('pen')} onClose={close} prefs={prefs} set={set} />
      <ColorPopover anchor={anchorFor('color')} open={P('color')} onClose={close} color={currentColor(tool, prefs)}
        onChange={(hex) => set((p) => { const k = tool === 'shapes' ? 'shape' : p.penMode; const colors = [...p.colors]; colors[p.colorIdx[k]] = hex; return { ...p, colors } })} />
      <EraserPopover anchor={anchorFor('tool:eraser')} open={P('eraser')} onClose={close} prefs={prefs} set={set} onClearPage={() => store.commit(() => emptyContent())} />
      <LassoPopover anchor={anchorFor('tool:lasso')} open={P('lasso')} onClose={close} prefs={prefs} set={set} />
      <ShapesPopover anchor={anchorFor('tool:shapes')} open={P('shapes')} onClose={close} prefs={prefs} set={set} />
      <ObjectsPopover anchor={anchorFor('tool:objects')} open={P('objects')} onClose={close} prefs={prefs} onInsert={insertElement} />
      <ImagesPopover anchor={anchorFor('tool:images')} open={P('images')} onClose={close} onChoose={(k) => choose(k)} />
      <AccessoriesPopover anchor={anchorFor('acc')} open={P('acc')} onClose={close} prefs={prefs} onAcc={onAcc} onCustomize={() => setCustomize(true)} />
      <FontPopover anchor={anchorFor('font')} open={P('font')} onClose={close} prefs={prefs} onFont={(f) => onTextStyle({ font: f })} onMore={() => setFontSheet(true)} />
      <SizePopover anchor={anchorFor('size')} open={P('size')} onClose={close} prefs={prefs} onSize={(n) => onTextStyle({ size: n })} />
      <SpacingPopover anchor={anchorFor('spacing')} open={P('spacing')} onClose={close} prefs={prefs} onLh={(n) => onTextStyle({ lh: n })} />
      <TextColorPopover anchor={anchorFor('textcolor')} open={P('textcolor')} onClose={close} prefs={prefs} onColor={(c) => onTextStyle({ color: c })} />
      <AddPagePopover anchor={anchorFor('add')} open={P('add')} onClose={close} current={{ size: page.size, template: page.template, color: page.color }}
        onAdd={(w, m) => addPageWith(w, m)} onMoreTemplates={(w) => setTpl({ kind: 'add', where: w })} onChoose={(k, w) => choose(k, w, true)} />
      <SharePopover anchor={anchorFor('share')} open={P('share')} onClose={close} onExport={exportPdf} onPrint={async (all) => { if (!(await printPages(all ? nb.pages : [page]))) toast(t('Pop-ups sind blockiert')) }}
        present={present} onPresent={setPresent} onUnavailable={() => toast(t('Zusammenarbeit ist in dieser Web-Version nicht verfügbar.'))} />
      <MorePopover anchor={anchorFor('more')} open={P('more')} onClose={close} page={page} index={nb.index} total={nb.pages.length}
        onBookmark={() => nb.toggleBookmark(page.id)} onCopy={() => nb.duplicatePage(page.id)} onRotate={(d) => nb.rotatePage(page.id, d)}
        onOutline={() => { nb.addOutline(page.id, `${t('Seite')} ${nb.index + 1}`); toast(t('Zur Gliederung hinzugefügt')) }} onTemplate={() => setTpl({ kind: 'change' })}
        onGoto={(n) => goPage(nb.pages[n - 1].id)} onClearKinds={(k) => store.commit(kinds(k))} onClearPage={() => store.commit(() => emptyContent())}
        onDelete={() => nb.deletePage(page.id)} onSettings={() => setPopover('settings')} />
      <SettingsPopover anchor={anchorFor('more')} open={P('settings')} onClose={close} />
      <SearchPopover anchor={anchorFor('search')} open={P('search')} onClose={close} pages={nb.pages} outline={nb.outline} onGo={goPage} />

      <FontPicker open={fontSheet} onClose={() => setFontSheet(false)} current={prefs.textStyle.font} recent={prefs.recentFonts} onPick={(f) => onTextStyle({ font: f })} />
      <CustomizeToolbar open={customize} onClose={() => setCustomize(false)} prefs={prefs} set={set} onCustomizePen={() => { setTool('pen'); setTimeout(() => setPopover('pen'), 50) }} />
      <TemplatePicker open={!!tpl} mode="page" initial={tplInit} onClose={() => setTpl(null)}
        onConfirm={(r) => { if (tpl?.kind === 'add') addPageWith(tpl.where, { template: r.template, color: r.color, size: r.size }); else nb.setMeta(page.id, { template: r.template, color: r.color, size: r.size }); setTpl(null) }}
        onImportImage={(f) => { pending.current = { kind: 'page', where: tpl?.kind === 'add' ? tpl.where : 'after' }; setTpl(null); void onFile(f, 'page', tpl?.kind === 'add' ? tpl.where : 'after') }} />

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; const p = pending.current; void onFile(f, p.kind, p.kind === 'page' ? p.where : 'after') }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; const p = pending.current; void onFile(f, p.kind, p.kind === 'page' ? p.where : 'after') }} />
      <input ref={importRef} type="file" accept="image/*,application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; const p = pending.current; void onFile(f, 'page', p.kind === 'page' ? p.where : 'after') }} />
    </>
  )
}
