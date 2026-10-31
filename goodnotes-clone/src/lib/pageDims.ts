import { SIZES } from './paper'
import type { Page } from '../store/types'
/** Page size in page units – imported PDF pages keep their own size. */
export const pageDims = (p: Pick<Page, 'size' | 'bg'>) => (p.bg ? { w: p.bg.w, h: p.bg.h } : SIZES[p.size])
