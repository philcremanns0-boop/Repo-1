/** The single spring used for popovers, sheets and sliding selection states (iPadOS-like). */
export const GN_SPRING = { type: 'spring', stiffness: 400, damping: 30 } as const
/** Faster variant for small tap feedback. */
export const GN_TAP = { type: 'spring', stiffness: 600, damping: 32 } as const
