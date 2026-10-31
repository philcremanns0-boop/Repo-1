/**
 * Text fonts. The names are the iOS system fonts offered by Goodnotes. On Apple devices the real font is used;
 * everywhere else a bundled free look-alike (@fontsource) renders instead, so every entry looks distinct.
 * Files are only downloaded when a font is actually used (unicode-range @font-face).
 */
const SANS = 'sans-serif', SERIF = 'serif', MONO = 'monospace', SCRIPT = 'cursive'
/** iOS name → [web look-alike, generic family] */
const MAP: Record<string, [string, string]> = {
  'Academy Engraved LET': ['IM Fell English SC', SERIF], 'Al Nile': ['Arimo', SANS], 'American Typewriter': ['Special Elite', MONO],
  'Apple SD Gothic Neo': ['Nunito Sans', SANS], Arial: ['Arimo', SANS], 'Arial Hebrew': ['Arimo', SANS], 'Arial Rounded MT Bold': ['Nunito', SANS],
  Avenir: ['Nunito Sans', SANS], 'Avenir Next': ['Nunito Sans', SANS], 'Avenir Next Condensed': ['Barlow Condensed', SANS],
  Baskerville: ['Libre Baskerville', SERIF], 'Bodoni 72': ['Bodoni Moda', SERIF], 'Bodoni 72 Oldstyle': ['Bodoni Moda', SERIF], 'Bodoni 72 Smallcaps': ['Playfair Display SC', SERIF],
  'Bradley Hand': ['Caveat', SCRIPT], 'Chalkboard SE': ['Comic Neue', SCRIPT], Chalkduster: ['Cabin Sketch', SCRIPT], Charter: ['Literata', SERIF],
  Cochin: ['Cormorant', SERIF], Copperplate: ['Cinzel', SERIF], 'Courier New': ['Courier Prime', MONO], Damascus: ['Arimo', SANS], Didot: ['Bodoni Moda', SERIF],
  'DIN Alternate': ['Barlow', SANS], 'DIN Condensed': ['Barlow Condensed', SANS], 'Euphemia UCAS': ['Cabin', SANS], Farah: ['Arimo', SANS],
  'Founders Grotesk': ['Albert Sans', SANS], 'Founders Grotesk Condensed': ['Barlow Condensed', SANS], 'Founders Grotesk Text': ['Albert Sans', SANS],
  Futura: ['Jost', SANS], Galvji: ['Nunito Sans', SANS], 'Geeza Pro': ['Arimo', SANS], Georgia: ['Gelasio', SERIF], 'Gill Sans': ['Cabin', SANS],
  'Goodnotes Hand': ['Caveat', SCRIPT], 'Grantha Sangam MN': ['Arimo', SANS], Helvetica: ['Arimo', SANS], 'Helvetica Neue': ['Arimo', SANS],
  'Hiragino Maru Gothic ProN': ['Nunito', SANS], 'Hiragino Mincho ProN': ['Crimson Pro', SERIF], 'Hiragino Sans': ['Nunito Sans', SANS],
  'Hoefler Text': ['EB Garamond', SERIF], Impact: ['Anton', SANS], Kailasa: ['Arimo', SANS], Kefa: ['Crimson Pro', SERIF], 'Khmer Sangam MN': ['Arimo', SANS],
  'Kohinoor Bangla': ['Fira Sans', SANS], 'Kohinoor Devanagari': ['Fira Sans', SANS], 'Kohinoor Gujarati': ['Fira Sans', SANS], 'Kohinoor Telugu': ['Fira Sans', SANS],
  'Lao Sangam MN': ['Arimo', SANS], 'Malayalam Sangam MN': ['Arimo', SANS], 'Marker Felt': ['Permanent Marker', SCRIPT], Menlo: ['Source Code Pro', MONO],
  Mishafi: ['Arimo', SANS], 'Mukta Mahee': ['Fira Sans', SANS], 'Myanmar Sangam MN': ['Arimo', SANS], Noteworthy: ['Patrick Hand', SCRIPT],
  Optima: ['Belleza', SANS], Palatino: ['Crimson Pro', SERIF], Papyrus: ['Almendra', SERIF], 'Party LET': ['Dancing Script', SCRIPT], Rockwell: ['Roboto Slab', SERIF],
  'Savoye LET': ['Petit Formal Script', SCRIPT], 'Sinhala Sangam MN': ['Arimo', SANS], 'Snell Roundhand': ['Great Vibes', SCRIPT], 'STIX Two Text': ['Crimson Pro', SERIF],
  Symbol: ['Arimo', SANS], 'Tamil Sangam MN': ['Arimo', SANS], Thonburi: ['Nunito Sans', SANS], 'Times New Roman': ['Tinos', SERIF], 'Trebuchet MS': ['Fira Sans', SANS],
  Verdana: ['Open Sans', SANS], 'Zapf Dingbats': ['Arimo', SANS], Zapfino: ['Pinyon Script', SCRIPT],
}
export const FONTS: string[] = Object.keys(MAP).sort((a, b) => a.localeCompare(b))

/** user-imported fonts (registered at runtime from IndexedDB) */
let custom: string[] = []
export const setCustomFonts = (names: string[]) => { custom = names }
export const customFonts = () => custom

export const fontStack = (name: string) => {
  const m = MAP[name]
  if (!m) return `"${name}", "Albert Sans Variable", sans-serif`
  return name === 'Goodnotes Hand' ? `"Goodnotes Hand", "Caveat", cursive` : `"${name}", "${m[0]}", ${m[1]}`
}
/** Quick picks shown in the dropdown (Modern / Klassisch / Technisch). */
export const QUICK_FONTS = [
  { label: 'Modern', font: 'Helvetica Neue' },
  { label: 'Klassisch', font: 'Times New Roman' },
  { label: 'Technisch', font: 'Courier New' },
]
