import { useCallback, useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import EditorLoader from './components/EditorLoader'
import Library from './components/Library'
import TabBar from './components/TabBar'
import TemplatePicker, { type TemplateResult } from './components/sheets/TemplatePicker'
import { Toast } from './components/Widgets'
import { GN_SPRING } from './components/motion'
import { useLibrary } from './store/useLibrary'
import { useSettings, useT } from './context/Settings'

const NEW_NOTEBOOK: TemplateResult = { template: 'wide', color: 'white', size: 'a4p', cover: 'hell', coverColor: '#02BDE4', title: '' }

/**
 * App shell: tab strip (home + open notebooks) above either the Library or the Editor.
 * Owns presentation mode, the "new notebook" sheet and the global toast.
 */
export default function App() {
  const t = useT()
  const { dark } = useSettings()
  const lib = useLibrary()
  const [present, setPresent] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [toast, setToast] = useState<{ msg: string; persistent?: boolean } | null>(null)
  const show = useCallback((msg: string, persistent?: boolean) => setToast({ msg, persistent }), [])
  const hide = useCallback(() => setToast(null), [])

  const open = lib.notebooks.find((n) => n.id === lib.view && !n.deleted)
  const tabs = lib.tabs.map((id) => lib.notebooks.find((n) => n.id === id)).filter((n): n is NonNullable<typeof n> => !!n && !n.deleted)

  // window title + status-bar tint follow the active surface
  useEffect(() => { document.title = open ? `${open.title || t('Unbenannt')} – Goodnotes` : 'Goodnotes' }, [open, t])
  useEffect(() => { document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#1f3260' : '#284d83') }, [dark])
  // leaving a notebook always ends presentation mode
  useEffect(() => { if (!open) setPresent(false) }, [open])

  return (
    <MotionConfig transition={GN_SPRING} reducedMotion="user">
      <div className="gn-text flex h-full flex-col bg-canvas">
        {!present && (
          <TabBar tabs={tabs} view={open ? open.id : lib.view} onHome={() => lib.go('home')} onOpen={lib.open} onClose={lib.close}
            onRename={(id, title) => lib.patch(id, { title })} onTrash={lib.trash} />
        )}
        {open
          ? <EditorLoader key={open.id} meta={open} lib={lib} present={present} setPresent={setPresent} toast={show} hideToast={hide} />
          : <Library lib={lib} onNew={() => setNewOpen(true)} onToast={show} />}
        <TemplatePicker open={newOpen} mode="new" initial={NEW_NOTEBOOK} onClose={() => setNewOpen(false)}
          onConfirm={(r) => {
            setNewOpen(false)
            lib.create({ title: r.title.trim() || t('Unbenannt'), template: r.template, color: r.color, size: r.size, cover: r.cover, coverColor: r.coverColor })
          }} />
        {toast && <Toast msg={toast.msg} persistent={toast.persistent} onClose={hide} />}
      </div>
    </MotionConfig>
  )
}
