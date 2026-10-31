import { useCallback, useState } from 'react'
import Editor from './components/Editor'
import Library from './components/Library'
import TabBar from './components/TabBar'
import TemplatePicker, { type TemplateResult } from './components/sheets/TemplatePicker'
import { Toast } from './components/Widgets'
import { useLibrary } from './store/useLibrary'
import { useT } from './context/Settings'

export default function App() {
  const t = useT()
  const lib = useLibrary()
  const [present, setPresent] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [toast, setToastState] = useState<{ msg: string; persistent?: boolean } | null>(null)
  const show = useCallback((msg: string, persistent?: boolean) => setToastState({ msg, persistent }), [])
  const hide = useCallback(() => setToastState(null), [])
  const open = lib.notebooks.find((n) => n.id === lib.view && !n.deleted)
  const tabs = lib.tabs.map((id) => lib.notebooks.find((n) => n.id === id)).filter((n): n is NonNullable<typeof n> => !!n && !n.deleted)

  const init: TemplateResult = { template: 'wide', color: 'white', size: 'a4p', cover: 'hell', coverColor: '#53d3f5', title: '' }
  return (
    <div className="flex h-full flex-col bg-canvas">
      {!present && (
        <TabBar tabs={tabs} view={open ? open.id : lib.view} onHome={() => lib.go('home')} onOpen={lib.open} onClose={lib.close}
          onRename={(id, title) => lib.patch(id, { title })} onTrash={lib.trash} />
      )}
      {open
        ? <Editor key={open.id} meta={open} lib={lib} present={present} setPresent={setPresent} toast={show} hideToast={hide} />
        : <Library lib={lib} onNew={() => setNewOpen(true)} onToast={show} />}
      <TemplatePicker open={newOpen} mode="new" initial={init} onClose={() => setNewOpen(false)}
        onConfirm={(r) => { setNewOpen(false); lib.create({ title: r.title.trim() || t('Unbenannt'), template: r.template, color: r.color, size: r.size, cover: r.cover, coverColor: r.coverColor }) }} />
      {toast && <Toast msg={toast.msg} persistent={toast.persistent} onClose={hide} />}
    </div>
  )
}
