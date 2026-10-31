import { DEFAULT_OPTS, newId, type Stroke } from './draw'

/**
 * Ink transfer between Eigenhand (handwriting app) and this notebook.
 *
 * Eigenhand puts two flavours on the clipboard:
 *   text/plain  the plain text (works in every other app)
 *   text/html   <div data-gn-ink="BASE64(JSON)">text</div>
 * The JSON holds the handwriting as vector strokes, so pasted text becomes real
 * pen strokes here: erasable, lasso-selectable, recolourable.
 */
export const INK_ATTR = 'data-gn-ink'
/** Plain-text carrier (Safari may strip custom HTML attributes when pasting across sites). */
export const INK_TEXT_PREFIX = 'EIGENHAND-INK1:'

export interface InkPayload {
  v: 1
  src: string
  /** 'pt' (1/72 in) or 'px' (1/96 in, this app) */
  unit: 'pt' | 'px'
  /** plain text the strokes represent (optional, for display) */
  text?: string
  /** flat point list [x0,y0,x1,y1,...] relative to the top-left of the ink, width, colour */
  strokes: { p: number[]; w: number; c: string }[]
}

const b64decode = (s: string) => {
  const bin = atob(s)
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function parseInkPayload(json: string): InkPayload | null {
  try {
    const o = JSON.parse(json) as InkPayload
    if (o?.v !== 1 || !Array.isArray(o.strokes)) return null
    const ok = o.strokes.every((s) => Array.isArray(s.p) && s.p.length >= 2 && s.p.length % 2 === 0 && s.p.every(Number.isFinite) && Number.isFinite(s.w))
    return ok && o.strokes.length ? o : null
  } catch { return null }
}

/** Find an ink payload inside clipboard HTML. */
export function parseInkHtml(html: string | null | undefined): InkPayload | null {
  if (!html || !html.includes(INK_ATTR)) return null
  const m = new RegExp(`${INK_ATTR}="([A-Za-z0-9+/=]+)"`).exec(html)
  if (!m) return null
  try { return parseInkPayload(b64decode(m[1])) } catch { return null }
}

/** Find an ink payload inside clipboard plain text ("EIGENHAND-INK1:<base64>"). */
export function parseInkText(text: string | null | undefined): InkPayload | null {
  if (!text || !text.includes(INK_TEXT_PREFIX)) return null
  const m = /EIGENHAND-INK1:\s*([A-Za-z0-9+/=\s]+)/.exec(text)
  if (!m) return null
  try { return parseInkPayload(b64decode(m[1].replace(/\s+/g, ''))) } catch { return null }
}

/** Either carrier. */
export const parseInk = (html?: string | null, text?: string | null) => parseInkHtml(html) ?? parseInkText(text)

const HEX = /^#[0-9a-f]{6}$/i

/**
 * Convert a payload into pen strokes placed on a page.
 * `at` is the top-left target; without it the ink lands at the left margin, a third down.
 * Ink wider than the page is scaled down to fit.
 */
export function strokesFromPayload(p: InkPayload, pageW: number, pageH: number, at?: { x: number; y: number }, fallbackColor = '#000000'): Stroke[] {
  let s = p.unit === 'pt' ? 96 / 72 : 1
  let maxX = 0, maxY = 0
  for (const st of p.strokes) for (let i = 0; i < st.p.length; i += 2) { maxX = Math.max(maxX, st.p[i]); maxY = Math.max(maxY, st.p[i + 1]) }
  const room = pageW - 96
  if (maxX * s > room && room > 0) s = room / maxX
  const x0 = at ? Math.min(at.x, Math.max(0, pageW - maxX * s)) : 48
  const y0 = at ? Math.min(at.y, Math.max(0, pageH - maxY * s)) : Math.max(40, Math.min(pageH / 3, pageH - maxY * s - 40))
  return p.strokes.map((st) => {
    const points = []
    for (let i = 0; i < st.p.length; i += 2) points.push({ x: x0 + st.p[i] * s, y: y0 + st.p[i + 1] * s, w: 1 })
    return {
      id: newId(), tool: 'pen', pen: 'ballpoint', opts: { ...DEFAULT_OPTS.ballpoint },
      color: HEX.test(st.c) ? st.c.toLowerCase() : fallbackColor, width: Math.max(0.5, st.w * s), points,
    } satisfies Stroke
  })
}
