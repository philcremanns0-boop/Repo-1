// ─────────────────────────────────────────────────────────────
//  Hier alles Persönliche einstellen.
//  Fotos:  einfach Bilder in  src/photos/  legen (jpg/png/webp),
//          sie werden alphabetisch auf die Rahmen verteilt.
//  Video:  eine Datei in  src/media/  (mp4/webm) legen → läuft auf dem Wand-Screen.
// ─────────────────────────────────────────────────────────────
export const CONFIG = {
  lang: 'auto', // 'auto' | 'de' | 'en'
  title: 'Our Museum',
  from: 'Daniel',
  to: 'Emma',

  // Schild am Sockel an der hinteren Wand
  plaque: {
    kicker: 'A GIFT FROM DANIEL',
    title: 'For Emma',
    text: 'A little museum of everything we are —\nand everything still to come.',
    signature: 'Always yours',
  },

  // Mindestdauer des Loading Screens (ms). Er wartet zusätzlich immer,
  // bis wirklich alles geladen & auf der GPU ist.
  minLoadingMs: 3600,

  maxPlayers: 6,
};

// Fotos / Video automatisch aus den Ordnern einsammeln (Vite macht Hash-URLs daraus).
const photoMods = import.meta.glob('./photos/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default',
});
const videoMods = import.meta.glob('./media/*.{mp4,webm,MP4,WEBM}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export const PHOTO_URLS = Object.keys(photoMods)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((k) => photoMods[k]);
export const VIDEO_URL = Object.values(videoMods)[0] || null;
