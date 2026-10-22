// Sprache: Englisch (Standard) oder Spanisch (Chile). Wird im Browser gemerkt.
const DICT = {
  en: {
    from: 'From',
    to: 'To',
    yourName: 'Your name',
    playingAs: 'You will be',
    switchChar: 'switch',
    single: 'Single Player',
    multi: 'Multiplayer',
    create: 'Create a room',
    or: 'or',
    join: 'Join',
    codePlaceholder: 'Room code',
    back: 'Back',
    startHint: 'Music will play. Turn your sound on.',
    preparing: 'Preparing the collection',
    copy: 'Copy link',
    copied: 'Copied',
    leave: 'Leave',
    room: 'Room',
    online: 'online',
    view: 'View',
    back2: 'Step back',
    sit: 'Sit',
    standUp: 'Stand up',
    read: 'Read',
    close: 'Close',
    viewing: 'Viewing',
    reading: 'Reading',
    chatPlaceholder: 'Say something…  (Enter to send)',
    connecting: 'Connecting…',
    creating: 'Creating your room…',
    notFound: 'No room with that code.',
    badCode: 'Enter the 5-character room code.',
    full: 'This room is full.',
    hostLeft: 'The host left the museum.',
    joined: (n) => `${n} joined`,
    left: (n) => `${n} left`,
    netError: 'Could not connect. Check your internet and try again.',
    hintsDesktop: 'WASD move · click the scene for mouse look (Esc frees the mouse) · Shift run · E interact · G dance · H wave · Enter chat',
    hintsTouch: 'Stick to move · drag to look',
    shareText: 'Room code',
    exit: 'Exit',
    backToMuseum: 'Back to the museum',
    music: 'Music',
    prev: 'Previous',
    next: 'Next',
    play: 'Play',
    pause: 'Pause',
    volume: 'Volume',
    no: 'No.',
  },
  es: {
    from: 'De',
    to: 'Para',
    yourName: 'Tu nombre',
    playingAs: 'Vas a ser',
    switchChar: 'cambiar',
    single: 'Un jugador',
    multi: 'Multijugador',
    create: 'Crear una sala',
    or: 'o',
    join: 'Unirse',
    codePlaceholder: 'Código de sala',
    back: 'Volver',
    startHint: 'Va a sonar música. Sube el volumen.',
    preparing: 'Preparando la colección',
    copy: 'Copiar link',
    copied: 'Copiado',
    leave: 'Salir',
    room: 'Sala',
    online: 'conectados',
    view: 'Mirar',
    back2: 'Alejarse',
    sit: 'Sentarse',
    standUp: 'Pararse',
    read: 'Leer',
    close: 'Cerrar',
    viewing: 'Mirando',
    reading: 'Leyendo',
    chatPlaceholder: 'Escribe algo…  (Enter para enviar)',
    connecting: 'Conectando…',
    creating: 'Creando tu sala…',
    notFound: 'No existe una sala con ese código.',
    badCode: 'Ingresa el código de 5 caracteres.',
    full: 'La sala está llena.',
    hostLeft: 'El anfitrión salió del museo.',
    joined: (n) => `${n} entró`,
    left: (n) => `${n} salió`,
    netError: 'No se pudo conectar. Revisa tu internet e inténtalo de nuevo.',
    hintsDesktop: 'WASD caminar · clic en la escena para mirar con el mouse (Esc lo suelta) · Shift correr · E interactuar · G bailar · H saludar · Enter chat',
    hintsTouch: 'Palanca para caminar · arrastra para mirar',
    shareText: 'Código de sala',
    exit: 'Salida',
    backToMuseum: 'Volver al museo',
    music: 'Música',
    prev: 'Anterior',
    next: 'Siguiente',
    play: 'Reproducir',
    pause: 'Pausar',
    volume: 'Volumen',
    no: 'N°',
  },
};

let lang = 'en';
try { const s = localStorage.getItem('museum-lang'); if (s === 'en' || s === 'es') lang = s; } catch { /* privater Modus */ }
const listeners = [];

export const getLang = () => lang;
export const setLang = (l) => {
  if (l !== 'en' && l !== 'es') return;
  lang = l;
  try { localStorage.setItem('museum-lang', l); } catch { /* ignore */ }
  document.documentElement.lang = l === 'es' ? 'es-CL' : 'en';
  listeners.forEach((f) => f(l));
};
export const onLang = (f) => listeners.push(f);

export const t = (key, ...a) => {
  const v = (DICT[lang] && DICT[lang][key]) ?? DICT.en[key] ?? key;
  return typeof v === 'function' ? v(...a) : v;
};
/* Wählt aus {en, es} den aktuellen Text (Strings bleiben unverändert). */
export const pick = (o) => (o && typeof o === 'object' ? o[lang] ?? o.en : o);
