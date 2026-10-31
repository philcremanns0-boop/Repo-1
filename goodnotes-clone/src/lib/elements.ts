/** Built-in objects (vector). Nothing user-made or imported lives here. */
const svg = (inner: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="#1c1c1e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`)}`
export const ELEMENT_CATEGORIES: { id: string; label: string; items: { id: string; label: string; src: string }[] }[] = [
  { id: 'marks', label: 'Markierungen', items: [
    { id: 'check', label: 'Haken', src: svg('<path d="M18 54l22 22 42-48" stroke="#07b97f" stroke-width="9"/>') },
    { id: 'cross', label: 'Kreuz', src: svg('<path d="M22 22l56 56M78 22L22 78" stroke="#e5372e" stroke-width="9"/>') },
    { id: 'star', label: 'Stern', src: svg('<path d="M50 10l12 27 29 3-22 20 7 29-26-15-26 15 7-29L9 40l29-3z" fill="#ffd60a"/>') },
    { id: 'heart', label: 'Herz', src: svg('<path d="M50 88C10 58 14 22 36 22c10 0 14 6 14 6s4-6 14-6c22 0 26 36-14 66z" fill="#ff453a"/>') },
    { id: 'bulb', label: 'Idee', src: svg('<path d="M36 70c0-14-14-18-14-34a28 28 0 0156 0c0 16-14 20-14 34zM38 80h24M42 90h16" fill="#ffe27a"/>') },
    { id: 'excl', label: 'Wichtig', src: svg('<path d="M50 14v46" stroke="#e5372e" stroke-width="12"/><circle cx="50" cy="82" r="6" fill="#e5372e" stroke="none"/>') },
  ] },
  { id: 'arrows', label: 'Pfeile', items: [
    { id: 'arrow-r', label: 'Pfeil', src: svg('<path d="M12 50h72M62 26l24 24-24 24"/>') },
    { id: 'arrow-curve', label: 'Bogen', src: svg('<path d="M16 72C20 30 60 18 82 40M66 36l17 5-3 17"/>') },
    { id: 'arrow-2', label: 'Doppelpfeil', src: svg('<path d="M12 50h76M30 32L12 50l18 18M70 32l18 18-18 18"/>') },
    { id: 'brace', label: 'Klammer', src: svg('<path d="M60 10c-14 0-14 10-14 20v10c0 6-4 10-12 10 8 0 12 4 12 10v10c0 10 0 20 14 20"/>') },
    { id: 'bubble', label: 'Sprechblase', src: svg('<path d="M14 18h72v46H48L30 82V64H14z" fill="#fff"/>') },
    { id: 'cloud', label: 'Wolke', src: svg('<path d="M28 72a16 16 0 010-32 22 22 0 0142-6 18 18 0 0112 38z" fill="#fff"/>') },
  ] },
]
export const ELEMENT_SIZE = 110
