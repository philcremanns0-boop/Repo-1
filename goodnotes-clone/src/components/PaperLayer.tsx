import { memo, useId } from 'react'
import { paperInner, type PaperColor, type TemplateId } from '../lib/paper'

/**
 * Template texture as a real inline SVG layer under the ink canvas (ruled / grid / dots / Cornell …).
 * Vector at every zoom level; pattern ids are unique per page.
 */
function PaperLayerImpl({ template, color, width, height }: { template: TemplateId; color: PaperColor; width: number; height: number }) {
  const uid = `paper${useId().replace(/:/g, '')}`
  if (template === 'blank') return null
  return (
    <svg className="pointer-events-none absolute inset-0" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden
      shapeRendering="crispEdges" dangerouslySetInnerHTML={{ __html: paperInner(template, color, width, height, uid) }} />
  )
}
export default memo(PaperLayerImpl)
