// ═══════════════════════════════════════════════════════════════════════════
// Temas de SimPlayer.
//
// Cada entrada solo describe el tema para el modal de ajustes: los colores de
// verdad viven en styles/_simThemes.scss, en la clase .sim-player--<id>. Los
// `swatch` de aquí son la muestra que se pinta en el selector, así que deben
// ir a juego con los tokens del tema (banda, fondo, tarjeta y acento).
//
// Para añadir un tema: bloque nuevo en _simThemes.scss + entrada nueva aquí.
//
// `mascot` es opcional y añade la capa de personalidad: la cortina que tapa el
// salto a la pantalla de batalla, la marca de agua del setup y la carita del
// tema en el selector. Un tema sin `mascot` se comporta exactamente igual que
// antes de que esto existiera — sin cortina, sin marca de agua —, así que
// Ultimix y los demás no cambian ni un pixel.
// ═══════════════════════════════════════════════════════════════════════════

// Dos piezas de arte por mascota:
//
//   still — render oficial de images/POKEMON/<pokedex>.png (215×215). Limpio a
//           tamaño grande; se usa donde hace falta nitidez y quietud.
//   anim  — sprite animado de images/pokemon_anim/<pokedex>.gif (~80×65, pixel
//           art de Blanco/Negro). Se anima solo, así que va donde el
//           movimiento aporta: la cortina y el aviso de turno. Al ampliarlo
//           necesita image-rendering: pixelated o se ve emborronado.
//
// Los gifs vienen de pokemondb.net pero están descargados al repo a propósito:
// las tablets juegan contra el backend por IP local y un enlace remoto se caería
// con la conexión, justo a mitad de partida.
//
// IMPORTS ESTÁTICOS, Y ES IMPORTANTE QUE SIGAN SIÉNDOLO.
//
// Antes esto era `require(`../images/pokemon_anim/${id}.gif`)`. Con un template
// literal webpack no resuelve el archivo: arma un *context module* que enumera
// el directorio entero al compilar. Ese contexto salió vacío
// (`webpackEmptyContext`, cero claves) aunque el gif estuviera en disco, el
// require lanzaba, el catch lo tragaba y la mascota caía al render quieto sin
// que nada avisara. Un import estático se resuelve archivo a archivo, no
// enumera nada, y si falta el archivo el build falla de inmediato en vez de
// degradarse en silencio.
//
// Coste: cada mascota nueva necesita sus dos líneas de import aquí. Barato.
import gengarStill from '../images/POKEMON/0094.png';
import gengarAnim from '../images/pokemon_anim/0094.gif';
import rapidashStill from '../images/POKEMON/0078.png';
import rapidashAnim from '../images/pokemon_anim/0078.gif';
import slowpokeStill from '../images/POKEMON/0079.png';
import slowpokeAnim from '../images/pokemon_anim/0079.gif';
import psyduckStill from '../images/POKEMON/0054.png';
import psyduckAnim from '../images/pokemon_anim/0054.gif';
import togekissStill from '../images/POKEMON/0468.png';
import togekissAnim from '../images/pokemon_anim/0468.gif';

export const SIM_THEMES = [
    {
        id: 'ultimix',
        name: 'Ultimix',
        subtitle: 'El de siempre',
        // Sin clase: los valores de :root ya son esta paleta
        swatch: ['#1a6ec0', '#9ccf98', '#fdfbf4', '#f0d080'],
    },
    {
        id: 'gengar',
        name: 'Gengar',
        subtitle: 'Morado fantasma',
        swatch: ['#6b3fa0', '#7b56ad', '#f8f3fd', '#ef9ad6'],
        mascot: {
            still: gengarStill,
            anim: gengarAnim,
            // Lo que dice la cortina mientras la petición está en vuelo
            label: 'Entrando en la sombra…',
        },
    },
    {
        id: 'rapidash',
        name: 'Rapidash',
        subtitle: 'Fuego y crema',
        swatch: ['#b75b17', '#f2a03c', '#fffaf1', '#ffd257'],
        mascot: {
            still: rapidashStill,
            anim: rapidashAnim,
            label: 'A todo galope…',
        },
    },
    {
        id: 'slowpoke',
        name: 'Slowpoke',
        subtitle: 'Rosa sin prisa',
        swatch: ['#b5566e', '#e79fb0', '#fff8f7', '#ffc09a'],
        mascot: {
            still: slowpokeStill,
            anim: slowpokeAnim,
            // El chiste se cuenta solo: es la pantalla de carga del Pokémon
            // más lento del juego
            label: 'Sin prisa…',
        },
    },
    {
        id: 'psyduck',
        name: 'Psyduck',
        subtitle: 'Amarillo despistado',
        swatch: ['#8f7022', '#ecc957', '#fffdf3', '#ff9e4a'],
        mascot: {
            still: psyduckStill,
            anim: psyduckAnim,
            // Sus dolores de cabeza son justo lo que dispara su poder psiquico
            label: 'Concentrándose…',
        },
    },
    {
        id: 'togekiss',
        name: 'Togekiss',
        subtitle: 'Cielo y nube',
        swatch: ['#586fca', '#a8c4ec', '#fdfeff', '#f59aab'],
        mascot: {
            still: togekissStill,
            anim: togekissAnim,
            label: 'Trayendo suerte…',
        },
    },
];

export const DEFAULT_THEME = 'ultimix';

// El tema por defecto no lleva clase: es lo que ya declara :root
export const themeClass = (id) =>
    id && id !== DEFAULT_THEME ? `sim-player--${id}` : '';

const isKnown = (id) => SIM_THEMES.some(t => t.id === id);

// Devuelve { still, anim, label } o null si el tema no tiene mascota. Quien lo
// consuma debe tratar el null como "sin adornos": es lo que mantiene a Ultimix
// exactamente como estaba.
//
// `anim` puede faltar aunque haya `still`: una mascota sin gif sigue
// funcionando, solo que quieta. Por eso quien quiera el animado debe pedir
// `anim || still` y no dar por hecho que existe.
export const getThemeMascot = (id) =>
    SIM_THEMES.find(t => t.id === id)?.mascot ?? null;

// Por jugador y por dispositivo: cada uno juega en su tablet, así que el tema
// es una preferencia local y no tiene por qué viajar al save del backend.
const storageKey = (playerId) => `ultimix:simTheme:${playerId}`;

export const readTheme = (playerId) => {
    if (!playerId) return DEFAULT_THEME;
    try {
        const saved = window.localStorage.getItem(storageKey(playerId));
        return isKnown(saved) ? saved : DEFAULT_THEME;
    } catch {
        // Safari en modo privado tira al tocar localStorage
        return DEFAULT_THEME;
    }
};

export const writeTheme = (playerId, id) => {
    if (!playerId) return;
    try {
        window.localStorage.setItem(storageKey(playerId), id);
    } catch {
        // Sin persistencia, el tema dura lo que dure la sesión
    }
};
