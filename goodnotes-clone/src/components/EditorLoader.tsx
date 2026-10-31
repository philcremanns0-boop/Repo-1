import { useEffect, useState } from 'react'
import Editor from './Editor'
import { createNotebookData, loadNotebookData } from '../store/useNotebook'
import type { NbMeta, NotebookData } from '../store/types'
import type { Library } from '../store/useLibrary'

type Props = { meta: NbMeta; lib: Library; present: boolean; setPresent: (v: boolean) => void; toast: (m: string, p?: boolean) => void; hideToast: () => void }

/** Loads a notebook document from IndexedDB, then mounts the editor. */
export default function EditorLoader(props: Props) {
  const [data, setData] = useState<NotebookData | null>(null)
  useEffect(() => {
    let on = true
    setData(null)
    void loadNotebookData(props.meta.id).then((d) => on && setData(d ?? createNotebookData(props.meta.id, props.meta.title, { size: 'a4p', template: 'wide', color: 'white' })))
    return () => { on = false }
  }, [props.meta.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!data) return <div className="flex flex-1 items-center justify-center bg-canvas"><span className="h-8 w-8 animate-spin rounded-full border-[3px] border-hair border-t-gn-ui-select" aria-label="Lädt" /></div>
  return <Editor initial={data} {...props} />
}
