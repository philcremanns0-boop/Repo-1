/**
 * Text fonts = the iOS / iPadOS / macOS system fonts Goodnotes offers. The app targets Apple devices only,
 * so the real system font renders; the second entry is only the CSS generic family.
 */
const SANS = 'sans-serif', SERIF = 'serif', MONO = 'monospace', SCRIPT = 'cursive'
/** iOS font name → generic CSS family */
const MAP: Record<string, string> = {
  'Academy Engraved LET': SERIF, 'Al Nile': SANS, 'American Typewriter': MONO,
  'Apple SD Gothic Neo': SANS, Arial: SANS, 'Arial Hebrew': SANS, 'Arial Rounded MT Bold': SANS,
  Avenir: SANS, 'Avenir Next': SANS, 'Avenir Next Condensed': SANS,
  Baskerville: SERIF, 'Bodoni 72': SERIF, 'Bodoni 72 Oldstyle': SERIF, 'Bodoni 72 Smallcaps': SERIF,
  'Bradley Hand': SCRIPT, 'Chalkboard SE': SCRIPT, Chalkduster: SCRIPT, Charter: SERIF,
  Cochin: SERIF, Copperplate: SERIF, 'Courier New': MONO, Damascus: SANS, Didot: SERIF,
  'DIN Alternate': SANS, 'DIN Condensed': SANS, 'Euphemia UCAS': SANS, Farah: SANS,
  'Founders Grotesk': SANS, 'Founders Grotesk Condensed': SANS, 'Founders Grotesk Text': SANS,
  Futura: SANS, Galvji: SANS, 'Geeza Pro': SANS, Georgia: SERIF, 'Gill Sans': SANS,
  'Goodnotes Hand': SCRIPT, 'Grantha Sangam MN': SANS, Helvetica: SANS, 'Helvetica Neue': SANS,
  'Hiragino Maru Gothic ProN': SANS, 'Hiragino Mincho ProN': SERIF, 'Hiragino Sans': SANS,
  'Hoefler Text': SERIF, Impact: SANS, Kailasa: SANS, Kefa: SERIF, 'Khmer Sangam MN': SANS,
  'Kohinoor Bangla': SANS, 'Kohinoor Devanagari': SANS, 'Kohinoor Gujarati': SANS, 'Kohinoor Telugu': SANS,
  'Lao Sangam MN': SANS, 'Malayalam Sangam MN': SANS, 'Marker Felt': SCRIPT, Menlo: MONO,
  Mishafi: SANS, 'Mukta Mahee': SANS, 'Myanmar Sangam MN': SANS, Noteworthy: SCRIPT,
  Optima: SANS, Palatino: SERIF, Papyrus: SERIF, 'Party LET': SCRIPT, Rockwell: SERIF,
  'Savoye LET': SCRIPT, 'Sinhala Sangam MN': SANS, 'Snell Roundhand': SCRIPT, 'STIX Two Text': SERIF,
  Symbol: SANS, 'Tamil Sangam MN': SANS, Thonburi: SANS, 'Times New Roman': SERIF, 'Trebuchet MS': SANS,
  Verdana: SANS, 'Zapf Dingbats': SANS, Zapfino: SCRIPT,
}
export const FONTS: string[] = Object.keys(MAP).sort((a, b) => a.localeCompare(b))

/** user-imported fonts (registered at runtime from IndexedDB) */
let custom: string[] = []
export const setCustomFonts = (names: string[]) => { custom = names }
export const customFonts = () => custom

export const fontStack = (name: string) => {
  const m = MAP[name]
  if (name === 'Goodnotes Hand') return `"Goodnotes Hand", "Bradley Hand", cursive`
  return m ? `"${name}", ${m}` : `"${name}", -apple-system, sans-serif`
}
/** Quick picks shown in the dropdown (Modern / Klassisch / Technisch). */
export const QUICK_FONTS = [
  { label: 'Modern', font: 'Helvetica Neue' },
  { label: 'Klassisch', font: 'Times New Roman' },
  { label: 'Technisch', font: 'Courier New' },
]
