// ─────────────────────────────────────────────────────────────
//  Hier alles Persönliche einstellen.
//
//  Fotos   →  src/photos/hero.(jpg|png|webp)      großes Bild in der Eingangshalle
//             src/photos/us/*                     Bereich „About us“
//             src/photos/moments/*                Bereich „Moments“ (Erlebnisse)
//  Video   →  src/media/video.mp4                 läuft auf dem Wand-Screen in „Moments“
//  Musik   →  src/media/music/*.mp3               Playlist (alphabetisch)
//  Bücher  →  src/books/*.md                      je eine Datei = ein Buch (siehe README dort)
// ─────────────────────────────────────────────────────────────

export const CONFIG = {
  title: 'Our Museum',
  from: 'Daniel',
  to: 'Emma',

  // Schild in der Eingangshalle
  plaque: {
    en: {
      kicker: 'A GIFT FROM DANIEL',
      title: 'For Emma',
      text: 'A little museum of everything we are,\nand everything still to come.',
      signature: 'Always yours',
    },
    es: {
      kicker: 'UN REGALO DE DANIEL',
      title: 'Para Emma',
      text: 'Un museo chiquitito de todo lo que somos\ny de todo lo que viene.',
      signature: 'Siempre tuyo',
    },
  },

  // Text nach dem Betreten des Exits (Fade → schwarz → Text)
  exitText: { en: 'I love you', es: 'Te quiero' },

  // Bereiche
  sections: {
    us: { title: { en: 'About us', es: 'Nosotros' }, sub: { en: 'The two of us', es: 'Los dos' } },
    moments: { title: { en: 'Moments', es: 'Momentos' }, sub: { en: 'Where we have been', es: 'Dónde hemos estado' } },
    words: { title: { en: 'Words', es: 'Palabras' }, sub: { en: 'Written for you', es: 'Escritas para ti' } },
  },

  // Optionale Bildunterschriften (in der Reihenfolge der Dateien je Bereich).
  // Leer lassen → die Schildchen zeigen „No. 01“, „No. 02“ …
  captions: {
    us: [
      // { title: { en: 'Botanical garden', es: 'Jardín botánico' }, meta: '2025' },
    ],
    moments: [],
  },

  // Mindestdauer des Loading Screens (ms). Er wartet zusätzlich immer,
  // bis wirklich alles geladen & auf der GPU ist.
  minLoadingMs: 3600,

  maxPlayers: 6,
};

// Titel der Songs (Dateiname ohne .mp3 → [Titel, Künstler])
export const MUSIC_TITLES = {
  '01-mia-and-sebastians-theme': ["Mia & Sebastian's Theme", 'Justin Hurwitz'],
  '02-exploration': ['Exploration', 'Bruno Coulais'],
  '03-the-show-must-go-on': ['The Show Must Go On', 'Queen'],
};

/* ───── Ordner automatisch einsammeln (Vite macht Hash-URLs daraus) ───── */
const IMG = '{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}';
const urls = (mods) =>
  Object.keys(mods)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((k) => mods[k]);
const g = (mods) => urls(mods);

export const PHOTO_URLS = {
  hero: g(import.meta.glob('./photos/hero.*', { eager: true, query: '?url', import: 'default' })),
  us: g(import.meta.glob('./photos/us/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', { eager: true, query: '?url', import: 'default' })),
  moments: g(import.meta.glob('./photos/moments/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', { eager: true, query: '?url', import: 'default' })),
};

const videoMods = import.meta.glob('./media/*.{mp4,webm,MP4,WEBM}', { eager: true, query: '?url', import: 'default' });
export const VIDEO_URL = Object.values(videoMods)[0] || null;

const musicMods = import.meta.glob('./media/music/*.{mp3,m4a,ogg,wav}', { eager: true, query: '?url', import: 'default' });
export const MUSIC = Object.keys(musicMods)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((k) => {
    const key = k.split('/').pop().replace(/\.[^.]+$/, '');
    const [title, artist] = MUSIC_TITLES[key] || [key.replace(/^\d+-/, '').replace(/-/g, ' '), ''];
    return { url: musicMods[k], title, artist };
  });

/* ───── Bücher: src/books/*.md ─────
   Format je Datei:
       # Titel (Englisch)
       Text …
       === es
       # Título (Español)
       Texto …
   Der Block nach „=== es“ ist optional (sonst wird Englisch gezeigt). */
const bookMods = import.meta.glob('./books/*.md', { eager: true, query: '?raw', import: 'default' });
const parsePart = (s) => {
  const lines = s.trim().split('\n');
  let title = '';
  if (lines[0] && lines[0].startsWith('# ')) title = lines.shift().slice(2).trim();
  return { title, body: lines.join('\n').trim() };
};
export const BOOKS = Object.keys(bookMods)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((k, i) => {
    const [en, es] = bookMods[k].split(/^=== es\s*$/m);
    const e = parsePart(en);
    const s = es ? parsePart(es) : e;
    return { id: i, en: e, es: { title: s.title || e.title, body: s.body || e.body } };
  });
