// Eigene Linien-Icons (24x24, currentColor). Regel für dieses Projekt: keine Emojis – nur Icons wie diese.
// Platzhalter im HTML:  <button data-icon="smile"></button>
const S = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

export const ICONS = {
  smile: S('<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1 1.4 2.2 2 3.5 2s2.5-.6 3.5-2"/><path d="M9 9.5v.6M15 9.5v.6"/>'),
  chat: S('<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6.5L8 20.5V17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>'),
  fullscreen: S('<path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"/>'),
  close: S('<path d="M6 6l12 12M18 6L6 18"/>'),
  heart: S('<path d="M12 20.5s-8-4.7-8-10.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 8 2.3c0 5.5-8 10.2-8 10.2z"/>'),
  // Strichfiguren für die Emotes
  wave: S('<circle cx="11" cy="5.5" r="2.2"/><path d="M11 8v7M11 15l-3 6M11 15l3 6M11 10l-3.5 3M11 10l5-4"/><path d="M19 4c1 1 1 2.5 0 3.5M21 2.5c2 2 2 5 0 7"/>'),
  dance: S('<circle cx="12" cy="5" r="2.2"/><path d="M12 7.5l-.5 7M11.5 14.5l-4 6M11.5 14.5l5 2.5l2 3.5M12 9.5L6.5 5.5M12 9.5l5.5-4"/>'),
  clap: S('<circle cx="12" cy="5" r="2.2"/><path d="M12 7.5V15M12 15l-3 6M12 15l3 6M12 10l-3 3.5l3 1.5M12 10l3 3.5l-3 1.5"/><path d="M5 8l1.5 1M19 8l-1.5 1M4 12h2M20 12h-2"/>'),
  bow: S('<circle cx="16.5" cy="9" r="2.2"/><path d="M14.3 10.4L8 12M8 12l-2 8.5M8 12l4 8.5M13 11.4l-1 5"/>'),
  cheer: S('<circle cx="12" cy="6.5" r="2.2"/><path d="M12 9v6M12 15l-3 6M12 15l3 6M12 11L7 4.5M12 11l5-6.5"/><path d="M4 8.5l2 .5M20 8.5l-2 .5M12 2v1.2"/>'),
};
