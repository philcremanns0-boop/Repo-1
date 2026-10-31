const sans = 'Helvetica Neue, Helvetica, Arial, sans-serif'
const serif = 'Georgia, "Times New Roman", serif'
const mono = '"Courier New", Courier, monospace'
const script = '"Snell Roundhand", "Brush Script MT", cursive'
const hand = '"Bradley Hand", "Comic Sans MS", cursive'

/** iOS system font names (user-imported fonts are intentionally not part of this list). */
export const FONTS: string[] = [
  'Academy Engraved LET', 'Al Nile', 'American Typewriter', 'Apple SD Gothic Neo', 'Arial', 'Arial Hebrew', 'Arial Rounded MT Bold',
  'Avenir', 'Avenir Next', 'Avenir Next Condensed', 'Baskerville', 'Bodoni 72', 'Bodoni 72 Oldstyle', 'Bodoni 72 Smallcaps', 'Bradley Hand',
  'Chalkboard SE', 'Chalkduster', 'Charter', 'Cochin', 'Copperplate', 'Courier New', 'Damascus', 'Didot', 'DIN Alternate', 'DIN Condensed',
  'Euphemia UCAS', 'Farah', 'Founders Grotesk', 'Founders Grotesk Condensed', 'Founders Grotesk Text', 'Futura', 'Galvji', 'Geeza Pro',
  'Georgia', 'Gill Sans', 'Grantha Sangam MN', 'Helvetica', 'Helvetica Neue', 'Hiragino Maru Gothic ProN', 'Hiragino Mincho ProN',
  'Hiragino Sans', 'Hoefler Text', 'Impact', 'Kailasa', 'Kefa', 'Khmer Sangam MN', 'Kohinoor Bangla', 'Kohinoor Devanagari',
  'Kohinoor Gujarati', 'Kohinoor Telugu', 'Lao Sangam MN', 'Malayalam Sangam MN', 'Marker Felt', 'Menlo', 'Mishafi', 'Mukta Mahee',
  'Myanmar Sangam MN', 'Noteworthy', 'Optima', 'Palatino', 'Papyrus', 'Party LET', 'Rockwell', 'Savoye LET', 'Sinhala Sangam MN',
  'Snell Roundhand', 'STIX Two Text', 'Symbol', 'Tamil Sangam MN', 'Thonburi', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Zapfino',
]
const kind: Record<string, string> = {
  'Academy Engraved LET': serif, 'American Typewriter': mono, Baskerville: serif, 'Bodoni 72': serif, 'Bodoni 72 Oldstyle': serif,
  'Bodoni 72 Smallcaps': serif, 'Bradley Hand': hand, 'Chalkboard SE': hand, Chalkduster: hand, Charter: serif, Cochin: serif,
  'Courier New': mono, Didot: serif, Georgia: serif, 'Hiragino Mincho ProN': serif, 'Hoefler Text': serif, Menlo: mono,
  'Marker Felt': hand, Noteworthy: hand, Palatino: serif, 'Party LET': script, Rockwell: serif, 'Savoye LET': script,
  'Snell Roundhand': script, 'STIX Two Text': serif, 'Times New Roman': serif, Zapfino: script, Papyrus: script, Kefa: serif,
}
export const fontStack = (name: string) => `"${name}", ${kind[name] ?? sans}`
/** Quick picks shown in the dropdown (Modern / Klassisch / Technisch). */
export const QUICK_FONTS = [
  { label: 'Modern', font: 'Helvetica Neue' },
  { label: 'Klassisch', font: 'Times New Roman' },
  { label: 'Technisch', font: 'Courier New' },
]
