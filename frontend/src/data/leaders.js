// Arte y datos de líderes, compartidos por la pantalla del jugador (SimPlayer)
// y el modal de batalla del máster (ModalBattle), para que ambos muestren al
// mismo entrenador con la misma imagen.

// ── Retratos de líderes ─────────────────────────────────────────────────────
// Van en images/leader_portraits/gen<numero>/ y se aceptan dos nomenclaturas,
// la que resulte más cómoda al guardarlos:
//   1. Por nombre del líder, en minúsculas y sin espacios ni signos:
//      brock.png, misty.png, tateliza.png, crasherwake.png
//   2. Por posición del gimnasio: gym1.png … gym8.png
// Se prueba primero el nombre. Formatos: png, webp o jpg.
// Mientras no exista el archivo, quien llama cae al token de carta de siempre.
const PORTRAIT_EXT = ['png', 'webp', 'jpg'];

// Sin acentos, sin espacios ni signos: "Tate & Liza" → "tateliza"
export const slugLeader = (s) => (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]/g, '');

// El require dinámico lanza cuando el archivo no está, y estas pantallas se
// repintan con cada evento del socket: sin caché serían decenas de throws por render
const portraitCache = {};

export const getLeaderPortrait = (img, name, generation = 1) => {
    const cacheKey = `${generation}|${img}|${name}`;
    if (cacheKey in portraitCache) return portraitCache[cacheKey];

    // gym1_1 → gym1 (el _1/_2 es cuál de sus dos Pokémon, no hace al retrato)
    const candidates = [slugLeader(name), (img || '').replace(/_\d+$/, '')].filter(Boolean);
    let found = null;
    for (const base of candidates) {
        for (const ext of PORTRAIT_EXT) {
            try {
                found = require(`../images/leader_portraits/gen${generation}/${base}.${ext}`);
                break;
            } catch { /* ese nombre no existe, se sigue probando */ }
        }
        if (found) break;
    }
    portraitCache[cacheKey] = found;
    return found;
};

// Token de la carta física del líder (images/Leaders<gen>/gym1_1.png,
// RivPink1.png…). Es el respaldo cuando todavía no hay retrato.
export const getLeaderCardImg = (img, generation = 1) => {
    if (!img) return null;
    try { return require(`../images/Leaders${generation}/${img}.png`); } catch { return null; }
};

// Retrato si lo hay; si no, la carta. Lo que pinta la tarjeta del líder.
export const getLeaderArt = (img, name, generation = 1) => {
    const portrait = getLeaderPortrait(img, name, generation);
    return { src: portrait || getLeaderCardImg(img, generation), isPortrait: !!portrait };
};

// ── Rivales por color de casilla ────────────────────────────────────────────
// Llegan como RivPink1, RivBlue2, …
export const RIVAL_COLORS = {
    Pink:   { hex: '#e91e63', label: 'Rosa' },
    Green:  { hex: '#27ae60', label: 'Verde' },
    Yellow: { hex: '#f1c40f', label: 'Amarillo' },
    Blue:   { hex: '#3498db', label: 'Azul' },
    Red:    { hex: '#e74c3c', label: 'Rojo' },
    Purple: { hex: '#9b59b6', label: 'Morado' },
};

export const getRivalColor = (img) => {
    const match = /^Riv([A-Za-z]+?)\d*$/.exec(img || '');
    return match ? match[1] : null;
};

// Color de la casilla de un rival, o null si no es un rival
export const rivalColorOf = (img) => RIVAL_COLORS[getRivalColor(img)] || null;
