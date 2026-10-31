export const isPdf = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
/** pdf.js is large – load it only when a PDF is actually imported. */
export const importPdf: typeof import('./pdf').importPdf = async (...a) => (await import('./pdf')).importPdf(...a)
